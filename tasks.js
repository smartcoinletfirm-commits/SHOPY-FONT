
/* SHOPY FONT — Live Tasks Centre */
(function () {
  "use strict";

  window.SF = window.SF || {};

  const $ = (id) => document.getElementById(id);

  const escape = (value) =>
    SF.escapeHtml
      ? SF.escapeHtml(String(value ?? ""))
      : String(value ?? "").replace(/[&<>"']/g, c => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;",
          '"': "&quot;", "'": "&#39;"
        }[c]));

  function client() {
    return SF.getClient();
  }

  function moneyKES(value) {
    return "KES " + Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function createPage() {
    if ($("tasksView")) return;

    const main = document.querySelector("main");
    if (!main) return;

    const section = document.createElement("section");
    section.id = "tasksView";
    section.className = "view page-view";

    section.innerHTML = `
      <div class="page-heading">
        <p class="eyebrow">LEARN · COMPLETE · EARN</p>
        <h1>Tasks Centre</h1>
        <p>Explore available tasks, submit your work and track your rewards.</p>
      </div>

      <div class="sf-task-summary">
        <article class="sf-task-stat">
          <span>Available tasks</span>
          <strong id="sfTaskAvailable">—</strong>
        </article>
        <article class="sf-task-stat">
          <span>My submissions</span>
          <strong id="sfTaskSubmissions">—</strong>
        </article>
        <article class="sf-task-stat">
          <span>Approved rewards</span>
          <strong id="sfTaskRewards">KES —</strong>
        </article>
      </div>

      <div class="sf-task-tabs">
        <button class="sf-task-tab active" data-task-tab="available">
          Available tasks
        </button>
        <button class="sf-task-tab" data-task-tab="submissions">
          My submissions
        </button>
      </div>

      <div id="sfAvailableTasks" class="sf-task-list">
        <p>Loading available tasks...</p>
      </div>

      <div id="sfMyTaskSubmissions" class="sf-task-list hidden">
        <p>Loading your submissions...</p>
      </div>

      <p class="notice">
        Task rewards are subject to review. Starting or submitting a task
        does not automatically create earnings.
      </p>
    `;

    main.appendChild(section);
  }

  function addDashboardShortcut() {
    const dashboard = $("approvedDashboard");
    if (!dashboard || dashboard.classList.contains("hidden")) return;
    if (dashboard.querySelector('[data-view="tasks"]')) return;

    const container =
      dashboard.querySelector(".sf-quick-grid") ||
      dashboard.querySelector(".dashboard-grid") ||
      dashboard;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sf-quick-card";
    button.dataset.view = "tasks";
    button.innerHTML = `
      <span class="sf-quick-icon">✓</span>
      <strong>Tasks Centre</strong>
      <small>Explore tasks and track rewards.</small>
    `;

    container.appendChild(button);
  }

  function showError(container, message) {
    container.innerHTML = `<p class="sf-task-empty">${escape(message)}</p>`;
  }

  async function loadTasks() {
    const container = $("sfAvailableTasks");
    if (!container) return;

    container.innerHTML = "<p>Loading available tasks...</p>";

    const { data, error } = await client()
      .from("tasks")
      .select("id,title,description,task_type,reward_points,reward_kes,requires_review")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      showError(container, "Unable to load tasks. Please try again.");
      console.error("Tasks loading error:", error);
      return;
    }

    const tasks = data || [];
    $("sfTaskAvailable").textContent = tasks.length;

    if (!tasks.length) {
      container.innerHTML = `
        <div class="sf-task-empty">
          <h2>No tasks available yet</h2>
          <p>New tasks will appear here when administrators publish them.</p>
        </div>`;
      return;
    }

    container.innerHTML = tasks.map(task => `
      <article class="sf-task-card">
        <div class="sf-task-card-top">
          <span class="sf-task-type">${escape(task.task_type)}</span>
          <span class="sf-task-reward">${moneyKES(task.reward_kes)}</span>
        </div>
        <h2>${escape(task.title)}</h2>
        <p>${escape(task.description)}</p>
        <p class="sf-task-points">
          ${Number(task.reward_points || 0).toLocaleString()} reward points
        </p>
        <button
          type="button"
          class="btn btn-primary sf-task-submit"
          data-task-id="${escape(task.id)}"
          data-task-title="${escape(task.title)}">
          Submit completed work
        </button>
        <form class="sf-task-form hidden" data-form-task="${escape(task.id)}">
          <label>Describe your completed work</label>
          <textarea name="submission_text" required
            placeholder="Explain what you completed..." rows="4"></textarea>
          <label>Evidence or proof (optional)</label>
          <textarea name="evidence"
            placeholder="Paste a link or provide evidence..." rows="3"></textarea>
          <button type="submit" class="btn btn-primary">Send submission</button>
        </form>
      </article>
    `).join("");
  }

  async function loadSubmissions() {
    const container = $("sfMyTaskSubmissions");
    if (!container) return;

    container.innerHTML = "<p>Loading your submissions...</p>";

    const { data, error } = await client()
      .from("task_submissions")
      .select(`
        id,task_id,submission_text,evidence,status,
        submitted_at,reviewed_at,review_reason,
        tasks(title,reward_kes,reward_points)
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      showError(container, "Unable to load your submissions.");
      console.error("Submission loading error:", error);
      return;
    }

    const submissions = data || [];
    $("sfTaskSubmissions").textContent = submissions.length;

    const approved = submissions.filter(
      item => item.status === "approved"
    );

    const rewardTotal = approved.reduce(
      (total, item) => total + Number(item.tasks?.reward_kes || 0), 0
    );

    $("sfTaskRewards").textContent = moneyKES(rewardTotal);

    if (!submissions.length) {
      container.innerHTML = `
        <div class="sf-task-empty">
          <h2>No submissions yet</h2>
          <p>Your submitted work and review decisions will appear here.</p>
        </div>`;
      return;
    }

    container.innerHTML = submissions.map(item => {
      const status = String(item.status || "submitted").toLowerCase();
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

      return `
        <article class="sf-task-card">
          <h2>${escape(item.tasks?.title || "Task")}</h2>
          <p>Status: <strong>${escape(statusLabel)}</strong></p>
          <p>Submitted: ${escape(
            new Date(item.submitted_at).toLocaleString()
          )}</p>
          ${status === "approved"
            ? `<p>Approved reward: ${moneyKES(item.tasks?.reward_kes)}</p>`
            : ""}
          ${item.review_reason
            ? `<p>Review note: ${escape(item.review_reason)}</p>`
            : ""}
        </article>`;
    }).join("");
  }

  async function submitTask(form) {
    const taskId = form.dataset.formTask;
    const submitButton = form.querySelector('[type="submit"]');
    const submissionText = form.elements.submission_text.value.trim();
    const evidence = form.elements.evidence.value.trim();

    if (!submissionText) {
      SF.showToast("Please describe the work you completed.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const { error } = await client()
      .from("task_submissions")
      .insert({
        task_id: taskId,
        user_id: SF.currentUser.id,
        submission_text: submissionText,
        evidence: evidence || null,
        status: "submitted"
      });

    submitButton.disabled = false;
    submitButton.textContent = "Send submission";

    if (error) {
      console.error("Task submission error:", error);
      SF.showToast("Submission failed. Please try again.");
      return;
    }

    SF.showToast("Your task has been submitted for review.");
    form.reset();
    form.classList.add("hidden");

    await loadSubmissions();
  }

  function openPage() {
    createPage();

    document.querySelectorAll(".view").forEach(view => {
      view.classList.toggle("active", view.id === "tasksView");
    });

    history.replaceState(null, "", "#tasks");
    window.scrollTo({ top: 0, behavior: "smooth" });

    loadTasks();
    loadSubmissions();
  }

  document.addEventListener("click", async function (event) {
    const trigger = event.target.closest('[data-view="tasks"]');
    if (trigger) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!SF.currentUser) {
        SF.navigate("auth");
        SF.setAuthTab("login");
        return;
      }

      try {
        const profile = SF.profile || await SF.loadProfile();

        if (String(profile?.account_status).toLowerCase() !== "approved") {
          SF.showToast("Membership approval is required to access tasks.");
          SF.navigate("dashboard");
          return;
        }

        openPage();
      } catch (error) {
        SF.showToast("Unable to verify membership.");
      }
      return;
    }

    const taskButton = event.target.closest(".sf-task-submit");
    if (taskButton) {
      const form = document.querySelector(
        `[data-form-task="${taskButton.dataset.taskId}"]`
      );
      form?.classList.toggle("hidden");
      return;
    }

    const tab = event.target.closest("[data-task-tab]");
    if (tab) {
      const selected = tab.dataset.taskTab;

      document.querySelectorAll("[data-task-tab]").forEach(button => {
        button.classList.toggle("active", button === tab);
      });

      $("sfAvailableTasks")?.classList.toggle("hidden", selected !== "available");
      $("sfMyTaskSubmissions")?.classList.toggle("hidden", selected !== "submissions");
    }
  }, true);

  document.addEventListener("submit", function (event) {
    const form = event.target.closest(".sf-task-form");
    if (!form) return;

    event.preventDefault();
    submitTask(form);
  });

  function install() {
    createPage();
    addDashboardShortcut();

    if (SF.loadDashboard && !SF.tasksDashboardWrapped) {
      const original = SF.loadDashboard;

      SF.loadDashboard = async function () {
        const result = await original.apply(this, arguments);
        addDashboardShortcut();
        return result;
      };

      SF.tasksDashboardWrapped = true;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
      
