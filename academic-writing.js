
/* SHOPY FONT — SCHOLARBRIDGE WRITING STUDIO */
(function () {
  "use strict";

  const SF = window.SF = window.SF || {};
  const DRAFT_KEY = "sf_academic_draft_v1";
  const $ = id => document.getElementById(id);

  const css = `
  #sfAcademicWorkspace{margin:26px 0;color:#183b2d}
  #sfAcademicWorkspace *{box-sizing:border-box}
  .aw-hero{padding:26px;border-radius:18px;background:linear-gradient(125deg,#104b35,#19704b);color:white}
  .aw-hero small{font-size:10px;letter-spacing:1.5px;color:#cce8d6;font-weight:800}
  .aw-hero h2{margin:10px 0;font-size:30px}
  .aw-hero p{color:#e1f0e6;line-height:1.7}
  .aw-layout{display:grid;grid-template-columns:.8fr 1.7fr;gap:18px;margin-top:18px}
  .aw-panel{background:white;border:1px solid #e0eae3;border-radius:15px;padding:20px;min-width:0;box-shadow:0 8px 24px #16452b0b}
  .aw-panel h3{margin:0 0 12px;color:#174d35}
  .aw-muted{color:#718276;font-size:12px;line-height:1.7}
  .aw-assignment{padding:14px;border:1px solid #e4ece6;border-radius:11px;margin-top:12px;background:#fbfdfb}
  .aw-assignment strong{display:block;color:#254b36}
  .aw-tag{display:inline-block;margin-top:8px;padding:5px 9px;border-radius:20px;background:#edf5ef;color:#286342;font-size:10px;font-weight:800}
  .aw-lock{margin-top:15px;padding:15px;border:1px solid #eadfbe;background:#fffaf0;border-radius:12px;color:#755b20;font-size:13px;line-height:1.6}
  .aw-toolbar{display:flex;gap:7px;flex-wrap:wrap;padding:10px;background:#f5f8f6;border:1px solid #e1eae3;border-bottom:0;border-radius:10px 10px 0 0}
  .aw-toolbar button{border:1px solid #d9e5dc;background:white;color:#24563a;border-radius:7px;padding:8px 11px;font-weight:800}
  .aw-title,.aw-editor{width:100%;border:1px solid #dce7df;background:white;color:#203d2d;padding:12px;font:inherit;outline:none}
  .aw-title{border-radius:8px;margin-bottom:10px}
  .aw-editor{min-height:300px;border-radius:0 0 10px 10px;line-height:1.75;overflow-wrap:anywhere}
  .aw-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:13px}
  .aw-btn{border:0;border-radius:9px;padding:11px 16px;background:#176b46;color:white;font-weight:800;cursor:pointer}
  .aw-btn.secondary{background:#edf4ef;color:#20573a}
  .aw-btn:disabled{opacity:.5;cursor:not-allowed}
  .aw-count{font-size:11px;color:#6b7d70;margin-left:auto}
  .aw-hidden{display:none!important}
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

  function approved() {
    return String(SF.profile?.account_status || "").toLowerCase() === "approved";
  }

  function allowed() {
    return approved() && [3, 4].includes(level());
  }

  function mount() {
    const root = $("scholarbridgeView");
    if (!root || $("sfAcademicWorkspace")) return;

    styles();

    const section = document.createElement("section");
    section.id = "sfAcademicWorkspace";

    section.innerHTML = `
      <div class="aw-hero">
        <small>SCHOLARBRIDGE · MEMBER WORKSPACE</small>
        <h2>Academic Writing Studio</h2>
        <p>Organise assignments, prepare original work, save drafts and track your progress.</p>
      </div>

      <div class="aw-layout">
        <aside class="aw-panel">
          <h3>My Task Box</h3>
          <p class="aw-muted">Assignments allocated to your account will appear here with their instructions and deadlines.</p>

          <div class="aw-assignment">
            <strong>Assignment workspace</strong>
            <span class="aw-tag">Workspace ready</span>
            <p class="aw-muted">Your assigned work will appear here when the assignment database is connected.</p>
          </div>

          <div id="sfAwLock" class="aw-lock aw-hidden"></div>
        </aside>

        <div class="aw-panel">
          <h3>Writing editor</h3>
          <p class="aw-muted">Write in your own words and use references responsibly.</p>

          <input id="sfAwTitle" class="aw-title"
            maxlength="180" placeholder="Document or assignment title">

          <div class="aw-toolbar">
            <button type="button" data-aw-format="bold"><b>B</b></button>
            <button type="button" data-aw-format="italic"><i>I</i></button>
            <button type="button" data-aw-format="underline"><u>U</u></button>
            <button type="button" data-aw-format="insertUnorderedList">• List</button>
            <button type="button" data-aw-format="insertOrderedList">1. List</button>
          </div>

          <div id="sfAwEditor" class="aw-editor"
            contenteditable="true" role="textbox"
            aria-multiline="true"></div>

          <div class="aw-actions">
            <button type="button" class="aw-btn secondary" id="sfAwSave">Save draft</button>
            <button type="button" class="aw-btn" id="sfAwSubmit" disabled>Submit assignment</button>
            <span class="aw-count" id="sfAwCount">0 words</span>
          </div>

          <p class="aw-muted" id="sfAwStatus" aria-live="polite">
            Drafts are stored on this device.
          </p>
        </div>
      </div>
    `;

    root.appendChild(section);
    loadDraft();
    updateAccess();
    countWords();
  }

  function updateAccess() {
    const canWrite = allowed();
    const editor = $("sfAwEditor");
    if (!editor) return;

    $("sfAwTitle").disabled = !canWrite;
    editor.contentEditable = String(canWrite);
    $("sfAwSave").disabled = !canWrite;

    // Submission remains disabled until the real assignment
    // submission service is connected.
    $("sfAwSubmit").disabled = true;

    const lock = $("sfAwLock");

    if (!canWrite) {
      lock.classList.remove("aw-hidden");

      lock.textContent = [1, 2].includes(level())
        ? "The Writing Studio requires Level 3 VIP or Level 4. Upgrade your membership to unlock editing and assignment submission."
        : "Writing access is available after your Level 3 VIP or Level 4 membership has been approved.";

      $("sfAwStatus").textContent = "Upgrade or complete membership approval to unlock the editor.";
    } else {
      lock.classList.add("aw-hidden");
      $("sfAwStatus").textContent =
        "You can write and save drafts on this device. Assignment submission will be enabled when the assignment service is connected.";
    }
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
      $("sfAwTitle").value = draft.title || "";
      $("sfAwEditor").innerHTML = draft.body || "";
    } catch (error) {
      console.warn("Could not load academic draft.", error);
    }
  }

  function saveDraft() {
    if (!allowed()) {
      updateAccess();
      return;
    }

    const draft = {
      title: $("sfAwTitle").value,
      body: $("sfAwEditor").innerHTML,
      saved_at: new Date().toISOString()
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    $("sfAwStatus").textContent = "Draft saved on this device.";
    countWords();

    if (SF.showToast) SF.showToast("Draft saved.");
  }

  function countWords() {
    const text = $("sfAwEditor")?.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if ($("sfAwCount")) $("sfAwCount").textContent = words + " words";
  }

  document.addEventListener("click", event => {
    const format = event.target.closest("[data-aw-format]");

    if (format && $("sfAwEditor") && allowed()) {
      $("sfAwEditor").focus();
      document.execCommand(format.dataset.awFormat, false, null);
      countWords();
    }

    if (event.target.closest("#sfAwSave")) saveDraft();
  });

  document.addEventListener("input", event => {
    if (event.target.id === "sfAwEditor") countWords();
  });

  const originalNavigate = SF.navigate;

  if (typeof originalNavigate === "function") {
    SF.navigate = async function (view) {
      const result = await originalNavigate.apply(this, arguments);

      if (view === "scholarbridge") {
        setTimeout(() => {
          mount();
          updateAccess();
        }, 0);
      }

      return result;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  SF.mountAcademicWriting = mount;
})();
