
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
   Keep this for payment-routing.js.
   ===================================================== */

SF.createAdminNotification = async (eventType, fbkCode = null) => {
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
        value == null || value === "" ? "—" : String(value);
    }
  };

  const show = (id, visible) => {
    document.getElementById(id)
      ?.classList.toggle("hidden", !visible);
  };

  const status = String(
    profile.account_status || ""
  ).toLowerCase();

  const isApproved = status === "approved";

  show("approvedDashboard", isApproved);

  if (!isApproved) {
    return;
  }

  const firstName = String(profile.full_name || "Member")
    .trim()
    .split(/\s+/)[0];

  put("welcomeName", "Welcome back, " + firstName + ".");
  put("memberStatus", "Approved");
  put("memberCode", profile.referral_code || "—");
  put("memberEmail", SF.currentUser.email || profile.email || "");
  put("memberCountry", profile.country || "—");

  /* Referral count */

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

  /* Recent membership activity */

  const activity = document.getElementById("activityList");

  if (activity) {
    const result = await db
      .from("activation_requests")
      .select("id,membership_level,status,created_at")
      .eq("user_id", SF.currentUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    activity.replaceChildren();

    if (result.error) {
      const paragraph = document.createElement("p");
      paragraph.className = "muted";
      paragraph.textContent =
        "Account activity is temporarily unavailable.";
      activity.appendChild(paragraph);

    } else if (!result.data?.length) {
      const paragraph = document.createElement("p");
      paragraph.className = "muted";
      paragraph.textContent = "No recent activity to display.";
      activity.appendChild(paragraph);

    } else {
      const request = result.data[0];

      const item = document.createElement("div");
      item.className = "activity-item";

      const heading = document.createElement("strong");
      heading.textContent =
        "Membership activation · Level " +
        request.membership_level;

      const detail = document.createElement("p");
      detail.className = "muted";
      detail.textContent =
        "Status: " + (request.status || "Submitted");

      item.append(heading, detail);
      activity.appendChild(item);
    }
  }
};

/* =====================================================
   PACKAGE PREVIEW
   Payment routing is handled by payment-routing.js.
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
      const card = button.closest(".sf-level-card");

      const selected =
        button.dataset.selectLevel === String(level);

      card?.classList.toggle("sf-selected", selected);

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

document.addEventListener("DOMContentLoaded", () => {
  const countrySelect =
    document.getElementById("activationCountry");

  const levelSelect =
    document.getElementById("activationLevel");

  /* Select a membership package */

  document.querySelectorAll("[data-select-level]")
    .forEach(button => {
      button.addEventListener("click", () => {
        if (!levelSelect) return;

        levelSelect.value = button.dataset.selectLevel;

        SF.updatePackagePreview();

        document.getElementById("sfRegistrationDetails")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      });
    });

  /* Refresh preview when country changes */

  countrySelect?.addEventListener(
    "change",
    SF.updatePackagePreview
  );

  /* Refresh preview when level changes */

  levelSelect?.addEventListener(
    "change",
    SF.updatePackagePreview
  );

  /* Use the member's saved country when available */

  if (
    countrySelect &&
    SF.profile?.country
  ) {
    countrySelect.value = SF.profile.country;
  }

  SF.updatePackagePreview();
});
    
