window.SF = window.SF || {};

const SF_PACKAGE_PRICES = {
  1: 580,
  2: 1000,
  3: 2000,
  4: 4500
};

const SF_EXCHANGE_RATES = {
  Kenya: 1,
  Nigeria: 10.3734,
  Ghana: 0.0900059
};

SF.getPackagePrice = (level, country) => {
  const kes = SF_PACKAGE_PRICES[Number(level)];
  const rate = SF_EXCHANGE_RATES[country];

  if (!kes || !rate) return null;

  const amount = kes * rate;

  if (country === "Nigeria") {
    return {
      amount: Math.round(amount),
      currency: "NGN",
      display: "₦" + Math.round(amount).toLocaleString("en-NG")
    };
  }

  if (country === "Ghana") {
    return {
      amount: Number(amount.toFixed(2)),
      currency: "GHS",
      display: "GH₵" + amount.toFixed(2)
    };
  }

  return {
    amount: kes,
    currency: "KES",
    display: "KES " + kes.toLocaleString("en-KE")
  };
};

SF.setDashboardMessage = (id, message, success = false) => {
  const element = document.getElementById(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "#237a57" : "#b42318";
};

SF.loadDashboard = async () => {
  if (!SF.currentUser) throw new Error("Please sign in to continue.");

  const db = SF.getClient();
  const profile = SF.profile || await SF.loadProfile();

  if (!profile) throw new Error("Your member profile could not be loaded.");

  const put = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null || value === "" ? "—" : String(value);
  };

  const show = (id, visible) => {
    document.getElementById(id)?.classList.toggle("hidden", !visible);
  };

  const status = String(profile.account_status || "awaiting_activation").toLowerCase();
  const country = profile.country || "Kenya";

  const firstName = String(profile.full_name || "Member").trim().split(/\s+/)[0];
  put("welcomeName", "Welcome back, " + firstName + ".");

  show("approvedDashboard", status === "approved");
  show("activationWorkspace", false);
  show("fbkWorkspace", false);
  show("reviewWorkspace", false);
  show("rejectedWorkspace", false);
  show("miniPayWorkspace", false);

  if (status === "approved") {
    put("memberStatus", "Approved");
    put("memberCode", profile.referral_code || "—");
    put("memberEmail", SF.currentUser.email || profile.email || "");
    put("memberCountry", country);
    put("walletBalance", "Not available");
    put("walletReserved", "Wallet figures will appear when wallet posting is connected.");

    const { count, error } = await db.from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", SF.currentUser.id);

    if (!error) put("verifiedReferrals", count || 0);

    const activity = document.getElementById("activityList");

    if (activity) {
      const result = await db.from("activation_requests")
        .select("id,membership_level,status,created_at")
        .eq("user_id", SF.currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (result.error) {
        activity.textContent = "Account activity is temporarily unavailable.";
      } else if (!result.data?.length) {
        activity.textContent = "No activation request found.";
      } else {
        const request = result.data[0];
        activity.innerHTML = `<div class="activity-item">
          <strong>Membership activation · Level ${SF.escapeHtml(request.membership_level)}</strong>
          <p class="muted">Status: ${SF.escapeHtml(request.status)}</p>
        </div>`;
      }
    }

    return;
  }

  const latestRequestResult = await db.from("activation_requests")
    .select("id,full_name,phone,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestRequestResult.error) throw latestRequestResult.error;

  const request = latestRequestResult.data?.[0] || null;

  if (status === "rejected") {
    show("rejectedWorkspace", true);

    const latest = await SF.getLatestFBKSubmission();
    put("rejectionDetails", latest?.admin_note || "Your submission was not approved. Contact support for assistance.");
    return;
  }

  if (!request) {
    show("activationWorkspace", true);
    SF.updatePackagePreview();
    return;
  }

  const latestPaymentResult = await db.from("payment_submissions")
    .select("id,status,country,membership_level,currency,amount,submitted_at")
    .eq("user_id", SF.currentUser.id)
    .order("submitted_at", { ascending: false })
    .limit(1);

  if (latestPaymentResult.error) throw latestPaymentResult.error;

  const payment = latestPaymentResult.data?.[0] || null;

  if (payment && ["submitted", "under_review", "reviewed"].includes(String(payment.status).toLowerCase())) {
    show("reviewWorkspace", true);
    put("reviewDetails", "Your MiniPay payment link was submitted on " +
      new Date(payment.submitted_at).toLocaleString() +
      ". Your account is UNDER SYSTEM REVIEW.");
    return;
  }

  if (payment && String(payment.status).toLowerCase() === "rejected") {
    if (country === "Kenya") {
      show("fbkWorkspace", true);
      put("fbkMessage", "Your previous submission was rejected. Please follow the instructions to resubmit.");
    } else {
      show("miniPayWorkspace", true);
      SF.populateMiniPayDetails(request, country);
      put("miniPayMessage", "Your previous payment submission was rejected. Please submit a new payment link.");
    }
    return;
  }

  if (["approved", "accepted"].includes(String(request.status).toLowerCase())) {
    show("reviewWorkspace", true);
    put("reviewDetails", "Your activation is awaiting final account status confirmation.");
    return;
  }

  if (country === "Kenya") {
    const latestFBK = await SF.getLatestFBKSubmission();

    if (latestFBK && ["submitted", "reviewed"].includes(String(latestFBK.status).toLowerCase())) {
      show("reviewWorkspace", true);
      put("reviewDetails", "Your FBK submission is under review. Submitted on " +
        new Date(latestFBK.created_at).toLocaleString());
      return;
    }

    show("fbkWorkspace", true);

    if (latestFBK && String(latestFBK.status).toLowerCase() === "rejected") {
      put("fbkMessage", "Your previous FBK submission was rejected. Please submit a new code.");
    }

    return;
  }

  show("miniPayWorkspace", true);
  SF.populateMiniPayDetails(request, country);
};

SF.populateMiniPayDetails = (request, country) => {
  const level = Number(request.membership_level);
  const price = SF.getPackagePrice(level, country);

  const put = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  };

  put("miniPayCountryLabel", country);
  put("miniPayLevelLabel", "Level " + level);
  put("miniPayAmount", price?.display || "—");

  const form = document.getElementById("miniPayForm");
  if (form) {
    form.dataset.country = country;
    form.dataset.level = String(level);
  }
};


SF.updatePackagePreview = () => {
  const country = document.getElementById("activationCountry")?.value || "";
  const levelSelect = document.getElementById("activationLevel");
  const level = levelSelect?.value || "";
  const price = SF.getPackagePrice(level, country);

  const preview = document.getElementById("packagePricePreview");
  const selectedLevel = document.getElementById("sfSelectedLevel");
  const selectedPrice = document.getElementById("sfSelectedPrice");

  document.querySelectorAll("[data-select-level]").forEach(button => {
    const card = button.closest(".sf-level-card");
    const selected = button.dataset.selectLevel === String(level);

    card?.classList.toggle("sf-selected", selected);
    button.textContent = selected
      ? "✓ Selected"
      : "Choose Level " + button.dataset.selectLevel;
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  if (selectedLevel) {
    selectedLevel.textContent = level
      ? "Level " + level
      : "No level selected";
  }

  if (selectedPrice) {
    selectedPrice.textContent = price
      ? price.display
      : "Choose a package and country";
  }

  if (preview) {
    preview.textContent = price
      ? "Your selected package is Level " + level +
        ". Your payment amount is " + price.display + "."
      : "Select a membership level and country to see your exact payment amount.";
  }
};


SF.getLatestFBKSubmission = async () => {
  if (!SF.currentUser) return null;

  const { data, error } = await SF.getClient()
    .from("fbk_code_submissions")
    .select("id,status,admin_note,created_at,reviewed_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
};

document.addEventListener("DOMContentLoaded", () => {
  const db = SF.getClient();

  const activationForm = document.getElementById("activationForm");
  const fbkForm = document.getElementById("fbkForm");
  const miniPayForm = document.getElementById("miniPayForm");

  const countrySelect = document.getElementById("activationCountry");
  const levelSelect = document.getElementById("activationLevel");

document.querySelectorAll("[data-select-level]").forEach(button => {
  button.addEventListener("click", () => {
    levelSelect.value = button.dataset.selectLevel;
    SF.updatePackagePreview();

    document.getElementById("sfRegistrationDetails")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
  
  countrySelect?.addEventListener("change", SF.updatePackagePreview);
  levelSelect?.addEventListener("change", SF.updatePackagePreview);

  if (countrySelect && SF.profile?.country) {
    countrySelect.value = SF.profile.country;
  }

  SF.updatePackagePreview();

  activationForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = activationForm.querySelector('[type="submit"]');
    const message = document.getElementById("activationMessage");

    if (button) button.disabled = true;

    try {
      const fd = new FormData(activationForm);

      const fullName = String(fd.get("full_name") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const level = Number(fd.get("membership_level"));
      const country = String(fd.get("country") || countrySelect?.value || "Kenya");

      if (!fullName || !phone || ![1, 2, 3, 4].includes(level)) {
        throw new Error("Enter your name, phone number and a valid membership level.");
      }

      if (!["Kenya", "Nigeria", "Ghana"].includes(country)) {
        throw new Error("Please select a supported country.");
      }

      const { error: profileError } = await db.from("profiles")
        .update({
          country,
          full_name: fullName,
          phone
        })
        .eq("id", SF.currentUser.id);

      if (profileError) throw profileError;

      const { error: activationError } = await db.rpc("scf_submit_activation", {
        p_full_name: fullName,
        p_phone: phone,
        p_membership_level: level
      });

      if (activationError) throw activationError;

      await SF.loadProfile();

      if (country === "Kenya") {
        SF.setDashboardMessage("activationMessage", "Activation request saved. Continue with your FBK submission.", true);
      } else {
        SF.setDashboardMessage("activationMessage", "Activation request saved. Continue with your MiniPay payment instructions.", true);
      }

      await SF.loadDashboard();

    } catch (error) {
      if (message) {
        message.textContent = error.message || "Activation request failed.";
        message.style.color = "#b42318";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });

  miniPayForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = miniPayForm.querySelector('[type="submit"]');
    const message = document.getElementById("miniPayMessage");

    if (button) button.disabled = true;

    try {
      const fd = new FormData(miniPayForm);
      const paymentLink = String(fd.get("payment_link") || "").trim();

      const country = miniPayForm.dataset.country;
      const level = Number(miniPayForm.dataset.level);

      if (!paymentLink) {
        throw new Error("Paste your MiniPay shareable payment link.");
      }

      let parsedUrl;

      try {
        parsedUrl = new URL(paymentLink);
      } catch {
        throw new Error("Enter a valid MiniPay shareable link.");
      }

      if (!["https:", "http:"].includes(parsedUrl.protocol)) {
        throw new Error("The payment link must begin with http:// or https://.");
      }

      if (!["Nigeria", "Ghana"].includes(country)) {
        throw new Error("MiniPay submissions are only available for Nigeria and Ghana.");
      }

      const price = SF.getPackagePrice(level, country);

      if (!price) throw new Error("Unable to calculate your package price.");

      const { error } = await db.from("payment_submissions").insert({
        user_id: SF.currentUser.id,
        country,
        membership_level: level,
        payment_provider: "MiniPay",
        payment_link: paymentLink,
        currency: price.currency,
        amount: price.amount,
        status: "submitted"
      });

      if (error) throw error;

      miniPayForm.reset();

      SF.setDashboardMessage(
        "miniPayMessage",
        "Your MiniPay link has been submitted successfully. Your account is UNDER SYSTEM REVIEW.",
        true
      );

      await SF.loadProfile();
      await SF.loadDashboard();

    } catch (error) {
      if (message) {
        message.textContent = error.message || "MiniPay link submission failed.";
        message.style.color = "#b42318";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });

  fbkForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = fbkForm.querySelector('[type="submit"]');
    const message = document.getElementById("fbkMessage");

    if (button) button.disabled = true;

    try {
      const fd = new FormData(fbkForm);
      const code = String(fd.get("fbk_code") || "").trim();

      if (!/^[0-9]{4}$/.test(code)) {
        throw new Error("Enter exactly four numeric digits.");
      }

      const existing = await SF.getLatestFBKSubmission();

      if (existing && ["submitted", "reviewed"].includes(String(existing.status).toLowerCase())) {
        throw new Error("You already have an FBK submission awaiting review.");
      }

      const { error: insertError } = await db.from("fbk_code_submissions")
        .insert({
          user_id: SF.currentUser.id,
          submitted_code: code,
          status: "submitted",
          admin_note: null,
          reviewed_at: null
        });

      if (insertError) throw insertError;

      const { error: notificationError } = await db.rpc(
        "scholarbrige_create_admin_notification",
        {
          p_event_type: "fbk_submitted",
          p_submitted_fbk_code: code
        }
      );

      if (notificationError) {
        throw new Error("Your FBK was saved, but the admin alarm failed. Please contact support.");
      }

      SF.setDashboardMessage(
        "fbkMessage",
        "FBK submitted successfully. Alarm 2 sent. Your account is UNDER REVIEW.",
        true
      );

      fbkForm.reset();

      await SF.loadProfile();
      await SF.loadDashboard();

    } catch (error) {
      if (message) {
        message.textContent = error.message || "FBK submission failed.";
        message.style.color = "#b42318";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
});
