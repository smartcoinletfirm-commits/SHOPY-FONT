
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

  /* Always use the currently signed-in member's name. */
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

  /* Approved members retain the original dashboard and load their wallet. */
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
      el.textContent = value == null || value === "" ? "—" : String(value);
    }
  };

  ["fbkWorkspace", "miniPayWorkspace"].forEach(id => {
    document.getElementById(id)?.remove();
  });

  show("approvedDashboard", false);
  show("activationWorkspace", false);
  show("reviewWorkspace", false);
  show("rejectedWorkspace", false);

  const result = await db
    .from("activation_requests")
    .select("id,full_name,phone,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (result.error) throw result.error;

  const request = result.data?.[0] || null;
  const requestStatus = String(request?.status || "").toLowerCase();

  if (status === "rejected" || requestStatus === "rejected") {
    show("rejectedWorkspace", true);
    put(
      "rejectionDetails",
      "Your membership request was not approved. Please contact support for assistance."
    );
    return;
  }

  if (!request) {
    show("activationWorkspace", true);
    SF.updatePackagePreview?.();
    return;
  }

  show("reviewWorkspace", true);

  const level = Number(request.membership_level);
  const country = profile.country || "—";
  const submitted = request.created_at
    ? new Date(request.created_at).toLocaleString()
    : "recently";

  put(
    "reviewDetails",
    `Your Level ${level} membership request for ${country} was received on ${submitted}. Complete your payment through the checkout link. Your account will remain under review until an administrator verifies the payment and approves your membership.`
  );
};
