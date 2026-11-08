SF.formatUsd = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));

SF.loadProducts = async () => {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state">Loading approved listings…</div>';
  try {
    let q = SF.getClient().from("sf_products")
      .select("id,title,category,description,price_usd,image_url,seller_id")
      .eq("status","approved").order("created_at",{ascending:false}).limit(60);
    const term = document.getElementById("productSearch")?.value?.trim();
    const category = document.getElementById("productCategory")?.value;
    if (term) q = q.ilike("title",`%${term.replace(/[%_]/g,"")}%`);
    if (category) q = q.eq("category",category);
    const {data,error} = await q;
    if (error) throw error;
    if (!data?.length) {
      grid.innerHTML = '<div class="empty-state">No approved products found. Please check back later.</div>';
      return;
    }
    grid.innerHTML = data.map(p=>`
      <article class="product-card">
        <div class="product-image">${p.image_url ? `<img src="${SF.escapeAttr(p.image_url)}" alt="${SF.escapeAttr(p.title)}" loading="lazy" onerror="this.remove()">` : "<span>Product image unavailable</span>"}</div>
        <div class="product-info">
          <span class="product-category">${SF.escapeHtml(p.category)}</span>
          <h3>${SF.escapeHtml(p.title)}</h3>
          <p>${SF.escapeHtml((p.description||"").slice(0,105))}</p>
          <div class="product-price">${SF.formatUsd(p.price_usd)}</div>
          <button class="text-link product-share" data-product="${p.id}">Share listing ↗</button>
        </div>
      </article>`).join("");
    grid.querySelectorAll(".product-share").forEach(btn =>
      btn.addEventListener("click",()=>SF.shareProduct(btn.dataset.product))
    );
  } catch(err) {
    grid.innerHTML = `<div class="empty-state">Could not load products: ${SF.escapeHtml(err.message)}</div>`;
  }
};

SF.productShareUrl = productId => {
  const url = new URL(location.href);
  url.hash = "marketplace";
  url.search = "";
  url.searchParams.set("product",productId);
  if (SF.profile?.referral_code) url.searchParams.set("ref",SF.profile.referral_code);
  return url.toString();
};

SF.shareProduct = async productId => {
  const url = SF.productShareUrl(productId);
  try {
    if (navigator.share) await navigator.share({title:"SHOPY FONT product",url});
    else {
      await navigator.clipboard.writeText(url);
      SF.showToast("Product link copied.");
    }
  } catch(err) {
    if (err.name !== "AbortError") SF.showToast("Could not share this listing.");
  }
};

SF.trackProductVisit = async () => {
  const params = new URLSearchParams(location.search);
  const productId = params.get("product");
  if (!productId) return;
  const key = `sf_product_visit_${productId}_${params.get("ref")||"direct"}`;
  if (sessionStorage.getItem(key)) return;
  const {error} = await SF.getClient().rpc("sf_track_product_click",{
    p_product_id:productId,
    p_referral_code:params.get("ref") || null
  });
  if (error) {
    console.warn("Product visit tracking unavailable:",error.message);
    return;
  }
  sessionStorage.setItem(key,"1");
};

SF.submitProduct = async form => {
  if (!SF.currentUser) throw new Error("Please log in before submitting a product.");
  const fd = new FormData(form);
  const payload = {
    seller_id:SF.currentUser.id,
    title:String(fd.get("title")||"").trim(),
    category:fd.get("category"),
    price_usd:Number(fd.get("price_usd")),
    image_url:fd.get("image_url") || null,
    description:String(fd.get("description")||"").trim(),
    supplier_reference:fd.get("supplier_reference") || null,
    source_type:"seller_submission",
    status:"pending"
  };
  const {error} = await SF.getClient().from("sf_products").insert(payload);
  if (error) throw error;
  form.reset();
  form.classList.add("hidden");
  SF.showToast("Product submitted for administrator review.");
};

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("productSearch")?.addEventListener("input",()=>SF.loadProducts());
  document.getElementById("productCategory")?.addEventListener("change",()=>SF.loadProducts());
  document.getElementById("productForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    try { await SF.submitProduct(e.currentTarget); }
    catch(err) { const m=document.getElementById("productFormMessage"); if(m)m.textContent=err.message; }
  });
});
  
