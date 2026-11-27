
/* =========================================================
   SHOPY FONT — MONEY CALENDAR
   Frontend module
   10-day activity cycle | $43.90 target | $17 loan
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

    MC.percent = function (earned, target) {
        if (!target || target <= 0) return 0;
        return Math.min(100, Math.max(0, (earned / target) * 100));
    };

    MC.getToday = function () {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    };

    MC.getDayStatus = function (day) {
        if (!day) return "pending";

        if (day.status === "qualified" || day.status === "completed") {
            return "qualified";
        }

        if (day.status === "failed" || day.status === "expired") {
            return "failed";
        }

        if (
            Number(day.referrals_completed || 0) >= MC.config.referralsRequired &&
            Number(day.tasks_completed || 0) >= MC.config.tasksRequired &&
            Number(day.calendar_visits || 0) >= MC.config.calendarVisitsRequired
        ) {
            return "qualified";
        }

        return "pending";
    };

    MC.getCycleProgress = function () {
        const days = MC.state.days || [];
        const qualified = days.filter(function (day) {
            return MC.getDayStatus(day) === "qualified";
        }).length;

        return {
            qualifiedDays: qualified,
            totalDays: MC.config.cycleDays,
            percentage: Math.min(100, (qualified / MC.config.cycleDays) * 100)
        };
    };

    MC.getEarned = function () {
        const days = MC.state.days || [];

        return days.reduce(function (total, day) {
            if (MC.getDayStatus(day) === "qualified") {
                return total + Number(day.reward_usd || MC.config.dailyReward);
            }
            return total;
        }, 0);
    };

    MC.getExtensions = function () {
        return Number(
            MC.state.cycle?.extension_days ||
            MC.state.cycle?.extensionDays ||
            0
        );
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

    MC.showMessage = function (message, type) {
        const target = document.getElementById("mcMessage");
        if (!target) return;

        target.className = "mc-message " + (type || "");
        target.textContent = message;
        target.classList.remove("mc-hidden");
    };

    MC.createDay = function (dayNumber) {
        const existing = MC.state.days.find(function (day) {
            return Number(day.day_number) === dayNumber;
        });

        if (existing) return existing;

        return {
            day_number: dayNumber,
            referrals_completed: 0,
            tasks_completed: 0,
            calendar_visits: 0,
            reward_usd: 0,
            status: "pending"
        };
    };

    MC.renderDay = function (dayNumber) {
        const day = MC.createDay(dayNumber);
        const status = MC.getDayStatus(day);

        const referrals = Number(day.referrals_completed || 0);
        const tasks = Number(day.tasks_completed || 0);
        const visits = Number(day.calendar_visits || 0);

        const referralOK = referrals >= MC.config.referralsRequired;
        const tasksOK = tasks >= MC.config.tasksRequired;
        const visitsOK = visits >= MC.config.calendarVisitsRequired;

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

        const activityStatus = function (done, required) {
            return done >= required
                ? '<span class="mc-check">✓ Complete</span>'
                : '<span class="mc-pending">' + done + "/" + required + "</span>";
        };

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
                    <span>Daily reward</span>
                    <span class="mc-requirement-value">
                        ${MC.money(status === "qualified" ? (day.reward_usd || MC.config.dailyReward) : 0)}
                    </span>
                </div>

                ${
                    day.failed_requirements && day.failed_requirements.length
                    ? `<div class="mc-message warning">
                        Outstanding activities:
                        ${MC.escapeHTML(day.failed_requirements.join(", "))}
                       </div>`
                    : ""
                }
            </div>
        `;
    };

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
                        This loan must be repaid. Loan requests are subject to review
                        and approval. Eligibility is not automatic disbursement.
                    </div>

                    <button class="mc-button mc-button-gold"
                        id="mcRequestLoan"
                        ${eligible ? "" : "disabled"}>
                        Request $17 Loan
                    </button>
                </div>
            `;
        }

        const amount = Number(loan.amount_usd || MC.config.loanAmount);
        const repaid = Number(loan.amount_repaid || 0);
        const outstanding = Math.max(0, amount - repaid);
        const progress = amount > 0 ? Math.min(100, (repaid / amount) * 100) : 0;

        return `
            <div class="mc-loan-card">
                <div class="mc-heading">
                    <h3>💳 Must Repay Loan</h3>
                    <span class="mc-tag">
                        ${MC.escapeHTML(loan.status || "Requested")}
                    </span>
                </div>

                <div class="mc-loan-amount">${MC.money(amount)}</div>

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
                    ${loan.due_at ? "Due date: " + MC.escapeHTML(new Date(loan.due_at).toLocaleDateString()) : ""}
                </div>
            </div>
        `;
    };

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
                            <h3>No active cycle</h3>
                            <p>
                                Your 10-day cycle will appear here after
                                your cycle request is approved.
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
        const earned = MC.getEarned();
        const rewardPercent = MC.percent(earned, MC.config.targetReward);
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
                    <div class="mc-stat-label">Reward earned</div>
                    <div class="mc-stat-value">${MC.money(earned)}</div>
                    <div class="mc-stat-note">Cycle progress</div>
                </div>

                <div class="mc-stat">
                    <div class="mc-stat-label">Remaining target</div>
                    <div class="mc-stat-value">
                        ${MC.money(Math.max(0, MC.config.targetReward - earned))}
                    </div>
                    <div class="mc-stat-note">To cycle target</div>
                </div>

                <div class="mc-stat">
                    <div class="mc-stat-label">Qualified days</div>
                    <div class="mc-stat-value">
                        ${progress.qualifiedDays}/10
                    </div>
                    <div class="mc-stat-note">Daily activity completed</div>
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
                Activities must be verified according to platform rules.
                Missing activities may affect cycle eligibility and duration.
            </div>

            </div>

            <div class="mc-panel">
                <div class="mc-heading">
                    <div>
                        <h3>📊 Cycle Performance</h3>
                        <div class="mc-subtitle">
                            Analyze your daily reward progress
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
                            Focus on explaining the platform clearly and helping
                            your referrals understand the activities.
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
                    Withdrawal and new cycle requests will be available
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
                    Reward eligibility, withdrawals, cycle extensions, and
                    loan approvals are subject to verified activity and
                    platform review.
                </p>
            </div>

            </div>
        `;

        MC.renderChart();
        MC.bindEvents();
    };

    MC.renderChart = function () {
        const canvas = document.getElementById("mcRewardChart");
        if (!canvas || !window.Chart) return;

        if (MC.state.chart) {
            MC.state.chart.destroy();
        }

        const days = MC.state.days || [];

        const labels = Array.from(
            { length: MC.config.cycleDays },
            function (_, i) {
                return "Day " + (i + 1);
            }
        );

        const values = labels.map(function (_, i) {
            const day = days.find(function (d) {
                return Number(d.day_number) === i + 1;
            });

            return day && MC.getDayStatus(day) === "qualified"
                ? Number(day.reward_usd || MC.config.dailyReward)
                : 0;
        });

        MC.state.chart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: labels,
                dataset
