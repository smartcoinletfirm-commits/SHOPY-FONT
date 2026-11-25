
window.SF = window.SF || {};

/* =====================================================
   DASHBOARD HELPERS
   ===================================================== */

SF.setDashboardMessage = (id, message, success = false) => {
  const element = document.getElementById(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "#237a57" : "#b42318";
};

/* =====================================================
   ADMIN NOTIFICATION HELPER
   ===================================================== */

SF.createAdminNotification = async (
  eventType,
  fbkCode = null
) => {
  if (!SF.currentUser) {
    throw new Error("Please sign in before continuing.");
  }

  const { error } = await SF.getClient().rpc(
    "scholarbrige_create_admin_notification",
    {
      p_event_type: eventType,
      p_submitted_fbk_code: fbkCode
    }
  );

  if (error) {
    console.error("Admin notification error:", error);
    throw error;
  }

  return true;
};

/* =====================================================
   MEMBER DASHBOARD
   ===================================================== */

SF.loadDashboard = async () => {
  if (!SF.currentUser) {
    throw new Error("Please sign in to continue.");
  }

  const db = SF.getClient();

  const profile = SF.profile || await SF.loadProfile();

  if (!profile) {
    throw new Error("Your member profile could not be loaded.");
  }

  const put = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent =
        value == null || value === ""
          ? "—"
          : String(value);
    }
  };

  const show = (id, visible) => {
    document.getElementById(id)
      ?.classList.toggle("hidden", !visible);
  };

  const status = String(
    profile.account_status || ""
  ).trim().toLowerCase();

  const isApproved = status === "approved";

  show("approvedDashboard", isApproved);

  if (!isApproved) return;

  const firstName = String(
    profile.full_name || "Member"
  ).trim().split(/\s+/)[0];

  put("welcomeName", "Welcome back, " + firstName + ".");
  put("memberStatus", "Approved");
  put("memberCode", profile.referral_code || "—");
  put("memberEmail", SF.currentUser.email || profile.email || "");
  put("memberCountry", profile.country || "—");

  /* REFERRAL COUNT */

  const referralResult = await db
    .from("referrals")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("referrer_id", SF.currentUser.id);

  if (!referralResult.error) {
    put("verifiedReferrals", referralResult.count || 0);
  } else {
    console.warn(
      "Referral count unavailable:",
      referralResult.error
    );
  }

  /* RECENT MEMBERSHIP ACTIVITY */

  const activity = document.getElementById("activityList");

  if (!activity) return;

  const result = await db
    .from("activation_requests")
    .select("id,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  activity.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.className = "muted";

  if (result.error) {
    paragraph.textContent =
      "Account activity is temporarily unavailable.";

    activity.appendChild(paragraph);
    return;
  }

  if (!result.data?.length) {
    paragraph.textContent =
      "No recent activity to display.";

    activity.appendChild(paragraph);
    return;
  }

  const request = result.data[0];

  const item = document.createElement("div");
  item.className = "activity-item";

  const heading = document.createElement("strong");

  heading.textContent =
    "Membership activation · Level " +
    (request.membership_level || "—");

  const detail = document.createElement("p");
  detail.className = "muted";

  detail.textContent =
    "Status: " + (request.status || "Submitted");

  item.append(heading, detail);
  activity.appendChild(item);
};

/* =====================================================
   PACKAGE PREVIEW
   ===================================================== */

SF.updatePackagePreview = () => {
  const country =
    document.getElementById("activationCountry")?.value || "";

  const levelSelect =
    document.getElementById("activationLevel");

  const level = levelSelect?.value || "";

  const price =
    typeof SF.getPackagePrice === "function"
      ? SF.getPackagePrice(level, country)
      : null;

  const preview =
    document.getElementById("packagePricePreview");

  const selectedLevel =
    document.getElementById("sfSelectedLevel");

  const selectedPrice =
    document.getElementById("sfSelectedPrice");

  document.querySelectorAll("[data-select-level]")
    .forEach(button => {
      const selected =
        button.dataset.selectLevel === String(level);

      button.closest(".sf-level-card")
        ?.classList.toggle("sf-selected", selected);

      button.textContent = selected
        ? "✓ Selected"
        : "Choose Level " + button.dataset.selectLevel;

      button.setAttribute(
        "aria-pressed",
        selected ? "true" : "false"
      );
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
      ? "Your selected package is Level " +
        level + ". " + price.display + "."
      : "Select a membership level and country to see your package price.";
  }
};

/* =====================================================
   PACKAGE SELECTION EVENTS
   ===================================================== */

if (!SF.packageEventsInstalled) {
  SF.packageEventsInstalled = true;

  document.addEventListener("click", event => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const button = target.closest("[data-select-level]");

    if (!button) return;

    event.preventDefault();

    const levelSelect =
      document.getElementById("activationLevel");

    if (!levelSelect) return;

    levelSelect.value = button.dataset.selectLevel;

    SF.updatePackagePreview();

    document.getElementById("sfRegistrationDetails")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  });

  document.addEventListener("change", event => {
    const target = event.target;

    if (
      target?.id === "activationCountry" ||
      target?.id === "activationLevel"
    ) {
      SF.updatePackagePreview();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const countrySelect =
      document.getElementById("activationCountry");

    if (countrySelect && SF.profile?.country) {
      countrySelect.value = SF.profile.country;
    }

    SF.updatePackagePreview();
  });
}

/* =====================================================
   WITHDRAWAL REQUEST
   MEMBER SUBMITS AMOUNT + PAYMENT PHONE
   ===================================================== */

SF.submitWithdrawal = async () => {
  const amountInput =
    document.getElementById("withdrawAmount");

  const phoneInput =
    document.getElementById("withdrawPhone");

  const message =
    document.getElementById("withdrawMessage");

  const button =
    document.getElementById("withdrawSubmitButton");

  if (!SF.currentUser) {
    SF.setDashboardMessage(
      "withdrawMessage",
      "Please sign in first."
    );
    return;
  }

  const amount = Number(amountInput?.value);

  const phone = phoneInput?.value?.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    SF.setDashboardMessage(
      "withdrawMessage",
      "Enter a valid withdrawal amount."
    );
    return;
  }

  if (!phone) {
    SF.setDashboardMessage(
      "withdrawMessage",
      "Enter your payment phone number."
    );
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Submitting...";
  }

  if (message) {
    message.textContent = "";
  }

  try {
    const db = SF.getClient();

    const { error } = await db.rpc(
      "scf_request_withdrawal",
      {
        p_amount: amount,
        p_payment_phone: phone
      }
    );

    if (error) throw error;

    SF.setDashboardMessage(
      "withdrawMessage",
      "Your withdrawal request has been submitted successfully.",
      true
    );

    if (amountInput) amountInput.value = "";
    if (phoneInput) phoneInput.value = "";

  } catch (error) {
    console.error("Withdrawal request error:", error);

    SF.setDashboardMessage(
      "withdrawMessage",
      error.message || "Failed to submit withdrawal request."
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Submit Withdrawal Request";
    }
  }
};

/* =====================================================
   WITHDRAWAL EVENT
   ===================================================== */

if (!SF.withdrawalEventsInstalled) {
  SF.withdrawalEventsInstalled = true;

  document.addEventListener("click", event => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const button = target.closest("#withdrawSubmitButton");

    if (!button) return;

    event.preventDefault();

    SF.submitWithdrawal();
  });
}
   
