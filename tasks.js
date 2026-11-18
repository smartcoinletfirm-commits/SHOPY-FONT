
/* =========================================================
   SHOPY FONT — PREMIUM TRIVIA CENTRE
   Preserves existing Supabase trivia integration.
   ========================================================= */

(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const SF = window.SF = window.SF || {};
  const db = () => SF.getClient();

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[c]);

  let currentQuestion = null;
  let selectedIndex = null;
  let busy = false;
  let loading = false;
  let activePanel = false;
  let dailyCount = 0;

  const styles = `
    #sfTriviaPanel {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #e5e8f1;
      border-radius: 22px;
      background: #f5f7fc;
      color: #17243d;
      box-shadow: 0 10px 30px rgba(24,36,72,.06);
      font-family: inherit;
    }

    #sfTriviaPanel * { box-sizing: border-box; }

    #sfTriviaPanel.hidden { display: none !important; }

    .sf-trivia-hero {
      position: relative;
      overflow: hidden;
      padding: 25px;
      border-radius: 19px;
      color: white;
      background: linear-gradient(125deg,#101b3b,#293d7c 60%,#7049ba);
    }

    .sf-trivia-hero:after {
      content: "";
      position: absolute;
      width: 175px;
      height: 175px;
      right: -55px;
      top: -70px;
      border: 28px solid rgba(255,255,255,.08);
      border-radius: 50%;
    }

    .sf-trivia-kicker {
      display: block;
      color: #c9b7ff;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .sf-trivia-hero h2 {
      color: white;
      font-size: 27px;
      font-weight: 900;
      margin: 0 0 9px;
    }

    .sf-trivia-hero p {
      color: rgba(255,255,255,.8);
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
      max-width: 400px;
    }

    .sf-trivia-live {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-top: 16px;
      padding: 7px 11px;
      border-radius: 30px;
      background: rgba(255,255,255,.13);
      color: white;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1px;
    }

    .sf-trivia-live:before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #5ef0a3;
    }

    .sf-trivia-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 11px;
      margin: 15px 0;
    }

    .sf-trivia-summary-card {
      padding: 15px;
      background: white;
      border: 1px solid #e8ebf3;
      border-radius: 15px;
    }

    .sf-trivia-summary-label {
      color: #8490a6;
      font-size: 10px;
      font-weight: 800;
      margin-bottom: 7px;
    }

    .sf-trivia-summary-value {
      color: #253a7b;
      font-size: 21px;
      font-weight: 900;
    }

    .sf-trivia-progress-wrap {
      margin: 18px 0;
      padding: 15px;
      border: 1px solid #e8ebf3;
      background: white;
      border-radius: 15px;
    }

    .sf-trivia-progress-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
      color: #6e7890;
      font-size: 11px;
      font-weight: 800;
    }

    .sf-trivia-progress {
      height: 8px;
      overflow: hidden;
      background: #e9ebf5;
      border-radius: 20px;
    }

    .sf-trivia-progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg,#354b9c,#8655cf);
      border-radius: 20px;
      transition: width .3s ease;
    }

    .sf-trivia-question-shell {
      padding: 19px;
      border: 1px solid #e7eaf2;
      border-radius: 18px;
      background: white;
      box-shadow: 0 5px 18px rgba(26,39,77,.035);
    }

    .sf-trivia-question-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }

    .sf-trivia-number {
      display: grid;
      place-items: center;
      flex: 0 0 45px;
      height: 45px;
      border-radius: 14px;
      color: white;
      background: linear-gradient(140deg,#304a9a,#704bb8);
      font-size: 16px;
      font-weight: 900;
    }

    .sf-trivia-question-top small {
      display: block;
      color: #8290aa;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .sf-trivia-question {
      color: #182747 !important;
      font-size: 18px;
      line-height: 1.55;
      font-weight: 850;
      margin: 0 !important;
    }

    .sf-trivia-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 11px;
      margin: 20px 0;
    }

    .sf-trivia-option {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      min-height: 61px;
      padding: 12px;
      border: 1px solid #e1e6f0;
      border-radius: 13px;
      background: #fbfcff;
      color: #33415f;
      text-align: left;
      font-size: 13px;
      line-height: 1.45;
      cursor: pointer;
      transition: .18s ease;
    }

    .sf-trivia-option:hover:not(:disabled) {
      border-color: #6d59b8;
      background: #f4f1ff;
      transform: translateY(-1px);
    }

    .sf-trivia-option.selected {
      border: 2px solid #6850b5;
      background: #f1edff;
      color: #42327e;
    }

    .sf-trivia-letter {
      display: grid;
      place-items: center;
      flex: 0 0 32px;
      height: 32px;
      border-radius: 10px;
      background: #eceef7;
      color: #465584;
      font-weight: 900;
    }

    .sf-trivia-option.selected .sf-trivia-letter {
      color: white;
      background: #6850b5;
    }

    .sf-trivia-option.correct {
      border: 2px solid #15945a;
      background: #e9f8ef;
      color: #12663d;
    }

    .sf-trivia-option.correct .sf-trivia-letter {
      color: white;
      background: #15945a;
    }

    .sf-trivia-option.incorrect {
      border: 2px solid #d94b58;
      background: #fff0f1;
      color: #a62d39;
    }

    .sf-trivia-option.incorrect .sf-trivia-letter {
      color: white;
      background: #d94b58;
    }

    .sf-trivia-option:disabled {
      cursor: default;
      opacity: 1;
    }

    .sf-trivia-submit,
    .sf-trivia-next {
      width: 100%;
      margin-top: 12px;
      padding: 15px;
      border: 0;
      border-radius: 12px;
      color: white;
      background: linear-gradient(110deg,#344b9b,#754bb9);
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 6px 15px rgba(54,66,145,.16);
    }

    .sf-trivia-submit:disabled {
      background: #aab2c5;
      box-shadow: none;
      cursor: not-allowed;
    }

    .sf-trivia-feedback {
      margin-top: 16px;
      padding: 17px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.6;
    }

    .sf-trivia-feedback.success {
      border: 1px solid #b8e8ca;
      background: #eaf8ef;
      color: #14643b;
    }

    .sf-trivia-feedback.error {
      border: 1px solid #f0c5ca;
      background: #fff0f1;
      color: #a32e3c;
    }

    .sf-trivia-feedback strong {
      display: block;
      margin-bottom: 6px;
      font-size: 16px;
    }

    .sf-trivia-reward {
      margin-top: 9px;
      font-size: 23px;
      font-weight: 950;
    }

    .sf-trivia-note {
      color: #8790a4;
      font-size: 11px;
      line-height: 1.5;
      margin: 14px 0 0;
    }

    .sf-trivia-empty {
      padding: 32px 18px;
      border: 1px dashed #dce1ed;
      border-radius: 16px;
      background: white;
      text-align: center;
      color: #758097;
      font-size: 13px;
      line-height: 1.7;
    }

    .sf-trivia-empty strong {
      display: block;
      color: #233660;
      font-size: 17px;
      margin-bottom: 7px;
    }

    .sf-trivia-empty-icon {
      font-size: 30px;
      margin-bottom: 10px;
    }

    @media(max-width:520px) {
      #sfTriviaPanel { padding: 13px; }
      .sf-trivia-hero { padding: 21px 18px; }
      .sf-trivia-question-shell { padding: 14px; }
      .sf-trivia-options { grid-template-columns: 1fr; }
      .sf-trivia-question { font-size: 16px; }
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
    if (!root) return false;

    const tabs = root.querySelector(".sf-task-tabs");
    if (!tabs) return false;

    let tab = tabs.querySelector('[data-task-tab="trivia"]');

    if (!tab) {
      tab = document.createElement("button");
      tab.type = "button";
      tab.className = "sf-task-tab";
      tab.dataset.taskTab = "trivia";
      tab.textContent = "Trivia";
      tabs.appendChild(tab);
    }

    if (!$("sfTriviaPanel")) {
      const panel = document.createElement("section");
      panel.id = "sfTriviaPanel";
      panel.className = "sf-trivia-panel hidden";

      panel.innerHTML = `
        <div class="sf-trivia-hero">
          <span class="sf-trivia-kicker">
            SHOPY FONT · KNOWLEDGE CHALLENGE
          </span>
          <h2>Daily Trivia</h2>
          <p>
            Challenge your knowledge, answer correctly
            and earn rewards.
          </p>
          <span class="sf-trivia-live">DAILY CHALLENGE</span>
        </div>

        <div class="sf-trivia-summary">
          <div class="sf-trivia-summary-card">
            <div class="sf-trivia-summary-label">QUESTIONS ANSWERED</div>
            <div class="sf-trivia-summary-value" id="sfTriviaCount">0 / 20</div>
          </div>
          <div class="sf-trivia-summary-card">
            <div class="sf-trivia-summary-label">DAILY CHALLENGE</div>
            <div class="sf-trivia-summary-value">20 Qs</div>
          </div>
        </div>

        <div class="sf-trivia-progress-wrap">
          <div class="sf-trivia-progress-top">
            <span>YOUR DAILY PROGRESS</span>
            <span id="sfTriviaPercent">0%</span>
          </div>
          <div class="sf-trivia-progress">
            <span id="sfTriviaProgress" style="width:0%"></span>
          </div>
        </div>

        <div id="sfTriviaContent">
          <div class="sf-trivia-empty">Open Trivia to begin.</div>
        </div>
      `;

      tabs.insertAdjacentElement("afterend", panel);
    }

    return true;
  }

  function updateProgress(count) {
    dailyCount = Number(count || 0);
    const percent = Math.min(100, dailyCount / 20 * 100);

    if ($("sfTriviaCount")) {
      $("sfTriviaCount").textContent = dailyCount + " / 20";
    }

    if ($("sfTriviaProgress")) {
      $("sfTriviaProgress").style.width = percent + "%";
    }

    if ($("sfTriviaPercent")) {
      $("sfTriviaPercent").textContent = Math.round(percent) + "%";
    }
  }

  function empty(title, description) {
    return `
      <div class="sf-trivia-empty">
        <div class="sf-trivia-empty-icon">✦</div>
        <strong>${esc(title)}</strong>
        ${esc(description)}
      </div>
    `;
  }

  async function loadTrivia() {
    if (loading) return;
    loading = true;

    const content = $("sfTriviaContent");
    if (!content) {
      loading = false;
      return;
    }

    currentQuestion = null;
    selectedIndex = null;
    busy = false;

    content.innerHTML = empty(
      "Preparing your challenge",
      "Loading your next question..."
    );

    try {
      const client = db();
      if (!client) throw new Error("Database connection is unavailable.");

      const [qResult, aResult] = await Promise.all([
        client.from("trivia_questions")
          .select("id,question,options,reward_kes")
          .eq("is_active", true),

        client.from("trivia_attempts")
          .select("question_id,attempt_date")
      ]);

      if (qResult.error) throw qResult.error;
      if (aResult.error) throw aResult.error;

      const questions = qResult.data || [];
      const attempts = aResult.data || [];
      const today = new Date().toISOString().slice(0, 10);

      const todayAttempts = attempts.filter(
        item => item.attempt_date === today
      );

      updateProgress(todayAttempts.length);

      if (todayAttempts.length >= 20) {
        content.innerHTML = empty(
          "Daily challenge completed!",
          "You have answered all 20 questions. Come back tomorrow for another challenge."
        );
        return;
      }

      const attempted = new Set(
        attempts.map(item => item.question_id)
      );

      const remaining = questions.filter(
        question => !attempted.has(question.id)
      );

      if (!remaining.length) {
        content.innerHTML = empty(
          "You're all caught up!",
          "New questions will appear when administrators publish them."
        );
        return;
      }

      const question = remaining[
        Math.floor(Math.random() * remaining.length)
      ];

      currentQuestion = question;
      renderQuestion();

    } catch (error) {
      console.error("Trivia loading error:", error);
      content.innerHTML = empty(
        "Trivia is temporarily unavailable",
        error.message || "Please try again."
      ) + `
        <button class="sf-trivia-next" id="sfTriviaRetry">
          TRY AGAIN
        </button>
      `;

      $("sfTriviaRetry")?.addEventListener("click", loadTrivia);

    } finally {
      loading = false;
    }
  }

  function renderQuestion() {
    const question = currentQuestion;
    const content = $("sfTriviaContent");
    const options = Array.isArray(question.options)
      ? question.options
      : [];

    if (options.length < 2) {
      content.innerHTML = empty(
        "Question needs more answers",
        "This question is not ready. Please try another one later."
      );
      return;
    }

    content.innerHTML = `
      <div class="sf-trivia-question-shell">
        <div class="sf-trivia-question-top">
          <div class="sf-trivia-number">
            ${String(dailyCount + 1).padStart(2, "0")}
          </div>
          <div>
            <small>QUESTION ${dailyCount + 1} OF 20</small>
            <span class="sf-trivia-kicker">SELECT YOUR ANSWER</span>
          </div>
        </div>

        <p class="sf-trivia-question">${esc(question.question)}</p>

        <div class="sf-trivia-options">
          ${options.map((option, index) => `
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
          id="sfTriviaSubmit"
          disabled>
          SELECT AN ANSWER
        </button>

        <p class="sf-trivia-note">
          Your answer is checked by the SHOPY FONT system.
          Rewards are displayed after successful verification.
        </p>
      </div>
    `;

    content.querySelectorAll("[data-trivia-index]")
      .forEach(button => {
        button.addEventListener("click", () => {
          if (busy) return;

          selectedIndex = Number(button.dataset.triviaIndex);

          content.querySelectorAll("[data-trivia-index]")
            .forEach(item => item.classList.remove("selected"));

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
    button.textContent = "VERIFYING ANSWER...";

    try {
      const { data, error } = await db().rpc(
        "sf_submit_trivia_answer",
        {
          p_question_id: currentQuestion.id,
          p_selected_option: answer
        }
      );

      if (error) throw error;
      if (!data) throw new Error("No verification result was returned.");

      const options = $("sfTriviaContent")
        .querySelectorAll("[data-trivia-index]");

      options.forEach((item, index) => {
        item.disabled = true;

        if (index === selectedIndex) {
          item.classList.add(
            data.correct ? "correct" : "incorrect"
          );
        }
      });

      if (data.correct) {
        const reward = Number(data.reward_usd || 0);

        showFeedback(
          true,
          "Excellent! Correct answer.",
          "Your answer was verified successfully.",
          "+$" + reward.toFixed(2) + " USD"
        );
      } else {
        showFeedback(
          false,
          "Not quite right.",
          "Your answer has been recorded. Keep practising and try the next challenge.",
          ""
        );
      }

      dailyCount = Number(data.attempts_today ?? dailyCount + 1);
      updateProgress(dailyCount);

      button.remove();

      const next = document.createElement("button");
      next.type = "button";
      next.className = "sf-trivia-next";
      next.textContent = dailyCount >= 20
        ? "VIEW DAILY RESULT"
        : "CONTINUE TO NEXT QUESTION →";

      next.addEventListener("click", loadTrivia);
      $("sfTriviaContent").appendChild(next);

    } catch (error) {
      console.error("Trivia submission error:", error);

      button.disabled = false;
      button.textContent = "TRY AGAIN";

      const message = document.createElement("div");
      message.className = "sf-trivia-feedback error";
      message.textContent = error.message || "Unable to submit your answer.";

      $("sfTriviaContent").appendChild(message);

    } finally {
      busy = false;
    }
  }

  function showFeedback(success, title, description, reward) {
    const feedback = document.createElement("div");

    feedback.className =
      "sf-trivia-feedback " + (success ? "success" : "error");

    feedback.innerHTML = `
      <strong>${success ? "✓ " : "✕ "}${esc(title)}</strong>
      ${esc(description)}
      ${reward
        ? `<div class="sf-trivia-reward">${esc(reward)}</div>`
        : ""}
    `;

    $("sfTriviaContent").appendChild(feedback);
  }

  // Capture Trivia clicks before the Task Centre tab handler.
  document.addEventListener("click", event => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const tab = target.closest('[data-task-tab="trivia"]');
    if (!tab) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!installPanel()) return;

    document.querySelectorAll("#tasksView [data-task-tab]")
      .forEach(item => item.classList.toggle("active", item === tab));

    document.querySelectorAll("#tasksView > section")
      .forEach(section => {
        if (section.id !== "sfTriviaPanel") section.classList.add("hidden");
      });

    const panel = $("sfTriviaPanel");
    panel.classList.remove("hidden");

    activePanel = true;
    loadTrivia();

  }, true);

  // Rebuild the normal task tabs when another tab is selected.
  document.addEventListener("click", event => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const tab = target.closest("#tasksView [data-task-tab]");
    if (!tab || tab.dataset.taskTab === "trivia") return;

    if (activePanel) {
      activePanel = false;
      $("sfTriviaPanel")?.classList.add("hidden");
    }
  }, false);

  function watchTasks() {
    const observer = new MutationObserver(() => {
      installPanel();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    installPanel();
  }

  i
