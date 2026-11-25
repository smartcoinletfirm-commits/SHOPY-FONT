
// SHOPY FONT — SCHOLARBRIDGE CONNECTED WRITING WORKSPACE
// Student feedback, returned assignments, revision history and resubmission
(function () {
  "use strict";

  const SF = window.SF = window.SF || {};
  const $ = id => document.getElementById(id);

  const ROOT_ID = "sfAcademicWorkspace";

  let currentSubmission = null;
  let loadingAssignment = false;

  const css = `
  #${ROOT_ID}{margin:26px 0;color:#183b2d}
  #${ROOT_ID} *{box-sizing:border-box}
  .aw-hero{padding:26px;border-radius:18px;background:linear-gradient(125deg,#104b35,#19704b);color:white}
  .aw-hero small{font-size:10px;letter-spacing:1.5px;color:#cce8d6;font-weight:800}
  .aw-hero h2{margin:10px 0;font-size:30px}
  .aw-hero p{color:#e1f0e6;line-height:1.7}
  .aw-layout{display:grid;grid-template-columns:.85fr 1.7fr;gap:18px;margin-top:18px}
  .aw-panel{background:white;border:1px solid #e0eae3;border-radius:15px;padding:20px;min-width:0;box-shadow:0 8px 24px #16452b0b}
  .aw-panel h3{margin:0 0 12px;color:#174d35}
  .aw-muted{color:#718276;font-size:12px;line-height:1.7}
  .aw-assignment{padding:14px;border:1px solid #e4ece6;border-radius:11px;margin-top:12px;background:#fbfdfb}
  .aw-assignment strong{display:block;color:#254b36}
  .aw-tag{display:inline-block;margin-top:8px;padding:5px 9px;border-radius:20px;background:#edf5ef;color:#286342;font-size:10px;font-weight:800}
  .aw-tag.status{background:#fff4d9;color:#755b20}
  .aw-lock{margin-top:15px;padding:15px;border:1px solid #eadfbe;background:#fffaf0;border-radius:12px;color:#755b20;font-size:13px;line-height:1.6}
  .aw-toolbar{display:flex;gap:7px;flex-wrap:wrap;padding:10px;background:#f5f8f6;border:1px solid #e1eae3;border-bottom:0;border-radius:10px 10px 0 0}
  .aw-toolbar button{border:1px solid #d9e5dc;background:white;color:#24563a;border-radius:7px;padding:8px 11px;font-weight:800}
  .aw-title,.aw-editor,.aw-select{width:100%;border:1px solid #dce7df;background:white;color:#203d2d;padding:12px;font:inherit;outline:none}
  .aw-title{border-radius:8px;margin-bottom:10px}
  .aw-select{border-radius:8px;margin:10px 0}
  .aw-editor{min-height:300px;border-radius:0 0 10px 10px;line-height:1.75;overflow-wrap:anywhere}
  .aw-editor:focus{border-color:#39865b;box-shadow:0 0 0 2px #39865b20}
  .aw-editor[contenteditable=false]{background:#f5f7f5}
  .aw-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:13px}
  .aw-btn{border:0;border-radius:9px;padding:11px 16px;background:#176b46;color:white;font-weight:800;cursor:pointer}
  .aw-btn.secondary{background:#edf4ef;color:#20573a}
  .aw-btn:disabled{opacity:.5;cursor:not-allowed}
  .aw-count{font-size:11px;color:#6b7d70;margin-left:auto}
  .aw-message{font-size:12px;line-height:1.6;margin-top:12px}
  .aw-hidden{display:none!important}
  .aw-assignment-card{border:1px solid #e2ebe4;border-radius:10px;padding:13px;margin:10px 0;background:#fbfdfb}
  .aw-assignment-card button{margin-top:8px}
  .aw-feedback{border:1px solid #ead9a8;background:#fffaf0;border-radius:12px;padding:15px;margin:14px 0}
  .aw-feedback h4{margin:0 0 8px;color:#745821}
  .aw-feedback-content{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.75;color:#574622}
  .aw-history{border:1px solid #e2ebe4;border-radius:12px;padding:15px;margin-top:14px;background:#fbfdfb}
  .aw-history h4{margin:0 0 10px;color:#174d35}
  .aw-revision{border-left:3px solid #2c7850;padding:10px 12px;margin:10px 0;background:#f3f8f4;border-radius:0 8px 8px 0}
  .aw-revision small{color:#718276;font-size:11px}
  .aw-revision-body{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;margin-top:8px;font-size:12px;line-height:1.7}
  .aw-status-box{padding:12px;border-radius:10px;background:#f3f8f4;border:1px solid #e1eae3;margin:12px 0;font-size:12px;line-height:1.7}
  @media(max-width:760px){.aw-layout{grid-template-columns:1fr}.aw-editor{min-height:240px}.aw-panel{padding:15px}.aw-count{width:100%;margin:0}}
  `;

  function styles() {
    if ($("sfAcademicStyles")) return;
    const s = document.createElement("style");
    s.id = "sfAcademicStyles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function level() {
    const p = SF.profile || {};
    const value = p.membership_level ?? p.level ?? p.package_level ?? "";
    const match = String(value).match(/[1-4]/);
    return match ? Number(match[0]) : 0;
  }

  function allowed() {
    return String(SF.profile?.account_status || "").toLowerCase() === "approved"
      && [3, 4].includes(level());
  }

  function userId() {
    return SF.currentUser?.id || null;
  }

  function db() {
    return SF.getClient();
  }

  function esc(value) {
    if (typeof SF.escapeHtml === "function") return SF.escapeHtml(String(value ?? ""));
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  // Sanitize saved editor HTML to simple formatting only.
  function cleanHtml(input) {
    const template = document.createElement("template");
    template.innerHTML = String(input || "");

    const allowedTags = new Set([
      "P", "BR", "DIV", "STRONG", "B", "EM", "I", "U",
      "UL", "OL", "LI", "BLOCKQUOTE"
    ]);

    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) return;

        if (child.nodeType !== Node.ELEMENT_NODE) {
          child.remove();
          return;
        }

        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }

        [...child.attributes].forEach(attr => child.removeAttribute(attr.name));
        walk(child);
      });
    };

    walk(template.content);
    return template.innerHTML;
  }

  function plainText(html) {
    const temp = document.createElement("div");
    temp.innerHTML = cleanHtml(html);
    return temp.innerText || temp.textContent || "";
  }

  function wordCount() {
    const text = $("sfAwEditor")?.innerText || "";
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    const display = $("sfAwCount");
    if (display) display.textContent = count + " words";
    return count;
  }

  function message(text, error) {
    const node = $("sfAwStatus");
    if (!node) return;
    node.textContent = text;
    node.style.color = error ? "#b42318" : "#52675a";
  }

  function showFeedback(submission) {
    const panel = $("sfAwFeedback");
    if (!panel) return;

    if (!submission) {
      panel.innerHTML = "";
      panel.classList.add("aw-hidden");
      return;
    }

    panel.classList.remove("aw-hidden");

    const status = String(submission.status || "submitted").toLowerCase();
    const feedback = submission.feedback || "";

    let heading = "Submission status";
    let statusMessage = "Your work has been submitted.";

    if (status === "returned") {
      heading = "Corrections requested";
      statusMessage = "Your administrator has returned this assignment for correction. Read the feedback below, edit your work and resubmit.";
    } else if (status === "reviewed") {
      heading = "Assignment reviewed";
      statusMessage = "Your assignment has been reviewed.";
    } else if (status === "submitted") {
      heading = "Under review";
      statusMessage = "Your assignment has been submitted and is awaiting review.";
    }

    panel.innerHTML = `
      <div class="aw-status-box">
        <strong>${esc(heading)}</strong>
        <div>${esc(statusMessage)}</div>
        <span class="aw-tag ${status === "returned" ? "status" : ""}">
          ${esc(status.toUpperCase())}
        </span>
      </div>

      ${feedback ? `
        <div class="aw-feedback">
          <h4>Administrator feedback</h4>
          <div class="aw-feedback-content">${esc(feedback)}</div>
        </div>
      ` : `
        <div class="aw-feedback">
          <h4>Administrator feedback</h4>
          <div class="aw-feedback-content">No feedback has been added yet.</div>
        </div>
      `}
    `;
  }

  function mount() {
    const root = $("scholarbridgeView");
    if (!root || $(ROOT_ID)) return;

    styles();

    const section = document.createElement("section");
    section.id = ROOT_ID;

    section.innerHTML = `
      <div class="aw-hero">
        <small>SCHOLARBRIDGE · MEMBER WORKSPACE</small>
        <h2>Academic Writing Studio</h2>
        <p>Open your assignment, prepare original work, save drafts, submit your completed work, and respond to administrator feedback.</p>
      </div>

      <div class="aw-layout">
        <aside class="aw-panel">
          <h3>My Task Box</h3>
          <p class="aw-muted">Your published assignments and instructions will appear here.</p>

          <div id="sfAwAssignments">
            <p class="aw-muted">Loading assignments...</p>
          </div>

          <div id="sfAwLock" class="aw-lock aw-hidden"></div>
        </aside>

        <div class="aw-panel">
          <h3>Writing editor</h3>
          <p class="aw-muted" id="sfAwAssignmentDetails">Select an assignment from My Task Box to begin.</p>

          <div id="sfAwFeedback" class="aw-hidden"></div>

          <input id="sfAwTitle" class="aw-title"
            maxlength="180" placeholder="Document or assignment title" disabled>

          <div class="aw-toolbar">
            <button type="button" data-aw-format="bold" title="Bold"><b>B</b></button>
            <button type="button" data-aw-format="italic" title="Italic"><i>I</i></button>
            <button type="button" data-aw-format="underline" title="Underline"><u>U</u></button>
            <button type="button" data-aw-format="insertUnorderedList">• List</button>
            <button type="button" data-aw-format="insertOrderedList">1. List</button>
          </div>

          <div id="sfAwEditor" class="aw-editor"
            contenteditable="false" role="textbox"
            aria-multiline="true"></div>

          <div class="aw-actions">
            <button type="button" class="aw-btn secondary" id="sfAwSave" disabled>Save draft</button>
            <button type="button" class="aw-btn" id="sfAwSubmit" disabled>Submit assignment</button>
            <span class="aw-count" id="sfAwCount">0 words</span>
          </div>

          <p class="aw-message" id="sfAwStatus" aria-live="polite">
            Select an assignment to start writing.
          </p>

          <div id="sfAwHistory" class="aw-hidden"></div>
        </div>
      </div>
    `;

    root.appendChild(section);
    updateAccess();
    loadAssignments();
    wordCount();
  }

  function updateAccess() {
    const canWrite = allowed();
    const lock = $("sfAwLock");
    if (!lock) return;

    if (!canWrite) {
      lock.classList.remove("aw-hidden");
      lock.textContent = "The Writing Studio requires approved Level 3 or Level 4 membership.";
      message("Upgrade or complete membership approval to unlock the editor.", true);
    } else {
      lock.classList.add("aw-hidden");
    }
  }

  async function loadAssignments() {
    const list = $("sfAwAssignments");
    if (!list) return;

    if (!userId()) {
      list.innerHTML = "<p class='aw-muted'>Sign in to view assignments.</p>";
      return;
    }

    try {
      const { data, error } = await db()
        .from("scholarbridge_assignments")
        .select("id,title,instructions,assigned_to,deadline,status,created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const assignments = data || [];

      if (!assignments.length) {
        list.innerHTML = "<p class='aw-muted'>No assignments have been published yet.</p>";
        return;
      }

      list.innerHTML = assignments.map(a => `
        <article class="aw-assignment-card">
          <strong>${esc(a.title)}</strong>
          <span class="aw-tag">${a.deadline ? "Deadline: " + esc(new Date(a.deadline).toLocaleString()) : "No deadline set"}</span>
          <button type="button" class="aw-btn secondary"
            data-aw-open="${esc(a.id)}">Open assignment</button>
        </article>
      `).join("");

    } catch (error) {
      list.innerHTML = "<p class='aw-muted'>Could not load assignments: " + esc(error.message) + "</p>";
    }
  }

  async function openAssignment(id) {
    if (!allowed()) {
      updateAccess();
      return;
    }

    if (loadingAssignment) return;
    loadingAssignment = true;
    currentSubmission = null;

    message("Loading assignment...", false);

    try {
      const { data: assignment, error } = await db()
        .from("scholarbridge_assignments")
        .select("id,title,instructions,deadline,status,assigned_to")
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (error) throw error;

      if (assignment.assigned_to && assignment.assigned_to !== userId()) {
        throw new Error("This assignment is not allocated to your account.");
      }

      window.SF.scholarbridgeCurrentAssignment = assignment;

      $("sfAwTitle").value = assignment.title || "";
      $("sfAwTitle").disabled = false;
      $("sfAwEditor").contentEditable = "true";
      $("sfAwEditor").innerHTML = "";
      $("sfAwSave").disabled = false;
      $("sfAwSubmit").disabled = false;
      $("sfAwSubmit").textContent = "Submit assignment";

      $("sfAwFeedback").innerHTML = "";
      $("sfAwFeedback").classList.add("aw-hidden");
      $("sfAwHistory").innerHTML = "";
      $("sfAwHistory").classList.add("aw-hidden");

      const deadline = assignment.deadline
        ? "Deadline: " + new Date(assignment.deadline).toLocaleString()
        : "No deadline set";

      $("sfAwAssignmentDetails").textContent =
        (assignment.instructions || "No instructions provided.") + " — " + deadline;

      await loadDraft(assignment.id);
      await checkSubmission(assignment.id);
      wordCount();

    } catch (error) {
      message(error.message, true);
    } finally {
      loadingAssignment = false;
    }
  }

  async function loadDraft(assignmentId) {
    const { data, error } = await db()
      .from("scholarbridge_drafts")
      .select("title,body,updated_at")
      .eq("assignment_id", assignmentId)
      .eq("user_id", userId())
      .maybeSingle();

    if (error) throw error;

    if (data) {
      $("sfAwTitle").value = data.title || "";
      $("sfAwEditor").innerHTML = cleanHtml(data.body || "");
      message("Draft restored from online storage. Last saved: " +
        new Date(data.updated_at).toLocaleString());
    } else {
      message("No saved draft yet. You can start writing.");
    }
  }

  async function checkSubmission(assignmentId) {
    const { data, error } = await db()
      .from("scholarbridge_submissions")
      .select("id,title,body,status,feedback,submitted_at,reviewed_at")
      .eq("assignment_id", assignmentId)
      .eq("user_id", userId())
      .maybeSingle();

    if (error) throw error;

    currentSubmission = data || null;

    if (!data) {
      $("sfAwTitle").disabled = false;
      $("sfAwEditor").contentEditable = "true";
      $("sfAwSave").disabled = false;
      $("sfAwSubmit").disabled = false;
      $("sfAwSubmit").textContent = "Submit assignment";
      showFeedback(null);
      await loadRevisionHistory(assignmentId);
      return;
    }

    showFeedback(data);

    const status = String(data.status || "").toLowerCase();

    // Returned work may be corrected and resubmitted.
    if (status === "returned") {
      $("sfAwTitle").value = data.title || "";
      $("sfAwTitle").disabled = true;
      $("sfAwEditor").contentEditable = "true";
      $("sfAwEditor").innerHTML = cleanHtml(data.body || "");
      $("sfAwSave").disabled = false;
      $("sfAwSubmit").disabled = false;
      $("sfAwSubmit").textContent = "Resubmit corrections";

      message("Your assignment has been returned. Read the feedback, correct your work and resubmit.");
    } else {
      // Submitted or reviewed work is locked until admin returns it.
      $("sfAwTitle").value = data.title || "";
      $("sfAwTitle").disabled = true;
      $("sfAwEditor").contentEditable = "false";
      $("sfAwEditor").innerHTML = cleanHtml(data.body || "");
      $("sfAwSave").disabled = true;
      $("sfAwSubmit").disabled = true;

      if (status === "reviewed") {
        message("Your assignment has been reviewed. Your submitted work is preserved.");
      } else {
        message("Assignment submitted on " +
          (data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "unknown date") +
          ". Waiting for administrator review.");
      }
    }

    await loadRevisionHistory(assignmentId);
    wordCount();
  }

  async function loadRevisionHistory(assignmentId) {
    const box = $("sfAwHistory");
    if (!box) return;

    try {
      const { data, error } = await db()
        .from("scholarbridge_submission_revisions")
        .select("id,revision_number,body,feedback_snapshot,submitted_at")
        .eq("assignment_id", assignmentId)
        .eq("user_id", userId())
        .order("revision_number", { ascending: true });

      if (error) throw error;

      const revisions = data || [];

      if (!revisions.length) {
        box.classList.add("aw-hidden");
        box.innerHTML = "";
        return;
      }

      box.classList.remove("aw-hidden");

      box.innerHTML = `
        <div class="aw-history">
          <h4>Revision history (${revisions.length})</h4>
          <p class="aw-muted">Your previous submitted versions are preserved here.</p>
          ${revisions.map(r => `
            <article class="aw-revision">
              <strong>Revision ${esc(r.revision_number)}</strong>
              <br>
              <small>${r.submitted_at ? esc(new Date(r.submitted_at).toLocaleString()) : ""}</small>
              ${r.feedback_snapshot ? `
                <p class="aw-muted"><b>Feedback at this revision:</b> ${esc(r.feedback_snapshot)}</p>
              ` : ""}
              <details>
                <summary>View saved version</summary>
                <div class="aw-revision-body">${cleanHtml(r.body || "")}</div>
              </details>
            </article>
          `).join("")}
        </div>
      `;
    } catch (error) {
      box.classList.remove("aw-hidden");
      box.innerHTML = `
        <div class="aw-history">
          <h4>Revision history</h4>
          <p class="aw-muted">Revision history could not be loaded: ${esc(error.message)}</p>
        </div>
      `;
    }
  }

  async function saveDraft() {
    const assignment = window.SF.scholarbridgeCurrentAssignment;
    if (!assignment || !allowed()) return;

    // Do not allow a locked submission to be overwritten through draft saving.
    if (currentSubmission && currentSubmission.status !== "returned") {
      message("This submission is locked. You can edit it only if the administrator returns it.", true);
      return;
    }

    const title = $("sfAwTitle").value.trim();
    const body = cleanHtml($("sfAwEditor").innerHTML);

    try {
      const { error } = await db()
        .from("scholarbridge_drafts")
        .upsert({
          assignment_id: assignment.id,
          user_id: userId(),
          title,
          body,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "assignment_id,user_id"
        });

      if (error) throw error;

      message("Draft saved online successfully.");
      if (SF.showToast) SF.showToast("Draft saved online.");

    } catch (error) {
      message("Could not save draft: " + error.message, true);
    }
  }

  
async function submitAssignment() {
    const assignment = window.SF.scholarbridgeCurrentAssignment;
    if (!assignment || !allowed()) return;

    const title = $("sfAwTitle").value.trim();
    const body = cleanHtml($("sfAwEditor").innerHTML);
    const text = $("sfAwEditor").innerText.trim();

    if (!title) {
      message("Please enter a document title.", true);
      return;
    }

    if (!text) {
      message("Please write your assignment before submitting.", true);
      return;
    }

    const isResubmission = currentSubmission &&
      String(currentSubmission.status).toLowerCase() === "returned";

    const confirmText = isResubmission
      ? "Resubmit your corrected assignment for review?"
      : "Submit this assignment now? You will not be able to edit it unless it is returned.";

    if (!confirm(confirmText)) return;

    $("sfAwSubmit").disabled = true;
    message(isResubmission ? "Resubmitting corrections..." : "Submitting assignment...");

    try {
      // Save final draft first.
      const { error: draftError } = await db()
        .from("scholarbridge_drafts")
        .upsert({
          assignment_id: assignment.id,
          user_id: userId(),
          title,
          body,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "assignment_id,user_id"
        });

      if (draftError) throw draftError;

      if (isResubmission) {
        // Secure SQL RPC preserves the previous revision.
        const { data: revisionId, error } = await db().rpc(
          "scholarbridge_resubmit_assignment",
          {
            p_submission_id: currentSubmission.id,
            p_body: body
          }
        );

        if (error) throw error;

        message("Corrections resubmitted successfully. Revision saved: " + revisionId);
      } else {
        const { error } = await db()
          .from("scholarbridge_submissions")
          .insert({
            assignment_id: assignment.id,
            user_id: userId(),
            title,
            body,
            status: "submitted"
          });

        if (error) throw error;

        message("Assignment submitted successfully. Your work is now awaiting review.");
      }

      await checkSubmission(assignment.id);

      if (SF.showToast) {
        SF.showToast(isResubmission ? "Corrections resubmitted." : "Assignment submitted.");
      }

    } catch (error) {
      $("sfAwSubmit").disabled = false;
      message("Submission failed: " + error.message, true);
    }
  }

  // Editor toolbar and workspace buttons.
  document.addEventListener("click", async event => {
    const openButton = event.target.closest("[data-aw-open]");
    if (openButton) {
      openAssignment(openButton.dataset.awOpen);
      return;
    }

    const formatButton = event.target.closest("[data-aw-format]");
    if (formatButton && allowed() && $("sfAwEditor")?.contentEditable === "true") {
      $("sfAwEditor").focus();
      document.execCommand(formatButton.dataset.awFormat, false, null);
      wordCount();
      return;
    }

    if (event.target.closest("#sfAwSave")) {
      saveDraft();
      return;
    }

    if (event.target.closest("#sfAwSubmit")) {
      submitAssignment();
    }
  });

  // Keep word count updated while the student writes.
  document.addEventListener("input", event => {
    if (event.target.id === "sfAwEditor") wordCount();
  });

  // Reopen and refresh workspace when ScholarBridge navigation occurs.
  const originalNavigate = SF.navigate;

  if (typeof originalNavigate === "function") {
    SF.navigate = async function (view) {
      const result = await originalNavigate.apply(this, arguments);

      if (view === "scholarbridge") {
        setTimeout(() => {
          mount();
          updateAccess();
          loadAssignments();
        }, 0);
      }

      return result;
    };
  }

  // Initial workspace mount.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  // Expose mount function for existing app navigation.
  SF.mountAcademicWriting = mount;

})();

