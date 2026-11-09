SF.formatUsd = n => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
}).format(Number(n || 0));

const SF_CART_KEY = "sf_marketplace_cart_v1";

SF.getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(SF_CART_KEY) || "[]");
  } catch {
    return [];
  }
};

SF.saveCart = cart => {
  localStorage.setItem(SF_CART_KEY, JSON.stringify(cart));
  SF.renderCart();
};

SF.addToCart = product => {
  const cart = SF.getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    SF.showToast("This product is already in your trolley.");
    return;
  }

  cart.push({
    id: product.id,
    title: product.title,
    price_usd: Number(product.price_usd),
    image_url: product.image_url || "",
    seller_id: product.seller_id || null
  });

  SF.saveCart(cart);
  SF.showToast("Product added to your trolley.");
};

SF.removeFromCart = productId => {
  SF.saveCart(SF.getCart().filter(item => item.id !== productId));
};

SF.renderCart = () => {
  let panel = document.getElementById("sfCartPanel");

  if (!panel) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    panel = document.createElement("section");
    panel.id = "sfCartPanel";
    panel.className = "sf-cart-panel";
    grid.insertAdjacentElement("beforebegin", panel);
  }

  const cart = SF.getCart();
  const total = cart.reduce((sum, item) => sum + Number(item.price_usd || 0), 0);

  panel.innerHTML = `
    <div class="sf-cart-heading">
      <div>
        <p class="eyebrow">YOUR SELECTION</p>
        <h2>My trolley (${cart.length})</h2>
      </div>
      <strong>${SF.formatUsd(total)}</strong>
    </div>

    ${
      cart.length
        ? `
          <div class="sf-cart-items">
            ${cart.map(item => `
              <div class="sf-cart-item">
                <div>
                  <strong>${SF.escapeHtml(item.title)}</strong>
                  <span>${SF.formatUsd(item.price_usd)}</span>
                </div>
                <button type="button"
                  class="text-link sf-remove-item"
                  data-remove="${SF.escapeAttr(item.id)}">
                  Remove
                </button>
              </div>
            `).join("")}
          </div>
          <p class="notice">
            Your trolley is saved on this device. Private seller inquiries
            will be enabled when secure messaging is connected.
          </p>
        `
        : `<p class="empty-state">Your trolley is empty. Add products you are interested in.</p>`
    }
  `;

  panel.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      SF.removeFromCart(button.dataset.remove);
    });
  });
};

SF.loadProducts = async () => {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state">Loading approved listings…</div>';

  try {
    let q = SF.getClient()
      .from("sf_products")
      .select("id,title,category,description,price_usd,image_url,seller_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(60);

    const term = document.getElementById("productSearch")?.value?.trim();
    const category = document.getElementById("productCategory")?.value;

    if (term) q = q.ilike("title", `%${term.replace(/[%_]/g, "")}%`);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) throw error;

    if (!data?.length) {
      grid.innerHTML = '<div class="empty-state">No approved products found. Please check back later.</div>';
      SF.renderCart();
      return;
    }

    grid.innerHTML = data.map(p => `
      <article class="product-card">
        <div class="product-image">
          ${
            p.image_url
              ? `<img src="${SF.escapeAttr(p.image_url)}"
                  alt="${SF.escapeAttr(p.title)}"
                  loading="lazy" onerror="this.remove()">`
              : "<span>Product image unavailable</span>"
          }
        </div>
        <div class="product-info">
          <span class="product-category">${SF.escapeHtml(p.category)}</span>
          <h3>${SF.escapeHtml(p.title)}</h3>
          <p>${SF.escapeHtml((p.description || "").slice(0, 105))}</p>
          <div class="product-price">${SF.formatUsd(p.price_usd)}</div>
          <div class="sf-product-actions">
            <button type="button" class="btn btn-gold sf-add-cart"
              data-product="${SF.escapeAttr(p.id)}">
              Add to trolley
            </button>
            <button type="button" class="text-link product-share"
              data-product="${SF.escapeAttr(p.id)}">
              Share listing ↗
            </button>
          </div>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".sf-add-cart").forEach(button => {
      button.addEventListener("click", () => {
        const product = data.find(p => p.id === button.dataset.product);
        if (product) SF.addToCart(product);
      });
    });

    grid.querySelectorAll(".product-share").forEach(button => {
      button.addEventListener("click", () => SF.shareProduct(button.dataset.product));
    });

    SF.renderCart();

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state">
        Could not load products: ${SF.escapeHtml(err.message)}
      </div>
    `;
  }
};

SF.productShareUrl = productId => {
  const url = new URL(location.href);
  url.hash = "marketplace";
  url.search = "";
  url.searchParams.set("product", productId);

  if (SF.profile?.referral_code) {
    url.searchParams.set("ref", SF.profile.referral_code);
  }

  return url.toString();
};

SF.shareProduct = async productId => {
  const url = SF.productShareUrl(productId);

  try {
    if (navigator.share) {
      await navigator.share({ title: "SHOPY FONT product", url });
    } else {
      await navigator.clipboard.writeText(url);
      SF.showToast("Product link copied.");
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      SF.showToast("Could not share this listing.");
    }
  }
};

SF.trackProductVisit = async () => {
  const params = new URLSearchParams(location.search);
  const productId = params.get("product");

  if (!productId) return;

  const key = `sf_product_visit_${productId}_${params.get("ref") || "direct"}`;
  if (sessionStorage.getItem(key)) return;

  const { error } = await SF.getClient().rpc("sf_track_product_click", {
    p_product_id: productId,
    p_referral_code: params.get("ref") || null
  });

  if (error) {
    console.warn("Product visit tracking unavailable:", error.message);
    return;
  }

  sessionStorage.setItem(key, "1");
};

SF.submitProduct = async form => {
  if (!SF.currentUser) {
    throw new Error("Please log in before submitting a product.");
  }

  const fd = new FormData(form);

  const payload = {
    seller_id: SF.currentUser.id,
    title: String(fd.get("title") || "").trim(),
    category: fd.get("category"),
    price_usd: Number(fd.get("price_usd")),
    image_url: fd.get("image_url") || null,
    description: String(fd.get("description") || "").trim(),
    supplier_reference: fd.get("supplier_reference") || null,
    source_type: "seller_submission",
    status: "pending"
  };

  const { error } = await SF.getClient()
    .from("sf_products")
    .insert(payload);

  if (error) throw error;

  form.reset();
  form.classList.add("hidden");
  SF.showToast("Product submitted for administrator review.");
};

document.addEventListener("DOMContentLoaded", () => {
  SF.renderCart();

  document.getElementById("productSearch")
    ?.addEventListener("input", () => SF.loadProducts());

  document.getElementById("productCategory")
    ?.addEventListener("change", () => SF.loadProducts());

  document.getElementById("productForm")
    ?.addEventListener("submit", async e => {
      e.preventDefault();

      try {
        await SF.submitProduct(e.currentTarget);
      } catch (err) {
        const message = document.getElementById("productFormMessage");
        if (message) message.textContent = err.message;
      }
    });
});
  
