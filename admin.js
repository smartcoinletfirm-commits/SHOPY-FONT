SF.adminTab = "products";
SF.adminAuthorized = false;

SF.checkAdmin = async () => {
  if (!SF.currentUser) return false;
  const {data,error} = await SF.getClient().rpc("scf_is_admin");
  if (error) {
    console.warn("Admin verification failed:",error.message);
    return false;
  }
  SF.adminAuthorized = data === true;
  return SF.adminAuthorized;
};

SF.loadAdmin = async (tab="products") => {
  const box = document.getElementById("adminContent");
  if (!box) return;
  if (!SF.currentUser || !(await SF.checkAdmin())) {
    box.innerHTML = "<p>Administrator access is required.</p>";
    return;
  }
  SF.adminTab = tab;
  box.innerHTML = '<p class="muted">Loading review queue…</p>';
  try {
    if (tab === "products") {
      const {data,error} = await SF.getClient().from("sf_products")
        .select("id,title,category,price_usd,status,created_at,supplier_reference,source_type")
        .eq("status","pending").order("created_at",{ascending:true});
      if (error) throw error;
      box.innerHTML = `<h2>Pending product submissions (${data.length})</h2>` +
        (data.length ? data.map(p=>`
          <div class="admin-row"><div><strong>${SF.escapeHtml(p.title)}</strong>
          <p>${SF.escapeHtml(p.category)} · ${SF.formatUsd(p.price_usd)} · ${SF.escapeHtml(p.source_type)} · ${SF.escapeHtml(p.supplier_reference||"No reference")}</p></div>
          <div class="admin-actions"><button class="btn btn-gold" data-review-product="${p.id}" data-status="approved">Approve</button>
          <button class="btn btn-outline" data-review-product="${p.id}" data-status="rejected">Reject</button></div></div>`).join("") : '<p class="muted">No pending product submissions.</p>');
      box.querySelectorAll("[data-review-product]").forEach(b =>
        b.addEventListener("click",()=>SF.reviewProduct(b.dataset.reviewProduct,b.dataset.status))
      );
    } else if (tab === "payments") {
      const {data,error} = await SF.getClient().from("payment_submissions")
        .select("id,user_id,country,membership_level,payment_provider,payment_reference,status,submitted_at")
        .in("status",["submitted","under_review"]).order("submitted_at",{ascending:true});
      if (error) throw error;
      box.innerHTML = `<h2>Payment submissions awaiting review (${data.length})</h2>` +
        (data.length ? data.map(p=>`
          <div class="admin-row"><div><strong>${SF.escapeHtml(p.payment_reference||"No reference supplied")}</strong>
          <p>Level ${p.membership_level} · ${SF.escapeHtml(p.payment_provider||"Provider not stated")} · ${SF.escapeHtml(p.country||"") } · ${p.user_id.slice(0,8)}…</p></div>
          <div class="admin-actions"><button class="btn btn-gold" data-review-payment="${p.id}" data-status="approved">Approve</button>
          <button class="btn btn-outline" data-review-payment="${p.id}" data-status="rejected">Reject</button></div></div>`).join("") : '<p class="muted">No payment submissions awaiting review.</p>');
      box.querySelectorAll("[data-review-payment]").forEach(b =>
        b.addEventListener("click",()=>SF.reviewPayment(b.dataset.reviewPayment,b.dataset.status))
      );
    } else {
      const {data,error} = await SF.getClient().from("sf_product_sales")
        .select("id,product_id,referrer_id,order_reference,sale_amount_usd,status,created_at")
        .eq("status","pending").order("created_at",{ascending:true});
      if (error) throw error;
      box.innerHTML = `<h2>Pending attributed product sales (${data.length})</h2>` +
        (data.length ? data.map(s=>`
          <div class="admin-row"><div><strong>${SF.escapeHtml(s.order_reference)}</strong>
          <p>Product ${s.product_id.slice(0,8)}… · ${SF.formatUsd(s.sale_amount_usd)} · Referrer ${s.referrer_id ? s.referrer_id.slice(0,8)+"…" : "Direct"}</p></div>
          <div class="admin-actions"><button class="btn btn-gold" data-review-sale="${s.id}" data-status="verified">Verify</button>
          <button class="btn btn-outline" data-review-sale="${s.id}" data-status="rejected">Reject</button></div></div>`).join("") : '<p class="muted">No pending product-sale records.</p>');
      box.querySelectorAll("[data-review-sale]").forEach(b =>
        b.addEventListener("click",()=>SF.reviewSale(b.dataset.reviewSale,b.dataset.status))
      );
    }
  } catch(err) {
    box.innerHTML = `<p class="form-message">${SF.escapeHtml(err.message)}</p>`;
  }
};

SF.reviewProduct = async (id,status) => {
  const {error} = await SF.getClient().from("sf_products")
    .update({status,reviewed_at:new Date().toISOString(),reviewed_by:SF.currentUser.id}).eq("id",id);
  if (error) return SF.showToast(error.message);
  SF.showToast(`Product ${status}.`);
  SF.loadAdmin("products");
};

SF.reviewPayment = async (id,status) => {
  const {error} = await SF.getClient().from("payment_submissions")
    .update({status,reviewed_at:new Date().toISOString(),reviewed_by:SF.currentUser.id,review_reason:status==="rejected"?"Rejected by administrator":null})
    .eq("id",id);
  if (error) return SF.showToast(error.message);
  SF.showToast(`Payment marked ${status}.`);
  SF.loadAdmin("payments");
};

SF.reviewSale = async (id,status) => {
  const patch = {status,verified_by:SF.currentUser.id,verified_at:status==="verified"?new Date().toISOString():null};
  const {error} = await SF.getClient().from("sf_product_sales").update(patch).eq("id",id);
  if (error) return SF.showToast(error.message);
  SF.showToast(`Product sale ${status}.`);
  SF.loadAdmin("sales");
};

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-admin-tab]").forEach(b =>
    b.addEventListener("click",()=>SF.loadAdmin(b.dataset.adminTab))
  );
});
