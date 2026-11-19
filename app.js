window.SF = window.SF || {};
/* Authentication tab fallback */
if (typeof window.SF.setAuthTab !== "function") {
  window.SF.setAuthTab = function (tab) {
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");

    if (!login || !register) return;

    const showLogin = tab === "login";

    login.classList.toggle("hidden", !showLogin);
    register.classList.toggle("hidden", showLogin);

    document.querySelectorAll("[data-auth-tab]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.authTab === (showLogin ? "login" : "register")
      );
    });

    const message = document.getElementById("authMessage");
    if (message) message.textContent = "";
  };
}

/* =====================================================
   SHOPY FONT — CENTRAL APPLICATION CONTROLLER
===================================================== */

SF.escapeHtml = value =>
  String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

SF.escapeAttr = SF.escapeHtml;

/* =====================================================
   TOAST NOTIFICATIONS
===================================================== */

SF.showToast = message => {
  const el = document.getElementById("toast");
  if (!el) {
    console.warn("SHOPY FONT:", message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(SF.toastTimer);

  SF.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 4000);
};

/* =====================================================
   MEMBERSHIP ACCESS
===================================================== */

SF.getMembershipAccess = async () => {
  if (!SF.currentUser) {
    return {
      loggedIn: false,
      approved: false,
      community: false,
      fullMember: false,
      status: "guest"
    };
  }

  const profile = SF.profile || await SF.loadProfile();

  if (!profile) {
    throw new Error("Your member profile could not be loaded.");
  }

  const status = String(profile.account_status || "")
    .trim().toLowerCase();

  const membershipType = String(profile.membership_type || "")
    .trim().toLowerCase();

  const approved = status === "approved";

  const community =
    membershipType === "community" ||
    membershipType === "build_community";

  return {
    loggedIn: true,
    approved,
    community: approved && community,
    fullMember: approved && !community,
    status
  };
};

/* =====================================================
   VIEW ACCESS CONTROL
===================================================== */

SF.canAccessView = async view => {
  const loginRequired = [
    "dashboard",
    "referrals",
    "admin",
    "scholarbridge"
  ];

  const fullMemberViews = [
    "marketplace",
    "opportunities"
  ];

  if (loginRequired.includes(view) && !SF.currentUser) {
    sessionStorage.setItem("sf_pending_view", view);

    SF.setAuthTab("login");
    await SF.navigate("auth");

    return false;
  }

  if (
    fullMemberViews.includes(view) ||
    view === "referrals" ||
    view === "scholarbridge"
  ) {
    if (!SF.currentUser) {
      SF.setAuthTab("register");
      await SF.navigate("auth");

      SF.showAuthMessage(
        "Create an account and complete membership activation to continue."
      );

      return false;
    }

    let access;

    try {
      const profile = await SF.loadProfile();

      if (!profile) {
        throw new Error("Member profile unavailable.");
      }

      access = await SF.getMembershipAccess();

    } catch (error) {
      console.error("Membership verification failed:", error);

      SF.showToast(
        error.message || "Unable to verify your membership."
      );

      return false;
    }

    if (!access.approved) {
      SF.showToast(
        "Your membership is not yet approved. Complete activation first."
      );

      await SF.navigate("dashboard");
      return false;
    }

    if (
      access.community &&
      (
        fullMemberViews.includes(view) ||
        view === "scholarbridge"
      )
    ) {
      SF.showToast(
        "This section requires full SHOPY FONT membership. Upgrade your Community account first."
      );

      await SF.navigate("dashboard");
      return false;
    }
  }

  return true;
};

/* =====================================================
   CENTRAL NAVIGATION
===================================================== */

SF.navigate = async view => {
  if (!view) return;

  view = String(view).trim();

  const allowed = await SF.canAccessView(view);

  if (!allowed) return;

  const id = view === "home"
    ? "homeView"
    : view + "View";

  const target = document.getElementById(id);

  if (!target) {
    console.warn("SHOPY FONT view not found:", id);
    SF.showToast("This section is currently unavailable.");
    return;
  }

  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === id
    );
  });

  document.getElementById("mainNav")
    ?.classList.remove("open");

  try {
    if (view === "dashboard") {
      await SF.loadDashboard();
    }

    if (view === "referrals") {
      await SF.loadReferralStats();
    }

    if (view === "marketplace") {
      await SF.loadProducts();
    }

    if (view === "admin") {
      await SF.loadAdmin();
    }

  } catch (error) {
    console.error("View loading failed:", error);

    SF.showToast(
      error.message || "Unable to load this section."
    );
  }

  history.replaceState(
    null,
    "",
    view === "home" ? "#" : `#${view}`
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

/* =====================================================
   NAVIGATION VISIBILITY
===================================================== */

SF.updateNavigation = () => {
  document.querySelectorAll(".signed-only").forEach(el => {
    el.classList.toggle(
      "hidden",
      !SF.currentUser
    );
  });

  const loginBtn = document.querySelector(
    '[data-action="login"]'
  );

  const joinBtn = document.querySelector(
    '[data-action="register"]'
  );

  loginBtn?.classList.toggle(
    "hidden",
    !!SF.currentUser
  );

  joinBtn?.classList.toggle(
    "hidden",
    !!SF.currentUser
  );
};

/* =====================================================
   GLOBAL BUTTON ACTIONS
===================================================== */

SF.handleAction = async action => {
  if (!action) return;

  if (action === "login" || action === "register") {
    SF.setAuthTab(action);
    await SF.navigate("auth");
    return;
  }

  if (action === "logout") {
    await SF.logout();

    SF.updateNavigation();
    SF.showToast("You have logged out.");

    await SF.navigate("home");
    return;
  }

  if (action === "sell-product") {
    if (!SF.currentUser) {
      SF.setAuthTab("login");
      await SF.navigate("auth");

      SF.showAuthMessage(
        "Log in before submitting a product."
      );

      return;
    }

    const access = await SF.getMembershipAccess();

    if (!access.fullMember) {
      SF.showToast(
        "Approved full membership is required to submit products."
      );
      return;
    }

    document.getElementById("productForm")
      ?.classList.remove("hidden");

    return;
  }

  if (action === "cancel-product") {
    document.getElementById("productForm")
      ?.classList.add("hidden");

    return;
  }

  if (action === "copy-referral") {
    if (!SF.currentUser) {
      SF.showToast("Please log in first.");
      return;
    }

    await SF.copyReferralLink();
    return;
  }

  if (action === "show-coming") {
    SF.showToast(
      "This section is being prepared. Check back soon."
    );
  }
};

/* =====================================================
   GLOBAL EVENT LISTENERS
===================================================== */

if (!SF.appEventsInstalled) {
  SF.appEventsInstalled = true;

  document.addEventListener("click", async event => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const viewElement = target.closest("[data-view]");

    if (viewElement) {
      event.preventDefault();

      try {
        await SF.navigate(viewElement.dataset.view);
      } catch (error) {
        console.error("Navigation failed:", error);
        SF.showToast(error.message || "Unable to open this section.");
      }

      return;
    }

    const actionElement = target.closest("[data-action]");

    if (!actionElement) return;

    const action = actionElement.dataset.action;

    try {
      await SF.handleAction(action);
    } catch (error) {
      console.error("Button action failed:", error);

      SF.showToast(
        error.message || "Something went wrong."
      );
    }
  });
}

/* =====================================================
   APPLICATION INITIALIZATION
===================================================== */

const initializeShopyFont = async () => {
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.getElementById("menuToggle")
    ?.addEventListener("click", () => {
      document.getElementById("mainNav")
        ?.classList.toggle("open");
    });

  try {
    if (!window.sfSupabase) {
      throw new Error(
        "Supabase client is missing. Check config.js and the Supabase library."
      );
    }

    if (typeof SF.refreshSession !== "function") {
      throw new Error(
        "Authentication did not load. Check auth.js."
      );
    }

    await SF.refreshSession();

    SF.updateNavigation();

    /* Product click tracking is optional.
       A tracking error must never block the application. */
    if (typeof SF.trackProductVisit === "function") {
      try {
        await SF.trackProductVisit();
      } catch (trackingError) {
        console.warn(
          "Product visit tracking failed:",
          trackingError
        );
      }
    }

    const hash = location.hash
      .replace("#", "")
      .trim()
      .toLowerCase();

    const hasProductLink =
      new URLSearchParams(location.search).has("product");

    const isMainEntry =
      location.pathname === "/" ||
      location.pathname.endsWith("/index.html");

    if (hasProductLink) {
      await SF.navigate("marketplace");
      return;
    }

    
    if (
      isMainEntry &&
      (
        !hash ||
        hash === "dashboard" ||
        hash === "home"
      )
    ) {
      if (SF.currentUser) {
        await SF.navigate("dashboard");
      } else {
        history.replaceState(
          null,
          "",
          location.pathname + location.search + "#"
        );

        document.body.classList.remove(
          "sf-dashboard-mode"
        );

        await SF.navigate("home");
      }

      return;
    }
    

    const validViews = [
      "dashboard",
      "marketplace",
      "scholarbridge",
      "opportunities",
      "admin",
      "referrals",
      "auth",
      "home"
    ];

    if (hash === "tasks" && SF.currentUser) {
      await SF.navigate("dashboard");
      return;
    }

    if (validViews.includes(hash)) {
      await SF.navigate(hash);
      return;
    }

    if (SF.currentUser) {
      await SF.navigate("dashboard");
    } else {
      await SF.navigate("home");
    }
    

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeShopyFont,
    { once: true }
  );
} else {
  initializeShopyFont();
       }
    
