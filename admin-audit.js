
/* SHOPY FONT — Admin Audit History
   Reads the protected sf_admin_get_audit_logs RPC.
   Keeps audit history separate from the existing admin.js.
*/

window.SF = window.SF || {};

(function () {
  "use strict";

  const SF = window.SF;
  const PAGE_SIZE = 25;

  let page = 0;
  let actionFilter = "";

  const escape = value => SF.adminEscape
    ? SF.adminEscape(String(value ?? ""))
    : String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

  const formatDate = value => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString();
  };

  SF.adminAudit = async () => {
    const { data, error } = await SF.getClient().rpc(
      "sf_admin_get_audit_logs",
      {
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
        p_action: actionFilter || null
      }
    );

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];

    const cards = rows.map(item => {
      const actor =
        item.actor_name ||
        item.actor_email ||
        "System / unavailable";

      const details = JSON.stringify(
        item.details ?? {},
        null,
        2
      );

      return `
        <article class="admin-row sf-audit-row">
          <div class="sf-audit-main">

            <strong>
              ${escape(item.action || "Unlabelled action")}
            </strong>

            <p class="muted">
              ${escape(item.target_type || "General")}
              ·
              ${escape(item.target_id || "No record ID")}
            </p>

            <p>
              <strong>Administrator:</strong>
              ${escape(actor)}
            </p>

            <small class="muted">
              ${escape(formatDate(item.created_at))}
            </small>

            <details class="sf-audit-details">
              <summary>View event details</summary>
              <pre>${escape(details)}</pre>
            </details>

          </div>
        </article>
      `;
    }).join("");

    return `
      <div class="sf-audit-heading">
        <div>
          <p class="eyebrow">SECURITY & ACCOUNTABILITY</p>
          <h2>Admin audit history</h2>
          <p class="muted">
            A record of important administrator and platform decisions.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-outline"
          id="sfAuditRefresh">
          Refresh
        </button>
      </div>

      <div class="market-tools sf-audit-filter">
        <label for="sfAuditAction">
          Filter by exact action
        </label>

        <input
          id="sfAuditAction"
          type="text"
          maxlength="150"
          value="${escape(actionFilter)}"
          placeholder="Leave blank to show all actions">

        <button
          type="button"
          class="btn btn-gold"
          id="sfAuditApply">
          Apply filter
        </button>
      </div>

      <div class="sf-audit-list">
        ${
          cards ||
          '<p class="muted">No audit events found for this filter.</p>'
        }
      </div>

      <div class="admin-actions sf-audit-pagination">

        <button
          type="button"
          class="btn btn-outline"
          id="sfAuditPrevious"
          ${page === 0 ? "disabled" : ""}>
          Previous
        </button>

        <span class="muted">
          Page ${page + 1}
        </span>

        <button
          type="button"
          class="btn btn-outline"
          id="sfAuditNext"
          ${rows.length < PAGE_SIZE ? "disabled" : ""}>
          Next
        </button>

      </div>
    `;
  };

  SF.adminBindAuditActions = box => {

    const refresh = () => SF.loadAdmin("audit");

    box.querySelector("#sfAuditRefresh")
      ?.addEventListener("click", refresh);

    box.querySelector("#sfAuditApply")
      ?.addEventListener("click", () => {

        actionFilter =
          box.querySelector("#sfAuditAction")?.value.trim() || "";

        page = 0;
        refresh();
      });

    box.querySelector("#sfAuditPrevious")
      ?.addEventListener("click", () => {

        if (page > 0) {
          page -= 1;
          refresh();
        }
      });

    box.querySelector("#sfAuditNext")
      ?.addEventListener("click", () => {

        page += 1;
        refresh();
      });
  };

  /* Add the audit tab without removing existing tabs. */

  const originalTabs = SF.adminTabs;

  SF.adminTabs = function () {

    const existing =
      typeof originalTabs === "function"
        ? originalTabs()
        : "";

    const active = SF.adminTab === "audit";

    return existing + `
      <div class="admin-actions" style="margin:0 0 20px;">
        <button
          class="btn ${active ? "btn-gold" : "btn-outline"}"
          data-admin-tab="audit">
          Audit history
        </button>
      </div>
    `;
  };

  /* Connect the new tab to the existing admin loader. */

  const originalLoadAdmin = SF.loadAdmin;

  SF.loadAdmin = async function (
    tab = SF.adminTab || "notifications"
  ) {

    if (tab !== "audit") {
      return originalLoadAdmin.apply(this, arguments);
    }

    const box = document.getElementById("adminContent");

    if (!box) return;

    if (!SF.currentUser || !(await SF.checkAdmin())) {
      box.innerHTML =
        "<p>Administrator access is required.</p>";
      return;
    }

    SF.adminTab = "audit";

    box.innerHTML =
      '<p class="muted">Loading audit history…</p>';

    try {

      const content = await SF.adminAudit();

      box.innerHTML = SF.adminTabs() + content;

      SF.adminBindActions(box);
      SF.adminBindAuditActions(box);

    } catch (error) {

      box.innerHTML = SF.adminTabs() + `
        <p class="form-message">
          ${escape(error.message || "Could not load audit history.")}
        </p>
      `;
    }
  };

})();
    
