SF.loadDashboard = async () => {
  if(!SF.currentUser) return;
  const p=SF.profile || await SF.loadProfile();
  const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value??"—";};
  put("welcomeName",`Welcome back, ${p?.full_name || SF.currentUser.email || "member"}.`);
  put("memberStatus",p?.role==="admin"||p?.role==="super_admin"?"Administrator":"Active member");
  put("memberCode",p?.referral_code || "—");
  put("memberEmail",SF.currentUser.email);
  put("memberCountry",p?.country || "Country not provided");
  const [refs,ledger]=await Promise.all([
    SF.getClient().from("sf_referrals").select("status",{count:"exact"}).eq("referrer_id",SF.currentUser.id),
    SF.getClient().from("sf_wallet_ledger").select("amount_usd").eq("user_id",SF.currentUser.id)
  ]);
  if(refs.error) throw refs.error;if(ledger.error) throw ledger.error;
  const rows=refs.data||[];
  put("verifiedReferrals",rows.filter(x=>x.status==="verified").length);
  const balance=(ledger.data||[]).reduce((sum,x)=>sum+Number(x.amount_usd||0),0);
  put("walletBalance",`USD ${balance.toFixed(2)}`);
  const activity=document.getElementById("activityList");
  if(activity) activity.innerHTML=`<p>Account created: ${new Date(SF.currentUser.created_at).toLocaleDateString()}</p><p>Referral code: ${SF.escapeHtml(p?.referral_code||"Not available")}</p>`;
  await SF.loadReferralStats();
};
