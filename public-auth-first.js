
/* SHOPY FONT — FIRST-SCREEN AUTHENTICATION
   Reuses existing Supabase forms and event handlers.
*/
(() => {
  "use strict";

  const SF = window.SF = window.SF || {};

  const css = document.createElement("style");
  css.textContent = `
    #authView { display:none !important; }

    #homeView.sf-public-home .sf-home-hero {
      min-height:0;
      grid-template-columns:minmax(0,1fr) minmax(340px,.9fr);
      gap:35px;
      padding-top:38px;
      padding-bottom:42px;
    }

    #homeView .sf-auth-first-card {
      width:100%;
      max-width:510px;
      justify-self:end;
      padding:22px;
      border:1px solid #ffffff35;
      border-radius:20px;
      background:#fff;
      color:#17243a;
      box-shadow:0 24px 65px #050d1d55;
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
      border-radius:11px;
      background:#f0f2f7;
    }

    #homeView .sf-auth-first-card .auth-tab {
      min-height:42px;
      border:0;
      border-radius:8px;
      background:transparent;
      color:#64718a;
      font-weight:800;
    }

    #homeView .sf-auth-first-card .auth-tab.active {
      background:#172b49;
      color:#fff;
    }

    #homeView .sf-auth-first-card .auth-form h2 {
      margin:17px 0 5px;
      color:#17243a;
      font:800 24px Manrope,sans-serif;
    }

    #homeView .sf-auth-first-card .auth-form > .muted {
      margin-bottom:12px;
      color:#718096;
      font-size:12px;
    }

    #homeView .sf-auth-first-card .auth-form label {
      display:block;
      margin:10px 0;
      color:#34445c;
      font-size:11px;
      font-weight:800;
    }

    #homeView .sf-auth-first-card .auth-form input,
    #homeView .sf-auth-first-card .auth-form select {
      width:100%;
      min-height:42px;
      margin-top:5px;
      padding:10px 12px;
      border:1px solid #dfe4ed;
      border-radius:8px;
      background:#fbfcfe;
      color:#17243a;
    }

    #homeView .sf-auth-first-card .btn-full {
      width:100%;
      min-height:46px;
      margin-top:8px;
      border:0;
      border-radius:9px;
      background:linear-gradient(120deg,#d8b56e,#f0d9a5);
      color:#17243a;
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

    if (!home || !panel) return false;

    const visual = home.querySelector(".sf-home-visual");
    if (!visual) return false;

    const mount = document.createElement("div");
    mount.className = "sf-auth-first-card";
    mount.id = "sfAuthFirstCard";
    visual.replaceWith(mount);
    mount.appendChild(panel);

    // Add phone to the existing registration form only once.
    const register = document.getElementById("registerForm");
    if (register && !register.querySelector('[name="phone"]')) {
      const emailLabel = register.querySelector('[name="email"]')?.closest("label");

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
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }

  // Login and registration buttons now open the first-screen forms.
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
