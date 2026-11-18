/* =========================================================
   SHOPY FONT — DEFINITIVE PUBLIC ENTRY ROUTE
   Prevents automatic startup from exposing member dashboard.
========================================================= */
(() => {
  "use strict";

  const isPublicEntry =
    location.pathname === "/" ||
    location.pathname.endsWith("/index.html");

  const hasDeepLink = Boolean(
    location.hash &&
    location.hash !== "#" &&
    location.hash !== "#home"
  );

  if (!isPublicEntry || hasDeepLink) return;

  // Mark this as a public first-entry session.
  document.documentElement.classList.add("sf-public-entry");

  const style = document.createElement("style");
  style.id = "sf-public-entry-guard";
  style.textContent = `
    html.sf-public-entry #dashboardView,
    html.sf-public-entry #approvedDashboard,
    html.sf-public-entry #activationWorkspace,
    html.sf-public-entry #reviewWorkspace,
    html.sf-public-entry #rejectedWorkspace,
    html.sf-public-entry #welcomeView {
      display: none !important;
    }

    html.sf-public-entry #homeView {
      display: block !important;
    }

    html.sf-public-entry body.sf-dashboard-mode .topbar,
    html.sf-public-entry body.sf-dashboard-mode .announcement {
      display: flex !important;
    }

    html.sf-public-entry body.sf-dashboard-mode #dashboardView {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  let userHasInteracted = false;

  // Only a real user interaction ends the public-entry guard.
  document.addEventListener("click", event => {
    if (event.isTrusted) userHasInteracted = true;
  }, true);

  function forcePublicHome() {
    const SF = window.SF;

    if (!SF || typeof SF.navigate !== "function") return;

    const currentNavigate = SF.navigate;

    if (SF.publicEntryGuardInstalled) return;

    SF.publicEntryGuardInstalled = true;

    SF.navigate = async function (view, ...args) {
      if (!userHasInteracted && view !== "home") {
        history.replaceState(
          null,
          "",
          location.pathname + location.search
        );

        return currentNavigate.call(this, "home", ...args);
      }

      if (view === "home") {
        document.documentElement.classList.add("sf-public-entry");
      } else {
        document.documentElement.classList.remove("sf-public-entry");
      }

      return currentNavigate.call(this, view, ...args);
    };

    // Clear an old dashboard hash and force the public home.
    history.replaceState(
      null,
      "",
      location.pathname + location.search
    );

    currentNavigate.call(SF, "home").catch(error => {
      console.error("SHOPY FONT public homepage error:", error);
    });
  }

  // Wait until all deferred scripts have loaded.
  window.addEventListener("load", () => {
    forcePublicHome();

    // Recheck after startup authentication/navigation callbacks.
    setTimeout(forcePublicHome, 700);
    setTimeout(forcePublicHome, 1800);
  }, { once: true });

})();

