
(function () {
    "use strict";

    const MCI = {
        initialized: false,
        engineInitialized: false,
        observer: null,
        refreshTimer: null,
        busy: false,
        rootId: "money-calendar-root",
        sectionId: "sf-money-calendar-section"
    };

    // ------------------------------
    // USER
    // ------------------------------
    MCI.getUser = function () {
        return window.SF?.currentUser ||
            window.SF?.user ||
            window.currentUser ||
            null;
    };

    // ------------------------------
    // SUPABASE CLIENT
    // ------------------------------
    MCI.getClient = function () {
        return window.SF?.getClient?.() ||
            window.supabaseClient ||
            window.supabase ||
            null;
    };

    // ------------------------------
    // APPROVED DASHBOARD
    // ------------------------------
    MCI.getDashboard = function () {
        return document.getElementById("approvedDashboard");
    };

    MCI.isDashboardVisible = function () {
        const dashboard = MCI.getDashboard();
        const user = MCI.getUser();

        if (!dashboard || !user?.id) return false;

        if (dashboard.classList.contains("hidden")) return false;

        if (dashboard.style.display === "none") return false;

        return dashboard.offsetWidth > 0 ||
            dashboard.offsetHeight > 0;
    };

    // ------------------------------
    // CREATE CALENDAR SECTION
    // ------------------------------
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
                    <div id="${MCI.rootId}">
                        <div class="mc-message">
                            Loading Money Calendar...
                        </div>
                    </div>
                </div>
            </div>
        `;

        dashboard.appendChild(section);

        return section;
    };

    // ------------------------------
    // LOAD LATEST CYCLE
    // ------------------------------
    MCI.loadCycle = async function (client, userId) {
        const result = await client
            .from("sf_money_calendar_cycles")
            .select("*")
            .eq("user_id", userId)
            .order("cycle_number", { ascending: false })
            .limit(1);

        if (result.error) {
            throw new Error(
                "Cycle loading failed: " + result.error.message
            );
        }

        return result.data?.[0] || null;
    };

    // ------------------------------
    // INITIALIZE FIRST CYCLE ONLY
    // ------------------------------
    MCI.initializeFirstCycle = async function (client) {
        const result = await client.rpc(
            "sf_money_calendar_initialize_cycle"
        );

        if (result.error) {
            throw new Error(
                "Cycle initialization failed: " +
                result.error.message
            );
        }

        return result.data;
    };

    // ------------------------------
    // LOAD DAILY RECORDS
    // ------------------------------
    MCI.loadDays = async function (client, userId, cycleId) {
        if (!cycleId) return [];

        const result = await client
            .from("sf_money_calendar_daily")
            .select("*")
            .eq("user_id", userId)
            .eq("cycle_id", cycleId)
            .order("day_number", { ascending: true });

        if (result.error) {
            throw new Error(
                "Daily records loading failed: " +
                result.error.message
            );
        }

        return result.data || [];
    };

    // ------------------------------
    // LOAD LOAN (OPTIONAL)
    // ------------------------------
    MCI.loadLoan = async function (client, userId) {
        try {
            const result = await client
                .from("sf_money_calendar_loans")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (result.error) {
                console.warn(
                    "Money Calendar loan loading warning:",
                    result.error.message
                );

                return null;
            }

            return result.data?.[0] || null;

        } catch (error) {
            console.warn(
                "Money Calendar loan loading warning:",
                error
            );

            return null;
        }
    };

    // ------------------------------
    // LOAD ALL CALENDAR DATA
    // ------------------------------
    MCI.loadData = async function () {
        const client = MCI.getClient();
        const user = MCI.getUser();

        if (!client) {
            throw new Error("Supabase client not found.");
        }

        if (!user?.id) {
            throw new Error("Logged-in user could not be identified.");
        }

        let cycle = await MCI.loadCycle(client, user.id);

        // Create a first cycle only when no history exists.
        if (!cycle) {
            await MCI.initializeFirstCycle(client);

            cycle = await MCI.loadCycle(client, user.id);
        }

        if (!cycle) {
            throw new Error(
                "No Money Calendar cycle could be found or created."
            );
        }

        const days = await MCI.loadDays(
            client,
            user.id,
            cycle.id
        );

        const loan = await MCI.loadLoan(
            client,
            user.id
        );

        return {
            cycle: cycle,
            days: days,
            loan: loan
        };
    };

    // ------------------------------
    // SHOW ERROR
    // ------------------------------
    MCI.showError = function (error) {
        const root = document.getElementById(MCI.rootId);

        if (!root) return;

        const message = String(
            error?.message ||
            error ||
            "Unknown error"
        );

        root.innerHTML = "";

        const box = document.createElement("div");
        box.className = "mc-message warning";
        box.style.padding = "16px";

        const heading = document.createElement("strong");
        heading.textContent = "Money Calendar could not load";

        const details = document.createElement("p");
        details.textContent = message;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Retry";

        button.onclick = function () {
            MCI.refresh();
        };

        box.appendChild(heading);
        box.appendChild(details);
        box.appendChild(button);

        root.appendChild(box);
    };

    // ------------------------------
    // RENDER CALENDAR
    // ------------------------------
    MCI.renderCalendar = async function () {
        if (MCI.busy) return;

        if (!MCI.isDashboardVisible()) {
            MCI.hideCalendar();
            return;
        }

        MCI.busy = true;

        try {
            const section = MCI.createSection();

            if (!section) {
                throw new Error(
                    "Approved dashboard container was not found."
                );
            }

            section.style.display = "block";

            const MC = window.SHOPY_MONEY_CALENDAR;

            if (!MC) {
                throw new Error(
                    "Money Calendar engine not found. Check money-calendar.js."
                );
            }

            const client = MCI.getClient();
            const user = MCI.getUser();

            if (!client) {
                throw new Error(
                    "Supabase client is unavailable."
                );
            }

            if (!user?.id) {
                throw new Error(
                    "Your login session could not be identified."
                );
            }

            // Initialize the engine using its correct parameters.
            if (!MCI.engineInitialized) {
                await MC.init({
                    supabase: client,
                    user: user
                });

                MCI.engineInitialized = true;
            }

            // Load database data.
            const data = await MCI.loadData();

            // Update the calendar UI.
            if (typeof MC.refresh === "function") {
                MC.refresh(data);
            } else {
                throw new Error(
                    "Money Calendar refresh function is missing."
                );
            }

        } catch (error) {
            console.error(
                "Money Calendar integration error:",
                error
            );

            MCI.showError(error);

        } finally {
            MCI.busy = false;
        }
    };

    // ------------------------------
    // HIDE CALENDAR
    // ------------------------------
    MCI.hideCalendar = function () {
        const section = document.getElementById(MCI.sectionId);

        if (section) {
            section.style.display = "none";
        }
    };

    // ------------------------------
    // SCHEDULE REFRESH
    // ------------------------------
    MCI.scheduleRefresh = function () {
        if (MCI.refreshTimer) {
            clearTimeout(MCI.refreshTimer);
        }

        MCI.refreshTimer = setTimeout(function () {
            MCI.renderCalendar();
        }, 500);
    };

    // ------------------------------
    // WATCH DASHBOARD
    // ------------------------------
    MCI.watchDashboard = function () {
        if (MCI.observer) {
            MCI.observer.disconnect();
        }

        MCI.observer = new MutationObserver(function () {
            if (MCI.isDashboardVisible()) {
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

    // ------------------------------
    // INIT
    // ------------------------------
    MCI.init = function () {
        if (MCI.initialized) return;

        MCI.initialized = true;

        MCI.watchDashboard();

        MCI.renderCalendar();
    };

    // ------------------------------
    // MANUAL REFRESH
    // ------------------------------
    MCI.refresh = function () {
        return MCI.renderCalendar();
    };

    // ------------------------------
    // DESTROY
    // ------------------------------
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

        MCI.initialized = false;
        MCI.engineInitialized = false;
        MCI.busy = false;
    };

    // ------------------------------
    // GLOBAL ACCESS
    // ------------------------------
    window.SHOPY_MONEY_CALENDAR_INTEGRATION = MCI;

    // ------------------------------
    // START
    // ------------------------------
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            MCI.init
        );
    } else {
        MCI.init();
    }

})();
                
