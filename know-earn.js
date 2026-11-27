
/* =========================================================
   SHOPY FONT — KNOW & EARN MEMBER MODULE
   Independent from the old Trivia system.
   RPC: sf_know_earn_submit
   Daily limit: 10
   Options: A, B, C, D
   No timer
========================================================= */

(function () {
  "use strict";

  const SF = window.SF;
  if (!SF) return;

  const db = () => SF.getClient();
  const PANEL_ID = "sfKnowEarnPanel";
  const DAILY_LIMIT = 10;

  let currentQuestion = null;
  let answeredIds = new Set();
  let attemptsUsed = 0;
  let selectedAnswer = null;
  let busy = false;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
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
          <div class="ke-progress-fill" style="width:${percentage}%"></div>
        </div>

        <small>${DAILY_LIMIT - attemptsUsed} attempts remaining today</small>
      </div>
    `;
  }

  function stylesHTML() {
    return `
      <style>
        .ke-member {
          max-width: 850px;
          margin: 0 auto;
          padding: 10px;
        }

        .ke-header {
          border-radius: 20px;
          padding: 22px;
          margin-bottom: 18px;
          background: linear-gradient(135deg,#064e3b,#087553);
          color: #fff;
        }

        .ke-header h2 {
          margin: 0 0 8px;
          font-size: 24px;
        }

        .ke-header p {
          margin: 0;
          opacity: .88;
        }

        .ke-progress-card {
          padding: 16px;
          border: 1px solid rgba(20,130,90,.25);
          border-radius: 15px;
          margin-bottom: 18px;
          background: rgba(20,130,90,.05);
        }

        .ke-progress-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .ke-progress-track {
          height: 10px;
          border-radius: 20px;
          background: #dce9e2;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .ke-progress-fill {
          height: 100%;
          background: #07885d;
          border-radius: 20px;
          transition: width .25s ease;
        }

        .ke-question-card {
          padding: 20px;
          border: 1px solid rgba(20,130,90,.2);
          border-radius: 18px;
          margin-bottom: 16px;
        }

        .ke-question-text {
          font-size: 19px;
          font-weight: 700;
          line-height: 1.6;
          margin-bottom: 18px;
        }

        .ke-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 14px;
          border: 1px solid #d6e5dc;
          border-radius: 12px;
          background: transparent;
          text-align: left;
          color: inherit;
          cursor: pointer;
          margin-bottom: 10px;
          transition: .15s;
        }

        .ke-option:hover {
          border-color: #07885d;
        }

        .ke-option.selected {
          border: 2px solid #07885d;
          background: rgba(7,136,93,.09);
        }

        .ke-option:disabled {
          cursor: not-allowed;
          opacity: .8;
        }

        .ke-letter {
          display: inline-flex;
          min-width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: rgba(7,136,93,.12);
          color: #07885d;
          font-weight: 800;
        }

        .ke-option-text {
          padding-top: 4px;
          line-height: 1.5;
        }

        .ke-submit {
          width: 100%;
          border: 0;
          padding: 15px;
          border-radius: 12px;
          background: #087553;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          margin-top: 10px;
        }

        .ke-submit:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .ke-next {
          width: 100%;
          border: 0;
          padding: 15px;
          border-radius: 12px;
          background: #d6a83b;
          color: #17241c;
          font-weight: 800;
          cursor: pointer;
          margin-top: 10px;
        }

        .ke-result {
          padding: 16px;
          margin: 16px 0;
          border-radius: 13px;
          font-weight: 700;
          line-height: 1.6;
        }

        .ke-correct {
          background: rgba(16,155,91,.12);
          border: 1px solid #17a366;
        }

        .ke-wrong {
          background: rgba(210,70,70,.09);
          border: 1px solid #d46b6b;
        }

        .ke-message {
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(20,130,90,.2);
          border-radius: 16px;
          line-height: 1.7;
        }

        .ke-reward {
          font-size: 27px;
          color: #07885d;
          font-weight: 900;
          margin: 8px 0;
        }

        @media(max-width:500px) {
          .ke-question-card {
            padding: 14px;
          }

          .ke-question-text {
            font-size: 17px;
          }
        }
      </style>
    `;
  }

  function showMessage(title, description) {
    const panel = getPanel();
    if (!panel) return;

    panel.innerHTML = stylesHTML() + `
      <div class="ke-member">
        <div class="ke-header">
          <h2>KNOW & EARN</h2>
          <p>Knowledge creates opportunity.</p>
        </div>

        ${progressHTML()}

        <div class="ke-message">
          <h3>${escapeHTML(title)}</h3>
          <p>${escapeHTML(description)}</p>
        </div>
      </div>
    `;
  }

  async function loadAttempts() {
    const user = SF.currentUser;

    if (!user) {
      attemptsUsed = 0;
      answeredIds = new Set();
      return;
    }

    const { data, error } = await db()
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
    panel.innerHTML = stylesHTML() + `
      <div class="ke-member">
        <div class="ke-header">
          <h2>KNOW & EARN</h2>
          <p>Loading your questions...</p>
        </div>
      </div>
    `;

    try {
      await loadAttempts();

      if (attemptsUsed >= DAILY_LIMIT) {
        showMessage(
          "Daily limit reached",
          "You have used all 10 attempts for today. Come back tomorrow for more questions."
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
          "You have answered all the currently available questions. New questions will appear when they are published."
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

    panel.innerHTML = stylesHTML() + `
      <div class="ke-member">

        <div class="ke-header">
          <h2>KNOW & EARN</h2>
          <p>Test your knowledge. Earn rewards.</p>
        </div>

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

          <div id="keFeedback"></div>

          <button id="keSubmit" class="ke-submit" disabled>
            SUBMIT ANSWER
          </button>

        </div>

        <p style="text-align:center;opacity:.7">
          Reward for this question: ${money(q.reward_usd)}
        </p>

      </div>
    `;

    panel.querySelectorAll("[data-ke-option]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.disabled) return;

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

    panel.innerHTML = stylesHTML() + `
      <div class="ke-member">

        <div class="ke-header">
          <h2>KNOW & EARN</h2>
          <p>Your answer has been checked.</p>
        </div>

        ${progressHTML()}

        <div class="ke-question-card">

          <div class="ke-result ${correct ? "ke-correct" : "ke-wrong"}">
            ${correct
              ? "Correct answer! Congratulations!"
              : "Incorrect answer. Better luck on the next question."}
          </div>

          <div class="ke-question-text">
            ${escapeHTML(currentQuestion.question)}
          </div>

          ${getOptions(currentQuestion).map(option => `
            <div class="ke-option ${option.key === selectedAnswer ? "selected" : ""}">
              <span class="ke-letter">${option.key}</span>
              <span class="ke-option-text">${escapeHTML(option.value)}</span>
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
      </div>
    `;

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

  // Load when the member opens KNOW & EARN.
  document.addEventListener("click", event => {
    const tab = event.target.closest("[data-task-tab='know-earn']");
    if (!tab) return;

    setTimeout(() => {
      if (getPanel()) loadQuestion();
    }, 100);
  });

  // Public initialization hook for existing dashboard code.
  SF.loadKnowEarn = loadQuestion;

})();
   
