
/* ==========================================================
   SHOPY FONT — KNOW & EARN
   Independent member interface
   4 choices | USD rewards | 10 daily questions | No timer
   ========================================================== */

(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const db = () => window.SF.getClient();

  const DAILY_LIMIT = 10;
  const LETTERS = ["A", "B", "C", "D"];

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

  let currentQuestion = null;
  let selectedAnswer = null;
  let busy = false;

  const css = `
    #sfKnowEarnPanel {
      margin:22px 0;
      padding:22px;
      background:linear-gradient(145deg,#ffffff,#f3f8f4);
      border:1px solid #dce9df;
      border-radius:24px;
      color:#163d2b;
      box-shadow:0 15px 40px rgba(12,45,30,.07);
    }

    #sfKnowEarnPanel * {
      box-sizing:border-box;
    }

    .ke-header {
      display:flex;
      justify-content:space-between;
      align-items:center;
      flex-wrap:wrap;
      gap:14px;
    }

    .ke-kicker {
      color:#b28a44;
      font-size:10px;
      font-weight:900;
      letter-spacing:2px;
    }

    .ke-header h2 {
      font-size:27px;
      font-weight:900;
      margin:8px 0;
      color:#123d29;
    }

    .ke-header p {
      color:#687a70;
      line-height:1.6;
      margin:0;
    }

    .ke-count {
      background:#fff;
      border:1px solid #dce8df;
      border-radius:30px;
      padding:11px 15px;
      font-weight:900;
      color:#17633d;
      font-size:12px;
    }

    .ke-progress {
      height:9px;
      border-radius:30px;
      background:#e3ece5;
      overflow:hidden;
      margin:22px 0;
    }

    .ke-progress-fill {
      height:100%;
      width:0%;
      background:linear-gradient(90deg,#147b4b,#38b778);
      border-radius:30px;
      transition:width .3s ease;
    }

    .ke-question-box {
      padding:20px;
      border-radius:20px;
      background:#fff;
      border:1px solid #e0eae2;
    }

    .ke-question-title {
      display:flex;
      gap:13px;
      align-items:flex-start;
      margin-bottom:20px;
    }

    .ke-number {
      display:grid;
      place-items:center;
      min-width:45px;
      height:45px;
      border-radius:14px;
      background:#14432e;
      color:#f2d89d;
      font-size:16px;
      font-weight:900;
    }

    .ke-question-text {
      font-size:18px;
      font-weight:900;
      line-height:1.6;
      color:#163d2b;
      margin:5px 0;
    }

    .ke-options {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
    }

    .ke-option {
      display:flex;
      align-items:center;
      gap:12px;
      text-align:left;
      min-height:62px;
      padding:12px;
      border:1px solid #dce7de;
      border-radius:15px;
      background:#fff;
      color:#244333;
      cursor:pointer;
      font-size:14px;
      transition:.2s;
    }

    .ke-option:hover {
      background:#f2faf4;
      border-color:#438765;
    }

    .ke-option.selected {
      background:#eaf7ef;
      border:2px solid #18804e;
      color:#155b37;
    }

    .ke-option:disabled {
      cursor:default;
      opacity:1;
    }

    .ke-letter {
      display:grid;
      place-items:center;
      min-width:34px;
      height:34px;
      border-radius:10px;
      background:#edf3ee;
      color:#386349;
      font-weight:900;
    }

    .ke-option.selected .ke-letter {
      background:#16804f;
      color:white;
    }

    .ke-submit {
      width:100%;
      margin-top:18px;
      padding:15px;
      border:0;
      border-radius:14px;
      background:linear-gradient(135deg,#188052,#10432d);
      color:#fff;
      font-weight:900;
      cursor:pointer;
    }

    .ke-submit:disabled {
      background:#aebdb2;
      cursor:not-allowed;
    }

    .ke-reward {
      margin-top:16px;
      padding:13px;
      border-radius:13px;
      background:#fffdf6;
      border:1px solid #eee4cc;
      color:#8a6b35;
      font-size:13px;
      font-weight:800;
    }

    .ke-feedback {
      margin-top:17px;
      padding:16px;
      border-radius:15px;
      font-size:14px;
      line-height:1.7;
    }

    .ke-success {
      background:#e9f8ee;
      border:1px solid #bce4c8;
      color:#16623a;
    }

    .ke-error {
      background:#fff0f0;
      border:1px solid #efc1c1;
      color:#a02f2f;
    }

    .ke-feedback strong {
      display:block;
      font-size:17px;
      margin-bottom:5px;
    }

    .ke-next {
      width:100%;
      margin-top:14px;
      padding:15px;
      border:0;
      border-radius:13px;
      background:#174d34;
      color:#fff;
      font-weight:900;
      cursor:pointer;
    }

    .ke-empty {
      padding:30px 16px;
      text-align:center;
      border-radius:17px;
      background:#f5f9f5;
      color:#66776b;
    }

    .ke-empty strong {
      display:block;
      font-size:18px;
      color:#17432e;
      margin-bottom:8px;
    }

    .ke-note {
      margin-top:14px;
      font-size:12px;
      color:#7a887e;
      line-height:1.6;
    }

    @media(max-width:600px) {
      #sfKnowEarnPanel {
        padding:15px;
      }

      .ke-options {
        grid-template-columns:1fr;
      }

      .ke-question-box {
        padding:13px;
      }

      .ke-question-text {
        font-size:16px;
      }
    }
  `;

  function installStyles() {
    if ($("sfKnowEarnStyles")) return;

    const style = document.createElement("style");
    style.id = "sfKnowEarnStyles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function installPanel() {
    const root = $("tasksView");
    if (!root || $("sfKnowEarnPanel")) return;

    const tabs = root.querySelector(".sf-task-tabs");
    if (!tabs) return;

    if (!tabs.querySelector('[data-task-tab="know-earn"]')) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "sf-task-tab";
      tab.dataset.taskTab = "know-earn";
      tab.textContent = "KNOW & EARN";
      tabs.appendChild(tab);
    }

    const panel = document.createElement("section");
    panel.id = "sfKnowEarnPanel";
    panel.className = "hidden";

    panel.innerHTML = `
      <div class="ke-header">
        <div>
          <span class="ke-kicker">THINK · LEARN · EARN</span>
          <h2>KNOW & EARN</h2>
          <p>Answer correctly and earn USD rewards.</p>
        </div>

        <div class="ke-count" id="keCount">
          0 / ${DAILY_LIMIT} TODAY
        </div>
      </div>

      <div class="ke-progress">
        <div class="ke-progress-fill" id="keProgress"></div>
      </div>

      <div id="keContent">
        <div class="ke-empty">
          <strong>Preparing your questions...</strong>
          Please wait.
        </div>
      </div>
    `;

    tabs.insertAdjacentElement("afterend", panel);
  }

  function updateProgress(count) {
    const safeCount = Math.min(count, DAILY_LIMIT);

    if ($("keCount")) {
      $("keCount").textContent =
        safeCount + " / " + DAILY_LIMIT + " TODAY";
    }

    if ($("keProgress")) {
      $("keProgress").style.width =
        (safeCount / DAILY_LIMIT * 100) + "%";
    }
  }

  function showEmpty(title, message, retry = false) {
    const content = $("keContent");
    if (!content) return;

    content.innerHTML = `
      <div class="ke-empty">
        <strong>${esc(title)}</strong>
        <p>${esc(message)}</p>
        ${retry ? `
          <button class="ke-next" id="keRetry">
            TRY AGAIN
          </button>
        ` : ""}
      </div>
    `;

    if (retry) {
      $("keRetry")?.addEventListener("click", loadQuestion);
    }
  }

  /*
   * The backend tables and RPC will be connected after the
   * KNOW & EARN database setup is installed.
   * This intentionally does not call the old Trivia RPC.
   */

  async function loadQuestion() {
    currentQuestion = null;
    selectedAnswer = null;
    busy = false;

    showEmpty(
      "KNOW & EARN is being prepared",
      "The new question system is awaiting backend setup."
    );

    updateProgress(0);
  }

  function renderQuestion(question, count) {
    currentQuestion = question;
    selectedAnswer = null;

    const options = Array.isArray(question.options)
      ? question.options
      : [];

    if (options.length !== 4) {
      showEmpty(
        "Question unavailable",
        "This question must have exactly four answer choices."
      );
      return;
    }

    const content = $("keContent");

    content.innerHTML = `
      <div class="ke-question-box">

        <div class="ke-question-title">
          <span class="ke-number">
            ${String(count + 1).padStart(2, "0")}
          </span>

          <div>
            <span class="ke-kicker">
              QUESTION ${count + 1} OF ${DAILY_LIMIT}
            </span>

            <p class="ke-question-text">
              ${esc(question.question)}
            </p>
          </div>
        </div>

        <div class="ke-options">
          ${options.map((option, index) => `
            <button type="button"
              class="ke-option"
              data-ke-option="${index}">
              <span class="ke-letter">
                ${LETTERS[index]}
              </span>
              <span>${esc(option)}</span>
            </button>
          `).join("")}
        </div>

        <button type="button"
          class="ke-submit"
          id="keSubmit"
          disabled>
          SELECT AN ANSWER
        </button>

        <div class="ke-reward">
          Potential reward: $${Number(question.reward_usd || 0).toFixed(2)} USD
        </div>

        <p class="ke-note">
          No timer. Choose one answer and submit.
          Rewards are issued only for correct answers
          confirmed by the system.
        </p>
      </div>
    `;

    content.querySelectorAll("[data-ke-option]")
      .forEach(button => {
        button.addEventListener("click", () => {
          if (busy) return;

          selectedAnswer = Number(button.dataset.keOption);

          content.querySelectorAll("[data-ke-option]")
            .forEach(b => b.classList.remove("selected"));

          button.classList.add("selected");

          const submit = $("keSubmit");
          submit.disabled = false;
          submit.textContent = "SUBMIT ANSWER";
        });
      });

    $("keSubmit").addEventListener("click", submitAnswer);
  }

  async function submitAnswer() {
    if (busy || selectedAnswer === null || !currentQuestion) return;

    busy = true;

    const submit = $("keSubmit");
    submit.disabled = true;
    submit.textContent = "CHECKING ANSWER...";

    /*
     * Secure payout RPC will be connected once the backend
     * is installed. Never calculate or credit a reward here.
     */

    busy = false;
    submit.disabled = false;
    submit.textContent = "BACKEND NOT CONNECTED";
  }

  function activateTab(tab) {
    const panel = $("sfKnowEarnPanel");
    if (!panel) return;

    if (tab.dataset.taskTab === "know-earn") {
      document.querySelectorAll("#tasksView [data-task-tab]")
        .forEach(button => {
          button.classList.toggle("active", button === tab);
        });

      $("sfAvailableTasks")?.classList.add("hidden");
      $("sfMyTaskSubmissions")?.classList.add("hidden");
      $("sfTriviaPanel")?.classList.add("hidden");

      panel.classList.remove("hidden");
      loadQuestion();
    } else {
      panel.classList.add("hidden");
    }
  }

  document.addEventListener("click", event => {
    const tab = event.target.closest("[data-task-tab]");
    if (!tab) return;

    if (tab.dataset.taskTab === "know-earn") {
      activateTab(tab);
    } else {
      $("sfKnowEarnPanel")?.classList.add("hidden");
    }
  }, true);

  function watchTasks() {
    const observer = new MutationObserver(() => {
      if ($("tasksView")) {
        installPanel();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    installPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installStyles();
      watchTasks();
    });
  } else {
    installStyles();
    watchTasks();
  }

})();
