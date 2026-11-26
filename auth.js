/* =====================================================
   SHOPY FONT — AUTHENTICATION SYSTEM
   Login, Registration, Sessions, Referrals & Logout
   CORRECTED REFERRAL CAPTURE AND REGISTRATION
===================================================== */

(() => {
  "use strict";

  const SF = window.SF = window.SF || {};

  /* =====================================================
     SUPABASE CLIENT
  ===================================================== */

  SF.getClient = function () {
    if (!window.sfSupabase) {
      throw new Error("Supabase is not connected. Please reload the page.");
    }

    return window.sfSupabase;
  };

  /* =====================================================
     CAPTURE REFERRAL LINK IMMEDIATELY
     Example: ?ref=ABC123
  ===================================================== */

  SF.getReferralCodeFromUrl = function () {
    const params = new URLSearchParams(window.location.search);

    const code = (
      params.get("ref") ||
      params.get("referral") ||
      params.get("code") ||
      ""
    ).trim().toUpperCase();

    return code;
  };

  SF.captureReferralCode = function () {
    try {
      const code = SF.getReferralCodeFromUrl();

      if (code) {
        sessionStorage.setItem("sf_pending_ref", code);
      }

      return sessionStorage.getItem("sf_pending_ref") || "";
    } catch (error) {
      console.warn("Referral capture failed:", error);
      return "";
    }
  };

  // Capture referral immediately when this file loads.
  SF.captureReferralCode();

  /* =====================================================
     AUTH MESSAGES
  ===================================================== */

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

  /* =====================================================
     AUTH TABS
  ===================================================== */

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

  /* =====================================================
     APPLY PENDING REFERRAL
     Referral is processed only when a logged-in user exists.
  ===================================================== */

  SF.applyPendingReferral = async function () {
    const code = (
      sessionStorage.getItem("sf_pending_ref") ||
      SF.getReferralCodeFromUrl() ||
      ""
    ).trim().toUpperCase();

    if (!code || !SF.currentUser) {
      return false;
    }

    // Keep the referral code available until the RPC succeeds.
    try {
      sessionStorage.setItem("sf_pending_ref", code);
    } catch (_) {}

    try {
      const { data, error } = await SF.getClient().rpc(
        "sf_register_referral",
        {
          p_referral_code: code
        }
      );

      if (error) {
        console.warn("Referral registration failed:", error.message);
        return false;
      }

      // Remove the pending code only after successful RPC execution.
      sessionStorage.removeItem("sf_pending_ref");

      console.log("Referral registration RPC completed.", data);

      return true;

    } catch (error) {
      console.warn("Referral registration error:", error);
      return false;
    }
  };

  /* =====================================================
     REGISTRATION
  ===================================================== */

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

    // Ensure the referral code was captured before registration.
    const referralCode =
      SF.captureReferralCode() ||
      sessionStorage.getItem("sf_pending_ref") ||
      "";

    const { data, error } = await SF.getClient().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          country,
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
    SF.profile = null;

    // If signup created a session immediately, process the referral now.
    // If email verification is required, the code stays pending for login.
    if (data.session && referralCode) {
      await SF.applyPendingReferral();
    }

    if (!data.session) {
      throw new Error(
        "Your account was created, but email confirmation is required. Check your email before signing in. Do not register again with the same email."

      );
    }

    return data;
  };

  /* =====================================================
     SESSION RESTORATION
  ===================================================== */

  SF.refreshSession = async function () {
    const { data, error } = await SF.getClient().auth.getSession();

    if (error) throw error;

    SF.currentUser = data.session?.user || null;

    if (!SF.currentUser) {
      SF.profile = null;
    }

    return SF.currentUser;
  };

  /* =====================================================
     MEMBER PROFILE
  ===================================================== */

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

  /* =====================================================
     LOGIN
  ===================================================== */

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
    SF.profile = null;

    SF.showAuthMessage("Signed in. Preparing your account...", true);

    // Attempt to apply the referral after successful authentication.
    // Referral errors do not block login.
    await SF.applyPendingReferral();

    // Verify admin status before choosing the destination.
    let isAdmin = false;

    if (typeof SF.checkAdmin === "function") {
      try {
        isAdmin = await SF.checkAdmin();
      } catch (adminError) {
        console.warn("Admin verification failed:", adminError);
      }
    }

    if (typeof SF.updateNavigation === "function") {
      SF.updateNavigation();
    }

    // Navigate without reloading the whole application.
    if (typeof SF.navigate === "function") {
      await SF.navigate(isAdmin ? "admin" : "dashboard");
    } else {
      window.location.hash = isAdmin ? "admin" : "dashboard";
    }

    return data;
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  SF.logout = async function () {
    const { error } = await SF.getClient().auth.signOut();

    if (error) throw error;

    SF.currentUser = null;
    SF.profile = null;
    SF.adminAuthorized = false;
  };

  /* =====================================================
     FORM EVENTS — INSTALL ONCE
  ===================================================== */

  if (!SF.authFormEventsInstalled) {
    SF.authFormEventsInstalled = true;

    document.addEventListener("click", event => {
      const button = event.target.closest("[data-auth-tab]");

      if (!button) return;

      event.preventDefault();
      SF.setAuthTab(button.dataset.authTab);
    });

    /* LOGIN FORM */

    document.getElementById("loginForm")?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const form = event.currentTarget;

        if (form.dataset.submitting === "true") return;

        const button = form.querySelector('[type="submit"]');
        const originalText = button?.textContent;

        form.dataset.submitting = "true";

        if (button) {
          button.disabled = true;
          button.textContent = "Signing in...";
        }

        SF.showAuthMessage("Signing you in. Please wait...");

        try {
          await SF.login(form);

        } catch (error) {
          console.error("Login error:", error);

          SF.showAuthMessage(
            error.message || "Unable to log in. Please try again."
          );

        } finally {
          form.dataset.submitting = "false";

          if (button) {
            button.disabled = false;
            button.textContent = originalText || "Sign In";
          }
        }
      }
    );

    /* REGISTRATION FORM */

    document.getElementById("registerForm")?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const form = event.currentTarget;

        if (form.dataset.submitting === "true") return;

        const button = form.querySelector('[type="submit"]');
        const originalText = button?.textContent;

        form.dataset.submitting = "true";

        if (button) {
          button.disabled = true;
          button.textContent = "Creating account...";
        }

        SF.showAuthMessage("Creating your account. Please wait...");

        try {
          await SF.register(form);

          if (typeof SF.updateNavigation === "function") {
            SF.updateNavigation();
          }

          SF.showAuthMessage(
            "Account created. Preparing your next step...",
            true
          );

          // Continue without a full-page reload.
          if (typeof SF.navigate === "function") {
            await SF.navigate("dashboard");
          } else {
            window.location.hash = "dashboard";
          }

        } catch (error) {
          console.error("Registration error:", error);

          SF.showAuthMessage(
            error.message || "Unable to create your account."
          );

        } finally {
          form.dataset.submitting = "false";

          if (button) {
            button.disabled = false;
            button.textContent = originalText || "Create Account";
          }
        }
      }
    );
  }

  /* =====================================================
     DEFAULT TAB
  ===================================================== */

  SF.setAuthTab("register");

})();
