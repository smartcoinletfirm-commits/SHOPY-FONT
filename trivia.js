
/* SHOPY FONT — PREMIUM MEMBER TRIVIA */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const db = () => window.SF.getClient();

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  let currentQuestion = null;
  let busy = false;
  let selectedIndex = null;

  const styles = `
    .sf-trivia-panel {
      margin:22px 0;
      padding:24px;
      border:1px solid #e4e9e3;
      border-radius:22px;
      background:linear-gradient(145deg,#ffffff,#f5f8f4);
      box-shadow:0 14px 38px rgba(13,48,34,.08);
      color:#18382b;
    }
    .sf-trivia-kicker {
      color:#aa8950;
      font-size:10px;
      font-weight:900;
      letter-spacing:2.2px;
    }
    .sf-trivia-panel h2 {
      margin:8px 0;
      color:#123d2b;
      font-family:Manrope,sans-serif;
      font-size:25px;
      font-weight:800;
    }
    .sf-trivia-panel p { color:#687a70; }
    .sf-trivia-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      flex-wrap:wrap;
    }
    .sf-trivia-count {
      padding:10px 15px;
      border:1px solid #e8dfc9;
      border-radius:30px;
      background:#fffdf7;
      color:#8a6c35;
      font-size:12px;
      font-weight:800;
    }
    .sf-trivia-progress {
      height:8px;
      margin:19px 0;
      background:#e7eee8;
      border-radius:20px;
      overflow:hidden;
    }
    .sf-trivia-progress span {
      display:block;
      height:100%;
      border-radius:20px;
      background:linear-gradient(90deg,#176b45,#b99a5b);
      transition:width .35s ease;
    }
    .sf-trivia-question-row {
      display:flex;
      align-items:flex-start;
      gap:13px;
      margin:23px 0 18px;
    }
    .sf-trivia-number {
      display:grid;
      place-items:center;
      flex:0 0 46px;
      height:46px;
      border-radius:14px;
      background:linear-gradient(145deg,#174d36,#0d3827);
      color:#f3d99e;
      font-size:17px;
      font-weight:900;
      box-shadow:0 5px 13px rgba(15,64,42,.18);
    }
    .sf-trivia-question {
      margin:0!important;
      padding-top:4px;
      color:#173b2b!important;
      font-size:18px;
      font-weight:800;
      line-height:1.55;
    }
    .sf-trivia-options {
      display:grid;
      gap:11px;
      margin:18px 0;
    }
    .sf-trivia-option {
      display:flex;
      align-items:center;
      gap:12px;
      width:100%;
      min-height:59px;
      padding:12px 15px;
      border:1px solid #e0e8e1;
      border-radius:14px;
      background:#fff;
      color:#263e32;
      text-align:left;
      cursor:pointer;
      transition:all .2s ease;
      font-size:14px;
    }
    .sf-trivia-option:not(:disabled):hover {
      border-color:#39845e;
      background:#f3faf5;
      transform:translateY(-1px);
    }
    .sf-trivia-option.selected {
      border:2px solid #28734c;
      background:#edf7ef;
    }
    .sf-trivia-letter {
      display:grid;
      place-items:center;
      flex:0 0 32px;
      height:32px;
      border-radius:10px;
      background:#edf2ed;
      color:#315d43;
      font-weight:900;
    }
    .sf-trivia-option.correct {
      border:2px solid #16834b;
      background:#e7f7ed;
      color:#126337;
    }
    .sf-trivia-option.correct .sf-trivia-letter {
      background:#16834b;
      color:white;
    }
    .sf-trivia-option.incorrect {
      border:2px solid #d84b4b;
      background:#fff0f0;
      color:#a52c2c;
    }
    .sf-trivia-option.incorrect .sf-trivia-letter {
      background:#d84b4b;
      color:white;
    }
    .sf-trivia-option:disabled {
      cursor:default;
      opacity:1;
    }
    .sf-trivia-submit {
      display:block;
      width:100%;
      margin-top:17px;
      padding:15px 20px;
      border:0;
      border-radius:13px;
      background:linear-gradient(135deg,#17633f,#0d402b);
      color:#fff;
      font-size:14px;
      font-weight:900;
      letter-spacing:.3px;
      cursor:pointer;
      box-shadow:0 7px 17px rgba(15,73,46,.18);
      transition:all .2s ease;
    }
    .sf-trivia-submit:not(:disabled):hover {
      transform:translateY(-2px);
      box-shadow:0 10px 22px rgba(15,73,46,.25);
    }
    .sf-trivia-submit:disabled {
      background:#aab9ae;
      color:#f7faf7;
      cursor:not-allowed;
      box-shadow:none;
    }
    .sf-trivia-feedback {
      margin-top:17px;
      padding:16px;
      border-radius:14px;
      font-size:14px;
      line-height:1.5;
    }
    .sf-trivia-feedback.success {
      border:1px solid #b9e5c8;
      background:#eaf8ef;
      color:#14633a;
    }
    .sf-trivia-feedback.error {
      border:1px solid #f0c2c2;
      background:#fff0f0;
      color:#a52e2e;
    }
    .sf-trivia-feedback strong {
      display:block;
      margin-bottom:5px;
      font-size:16px;
    }
    .sf-trivia-reward {
      margin-top:8px;
      font-weight:900;
    }
    .sf-trivia-next {
      width:100%;
      margin-top:14px;
      padding:14px;
      border:1px solid #c3a76d;
      border-radius:12px;
      background:linear-gradient(135deg,#1a6845,#10432e);
      color:white;
      font-weight:900;
      cursor:pointer;
    }
    .sf-trivia-empty {
      padding:28px 14px;
      text-align:center;
    }
    .sf-trivia-empty strong {
      display:block;
      margin-bottom:8px;
      color:#17452f;
      font-size:18px;
    }
    .sf-trivia-note {
      margin-top:15px;
      font-size:12px;
      color:#78867d;
    }
    @media(min-width:650px) {
      .sf-trivia-options { grid-template-columns:1fr 1fr; }
    }
  `;

  function installStyles() {
    if ($("sfTriviaStyles")) return;
    const style = document.createElement("style");
    style.id = "sfTriviaStyles";
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function installPanel() {
    const root = $("tasksView");
    if (!root || $("sfTriviaPanel")) return;

    const tabs = root.querySelector(".sf-task-tabs");

    if (tabs && !tabs.querySelector('[data-task-tab="trivia"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sf-task-tab";
      button.dataset.taskTab = "trivia";
      button.textContent = "Trivia";
      tabs.appendChild(button);
    }

    if (!tabs) return;

    const panel = document.createElement("section");
    panel.id = "sfTriviaPanel";
    panel.className = "sf-trivia-panel hidden";

    panel.innerHTML = `
      <div class="sf-trivia-head">
        <div>
          <span class="sf-trivia-kicker">THINK · ANSWER · EARN</span>
          <h2>Daily Trivia</h2>
          <p>Challenge your knowledge and earn rewards.</p>
        </div>
        <span class="sf-trivia-count" id="sfTriviaCount">0 / 20 today</span>
      </div>
      <div class="sf-trivia-progress">
        <span id="sfTriviaProgress" style="width:0%"></span>
      </div>
      <div id="sfTriviaContent">
        <p>Loading Trivia...</p>
      </div>
    `;

    tabs.insertAdjacentElement("afterend", panel);
  }

  function updateProgress(count) {
    $("sfTriviaCount").textContent = count + " / 20 today";
    $("sfTriviaProgress").style.width =
      Math.min(count, 20) / 20 * 100 + "%";
  }

  async function loadTrivia() {
    const content = $("sfTriviaContent");
    if (!content) return;

    currentQuestion = null;
    selectedIndex = null;
    content.innerHTML = "<p>Loading your questions...</p>";

    try {
      const [qResult, aResult] = await Promise.all([
        db().from("trivia_questions")
          .select("id,question,options,reward_kes")
          .eq("is_active", true),

        db().from("trivia_attempts")
          .select("question_id,attempt_date")
      ]);

      if (qResult.error) throw qResult.error;
      if (aResult.error) throw aResult.error;

      const questions = qResult.data || [];
      const attempts = aResult.data || [];
      const today = new Date().toISOString().slice(0, 10);

      const todayCount = attempts.filter(
        a => a.attempt_date === today
      ).length;

      updateProgress(todayCount);

      if (todayCount >= 20) {
        content.innerHTML = `
          <div class="sf-trivia-empty">
            <strong>🎉 Daily challenge completed!</strong>
            <p>You have answered all 20 questions today.</p>
            <p>Come back tomorrow for another challenge.</p>
          </div>`;
        return;
      }

      const attempted = new Set(
        attempts.map(a => a.question_id)
      );

      const remaining = questions.filter(
        q => !attempted.has(q.id)
      );

      if (!remaining.length) {
        content.innerHTML = `
          <div class="sf-trivia-empty">
            <strong>You're all caught up!</strong>
            <p>New questions will appear when administrators publish them.</p>
          </div>`;
        return;
      }

      remaining.sort(() => Math.random() - 0.5);
      currentQuestion = remaining[0];

      renderQuestion(todayCount);

    } catch (error) {
      console.error("Trivia loading error:", error);
      content.innerHTML = `
        <div class="sf-trivia-empty">
          <strong>Trivia is temporarily unavailable.</strong>
          <p>Please refresh and try again.</p>
        </div>`;
    }
  }

  function renderQuestion(count) {
    const q = currentQuestion;
    const content = $("sfTriviaContent");

    content.innerHTML = `
      <div class="sf-trivia-question-row">
        <span class="sf-trivia-number">
          ${String(count + 1).padStart(2, "0")}
        </span>
        <div>
          <span class="sf-trivia-kicker">
            QUESTION ${String(count + 1).padStart(2, "0")} OF 20
          </span>
          <p class="sf-trivia-question">${esc(q.question)}</p>
        </div>
      </div>

      <div class="sf-trivia-options">
        ${(q.options || []).map((option, index) => `
          <button type="button"
            class="sf-trivia-option"
            data-trivia-index="${index}">
            <span class="sf-trivia-letter">
              ${String.fromCharCode(65 + index)}
            </span>
            <span>${esc(option)}</span>
          </button>
        `).join("")}
      </div>

      <button type="button"
        class="sf-trivia-submit"
        id="sfTriviaSubmit" disabled>
        SELECT AN ANSWER
      </button>

      <p class="sf-trivia-note">
        Correct answer reward: KES ${Number(q.reward_kes).toFixed(2)}
        equivalent, credited to your USD wallet.
      </p>
    `;

    content.querySelectorAll("[data-trivia-index]").forEach(button => {
      button.addEventListener("click", () => {
        if (busy) return;

        selectedIndex = Number(button.dataset.triviaIndex);

        content.querySelectorAll("[data-trivia-index]")
          .forEach(x => x.classList.remove("selected"));

        button.classList.add("selected");

        const submit = $("sfTriviaSubmit");
        submit.disabled = false;
        submit.textContent = "SUBMIT MY ANSWER";
      });
    });

    $("sfTriviaSubmit").addEventListener("click", submitAnswer);
  }

  async function submitAnswer() {
    if (busy || !currentQuestion || selectedIndex === null) return;

    const button = $("sfTriviaSubmit");
    const answer = currentQuestion.options[selectedIndex];

    busy = true;
    button.disabled = true;
    button.textContent = "CHECKING ANSWER...";

    try {
      const { data, error } = await db().rpc(
        "sf_submit_trivia_answer",
        {
          p_question_id: currentQuestion.id,
          p_selected_option: answer
        }
      );

      if (error) throw error;

      const options = $("sfTriviaContent")
        .querySelectorAll("[data-trivia-index]");

      options.forEach((optionButton, index) => {
        optionButton.disabled = true;

        if (currentQuestion.options[index] ===
            currentQuestion.options.find(
              (x, i) => x === answer && i === selectedIndex
            ) && index === selectedIndex) {
          if (data.correct) {
            optionButton.classList.add("correct");
          } else {
            optionButton.classList.add("incorrect");
          }
        }

        if (data.correct &&
            currentQuestion.options[index] === answer) {
          optionButton.classList.add("correct");
        }
      });

      const feedback = document.createElement("div");
      feedback.className = "sf-trivia-feedback " +
        (data.correct ? "success" : "error");

      if (data.correct) {
        feedback.innerHTML = `
          <strong>✓ Excellent! Correct answer!</strong>
          You got it right. Your reward has been credited.
          <div class="sf-trivia-reward">
            +$${esc(Number(data.reward_usd).toFixed(2))} USD
          </div>`;
      } else {
        const correctOption = currentQuestion.options.find(
          (option, index) => {
            const correctButton = options[index];
            return correctButton.classList.contains("correct");
          }
        );

        // The server confirms correctness, but does not expose the answer.
        feedback.innerHTML = `
          <strong>✕ Not quite right.</strong>
          Your answer has been recorded. The green option shows the correct answer.
          <div class="sf-trivia-reward">
            Keep learning and try the next question!
          </div>`;
      }

      $("sfTriviaContent").appendChild(feedback);

      button.remove();

      const next = document.createElement("button");
      next.type = "button";
      next.className = "sf-trivia-next";
      next.textContent = "CONTINUE TO NEXT QUESTION →";
      next.addEventListener("click", loadTrivia);
      $("sfTriviaContent").appendChild(next);

      updateProgress(data.attempts_today);

    } catch (error) {
      console.error("Trivia submission error:", error);

      button.disabled = false;
      button.textContent = "TRY SUBMITTING AGAIN";

      const message = document.createElement("p");
      message.className = "sf-trivia-feedback error";
      message.textContent =
        error.message || "Unable to submit your answer.";
      $("sfTriviaContent").appendChild(message);

    } finally {
      busy = false;
    }
  }

  document.addEventListener("click", event => {
    const tab = event.target.closest("[data-task-tab]");
    if (!tab) return;

    const panel = $("sfTriviaPanel");
    if (!panel) return;

    if (tab.dataset.taskTab === "trivia") {
      document.querySelectorAll("#tasksView [data-task-tab]")
        .forEach(button =>
          button.classList.toggle("active", button === tab)
        );

      $("sfAvailableTasks")?.classList.add("hidden");
      $("sfMyTaskSubmissions")?.classList.add("hidden");
      panel.classList.remove("hidden");

      loadTrivia();
    } else {
      panel.classList.add("hidden");
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
