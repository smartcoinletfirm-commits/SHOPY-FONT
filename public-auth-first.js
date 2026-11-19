
/* SHOPY FONT — FIRST-SCREEN AUTHENTICATION
   Reuses existing Supabase forms and event handlers.
   Emerald green and white styling.
*/
(() => {
  "use strict";

  const SF = window.SF = window.SF || {};

  const css = document.createElement("style");
  css.textContent = `
    #authView {
      display:none !important;
    }

    #homeView.sf-public-home .sf-home-hero {
      min-height:0;
      grid-template-columns:minmax(0,1fr) minmax(320px,.9fr);
      align-items:center;
      gap:35px;
      padding-top:38px;
      padding-bottom:42px;
    }

    #homeView .sf-auth-first-card {
      width:100%;
      max-width:510px;
      justify-self:end;
      padding:22px;
      border:1px solid #e1eee5;
      border-radius:18px;
      background:#fff;
      color:#193629;
      box-shadow:0 20px 55px #061d1230;
    }

    #homeView .sf-auth-first-card .auth-panel {
      padding:0;
      border:0;
      box-shadow:none;
      background:transparent;
    }

    #homeView .sf-auth-first-card .auth-tabs {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:5px;
      padding:5px;
      border-radius:10px;
      background:#edf5ef;
    }

    #homeView .sf-auth-first-card .auth-tab {
      min-height:42px;
      border:0;
      border-radius:8px;
      background:transparent;
      color:#547060;
      font-weight:800;
    }

    #homeView .sf-auth-first-card .auth-tab.active {
      background:#176b47;
      color:#fff;
    }

    #homeView .sf-auth-first-card .auth-form h2 {
      margin:17px 0 5px;
      color:#17462f;
      font:800 24px Manrope,sans-serif;
    }

    #homeView .sf-auth-first-card .auth-form > .muted {
      margin-bottom:12px;
      color:#718176;
      font-size:12px;
    }

    #homeView .sf-auth-first-card .auth-form label {
      display:block;
      margin:10px 0;
      color:#344d3e;
      font-size:11px;
      font-weight:800;
    }

    #homeView .sf-auth-first-card .auth-form input,
    #homeView .sf-auth-first-card .auth-form select {
      width:100%;
      min-height:42px;
      margin-top:5px;
      padding:10px 12px;
      border:1px solid #dce9df;
      border-radius:8px;
      background:#fbfdfb;
      color:#193629;
    }

    #homeView .sf-auth-first-card .btn-full {
      width:100%;
      min-height:46px;
      margin-top:8px;
      border:0;
      border-radius:9px;
      background:#176b47;
      color:#fff;
      font-weight:900;
    }

    @media(max-width:800px) {
      #homeView.sf-public-home .sf-home-hero {
        grid-template-columns:1fr;
        gap:22px;
        padding:30px 14px;
      }

      #homeView .sf-auth-first-card {
        max-width:100%;
        justify-self:stretch;
        padding:17px;
      }

      #homeView.sf-public-home .sf-home-hero h1 {
        font-size:clamp(34px,9vw,48px);
      }
    }
  `;

  document.head.appendChild(css);

  function install() {
    const home = document.getElementById("homeView");
    const auth = document.getElementById("authView");
    const panel = auth?.querySelector(".auth-panel");
    const hero = home?.querySelector(".sf-home-hero");

    if (!home || !panel || !hero) return false;

    // Do not mount the same form twice.
    if (document.getElementById("sfAuthFirstCard")) {
      return true;
    }

    const mount = document.createElement("div");
    mount.className = "sf-auth-first-card";
    mount.id = "sfAuthFirstCard";

    // Place the existing authentication form beside the welcome text.
    const welcomeContent = hero.firstElementChild;

    if (welcomeContent) {
      welcomeContent.insertAdjacentElement("afterend", mount);
    } else {
      hero.appendChild(mount);
    }

    mount.appendChild(panel);

    // Add phone number to registration only if it is missing.
    const register = document.getElementById("registerForm");

    if (register && !register.querySelector('[name="phone"]')) {
      const emailLabel = register
        .querySelector('[name="email"]')
        ?.closest("label");

      if (emailLabel) {
        emailLabel.insertAdjacentHTML("afterend", `
          <label>Phone number
            <input
              name="phone"
              type="tel"
              autocomplete="tel"
              required
              maxlength="30"
              placeholder="+254 7XX XXX XXX"
            >
          </label>
        `);
      }
    }

    SF.setAuthTab?.("register");
    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, {
      once:true
    });
  } else {
    install();
  }

  // Keep login and registration on the welcome page.
  const originalNavigate = SF.navigate;

  if (typeof originalNavigate === "function") {
    SF.navigate = async function(view) {
      if (view === "auth") {
        return originalNavigate("home");
      }

      return originalNavigate(view);
    };
  }
})();
