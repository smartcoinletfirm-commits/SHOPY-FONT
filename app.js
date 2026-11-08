
SF.escapeHtml = value =>
  String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

SF.escapeAttr = SF.escapeHtml;

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

SF.navigate = async view => {
  if (["dashboard", "referrals", "admin"].includes(view) && !SF.currentUser) {
    SF.setAuthTab("login");
    SF.navigate("auth");
    return;
  }

  if (view === "referrals" && SF.currentUser) {
    try {
      await SF.loadProfile();

      if (SF.profile?.account_status !== "approved") {
        SF.showToast("Your account must be approved first.");
        SF.navigate("dashboard");
        return;
      }
    } catch (err) {
      SF.showToast("Could not verify your account status.");
      SF.navigate("dashboard");
      return;
    }
  }

  const id = view === "home" ? "homeView" : view + "View";

  document.querySelectorAll(".view").forEach(v => {
    v.classList.toggle("active", v.id === id);
  });

  document.getElementById("mainNav")?.classList.remove("open");

  if (view === "dashboard") {
    SF.loadDashboard().catch(e => SF.showToast(e.message));
  }

  if (view === "referrals") {
    SF.loadReferralStats().catch(e => SF.showToast(e.message));
  }

  if (view === "marketplace") {
    SF.loadProducts();
  }

  if (view === "admin") {
    SF.loadAdmin();
  }

  history.replaceState(
    null,
    "",
    view === "home" ? "#" : `#${view}`
  );

  window.scrollTo({ top: 0, behavior: "smooth" });
};

SF.updateNavigation = () => {
  document.querySelectorAll(".signed-only").forEach(el => {
    el.classList.toggle("hidden", !SF.currentUser);
  });

  const loginBtn = document.querySelector('[data-action="login"]');
  const joinBtn = document.querySelector('[data-action="register"]');

  loginBtn?.classList.toggle("hidden", !!SF.currentUser);
  joinBtn?.classList.toggle("hidden", !!SF.currentUser);
};

document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("mainNav")?.classList.toggle("open");
  });

  document.addEventListener("click", async e => {
    const view = e.target.closest("[data-view]");

    if (view) {
      e.preventDefault();
      SF.navigate(view.dataset.view);
      return;
    }

    const action = e.target.closest("[data-action]")?.dataset.action;

    if (!action) return;

    try {
      if (action === "login" || action === "register") {
        SF.setAuthTab(action);
        SF.navigate("auth");
      }

      if (action === "logout") {
        await SF.logout();
        SF.updateNavigation();
        SF.showToast("You have logged out.");
        SF.navigate("home");
      }

      if (action === "sell-product") {
        if (!SF.currentUser) {
          SF.navigate("auth");
          SF.setAuthTab("login");
          SF.showAuthMessage("Log in before submitting a product.");
        } else {
          document.getElementById("productForm")?.classList.remove("hidden");
        }
      }

      if (action === "cancel-product") {
        document.getElementById("productForm")?.classList.add("hidden");
      }

      if (action === "copy-referral") {
        await SF.copyReferralLink();
      }

      if (action === "show-coming") {
        SF.showToast("This section is being prepared. Check back soon.");
      }

    } catch (err) {
      SF.showToast(err.message || "Something went wrong.");
    }
  });

  try {
    if (!window.sfSupabase) {
      throw new Error("Supabase client did not initialize.");
    }

    await SF.refreshSession();
    SF.updateNavigation();
    await SF.trackProductVisit();

    const hash = location.hash.replace("#", "");

    if (new URLSearchParams(location.search).has("product")) {
      SF.navigate("marketplace");
    } else if (
      ["dashboard", "marketplace", "scholarbridge", "opportunities", "admin", "referrals"].includes(hash)
    ) {
      SF.navigate(hash);
    }

  } catch (err) {
    console.error(err);
    SF.showToast("Connection issue. Check Supabase setup.");
  }
});
