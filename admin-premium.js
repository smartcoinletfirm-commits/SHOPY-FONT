/* =========================================================
   SHOPY FONT — PREMIUM ADMIN CONTROL CENTER
   Visual layer for the existing admin.js functions.
   Does not replace Supabase queries or database permissions.
========================================================= */

(function () {
  "use strict";

  const SF = window.SF = window.SF || {};

  if (SF.premiumAdminInstalled) return;
  SF.premiumAdminInstalled = true;

  /* PREMIUM ADMIN DESIGN */
  const style = document.createElement("style");

  style.textContent = `
    /* ADMIN PAGE */
    #adminView {
      background: #f4f6fb;
      min-height: 100vh;
      padding: 28px 16px 60px;
    }

    #adminView > .page-heading {
      max-width: 1400px;
      margin: 0 auto 18px;
      padding: 28px 30px;
      border-radius: 22px;
      color: #fff;
      background:
        radial-gradient(circle at 90% 10%, rgba(106,132,255,.35), transparent 35%),
        linear-gradient(125deg, #101a35, #1d2e59 65%, #344c83);
      box-shadow: 0 14px 38px rgba(17,29,59,.16);
    }

    #adminView > .page-heading .eyebrow {
      color: #aebffb;
      letter-spacing: 2px;
      font-weight: 800;
    }

    #adminView > .page-heading h1 {
      color: #fff;
      font-family: Manrope, sans-serif;
      font-size: clamp(26px, 4vw, 38px);
      margin: 8px 0;
    }

    #adminView > .page-heading p:last-child {
      color: #cbd5eb;
    }

    /* MAIN ADMIN PANEL */
    #adminContent {
      max-width: 1400px;
      margin: auto;
      padding: 26px;
      border: 1px solid #e5eaf3;
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 12px 36px rgba(24,39,75,.06);
    }

    /* ADMIN NAVIGATION */
    .sf-admin-premium-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      padding: 4px 0 22px;
    }

    .sf-admin-brand {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .sf-admin-brand-mark {
      width: 48px;
      height: 48px;
      border-radius: 15px;
      display: grid;
      place-items: center;
      color: white;
      font-weight: 900;
      font-size: 17px;
      background: linear-gradient(135deg,#253d83,#6a70dc);
      box-shadow: 0 7px 18px rgba(54,77,165,.25);
    }

    .sf-admin-brand strong {
      display: block;
      color: #18233e;
      font-family: Manrope, sans-serif;
      font-size: 17px;
    }

    .sf-admin-brand small {
      display: block;
      margin-top: 3px;
      color: #8994aa;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    .sf-admin-secure {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 13px;
      border: 1px solid #dcefe5;
      border-radius: 30px;
      background: #f1faf5;
      color: #16804b;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .6px;
    }

    .sf-admin-navigation {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 14px;
      margin: 0 0 25px;
      border: 1px solid #e9edf5;
      border-radius: 16px;
      background: #f8f9fc;
    }

    .sf-admin-navigation .btn {
      border: 1px solid transparent !important;
      border-radius: 11px !important;
      padding: 11px 15px !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      background: transparent !important;
      color: #66728a !important;
      box-shadow: none !important;
      transition: .2s ease;
    }

    .sf-admin-navigation .btn:hover {
      background: #edf1ff !important;
      color: #354da2 !important;
    }

    .sf-admin-navigation .btn.sf-admin-active {
      color: #fff !important;
      background: linear-gradient(120deg,#253d83,#596bd0) !important;
      box-shadow: 0 5px 13px rgba(50,70,150,.18) !important;
    }

    /* SECTION HEADINGS */
    #adminContent h2 {
      color: #172440;
      font-family: Manrope, sans-serif;
      font-size: 23px;
      margin: 10px 0;
    }

    #adminContent h3 {
      color: #253452;
      font-family: Manrope, sans-serif;
    }

    #adminContent .muted {
      color: #8490a5;
    }

    /* MEMBER / PAYMENT / TASK / PRODUCT CARDS */
    #adminContent .admin-row,
    #adminContent article,
    #adminContent details.admin-row {
      border: 1px solid #e7ebf3 !important;
      border-radius: 16px !important;
      background: #fff !important;
      box-shadow: 0 5px 18px rgba(24,39,75,.035);
      transition: border-color .2s ease, box-shadow .2s ease;
    }

    #adminContent .admin-row:hover,
    #adminContent article:hover {
      border-color: #cbd5f3 !important;
      box-shadow: 0 9px 24px rgba(24,39,75,.07);
    }

    #adminContent details.admin-row summary {
      padding: 5px;
    }

    #adminContent details.admin-row summary strong {
      color: #172440;
      font-size: 15px;
    }

    /* FORMS */
    #adminContent .form-card {
      padding: 22px;
      border: 1px solid #e5eaf3;
      border-radius: 17px;
      background: #f9faff;
    }

    #adminContent label {
      color: #43516c;
      font-size: 12px;
      font-weight: 800;
    }

    #adminContent input,
    #adminContent select,
    #adminContent textarea {
      border: 1px solid #dfe5ef !important;
      border-radius: 10px !important;
      background: #fff !important;
      color: #18233e !important;
      padding: 12px !important;
      outline: none;
    }

    #adminContent input:focus,
    #adminContent select:focus,
    #adminContent textarea:focus {
      border-color: #7185dc !important;
      box-shadow: 0 0 0 3px rgba(91,112,207,.11);
    }

    /* BUTTONS */
    #adminContent .btn {
      border-radius: 10px;
      font-weight: 800;
      transition: transform .18s ease, box-shadow .18s ease;
    }

    #adminContent .btn:hover {
      transform: translateY(-1px);
    }

    #adminContent .btn-gold {
      color: #fff !important;
      border: none !important;
      background: linear-gradient(120deg,#344d9b,#6477dc) !important;
      box-shadow: 0 5px 13px rgba(58,77,159,.16);
    }

    #adminContent .btn-outline {
      color: #40538f !important;
      border: 1px solid #d9e0f1 !important;
      background: #fff !important;
    }

    /* STATUS LABELS */
    #adminContent .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 30px;
      background: #eef2ff;
      color: #465db0;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .5px;
    }

    /* PAYMENT PROOF */
    #adminContent img {
      border-radius: 12px;
      border: 1px solid #e5eaf3;
      background: #f7f8fb;
    }

    #adminContent a {
      color: #405bb4;
      font-weight: 700;
    }

    /* EMPTY STATES */
    #adminContent .sf-admin-empty {
      padding: 38px 20px;
      text-align: center;
      border: 1px dashed #d9e0ed;
      border-radius: 16px;
      color: #8792a6;
      background: #fafbfe;
    }

    /* MOBILE */
    @media(max-width:700px) {
      #adminView {
        padding: 14px 9px 40px;
      }

      #adminView > .page-heading {
        padding: 22px 19px;
        border-radius: 17px;
      }

      #adminContent {
        padding: 15px;
        border-radius: 17px;
      }

      .sf-admin-navigation {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 7px;
        padding: 9px;
      }

      .sf-admin-navigation .btn {
        width: 100%;
        padding: 11px 6px !important;
        font-size: 11px !important;
      }

      .sf-admin-secure {
        font-size: 9px;
      }

      #adminContent .form-card {
        padding: 14px;
      }

      #adminContent .admin-actions {
        gap: 7px;
        flex-wrap: wrap;
      }

      #adminContent .admin-actions .btn {
        flex: 1 1 auto;
      }
    }
  `;

  document.head.appendChild(style);

  /* ADMIN NAVIGATION */
  SF.adminTabs = function () {
    const tabs = [
      ["notifications", "Overview"],
      ["members", "User Accounts"],
      ["payments", "Payments"],
      ["fbk", "FBK Review"],
      ["tasks", "Task Manager"],
      ["products", "Products"],
      ["sales", "Sales Approvals"]
    ];

    return `
      <div class="sf-admin-premium-header">
        <div class="sf-admin-brand">
          <div class="sf-admin-brand-mark">SF</div>
          <div>
            <strong>SHOPY FONT</strong>
            <small>ADMIN CONTROL CENTER</small>
          </div>
        </div>

        <span class="sf-admin-secure">
          ● SECURE ADMIN WORKSPACE
        </span>
      </div>

      <nav class="sf-admin-navigation" aria-label="Admin sections">
        ${tabs.map(([key, label]) => `
          <button
            type="button"
            class="btn ${SF.adminTab === key ? "sf-admin-active" : ""}"
            data-admin-tab="${key}"
            ${SF.adminTab === key ? 'aria-current="page"' : ""}
          >${label}</button>
        `).join("")}
      </nav>
    `;
  };

  /* REFRESH NAVIGATION STATE AFTER TAB LOAD */
  function refreshActiveTab() {
    document.querySelectorAll(
      "#adminContent [data-admin-tab]"
    ).forEach(button => {
      const active = button.dataset.adminTab === SF.adminTab;
      button.classList.toggle("sf-admin-active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  /* KEEP ADMIN DESIGN WHEN CONTENT CHANGES */
  const observer = new MutationObserver(() => {
    refreshActiveTab();
  });

  function observeAdmin() {
    const target = document.getElementById("adminContent");

    if (target && !target.dataset.premiumObserved) {
      target.dataset.premiumObserved = "true";

      observer.observe(target, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeAdmin);
  } else {
    observeAdmin();
  }

  /* DO NOT ADD MEMBER-FACING SECTIONS TO ADMIN NAVIGATION */
  SF.premiumAdminReady = true;

})();
 
