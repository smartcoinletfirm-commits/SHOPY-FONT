
(function () {
    "use strict";

    const MCI = {
        initialized: false,
        observer: null,
        refreshTimer: null,
        busy: false,
        lastRefresh: 0,
        rootId: "money-calendar-root",
        sectionId: "sf-money-calendar-section"
    };

    MCI.getUser = function () {
        return window.SF?.currentUser ||
            window.SF?.user ||
            window.currentUser ||
            null;
    };

    MCI.getClient = function () {
        return window.SF?.getClient?.() ||
            window.supabaseClient ||
            window.supabase ||
            null;
    };

    MCI.getDashboard = function () {
        return document.getElementById("approvedDashboard");
    };

    // Only show the calendar to an actually visible approved dashboard.
    MCI.isApprovedDashboardVisible = function () {
        const dashboard = MCI.getDashboard();

        if (!dashboard) return false;
        if (!MCI.getUser()?.id) return false;
        if (dashboard.classList.contains("hidden")) return false;
        if (dashboard.style.display === "none") return false;

        if (dashboard.offsetWidth === 0 && dashboard.offsetHeight === 0) {
            return false;
        }

        return true;
    };

    MCI.createSection = function () {
        const dashboard = MCI.getDashboard();
        if (!dashboard) return null;

        let section = document.getElementById(MCI.sectionId);

        if (section) return section;

        section = document.createElement("section");
        section.id = MCI.sectionId;
        section.className = "money-calendar-section";

        section.innerHTML = `
            <div class="mc-wrap">
                <div class="mc-panel">
                    <div id="${MCI.rootId}"></div>
                </div>
            </div>
        `;

        dashboard.appendChild(section);

        return section;
    };

    // Load the user's most recent cycle.
    MCI.getLatestCycle = async function (client, userId) {
        const result = await client
            .from("sf_money_calendar_cycles")
            .select("*")
            .eq("user_id", userId)
            .order("cycle_number", { ascending: false })
            .limit(1);

        if (result.error) {
            throw result.error;
        }

        return result.data?.[0] || null;
    };

    // Create the FIRST cycle only.
    // A completed or expired previous cycle must not cause an
    // automatic new cycle.
    MCI.ensureFirstCycle = async function (client, userId) {
        let cycle = await MCI.getLatestCycle(client, userId);

        if (cycle) {
            return cycle;
        }

        const initialization = await client.rpc(
            "sf_money_calendar_initialize_cycle"
        );

        if (initialization.error) {
            throw initialization.error;
        }

        // Fetch the newly created cycle.
        cycle = await MCI.getLatestCycle(client, userId);

        if (!cycle) {
            throw new Error(
                "Cycle initialization succeeded, but the cycle could not be loaded."
            );
        }

        return cycle;
    };

    MCI.loadData = async function () {
        const client = MCI.getClient();
        const user = MCI.getUser();

        if (!client || !user?.id) {
            return {
                cycle: null,
                days: [],
                loan: null
            };
        }

        // Check existing history before creating anything.
        let cycle = await MCI.getLatestCycle(client, user.id);

        // Initialize ONLY if the user has never had a cycle.
        if (!cycle) {
            cycle = await MCI.ensureFirstCycle(client, user.id);
        }

        let days = [];

        if (cycle) {
            const dailyResult = await client
                .from("sf_money_calendar_daily")
                .select("*")
                .eq("cycle_id", cycle.id)
                .eq("user_id", user.id)
                .order("day_number", { ascending: true });

            if (dailyResult.error) {
                throw dailyResult.error;
            }

            days = dailyResult.data || [];
        }

        // Load the user's most recent loan record.
        const loanResult = await client
            .from("sf_money_calendar_loans")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

        if (loanResult.error) {
            throw loanResult.error;
        }

        return {
            cycle: cycle,
            days: days,
            loan: loanResult.data?.[0] || null
        };
    };

    MCI.renderCalendar = async function (force) {
        if (!MCI.isApprovedDashboardVisible()) {
            MCI.hideCalendar();
            return;
        }

        // Prevent overlapping database requests.
        if (MCI.busy) return;

        // Avoid unnecessary refreshes from dashboard DOM mutations.
        const now = Date.now();

        if (!force && now - MCI.lastRefresh < 1500) {
            return;
        }

        MCI.busy = true;
        MCI.lastRefresh = now;

        try {
            const section = MCI.createSection();

            if (!section) return;

            section.style.display = "block";

            const MC = window.SHOPY_MONEY_CALENDAR;

            if (!MC) {
                console.error(
                    "Money Calendar engine is missing. Check money-calendar.js."
                );
                return;
            }

            if (!MC.state.initialized) {
                MC.init({
                    user: MCI.getUser(),
                    supabase: MCI.getClient()
                });
            }

            const data = await MCI.loadData();

            MC.refresh(data);

        } catch (error) {
            console.error("Money Calendar integration error:", error);

            const root = document.getElementById(MCI.rootId);

            if (root) {
                root.innerHTML = `
                    <div class="mc-message warning">
                        Money Calendar could not load your data.
                        Please refresh or try again later.
                    </div>
                `;
            }
        } finally {
            MCI.busy = false;
        }
    };

    MCI.hideCalendar = function () {
        const section = document.getElementById(MCI.sectionId);

        if (section) {
            section.style.display = "none";
        }
    };

    MCI.scheduleRefresh = function () {
        if (MCI.refreshTimer) {
            clearTimeout(MCI.refreshTimer);
        }

        MCI.refreshTimer = setTimeout(function () {
            MCI.renderCalendar(false);
        }, 300);
    };

    MCI.watchDashboard = function () {
        if (MCI.observer) {
            MCI.observer.disconnect();
        }

        MCI.observer = new MutationObserver(function () {
            if (MCI.isApprovedDashboardVisible()) {
                MCI.scheduleRefresh();
            } else {
                MCI.hideCalendar();
            }
        });

        MCI.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });
    };

    MCI.init = function () {
        if (MCI.initialized) return;

        MCI.initialized = true;

        MCI.watchDashboard();

        MCI.renderCalendar(true);
    };

    MCI.refresh = function () {
        MCI.lastRefresh = 0;
        return MCI.renderCalendar(true);
    };

    MCI.destroy = function () {
        if (MCI.observer) {
            MCI.observer.disconnect();
            MCI.observer = null;
        }

        if (MCI.refreshTimer) {
            clearTimeout(MCI.refreshTimer);
            MCI.refreshTimer = null;
        }

        if (window.SHOPY_MONEY_CALENDAR) {
            window.SHOPY_MONEY_CALENDAR.destroy();
        }

        MCI.busy = false;
        MCI.initialized = false;
        MCI.lastRefresh = 0;
    };

    window.SHOPY_MONEY_CALENDAR_INTEGRATION = MCI;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", MCI.init);
    } else {
        MCI.init();
    }

})();
                
