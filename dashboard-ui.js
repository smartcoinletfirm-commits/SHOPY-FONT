
/* =====================================================
   SHOPY FONT — NEW MEMBER DASHBOARD DESIGN
   Purple / Blue / White visual system
   Existing Supabase functions remain in place.
   ===================================================== */

(() => {
  "use strict";

  window.SF = window.SF || {};

  const styles = `
    body.sf-dashboard-mode {
      background: #f7f8fc;
      color: #171b46;
    }

    body.sf-dashboard-mode .announcement,
    body.sf-dashboard-mode .topbar,
    body.sf-dashboard-mode .footer {
      display: none !important;
    }

    #dashboardView.sf-dashboard-view {
      display: block;
      max-width: none;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #f7f8fc;
    }

    .sf-app-header {
      min-height: 88px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 22px;
      padding: 15px 30px;
      background: #fff;
      border-bottom: 1px solid #e9eaf2;
    }

    .sf-app-brand {
      display: flex;
      align-items: center;
      gap: 13px;
      min-width: 280px;
      color: #4923c6;
      font-family: Manrope, sans-serif;
      font-size: 23px;
      font-weight: 900;
      letter-spacing: -.8px;
    }

    .sf-app-brand small {
      display: block;
      margin-top: 2px;
      color: #70718d;
      font-family: "DM Sans", sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0;
    }

    .sf-app-logo {
      width: 65px;
      height: 65px;
      flex-shrink: 0;
    }

    .sf-app-search {
      flex: 1;
      max-width: 710px;
      min-width: 100px;
      height: 58px;
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 0 22px;
      border-radius: 40px;
      background: #f3f4fa;
      color: #727594;
    }

    .sf-app-search input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: #25294f;
      font-size: 15px;
    }

    .sf-app-user {
      display: flex;
      align-items: center;
      gap: 13px;
      color: #171b46;
      font-weight: 800;
      white-space: nowrap;
    }

    .sf-app-notice {
      position: relative;
      border: 0;
      background: transparent;
      color: #666b8c;
      font-size: 25px;
    }

    .sf-app-avatar {
      width: 49px;
      height: 49px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: linear-gradient(135deg,#1764dc,#3988f2);
      color: #fff;
      font-size: 22px;
      font-weight: 800;
    }

    .sf-app-layout {
      display: grid;
      grid-template-columns: 315px minmax(0,1fr);
      min-height: calc(100vh - 88px);
    }

    .sf-app-sidebar {
      padding: 32px 18px;
      background: #fff;
      border-right: 1px solid #e9eaf2;
    }

    .sf-app-side-link {
      width: 100%;
      min-height: 62px;
      display: flex;
      align-items: center;
      gap: 17px;
      margin-bottom: 7px;
      padding: 13px 18px;
      border: 0;
      border-radius: 15px;
      background: transparent;
      color: #171b46;
      text-align: left;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: .2s;
    }

    .sf-app-side-link:hover,
    .sf-app-side-link.active {
      background: #f1edff;
      color: #5125d5;
    }

    .sf-app-side-icon {
      width: 28px;
      text-align: center;
      font-size: 22px;
    }

    .sf-app-side-bottom {
      margin-top: 30px;
      padding-top: 25px;
      border-top: 1px solid #eceef4;
    }

    .sf-app-logout {
      width: 100%;
      min-height: 59px;
      border: 0;
      border-radius: 13px;
      background: linear-gradient(110deg,#5420c9,#3c16b4);
      color: white;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
    }

    .sf-app-main {
      min-width: 0;
      padding: 35px 28px 65px;
      overflow: hidden;
    }

    .sf-app-main > .page-heading {
      display: none;
    }

    #approvedDashboard {
      max-width: none;
      padding: 0;
      margin: 0;
    }

    #sfMemberOverview {
      margin: 0 0 25px !important;
    }

    #sfMemberOverview .sf-dash-welcome {
      min-height: 95px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: #171b46;
    }

    #sfMemberOverview .sf-dash-welcome h2 {
      color: #171b46;
      font-size: clamp(25px,3vw,37px);
    }

    #sfMemberOverview .sf-dash-welcome p {
      color: #525879;
      font-size: 15px;
    }

    #sfMemberOverview .sf-dash-welcome small {
      color: #777b9b;
    }

    #sfMemberOverview .sf-dash-status {
      background: #dcf6ee;
      border: 0;
      color: #087b43;
    }

    #sfMemberOverview .sf-dash-referral {
      background: white;
      border-color: #e5e7f0;
    }

    #sfMemberOverview .sf-dash-workspace {
      margin-top: 25px;
    }

    .sf-wallet-panel {
      margin: 20px 0 25px !important;
      padding: 22px !important;
      border: 1px solid #e4e6f0 !important;
      border-radius: 17px !important;
      background: white !important;
      box-shadow: 0 5px 20px rgba(27,31,80,.045) !important;
    }

    .sf-wallet-heading {
      display: none !important;
    }

    .sf-wallet-main {
      position: relative;
      min-height: 240px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0 !important;
      padding: 35px !important;
      overflow: hidden;
      border-radius: 17px !important;
      background:
        radial-gradient(circle at 80% 20%,rgba(255,255,255,.17),transparent 25%),
        linear-gradient(110deg,#6331d4,#276be6 70%,#21a8e9) !important;
    }

    .sf-wallet-main:after {
      content: " ";
      position: absolute;
      width: 360px;
      height: 360px;
      right: -80px;
      top: -170px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 50%;
      box-shadow: 0 0 0 35px rgba(255,255,255,.035),
                  0 0 0 75px rgba(255,255,255,.025);
      pointer-events: none;
    }

    .sf-wallet-main span {
      color: #eee9ff !important;
      font-size: 14px !important;
    }

    .sf-wallet-main strong {
      position: relative;
      z-index: 1;
      font-size: clamp(42px,6vw,67px) !important;
      letter-spacing: -2px;
    }

    .sf-wallet-main small {
      color: white !important;
      font-size: 14px !important;
      letter-spacing: 0 !important;
    }

    .sf-wallet-stats {
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .sf-wallet-stats div {
      min-height: 105px;
      padding: 22px 17px;
      border: 1px solid #e5e7f0;
      border-radius: 15px;
      background: white;
    }

    .sf-wallet-stats span {
      color: #626888;
      font-size: 13px;
    }

    .sf-wallet-stats strong {
      color: #171b46;
      font-size: 25px;
    }

    .sf-wallet-history {
      margin-top: 25px;
      padding: 20px;
      border: 1px solid #e5e7f0;
      border-radius: 15px;
      background: white;
    }

    .sf-wallet-history h3 {
      color: #171b46;
      font-size: 21px;
    }

    .sf-wallet-transaction {
      min-height: 70px;
      padding: 15px 0;
      border-color: #eceef4;
    }

    .sf-wallet-transaction strong {
      color: #171b46;
      font-size: 14px;
    }

    .sf-wallet-transaction .sf-wallet-positive {
      color: #078442;
      font-size: 17px;
    }

    .sf-wallet-transaction .sf-wallet-negative {
      color: #b42318;
      font-size: 17px;
    }

    .sf-wallet-bonus {
      border-color: #e5e7f0;
      background: #f8f7ff;
    }

    @media(max-width:1000px) {
      .sf-app-layout {
        grid-template-columns: 235px minmax(0,1fr);
      }

      .sf-app-sidebar {
        padding: 22px 12px;
      }

      .sf-app-main {
        padding: 25px 18px 45px;
      }
    }

    @media(max-width:700px) {
      .sf-app-header {
        min-height: 72px;
        padding: 10px 13px;
        gap: 9px;
      }

      .sf-app-brand {
        min-width: 0;
        font-size: 16px;
        gap: 7px;
      }

      .sf-app-brand small {
        font-size: 8px;
      }

      .sf-app-logo {
        width: 43px;
        height: 43px;
      }

      .sf-app-search {
        display: none;
      }

      .sf-app-user {
        gap: 7px;
        font-size: 12px;
      }

      .sf-app-avatar {
        width: 37px;
        height: 37px;
        font-size: 17px;
      }

      .sf-app-layout {
        display: block;
      }

      .sf-app-sidebar {
        display: flex;
        gap: 5px;
        padding: 9px;
        overflow-x: auto;
        border-right: 0;
        border-bottom: 1px solid #e9eaf2;
      }

      .sf-app-side-link {
        width: auto;
        min-width: max-content;
        min-height: 43px;
        margin: 0;
        padding: 8px 12px;
        gap: 7px;
        font-size: 12px;
      }

      .sf-app-side-icon {
        font-size: 16px;
      }

      .sf-app-side-bottom {
        display: none;
      }

      .sf-app-main {
        padding: 20px 13px 40px;
      }

      .sf-wallet-main {
        min-height: 185px;
        padding: 24px !important;
      }

      .sf-wallet-stats {
        gap: 7px;
      }

      .sf-wallet-stats div {
        min-height: 85px;
        padding: 13px 9px;
      }

      .sf-wallet-stats strong {
        font-size: 17px;
      }
    }
  `;

  function buildShell() {
    const root = document.getElementById("dashboardView");
    if (!root || root.dataset.sfShellBuilt === "true") return;

    root.dataset.sfShellBuilt = "true";
    root.classList.add("sf-dashboard-view");

    const logo = `
      <svg class="sf-app-logo" viewBox="0 0 100 100"
           xmlns="http://www.w3.org/2000/svg" aria-label="SHOPY FONT logo">
        <defs>
          <linearGradient id="sfBagGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#713ce0"/>
            <stop offset="100%" stop-color="#3513ae"/>
          </linearGradient>
        </defs>
        <path d="M29 34V25a21 21 0 0 1 42 0v9"
              fill="none" stroke="#6330d4" stroke-width="8"
              stroke-linecap="round"/>
        <rect x="13" y="31" width="74" height="61" rx="12"
              fill="url(#sfBagGradient)"/>
        <path d="M36 50l14 12 15-12M50 62v15"
              fill="none" stroke="white" stroke-width="5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const shell = document.createElement("div");
    shell.className = "sf-app-shell";

    shell.innerHTML = `
      <header class="sf-app-header">
        <a class="sf-app-brand" href="#dashboard">
          ${logo}
          <span>SHOPY FONT
            <small>Your World. Your Opportunities.</small>
          </span>
        </a>

        <div class="sf-app-search">
          <span>⌕</span>
          <input type="search"
            placeholder="Search products, opportunities..."
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
            <span class="sf-app-side-icon">🛒</span>Marketplace
          </button>
          <button class="sf-app-side-link" data-view="opportunities">
            <span class="sf-app-side-icon">✿</span>Opportunities
          </button>
          <button class="sf-app-side-link" data-view="scholarbridge">
            <span class="sf-app-side-icon">♧</span>ScholarBridge
          </button>
          <button class="sf-app-side-link" data-view="referrals">
            <span class="sf-app-side-icon">♙</span>Referrals
          </button>
          <button class="sf-app-side-link" data-view="dashboard">
            <span class="sf-app-side-icon">▣</span>Wallet
          </button>
          <button class="sf-app-side-link" data-view="dashboard">
            <span class="sf-app-side-icon">♙</span>Profile
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

    const name = String(
      SF.profile?.full_name || "Member"
    ).trim();

    const firstName = name.split(/\\s+/)[0];

    const nameNode = document.getElementById("sfAppUserName");
    const avatarNode = document.getElementById("sfAppAvatar");

    if (nameNode) nameNode.textContent = firstName;
    if (avatarNode) {
      avatarNode.textContent = firstName.charAt(0).toUpperCase() || "M";
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
      document.getElementById("dashboardView")?.classList.contains("active")
        ? "dashboard"
        : ""
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
      
