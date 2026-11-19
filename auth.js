
SF.register = async form => {
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
    throw new Error("Please enter a valid phone number with country code.");
  }

  if (password.length < 8) {
    throw new Error("Your password must contain at least 8 characters.");
  }

  if (password !== confirmPassword) {
    throw new Error("Your passwords do not match. Please try again.");
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
        phone,
        country,
        heard_about: heardAbout
      }
    }
  });

  if (error) throw error;

  if (!data.session || !data.user) {
    throw new Error(
      "Email confirmation is still enabled. Please disable Confirm email in Supabase Auth settings."
    );
  }

  SF.currentUser = data.user;

  await SF.loadProfile();
  await SF.applyPendingReferral();
  await SF.loadProfile();

  return data;
};
/* =====================================================
   SHOPY FONT — AUTHENTICATION REPAIR
   Adds missing login, tab switching and session helpers.
===================================================== */

window.SF = window.SF || {};

/* Supabase client */
SF.getClient = function () {
  if (!window.sfSupabase) {
    throw new Error("Supabase is not connected. Please reload the page.");
  }
  return window.sfSupabase;
};

/* Display authentication messages */
SF.showAuthMessage = function (message, success = false) {
  const el = document.getElementById("authMessage");
  if (!el) {
    if (typeof SF.showToast === "function") SF.showToast(message);
    return;
  }

  el.textContent = message;
  el.style.color = success ? "#237a57" : "#b42318";
};

/* Switch between login and registration */
SF.setAuthTab = function (tab) {
  const login = document.getElementById("loginForm");
  const register = document.getElementById("registerForm");

  if (!login || !register) return;

  const showLogin = tab === "login";

  login.classList.toggle("hidden", !showLogin);
  register.classList.toggle("hidden", showLogin);

  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    const active = button.dataset.authTab === (showLogin ? "login" : "register");
    button.classList.toggle("active", active);
  });

  SF.showAuthMessage("");
};

/* Restore current session */
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

/* Load the signed-in member profile */
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
      "Your account exists, but its member profile is not ready. Please contact support."
    );
  }

  SF.profile = data;
  return data;
};

/* Referral code from a shared registration URL */
SF.getReferralCodeFromUrl = function () {
  const params = new URLSearchParams(window.location.search);

  return (
    params.get("ref") ||
    params.get("referral") ||
    params.get("code") ||
    ""
  ).trim();
};

/* Apply a pending referral once the member is signed in */
SF.applyPendingReferral = async function () {
  const code = sessionStorage.getItem("sf_pending_ref");
  if (!code || !SF.currentUser) return false;

  const { data, error } = await SF.getClient().rpc(
    "sf_register_referral",
    { p_referral_code: code }
  );

  if (error) {
    console.warn("Referral registration:", error.message);
    return false;
  }

  sessionStorage.removeItem("sf_pending_ref");
  return data === true;
};

/* Log in existing members */
SF.login = async function (form) {
  const fd = new FormData(form);
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");

  if (!email || !password) {
    throw new Error("Enter your email address and password.");
  }

  const { data, error } = await SF.getClient().auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  SF.currentUser = data.user;
  await SF.loadProfile();

  if (typeof SF.updateNavigation === "function") {
    SF.updateNavigation();
  }

  await SF.navigate("dashboard");
  return data;
};

/* Log out */
SF.logout = async function () {
  const { error } = await SF.getClient().auth.signOut();
  if (error) throw error;

  SF.currentUser = null;
  SF.profile = null;
};

/* Connect the two forms */
if (!SF.authFormEventsInstalled) {
  SF.authFormEventsInstalled = true;

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-auth-tab]");
    if (!button) return;

    event.preventDefault();
    SF.setAuthTab(button.dataset.authTab);
  });

  document.getElementById("loginForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = event.currentTarget.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    SF.showAuthMessage("Signing you in...");

    try {
      await SF.login(event.currentTarget);
      SF.showAuthMessage("Login successful.", true);
    } catch (error) {
      console.error("Login error:", error);
      SF.showAuthMessage(error.message || "Unable to log in.");
    } finally {
      if (button) button.disabled = false;
    }
  });

  document.getElementById("registerForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = event.currentTarget.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    SF.showAuthMessage("Creating your account...");

    try {
      await SF.register(event.currentTarget);

      if (typeof SF.updateNavigation === "function") {
        SF.updateNavigation();
      }

      await SF.navigate("dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      SF.showAuthMessage(error.message || "Unable to create your account.");
    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* Default to Create account */
SF.setAuthTab("register");
                                     
