
/* =====================================================
   SHOPY FONT — MEMBER DASHBOARD SHELL
   Emerald / White premium design
   Preserves existing dashboard content and navigation
===================================================== */

(() => {
  "use strict";

  window.SF = window.SF || {};
  const SF = window.SF;

  const styles = `
    body.sf-dashboard-mode {
      background:#f5f8f6;
      color:#183b2d;
    }

    body.sf-dashboard-mode .announcement,
    body.sf-dashboard-mode .topbar,
    body.sf-dashboard-mode .footer {
      display:none !important;
    }

    #dashboardView.sf-dashboard-view {
      display:none;
      width:100%;
      max-width:none;
      margin:0;
      padding:0;
      background:#f5f8f6;
    }

    #dashboardView.sf-dashboard-view.active {
      display:block;
    }

    .sf-app-shell {
      min-height:100vh;
      background:#f5f8f6;
    }

    .sf-app-header {
      min-height:78px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:20px;
      padding:13px 28px;
      background:#fff;
      border-bottom:1px solid #e4ece6;
    }

    .sf-app-brand {
      display:flex;
      align-items:center;
      gap:12px;
      min-width:220px;
      color:#145c3c;
      font-family:Manrope,sans-serif;
      font-size:21px;
      font-weight:900;
      text-decoration:none;
    }

    .sf-app-brand small {
      display:block;
      margin-top:3px;
      color:#7b897f;
      font-family:"DM Sans",sans-serif;
      font-size:10px;
      font-weight:500;
    }

    .sf-app-logo {
      width:52px;
      height:52px;
      flex-shrink:0;
    }

    .sf-app-search {
      flex:1;
      max-width:650px;
      height:48px;
      display:flex;
      align-items:center;
      gap:12px;
      padding:0 17px;
      border:1px solid #e4ece6;
      border-radius:30px;
      background:#f5f8f6;
      color:#648071;
    }

    .sf-app-search input {
      width:100%;
      border:0;
      outline:0;
      background:transparent;
      color:#183b2d;
      font-size:14px;
    }

    .sf-app-user {
      display:flex;
      align-items:center;
      gap:12px;
      color:#183b2d;
      font-size:13px;
      font-weight:800;
      white-space:nowrap;
    }

    .sf-app-notice {
      color:#176b47;
      font-size:22px;
    }

    .sf-app-avatar {
      width:42px;
      height:42px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:#176b47;
      color:#fff;
      font-size:18px;
      font-weight:800;
    }

    .sf-app-layout {
      display:grid;
      grid-template-columns:245px minmax(0,1fr);
      min-height:calc(100vh - 78px);
    }

    .sf-app-sidebar {
      padding:25px 15px;
      background:#fff;
      border-right:1px solid #e4ece6;
    }

    .sf-app-side-link {
      width:100%;
      min-height:49px;
      display:flex;
      align-items:center;
      gap:13px;
      margin-bottom:6px;
      padding:11px 14px;
      border:0;
      border-radius:11px;
      background:transparent;
      color:#42594b;
      text-align:left;
      font-size:13px;
      font-weight:700;
      cursor:pointer;
      transition:background .18s,color .18s;
    }

    .sf-app-side-link:hover,
    .sf-app-side-link.active {
      background:#eaf4ed;
      color:#176b47;
    }

    .sf-app-side-icon {
      width:24px;
      text-align:center;
      font-size:18px;
    }

    .sf-app-side-bottom {
      margin-top:25px;
      padding-top:20px;
      border-top:1px solid #e8eee9;
    }

    .sf-app-logout {
      width:100%;
      min-height:47px;
      border:0;
      border-radius:10px;
      background:#176b47;
      color:#fff;
      font-size:13px;
      font-weight:800;
      cursor:pointer;
    }

    .sf-app-main {
      min-width:0;
      padding:30px 28px 55px;
      overflow:hidden;
    }

    .sf-app-main > .page-heading {
      display:none;
    }

    #approvedDashboard {
      max-width:none;
      margin:0;
      padding:0;
    }

    #sfMemberOverview {
      margin:0 0 25px !important;
    }

    #sfMemberOverview .sf-dash-welcome {
      background:linear-gradient(120deg,#0c3022,#176b47) !important;
      border:0 !important;
      color:#fff !important;
    }

    #sfMemberOverview .sf-dash-welcome h2,
    #sfMemberOverview .sf-dash-welcome p,
    #sfMemberOverview .sf-dash-welcome small {
      color:#fff !important;
    }

    #sfMemberOverview .sf-dash-status {
      background:#e4f4e9 !important;
      border:0 !important;
      color:#176b47 !important;
    }

    #sfMemberOverview .sf-dash-referral {
      background:#fff !important;
      border:1px solid #e1ebe3 !important;
      box-shadow:0 6px 20px rgba(18,45,34,.04);
    }

    #sfMemberOverview .sf-dash-kicker {
      color:#176b47 !important;
    }

    #sfMemberOverview .sf-dash-referral h3,
    #sfMemberOverview .sf-dash-workspace h3 {
      color:#173b2e !important;
    }

    #sfMemberOverview .sf-dash-btn.gold {
      background:#176b47 !important;
      color:#fff !important;
    }

    #sfMemberOverview .sf-quick-card {
      border-color:#e2ebe4;
      color:#183b2d;
      background:#fff;
    }

    #sfMemberOverview .sf-quick-card:hover {
      border-color:#a8cbb2;
      background:#f7fbf8;
    }

    #sfMemberOverview .sf-quick-icon {
      background:#eaf4ed;
      color:#176b47;
    }

    .sf-wallet-panel {
      margin:20px 0 25px !important;
      padding:22px !important;
      border:1px solid #dcebe1 !important;
      border-radius:17px !important;
      background:linear-gradient(145deg,#fff,#f2f8f4) !important;
      box-shadow:0 10px 30px rgba(18,45,34,.06) !important;
      color:#193629 !important;
    }

    .sf-wallet-heading {
      display:flex !important;
    }

    .sf-wallet-main {
      background:linear-gradient(125deg,#0c3022,#176b47) !important;
      color:#fff !important;
    }

    .sf-wallet-main span,
    .sf-wallet-main small {
      color:#d5eade !important;
    }

    .sf-wallet-stats div {
      background:#fff !important;
      border-color:#e1ebe3 !important;
    }

    .sf-wallet-stats span {
      color:#758278 !important;
    }

    .sf-wallet-stats strong {
      color:#183d30 !important;
    }

    .sf-wallet-bonus {
      background:#f5faf6 !important;
      border-color:#dcebe1 !important;
    }

    .sf-wallet-bonus h3 {
      color:#173b2e !important;
    }

    .sf-wallet-history {
      background:#fff;
      border:1px solid #e5eee7;
      border-radius:14px;
      padding:18px;
    }

    .sf-wallet-history h3 {
      color:#173b2e !important;
    }

    .sf-wallet-transaction {
      border-color:#edf0eb !important;
    }

    .sf-wallet-transaction strong {
      color:#193629;
    }

    .sf-wallet-transaction .sf-wallet-positive {
      color:#237a57 !important;
    }

    .sf-wallet-transaction .sf-wallet-negative {
      color:#b42318 !important;
    }

    @media(max-width:950px) {
      .sf-app-layout {
        grid-template-columns:205px minmax(0,1fr);
      }

      .sf-app-sidebar {
        padding:20px 10px;
      }

      .sf-app-main {
        padding:23px 17px 40px;
      }
    }

    @media(max-width:700px) {
      .sf-app-header {
        min-height:65px;
        padding:9px 12px;
        gap:8px;
      }

      .sf-app-brand {
        min-width:0;
        gap:7px;
        font-size:16px;
      }

      .sf-app-brand small {
        font-size:8px;
      }

      .sf-app-logo {
        width:39px;
        height:39px;
      }

      .sf-app-search {
        display:none;
      }

      .sf-app-user {
        gap:7px;
        font-size:11px;
      }

      .sf-app-avatar {
        width:34px;
        height:34px;
        font-size:15px;
      }

      .sf-app-layout {
        display:block;
      }

      .sf-app-sidebar {
        display:flex;
        gap:5px;
        padding:8px;
        overflow-x:auto;
        border-right:0;
        border-bottom:1px solid #e4ece6;
        scrollbar-width:none;
      }

      .sf-app-sidebar::-webkit-scrollbar {
        display:none;
      }

      .sf-app-side-link {
        width:auto;
        min-width:max-content;
        min-height:40px;
        margin:0;
        padding:8px 11px;
        gap:6px;
        font-size:11px;
      }

      .sf-app-side-icon {
        font-size:15px;
      }

      .sf-app-side-bottom {
        display:none;
      }

      .sf-app-main {
        padding:18px 12px 35px;
      }

      .sf-wallet-panel {
        padding:16px !important;
      }

      .sf-wallet-main {
        min-height:170px;
        padding:23px !important;
      }

      .sf-wallet-stats {
        gap:6px;
      }

      .sf-wallet-stats div {
        padding:11px 7px;
      }

      .sf-wallet-stats strong {
        font-size:13px !important;
      }
    }
  `;

  function buildShell() {
    const root = document.getElementById("dashboardView");

    if (!root || root.dataset.sfShellBuilt === "true") return;

    root.dataset.sfShellBuilt = "true";
    root.classList.add("sf-dashboard-view");

    const logo = `
      <svg class="sf-app-logo"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SHOPY FONT logo">
        <path d="M29 34V25a21 21 0 0 1 42 0v9"
          fill="none" stroke="#176b47"
          stroke-width="8" stroke-linecap="round"/>
        <rect x="13" y="31" width="74" height="61"
          rx="12" fill="#176b47"/>
        <path d="M36 50l14 12 15-12M50 62v15"
          fill="none" stroke="#fff"
          stroke-width="5" stroke-linecap="round"
          stroke-linejoin="round"/>
      </svg>
    `;

    const shell = document.createElement("div");
    shell.className = "sf-app-shell";

    shell.innerHTML = `
      <header class="sf-app-header">
        <a class="sf-app-brand" href="#dashboard">
          ${logo}
          <span>
            SHOPY FONT
            <small>Your World. Your Opportunities.</small>
          </span>
        </a>

        <div class="sf-app-search">
          <span>⌕</span>
          <input type="search"
            placeholder="Search products and opportunities..."
            aria-label="Search">
        </div>

        <div class="sf-app-user">
          <span class="sf-app-notice" aria-label="Notifications">♧</span>
          <span class="sf-app-avatar" id="sfAppAvatar">M</span>
          <span id="sfAppUserName">Member</span>
        </div>
      </header>

      <div class="sf-app-layout">
        <aside class="sf-app-sidebar">
          <button class="sf-app-side-link active" data-view="dashboard">
            <span class="sf-app-side-icon">⌂</span>Dashboard
          </button>

          <button class="sf-app-side-link" data-view="marketplace">
            <span class="sf-app-side-icon">▦</span>Marketplace
          </button>

          <button class="sf-app-side-link" data-view="opportunities">
            <span class="sf-app-side-icon">↗</span>Opportunities
          </button>

          <button class="sf-app-side-link" data-view="scholarbridge">
            <span class="sf-app-side-icon">✎</span>ScholarBridge
          </button>

          <button class="sf-app-side-link" data-view="referrals">
            <span class="sf-app-side-icon">♧</span>Referrals
          </button>

          <button class="sf-app-side-link" data-sf-dashboard-action="wallet">
            <span class="sf-app-side-icon">$</span>My Wallet
          </button>

          <button class="sf-app-side-link" data-sf-dashboard-view="tasks">
            <span class="sf-app-side-icon">✓</span>Task Centre
          </button>

          <button class="sf-app-side-link" data-action="show-coming">
            <span class="sf-app-side-icon">⚙</span>Settings
          </button>

          <button class="sf-app-side-link" data-action="show-coming">
            <span class="sf-app-side-icon">?</span>Help & Support
          </button>

          <div class="sf-app-side-bottom">
            <button class="sf-app-logout" data-action="logout">
              ⇥ &nbsp; Log Out
            </button>
          </div>
        </aside>

        <main class="sf-app-main">
          <div class="sf-app-main-content"></div>
        </main>
      </div>
    `;

    const content = shell.querySelector(".sf-app-main-content");

    while (root.firstChild) {
      content.appendChild(root.firstChild);
    }

    root.appendChild(shell);

    const fullName = String(
      SF.profile?.full_name || "Member"
    ).trim();

    const firstName = fullName.split(/\s+/)[0] || "Member";

    const nameNode = document.getElementById("sfAppUserName");
    const avatarNode = document.getElementById("sfAppAvatar");

    if (nameNode) nameNode.textContent = firstName;

    if (avatarNode) {
      avatarNode.textContent = firstName.charAt(0).toUpperCase();
    }
  }

  function setDashboardMode(view) {
    const active = view === "dashboard";

    document.body.classList.toggle("sf-dashboard-mode", active);

    document.querySelectorAll(".sf-app-side-link[data-view]")
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.view === view
        );
      });
  }

  function install() {
    if (!document.getElementById("sfDashboardVisualStyles")) {
      const style = document.createElement("style");
      style.id = "sfDashboardVisualStyles";
      style.textContent = styles;
      document.head.appendChild(style);
    }

    buildShell();

    if (
      typeof SF.navigate === "function" &&
      !SF.dashboardVisualNavigationWrapped
    ) {
      const previousNavigate = SF.navigate;

      SF.navigate = async function (view, ...args) {
        const result = await previousNavigate.call(this, view, ...args);
        setDashboardMode(view);
        return result;
      };

      SF.dashboardVisualNavigationWrapped = true;
    }

    setDashboardMode(
      document.getElementById("dashboardView")
        ?.classList.contains("active")
        ? "dashboard"
        : ""
    );

    const root = document.getElementById("dashboardView");

    if (root && !root.dataset.sfWalletNavigationInstalled) {
      root.dataset.sfWalletNavigationInstalled = "true";

      root.addEventListener("click", event => {
        const button = event.target.closest(
          '[data-sf-dashboard-action="wallet"]'
        );

        if (!button) return;

        event.preventDefault();

        document.getElementById("sfWalletPanel")
          ?.scrollIntoView({
            behavior:"smooth",
            block:"start"
          });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }

})();
      
