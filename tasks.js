
/* =========================================================
   SHOPY FONT — TASK CENTRE
   Restored task loading, submission and status display.
   ========================================================= */

(function () {
  "use strict";

  const SF = window.SF = window.SF || {};

  const styles = `
    #tasksView {
      padding: 18px;
      color: #173b2c;
    }

    .sf-task-header {
      background: linear-gradient(135deg, #075b3b, #108653);
      color: #fff;
      padding: 24px;
      border-radius: 18px;
      margin-bottom: 20px;
    }

    .sf-task-header h2 {
      margin: 0 0 8px;
      font-size: 23px;
    }

    .sf-task-header p {
      margin: 0;
      opacity: .9;
      line-height: 1.5;
    }

    .sf-task-card {
      background: #fff;
      border: 1px solid #e2eee7;
      border-radius: 15px;
      padding: 17px;
      margin-bottom: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,.04);
    }

    .sf-task-card h3 {
      margin: 0 0 8px;
      color: #075b3b;
      font-size: 17px;
    }

    .sf-task-card p {
      color: #607267;
      line-height: 1.5;
      font-size: 14px;
    }

    .sf-task-reward {
      color: #087b4b;
      font-weight: 800;
      margin: 10px 0;
    }

    .sf-task-button {
      background: #087b4b;
      color: #fff;
      border: 0;
      border-radius: 9px;
      padding: 11px 17px;
      font-weight: 700;
      cursor: pointer;
    }

    .sf-task-button:disabled {
      background: #9aaba1;
      cursor: not-allowed;
    }

    .sf-task-input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #d5e3da;
      border-radius: 9px;
      padding: 12px;
      margin: 8px 0 12px;
      font: inherit;
    }

    .sf-task-status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: #fff0df;
      color: #a44d00;
    }

    .sf-task-status.approved {
      background: #e2f7e9;
      color: #087b4b;
    }

    .sf-task-status.rejected {
      background: #ffe5e5;
      color: #b42318;
    }

    .sf-task-empty {
      background: #f5faf7;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: #607267;
    }

    .sf-task-section-title {
      margin: 24px 0 12px;
      color: #075b3b;
      font-size: 18px;
    }
  `;

  function addStyles() {
    if (document.getElementById("sfTasksStyles")) return;

    const style = document.createElement("style");
    style.id = "sfTasksStyles";
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function getClient() {
    return SF.supabase || window.supabaseClient || window.sb;
  }

  function getUser() {
    return SF.user || SF.currentUser || null;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function notify(message) {
    if (typeof SF.toast === "function") {
      SF.toast(message);
    } else {
      alert(message);
    }
  }

  function createTasksView() {
    let view = document.getElementById("tasksView");

    if (!view) {
      const main = document.querySelector("main") ||
                   document.querySelector("#app") ||
                   document.body;

      view = document.createElement("section");
      view.id = "tasksView";
      view.hidden = true;
      main.appendChild(view);
    }

    return view;
  }

  function showView() {
    const view = createTasksView();

    document.querySelectorAll("main > section").forEach(section => {
      if (section.id !== "tasksView") {
        section.hidden = true;
      }
    });

    view.hidden = false;
    loadTasks();
  }

  async function loadTasks() {
    const view = createTasksView();
    const client = getClient();
    const user = getUser();

    addStyles();

    view.innerHTML = `
      <div class="sf-task-header">
        <h2>Task Centre</h2>
        <p>Complete available activities and submit your work for review.</p>
      </div>
      <div class="sf-task-empty">Loading available tasks...</div>
    `;

    if (!client || !user) {
      view.innerHTML += `
        <div class="sf-task-empty">
          Please sign in to access the Task Centre.
        </div>
      `;
      return;
    }

    try {
      const [tasksResult, submissionsResult] = await Promise.all([
        client
          .from("tasks")
          .select("id,title,description,task_type,reward_points,reward_kes,requires_review")
          .eq("status", "active")
          .order("created_at", { ascending: false }),

        client
          .from("task_submissions")
          .select("id,task_id,status,created_at,review_note,tasks(title,reward_points,reward_kes)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (submissionsResult.error) throw submissionsResult.error;

      renderTasks(
        tasksResult.data || [],
        submissionsResult.data || []
      );

    } catch (error) {
      console.error("SHOPY FONT task loading error:", error);

      view.innerHTML = `
        <div class="sf-task-header">
          <h2>Task Centre</h2>
          <p>Complete available activities and submit your work.</p>
        </div>
        <div class="sf-task-empty">
          We could not load tasks right now.
          Please refresh and try again.
          <p>${escapeHTML(error.message)}</p>
        </div>
      `;
    }
  }

  function renderTasks(tasks, submissions) {
    const view = createTasksView();

    const submissionByTask = new Map();

    submissions.forEach(submission => {
      if (!submissionByTask.has(submission.task_id)) {
        submissionByTask.set(submission.task_id, submission);
      }
    });

    let html = `
      <div class="sf-task-header">
        <h2>Task Centre</h2>
        <p>Complete available activities and submit your work for review.</p>
      </div>

      <h3 class="sf-task-section-title">Available Tasks</h3>
    `;

    if (!tasks.length) {
      html += `
        <div class="sf-task-empty">
          No tasks are available at the moment.
          Please check again later.
        </div>
      `;
    }

    tasks.forEach(task => {
      const submission = submissionByTask.get(task.id);
      const status = submission?.status;

      let button = "";

      if (status === "approved") {
        button = `<span class="sf-task-status approved">Completed</span>`;
      } else if (status === "submitted" || status === "pending") {
        button = `<span class="sf-task-status">Under review</span>`;
      } else if (status === "rejected") {
        button = `
          <span class="sf-task-status rejected">Rejected</span>
          <button class="sf-task-button"
            data-task-submit="${escapeHTML(task.id)}">
            Submit Again
          </button>
        `;
      } else {
        button = `
          <button class="sf-task-button"
            data-task-submit="${escapeHTML(task.id)}">
            Start Task
          </button>
        `;
      }

      html += `
        <article class="sf-task-card">
          <h3>${escapeHTML(task.title)}</h3>
          <p>${escapeHTML(task.description || "Complete this activity and submit your work.")}</p>
          <div class="sf-task-reward">
            Reward: ${money(task.reward_kes)}
          </div>
          ${button}
        </article>
      `;
    });

    html += `
      <h3 class="sf-task-section-title">My Submissions</h3>
    `;

    if (!submissions.length) {
      html += `
        <div class="sf-task-empty">
          You have not submitted any tasks yet.
        </div>
      `;
    } else {
      submissions.forEach(submission => {
        const taskTitle = submission.tasks?.title || "Task submission";
        const status = submission.status || "submitted";

        html += `
          <article class="sf-task-card">
            <h3>${escapeHTML(taskTitle)}</h3>
            <span class="sf-task-status ${escapeHTML(status)}">
              ${escapeHTML(status.toUpperCase())}
            </span>
            ${
              submission.review_note
                ? `<p>${escapeHTML(submission.review_note)}</p>`
                : ""
            }
          </article>
        `;
      });
    }

    view.innerHTML = html;
  }

  async function submitTask(taskId) {
    const client = getClient();
    const user = getUser();

    if (!client || !user) {
      notify("Please sign in first.");
      return;
    }

    const task = await client
      .from("tasks")
      .select("id,title")
      .eq("id", taskId)
      .eq("status", "active")
      .single();

    if (task.error || !task.data) {
      notify("This task is no longer available.");
      return;
    }

    const submissionText = prompt(
      "Describe how you completed this task:"
    );

    if (!submissionText || !submissionText.trim()) {
      notify("Please enter your task description.");
      return;
    }

    const evidence = prompt(
      "Enter an evidence link if required. Otherwise leave blank:"
    );

    const result = await client
      .from("task_submissions")
      .insert({
        task_id: taskId,
        user_id: user.id,
        submission_text: submissionText.trim(),
        evidence: evidence ? evidence.trim() : null,
        status: "submitted"
      });

    if (result.error) {
      console.error("Task submission error:", result.error);
      notify("Submission failed: " + result.error.message);
      return;
    }

    notify("Your task has been submitted for review.");
    loadTasks();
  }

  document.addEventListener("click", function (event) {
    const submitButton = event.target.closest("[data-task-submit]");

    if (submitButton) {
      submitTask(submitButton.dataset.taskSubmit);
    }
  });

  // Open Task Centre when a dashboard task button is clicked.
  document.addEventListener("click", function (event) {
    const taskLink = event.target.closest('[data-view="tasks"]');

    if (!taskLink) return;

    event.preventDefault();
    event.stopPropagation();

    showView();
  }, true);

  SF.openTasks = showView;
  SF.loadTasks = loadTasks;

  addStyles();

})();
        
