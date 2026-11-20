
/* =====================================================
   SHOPY FONT — AUTHENTICATION SYSTEM
   Login, Registration, Sessions, Referrals & Logout
===================================================== */

(() => {
  "use strict";

  // Keep all variables scoped to avoid conflicts with app.js.
  const SF = window.SF = window.SF || {};

  /* -----------------------------------------------------
     SUPABASE CLIENT
  ----------------------------------------------------- */

  SF.getClient = function () {
    if (!window.sfSupabase) {
      throw new Error("Supabase is not connected. Please reload the page.");
    }

    return window.sfSupabase;
  };

  /* -----------------------------------------------------
     AUTH MESSAGES
  ----------------------------------------------------- */

  SF.showAuthMessage = function (message, success = false) {
    const el = document.getElementById("authMessage");

    if (!el) {
      if (typeof SF.showToast === "function") {
        SF.showToast(message);
      }
      return;
    }

    el.textContent = message;
    el.style.color = success ? "#237a57" : "#b42318";
  };

  /* -----------------------------------------------------
     AUTH TABS
  ----------------------------------------------------- */

  SF.setAuthTab = function (tab) {
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

    SF.showAuthMessage("");
  };

  /* -----------------------------------------------------
     REFERRAL CODE
  ----------------------------------------------------- */

  SF.getReferralCodeFromUrl = function () {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("ref") ||
      params.get("referral") ||
      params.get("code") ||
      ""
    ).trim().toUpperCase();
  };

  /* -----------------------------------------------------
     REGISTRATION
  ----------------------------------------------------- */

  SF.register = async function (form) {
    const fd = new FormData(form);

    const fullName = String(fd.get("full_name") || "").trim();
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const confirmPassword = String(fd.get("confirm_password") || "");
    const phone = String(fd.get("phone") || "").trim();
    const country = String(fd.get("country") || "").trim();
    const heardAbout = String(fd.get("heard_about") || "").trim();

    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !country
    ) {
      throw new Error("Please complete all required registration fields.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    if (phone.replace(/\D/g, "").length < 7) {
      throw new Error("Please enter a valid phone number.");
    }

    if (password.length < 8) {
      throw new Error("Your password must contain at least 8 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Your passwords do not match.");
    }

    const referralCode = SF.getReferralCodeFromUrl();

    // The database signup trigger reads referral_code
    // directly from the new user's metadata.
    const { data, error } = await SF.getClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          country: country,
          heard_about: heardAbout,
          referral_code: referralCode || null
        }
      }
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("Registration did not return a user. Please try again.");
    }

    SF.currentUser = data.user;

    // Do not wait for additional profile or referral queries here.
    // The database trigger creates the profile and wallets.
    // App initialization loads the profile after navigation.

    if (!data.session) {
      throw new Error(
        "Your account was created, but email confirmation is required. Please check your email before signing in. Do not register again with the same email."
      );
    }

    return data;
  };

  /* -----------------------------------------------------
     SESSION RESTORATION
  ----------------------------------------------------- */

  SF.refreshSession = async function () {
    const { data, error } = await SF.getClient().auth.getSession();

    if (error) throw error;

    SF.currentUser = data.session?.user || null;

    if (SF.currentUser) {
      await SF.loadProfile();
    } else {
      SF.profile = null;
    }

    return SF.currentUser;
  };

  /* -----------------------------------------------------
     MEMBER PROFILE
  ----------------------------------------------------- */

  SF.loadProfile = async function () {
    if (!SF.currentUser) return null;

    const { data, error } = await SF.getClient()
      .from("profiles")
      .select("*")
      .eq("id", SF.currentUser.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Your account exists, but your profile is not ready. Please contact support."
      );
    }

    SF.profile = data;

    return data;
  };

  /* -----------------------------------------------------
     APPLY PENDING REFERRAL
     Retained for compatibility with existing code.
  ----------------------------------------------------- */

  SF.applyPendingReferral = async function () {
    const code = sessionStorage.getItem("sf_pending_ref");

    if (!code || !SF.currentUser) return false;

    const { data, error } = await SF.getClient().rpc(
      "sf_register_referral",
      {
        p_referral_code: code
      }
    );

    if (error) {
      console.warn("Referral registration:", error.message);
      return false;
    }

    sessionStorage.removeItem("sf_pending_ref");

    return data === true;
  };

  /* -----------------------------------------------------
     LOGIN
  ----------------------------------------------------- */

  SF.login = async function (form) {
    const fd = new FormData(form);

    const email = String(fd.get("email") || "")
      .trim()
      .toLowerCase();

    const password = String(fd.get("password") || "");

    if (!email || !password) {
      throw new Error("Enter your email address and password.");
    }

    const { data, error } = await SF.getClient().auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("Login was unsuccessful. Please try again.");
    }

    SF.currentUser = data.user;

    // Let app initialization restore the profile.
    if (typeof SF.updateNavigation === "function") {
      SF.updateNavigation();
    }

    window.location.replace(
      window.location.pathname +
      window.location.search +
      "#dashboard"
    );

    return data;
  };

  /* -----------------------------------------------------
     LOGOUT
  ----------------------------------------------------- */

  SF.logout = async function () {
    const { error } = await SF.getClient().auth.signOut();

    if (error) throw error;

    SF.currentUser = null;
    SF.profile = null;
  };

  /* -----------------------------------------------------
     FORM EVENT HANDLERS — INSTALL ONCE
  ----------------------------------------------------- */

  if (!SF.authFormEventsInstalled) {
    SF.authFormEventsInstalled = true;

    // Authentication tabs
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-auth-tab]");

      if (!button) return;

      event.preventDefault();
      SF.setAuthTab(button.dataset.authTab);
    });

    // LOGIN
    document.getElementById("loginForm")?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');

        if (button) button.disabled = true;

        SF.showAuthMessage("Signing you in...");

        try {
          await SF.login(form);
        } catch (error) {
          console.error("Login error:", error);

          SF.showAuthMessage(
            error.message || "Unable to log in."
          );

          if (button) button.disabled = false;
        }
      }
    );

    // REGISTRATION
    document.getElementById("registerForm")?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');

        if (button) button.disabled = true;

        SF.showAuthMessage("Creating your account...");

        try {
          await SF.register(form);

          if (typeof SF.updateNavigation === "function") {
            SF.updateNavigation();
          }

          // Continue without waiting for repeated database queries.
          window.location.replace(
            window.location.pathname +
            window.location.search +
            "#dashboard"
          );

        } catch (error) {
          console.error("Registration error:", error);

          SF.showAuthMessage(
            error.message || "Unable to create your account."
          );

          if (button) button.disabled = false;
        }
      }
    );
  }

  /* -----------------------------------------------------
     DEFAULT TAB
  ----------------------------------------------------- */

  SF.setAuthTab("register");

})();
         
