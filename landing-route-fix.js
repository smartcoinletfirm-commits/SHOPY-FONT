
/* SHOPY FONT — PUBLIC LANDING ROUTE FIX */
(() => {
  "use strict";

  function openPublicLanding() {
    const SF = window.SF;

    if (!SF || typeof SF.navigate !== "function") {
      console.error("SHOPY FONT navigation is not ready.");
      return;
    }

    const isMainPage =
      location.pathname === "/" ||
      location.pathname.endsWith("/index.html");

    const isProductLink =
      new URLSearchParams(location.search).has("product");

    if (!isMainPage || isProductLink) return;

    // Do not restore an old member dashboard on the public URL.
    history.replaceState(null, "", location.pathname + location.search);

    // Remove any dashboard visual mode left by startup scripts.
    document.body.classList.remove("sf-dashboard-mode");

    // Always display the public homepage on the main URL.
    SF.navigate("home").catch(error => {
      console.error("Public homepage navigation failed:", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", openPublicLanding, {
      once: true
    });
  } else {
    openPublicLanding();
  }
})();
