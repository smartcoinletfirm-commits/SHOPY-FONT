
window.SF = window.SF || {};

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
    const el = document.getElementById(id);
    if (el) {
      el.textContent =
        value == null || value === "" ? "—" : String(value);
    }
  };

  const firstName = String(profile.full_name || "Member")
    .trim()
    .split(/\s+/)[0];

  put("welcomeName", "Welcome back, " + firstName + ".");
  put("memberStatus", profile.account_status || "awaiting_activation");
  put("memberCode", profile.referral_code || "—");
  put("memberEmail", SF.currentUser.email || profile.email || "");
  put("memberCountry", profile.country || "");
  put("walletBalance", "Not available");
  put(
    "walletReserved",
    "Wallet figures will appear when wallet posting is connected."
  );

  const { count, error: referralError } = await db
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", SF.currentUser.id);

  if (!referralError) {
    put("verifiedReferrals", count || 0);
  }

  const activity = document.getElementById("activityList");

  if (!activity) return;

  activity.innerHTML =
    '<p class="muted">Loading your account activity…</p>';

  const { data, error } = await db
    .from("activation_requests")
    .select(
      "id,membership_level,status,created_at,assigned_position_number,submitted_position_number"
    )
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    activity.innerHTML =
      '<p class="muted">Account activity is temporarily unavailable.</p>';
    return;
  }

  if (!data || !data.length) {
    activity.innerHTML =
      '<p class="muted">No activation request found.</p>';
    return;
  }

  const request = data[0];

  activity.innerHTML = `
    <div class="activity-item">
      <strong>Membership activation · Level ${
        SF.escapeHtml(request.membership_level)
      }</strong>
      <p class="muted">Status: ${
        SF.escapeHtml(request.status || "requested")
      }</p>
      <p class="muted">${
        request.submitted_position_number
          ? "Position submitted"
          : request.assigned_position_number
            ? "Position issued"
            : "Awaiting position"
      }</p>
    </div>
  `;
};
