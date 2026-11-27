(function () {
    "use strict";

    const MCI = {
        initialized: false,
        observer: null,
        retryTimer: null,
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
        return document.getElementById("approvedDashboard") ||
            document.querySelector(".approved-dashboard") ||
            document.querySelector("[data-dashboard='approved']");
    };

    MCI.isLoggedIn = function () {
        const user = MCI.getUser();
        return !!(user && user.id);
    };

    MCI.createSection = function () {
        if (document.getElementById(MCI.sectionId)) {
            return document.getElementById(MCI.sectionId);
        }

        const dashboard = MCI.getDashboard();
        if (!dashboard) return null;

        const section = document.createElement("section");
        section.id = MCI.sectionId;
        section.className = "money-calendar-section";
        section.style.display = "none";

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

        try {
            const cycleResult = await client
                .from("sf_money_calendar_cycles")
                .select("*")
                .eq("user_id", user.id)
                .eq("status", "active")
                .order("cycle_number", { ascending: false })
                .limit(1);

            if (cycleResult.error) {
                console.error(
                    "Money Calendar cycle error:",
                    cycleResult.error
                );
            }

            const cycle = cycleResult.data?.[0] || null;

            if (!cycle) {
                return {
                    cycle: null,
                    days: [],
                    loan: null
                };
            }

            const dailyResult = await client
                .from("sf_money_calendar_daily")
                .select("*")
                .eq("cycle_id", cycle.id)
                .eq("user_id", user.id)
                .order("day_number", { ascending: true });

            if (dailyResult.error) {
                console.error(
                    "Money Calendar daily error:",
                    dailyResult.error
                );
            }

            const loanResult = await client
                .from("sf_money_calendar_loans")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            if (loanResult.error) {
                console.error(
                    "Money Calendar loan error:",
                    loanResult.error
                );
            }

            return {
                cycle: cycle,
                days: dailyResult.data || [],
                loan: loanResult.data?.[0] || null
            };

        } catch (error) {
            console.error("Money Calendar loading failed:", error);

            return {
                cycle: null,
                days: [],
                loan: null
            };
        }
    };

    MCI.renderCalendar = async function () {
        if (!MCI.isLoggedIn()) return;

        const section = MCI.createSection();
        if (!section) return;

        section.style.display = "block";

        if (!window.SHOPY_MONEY_CALENDAR) {
            console.error(
                "SHOPY_MONEY_CALENDAR is not loaded. Check money-calendar.js."
            );
            return;
        }

        const MC = window.SHOPY_MONEY_CALENDAR;

        if (!MC.state.initialized) {
            MC.init({
                user: MCI.getUser(),
                supabase: MCI.getClient()
            });
        }

        const data = await MCI.loadData();

        MC.refresh(data);
    };

    MCI.refresh = async function () {
        return MCI.renderCalendar();
    };

    MCI.hideCalendar = function () {
        const section = document.getElementById(MCI.sectionId);

        if (section) {
            section.style.display = "none";
        }
    };

    MCI.watchDashboard = function () {
        if (MCI.observer) {
            MCI.observer.disconnect();
        }

        MCI.observer = new MutationObserver(function () {
            if (MCI.isLoggedIn() && MCI.getDashboard()) {
                MCI.renderCalendar();
            }
        });

        MCI.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    MCI.init = function () {
        if (MCI.initialized) return;

        MCI.initialized = true;

        MCI.watchDashboard();

        MCI.retryTimer = setInterval(function () {
            if (MCI.isLoggedIn() && MCI.getDashboard()) {
                MCI.renderCalendar();
            }
        }, 2500);

        MCI.renderCalendar();
    };

    MCI.destroy = function () {
        if (MCI.observer) {
            MCI.observer.disconnect();
            MCI.observer = null;
        }

        if (MCI.retryTimer) {
            clearInterval(MCI.retryTimer);
            MCI.retryTimer = null;
        }

        if (window.SHOPY_MONEY_CALENDAR) {
            window.SHOPY_MONEY_CALENDAR.destroy();
        }

        MCI.initialized = false;
    };

    window.SHOPY_MONEY_CALENDAR_INTEGRATION = MCI;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", MCI.init);
    } else {
        MCI.init();
    }

})();

