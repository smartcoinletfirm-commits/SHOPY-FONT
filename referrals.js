SF.loadReferralStats = async () => {
  if(!SF.currentUser)return;
  const {data,error}=await SF.getClient().from("sf_referrals").select("status").eq("referrer_id",SF.currentUser.id);
  if(error)throw error;
  const rows=data||[],total=rows.length,verified=rows.filter(r=>r.status==="verified").length,pending=rows.filter(r=>r.status==="registered").length;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set("refTotal",total);set("refVerified",verified);set("refPending",pending);
  set("verifiedReferrals",verified);
  const input=document.getElementById("referralLink");
  if(input&&SF.profile?.referral_code){const u=new URL(location.href);u.search="";u.hash="";u.searchParams.set("ref",SF.profile.referral_code);input.value=u.toString();}
};
SF.copyReferralLink = async () => {
  const input=document.getElementById("referralLink");
  if(!input?.value||input.value.includes("Log in"))return SF.showToast("Log in to access your referral link.");
  try{await navigator.clipboard.writeText(input.value);SF.showToast("Referral link copied.");}
  catch{input.select();document.execCommand("copy");SF.showToast("Referral link copied.");}
};
