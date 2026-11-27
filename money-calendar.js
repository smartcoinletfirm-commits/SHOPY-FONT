
/* ==========================================================
   SHOPY FONT — MONEY CALENDAR
   10-Day Reward Cycle | Activity | Analytics | Loan
   ========================================================== */

(() => {
  "use strict";

  const MoneyCalendar = {
    target: 43.90,
    dailyTarget: 4.39,
    cycleDays: 10,
    referralsTarget: 2,
    tasksTarget: 5,
    visitsTarget: 2,

    supabase: null,
    user: null,
    cycle: null,
    days: [],
    loan: null,

    async init({ supabase, user }) {
      this.supabase = supabase;
      this.user = user;

      this.render();
      await this.load();
      this.bind();
    },

    async load() {
      if (!this.supabase || !this.user) return;

      try {
        const { data: cycles } = await this.supabase
          .from("sf_money_calendar_cycles")
          .select("*")
          .eq("user_id", this.user.id)
          .order("cycle_number", { ascending: false })
          .limit(1);

        this.cycle = cycles?.[0] || null;

        if (this.cycle) {
          const { data: days } = await this.supabase
            .from("sf_money_calendar_daily")
            .select("*")
            .eq("cycle_id", this.cycle.id)
            .order("day_number");

          this.days = days || [];
        }

        const { data: loan } = await this.supabase
          .from("sf_money_calendar_loans")
          .select("*")
          .eq("user_id", this.user.id)
          .maybeSingle();

        this.loan = loan || null;
      } catch (error) {
        console.error("Money Calendar loading error:", error);
      }

      this.render();
      this.bind();
    },

    money(value) {
      return "$" + Number(value || 0).toFixed(2);
    },

    percent(value, target) {
      if (!target) return 0;
      return Math.min(100, Math.max(0, (value / target) * 100));
    },

    render() {
      const root = document.getElementById("money-calendar-root");
      if (!root) return;

      const earned = Number(this.cycle?.earned_reward_usd || 0);
      const progress = this.percent(earned, this.target);
      const completedDays = this.days.filter(d => d.daily_qualified).length;

      root.innerHTML = `
        <section class="mc-wrap">

          <header class="mc-header">
            <div class="mc-eyebrow">SHOPY FONT • PERFORMANCE PROGRAM</div>
            <h1>Money Calendar</h1>
            <p>Build consistency. Complete activities. Track your progress.</p>
          </header>

          <div class="mc-reward-card">
            <div class="mc-card-top">
              <div>
                <small>10-DAY REWARD TARGET</small>
                <h2>$43.90</h2>
              </div>
              <div class="mc-target-icon">↗</div>
            </div>

            <div class="mc-earned-row">
              <span>Verified progress</span>
              <strong>${this.money(earned)}</strong>
            </div>

            <div class="mc-progress-track">
              <div class="mc-progress-fill" style="width:${progress}%"></div>
            </div>

            <div class="mc-progress-foot">
              <span>${progress.toFixed(1)}% completed</span>
              <span>${this.money(Math.max(0, this.target-earned))} remaining</span>
            </div>

            <div class="mc-reward-note">
              Rewards are activity-dependent and subject to verification
              and applicable program terms.
            </div>
          </div>

          <div class="mc-stats">
            <div class="mc-stat">
              <small>Qualified days</small>
              <strong>${completedDays}/10</strong>
            </div>
            <div class="mc-stat">
              <small>Cycle</small>
              <strong>${this.cycle?.cycle_number || 0}</strong>
            </div>
            <div class="mc-stat">
              <small>Extensions</small>
              <strong>${this.cycle?.extension_days || 0}</strong>
            </div>
          </div>

          <div class="mc-section">
            <div class="mc-section-heading">
              <h2>Daily Activity Calendar</h2>
              <span>10 days</span>
            </div>

            <div class="mc-calendar">
              ${Array.from({ length: 10 }, (_, i) => {
                const day = this.days.find(d => Number(d.day_number) === i + 1);
                const status = day?.daily_qualified
                  ? "qualified"
                  : day?.status === "failed"
                    ? "failed"
                    : day
                      ? "active"
                      : "locked";

                return `
                  <div class="mc-day ${status}" data-day="${i+1}">
                    <span class="mc-day-number">DAY ${i+1}</span>
                    <span class="mc-day-icon">
                      ${status === "qualified" ? "✓" :
                        status === "failed" ? "!" :
                        status === "active" ? "◷" : "·"}
                    </span>
                    <span class="mc-day-value">
                      ${day?.daily_qualified ? "$4.39" : "—"}
                    </span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="mc-section">
            <div class="mc-section-heading">
              <h2>Today's Activity</h2>
              <span>Daily targets</span>
            </div>

            <div class="mc-activity-list">
              ${this.activityRow("referrals", "Invite new members", "2 referrals", 2)}
              ${this.activityRow("tasks", "Complete tasks", "5 tasks", 5)}
              ${this.activityRow("visits", "Check Money Calendar", "2 visits", 2)}
            </div>
          </div>

          <div class="mc-section">
            <div class="mc-section-heading">
              <h2>Performance Analytics</h2>
            </div>

            <div class="mc-graph-card">
              <canvas id="mc-reward-chart"></canvas>
            </div>

            <div class="mc-analytics-grid">
              <div>
                <small>Activity completion</small>
                <strong>${completedDays * 10}%</strong>
              </div>
              <div>
                <small>Average/day</small>
                <strong>${this.money(earned / Math.max(1, completedDays))}</strong>
              </div>
              <div>
                <small>Target remaining</small>
                <strong>${this.money(Math.max(0, this.target - earned))}</strong>
              </div>
              <div>
                <small>Cycle target</small>
                <strong>$43.90</strong>
              </div>
            </div>
          </div>

          <div class="mc-section mc-growth">
            <div class="mc-section-heading">
              <h2>Referral Growth Centre</h2>
              <span>Grow your network</span>
            </div>

            <div class="mc-growth-item">
              <strong>01 · Share your referral link</strong>
              <p>Share your invitation with friends, classmates and people interested in digital opportunities.</p>
            </div>

            <div class="mc-growth-item">
              <strong>02 · Use WhatsApp</strong>
              <p>Share useful information in your status and relevant groups. Avoid spamming people.</p>
            </div>

            <div class="mc-growth-item">
              <strong>03 · Use Facebook</strong>
              <p>Make informative posts explaining the platform and how registration works.</p>
            </div>

            <div class="mc-growth-item">
              <strong>04 · Follow up</strong>
              <p>Answer questions and help interested people understand the requirements.</p>
            </div>

            <button class="mc-btn mc-secondary" id="mc-share-btn">
              Share Referral Link
            </button>
          </div>

          <div class="mc-section mc-cycle-section">
            <div class="mc-section-heading">
              <h2>Reward Cycle</h2>
            </div>

            <div class="mc-cycle-status">
              <strong>${this.cycle?.status || "Not started"}</strong>
              <p>
                Complete your activity requirements and have your
                results verified to finish the cycle.
              </p>
            </div>

            <button
              class="mc-btn mc-primary"
              id="mc-start-btn"
              ${this.cycle?.status === "active" ? "disabled" : ""}
            >
              ${this.cycle ? "Request Next Cycle" : "Start 10-Day Cycle"}
            </button>

            <button class="mc-btn mc-secondary" id="mc-withdraw-btn">
              Request Withdrawal
            </button>
          </div>

          <div class="mc-section mc-loan">
            <div class="mc-loan-header">
              <div>
                <small>FINANCIAL RESPONSIBILITY</small>
                <h2>Must Repay Loan</h2>
              </div>
              <div class="mc-loan-icon">$17</div>
            </div>

            <p>
              Members who successfully complete their first cycle with
              all 10 days qualified and no extensions may become
              eligible to request a $17 loan.
            </p>

            ${this.renderLoan()}

            <div class="mc-loan-warning">
              This is a repayable loan, not a reward. Approval,
              disbursement and repayment are subject to review and terms.
            </div>
          </div>

        </section>
      `;

      this.drawGraph();
    },

    activityRow(type, title, target, goal) {
      const day = this.days.find(d => {
        return d.activity_date === new Date().toISOString().slice(0,10);
      });

      const amount = type === "referrals"
        ? day?.referrals_completed || 0
        : type === "tasks"
          ? day?.tasks_completed || 0
          : day?.calendar_visits_completed || 0;

      const pct = this.percent(amount, goal);

      return `
        <div class="mc-activity">
          <div class="mc-activity-top">
            <div>
              <strong>${title}</strong>
              <small>Target: ${target}</small>
            </div>
            <span>${amount}/${goal}</span>
          </div>
          <div class="mc-mini-track">
            <div style="width:${pct}%"></div>
          </div>
        </div>
      `;
    },

    renderLoan() {
      if (!this.loan) {
        return `
          <div class="mc-loan-status">
            <strong>No loan record</strong>
            <p>Complete your first cycle to check eligibility.</p>
          </div>
          <button class="mc-btn mc-secondary" id="mc-loan-btn">
            Check Loan Eligibility
          </button>
        `;
      }

      const outstanding = Number(this.loan.outstanding_usd || 0);
      const paid = Number(this.loan.amount_repaid_usd || 0);

      return `
        <div class="mc-loan-stats">
          <div><small>Loan</small><strong>$17.00</strong></div>
          <div><small>Repaid</small><strong>${this.money(paid)}</strong></div>
          <div><small>Outstanding</small><strong>${this.money(outstanding)}</strong></div>
        </div>

        <div class="mc-mini-track">
          <div style="width:${this.percent(paid, 17)}%"></div>
        </div>

        <p class="mc-loan-state">
          Status: ${this.loan.status.replace(/_/g, " ")}
        </p>

        <button class="mc-btn mc-secondary" id="mc-loan-btn">
          ${this.loan.status === "repaid"
            ? "Loan Repaid"
            : "View Loan Details"}
        </button>
      `;
    },

    drawGraph() {
      const canvas = document.getElementById("mc-reward-chart");
      if (!canvas) return;

      const labels = Array.from({ length: 10 }, (_, i) => `Day ${i+1}`);
      const data = labels.map((_, i) => {
        const day = this.days.find(d => Number(d.day_number) === i+1);
        return Number(day?.reward_usd || 0);
      });

      if (typeof Chart === "undefined") {
        canvas.parentElement.innerHTML = `
          <div class="mc-graph-fallback">
            <p>Daily reward progression</p>
            ${data.map((v, i) => `
              <div class="mc-bar-row">
                <span>Day ${i+1}</span>
                <div class="mc-bar">
                  <div style="width:${this.percent(v, 4.39)}%"></div>
                </div>
                <strong>${this.money(v)}</strong>
              </div>
            `).join("")}
          </div>
        `;
        return;
      }

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Daily Reward USD",
            data,
            borderWidth: 3,
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 4.39
            }
          }
        }
      });
    },

    bind() {
      document.getElementById("mc-start-btn")
        ?.addEventListener("click", () => this.startCycle());

      document.getElementById("mc-share-btn")
        ?.addEventListener("click", () => this.shareReferral());

      document.getElementById("mc-withdraw-btn")
        ?.addEventListener("click", () => this.withdraw());

      document.getElementById("mc-loan-btn")
        ?.addEventListener("click", () => this.requestLoan());
    },

    async startCycle() {
      if (!this.supabase) return;

      const btn = document.getElementById("mc-start-btn");
      if (btn) btn.disabled = true;

      const { data, error } = await this.supabase.rpc(
        "sf_money_calendar_start_cycle"
      );

      if (error) {
        alert(error.message);
      } else {
        alert("Your cycle request has been submitted.");
        await this.load();
      }

      if (btn) btn.disabled = false;
    },

    async requestLoan() {
      if (!this.supabase) return;

      const confirmed = confirm(
        "You are requesting a repayable $17 loan. " +
        "This loan must be repaid. Continue?"
      );

      if (!confirmed) return;

      const { error } = await this.supabase.rpc(
        "sf_money_calendar_request_loan"
      );

      if (error) {
        alert(error.message);
      } else {
        alert("Loan request submitted for review.");
        await this.load();
      }
    },

    async shareReferral() {
      const link = document.querySelector("[data-referral-link]")?.value
        || document.querySelector("[data-referral-link]")?.textContent
        || window.location.origin;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "SHOPY FONT",
            text: "Join me on SHOPY FONT.",
            url: link
          });
        } catch (_) {}
      } else {
        await navigator.clipboard.writeText(link);
        alert("Referral link copied.");
      }
    },

    async withdraw() {
      alert(
        "Withdrawal requests will be connected to the SHOPY FONT " +
        "withdrawal system in the next integration step."
      );
    }
  };

  window.SHOPY_MONEY_CALENDAR = MoneyCalendar;
})();
                
