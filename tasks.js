
/* =========================================================
   SHOPY FONT — PREMIUM TASK CENTRE
   Premium UI + Supabase task loading and submissions
   ========================================================= */

(function () {
  "use strict";

  const SF = window.SF = window.SF || {};
  let currentTab = "available";
  let cachedTasks = [];
  let cachedSubmissions = [];
  let loading = false;
  let submitting = false;

  const styles = `
    #tasksView {
      padding: 20px;
      color: #17243d;
      background: #f5f7fc;
      min-height: 100vh;
      box-sizing: border-box;
      font-family: inherit;
    }

    #tasksView * { box-sizing: border-box; }

    .sf-task-hero {
      position: relative;
      overflow: hidden;
      padding: 27px;
      border-radius: 22px;
      color: white;
      background: linear-gradient(120deg,#101b3b,#293c78 60%,#6846b8);
      margin-bottom: 20px;
      box-shadow: 0 12px 30px rgba(27,39,83,.17);
    }

    .sf-task-hero:after {
      content: "";
      position: absolute;
      width: 190px;
      height: 190px;
      right: -55px;
      top: -75px;
      border: 30px solid rgba(255,255,255,.08);
      border-radius: 50%;
      pointer-events: none;
    }

    .sf-task-brand {
      font-size: 11px;
      letter-spacing: 2px;
      font-weight: 900;
      opacity: .8;
      margin-bottom: 17px;
    }

    .sf-task-hero h2 {
      margin: 0 0 9px;
      color: white;
      font-size: clamp(24px,5vw,32px);
      font-weight: 850;
    }

    .sf-task-hero p {
      margin: 0;
      max-width: 470px;
      color: rgba(255,255,255,.82);
      line-height: 1.6;
      font-size: 14px;
    }

    .sf-task-stats {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .sf-task-stat {
      background: white;
      border: 1px solid #e8ebf4;
      border-radius: 16px;
      padding: 16px 13px;
      box-shadow: 0 5px 18px rgba(25,39,75,.04);
      min-width: 0;
    }

    .sf-task-stat-label {
      color: #7b8499;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 9px;
    }

    .sf-task-stat-value {
      color: #18264a;
      font-size: 25px;
      font-weight: 850;
    }

    .sf-task-stat-icon {
      font-size: 18px;
      margin-bottom: 8px;
    }

    .sf-task-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 0 13px;
      margin-bottom: 9px;
      scrollbar-width: none;
    }

    .sf-task-tabs::-webkit-scrollbar { display:none; }

    .sf-task-tab {
      border: 1px solid #e2e6f0;
      background: white;
      color: #69738a;
      padding: 11px 16px;
      border-radius: 11px;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
      cursor: pointer;
    }

    .sf-task-tab.active {
      color: white;
      border-color: #344c9b;
      background: linear-gradient(120deg,#253d82,#6848b8);
      box-shadow: 0 5px 13px rgba(54,67,143,.2);
    }

    .sf-task-section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 12px 0 14px;
    }

    .sf-task-section-heading h3 {
      margin: 0;
      color: #172545;
      font-size: 18px;
      font-weight: 850;
    }

    .sf-task-section-heading span {
      color: #8790a4;
      font-size: 11px;
    }

    .sf-task-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 14px;
    }

    .sf-task-card {
      background: white;
      border: 1px solid #e8ebf3;
      border-radius: 17px;
      padding: 18px;
      box-shadow: 0 5px 17px rgba(26,40,75,.045);
      min-width: 0;
    }

    .sf-task-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 13px;
    }

    .sf-task-symbol {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      color: #5542a2;
      background: #f0edff;
      font-size: 20px;
      flex-shrink: 0;
    }

    .sf-task-card h4 {
      color: #1b2949;
      font-size: 15px;
      font-weight: 850;
      margin: 0 0 8px;
      line-height: 1.4;
    }

    .sf-task-card p {
      color: #788197;
      font-size: 13px;
      line-height: 1.65;
      margin: 0 0 14px;
      overflow-wrap: anywhere;
    }

    .sf-task-reward-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      border-top: 1px solid #edf0f6;
      padding-top: 13px;
      margin-top: 12px;
    }

    .sf-task-reward-label {
      color: #8991a4;
      font-size: 11px;
      font-weight: 700;
    }

    .sf-task-reward {
      color: #344a9b;
      font-size: 14px;
      font-weight: 900;
    }

    .sf-task-button {
      width: 100%;
      border: 0;
      border-radius: 11px;
      padding: 12px 15px;
      margin-top: 14px;
      color: white;
      background: linear-gradient(110deg,#344b9b,#7048b8);
      font-size: 12px;
      font-weight: 850;
      cursor: pointer;
      transition: transform .15s, opacity .15s;
    }

    .sf-task-button:active { transform: scale(.98); }
    .sf-task-button:disabled { opacity: .55; cursor: not-allowed; }

    .sf-task-status {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 30px;
      background: #fff3df;
      color: #a45b00;
      font-size: 10px;
      font-weight: 850;
      text-transform: uppercase;
    }

    .sf-task-status.approved {
      background: #e4f8ed;
      color: #16834b;
    }

    .sf-task-status.rejected {
      background: #ffe9e9;
      color: #c03939;
    }

    .sf-task-status.submitted,
    .sf-task-status.pending {
      background: #fff3df;
      color: #a45b00;
    }

    .sf-task-empty {
      background: white;
      border: 1px dashed #dce1ed;
      border-radius: 16px;
      padding: 30px 18px;
      text-align: center;
      color: #7d879c;
      font-size: 13px;
      line-height: 1.7;
    }

    .sf-task-empty-icon {
      font-size: 30px;
      margin-bottom: 10px;
    }

    .sf-task-review-note {
      background: #f6f7fb;
      padding: 11px;
      border-radius: 10px;
      margin-top: 12px !important;
    }

    @media(max-width:650px) {
      #tasksView { padding: 13px; }
      .sf-task-hero { padding: 22px 19px; }
      .sf-task-stats { gap: 8px; }
      .sf-task-stat { padding: 13px 10px; }
      .sf-task-stat-value { font-size: 21px; }
      .sf-task-grid { grid-template-columns: 1fr; }
      .sf-task-card { padding: 16px; }
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
    return SF.currentUser || SF.user || null;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[c]);
  }

  function notify(message) {
    if (typeof SF.showToast === "function") {
      SF.showToast(message);
    } else if (typeof SF.toast === "function") {
      SF.toast(message);
    } else {
      alert(message);
    }
  }

  function getReward(task) {
    const points = Number(task.reward_points || 0);
    const kes = Number(task.reward_kes || 0);

    if (points > 0) return points.toLocaleString() + " points";
    if (kes > 0) return "KSh " + kes.toLocaleString();

    return "Check task details";
  }

  function createTasksView() {
    let view = document.getElementById("tasksView");

    if (!view) {
      const main = document.querySelector("main") ||
                   document.querySelector("#app") ||
                   document.body;

      view = document.createElement("section");
      view.id = "tasksView";
      view.className = "view page-view";
      view.hidden = true;
      main.appendChild(view);
    }

    return view;
  }

  function heroHTML() {
    return `
      <div class="sf-task-hero">
        <div class="sf-task-brand">
          SHOPY FONT · OPPORTUNITY CENTRE
        </div>
        <h2>Task Centre</h2>
        <p>
          Discover activities, complete tasks and submit your work
          for review. Every approved activity brings you one step forward.
        </p>
      </div>
    `;
  }

  function showView() {
    const view = createTasksView();

    document.querySelectorAll("main > section").forEach(section => {
      if (section !== view) section.hidden = true;
    });

    view.hidden = false;
    document.body.classList.remove("sf-dashboard-mode");

    if (window.location.hash !== "#tasks") {
      history.replaceState(null, "", "#tasks");
    }

    const nav = document.querySelector(
      ".sidebar.open, .mobile-nav.open"
    );

    if (nav) nav.classList.remove("open");

    window.scrollTo({ top: 0, behavior: "smooth" });

    loadTasks();
  }

  async function loadTasks() {
    if (loading) return;

    loading = true;

    const view = createTasksView();
    const client = getClient();
    const user = getUser();

    addStyles();

    view.innerHTML = heroHTML() +
      `<div class="sf-task-empty">Loading your Task Centre...</div>`;

    if (!client || !user || !user.id) {
      view.innerHTML = heroHTML() +
        `<div class="sf-task-empty">
          Please sign in to access your tasks.
        </div>`;
      loading = false;
      return;
    }

    try {
      const [tasksResult, submissionsResult] = await Promise.all([
        client.from("tasks")
          .select("id,title,description,task_type,reward_points,reward_kes,requires_review")
          .eq("status", "active")
          .order("created_at", { ascending: false }),

        client.from("task_submissions")
          .select("id,task_id,status,created_at,review_note,tasks(title,reward_points,reward_kes)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (submissionsResult.error) throw submissionsResult.error;

      cachedTasks = tasksResult.data || [];
      cachedSubmissions = submissionsResult.data || [];

      renderTasks();

    } catch (error) {
      console.error("SHOPY FONT task loading error:", error);

      view.innerHTML = heroHTML() + `
        <div class="sf-task-empty">
          <div class="sf-task-empty-icon">⚠️</div>
          <strong>We could not load your tasks.</strong>
          <p>${escapeHTML(error.message || "Please try again.")}</p>
          <button class="sf-task-button" data-task-refresh>
            Try Again
          </button>
        </div>
      `;

    } finally {
      loading = false;
    }
  }

  function latestSubmissionMap() {
    const map = new Map();

    cachedSubmissions.forEach(item => {
      if (!map.has(item.task_id)) {
        map.set(item.task_id, item);
      }
    });

    return map;
  }

  function renderStats() {
    const latest = latestSubmissionMap();

    const completed = cachedSubmissions.filter(
      x => x.status === "approved"
    ).length;

    const pending = cachedSubmissions.filter(x =>
      x.status === "submitted" || x.status === "pending"
    ).length;

    const available = cachedTasks.filter(task => {
      const sub = latest.get(task.id);
      return !sub || sub.status === "rejected";
    }).length;

    return `
      <div class="sf-task-stats">
        <div class="sf-task-stat">
          <div class="sf-task-stat-icon">✦</div>
          <div class="sf-task-stat-label">AVAILABLE</div>
          <div class="sf-task-stat-value">${available}</div>
        </div>

        <div class="sf-task-stat">
          <div class="sf-task-stat-icon">◷</div>
          <div class="sf-task-stat-label">IN REVIEW</div>
          <div class="sf-task-stat-value">${pending}</div>
        </div>

        <div class="sf-task-stat">
          <div class="sf-task-stat-icon">✓</div>
          <div class="sf-task-stat-label">COMPLETED</div>
          <div class="sf-task-stat-value">${completed}</div>
        </div>
      </div>
    `;
  }

  function taskCard(task, submission) {
    const status = submission?.status;
    let action = "";

    if (status === "approved") {
      action = `
        <span class="sf-task-status approved">
          Completed
        </span>
      `;
    } else if (status === "submitted" || status === "pending") {
      action = `
        <span class="sf-task-status pending">
          Under review
        </span>
      `;
    } else {
      action = `
        <button class="sf-task-button"
          data-task-submit="${escapeHTML(task.id)}">
          ${status === "rejected" ? "Submit Again" : "Start Task"}
        </button>
      `;
    }

    return `
      <article class="sf-task-card">
        <div class="sf-task-card-top">
          <div class="sf-task-symbol">✦</div>
          ${
            status
              ? `<span class="sf-task-status ${escapeHTML(status)}">
                   ${escapeHTML(status)}
                 </span>`
              : ""
          }
        </div>

        <h4>${escapeHTML(task.title)}</h4>

        <p>
          ${escapeHTML(
            task.description ||
            "Complete this activity and submit your work for review."
          )}
        </p>

        <div class="sf-task-reward-box">
          <span class="sf-task-reward-label">TASK REWARD</span>
          <span class="sf-task-reward">
            ${escapeHTML(getReward(task))}
          </span>
        </div>

        ${action}
      </article>
    `;
  }

  function submissionCard(submission) {
    const taskTitle = submission.tasks?.title || "Task submission";
    const status = submission.status || "submitted";

    const date = submission.created_at
      ? new Date(submission.created_at).toLocaleDateString()
      : "Date unavailable";

    return `
      <article class="sf-task-card">
        <div class="sf-task-card-top">
          <div class="sf-task-symbol">▤</div>

          <span class="sf-task-status ${escapeHTML(status)}">
            ${escapeHTML(status)}
          </span>
        </div>

        <h4>${escapeHTML(taskTitle)}</h4>

        <p>Submitted: ${escapeHTML(date)}</p>

        ${
          submission.review_note
            ? `<p class="sf-task-review-note">
                 ${escapeHTML(submission.review_note)}
               </p>`
            : ""
        }
      </article>
    `;
  }

  function renderTasks() {
    const view = createTasksView();
    const latest = latestSubmissionMap();

    let content = "";

    if (currentTab === "available") {
      const available = cachedTasks.filter(task => {
        const sub = latest.get(task.id);
        return !sub || sub.status === "rejected";
      });

      content = available.length
        ? `
          <div class="sf-task-grid">
            ${available.map(task =>
              taskCard(task, latest.get(task.id))
            ).join("")}
          </div>
        `
        : `
          <div class="sf-task-empty">
            <div class="sf-task-empty-icon">✦</div>
            <strong>No new tasks available</strong>
            Check back later for new opportunities.
          </div>
        `;

    } else if (currentTab === "submissions") {
      content = cachedSubmissions.length
        ? `
          <div class="sf-task-grid">
            ${cachedSubmissions.map(submissionCard).join("")}
          </div>
        `
        : `
          <div class="sf-task-empty">
            <div class="sf-task-empty-icon">▤</div>
            <strong>No submissions yet</strong>
            Your submitted tasks will appear here.
          </div>
        `;

    } else {
      const completed = cachedSubmissions.filter(
        x => x.status === "approved"
      );

      content = completed.length
        ? `
          <div class="sf-task-grid">
            ${completed.map(submissionCard).join("")}
          </div>
        `
        : `
          <div class="sf-task-empty">
            <div class="sf-task-empty-icon">✓</div>
            <strong>No completed tasks yet</strong>
            Your approved tasks will appear here.
          </div>
        `;
    }

    view.innerHTML = `
      ${heroHTML()}
      ${renderStats()}

      <div class="sf-task-tabs">
        <button class="sf-task-tab ${
          currentTab === "available" ? "active" : ""
        }" data-task-tab="available">
          Available Tasks
        </button>

        <button class="sf-task-tab ${
          currentTab === "submissions" ? "active" : ""
        }" data-task-tab="submissions">
          My Submissions
        </button>

        <button class="sf-task-tab ${
          currentTab === "completed" ? "active" : ""
        }" data-task-tab="completed">
          Completed Tasks
        </button>
      </div>

      <div class="sf-task-section-heading">
        <h3>
          ${
            currentTab === "available"
              ? "Explore Tasks"
              : currentTab === "submissions"
                ? "My Submissions"
                : "Completed Tasks"
          }
        </h3>

        <span>
          ${
            currentTab === "available"
              ? cachedTasks.length + " total tasks"
              : ""
          }
        </span>
      </div>

      ${content}
    `;
  }

  async function submitTask(taskId) {
    if (submitting) return;

    const client = getClient();
    const user = getUser();

    if (!client || !user || !user.id) {
      notify("Please sign in first.");
      return;
    }

    submitting = true;

    try {
      const task = await client.from("tasks")
        .select("id,title")
        .eq("id", taskId)
        .eq("status", "active")
        .single();

      if (task.error || !task.data) {
        throw new Error("This task is no longer available.");
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

      const result = await client.from("task_submissions").insert({
        task_id: taskId,
        user_id: user.id,
        submission_text: submissionText.trim(),
        evidence: evidence ? evidence.trim() : null,
        status: "submitted"
      });

      if (result.error) throw result.error;

      notify("Your task has been submitted for review.");

      currentTab = "submissions";

      await loadTasks();

    } catch (error) {
      console.error("Task submission error:", error);

      notify(
        "Submission failed: " +
        (error.message || "Please try again.")
      );

    } finally {
      submitting = false;
    }
  }

  /* Task Centre tab and submission controls */
  document.addEventListener("click", function (event) {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const tab = target.closest("[data-task-tab]");

    if (tab) {
      currentTab = tab.dataset.taskTab;
      renderTasks();
      return;
    }

    const submit = target.closest("[data-task-submit]");

    if (submit) {
      submitTask(submit.dataset.taskSubmit);
      return;
    }

    if (target.closest("[data-task-refresh]")) {
      loadTasks();
    }
  });

  /* Intercept dashboard Task Centre navigation */
  window.addEventListener("click", function (event) {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const taskLink = target.closest(
      '[data-view="tasks"], [data-sf-dashboard-view="tasks"]'
    );

    if (!taskLink) return;

    event.preventDefau
