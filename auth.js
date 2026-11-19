
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
