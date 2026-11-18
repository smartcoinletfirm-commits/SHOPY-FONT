
/* SHOPY FONT — Updated Member Dashboard */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);

  const styles = `
    #sfMemberOverview{margin:22px 0 28px;color:#183b2d}
    .sf-dash-welcome{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:22px;border-radius:18px;background:linear-gradient(120deg,#103b2b,#1d6245);color:#fff;box-shadow:0 12px 30px rgba(16,59,43,.14)}
    .sf-dash-welcome small{display:block;color:#d7e7dc;font-size:10px;font-weight:800;letter-spacing:1.6px}
    .sf-dash-welcome h2{margin:7px 0 4px;color:#fff;font-size:clamp(21px,4vw,29px)}
    .sf-dash-welcome p{margin:0;color:#d7e7dc;font-size:12px;line-height:1.6}
    .sf-dash-status{padding:8px 12px;border:1px solid #d7c18c;border-radius:30px;color:#f5dfaa;font-size:11px;font-weight:800}
    .sf-dash-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:13px}
    .sf-dash-summary-card{padding:15px 16px;border-radius:13px;background:#f4f7f3;border:1px solid #e3eae2}
    .sf-dash-summary-card span{display:block;color:#6e7e72;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
    .sf-dash-summary-card strong{display:block;margin-top:7px;color:#173b2e;font-size:20px}
    .sf-dash-summary-card.wallet{background:linear-gradient(120deg,#0e6845,#168052);border-color:#168052}
    .sf-dash-summary-card.wallet span,.sf-dash-summary-card.wallet strong{color:#fff}
    .sf-dash-referral{margin-top:16px;padding:20px;border:1px solid #e5dcc7;border-radius:16px;background:linear-gradient(145deg,#fffefa,#f5f8f4);box-shadow:0 9px 25px rgba(18,45,34,.05)}
    .sf-dash-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
    .sf-dash-kicker{color:#a17b35;font-size:9px;font-weight:900;letter-spacing:1.6px}
    .sf-dash-referral h3{margin:6px 0;color:#173b2e;font-size:19px}
    .sf-dash-referral p{margin:0;color:#758278;font-size:12px;line-height:1.6}
    .sf-dash-linkrow{display:flex;gap:9px;margin-top:15px}
    .sf-dash-linkrow input{min-width:0;flex:1;padding:12px;border:1px solid #dce5dc;border-radius:9px;background:#fff;color:#315342;font-size:12px}
    .sf-dash-btn{border:0;border-radius:9px;padding:12px 15px;background:#174b37;color:#fff;font-size:12px;font-weight:800;cursor:pointer}
    .sf-dash-btn.gold{background:#c9a45c;color:#183b2d}
    .sf-dash-ref-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
    .sf-dash-ref-stats article{padding:12px;border:1px solid #e8ece6;border-radius:10px;background:#fff}
    .sf-dash-ref-stats span,.sf-dash-ref-stats strong{display:block}
    .sf-dash-ref-stats span{color:#78857b;font-size:10px}
    .sf-dash-ref-stats strong{margin-top:5px;color:#174b37;font-size:20px}
    .sf-dash-workspace{margin-top:22px}
    .sf-dash-workspace h3{margin:0 0 5px;color:#173b2e;font-size:19px}
    .sf-dash-workspace>p{margin:0 0 14px;color:#758278;font-size:12px}
    .sf-quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .sf-quick-card{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:116px;padding:16px;border:1px solid #e4eae3;border-radius:13px;background:#fff;color:#183b2d;text-align:left;cursor:pointer;box-shadow:0 5px 16px rgba(18,45,34,.035);transition:.18s}
    .sf-quick-card:hover{transform:translateY(-2px);border-color:#b9cdbd;box-shadow:0 9px 22px rgba(18,45,34,.08)}
    .sf-quick-icon{display:grid;place-items:center;width:35px;height:35px;border-radius:10px;background:#edf5ee;color:#1d6245;font-size:18px}
    .sf-quick-card strong{font-size:13px}
    .sf-quick-card small{color:#78857b;font-size:10px;line-height:1.5}
    @media(max-width:700px){.sf-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:430px){.sf-dash-linkrow{flex-direction:column}.sf-dash-linkrow .sf-dash-btn{width:100%}.sf-dash-ref-stats{gap:7px}.sf-dash-ref-stats article{padding:10px 8px}.sf-dash-ref-stats strong{font-size:17px}.sf-quick-card{min-height:108px;padding:13px}.sf-dash-summary-card{padding:13px}.sf-dash-summary-card strong{font-size:18px}}
  `;

  function makeCard(view,icon,title,description) {
    return `<button type="button" class="sf-quick-card" data-view="${view}">
      <span class="sf-quick-icon">${icon}</span><strong>${title}</strong><small>${description}</small>
    </button>`;
  }

  async function loadReferralNumbers() {
    if (!SF.currentUser) return;

    const {data,error} = await SF.getClient().from("referrals")
      .select("status").eq("referrer_id",SF.currentUser.id);

    if (error) {
      console.warn("Referral statistics unavailable:",error);
      return;
    }

    const rows = data || [];

    $("sfDashRefTotal") && ($("sfDashRefTotal").textContent = rows.length);

    $("sfDashRefConfirmed") && ($("sfDashRefConfirmed").textContent =
      rows.filter(r => ["eligible","rewarded"].includes(
        String(r.status).toLowerCase()
      )).length);

    $("sfDashRefPending") && ($("sfDashRefPending").textContent =
      rows.filter(r => String(r.status).toLowerCase() === "registered").length);
  }

  function hideApprovedActivationForms() {
    ["activationWorkspace","sfPaymentProofEntry","sfRegistrationDetails"].forEach(id => {
      const el = $(id);
      if (el) el.style.display = "none";
    });
  }

  function getWalletBalance() {
    const value = $("walletBalance")?.textContent?.trim() || "";
    return /^\$/.test(value) ? value : "$0.00";
  }

  function isCommunityMember() {
    return String(SF.profile?.membership_type || "").toLowerCase() === "community";
  }

  function render() {
    const root = $("approvedDashboard");

    if (!root || root.classList.contains("hidden")) return;

    hideApprovedActivationForms();

    const oldStats = root.querySelector(".stats-grid");
    if (oldStats) oldStats.style.display = "none";

    if ($("sfMemberOverview")) {
      $("sfDashWalletValue") &&
        ($("sfDashWalletValue").textContent = getWalletBalance());
      loadReferralNumbers();
      return;
    }

    if (!$("sfMemberDashboardStyles")) {
      const style = document.createElement("style");
      style.id = "sfMemberDashboardStyles";
      style.textContent = styles;
      document.head.appendChild(style);
    }

    const link = SF.buildReferralLink?.() || "";
    const name = String(SF.profile?.full_name || "Member")
      .trim().split(/\s+/)[0];

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
          <span>Account status</span><strong>Approved</strong>
        </article>
        <article class="sf-dash-summary-card wallet">
          <span>Available wallet</span>
          <strong id="sfDashWalletValue">$0.00</strong>
        </article>
      </div>

      <div class="sf-dash-referral">
        <div class="sf-dash-section-head">
          <div>
            <span class="sf-dash-kicker">GROW YOUR NETWORK</span>
            <h3>Your referral link</h3>
            <p>Copy your personal link or share it with people you know.</p>
          </div>
        </div>

        <div class="sf-dash-linkrow">
          <input id="sfDashboardReferralLink" readonly
            aria-label="Your referral link"
            value="${SF.escapeHtml(link)}"
            placeholder="Your referral link will appear here">
          <button type="button" class="sf-dash-btn gold" id="sfDashCopyReferral">Copy link</button>
          <button type="button" class="sf-dash-btn" id="sfDashShareReferral">Share</button>
        </div>

        <div class="sf-dash-ref-stats">
          <article><span>Total sign-ups</span><strong id="sfDashRefTotal">—</strong></article>
          <article><span>Eligible / rewarded</span><strong id="sfDashRefConfirmed">—</strong></article>
          <article><span>Pending</span><strong id="sfDashRefPending">—</strong></article>
        </div>
      </div>

      <div class="sf-dash-workspace">
        <h3>Your workspace</h3>
        <p>Quick access to your SHOPY FONT services.</p>

        <div class="sf-quick-grid">
          ${makeCard("marketplace","▦","Marketplace","Discover products and seller services.")}
          ${makeCard("opportunities","↗","Opportunities","Explore campaigns and opportunities.")}
          ${makeCard("scholarbridge","✎","ScholarBridge","Access academic support services.")}
          ${makeCard("referrals","♧","Referral centre","See your referral activity and link.")}
          ${makeCard("tasks","✓","Tasks centre","View tasks and your submissions.")}

          <button type="button" class="sf-quick-card" id="sfDashBonus">
            <span class="sf-quick-icon">★</span>
            <strong>Welcome bonus</strong>
            <small>Open your wallet to view and claim your available welcome bonus.</small>
          </button>

          ${isCommunityMember() ? `
          <button type="button" class="sf-quick-card" id="sfDashUpgrade">
            <span class="sf-quick-icon">↑</span>
            <strong>Upgrade account</strong>
            <small>Choose a full SHOPY FONT membership package.</small>
          </button>` : ""}

          <button type="button" class="sf-quick-card" id="sfDashOpenWallet">
            <span class="sf-quick-icon">$</span>
            <strong>My wallet</strong>
            <small>View your balance and transactions.</small>
          </button>

          <button type="button" class="sf-quick-card" id="sfDashWithdraw">
            <span class="sf-quick-icon">⇧</span>
            <strong>Withdraw funds</strong>
            <small>Open your withdrawal request form.</small>
          </button>
        </div>
      </div>
    `;

    const stats = root.querySelector(".stats-grid");

    if (stats) {
      stats.style.display = "none";
      stats.insertAdjacentElement("afterend",section);
    } else {
      root.prepend(section);
    }

    $("sfDashWalletValue").textContent = getWalletBalance();

    $("sfDashCopyReferral")?.addEventListener("click",async () => {
      await SF.copyReferralLink();
    });

    $("sfDashShareReferral")?.addEventListener("click",async () => {
      await SF.shareReferralLink();
    });

    // Welcome bonus shortcut: use the existing wallet claim button.
    $("sfDashBonus")?.addEventListener("click",() => {
      $("sfWalletPanel")?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

      window.setTimeout(() => {
        const claim = $("sfClaimWelcomeBonus");

        if (claim && !claim.disabled) {
          claim.click();
        } else {
          SF.showToast("Open your wallet to check whether your welcome bonus is available.");
        }
      },300);
    });

    // Community members are directed to the existing package selection area.
    $("sfDashUpgrade")?.addEventListener("click",() => {
      const workspace = $("activationWorkspace");
      const details = $("sfRegistrationDetails");

      if (!workspace || !details) {
        SF.showToast("Upgrade package selection is not available on this page. Please contact support.");
        return;
      }

      workspace.style.display = "";
      workspace.classList.remove("hidden");

      details.style.display = "";
      details.classList.remove("hidden");

      details.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

      SF.showToast("Select your full membership package and follow the payment instructions.");
    });

    $("sfDashOpenWallet")?.addEventListener("click",() => {
      $("sfWalletPanel")?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });
    });

    $("sfDashWithdraw")?.addEventListener("click",() => {
      const wallet = $("sfWalletPanel");

      wallet?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

      if (isCommunityMember()) {
        SF.showToast("Withdrawals are not currently available for Community accounts.");
        return;
      }

      window.setTimeout(() => $("sfOpenWithdraw")?.click(),250);
    });

    loadReferralNumbers();
  }

  function install() {
    if (
      window.SF &&
      typeof SF.loadDashboard === "function" &&
      !SF.__updatedMemberDashboardWrapped
    ) {
      const original = SF.loadDashboard;

      SF.loadDashboard = async function () {
        const result = await original.apply(this,arguments);
        render();
        return result;
      };

      SF.__updatedMemberDashboardWrapped = true;
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",install);
  } else {
    install();
  }
})();
      
