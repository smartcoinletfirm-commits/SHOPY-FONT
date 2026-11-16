
/* SHOPY FONT — ADMIN TASKS MANAGER */
(function () {
  "use strict";

  const SF = window.SF;
  if (!SF) return;

  const db = () => SF.getClient();
  const esc = value => SF.adminEscape(value ?? "");

  const originalTabs = SF.adminTabs;
  const originalLoad = SF.loadAdmin;
  const originalBind = SF.adminBindActions;

  /* ADD TASKS TAB */
  SF.adminTabs = function () {
    return originalTabs() + `
      <button class="btn ${SF.adminTab === "tasks" ? "btn-gold" : "btn-outline"}"
        data-admin-tab="tasks">Tasks Manager</button>
    `;
  };

  /* LOAD TASK MANAGER */
  SF.loadAdmin = async function (tab = SF.adminTab || "notifications") {
    if (tab !== "tasks") {
      return originalLoad.apply(this, arguments);
    }

    const box = document.getElementById("adminContent");
    if (!box) return;

    if (!SF.currentUser || !(await SF.checkAdmin())) {
      box.innerHTML = "<p>Administrator access is required.</p>";
      return;
    }

    SF.adminTab = "tasks";
    box.innerHTML = '<p class="muted">Loading Tasks Manager...</p>';

    try {
      box.innerHTML = SF.adminTabs() + await SF.adminTasks();
      SF.adminBindActions(box);
    } catch (error) {
      box.innerHTML = SF.adminTabs() +
        `<p class="form-message">${esc(error.message)}</p>`;
    }
  };

  /* TASKS MANAGER CONTENT */
  SF.adminTasks = async function () {
    const [taskResult, submissionResult] = await Promise.all([
      db().from("tasks")
        .select("id,title,description,task_type,reward_points,reward_kes,is_active,requires_review,created_at")
        .order("created_at", { ascending: false }),

      db().from("task_submissions")
        .select("id,task_id,user_id,submission_text,evidence,status,submitted_at,reviewed_at,review_reason")
        .order("submitted_at", { ascending: false })
    ]);

    if (taskResult.error) throw taskResult.error;
    if (submissionResult.error) throw submissionResult.error;

    const tasks = taskResult.data || [];
    const submissions = submissionResult.data || [];

    const userIds = [...new Set(submissions.map(s => s.user_id))];
    let profiles = [];

    if (userIds.length) {
      const result = await db().from("profiles")
        .select("id,full_name,email,phone")
        .in("id", userIds);

      if (result.error) throw result.error;
      profiles = result.data || [];
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    return `
      <div class="admin-task-manager">
        <h2>Tasks Manager</h2>
        <p class="muted">
          Publish genuine tasks, manage availability and review member submissions.
        </p>

        <form id="sfAdminTaskForm" class="form-card">
          <h3 id="sfAdminTaskFormTitle">Publish a new task</h3>

          <input type="hidden" name="id">

          <label>Task title
            <input name="title" required maxlength="150"
              placeholder="Enter task title">
          </label>

          <label>Task instructions
            <textarea name="description" required rows="5"
              placeholder="Explain exactly what the member must do"></textarea>
          </label>

          <label>Task category/type
            <input name="task_type" required maxlength="80"
              placeholder="Example: Research, Promotion, Writing">
          </label>

          <label>Reward points
            <input name="reward_points" type="number" min="0"
              step="1" required value="0">
          </label>

          <label>Task reward (KES)
            <input name="reward_kes" type="number" min="0.01"
              step="0.01" required placeholder="Enter task reward">
          </label>

          <label>
            <input type="checkbox" name="requires_review" checked>
            Require administrator review
          </label>

          <label>
            <input type="checkbox" name="is_active" checked>
            Publish task immediately
          </label>

          <div class="admin-actions">
            <button type="submit" class="btn btn-gold">
              Save task
            </button>
            <button type="button" class="btn btn-outline"
              id="sfCancelTaskEdit">Clear form</button>
          </div>
        </form>

        <h3>Published and paused tasks (${tasks.length})</h3>

        ${tasks.length ? tasks.map(task => `
          <article class="admin-row" style="display:block;margin:12px 0;padding:15px;">
            <div class="admin-actions">
              <strong>${esc(task.title)}</strong>
              <span class="status-pill">
                ${task.is_active ? "ACTIVE" : "PAUSED"}
              </span>
            </div>

            <p>${esc(task.description)}</p>
            <p>Type: ${esc(task.task_type)}</p>
            <p>Reward: ${esc(task.reward_kes)} KES</p>
            <p>Points: ${esc(task.reward_points)}</p>
            <p>Review required: ${task.requires_review ? "Yes" : "No"}</p>

            <div class="admin-actions">
              <button class="btn btn-outline"
                data-edit-task="${task.id}">Edit task</button>
              <button class="btn btn-gold"
                data-toggle-task="${task.id}"
                data-active="${task.is_active ? "true" : "false"}">
                ${task.is_active ? "Pause task" : "Reactivate task"}
              </button>
            </div>
          </article>
        `).join("") : `<p class="muted">No tasks have been created yet.</p>`}

        <h3>Member submissions (${submissions.length})</h3>

        ${submissions.length ? submissions.map(submission => {
          const task = taskMap.get(submission.task_id) || {};
          const member = profileMap.get(submission.user_id) || {};
          const status = String(submission.status || "").toLowerCase();

          return `
            <article class="admin-row" style="display:block;margin:12px 0;padding:15px;">
              <h3>${esc(task.title || "Task")}</h3>

              <p><strong>Member:</strong> ${esc(member.full_name || "Member")}</p>
              <p><strong>Email:</strong> ${esc(member.email || "Not available")}</p>
              <p><strong>Phone:</strong> ${esc(member.phone || "Not available")}</p>
              <p><strong>Status:</strong> ${esc(status)}</p>

              <p><strong>Submitted work:</strong></p>
              <p>${esc(submission.submission_text || "No written details")}</p>

              <p><strong>Evidence:</strong></p>
              <p>${esc(submission.evidence || "No evidence supplied")}</p>

              <p class="muted">
                Submitted: ${esc(new Date(submission.submitted_at).toLocaleString())}
              </p>

              ${submission.review_reason
                ? `<p><strong>Review note:</strong> ${esc(submission.review_reason)}</p>`
                : ""}

              ${status === "submitted" ? `
                <div class="admin-actions">
                  <button class="btn btn-gold"
                    data-approve-task="${submission.id}">
                    Approve and credit reward
                  </button>
                  <button class="btn btn-outline"
                    data-reject-task="${submission.id}">
                    Reject submission
                  </button>
                </div>
              ` : ""}

              ${status === "approved" ? `
                <button class="btn btn-outline"
                  data-retry-task-credit="${submission.id}">
                  Check / retry reward credit
                </button>
              ` : ""}
            </article>
          `;
        }).join("") : `<p class="muted">No member submissions yet.</p>`}
      </div>
    `;
  };

  /* CLEAR TASK FORM */
  function clearTaskForm() {
    const form = document.getElementById("sfAdminTaskForm");
    if (!form) return;

    form.reset();
    form.elements.id.value = "";
    document.getElementById("sfAdminTaskFormTitle").textContent =
      "Publish a new task";
  }

  /* CREATE OR EDIT TASK */
  async function saveTask(form) {
    const values = Object.fromEntries(new FormData(form).entries());

    const task = {
      title: values.title.trim(),
      description: values.description.trim(),
      task_type: values.task_type.trim(),
      reward_points: Number(values.reward_points),
      reward_kes: Number(values.reward_kes),
      requires_review: form.elements.requires_review.checked,
      is_active: form.elements.is_active.checked
    };

    if (
      !task.title ||
      !task.description ||
      !task.task_type ||
      !Number.isInteger(task.reward_points) ||
      task.reward_points < 0 ||
      !Number.isFinite(task.reward_kes) ||
      task.reward_kes <= 0
    ) {
      throw new Error("Check the task details and reward amounts.");
    }

    let result;

    if (values.id) {
      result = await db().from("tasks")
        .update(task)
        .eq("id", values.id);
    } else {
      task.created_by = SF.currentUser.id;
      result = await db().from("tasks").insert(task);
    }

    if (result.error) throw result.error;

    SF.showToast(values.id ? "Task updated." : "Task published.");
    await SF.loadAdmin("tasks");
  }

  /* EDIT TASK */
  async function editTask(id) {
    const { data, error } = await db().from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const form = document.getElementById("sfAdminTaskForm");
    form.elements.id.value = data.id;
    form.elements.title.value = data.title;
    form.elements.description.value = data.description;
    form.elements.task_type.value = data.task_type;
    form.elements.reward_points.value = data.reward_points;
    form.elements.reward_kes.value = data.reward_kes;
    form.elements.requires_review.checked = data.requires_review;
    form.elements.is_active.checked = data.is_active;

    document.getElementById("sfAdminTaskFormTitle").textContent =
      "Edit task";

    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* PAUSE OR REACTIVATE */
  async function toggleTask(id, currentlyActive) {
    const next = !currentlyActive;

    const { error } = await db().from("tasks")
      .update({ is_active: next })
      .eq("id", id);

    if (error) throw error;

    SF.showToast(next ? "Task reactivated." : "Task paused.");
    await SF.loadAdmin("tasks");
  }

  /* CONVERT KES TASK REWARD TO USD */
  async function getTaskRewardUsd(taskId) {
    const { data: task, error: taskError } = await db()
      .from("tasks")
      .select("reward_kes")
      .eq("id", taskId)
      .single();

    if (taskError) throw taskError;

    const { data: rate, error: rateError } = await db()
      .from("sf_wallet_fx_rates")
      .select("units_per_usd")
      .eq("currency_code", "KES")
      .single();

    if (rateError) throw rateError;

    const kesPerUsd = Number(rate.units_per_usd);
    const rewardKes = Number(task.reward_kes);

    if (!Number.isFinite(kesPerUsd) || kesPerUsd <= 0) {
      throw new Error("The KES-to-USD exchange rate is not configured.");
    }

    const amountUsd = Math.round((rewardKes / kesPerUsd) * 100) / 100;

    if (amountUsd <= 0) {
      throw new Error("The calculated USD reward is invalid.");
    }

    return amountUsd;
  }

  /* CREDIT AN APPROVED SUBMISSION */
  async function creditReward(submissionId) {
    const { data: submission, error } = await db()
      .from("task_submissions")
      .select("id,task_id,user_id,status")
      .eq("id", submissionId)
      .single();

    if (error) throw error;

    if (submission.status !== "approved") {
      throw new Error("Approve the submission before crediting its reward.");
    }

    const amountUsd = await getTaskRewardUsd(submission.task_id);

    const { data, error: creditError } = await db().rpc(
      "sf_admin_credit_task_reward",
      {
        p_submission_id: submissionId,
        p_amount_usd: amountUsd
      }
    );

    if (creditError) throw creditError;
    if (data?.success !== true) {
      throw new Error(data?.message || "Reward credit was not confirmed.");
    }

    SF.showToast(data.duplicate
      ? "This reward was already credited."
      : "Approved reward credited: USD " + amountUsd.toFixed(2));

    await SF.loadAdmin("tasks");
  }

  /* APPROVE SUBMISSION THEN CREDIT */
  async function approveSubmission(id) {
    if (!confirm("Approve this work and credit its calculated USD reward?")) {
      return;
    }

    const { data: submission, error } = await db()
      .from("task_submissions")
      .select("id,status")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (submission.status !== "submitted") {
      throw new Error("This submission has already been reviewed.");
    }

    const { error: updateError } = await db()
      .from("task_submissions")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: SF.currentUser.id,
        review_reason: null
      })
      .eq("id", id)
      .eq("status", "submitted");

    if (updateError) throw updateError;

    try {
      await creditReward(id);
    } catch (creditError) {
      SF.showToast(
        "Submission approved, but reward credit needs retry: " +
        creditError.message
      );
      await SF.loadAdmin("tasks");
    }
  }

  /* REJECT SUBMISSION */
  async function rejectSubmission(id) {
    const reason = prompt("Enter the reason for rejecting this submission:");
    if (reason === null) return;

    if (!reason.trim()) {
      throw new Error("A rejection reason is required.");
    }

    const { error } = await db()
      .from("task_submissions")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: SF.currentUser.id,
        review_reason: reason.trim()
      })
      .eq("id", id)
      .eq("status", "submitted");

    if (error) throw error;

    SF.showToast("Submission rejected.");
    await SF.loadAdmin("tasks");
  }

  /* CONNECT ADMIN BUTTONS */
  SF.adminBindActions = function (box) {
    originalBind(box);

    box.querySelectorAll("[data-admin-tab='tasks']").forEach(button => {
      button.addEventListener("click", () => SF.loadAdmin("tasks"));
    });

    const form = box.querySelector("#sfAdminTaskForm");
    form?.addEventListener("submit", async event => {
      event.preventDefault();

      try {
        await saveTask(form);
      } catch (error) {
        SF.showToast(error.message);
      }
    });

    box.querySelector("#sfCancelTaskEdit")
      ?.addEventListener("click", clearTaskForm);

    box.querySelectorAll("[data-edit-task]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await editTask(button.dataset.editTask);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });

    box.querySelectorAll("[data-toggle-task]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await toggleTask(
            button.dataset.toggleTask,
            button.dataset.active === "true"
          );
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });

    box.querySelectorAll("[data-approve-task]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await approveSubmission(button.dataset.approveTask);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });

    box.querySelectorAll("[data-reject-task]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await rejectSubmission(button.dataset.rejectTask);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });

    box.querySelectorAll("[data-retry-task-credit]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await creditReward(button.dataset.retryTaskCredit);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });
  };

})();
