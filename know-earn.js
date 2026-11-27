
/* =========================================================
   SHOPY FONT — KNOW & EARN MEMBER MODULE
   Correct file: know-earn.js
   Uses secure RPC: sf_know_earn_submit
   Daily limit: 10 attempts
========================================================= */

(function () {
  "use strict";

  window.SF = window.SF || {};
  const SF = window.SF;

  const PANEL_ID = "sfKnowEarnPanel";
  const DAILY_LIMIT = 10;

  let currentQuestion = null;
  let answeredIds = new Set();
  let attemptsUsed = 0;
  let selectedAnswer = null;
  let busy = false;

  const db = () => {
    if (typeof SF.getClient === "function") return SF.getClient();
    return SF.supabase || window.sfSupabase ||
      window.supabaseClient || window.sb;
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function todayUTC() {
    return new Date().toISOString().slice(0, 10);
  }

  function getPanel() {
    return document.getElementById(PANEL_ID);
  }

  function getOptions(question) {
    return [
      { key: "A", value: question.option_a },
      { key: "B", value: question.option_b },
      { key: "C", value: question.option_c },
      { key: "D", value: question.option_d }
    ];
  }

  function addStyles() {
    if (document.getElementById("sfKnowEarnStyles")) return;

    const style = document.createElement("style");
    style.id = "sfKnowEarnStyles";

    style.textContent = `
      #${PANEL_ID} {
        width:100%;
        max-width:900px;
        margin:0 auto;
      }

      .ke-member {
        max-width:850px;
        margin:0 auto;
        padding:10px;
      }

      .ke-back {
        display:inline-flex;
        align-items:center;
        gap:8px;
        border:1px solid #dce8df;
        border-radius:10px;
        padding:10px 15px;
        margin-bottom:16px;
        background:#fff;
        color:#176b47;
        font-weight:800;
        cursor:pointer;
      }

      .ke-header {
        border-radius:20px;
        padding:24px;
        margin-bottom:18px;
        background:linear-gradient(135deg,#101b30,#087553);
        color:#fff;
      }

      .ke-header h2 {
        margin:0 0 8px;
        font-size:25px;
      }

      .ke-header p {
        margin:0;
        opacity:.9;
        line-height:1.6;
      }

      .ke-progress-card {
        padding:17px;
        border:1px solid #dce9e1;
        border-radius:15px;
        margin-bottom:18px;
        background:#fff;
      }

      .ke-progress-top {
        display:flex;
        justify-content:space-between;
        gap:10px;
        margin-bottom:10px;
        color:#263c30;
      }

      .ke-progress-track {
        height:10px;
        border-radius:20px;
        background:#e5eee8;
        overflow:hidden;
        margin-bottom:8px;
      }

      .ke-progress-fill {
        height:100%;
        background:#087553;
        border-radius:20px;
      }

      .ke-question-card {
        padding:22px;
        border:1px solid #e0eae3;
        border-radius:18px;
        margin-bottom:16px;
        background:#fff;
        box-shadow:0 8px 24px rgba(20,50,35,.04);
      }

      .ke-question-text {
        font-size:19px;
        font-weight:800;
        line-height:1.6;
        margin-bottom:20px;
        color:#182d23;
      }

      .ke-option {
        display:flex;
        align-items:flex-start;
        gap:12px;
        width:100%;
        padding:14px;
        border:1px solid #d6e5dc;
        border-radius:12px;
        background:#fff;
        text-align:left;
        color:#263c30;
        cursor:pointer;
        margin-bottom:10px;
      }

      .ke-option:hover,
      .ke-option.selected {
        border:2px solid #087553;
        background:#eff8f2;
      }

      .ke-option:disabled {
        cursor:not-allowed;
        opacity:.8;
      }

      .ke-letter {
        display:inline-flex;
        min-width:30px;
        height:30px;
        align-items:center;
        justify-content:center;
        border-radius:9px;
        background:#e8f4ec;
        color:#087553;
        font-weight:900;
      }

      .ke-option-text {
        padding-top:4px;
        line-height:1.5;
      }

      .ke-submit,
      .ke-next {
        width:100%;
        border:0;
        padding:15px;
        border-radius:12px;
        background:#087553;
        color:#fff;
        font-weight:900;
        cursor:pointer;
        margin-top:12px;
      }

      .ke-next {
        background:#d6ae60;
        color:#17241c;
      }

      .ke-submit:disabled {
        opacity:.5;
        cursor:not-allowed;
      }

      .ke-result {
        padding:16px;
        margin:16px 0;
        border-radius:13px;
        font-weight:800;
        line-height:1.6;
      }

      .ke-correct {
        background:#e9f8ef;
        border:1px solid #17a366;
        color:#12663e;
      }

      .ke-wrong {
        background:#fff0f0;
        border:1px solid #d46b6b;
        color:#9f2929;
      }

      .ke-message {
        padding:20px;
        text-align:center;
        border:1px solid #dce9e1;
        border-radius:16px;
        line-height:1.7;
        background:#fff;
      }

      .ke-reward {
        font-size:29px;
        color:#087553;
        font-weight:900;
        margin:8px 0;
      }

      @media(max-width:550px) {
        .ke-member { padding:5px; }
        .ke-header { padding:20px; }
        .ke-question-card { padding:15px; }
        .ke-question-text { font-size:17px; }
      }
    `;

    document.head.appendChild(style);
  }

  function mountPanel() {
    let panel = getPanel();
    if (panel) return panel;

    const dashboard = document.getElementById("approvedDashboard") ||
      document.getElementById("dashboardView");

    if (!dashboard) {
      throw new Error("Member dashboard could not be found.");
    }

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.hidden = true;

    dashboard.appendChild(panel);
    return panel;
  }

  function showDashboard() {
    const panel = getPanel();
    const overview = document.getElementById("sfMemberOverview");

    if (panel) panel.hidden = true;
    if (overview) overview.hidden = false;

    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function progressHTML() {
    const percentage = Math.min(
      100,
      (attemptsUsed / DAILY_LIMIT) * 100
    );

    return `
      <div class="ke-progress-card">
        <div class="ke-progress-top">
          <span>Daily attempts</span>
          <strong>${attemptsUsed}/${DAILY_LIMIT}</strong>
        </div>

        <div class="ke-progress-track">
          <div class="ke-progress-fill"
            style="width:${percentage}%"></div>
        </div>

        <small>${DAILY_LIMIT - attemptsUsed} attempts remaining today</small>
      </div>
    `;
  }

  function shellHTML(content) {
    return `
      <div class="ke-member">
        <button type="button" class="ke-back" id="keBack">
          ← Back to dashboard
        </button>

        <div class="ke-header">
          <h2>KNOW &amp; EARN</h2>
          <p>Test your knowledge. Learn something new. Earn USD rewards.</p>
        </div>

        ${content}
      </div>
    `;
  }

  function bindBack() {
    getPanel()?.querySelector("#keBack")
      ?.addEventListener("click", showDashboard);
  }

  function showMessage(title, description) {
    const panel = getPanel();
    if (!panel) return;

    panel.innerHTML = shellHTML(`
      ${progressHTML()}
      <div class="ke-message">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
      </div>
    `);

    bindBack();
  }

  async function loadAttempts() {
    const user = SF.currentUser;
    if (!user) throw new Error("Please sign in first.");

    const client = db();
    if (!client) throw new Error("Supabase connection is unavailable.");

    const { data, error } = await client
      .from("sf_know_earn_attempts")
      .select("question_id,attempt_date")
      .eq("user_id", user.id)
      .eq("attempt_date", todayUTC());

    if (error) throw error;

    const attempts = data || [];
    attemptsUsed = attempts.length;
    answeredIds = new Set(attempts.map(row => row.question_id));
  }

  async function loadQuestion() {
    if (busy) return;

    const panel = getPanel();
    if (!panel) return;

    busy = true;

    panel.innerHTML = shellHTML(
      `<div class="ke-message">Loading your questions...</div>`
    );
    bindBack();

    try {
      await loadAttempts();

      if (attemptsUsed >= DAILY_LIMIT) {
        showMessage(
          "Daily limit reached",
          "You have used all 10 attempts for today. Come back tomorrow."
        );
        busy = false;
        return;
      }

      const { data, error } = await db()
        .from("sf_know_earn_questions")
        .select("id,question,option_a,option_b,option_c,option_d,reward_usd")
        .eq("is_active", true);

      if (error) throw error;

      const available = (data || []).filter(
        q => !answeredIds.has(q.id)
      );

      if (!available.length) {
        showMessage(
          "No new questions available",
          "You have answered all currently published questions. Please check again later."
        );
        busy = false;
        return;
      }

      currentQuestion = available[
        Math.floor(Math.random() * available.length)
      ];

      selectedAnswer = null;
      renderQuestion();

    } catch (error) {
      showMessage(
        "Unable to load questions",
        error.message || "Please try again."
      );
    }

    busy = false;
  }

  function renderQuestion() {
    const panel = getPanel();
    if (!panel || !currentQuestion) return;

    const q = currentQuestion;

    panel.innerHTML = shellHTML(`
      ${progressHTML()}

      <div class="ke-question-card">
        <div class="ke-question-text">
          ${escapeHTML(q.question)}
        </div>

        <div id="keOptions">
          ${getOptions(q).map(option => `
            <button type="button"
              class="ke-option"
              data-ke-option="${option.key}">
              <span class="ke-letter">${option.key}</span>
              <span class="ke-option-text">
                ${escapeHTML(option.value)}
              </span>
            </button>
          `).join("")}
        </div>

        <button id="keSubmit" class="ke-submit" disabled>
          SUBMIT ANSWER
        </button>
      </div>

      <p style="text-align:center;color:#68776d">
        Reward for this question: <strong>${money(q.reward_usd)}</strong>
      </p>
    `);

    bindBack();

    panel.querySelectorAll("[data-ke-option]")
      .forEach(button => {
        button.addEventListener("click", () => {
          if (button.disabled || busy) return;

          selectedAnswer = button.dataset.keOption;

          panel.querySelectorAll("[data-ke-option]")
            .forEach(option => option.classList.remove("selected"));

          button.classList.add("selected");

          const submit = panel.querySelector("#keSubmit");
          if (submit) submit.disabled = false;
        });
      });

    panel.querySelector("#keSubmit")
      ?.addEventListener("click", submitAnswer);
  }

  async function submitAnswer() {
    if (busy || !currentQuestion || !selectedAnswer) return;

    busy = true;

    const panel = getPanel();
    const submit = panel?.querySelector("#keSubmit");

    if (submit) {
      submit.disabled = true;
      submit.textContent = "CHECKING ANSWER...";
    }

    try {
      const { data, error } = await db().rpc(
        "sf_know_earn_submit",
        {
          p_question_id: currentQuestion.id,
          p_selected_option: selectedAnswer
        }
      );

      if (error) throw error;
      if (!data) throw new Error("The server returned no answer result.");

      attemptsUsed = Number(
        data.daily_attempts_used ?? attemptsUsed + 1
      );

      answeredIds.add(currentQuestion.id);

      showResult(data);

    } catch (error) {
      showMessage(
        "Answer could not be submitted",
        error.message || "Please try again."
      );
    }

    busy = false;
  }

  function showResult(data) {
    const panel = getPanel();
    if (!panel) return;

    const correct = !!data.correct;
    const reward = Number(data.reward_usd || 0);

    panel.innerHTML = shellHTML(`
      ${progressHTML()}

      <div class="ke-question-card">

        <div class="ke-result ${correct ? "ke-correct" : "ke-wrong"}">
          ${correct
            ? "Correct answer! Congratulations!"
            : "Incorrect answer. Better luck next time."}
        </div>

        <div class="ke-question-text">
          ${escapeHTML(currentQuestion.question)}
        </div>

        ${getOptions(currentQuestion).map(option => `
          <div class="ke-option ${
            option.key === selectedAnswer ? "selected" : ""
          }">
            <span class="ke-letter">${option.key}</span>
            <span class="ke-option-text">
              ${escapeHTML(option.value)}
            </span>
          </div>
        `).join("")}

        <div class="ke-message">
          <p>Your result</p>

          ${correct
            ? `<div class="ke-reward">+${money(reward)}</div>
               <p>Reward recorded for this correct answer.</p>`
            : `<div class="ke-reward">$0.00</div>
               <p>No reward for this answer.</p>`}

          <p>Attempts used today: ${attemptsUsed}/${DAILY_LIMIT}</p>
        </div>

        <button class="ke-next" id="keNext">
          ${attemptsUsed >= DAILY_LIMIT
            ? "FINISH FOR TODAY"
            : "NEXT QUESTION"}
        </button>

      </div>
    `);

    bindBack();

    panel.querySelector("#keNext")
      ?.addEventListener("click", () => {
        if (attemptsUsed >= DAILY_LIMIT) {
          showMessage(
            "Daily limit reached",
            "You have completed your 10 attempts for today. Come back tomorrow!"
          );
        } else {
          loadQuestion();
        }
      });
  }

  // Called by the member dashboard KNOW & EARN button.
  SF.openKnowEarn = async function () {
    const access = await SF.getMembershipAccess();

    if (!access.fullMember) {
      throw new Error(
        "Approved full SHOPY FONT membership is required."
      );
    }

    addStyles();

    const panel = mountPanel();
    const overview = document.getElementById("sfMemberOverview");

    if (overview) overview.hidden = true;

    panel.hidden = false;

    window.scrollTo({ top:0, behavior:"smooth" });

    await loadQuestion();
  };

  // Compatibility hook for other dashboard scripts.
  SF.loadKnowEarn = loadQuestion;

})();
         
