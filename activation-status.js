/* SHOPY FONT — MEMBERSHIP STATUS
   Preserves approved dashboard and payment review records.
   Pending members receive a clear system-review screen.
*/
window.SF = window.SF || {};

const SF_originalLoadDashboard = SF.loadDashboard;

SF.loadDashboard = async () => {
  if (!SF.currentUser) {
    throw new Error("Please sign in to continue.");
  }

  const profile = SF.profile || await SF.loadProfile();

  if (!profile) {
    throw new Error("Your member profile could not be loaded.");
  }

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

  const status = String(profile.account_status || "")
    .trim()
    .toLowerCase();

  // Preserve the existing approved-member dashboard.
  if (
    status === "approved" &&
    typeof SF_originalLoadDashboard === "function"
  ) {
    const result = await SF_originalLoadDashboard();

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
    const element = document.getElementById(id);
    if (element) {
      element.textContent =
        value == null || value === ""
          ? "—"
          : String(value);
    }
  };

  show("approvedDashboard", false);
  show("activationWorkspace", false);
  show("rejectedWorkspace", false);

  // Load the latest membership request.
  const requestResult = await db
    .from("activation_requests")
    .select("id,full_name,phone,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (requestResult.error) throw requestResult.error;

  const request = requestResult.data?.[0] || null;
  const requestStatus = String(request?.status || "")
    .trim()
    .toLowerCase();

  // Load payment review records without changing them.
  const paymentResult = await db
    .from("payment_submissions")
    .select("status,review_reason,reviewed_at,submitted_at,payment_provider")
    .eq("user_id", SF.currentUser.id)
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (paymentResult.error) throw paymentResult.error;

  const payments = paymentResult.data || [];

  // No request yet: allow the member to choose a package.
  if (!request && status !== "rejected") {
    show("activationWorkspace", true);
    SF.updatePackagePreview?.();
    return;
  }

  // Rejected membership or payment.
  const rejectedPayment = payments.find(
    item => String(item.status || "").toLowerCase() === "rejected"
  );

  if (
    status === "rejected" ||
    requestStatus === "rejected" ||
    rejectedPayment
  ) {
    show("rejectedWorkspace", true);

    const reason = rejectedPayment?.review_reason || "";
    const reviewDate = rejectedPayment?.reviewed_at || "";

    put(
      "rejectionDetails",
      reason
        ? `Your membership application was not approved.

Reason:
${reason}

${reviewDate
  ? "Review date: " + new Date(reviewDate).toLocaleString()
  : ""}

Please follow the administrator's instructions or contact SHOPY FONT support.`
        : `Your membership application was not approved.

Please contact SHOPY FONT support for clarification and the next steps.`
    );

    return;
  }

  // Pending request: show a review panel.
  if (request) {
    let reviewPanel = document.getElementById("sfMembershipReview");

    if (!reviewPanel) {
      reviewPanel = document.createElement("section");
      reviewPanel.id = "sfMembershipReview";
      reviewPanel.className = "panel";
      reviewPanel.style.cssText =
        "margin:24px 0;padding:26px;border:1px solid #dcebe1;border-radius:16px;background:#fff;color:#193629;";

      document.getElementById("activationWorkspace")
        ?.insertAdjacentElement("afterend", reviewPanel);
    }

    const latestPayment = payments[0] || null;
    const paymentStatus = String(latestPayment?.status || "")
      .trim()
      .toLowerCase();

    const level = Number(request.membership_level) || "—";
    const country = profile.country || "—";
    const submitted = request.created_at
      ? new Date(request.created_at).toLocaleString()
      : "recently";

    let paymentMessage = "Payment verification may still be required.";

    if (paymentStatus === "submitted" || paymentStatus === "pending") {
      paymentMessage = "Your payment evidence has been received and is awaiting review.";
    } else if (paymentStatus === "approved" || paymentStatus === "verified") {
      paymentMessage = "Your payment has been verified. Membership approval is still pending.";
    }

    reviewPanel.innerHTML = `
      <p style="margin:0 0 8px;color:#167347;font-size:11px;font-weight:900;letter-spacing:1.5px;">
        MEMBERSHIP APPLICATION
      </p>
      <h2 style="margin:0 0 12px;color:#17462f;">
        Your account is under review
      </h2>
      <p style="color:#687d70;line-height:1.8;">
        Your membership request has been received. Our team is reviewing
        your submission. Your member services will become available after
        administrator approval.
      </p>
      <div style="margin:18px 0;padding:16px;border-radius:10px;background:#f3f8f4;">
        <p><strong>Membership level:</strong> ${SF.escapeHtml(level)}</p>
        <p><strong>Country:</strong> ${SF.escapeHtml(country)}</p>
        <p><strong>Request received:</strong> ${SF.escapeHtml(submitted)}</p>
        <p><strong>Payment:</strong> ${SF.escapeHtml(paymentMessage)}</p>
        <p style="margin-bottom:0;"><strong>Account status:</strong> Under review</p>
      </div>
      <p style="margin:0;color:#718176;font-size:12px;">
        Please check your account again after the review is complete.
      </p>
    `;

    show("activationWorkspace", false);
    show("rejectedWorkspace", false);
    reviewPanel.classList.remove("hidden");

    return;
  }

  show("activationWorkspace", true);
  SF.updatePackagePreview?.();
};
      
