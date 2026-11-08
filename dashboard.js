window.SF = window.SF || {};

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

  const firstName = String(profile.full_name || "Member").trim().split(/\s+/)[0];
  put("welcomeName", "Welcome back, " + firstName + ".");

  const status = String(profile.account_status || "awaiting_activation").toLowerCase();

  // Only approved members can see the full dashboard.
  show("approvedDashboard", status === "approved");
  show("activationWorkspace", false);
  show("fbkWorkspace", false);
  show("reviewWorkspace", false);
  show("rejectedWorkspace", false);

  if (status === "approved") {
    put("memberStatus", "Approved");
    put("memberCode", profile.referral_code || "—");
    put("memberEmail", SF.currentUser.email || profile.email || "");
    put("memberCountry", profile.country || "");
    put("walletBalance", "Not available");
    put("walletReserved", "Wallet figures will appear when wallet posting is connected.");

    const { count, error } = await db.from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", SF.currentUser.id);

    if (!error) put("verifiedReferrals", count || 0);

    const activity = document.getElementById("activityList");
    if (activity) {
      activity.innerHTML = '<p class="muted">Loading your account activity…</p>';
      const result = await db.from("activation_requests")
        .select("id,membership_level,status,created_at")
        .eq("user_id", SF.currentUser.id)
        .order("created_at", { ascending: false }).limit(1);

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

  if (status === "rejected") {
    show("rejectedWorkspace", true);
    const latest = await SF.getLatestFBKSubmission();
    put("rejectionDetails", latest?.admin_note || "Your submission was not approved. Contact support for assistance.");
    return;
  }

  const latestRequestResult = await db.from("activation_requests")
    .select("id,full_name,phone,membership_level,status,created_at")
    .eq("user_id", SF.currentUser.id)
    .order("created_at", { ascending: false }).limit(1);

  if (latestRequestResult.error) throw latestRequestResult.error;

  const request = latestRequestResult.data?.[0] || null;

  if (!request) {
    show("activationWorkspace", true);
    return;
  }

  const latestFBK = await SF.getLatestFBKSubmission();

  if (latestFBK && ["submitted", "reviewed"].includes(String(latestFBK.status).toLowerCase())) {
    show("reviewWorkspace", true);
    put("reviewDetails", "Submitted on " + new Date(latestFBK.created_at).toLocaleString());
    return;
  }

  if (latestFBK && String(latestFBK.status).toLowerCase() === "rejected") {
    show("fbkWorkspace", true);
    put("fbkMessage", "Your previous FBK submission was rejected. Please submit a new code.");
    return;
  }

  if (["approved", "accepted"].includes(String(request.status).toLowerCase())) {
    // Profile approval remains the authority for dashboard access.
    show("reviewWorkspace", true);
    put("reviewDetails", "Your activation is awaiting final account status confirmation.");
    return;
  }

  show("fbkWorkspace", true);
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
  const activationForm = document.getElementById("activationForm");
  const fbkForm = document.getElementById("fbkForm");

  activationForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = activationForm.querySelector('[type="submit"]');
    const message = document.getElementById("activationMessage");
    button.disabled = true;

    try {
      const fd = new FormData(activationForm);
      const fullName = String(fd.get("full_name") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const level = Number(fd.get("membership_level"));

      if (!fullName || !phone || ![1, 2, 3, 4].includes(level)) {
        throw new Error("Enter your name, phone number and a valid membership level.");
      }

      const { data, error } = await SF.getClient().rpc("scf_submit_activation", {
        p_full_name: fullName,
        p_phone: phone,
        p_membership_level: level
      });

      if (error) throw error;

      message.textContent = "Activation request submitted successfully.";
      message.style.color = "#237a57";
      activationForm.reset();

      await SF.loadProfile();
      await SF.loadDashboard();
    } catch (error) {
      message.textContent = error.message || "Activation request failed.";
      message.style.color = "#b42318";
    } finally {
      button.disabled = false;
    }
  });

  fbkForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const button = fbkForm.querySelector('[type="submit"]');
    const message = document.getElementById("fbkMessage");
    button.disabled = true;

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

      const { data: inserted, error: insertError } = await SF.getClient()
        .from("fbk_code_submissions")
        .insert({
          user_id: SF.currentUser.id,
          submitted_code: code,
          status: "submitted",
          admin_note: null,
          reviewed_at: null
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Create Alarm 2 after the FBK row has been saved.
      const { error: notificationError } = await SF.getClient().rpc(
        "scholarbrige_create_admin_notification",
        {
          p_event_type: "fbk_submitted",
          p_submitted_fbk_code: code
        }
      );

      if (notificationError) {
        message.textContent = "Your FBK submission was saved, but the admin alarm failed. Please contact support.";
        message.style.color = "#b42318";
        console.error("Alarm 2 notification failed:", notificationError);
        return;
      }

      message.textContent = "FBK submitted successfully. Alarm 2 sent. Your account is UNDER REVIEW.";
      message.style.color = "#237a57";
      fbkForm.reset();

      await SF.loadProfile();
      await SF.loadDashboard();
    } catch (error) {
      message.textContent = error.message || "FBK submission failed.";
      message.style.color = "#b42318";
    } finally {
      button.disabled = false;
    }
  });
});
