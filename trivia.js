
/* SHOPY FONT — MEMBER TRIVIA */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const db = () => window.SF.getClient();

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  let currentQuestion = null;
  let busy = false;

  const styles = `
    .sf-trivia-panel {
      margin:22px 0;
      padding:24px;
      border:1px solid #e7dfcf;
      border-radius:18px;
      background:linear-gradient(145deg,#fffefa,#f8f6ef);
      box-shadow:0 12px 32px rgba(16,29,54,.06);
    }
    .sf-trivia-kicker {
      color:#9a783d;
      font-size:10px;
      font-weight:800;
      letter-spacing:2px;
    }
    .sf-trivia-panel h2 {
      margin:8px 0;
      color:#142b25;
      font-family:Manrope,sans-serif;
    }
    .sf-trivia-panel p { color:#68756f; }
    .sf-trivia-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      flex-wrap:wrap;
    }
    .sf-trivia-count {
      padding:9px 13px;
      border:1px solid #e7dfcf;
      border-radius:30px;
      background:white;
      color:#725a2d;
      font-size:12px;
      font-weight:700;
    }
    .sf-trivia-progress {
      height:7px;
      margin:18px 0;
      background:#e9e7df;
      border-radius:20px;
      overflow:hidden;
    }
    .sf-trivia-progress span {
      display:block;
      height:100%;
      background:#b99858;
      transition:width .2s;
    }
    .sf-trivia-question {
      margin:20px 0;
      color:#172d27!important;
      font-size:18px;
      font-weight:700;
      line-height:1.5;
    }
    .sf-trivia-options {
      display:grid;
      gap:10px;
      margin:16px 0;
    }
    .sf-trivia-option {
      display:flex;
      align-items:center;
      gap:11px;
      width:100%;
      padding:14px;
      border:1px solid #e5e4dc;
      border-radius:12px;
      background:white;
      color:#263b34;
      text-align:left;
      cursor:pointer;
    }
    .sf-trivia-option.selected {
      border-color:#9b7a3f;
      background:#f7f1e4;
    }
    .sf-trivia-letter {
      display:grid;
      place-items:center;
      flex:0 0 29px;
      height:29px;
      border-radius:9px;
      background:#f0eee7;
      color:#725a2d;
      font-weight:800;
    }
    .sf-trivia-submit { width:100%; margin-top:10px; }
    .sf-trivia-empty {
      padding:25px 12px;
      text-align:center;
    }
    .sf-trivia-empty strong {
      display:block;
      margin-bottom:8px;
      color:#173329;
      font-size:17px;
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

    if (tabs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sf-task-tab";
      button.dataset.taskTab = "trivia";
      button.textContent = "Trivia";
      tabs.appendChild(button);
    }

    const panel = document.createElement("section");
    panel.id = "sfTriviaPanel";
    panel.className = "sf-trivia-panel hidden";

    panel.innerHTML = `
      <div class="sf-trivia-head">
        <div>
          <span class="sf-trivia-kicker">THINK · ANSWER · EARN</span>
          <h2>Daily Trivia</h2>
          <p>Test your knowledge and earn rewards for correct answers.</p>
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

    tabs?.insertAdjacentElement("afterend", panel);
  }

  function updateProgress(count) {
    $("sfTriviaCount").textContent = count + " / 20 today";
    $("sfTriviaProgress").style.width =
      Math.min(count, 20) / 20 * 100 + "%";
  }

  async function loadTrivia() {
    const content = $("sfTriviaContent");
    if (!content) return;

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
            <strong>Today's 20 questions are complete.</strong>
            <p>Come back tomorrow for another round.</p>
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
            <strong>No new questions available.</strong>
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
      <span class="sf-trivia-kicker">
        QUESTION ${count + 1} OF 20
      </span>

      <p class="sf-trivia-question">${esc(q.question)}</p>

      <div class="sf-trivia-options">
        ${(q.options || []).map((option, index) => `
          <button type="button"
            class="sf-trivia-option"
            data-trivia-option="${esc(option)}">
            <span class="sf-trivia-letter">
              ${String.fromCharCode(65 + index)}
            </span>
            <span>${esc(option)}</span>
          </button>
        `).join("")}
      </div>

      <button type="button"
        class="btn btn-gold sf-trivia-submit"
        id="sfTriviaSubmit" disabled>
        Submit answer
      </button>

      <p style="font-size:12px;margin-top:12px">
        Correct answer reward: KES ${Number(q.reward_kes).toFixed(2)}
        equivalent, credited to your USD wallet.
      </p>
    `;

    content.querySelectorAll("[data-trivia-option]").forEach(button => {
      button.addEventListener("click", () => {
        content.querySelectorAll("[data-trivia-option]")
          .forEach(x => x.classList.remove("selected"));

        button.classList.add("selected");

        $("sfTriviaSubmit").disabled = false;
        $("sfTriviaSubmit").dataset.answer =
          button.dataset.triviaOption;
      });
    });

    $("sfTriviaSubmit").addEventListener("click", submitAnswer);
  }

  async function submitAnswer() {
    if (busy || !currentQuestion) return;

    const button = $("sfTriviaSubmit");
    const answer = button?.dataset.answer;

    if (!answer) return;

    busy = true;
    button.disabled = true;
    button.textContent = "Checking answer...";

    try {
      const { data, error } = await db().rpc(
        "sf_submit_trivia_answer",
        {
          p_question_id: currentQuestion.id,
          p_selected_option: answer
        }
      );

      if (error) throw error;

      if (data.correct) {
        $("sfTriviaContent").innerHTML = `
          <div class="sf-trivia-empty">
            <strong>✓ Correct answer!</strong>
            <p>You earned $${esc(Number(data.reward_usd).toFixed(2))} USD.</p>
            <p>Your reward has been credited to your USD wallet.</p>
            <button type="button" class="btn btn-gold" id="sfTriviaNext">
              Next question
            </button>
          </div>`;
      } else {
        $("sfTriviaContent").innerHTML = `
          <div class="sf-trivia-empty">
            <strong>Not quite. Keep learning!</strong>
            <p>This attempt has been recorded. No reward was added.</p>
            <button type="button" class="btn btn-gold" id="sfTriviaNext">
              Next question
            </button>
          </div>`;
      }

      updateProgress(data.attempts_today);

      $("sfTriviaNext").addEventListener("click", loadTrivia);

    } catch (error) {
      console.error("Trivia submission error:", error);

      button.disabled = false;
      button.textContent = "Try submitting again";

      const message = document.createElement("p");
      message.className = "notice";
      message.textContent = error.message || "Unable to submit your answer.";
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
        .forEach(button => button.classList.toggle("active", button === tab));

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
      
