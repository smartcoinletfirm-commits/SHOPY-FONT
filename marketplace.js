SF.formatUsd = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));
SF.loadProducts = async () => {
  const grid=document.getElementById("productGrid");if(!grid)return;
  grid.innerHTML='<div class="empty-state">Loading approved listings…</div>';
  try{
    let q=SF.getClient().from("sf_products").select("id,title,category,description,price_usd,image_url,seller_id").eq("status","approved").order("created_at",{ascending:false}).limit(60);
    const term=document.getElementById("productSearch")?.value?.trim();
    const category=document.getElementById("productCategory")?.value;
    if(term) q=q.ilike("title",`%${term.replace(/[%_]/g,"")}%`);
    if(category) q=q.eq("category",category);
    const {data,error}=await q;if(error)throw error;
    if(!data?.length){grid.innerHTML='<div class="empty-state">No approved products found. Please check back later.</div>';return;}
    grid.innerHTML=data.map(p=>`<article class="product-card">
      <div class="product-image">${p.image_url?`<img src="${SF.escapeAttr(p.image_url)}" alt="${SF.escapeAttr(p.title)}" loading="lazy" onerror="this.remove()">`:"<span>Product image</span>"}</div>
      <div class="product-info"><span class="product-category">${SF.escapeHtml(p.category)}</span><h3>${SF.escapeHtml(p.title)}</h3><p>${SF.escapeHtml((p.description||"").slice(0,105))}</p><div class="product-price">${SF.formatUsd(p.price_usd)}</div><button class="text-link product-share" data-product="${p.id}">Share listing ↗</button></div>
    </article>`).join("");
    grid.querySelectorAll(".product-share").forEach(btn=>btn.addEventListener("click",()=>SF.shareProduct(btn.dataset.product)));
    // Track listing impressions as clicks only when the member chooses Share.
  }catch(err){grid.innerHTML=`<div class="empty-state">Could not load products: ${SF.escapeHtml(err.message)}</div>`;}
};
SF.shareProduct = async (productId) => {
  const url=new URL(location.href);url.searchParams.set("product",productId);
  if(SF.profile?.referral_code) url.searchParams.set("ref",SF.profile.referral_code);
  try{
    await SF.getClient().from("sf_product_clicks").insert({product_id:productId,member_id:SF.currentUser?.id||null,referral_code:SF.profile?.referral_code||null});
    if(navigator.share) await navigator.share({title:"SHOPY FONT product",url:url.toString()});
    else {await navigator.clipboard.writeText(url.toString());SF.showToast("Product link copied.");}
  }catch(err){if(err.name!=="AbortError")SF.showToast("Could not share this listing.");}
};
SF.submitProduct = async form => {
  if(!SF.currentUser) throw new Error("Please log in before submitting a product.");
  const fd=new FormData(form);
  const payload={seller_id:SF.currentUser.id,title:fd.get("title").trim(),category:fd.get("category"),price_usd:Number(fd.get("price_usd")),image_url:fd.get("image_url")||null,description:fd.get("description").trim(),supplier_reference:fd.get("supplier_reference")||null,source_type:fd.get("source_type"),status:"pending"};
  const {error}=await SF.getClient().from("sf_products").insert(payload);if(error)throw error;
  form.reset();form.classList.add("hidden");SF.showToast("Product submitted for administrator review.");
};
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("productSearch")?.addEventListener("input",()=>SF.loadProducts());
  document.getElementById("productCategory")?.addEventListener("change",()=>SF.loadProducts());
  document.getElementById("productForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await SF.submitProduct(e.currentTarget);}catch(err){const m=document.getElementById("productFormMessage");if(m)m.textContent=err.message;}});
});

