SF.adminTab="products";
SF.requireAdmin = () => ["admin","super_admin"].includes(SF.profile?.role);
SF.loadAdmin = async (tab="products") => {
  const box=document.getElementById("adminContent");if(!box)return;
  if(!SF.currentUser||!SF.requireAdmin()){box.innerHTML="<p>Administrator access is required.</p>";return;}
  SF.adminTab=tab;box.innerHTML='<p class="muted">Loading review queue…</p>';
  try{
    if(tab==="products"){
      const {data,error}=await SF.getClient().from("sf_products").select("id,title,category,price_usd,status,created_at,supplier_reference,source_type").eq("status","pending").order("created_at",{ascending:true});
      if(error)throw error;
      box.innerHTML=`<h2>Pending product submissions (${data.length})</h2>`+(data.length?data.map(p=>`<div class="admin-row"><div><strong>${SF.escapeHtml(p.title)}</strong><p>${SF.escapeHtml(p.category)} · ${SF.formatUsd(p.price_usd)} · ${SF.escapeHtml(p.source_type)} · ${SF.escapeHtml(p.supplier_reference||"No supplier reference")}</p></div><div class="admin-actions"><button class="btn btn-gold" data-review-product="${p.id}" data-status="approved">Approve</button><button class="btn btn-outline" data-review-product="${p.id}" data-status="rejected">Reject</button></div></div>`).join(""):'<p class="muted">No pending product submissions.</p>');
      box.querySelectorAll("[data-review-product]").forEach(b=>b.addEventListener("click",()=>SF.reviewProduct(b.dataset.reviewProduct,b.dataset.status)));
    }else{
      const {data,error}=await SF.getClient().from("sf_payments").select("id,user_id,package_amount_kes,payment_reference,status,created_at").eq("status","pending").order("created_at",{ascending:true});
      if(error)throw error;
      box.innerHTML=`<h2>Pending payment reviews (${data.length})</h2>`+(data.length?data.map(p=>`<div class="admin-row"><div><strong>${SF.escapeHtml(p.payment_reference||"No reference supplied")}</strong><p>${Number(p.package_amount_kes).toLocaleString()} KES · User ${p.user_id.slice(0,8)}…</p></div><div class="admin-actions"><button class="btn btn-gold" data-review-payment="${p.id}" data-status="verified">Verify</button><button class="btn btn-outline" data-review-payment="${p.id}" data-status="failed">Mark failed</button></div></div>`).join(""):'<p class="muted">No pending payments.</p>');
      box.querySelectorAll("[data-review-payment]").forEach(b=>b.addEventListener("click",()=>SF.reviewPayment(b.dataset.reviewPayment,b.dataset.status)));
    }
  }catch(err){box.innerHTML=`<p class="form-message">${SF.escapeHtml(err.message)}</p>`;}
};
SF.reviewProduct=async(id,status)=>{
  const {error}=await SF.getClient().from("sf_products").update({status,reviewed_at:new Date().toISOString(),reviewed_by:SF.currentUser.id}).eq("id",id);
  if(error)return SF.showToast(error.message);SF.showToast(`Product ${status}.`);SF.loadAdmin("products");
};
SF.reviewPayment=async(id,status)=>{
  const {error}=await SF.getClient().from("sf_payments").update({status,verified_by:SF.currentUser.id,verified_at:status==="verified"?new Date().toISOString():null}).eq("id",id);
  if(error)return SF.showToast(error.message);SF.showToast(`Payment marked ${status}.`);SF.loadAdmin("payments");
};
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-admin-tab]").forEach(b=>b.addEventListener("click",()=>SF.loadAdmin(b.dataset.adminTab)));
});
