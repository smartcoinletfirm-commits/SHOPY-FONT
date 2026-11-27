/* =========================================================
   SHOPY FONT — MONEY CALENDAR
   Corrected Frontend Engine
   10-day cycle | $43.90 target
========================================================= */

(function () {
    "use strict";

    window.SHOPY_MONEY_CALENDAR = window.SHOPY_MONEY_CALENDAR || {};

    const MC = window.SHOPY_MONEY_CALENDAR;

    MC.config = {
        cycleDays: 10,
        targetReward: 43.90,
        dailyReward: 4.39,
        referralsRequired: 2,
        tasksRequired: 5,
        calendarVisitsRequired: 2,
        loanAmount: 17.00
    };

    MC.state = {
        user: null,
        supabase: null,
        cycle: null,
        days: [],
        loan: null,
        initialized: false,
        chart: null
    };

    // -----------------------------
    // HELPERS
    // -----------------------------

    MC.money = function (amount) {
        return "$" + Number(amount || 0).toFixed(2);
    };

    MC.escapeHTML = function (value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    };

    MC.percent = function (value, target) {
        if (!target || target <= 0) return 0;
        return Math.min(100, Math.max(0, (value / target) * 100));
    };

    MC.getReferralLink = function () {
        const input = document.querySelector("#sfDashboardReferralLink");

        if (input && input.value) return input.value;

        const element = document.querySelector("[data-referral-link]");

        if (element) {
            return element.value || element.textContent || "";
        }

        return "";
    };

    // -----------------------------
    // NORMALIZE DATABASE DAY
    // -----------------------------
    MC.normalizeDay = function (day) {
        if (!day) return null;

        return {
            ...day,

            referrals_completed: Number(
                day.referrals_completed || 0
            ),

            tasks_completed: Number(
                day.tasks_completed || 0
            ),

            // FIX: database uses calendar_visits_completed
            calendar_visits_completed: Number(
                day.calendar_visits_completed ??
                day.calendar_visits ??
                0
            ),

            reward_usd: Number(day.reward_usd || 0),

            qualified: day.qualified === true,

            failed_requirements: Array.isArray(day.failed_requirements)
                ? day.failed_requirements
                : []
        };
    };

    MC.getDayStatus = function (day) {
        if (!day) return "pending";

        const normalized = MC.normalizeDay(day);

        if (
            normalized.qualified === true ||
            normalized.status === "qualified" ||
            normalized.status === "completed"
        ) {
            return "qualified";
        }

        if (
            normalized.status === "failed" ||
            normalized.status === "expired"
        ) {
            return "failed";
        }

        const referrals =
            normalized.referrals_completed;

        const tasks =
            normalized.tasks_completed;

        const visits =
            normalized.calendar_visits_completed;

        if (
            referrals >= MC.config.referralsRequired &&
            tasks >= MC.config.tasksRequired &&
            visits >= MC.config.calendarVisitsRequired
        ) {
            return "qualified";
        }

        return "pending";
    };

    // -----------------------------
    // CYCLE PROGRESS
    // -----------------------------
    MC.getCycleProgress = function () {
        const days = MC.state.days || [];

        const qualified = days.filter(function (day) {
            return MC.getDayStatus(day) === "qualified";
        }).length;

        return {
            qualifiedDays: qualified,
            totalDays: MC.config.cycleDays,
            percentage: Math.min(
                100,
                (qualified / MC.config.cycleDays) * 100
            )
        };
    };

    // This is a qualification target estimate, not a wallet credit.
    MC.getQualifiedRewardTarget = function () {
        return MC.getCycleProgress().qualifiedDays *
            MC.config.dailyReward;
    };

    MC.getExtensions = function () {
        return Number(
            MC.state.cycle?.extension_days ||
            MC.state.cycle?.extensionDays ||
            0
        );
    };

    // -----------------------------
    // MESSAGE
    // -----------------------------
    MC.showMessage = function (message, type) {
        const target = document.getElementById("mcMessage");

        if (!target) return;

        target.className = "mc-message " + (type || "");
        target.textContent = message;
        target.classList.remove("mc-hidden");
    };

    // -----------------------------
    // DAY DATA
    // -----------------------------
    MC.createDay = function (dayNumber) {
        const existing = MC.state.days.find(function (day) {
            return Number(day.day_number) === dayNumber;
        });

        if (existing) return MC.normalizeDay(existing);

        return MC.normalizeDay({
            day_number: dayNumber,
            referrals_completed: 0,
            tasks_completed: 0,
            calendar_visits_completed: 0,
            reward_usd: 0,
            qualified: false,
            status: "pending",
            failed_requirements: []
        });
    };

    // -----------------------------
    // RENDER ONE DAY
    // -----------------------------
    MC.renderDay = function (dayNumber) {
        const day = MC.createDay(dayNumber);
        const status = MC.getDayStatus(day);

        const referrals = day.referrals_completed;
        const tasks = day.tasks_completed;
        const visits = day.calendar_visits_completed;

        const className = [
            "mc-day",
            status === "qualified" ? "is-qualified" : "",
            status === "failed" ? "is-failed" : ""
        ].filter(Boolean).join(" ");

        let statusText = "Pending";
        let statusClass = "";

        if (status === "qualified") {
            statusText = "Qualified";
            statusClass = "success";
        } else if (status === "failed") {
            statusText = "Failed";
            statusClass = "failed";
        }

        function activityStatus(done, required) {
            return done >= required
                ? '<span class="mc-check">✓ Complete</span>'
                : '<span class="mc-pending">' + done + "/" + required + "</span>";
        }

        const outstanding = day.failed_requirements.length
            ? `<div class="mc-message warning">
                Outstanding activities:
                ${MC.escapeHTML(day.failed_requirements.join(", "))}
               </div>`
            : "";

        return `
            <div class="${className}">
                <div class="mc-day-top">
                    <div class="mc-day-title">Day ${dayNumber}</div>
                    <span class="mc-day-status ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                <div class="mc-requirements">
                    <div class="mc-requirement">
                        <span>👥 Referrals</span>
                        <span class="mc-requirement-value">
                            ${activityStatus(referrals, MC.config.referralsRequired)}
                        </span>
                    </div>

                    <div class="mc-requirement">
                        <span>✅ Tasks</span>
                        <span class="mc-requirement-value">
                            ${activityStatus(tasks, MC.config.tasksRequired)}
                        </span>
                    </div>

                    <div class="mc-requirement">
                        <span>📅 Calendar visits</span>
                        <span class="mc-requirement-value">
                            ${activityStatus(visits, MC.config.calendarVisitsRequired)}
                        </span>
                    </div>
                </div>

                <hr class="mc-divider">

                <div class="mc-requirement">
                    <span>Daily reward target</span>
                    <span class="mc-requirement-value">
                        ${MC.money(status === "qualified" ? MC.config.dailyReward : 0)}
                    </span>
                </div>

                ${outstanding}
            </div>
        `;
    };

    // -----------------------------
    // LOAN DISPLAY
    // -----------------------------
    MC.renderLoan = function () {
        const loan = MC.state.loan;

        const eligible = MC.state.cycle &&
            MC.state.cycle.status === "completed" &&
            MC.getExtensions() === 0;

        if (!loan) {
            return `
                <div class="mc-loan-card">
                    <div class="mc-heading">
                        <h3>💳 Must Repay Loan</h3>
                    </div>

                    <div class="mc-loan-amount">
                        ${MC.money(MC.config.loanAmount)}
                    </div>

                    <div class="mc-loan-status">
                        ${
                            eligible
                            ? "Your cycle may qualify you for a loan request."
                            : "Complete your first cycle perfectly to unlock loan eligibility."
                        }
                    </div>

                    <div class="mc-warning-box" style="margin-top:14px">
                        This loan must be repaid. Loan requests are subject
                        to review and approval. Eligibility is not automatic.
                    </div>

                    <button class="mc-button mc-button-gold"
                        id="mcRequestLoan"
                        ${eligible ? "" : "disabled"}>
                        Request $17 Loan
                    </button>
                </div>
            `;
        }

        const amount = Number(
            loan.amount_usd || MC.config.loanAmount
        );

        const repaid = Number(loan.amount_repaid || 0);

        const outstanding = Math.max(0, amount - repaid);

        const progress = amount > 0
            ? Math.min(100, (repaid / amount) * 100)
            : 0;

        return `
            <div class="mc-loan-card">
                <div class="mc-heading">
                    <h3>💳 Must Repay Loan</h3>
                    <span class="mc-tag">
                        ${MC.escapeHTML(loan.status || "Requested")}
                    </span>
                </div>

                <div class="mc-loan-amount">
                    ${MC.money(amount)}
                </div>

                <div class="mc-loan-status">
                    Amount repaid: ${MC.money(repaid)}
                </div>

                <div class="mc-loan-progress">
                    <div class="mc-loan-progress-fill"
                        style="width:${progress}%"></div>
                </div>

                <div class="mc-progress-caption">
                    <span>${progress.toFixed(1)}% repaid</span>
                    <span>${MC.money(outstanding)} remaining</span>
                </div>

                <div class="mc-warning-box" style="margin-top:14px">
                    You are responsible for repaying the outstanding loan.
                    ${
                        loan.due_at
                        ? "Due date: " +
                          MC.escapeHTML(new Date(loan.due_at).toLocaleDateString())
                        : ""
                    }
                </div>
            </div>
        `;
    };

    // -----------------------------
    // RENDER CALENDAR
    // -----------------------------
    MC.render = function () {
        const root = document.getElementById("money-calendar-root");

        if (!root) return;

        const cycle = MC.state.cycle;
        const days = MC.state.days || [];

        if (!cycle) {
            root.innerHTML = `
                <div class="mc-wrap">
                    <div class="mc-panel">
                        <div class="mc-heading">
                            <div>
                                <h2>📅 Money Calendar</h2>
                                <div class="mc-subtitle">
                                    Your 10-day activity cycle
                                </div>
                            </div>
                        </div>

                        <div class="mc-empty">
                            <h3>No cycle available</h3>
                            <p>
                                Your Money Calendar cycle will appear here
                                when it becomes available.
                            </p>
                        </div>
                    </div>

                    <div class="mc-panel">
                        ${MC.renderLoan()}
                    </div>
                </div>
            `;

            return;
        }

        const progress = MC.getCycleProgress();

        const qualifiedTarget = MC.getQualifiedRewardTarget();

        const extensions = MC.getExtensions();

        const calendarHTML = Array.from(
            { length: MC.config.cycleDays },
            function (_, index) {
                return MC.renderDay(index + 1);
            }
        ).join("");

        root.innerHTML = `
            <div class="mc-wrap">

                <div class="mc-panel">
                    <div class="mc-heading">
                        <div>
                            <h2>📅 Money Calendar</h2>
                            <div class="mc-subtitle">
                                10-day activity and reward cycle
                            </div>
                        </div>

                        <span class="mc-tag">
                            ${MC.escapeHTML(cycle.status || "Active")}
                        </span>
                    </div>

                    <div class="mc-target">
                        <div class="mc-target-label">
                            Cycle reward target
                        </div>

                        <div class="mc-target-amount">
                            ${MC.money(MC.config.targetReward)}
                        </div>

                        <div class="mc-target-meta">
                            <span>10 days</span>
                            <span>•</span>
                            <span>${MC.money(MC.config.dailyReward)} per qualified day</span>
                        </div>

                        <div class="mc-progress-track">
                <div class="mc-progress-fill"
                    style="width:${progress.percentage}%"></div>
            </div>

            <div class="mc-progress-caption">
                <span>${progress.qualifiedDays}/10 qualified days</span>
                <span>${progress.percentage.toFixed(0)}%</span>
            </div>
        </div>

        <div class="mc-stats-grid">
            <div class="mc-stat">
                <div class="mc-stat-label">Qualified reward target</div>
                <div class="mc-stat-value">${MC.money(qualifiedTarget)}</div>
                <div class="mc-stat-note">Not wallet credited</div>
            </div>

            <div class="mc-stat">
                <div class="mc-stat-label">Remaining target</div>
                <div class="mc-stat-value">
                    ${MC.money(Math.max(0, MC.config.targetReward - qualifiedTarget))}
                </div>
                <div class="mc-stat-note">Qualification target</div>
            </div>

            <div class="mc-stat">
                <div class="mc-stat-label">Qualified days</div>
                <div class="mc-stat-value">
                    ${progress.qualifiedDays}/10
                </div>
                <div class="mc-stat-note">Verified daily activity</div>
            </div>

            <div class="mc-stat">
                <div class="mc-stat-label">Extension days</div>
                <div class="mc-stat-value">${extensions}</div>
                <div class="mc-stat-note">Cycle adjustments</div>
            </div>
        </div>

        <div id="mcMessage" class="mc-message mc-hidden"></div>

        <div class="mc-heading">
            <h3>Your 10-Day Calendar</h3>
        </div>

        <div class="mc-calendar-grid">
            ${calendarHTML}
        </div>

        <div class="mc-warning-box" style="margin-top:16px">
            Daily activity requirements:
            <strong>2 referrals + 5 tasks + 2 calendar visits.</strong>
            Activities must be verified. Displayed reward targets do not
            mean money has been credited to your wallet.
        </div>
    </div>

    <div class="mc-panel">
        <div class="mc-heading">
            <div>
                <h3>📊 Cycle Performance</h3>
                <div class="mc-subtitle">
                    Analyze your daily qualification progress
                </div>
            </div>
        </div>

        <div class="mc-chart-container">
            <canvas id="mcRewardChart"></canvas>
        </div>
    </div>

    <div class="mc-panel">
        <div class="mc-heading">
            <h3>👥 Referral Growth Guide</h3>
        </div>

        <div class="mc-activity-list">
            <div class="mc-activity-item">
                <div class="mc-activity-title">Daily target: 2 referrals</div>
                <div class="mc-activity-description">
                    Share your official referral link and invite new
                    members to join SHOPY FONT.
                </div>
            </div>

            <div class="mc-activity-item">
                <div class="mc-activity-title">Build consistently</div>
                <div class="mc-activity-description">
                    Explain the platform clearly and help your referrals
                    understand the activities.
                </div>
            </div>

            <div class="mc-activity-item">
                <div class="mc-activity-title">Your referral link</div>
                <div class="mc-activity-description">
                    ${
                        MC.getReferralLink()
                        ? MC.escapeHTML(MC.getReferralLink())
                        : "Your referral link will appear in your dashboard."
                    }
                </div>
            </div>

            <button class="mc-button mc-button-secondary"
                id="mcShareReferral">
                Share Referral Link
            </button>
        </div>
    </div>

    <div class="mc-panel">
        ${MC.renderLoan()}
    </div>

    <div class="mc-panel">
        <div class="mc-heading">
            <h3>💰 Cycle Actions</h3>
        </div>

        <div class="mc-warning-box">
            Withdrawal and next-cycle requests will be available
            after cycle completion and backend verification.
        </div>

        <button class="mc-button mc-button-primary"
            id="mcRequestWithdrawal"
            ${cycle.status === "completed" ? "" : "disabled"}>
            Request Cycle Withdrawal
        </button>

        <button class="mc-button mc-button-secondary"
            id="mcStartNextCycle"
            ${cycle.status === "completed" ? "" : "disabled"}>
            Request Next 10-Day Cycle
        </button>

        <p class="mc-small">
            Rewards, withdrawals, cycle extensions, and loan approvals
            are subject to verified activity and platform review.
        </p>
    </div>

    </div>
    `;

                MC.renderChart();
        MC.bindEvents();
    };

    // -----------------------------
    // CHART
    // -----------------------------
    MC.renderChart = function () {
        const canvas = document.getElementById("mcRewardChart");

        if (!canvas || !window.Chart) return;

        if (MC.state.chart) {
            MC.state.chart.destroy();
            MC.state.chart = null;
        }

        const days = MC.state.days || [];

        const labels = Array.from(
            { length: MC.config.cycleDays },
            function (_, index) {
                return "Day " + (index + 1);
            }
        );

        const values = labels.map(function (_, index) {
            const day = days.find(function (item) {
                return Number(item.day_number) === index + 1;
            });

            return day && MC.getDayStatus(day) === "qualified"
                ? MC.config.dailyReward
                : 0;
        });

        MC.state.chart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Qualified reward target (USD)",
                    data: values,
                    borderRadius: 6,
                    backgroundColor: "#10b981"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: "#d1d5db"
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: "#9ca3af"
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            color: "#9ca3af"
                        },
                        grid: {
                            color: "rgba(255,255,255,.07)"
                        }
                    }
                }
            }
        });
    };

    // -----------------------------
    // EVENTS
    // -----------------------------
    MC.bindEvents = function () {
        const root = document.getElementById("money-calendar-root");

        if (!root) return;

        const shareButton = root.querySelector("#mcShareReferral");

        if (shareButton) {
            shareButton.onclick = async function () {
                const link = MC.getReferralLink();

                if (!link) {
                    MC.showMessage(
                        "Referral link is not available yet.",
                        "warning"
                    );
                    return;
                }

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: "SHOPY FONT",
                            text: "Join SHOPY FONT — The World Connected Through Opportunity",
                            url: link
                        });
                    } catch (_) {}
                } else if (navigator.clipboard) {
                    try {
                        await navigator.clipboard.writeText(link);
                        MC.showMessage(
                            "Referral link copied.",
                            "success"
                        );
                    } catch (_) {
                        MC.showMessage(
                            "Could not copy the referral link.",
                            "warning"
                        );
                    }
                }
            };
        }

        const withdrawalButton =
            root.querySelector("#mcRequestWithdrawal");

        if (withdrawalButton) {
            withdrawalButton.onclick = function () {
                MC.showMessage(
                    "Withdrawal processing is not yet connected to the verified backend.",
                    "warning"
                );
            };
        }

        const nextCycleButton =
            root.querySelector("#mcStartNextCycle");

        if (nextCycleButton) {
            nextCycleButton.onclick = function () {
                MC.showMessage(
                    "Next-cycle requests are not yet connected to the backend.",
                    "warning"
                );
            };
        }

        const loanButton = root.querySelector("#mcRequestLoan");

        if (loanButton) {
            loanButton.onclick = function () {
                MC.showMessage(
                    "Loan requests are not yet connected to the backend.",
                    "warning"
                );
            };
        }
    };

    // -----------------------------
    // INITIALIZE
    // -----------------------------
    MC.init = function (options) {
        options = options || {};

        MC.state.user =
            options.user ||
            window.SF?.currentUser ||
            window.SF?.user ||
            null;

        MC.state.supabase =
            options.supabase ||
            window.SF?.getClient?.() ||
            window.supabaseClient ||
            window.supabase ||
            null;

        MC.render();

        MC.state.initialized = true;
    };

    // -----------------------------
    // REFRESH DATA
    // -----------------------------
    MC.refresh = function (data) {
        data = data || {};

        MC.state.cycle = data.cycle || null;

        MC.state.days = Array.isArray(data.days)
            ? data.days.map(MC.normalizeDay)
            : [];

        MC.state.loan = data.loan || null;

        MC.render();
    };

    // -----------------------------
    // DESTROY
    // -----------------------------
    MC.destroy = function () {
        if (MC.state.chart) {
            MC.state.chart.destroy();
            MC.state.chart = null;
        }

        MC.state.initialized = false;
    };

})();
