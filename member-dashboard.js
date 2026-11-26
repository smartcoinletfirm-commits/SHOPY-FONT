
/* =====================================================
   SHOPY FONT — MEMBER DASHBOARD
   Emerald and white member workspace
   Includes KNOW & EARN and MARKETING PUSH
===================================================== */

(function () {
  "use strict";

  window.SF = window.SF || {};
  const SF = window.SF;
  const $ = id => document.getElementById(id);

  const styles = `
    #sfMemberOverview {
      margin:22px 0 28px;
      color:#183b2d;
    }

    .sf-dash-welcome {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:14px;
      flex-wrap:wrap;
      padding:22px;
      border-radius:18px;
      background:linear-gradient(120deg,#103b2b,#1d704b);
      color:#fff;
    }

    .sf-dash-welcome small {
      display:block;
      color:#d7e7dc;
      font-size:10px;
      font-weight:800;
      letter-spacing:1.6px;
    }

    .sf-dash-welcome h2 {
      margin:7px 0 4px;
      color:#fff;
      font-size:clamp(21px,4vw,29px);
    }

    .sf-dash-welcome p {
      margin:0;
      color:#d7e7dc;
      font-size:12px;
      line-height:1.6;
    }

    .sf-dash-status {
      padding:8px 12px;
      border:1px solid #a9d6b8;
      border-radius:30px;
      color:#e4f7e9;
      font-size:11px;
      font-weight:800;
    }

    .sf-dash-summary {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
      margin-top:13px;
    }

    .sf-dash-summary-card {
      padding:15px 16px;
      border-radius:13px;
      background:#f4f7f3;
      border:1px solid #e3eae2;
    }

    .sf-dash-summary-card span {
      display:block;
      color:#6e7e72;
      font-size:10px;
      font-weight:800;
      letter-spacing:1px;
      text-transform:uppercase;
    }

    .sf-dash-summary-card strong {
      display:block;
      margin-top:7px;
      color:#173b2e;
      font-size:20px;
    }

    .sf-dash-summary-card.wallet {
      background:linear-gradient(120deg,#0e6845,#168052);
      border-color:#168052;
    }

    .sf-dash-summary-card.wallet span,
    .sf-dash-summary-card.wallet strong {
      color:#fff;
    }

    /* EARNING OPPORTUNITIES */

    .sf-earning-opportunities {
      margin-top:16px;
      padding:18px;
      border:1px solid #dce9df;
      border-radius:17px;
      background:linear-gradient(145deg,#ffffff,#f2f8f4);
    }

    .sf-earning-opportunities h3 {
      margin:0 0 5px;
      color:#173d2d;
      font-size:18px;
      font-weight:900;
    }

    .sf-earning-opportunities > p {
      margin:0 0 14px;
      color:#748278;
      font-size:12px;
    }

    .sf-earning-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
    }

    .sf-earning-card {
      min-height:132px;
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:8px;
      padding:16px;
      border:1px solid #e2eae3;
      border-radius:14px;
      background:#fff;
      color:#183b2d;
      text-align:left;
      cursor:pointer;
      transition:.18s;
    }

    .sf-earning-card:hover {
      transform:translateY(-2px);
      border-color:#a9cbb2;
    }

    .sf-earning-card.know {
      background:linear-gradient(135deg,#124b35,#1d7950);
      color:#fff;
      border-color:#1d7950;
    }

    .sf-earning-icon {
      font-size:24px;
    }

    .sf-earning-card strong {
      font-size:14px;
    }

    .sf-earning-card small {
      font-size:11px;
      line-height:1.55;
      opacity:.82;
    }

    .sf-earning-card .sf-earning-cta {
      margin-top:auto;
      font-size:11px;
      font-weight:900;
      letter-spacing:.4px;
    }

    /* REFERRALS */

    .sf-dash-referral {
      margin-top:16px;
      padding:20px;
      border:1px solid #e0eae3;
      border-radius:16px;
      background:#fbfdfb;
    }

    .sf-dash-section-head {
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:12px;
      flex-wrap:wrap;
    }

    .sf-dash-kicker {
      color:#23734b;
      font-size:9px;
      font-weight:900;
      letter-spacing:1.6px;
    }

    .sf-dash-referral h3 {
      margin:6px 0;
      color:#173b2e;
      font-size:19px;
    }

    .sf-dash-referral p {
      margin:0;
      color:#758278;
      font-size:12px;
      line-height:1.6;
    }

    .sf-dash-linkrow {
      display:flex;
      gap:9px;
      margin-top:15px;
    }

    .sf-dash-linkrow input {
      min-width:0;
      flex:1;
      padding:12px;
      border:1px solid #dce5dc;
      border-radius:9px;
      background:#fff;
      color:#315342;
      font-size:12px;
    }

    .sf-dash-btn {
      border:0;
      border-radius:9px;
      padding:12px 15px;
      background:#174b37;
      color:#fff;
      font-size:12px;
      font-weight:800;
      cursor:pointer;
    }

    .sf-dash-btn.green {
      background:#e8f4eb;
      color:#175b39;
      border:1px solid #cfe3d4;
    }

    .sf-dash-ref-stats {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:10px;
      margin-top:14px;
    }

    .sf-dash-ref-stats article {
      padding:12px;
      border:1px solid #e8ece6;
      border-radius:10px;
      background:#fff;
    }

    .sf-dash-ref-stats span,
    .sf-dash-ref-stats strong {
      display:block;
    }

    .sf-dash-ref-stats span {
      color:#78857b;
      font-size:10px;
    }

    .sf-dash-ref-stats strong {
      margin-top:5px;
      color:#174b37;
      font-size:20px;
    }

    /* MEMBER WORKSPACE */

    .sf-dash-workspace {
      margin-top:22px;
    }

    .sf-dash-workspace h3 {
      margin:0 0 5px;
      color:#173b2e;
      font-size:19px;
    }

    .sf-dash-workspace > p {
      margin:0 0 14px;
      color:#758278;
      font-size:12px;
    }

    .sf-quick-grid {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:12px;
    }

    .sf-quick-card {
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:8px;
      min-height:116px;
      padding:16px;
      border:1px solid #e4eae3;
      border-radius:13px;
      background:#fff;
      color:#183b2d;
      text-align:left;
      cursor:pointer;
      box-shadow:0 5px 16px rgba(18,45,34,.035);
      transition:.18s;
    }

    .sf-quick-card:hover {
      transform:translateY(-2px);
      border-color:#a9cbb2;
    }

    .sf-quick-icon {
      display:grid;
      place-items:center;
      width:35px;
      height:35px;
      border-radius:10px;
      background:#edf5ee;
      color:#1d6245;
      font-size:18px;
    }

    .sf-quick-card strong {
      font-size:13px;
    }

    .sf-quick-card small {
      color:#78857b;
      font-size:10px;
      line-height:1.5;
    }

    .sf-quick-card:disabled,
    .sf-dash-btn:disabled,
    .sf-earning-card:disabled {
      opacity:.6;
      cursor:not-allowed;
    }

    @media(max-width:700px) {
      .sf-quick-grid {
        grid-template-columns:repeat(2,minmax(0,1fr));
      }
    }

    @media(max-width:430px) {
      .sf-earning-grid {
        grid-template-columns:1fr;
      }

      .sf-dash-linkrow {
        flex-direction:column;
      }

      .sf-dash-linkrow .sf-dash-btn {
        width:100%;
      }

      .sf-dash-ref-stats {
        gap:7px;
      }

      .sf-dash-ref-stats article {
        padding:10px 8px;
      }

      .sf-dash-ref-stats strong {
        font-size:17px;
      }

      .sf-quick-card {
        min-height:108px;
        padding:13px;
      }

      .sf-dash-summary-card {
        padding:13px;
      }

      .sf-dash-summary-card strong {
        font-size:18px;
      }
    }
  `;

  function makeCard(view, icon, title, description) {
    return `
      <button type="button"
        class="sf-quick-card"
        data-sf-dashboard-view="${view}">
        <span class="sf-quick-icon">${icon}</span>
        <strong>${title}</strong>
        <small>${description}</small>
      </button>
    `;
  }

  function isCommunityMember() {
    const type = String(
      SF.profile?.membership_type || ""
    ).toLowerCase();

    return ["community", "build_community"].includes(type);
  }

  function getWalletBalance() {
    const value = $("walletBalance")?.textContent?.trim() || "";
    return /^\$/.test(value) ? value : "$0.00";
  }

  async function loadReferralNumbers() {
    if (!SF.currentUser || !SF.getClient) return;

    try {
      const { data, error } = await SF.getClient()
        .from("referrals")
        .select("status")
        .eq("referrer_id", SF.currentUser.id);

      if (error) throw error;

      const rows = data || [];

      if ($("sfDashRefTotal")) {
        $("sfDashRefTotal").textContent = rows.length;
      }

      if ($("sfDashRefConfirmed")) {
        $("sfDashRefConfirmed").textContent =
          rows.filter(row =>
            ["eligible", "rewarded"].includes(
              String(row.status).toLowerCase()
            )
          ).length;
      }

      if ($("sfDashRefPending")) {
        $("sfDashRefPending").textContent =
          rows.filter(row =>
            String(row.status).toLowerCase() === "registered"
          ).length;
      }

    } catch (error) {
      console.warn("Dashboard referral statistics:", error);
    }
  }

  function hideApprovedActivationForms() {
    [
      "activationWorkspace",
      "sfPaymentProofEntry",
      "sfRegistrationDetails"
    ].forEach(id => {
      const element = $(id);
      if (element) element.style.display = "none";
    });
  }

  function render() {
    const root = $("approvedDashboard");

    if (!root || root.classList.contains("hidden")) return;

    hideApprovedActivationForms();

    const oldStats = root.querySelector(".stats-grid");

    if (oldStats) oldStats.style.display = "none";

    if ($("sfMemberOverview")) {
      if ($("sfDashWalletValue")) {
        $("sfDashWalletValue").textContent = getWalletBalance();
      }

      loadReferralNumbers();
      return;
    }

    if (!$("sfMemberDashboardStyles")) {
      const style = document.createElement("style");
      style.id = "sfMemberDashboardStyles";
      style.textContent = styles;
      document.head.appendChild(style);
    }

    const referralLink = SF.buildReferralLink?.() || "";

    const name = String(
      SF.profile?.full_name || "Member"
    ).trim().split(/\s+/)[0];

    const section = document.createElement("section");
    section.id = "sfMemberOverview";

    section.innerHTML = `
      <div class="sf-dash-welcome">
        <div>
          <small>SHOPY FONT · MEMBER SPACE</small>
          <h2>Welcome back, ${SF.escapeHtml(name)}.</h2>
          <p>Your global workspace is ready. Choose a service or share your link.</p>
        </div>
        <span class="sf-dash-status">✓ APPROVED MEMBER</span>
      </div>

      <div class="sf-dash-summary">
        <article class="sf-dash-summary-card">
          <span>Account status</span>
          <strong>Approved</strong>
        </article>

        <article class="sf-dash-summary-card wallet">
          <span>Available wallet</span>
          <strong id="sfDashWalletValue">$0.00</strong>
        </article>
      </div>

      <!-- EARNING OPPORTUNITIES -->
      <section class="sf-earning-opportunities">
        <h3>EARNING OPPORTUNITIES</h3>
        <p>Explore ways to earn rewards on SHOPY FONT.</p>

        <div class="sf-earning-grid">

          <button type="button"
            class="sf-earning-card know"
            data-sf-dashboard-action="know-earn">

            <span class="sf-earning-icon">🧠</span>
            <strong>KNOW &amp; EARN</strong>

            <small>
              Answer questions, test your knowledge
              and earn USD rewards.
            </small>

            <span class="sf-earning-cta">
              START NOW →
            </span>
          </button>

          <button type="button"
            class="sf-earning-card"
            data-sf-dashboard-view="opportunities">

            <span class="sf-earning-icon">📣</span>
            <strong>MARKETING PUSH</strong>

            <small>
              Promote products and submit your promotion
              for reward review.
            </small>

            <span class="sf-earning-cta">
              START PUSH →
            </span>
          </button>

        </div>
      </section>

      <!-- REFERRALS -->
      <div class="sf-dash-referral">
        <div class="sf-dash-section-head">
          <div>
            <span class="sf-dash-kicker">GROW YOUR NETWORK</span>
            <h3>Your referral link</h3>
            <p>Copy your personal link or share it with people you know.</p>
          </div>
        </div>

        <div class="sf-dash-linkrow">
          <input id="sfDashboardReferralLink"
            readonly
            aria-label="Your referral link"
            value="${SF.escapeAttr(referralLink)}"
            placeholder="Your referral link will appear here">

          <button type="button"
            class="sf-dash-btn green"
            data-sf-dashboard-action="copy">
            Copy link
          </button>

          <button type="button"
            class="sf-dash-btn"
            data-sf-dashboard-action="share">
            Share
          </button>
        </div>

        <div class="sf-dash-ref-stats">
          <article>
            <span>Total sign-ups</span>
            <strong id="sfDashRefTotal">—</strong>
          </article>

          <article>
            <span>Eligible / rewarded</span>
            <strong id="sfDashRefConfirmed">—</strong>
          </article>

          <article>
            <span>Pending</span>
            <strong id="sfDashRefPending">—</strong>
          </article>
        </div>
      </div>

      <!-- MEMBER WORKSPACE -->
      <div class="sf-dash-workspace">
        <h3>Your workspace</h3>
        <p>Quick access to your SHOPY FONT services.</p>

        <div class="sf-quick-grid">

          ${makeCard("marketplace","▦","Marketplace","Discover products and seller services.")}

          ${makeCard("opportunities","↗","Opportunities","Explore campaigns and opportunities.")}

          ${makeCard("scholarbridge","✎","ScholarBridge","Access academic support services.")}

          ${makeCard("referrals","♧","Referral centre","See your referral activity and link.")}

          ${makeCard("tasks","✓","Tasks centre","View tasks and your submissions.")}

          <button type="button"
            class="sf-quick-card"
            data-sf-dashboard-action="bonus">

            <span class="sf-quick-icon">★</span>
            <strong>Welcome bonus</strong>
            <small>
              Open your wallet to view and claim your available welcome bonus.
            </small>
          </button>

          ${isCommunityMember() ? `
            <button type="button"
              class="sf-quick-card"
              data-sf-dashboard-action="upgrade">

              <span class="sf-quick-icon">↑</span>
              <strong>Upgrade account</strong>
              <small>Choose a full SHOPY FONT membership package.</small>
            </button>
          ` : ""}

          <button type="button"
            class="sf-quick-card"
            data-sf-dashboard-action="wallet">

            <span class="sf-quick-icon">$</span>
            <strong>My wallet</strong>
            <small>View your balance and transactions.</small>
          </button>

          <button type="button"
            class="sf-quick-card"
            data-sf-dashboard-action="withdraw">

            <span class="sf-quick-icon">⇧</span>
            <strong>Withdraw funds</strong>
            <small>Open your withdrawal request form.</small>
          </button>

        </div>
      </div>
    `;

    if (oldStats) {
      oldStats.insertAdjacentElement("afterend", section);
    } else {
      root.prepend(section);
    }

    if ($("sfDashWalletValue")) {
      $("sfDashWalletValue").textContent = getWalletBalance();
    }

    loadReferralNumbers();
  }

  async function handleDashboardClick(event) {
    const button = event.target.closest(
      "#sfMemberOverview button"
    );

    if (!button || button.disabled) return;

    const view = button.dataset.sfDashboardView;
    const action = button.dataset.sfDashboardAction;

    if (!view && !action) return;

    event.preventDefault();
    event.stopPropagation();

    button.disabled = true;

    try {

      /* ==========================================
         KNOW & EARN — DIRECT OPEN
         Does not route through the Tasks Centre.
      ========================================== */

      if (action === "know-earn") {

        if (typeof SF.openKnowEarn !== "function") {
          throw new Error(
            "KNOW & EARN is not loaded. Please refresh the page."
          );
        }

        await SF.openKnowEarn();
        return;
      }

      /* ==========================================
         NORMAL DASHBOARD NAVIGATION
      ========================================== */

      if (view) {
        if (typeof SF.navigate !== "function") {
          throw new Error("Navigation is not ready. Reload the page.");
        }

        await SF.navigate(view);
        return;
      }

      /* ==========================================
         REFERRAL ACTIONS
      ========================================== */

      if (action === "copy") {
        if (typeof SF.copyReferralLink !== "function") {
          throw new Error("Referral link service is unavailable.");
        }

        await SF.copyReferralLink();
        return;
      }

      if (action === "share") {
        if (typeof SF.shareReferralLink !== "function") {
          throw new Error("Referral sharing is unavailable.");
        }

        await SF.shareReferralLink();
        return;
      }

      /* ==========================================
         WALLET ACTIONS
      ========================================== */

      if (["wallet", "bonus", "withdraw"].includes(action)) {
        const wallet = $("sfWalletPanel");

        if (!wallet) {
          throw new Error(
            "Wallet is not available. Please reload the dashboard."
          );
        }

        wallet.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        if (action === "bonus") {
          window.setTimeout(() => {
            const claim = $("sfClaimWelcomeBonus");

            if (claim && !claim.disabled) {
              claim.click();
            } else {
              SF.showToast(
                "Check your wallet for your welcome bonus."
              );
            }
          }, 350);
        }

        if (action === "withdraw") {
          if (isCommunityMember()) {
            SF.showToast(
              "Withdrawals are not available for Community accounts."
            );
          } else {
            window.setTimeout(() => {
              $("sfOpenWithdraw")?.click();
            }, 350);
          }
        }

        return;
      }

      /* ==========================================
         COMMUNITY UPGRADE
      ========================================== */

      if (action === "upgrade") {
        const workspace = $("activationWorkspace");
        const details = $("sfRegistrationDetails");

        if (!workspace || !details) {
          throw new Error(
            "Upgrade package selection is not available. Please contact support."
          );
        }

        workspace.style.display = "";
        workspace.classList.remove("hidden");

        details.style.display = "";
        details.classList.remove("hidden");

        details.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        SF.showToast(
          "Select your full membership package and follow the payment instructions."
        );
      }

        } catch (error) {
      console.error("Dashboard button error:", error);

      SF.showToast(
        error.message || "This action could not be completed."
      );

    } finally {
      button.disabled = false;
    }
  }

  /* ==========================================
     INSTALL DASHBOARD
  ========================================== */

  function install() {

    if (!SF.__memberDashboardClickHandler) {
      document.addEventListener(
        "click",
        handleDashboardClick,
        true
      );

      SF.__memberDashboardClickHandler = true;
    }

    if (
      typeof SF.loadDashboard === "function" &&
      !SF.__updatedMemberDashboardWrapped
    ) {
      const originalLoadDashboard = SF.loadDashboard;

      SF.loadDashboard = async function (...args) {
        const result = await originalLoadDashboard.apply(this, args);
        render();
        return result;
      };

      SF.__updatedMemberDashboardWrapped = true;
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      install
    );
  } else {
    install();
  }

})();
