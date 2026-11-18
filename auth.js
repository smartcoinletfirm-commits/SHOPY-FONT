
window.SF = window.SF || {};

SF.currentUser = null;
SF.profile = null;

/* =====================================================
   SUPABASE CLIENT
===================================================== */

SF.getClient = () => {
  if (!window.sfSupabase) {
    throw new Error("Connection is not ready. Check config.js and reload.");
  }

  return window.sfSupabase;
};

/* =====================================================
   REFERRAL CODE
===================================================== */

SF.getReferralCodeFromUrl = () =>
  (
    new URLSearchParams(location.search).get("ref") ||
    sessionStorage.getItem("sf_pending_ref") ||
    ""
  ).trim().toUpperCase();

/* =====================================================
   AUTH MESSAGES
===================================================== */

SF.showAuthMessage = (message, isError = false) => {
  const el = document.getElementById("authMessage");

  if (el) {
    el.textContent = message;
    el.style.color = isError ? "#b42318" : "#237a57";
  }
};

/* =====================================================
   LOAD MEMBER PROFILE
===================================================== */

SF.loadProfile = async () => {
  if (!SF.currentUser) return null;

  const { data, error } = await SF.getClient()
    .from("profiles")
    .select("*")
    .eq("id", SF.currentUser.id)
    .maybeSingle();

  if (error) throw error;

  SF.profile = data;
  return data;
};

/* =====================================================
   APPLY REFERRAL
===================================================== */

SF.applyPendingReferral = async () => {
  const code = SF.getReferralCodeFromUrl();

  if (!SF.currentUser || !code) return;

  const { data, error } = await SF.getClient()
    .rpc("sf_register_referral", {
      p_referral_code: code
    });

  if (error) {
    console.warn(
      "Referral attribution could not be applied:",
      error.message
    );
    return;
  }

  if (data === true) {
    sessionStorage.removeItem("sf_pending_ref");
  }
};

/* =====================================================
   REFRESH SESSION
===================================================== */

SF.refreshSession = async () => {
  const { data, error } = await SF.getClient().auth.getSession();

  if (error) throw error;

  SF.currentUser = data.session?.user || null;
  SF.profile = null;

  if (SF.currentUser) {
    await SF.loadProfile();
    await SF.applyPendingReferral();
    await SF.loadProfile();
  }

  return SF.currentUser;
};

/* =====================================================
   LOGIN
===================================================== */

SF.login = async form => {
  const fd = new FormData(form);

  const { data, error } = await SF.getClient().auth.signInWithPassword({
    email: String(fd.get("email") || "").trim(),
    password: fd.get("password")
  });

  if (error) throw error;

  SF.currentUser = data.user;

  await SF.loadProfile();
  await SF.applyPendingReferral();
  await SF.loadProfile();

  return data;
};

/* =====================================================
   REGISTRATION
   Captures full name, email, password,
   phone number and country.
===================================================== */

SF.register = async form => {
  const fd = new FormData(form);

  const fullName = String(fd.get("full_name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");
  const phone = String(fd.get("phone") || "").trim();
  const country = String(fd.get("country") || "").trim();

  if (!fullName || !email || !password || !phone || !country) {
    throw new Error("Please complete all registration fields.");
  }

  if (phone.length < 7) {
    throw new Error("Please enter a valid phone number.");
  }

  if (password.length < 6) {
    throw new Error("Your password must contain at least 6 characters.");
  }

  const referralCode = SF.getReferralCodeFromUrl();

  if (referralCode) {
    sessionStorage.setItem("sf_pending_ref", referralCode);
  }

  const { data, error } = await SF.getClient().auth.signUp({
    email,
    password,

    options: {
      data: {
        full_name: fullName,
        phone: phone,
        country: country
      }
    }
  });

  if (error) throw error;

  if (data.session && data.user) {
    SF.currentUser = data.user;

    await SF.loadProfile();
    await SF.applyPendingReferral();
    await SF.loadProfile();
  }

  return data;
};

/* =====================================================
   LOGOUT
===================================================== */

SF.logout = async () => {
  const { error } = await SF.getClient().auth.signOut();

  if (error) throw error;

  SF.currentUser = null;
  SF.profile = null;
  SF.adminAuthorized = false;
};

/* =====================================================
   ADMINISTRATOR DESTINATION
===================================================== */

SF.getLoginDestination = async () => {
  try {
    if (
      typeof SF.checkAdmin === "function" &&
      await SF.checkAdmin()
    ) {
      console.log("Administrator verified. Opening Admin Control Panel.");
      return "admin";
    }
  } catch (error) {
    console.error("Administrator verification failed:", error);
  }

  return "dashboard";
};

/* =====================================================
   AUTHENTICATION EVENTS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const login = document.getElementById("loginForm");
  const register = document.getElementById("registerForm");

  /* LOGIN FORM */

  login?.addEventListener("submit", async e => {
    e.preventDefault();

    const btn = login.querySelector('[type="submit"]');

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Signing in…";
    }

    try {
      await SF.login(login);

      SF.showToast("Welcome back.");
      SF.updateNavigation();

      const destination = await SF.getLoginDestination();

      if (destination === "admin") {
        sessionStorage.removeItem("sf_pending_view");
        await SF.navigate("admin");
      } else {
        const requestedDestination =
          sessionStorage.getItem("sf_pending_view") || "dashboard";

        sessionStorage.removeItem("sf_pending_view");

        await SF.navigate(requestedDestination);
      }

    } catch (err) {
      console.error("Login error:", err);

      SF.showAuthMessage(
        err.message || "Login failed.",
        true
      );

    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Log in";
      }
    }
  });

  /* REGISTRATION FORM */

  register?.addEventListener("submit", async e => {
    e.preventDefault();

    const btn = register.querySelector('[type="submit"]');

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Creating account…";
    }

    try {
      const data = await SF.register(register);

      if (!data.session) {
        SF.showAuthMessage(
          "Account created successfully. Please confirm your email, then log in to continue."
        );

      } else {
        SF.showToast("Account created.");

        SF.updateNavigation();

        // Continue to the existing membership activation workflow.
        await SF.navigate("dashboard");
      }

    } catch (err) {
      console.error("Registration error:", err);

      SF.showAuthMessage(
        err.message || "Registration failed.",
        true
      );

    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Create account";
      }
    }
  });

  /* LOGIN / REGISTER TABS */

  document.querySelectorAll("[data-auth-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      SF.setAuthTab(tab.dataset.authTab);
    });
  });

});

/* =====================================================
   SWITCH AUTHENTICATION TAB
===================================================== */

SF.setAuthTab = which => {

  document.querySelectorAll("[data-auth-tab]").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.authTab === which
    );
  });

  document.getElementById("loginForm")
    ?.classList.toggle("hidden", which !== "login");

  document.getElementById("registerForm")
    ?.classList.toggle("hidden", which !== "register");

  SF.showAuthMessage("");
};
                                       
