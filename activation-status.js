
window.SF = window.SF || {};

/* Preserve the original approved-member dashboard loader. */
const SF_originalLoadDashboard = SF.loadDashboard;

SF.loadDashboard = async () => {
  if (!SF.currentUser) {
    throw new Error("Please sign in to continue.");
  }

  const profile = SF.profile || await SF.loadProfile();

  if (!profile) {
    throw new Error("Your member profile could not be loaded.");
  }

  const updateWelcomeName = () => {
    const displayName = String(
      profile.full_name ||
      SF.currentUser.user_metadata?.full_name ||
      "Member"
    ).trim();

    const firstName = displayName.split(/\s+/)[0] || "Member";
    const welcomeElement = document.getElementById("welcomeName");

    if (welcomeElement) {
      welcomeElement.textContent = `Welcome back, ${firstName}.`;
    }
  };

  updateWelcomeName();

  const status = String(profile.account_status || "").toLowerCase();

  /* Approved members retain their existing dashboard. */
  if (
    status === "approved" &&
    typeof SF_originalLoadDashboard === "function"
  ) {
    const result = await SF_originalLoadDashboard();

    updateWelcomeName();

    SF.wallet?.addStyles?.();
    SF.wallet?.mount?.();

    if (typeof SF.wallet?.render === "function") {
      await SF.wallet.render();
    }

    return result;
  }

  const db = SF.getClient();

  const show = (id, visible) => {
    document.getElementById(id)?.classList.toggle("hidden", !visible);
  };

  const put = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent =
        value == null || value === ""
          ? "—"
          : String(value);
    }
  };

  ["fbkWorkspace", "miniPayWorkspace"].forEach(id => {
    document.getElementById(id)?.remove();
  });

  show("approvedDashboard", false);
  show("activationWorkspace", false);
  show("reviewWorkspace", false);
  show("rejectedWorkspace", false);

  /* Load the member's latest activation request. */
  const result = await db
    .from("activation_requests")
    .select("id,full_name,phone,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (result.error) throw result.error;

  const request = result.data?.[0] || null;
  const requestStatus = String(request?.status || "").toLowerCase();

  /* No activation request yet: show package selection. */
  if (!request && status !== "rejected") {
    show("activationWorkspace", true);
    SF.updatePackagePreview?.();
    return;
  }

  /* Rejected account: retrieve the administrator's reason. */
  if (status === "rejected" || requestStatus === "rejected") {
    let rejectionReason = "";
    let rejectionDate = "";

    /* First check the payment review record. */
    const paymentResult = await db
      .from("payment_submissions")
      .select("review_reason,reviewed_at,submitted_at,status")
      .eq("user_id", SF.currentUser.id)
      .order("submitted_at", { ascending: false })
      .limit(10);

    if (paymentResult.error) throw paymentResult.error;

    const rejectedPayment = (paymentResult.data || []).find(
      item => String(item.status || "").toLowerCase() === "rejected"
    );

    if (rejectedPayment) {
      rejectionReason = rejectedPayment.review_reason || "";
      rejectionDate = rejectedPayment.reviewed_at || "";
    }

    /* If payment was not the rejected item, check FBK review. */
    if (!rejectionReason) {
      const fbkResult = await db
        .from("fbk_code_submissions")
        .select("status,admin_note,created_at")
        .eq("user_id", SF.currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (fbkResult.error) throw fbkResult.error;

      const rejectedFBK = (fbkResult.data || []).find(
        item => String(item.status || "").toLowerCase() === "rejected"
      );

      if (rejectedFBK) {
        rejectionReason = rejectedFBK.admin_note || "";
        rejectionDate = rejectedFBK.created_at || "";
      }
    }

    show("rejectedWorkspace", true);

    put(
      "rejectionDetails",
      rejectionReason
        ? `Your membership application was rejected.

Reason given by the administrator:
${rejectionReason}

${rejectionDate
  ? "Review date: " + new Date(rejectionDate).toLocaleString()
  : ""}

Please follow the instructions above or contact SHOPY FONT support for assistance.`
        : `Your membership application was not approved.

The administrator did not provide a written reason in the available review record. Please contact SHOPY FONT support for clarification.`
    );

    return;
  }

  /* Pending request: show review information. */
  if (request) {
    show("reviewWorkspace", true);

    const level = Number(request.membership_level);
    const country = profile.country || "—";
    const submitted = request.created_at
      ? new Date(request.created_at).toLocaleString()
      : "recently";

    put(
      "reviewDetails",
      `Your Level ${level} membership request for ${country} was received on ${submitted}.

Your account is awaiting verification. Please complete the required payment and verification steps. Access to member services will be granted after administrator approval.`
    );

    return;
  }

  show("activationWorkspace", true);
  SF.updatePackagePreview?.();
};
