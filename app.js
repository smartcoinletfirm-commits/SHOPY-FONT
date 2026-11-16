
window.SF = window.SF || {};

/* =====================================================
   SHOPY FONT — CENTRAL NAVIGATION & ACCESS CONTROL
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
   NOTIFICATIONS
   ===================================================== */

SF.showToast = message => {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(SF.toastTimer);

  SF.toastTimer = setTimeout(
    () => el.classList.remove("show"),
    2800
  );
};

/* =====================================================
   MEMBERSHIP CLASSIFICATION
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

  const status = String(
    profile.account_status || ""
  ).trim().toLowerCase();

  const membershipType = String(
    profile.membership_type || ""
  ).trim().toLowerCase();

  const isApproved = status === "approved";

  const isCommunity =
    membershipType === "community" ||
    membershipType === "build_community";

  return {
    loggedIn: true,
    approved: isApproved,
    community: isApproved && isCommunity,
    fullMember: isApproved && !isCommunity,
    status
  };
};

/* =====================================================
   ACCESS RULES
   ===================================================== */

SF.canAccessView = async view => {
  const loginRequired = [
    "dashboard",
    "referrals",
    "admin"
  ];

  const fullMemberViews = [
    "marketplace",
    "opportunities",
    "scholarbridge"
  ];

  if (loginRequired.includes(view) && !SF.currentUser) {
    SF.setAuthTab("login");
    await SF.navigate("auth");
    return false;
  }

  if (
    fullMemberViews.includes(view) ||
    view === "referrals"
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
      await SF.loadProfile();
      access = await SF.getMembershipAccess();
    } catch (err) {
      console.error("Membership verification failed:", err);

      SF.showToast(
        "Unable to verify your membership. Please try again."
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

    if (access.community && fullMemberViews.includes(view)) {
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
   NAVIGATION
   ===================================================== */

SF.navigate = async view => {
  if (!view) return;

  const allowed = await SF.canAccessView(view);

  if (!allowed) return;

  const id = view === "home"
    ? "homeView"
    : view + "View";

  const target = document.getElementById(id);

  if (!target) {
    console.warn("SHOPY FONT view not found:", id);
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

  /* Load the selected workspace */

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
   TOP NAVIGATION VISIBILITY
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
   GLOBAL NAVIGATION EVENTS
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.getElementById("menuToggle")
    ?.addEventListener("click", () => {
      document.getElementById("mainNav")
        ?.classList.toggle("open");
    });

  document.addEventListener("click", async event => {
    const viewElement = event.target.closest("[data-view]");

    if (viewElement) {
      event.preventDefault();

      await SF.navigate(viewElement.dataset.view);
      return;
    }

    const actionElement = event.target.closest("[data-action]");
    const action = actionElement?.dataset.action;

    if (!action) return;

    try {
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
        return;
      }

    } catch (err) {
      console.error("Navigation action failed:", err);

      SF.showToast(
        err.message || "Something went wrong."
      );
    }
  });

  /* ===================================================
     INITIAL SESSION
     =================================================== */

  try {
    if (!window.sfSupabase) {
      throw new Error(
        "Supabase client did not initialize."
      );
    }

    await SF.refreshSession();

    SF.updateNavigation();

    await SF.trackProductVisit();

    const hash = location.hash.replace("#", "");

    if (
      new URLSearchParams(location.search).has("product")
    ) {
      await SF.navigate("marketplace");

    } else if (
      [
        "dashboard",
        "marketplace",
        "scholarbridge",
        "opportunities",
        "admin",
        "referrals"
      ].includes(hash)
    ) {
      await SF.navigate(hash);
    }

  } catch (err) {
    console.error("SHOPY FONT initialization error:", err);

    SF.showToast(
      "Connection issue. Check your Supabase setup and reload."
    );
  }
});
                          
