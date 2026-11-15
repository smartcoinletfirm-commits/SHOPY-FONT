
/* SHOPY FONT — Member Dashboard Overview */
(function () {
  "use strict";

  const styles = `
    .sf-member-overview { margin: 22px 0 26px; }
    .sf-member-overview h2 { color:#101d36; font-size:21px; }
    .sf-member-overview p { color:#718096; font-size:12px; }
    .sf-quick-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
    }
    .sf-quick-card {
      display:flex; flex-direction:column; gap:9px;
      min-height:110px; padding:16px;
      border:1px solid #e6e9ef; border-radius:12px;
      background:white; color:#17243a;
      text-align:left; cursor:pointer;
    }
    .sf-quick-icon {
      display:grid; place-items:center;
      width:34px; height:34px;
      border-radius:10px; background:#f7f1e5;
      color:#8b682d; font-size:18px;
    }
    .sf-quick-card strong { font-size:13px; }
    .sf-quick-card small { color:#718096; font-size:10px; }
  `;

  function render() {
    const root = document.getElementById("approvedDashboard");
    if (!root || root.classList.contains("hidden")) return;
    if (document.getElementById("sfMemberOverview")) return;

    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);

    const section = document.createElement("section");
    section.id = "sfMemberOverview";
    section.className = "sf-member-overview";

    section.innerHTML = `
      <h2>Your workspace</h2>
      <p>Choose where you want to continue on SHOPY FONT.</p>
      <div class="sf-quick-grid">
        <button class="sf-quick-card" data-view="marketplace">
          <span class="sf-quick-icon">▦</span>
          <strong>Marketplace</strong>
          <small>Explore products and seller space.</small>
        </button>
        <button class="sf-quick-card" data-view="opportunities">
          <span class="sf-quick-icon">↗</span>
          <strong>Opportunities</strong>
          <small>Explore campaigns and work.</small>
        </button>
        <button class="sf-quick-card" data-view="scholarbridge">
          <span class="sf-quick-icon">✎</span>
          <strong>ScholarBridge</strong>
          <small>Open academic support.</small>
        </button>
        <button class="sf-quick-card" data-view="referrals">
          <span class="sf-quick-icon">♧</span>
          <strong>Referral centre</strong>
          <small>View and share your referral link.</small>
        </button>
      </div>
    `;

    const stats = root.querySelector(".stats-grid");
    if (stats) stats.insertAdjacentElement("afterend", section);
    else root.prepend(section);
  }

  function install() {
    if (window.SF &&
        typeof SF.loadDashboard === "function" &&
        !SF.__memberOverviewWrapped) {
      const original = SF.loadDashboard;

      SF.loadDashboard = async function () {
        const result = await original.apply(this, arguments);
        render();
        return result;
      };

      SF.__memberOverviewWrapped = true;
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
