
const SF_REFERRAL_BASE_URL = "https://em6gt0.s.gy/world-connected-font";

SF.buildReferralLink = () => {
  const code = SF.profile?.referral_code;

  if (!code) return "";

  const url = new URL(SF_REFERRAL_BASE_URL);
  url.searchParams.set("ref", code);
  return url.toString();
};

SF.loadReferralStats = async () => {
  if (!SF.currentUser) return;

  const { data, error } = await SF.getClient()
    .from("referrals")
    .select("status")
    .eq("referrer_id", SF.currentUser.id);

  if (error) throw error;

  const rows = data || [];
  const total = rows.length;
  const confirmed = rows.filter(r =>
    ["eligible", "rewarded"].includes(r.status)
  ).length;
  const pending = rows.filter(r => r.status === "registered").length;

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set("refTotal", total);
  set("refVerified", confirmed);
  set("refPending", pending);
  set("verifiedReferrals", confirmed);

  const input = document.getElementById("referralLink");

  if (input) {
    input.value = SF.buildReferralLink() || "Log in to access your referral link";
  }
};

SF.copyReferralLink = async () => {
  const link = SF.buildReferralLink();

  if (!link) {
    SF.showToast("Log in to access your referral link.");
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    SF.showToast("Your SHOPY FONT referral link has been copied.");
  } catch {
    const input = document.getElementById("referralLink");

    if (input) {
      input.value = link;
      input.select();
      document.execCommand("copy");
      SF.showToast("Your referral link has been copied.");
    }
  }
};

SF.shareReferralLink = async () => {
  const link = SF.buildReferralLink();

  if (!link) {
    SF.showToast("Log in to access your referral link.");
    return;
  }

  const message = `Join SHOPY FONT using my referral link: ${link}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Join SHOPY FONT",
        text: "Join SHOPY FONT using my referral link:",
        url: link
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        SF.showToast("Sharing was not completed.");
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(message);
      SF.showToast("Referral message copied. You can now share it.");
    } catch {
      SF.showToast("Unable to copy the referral link.");
    }
  }
};
