SF.loadReferralStats = async () => {
  if (!SF.currentUser) return;
  const {data,error} = await SF.getClient().from("referrals")
    .select("status").eq("referrer_id",SF.currentUser.id);
  if (error) throw error;

  const rows = data || [];
  const total = rows.length;
  const confirmed = rows.filter(r=>["eligible","rewarded"].includes(r.status)).length;
  const pending = rows.filter(r=>r.status==="registered").length;
  const set = (id,value) => { const el=document.getElementById(id); if(el)el.textContent=value; };

  set("refTotal",total);
  set("refVerified",confirmed);
  set("refPending",pending);
  set("verifiedReferrals",confirmed);

  const input = document.getElementById("referralLink");
  if (input && SF.profile?.referral_code) {
    const u = new URL(location.href);
    u.hash = "";
    u.search = "";
    u.searchParams.set("ref",SF.profile.referral_code);
    input.value = u.toString();
  }
};

SF.copyReferralLink = async () => {
  const input = document.getElementById("referralLink");
  if (!input?.value || input.value.includes("Log in")) {
    SF.showToast("Log in to access your referral link.");
    return;
  }
  try {
    await navigator.clipboard.writeText(input.value);
    SF.showToast("Referral link copied.");
  } catch {
    input.select();
    document.execCommand("copy");
    SF.showToast("Referral link copied.");
  }
};
