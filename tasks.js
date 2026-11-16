
/* SHOPY FONT — Tasks Centre */
(function () {
  "use strict";

  window.SF = window.SF || {};

  function addTasksPage() {
    if (document.getElementById("tasksView")) return;

    const main = document.querySelector("main");
    if (!main) return;

    const section = document.createElement("section");
    section.id = "tasksView";
    section.className = "view page-view";

    section.innerHTML = `
      <div class="page-heading">
        <p class="eyebrow">LEARN · COMPLETE · EARN</p>
        <h1>Tasks Centre</h1>
        <p>Complete genuine tasks, submit your work and track your approved rewards.</p>
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
          <strong id="sfTaskRewards">USD —</strong>
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
        <div class="sf-task-empty">
          <h2>Welcome to your Tasks Centre</h2>
          <p>The live task feed is being connected. Genuine administrator-published tasks will appear here.</p>
        </div>
      </div>

      <div id="sfMyTaskSubmissions" class="sf-task-list hidden">
        <div class="sf-task-empty">
          <h2>Your submissions</h2>
          <p>Your submitted tasks and administrator decisions will appear here.</p>
        </div>
      </div>

      <p class="notice">
        Rewards enter your USD wallet only after your submitted work is
        reviewed and approved. Clicking or starting a task does not create earnings.
      </p>
    `;

    main.appendChild(section);
  }

  function addDashboardShortcut() {
    const root = document.getElementById("approvedDashboard");
    if (!root || root.classList.contains("hidden")) return;
    if (root.querySelector('[data-view="tasks"]')) return;

    const grid = root.querySelector(".sf-quick-grid");
    if (!grid) return;

    const card = document.createElement("button");
    card.className = "sf-quick-card";
    card.dataset.view = "tasks";
    card.innerHTML = `
      <span class="sf-quick-icon">✓</span>
      <strong>Tasks Centre</strong>
      <small>Complete tasks and track approved rewards.</small>
    `;

    grid.appendChild(card);
  }

  function openTasks() {
    addTasksPage();

    document.querySelectorAll(".view").forEach(view => {
      view.classList.toggle("active", view.id === "tasksView");
    });

    document.getElementById("mainNav")?.classList.remove("open");

    history.replaceState(null, "", "#tasks");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("click", async function (event) {
    const trigger = event.target.closest('[data-view="tasks"]');
    if (!trigger) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!window.SF.currentUser) {
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

      openTasks();
    } catch (error) {
      SF.showToast("Unable to verify membership. Please try again.");
    }
  }, true);

  document.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-task-tab]");
    if (!tab) return;

    const selected = tab.dataset.taskTab;

    document.querySelectorAll("[data-task-tab]").forEach(button => {
      button.classList.toggle("active", button === tab);
    });

    document.getElementById("sfAvailableTasks")
      ?.classList.toggle("hidden", selected !== "available");

    document.getElementById("sfMyTaskSubmissions")
      ?.classList.toggle("hidden", selected !== "submissions");
  });

  function install() {
    addTasksPage();

    if (window.SF.loadDashboard && !window.SF.tasksDashboardWrapped) {
      const original = window.SF.loadDashboard;

      window.SF.loadDashboard = async function () {
        const result = await original.apply(this, arguments);
        addDashboardShortcut();
        return result;
      };

      window.SF.tasksDashboardWrapped = true;
    }

    addDashboardShortcut();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
                                                         
