
window.SF = window.SF || {};

/* Replace the old FBK/MiniPay dashboard routing. */
SF.loadDashboard = async () => {
  if (!SF.currentUser) {
    throw new Error("Please sign in to continue.");
  }

  const db = SF.getClient();
  const profile = SF.profile || await SF.loadProfile();

  if (!profile) {
    throw new Error("Your member profile could not be loaded.");
  }

  const show = (id, visible) => {
    document.getElementById(id)?.classList.toggle("hidden", !visible);
  };

  const put = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  };

  /* Completely remove obsolete payment workspaces. */
  ["fbkWorkspace", "miniPayWorkspace"].forEach(id => {
    document.getElementById(id)?.remove();
  });

  const status = String(profile.account_status || "")
    .toLowerCase();

  show("activationWorkspace", false);
  show("reviewWorkspace", false);
  show("rejectedWorkspace", false);
  show("approvedDashboard", status === "approved");

  /* Approved members retain the existing dashboard. */
  if (status === "approved") {
    put(
      "welcomeName",
      "Welcome back, " +
      String(profile.full_name || "Member").trim().split(/\s+/)[0] +
      "."
    );

    put("memberStatus", "Approved");
    put("memberCode", profile.referral_code || "—");
    put("memberEmail", SF.currentUser.email || profile.email || "");
    put("memberCountry", profile.country || "—");
    return;
  }

  const result = await db
    .from("activation_requests")
    .select("id,full_name,phone,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (result.error) throw result.error;

  const request = result.data?.[0];

  if (status === "rejected" || 
      String(request?.status || "").toLowerCase() === "rejected") {
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

  /* All submitted requests wait for administrator verification. */
  show("reviewWorkspace", true);

  const level = Number(request.membership_level);
  const country = profile.country || "—";

  put(
    "reviewDetails",
    `Your Level ${level} membership request for ${country} has been received. Complete payment through the checkout link provided. Your account will remain under review until an administrator verifies and approves it.`
  );
};
           
