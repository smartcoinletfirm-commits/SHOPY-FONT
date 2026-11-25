
(function () {
  "use strict";

  const SF = window.SF;
  if (!SF) return;

  const client = () => SF.getClient();

  const esc = (value) => {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  };

  const fmtDate = (value) => {
    if (!value) return "No deadline";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleString();
  };

  const state = {
    assignments: [],
    submissions: [],
    profiles: [],
    loaded: false
  };

  async function isAdmin() {
    try {
      return await SF.checkAdmin();
    } catch {
      return false;
    }
  }

  async function loadData() {
    const db = client();

    const [a, s, p] = await Promise.all([
      db.from("scholarbridge_assignments")
        .select("*")
        .order("created_at", { ascending: false }),

      db.from("scholarbridge_submissions")
        .select("*")
        .order("submitted_at", { ascending: false }),

      db.from("profiles")
        .select("*")
    ]);

    if (a.error) throw a.error;
    if (s.error) throw s.error;

    state.assignments = a.data || [];
    state.submissions = s.data || [];
    state.profiles = p.data || [];
    state.loaded = true;
  }

  function profile(userId) {
    return state.profiles.find(p => p.id === userId) || {};
  }

  function profileName(userId) {
    const p = profile(userId);
    return p.full_name || p.name || p.email || "Student";
  }

  function profileEmail(userId) {
    return profile(userId).email || "No email";
  }

  function renderAssignments() {
    const rows = state.assignments.map(a => `
      <article class="sb-admin-card">
        <div class="sb-admin-card-head">
          <div>
            <h3>${esc(a.title)}</h3>
            <span class="sb-admin-status">${esc(a.status)}</span>
          </div>
          <div class="sb-admin-actions">
            <button class="sb-admin-btn" data-sb-edit="${a.id}">Edit</button>
            ${a.status === "published"
              ? `<button class="sb-admin-btn warning" data-sb-close="${a.id}">Close</button>`
              : ""}
          </div>
        </div>

        <p>${esc(a.instructions || "")}</p>

        <div class="sb-admin-meta">
          <span>Deadline: ${esc(fmtDate(a.deadline))}</span>
          <span>${a.assigned_to ? "Individual assignment" : "Assigned to all eligible students"}</span>
        </div>
      </article>
    `).join("");

    return `
      <div class="sb-admin-section">
        <div class="sb-admin-section-head">
          <h2>Assignments</h2>
          <button class="sb-admin-btn primary" id="sbCreateAssignment">
            + Create assignment
          </button>
        </div>
        ${rows || '<div class="sb-admin-empty">No assignments created yet.</div>'}
      </div>
    `;
  }

  function renderSubmissions() {
    const rows = state.submissions.map(s => {
      const p = profile(s.user_id);
      const assignment = state.assignments.find(a => a.id === s.assignment_id);
      const status = s.status || "submitted";

      return `
        <article class="sb-admin-card sb-submission-card">
          <div class="sb-admin-card-head">
            <div>
              <h3>${esc(s.title || assignment?.title || "Assignment submission")}</h3>
              <div class="sb-admin-student">
                <strong>${esc(profileName(s.user_id))}</strong>
                <span>${esc(profileEmail(s.user_id))}</span>
              </div>
            </div>
            <span class="sb-admin-status ${esc(status)}">${esc(status)}</span>
          </div>

          <div class="sb-admin-meta">
            <span>Submitted: ${esc(fmtDate(s.submitted_at))}</span>
            <span>Assignment: ${esc(assignment?.title || "Unknown assignment")}</span>
          </div>

          <div class="sb-admin-submission-preview">
            ${esc((s.body || "").replace(/<[^>]*>/g, " ").slice(0, 300))}
          </div>

          <button class="sb-admin-btn primary" data-sb-review="${s.id}">
            Review submission
          </button>
        </article>
      `;
    }).join("");

    return `
      <div class="sb-admin-section">
        <div class="sb-admin-section-head">
          <h2>Student submissions</h2>
          <span>${state.submissions.length} submissions</span>
        </div>
        ${rows || '<div class="sb-admin-empty">No student submissions received yet.</div>'}
      </div>
    `;
  }

  function assignmentForm(existing) {
    const a = existing || {};
    const modal = document.createElement("div");

    modal.className = "sb-admin-modal";
    modal.innerHTML = `
      <div class="sb-admin-modal-box">
        <h2>${a.id ? "Edit assignment" : "Create assignment"}</h2>

        <form id="sbAssignmentForm">
          <label>Assignment title
            <input name="title" required maxlength="200"
              value="${esc(a.title || "")}">
          </label>

          <label>Instructions
            <textarea name="instructions" rows="6" required>${esc(a.instructions || "")}</textarea>
          </label>

          <label>Deadline
            <input name="deadline" type="datetime-local"
              value="${a.deadline ? esc(new Date(a.deadline).toISOString().slice(0,16)) : ""}">
          </label>

          <label>Assign to
            <select name="assigned_to">
              <option value="">All eligible students</option>
              ${state.profiles.map(p => `
                <option value="${p.id}" ${a.assigned_to === p.id ? "selected" : ""}>
                  ${esc(p.full_name || p.email || p.id)}
                </option>
              `).join("")}
            </select>
          </label>

          <label>Status
            <select name="status">
              <option value="draft" ${a.status === "draft" ? "selected" : ""}>Draft</option>
              <option value="published" ${a.status === "published" || !a.id ? "selected" : ""}>Published</option>
              <option value="closed" ${a.status === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </label>

          <div class="sb-admin-modal-actions">
            <button class="sb-admin-btn primary" type="submit">Save assignment</button>
            <button class="sb-admin-btn" type="button" id="sbCancelModal">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#sbCancelModal").onclick = () => modal.remove();

    modal.querySelector("#sbAssignmentForm").onsubmit = async (e) => {
      e.preventDefault();

      const fd = new FormData(e.target);
      const payload = {
        title: fd.get("title").trim(),
        instructions: fd.get("instructions").trim(),
        deadline: fd.get("deadline") || null,
        assigned_to: fd.get("assigned_to") || null,
        status: fd.get("status"),
        updated_at: new Date().toISOString()
      };

      try {
        const db = client();

        let result;

        if (a.id) {
          result = await db.from("scholarbridge_assignments")
            .update(payload)
            .eq("id", a.id);
        } else {
          payload.created_by = (await db.auth.getUser()).data.user?.id;
          result = await db.from("scholarbridge_assignments")
            .insert(payload);
        }

        if (result.error) throw result.error;

        modal.remove();
        await refresh();
        notify("Assignment saved successfully.");
      } catch (err) {
        notify(err.message || "Unable to save assignment.");
      }
    };
  }

  function reviewForm(submission) {
    const assignment = state.assignments.find(a => a.id === submission.assignment_id);
    const modal = document.createElement("div");

    modal.className = "sb-admin-modal";
    modal.innerHTML = `
      <div class="sb-admin-modal-box sb-review-modal">
        <h2>Review submission</h2>

        <p><strong>Student:</strong> ${esc(profileName(submission.user_id))}</p>
        <p><strong>Email:</strong> ${esc(profileEmail(submission.user_id))}</p>
        <p><strong>Assignment:</strong> ${esc(assignment?.title || submission.title || "")}</p>

        <div class="sb-admin-submission-full">
          ${submission.body || ""}
        </div>

        <form id="sbReviewForm">
          <label>Feedback
            <textarea name="feedback" rows="6">${esc(submission.feedback || "")}</textarea>
          </label>

          <label>Status
            <select name="status">
              <option value="reviewed">Reviewed</option>
              <option value="returned">Return to student for corrections</option>
            </select>
          </label>

          <div class="sb-admin-modal-actions">
            <button class="sb-admin-btn primary" type="submit">Save review</button>
            <button class="sb-admin-btn" type="button" id="sbCloseReview">Close</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#sbCloseReview").onclick = () => modal.remove();

    modal.querySelector("#sbReviewForm").onsubmit = async (e) => {
      e.preventDefault();

      const fd = new FormData(e.target);

      try {
        const user = (await client().auth.getUser()).data.user;

        const result = await client()
          .from("scholarbridge_submissions")
          .update({
            feedback: fd.get("feedback"),
            status: fd.get("status"),
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
          })
          .eq("id", submission.id);

        if (result.error) throw result.error;

        modal.remove();
        await refresh();
        notify("Feedback saved successfully.");
      } catch (err) {
        notify(err.message || "Unable to save feedback.");
      }
    };
  }

  function notify(message) {
    if (SF.showToast) {
      SF.showToast(message);
    } else {
      alert(message);
    }
  }

  function bindEvents(root) {
    root.querySelector("#sbCreateAssignment")?.addEventListener("click", () => {
      assignmentForm(null);
    });

    root.querySelectorAll("[data-sb-edit]").forEach(btn => {
      btn.onclick = () => {
        const a = state.assignments.find(x => x.id === btn.dataset.sbEdit);
        if (a) assignmentForm(a);
      };
    });

    root.querySelectorAll("[data-sb-close]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Close this assignment?")) return;

        try {
          const result = await client()
            .from("scholarbridge_assignments")
            .update({ status: "closed", updated_at: new Date().toISOString() })
            .eq("id", btn.dataset.sbClose);

          if (result.error) throw result.error;
          await refresh();
          notify("Assignment closed.");
        } catch (err) {
          notify(err.message || "Unable to close assignment.");
        }
      };
    });

    root.querySelectorAll("[data-sb-review]").forEach(btn => {
      btn.onclick = () => {
        const s = state.submissions.find(x => x.id === btn.dataset.sbReview);
        if (s) reviewForm(s);
      };
    });
  }

  function styles() {
    if (document.getElementById("sbAdminStyles")) return;

    const style = document.createElement("style");
    style.id = "sbAdminStyles";
    style.textContent = `
      .sb-admin-section { margin:24px 0; }
      .sb-admin-section-head { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
      .sb-admin-card { background:#fff; border:1px solid #e5eaf0; border-radius:16px; padding:18px; margin-bottom:14px; color:#182338; }
      .sb-admin-card-head { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start; }
      .sb-admin-card h3 { margin:0 0 8px; }
      .sb-admin-meta { display:flex; flex-wrap:wrap; gap:14px; color:#64748b; font-size:13px; margin:12px 0; }
      .sb-admin-student { display:flex; flex-direction:column; gap:3px; margin-top:5px; font-size:13px; }
      .sb-admin-status { display:inline-block; padding:5px 9px; border-radius:20px; background:#eef2f7; font-size:12px; }
      .sb-admin-status.returned { background:#fff1d8; }
      .sb-admin-status.reviewed { background:#dcfce7; }
      .sb-admin-actions { display:flex; gap:7px; flex-wrap:wrap; }
      .sb-admin-btn { border:1px solid #d5dce5; background:#fff; padding:9px 13px; border-radius:9px; cursor:pointer; font-weight:600; }
      .sb-admin-btn.primary { background:#123d2d; color:#fff; border-color:#123d2d; }
      .sb-admin-btn.warning { background:#fff7e7; color:#8a5b00; }
      .sb-admin-empty { padding:25px; text-align:center; background:#f7f9fc; border-radius:12px; color:#64748b; }
      .sb-admin-submission-preview { background:#f8fafc; border-radius:10px; padding:12px; margin:12px 0; line-height:1.6; }
      .sb-admin-modal { position:fixed; inset:0; background:rgba(7,15,28,.72); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px; overflow:auto; }
      .sb-admin-modal-box { width:min(760px,100%); background:#fff; border-radius:18px; padding:22px; color:#182338; max-height:90vh; overflow:auto; }
      .sb-admin-modal-box label { display:block; font-weight:600; margin:14px 0; }
      .sb-admin-modal-box input, .sb-admin-modal-box textarea, .sb-admin-modal-box select { width:100%; margin-top:7px; padding:11px; border:1px solid #d5dce5; border-radius:9px; font:inherit; box-sizing:border-box; }
      .sb-admin-modal-actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:16px; }
      .sb-admin-submission-full { border:1px solid #e5eaf0; border-radius:12px; padding:16px; margin:16px 0; min-height:120px; max-height:380px; overflow:auto; line-height:1.7; }
      .sb-review-modal { width:min(900px,100%); }
      @media(max-width:600px){ .sb-admin-card { padding:14px; } .sb-admin-modal-box { padding:16px; } }
    `;

    document.head.appendChild(style);
  }

  async function refresh() {
    if (!(await isAdmin())) return;

    const root = document.getElementById("scholarbridgeAdminPanel");
    if (!root) return;

    root.innerHTML = '<div class="sb-admin-empty">Loading ScholarBridge admin…</div>';

    try {
      await loadData();
      root.innerHTML = renderAssignments() + renderSubmissions();
      bindEvents(root);
    } catch (err) {
      root.innerHTML = `<div class="sb-admin-empty">Error loading ScholarBridge: ${esc(err.message)}</div>`;
    }
  }

  async function mount() {
    if (!(await isAdmin())) return;

    styles();

    const adminRoot = document.querySelector("#adminView") || document.querySelector("#adminPanel");
    if (!adminRoot) return;

    let panel = document.getElementById("scholarbridgeAdminPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "scholarbridgeAdminPanel";
      panel.style.display = "none";
      panel.innerHTML = `
        <div class="sb-admin-title">
          <h1>ScholarBridge</h1>
          <p>Assignments, student submissions and academic feedback.</p>
        </div>
      `;
      adminRoot.appendChild(panel);
    }

    const tabs = document.querySelector("#adminTabs");
    if (tabs && !tabs.querySelector('[data-sb-admin-tab]')) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.textContent = "ScholarBridge";
      tab.dataset.sbAdminTab = "scholarbridge";
      tabs.appendChild(tab);

      tab.onclick = () => {
        document.querySelectorAll("#adminTabs button").forEach(b => b.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll("#adminView > *").forEach(el => {
          if (el.id !== "scholarbridgeAdminPanel") el.style.display = "none";
        });

        panel.style.display = "block";
        refresh();
      };
    }
  }

  document.addEventListener("DOMContentLoaded", mount);

  SF.scholarbridgeAdmin = {
    refresh,
    mount
  };

})();
