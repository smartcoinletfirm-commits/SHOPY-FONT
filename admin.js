window.SF = window.SF || {};

SF.adminTab = "products";
SF.adminAuthorized = false;

SF.checkAdmin = async () => {
  if (!SF.currentUser) return false;

  const { data, error } = await SF.getClient().rpc("scf_is_admin");

  if (error) {
    console.warn("Admin verification failed:", error.message);
    return false;
  }

  SF.adminAuthorized = data === true;
  return SF.adminAuthorized;
};

SF.adminEscape = value => SF.escapeHtml(String(value ?? ""));

SF.adminMoney = (amount, currency) => {
  const value = Number(amount || 0);

  if (currency === "NGN") return "₦" + Math.round(value).toLocaleString("en-NG");
  if (currency === "GHS") return "GH₵" + value.toFixed(2);
  return "KES " + value.toLocaleString("en-KE");
};

SF.loadAdmin = async (tab = "products") => {
  const box = document.getElementById("adminContent");
  if (!box) return;

  if (!SF.currentUser || !(await SF.checkAdmin())) {
    box.innerHTML = "<p>Administrator access is required.</p>";
    return;
  }

  SF.adminTab = tab;
  box.innerHTML = '<p class="muted">Loading review queue…</p>';

  try {
    if (tab === "fbk") {
      await SF.loadFBKAdminQueue(box);
      return;
    }

    if (tab === "payments") {
      await SF.loadMemberActivity(box);
      return;
    }

    if (tab === "products") {
      const { data, error } = await SF.getClient()
        .from("sf_products")
        .select("id,title,category,price_usd,status,created_at,supplier_reference,source_type")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      box.innerHTML =
        `<h2>Pending product submissions (${data.length})</h2>` +
        (data.length
          ? data.map(p => `
            <div class="admin-row">
              <div>
                <strong>${SF.adminEscape(p.title)}</strong>
                <p>${SF.adminEscape(p.category)} · ${SF.formatUsd(p.price_usd)} · ${SF.adminEscape(p.source_type)} · ${SF.adminEscape(p.supplier_reference || "No reference")}</p>
              </div>
              <div class="admin-actions">
                <button class="btn btn-gold" data-review-product="${p.id}" data-status="approved">Approve</button>
                <button class="btn btn-outline" data-review-product="${p.id}" data-status="rejected">Reject</button>
              </div>
            </div>`).join("")
          : '<p class="muted">No pending product submissions.</p>');

      box.querySelectorAll("[data-review-product]").forEach(button =>
        button.addEventListener("click", () =>
          SF.reviewProduct(button.dataset.reviewProduct, button.dataset.status)
        )
      );

    } else if (tab === "sales") {
      const { data, error } = await SF.getClient()
        .from("sf_product_sales")
        .select("id,product_id,referrer_id,order_reference,sale_amount_usd,status,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      box.innerHTML =
        `<h2>Pending attributed product sales (${data.length})</h2>` +
        (data.length
          ? data.map(s => `
            <div class="admin-row">
              <div>
                <strong>${SF.adminEscape(s.order_reference)}</strong>
                <p>Product ${SF.adminEscape(s.product_id.slice(0, 8))}… · ${SF.formatUsd(s.sale_amount_usd)} · Referrer ${s.referrer_id ? SF.adminEscape(s.referrer_id.slice(0, 8)) + "…" : "Direct"}</p>
              </div>
              <div class="admin-actions">
                <button class="btn btn-gold" data-review-sale="${s.id}" data-status="verified">Verify</button>
                <button class="btn btn-outline" data-review-sale="${s.id}" data-status="rejected">Reject</button>
              </div>
            </div>`).join("")
          : '<p class="muted">No pending product-sale records.</p>');

      box.querySelectorAll("[data-review-sale]").forEach(button =>
        button.addEventListener("click", () =>
          SF.reviewSale(button.dataset.reviewSale, button.dataset.status)
        )
      );
    }

  } catch (error) {
    box.innerHTML = `<p class="form-message">${SF.adminEscape(error.message)}</p>`;
  }
};

/* ONE ACTIVITY BOX PER MEMBER */

SF.loadMemberActivity = async box => {
  const db = SF.getClient();

  const [activationResult, paymentResult, fbkResult] = await Promise.all([
    db.from("activation_requests")
      .select("id,user_id,full_name,phone,membership_level,status,created_at")
      .order("created_at", { ascending: false }),

    db.from("payment_submissions")
      .select("id,user_id,country,membership_level,payment_provider,payment_reference,payment_link,currency,amount,status,submitted_at")
      .order("submitted_at", { ascending: false }),

    db.from("fbk_code_submissions")
      .select("id,user_id,submitted_code,status,created_at,admin_note")
      .order("created_at", { ascending: false })
  ]);

  if (activationResult.error) throw activationResult.error;
  if (paymentResult.error) throw paymentResult.error;
  if (fbkResult.error) throw fbkResult.error;

  const activations = activationResult.data || [];
  const payments = paymentResult.data || [];
  const fbkSubmissions = fbkResult.data || [];

  const userIds = [...new Set([
    ...activations.map(x => x.user_id),
    ...payments.map(x => x.user_id),
    ...fbkSubmissions.map(x => x.user_id)
  ].filter(Boolean))];

  if (!userIds.length) {
    box.innerHTML = `
      <h2>Member activity</h2>
      <p class="muted">No member activity is available yet.</p>`;
    return;
  }

  const { data: profiles, error: profileError } = await db
    .from("profiles")
    .select("id,full_name,email,phone,country,account_status")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const latestByUser = records => {
    const map = new Map();

    records.forEach(record => {
      if (!record.user_id || map.has(record.user_id)) return;
      map.set(record.user_id, record);
    });

    return map;
  };

  const activationMap = latestByUser(activations);
  const paymentMap = latestByUser(payments);
  const fbkMap = latestByUser(fbkSubmissions);

  const members = [...new Set([
    ...activationMap.keys(),
    ...paymentMap.keys(),
    ...fbkMap.keys()
  ])];

  box.innerHTML = `
    <h2>Member activity (${members.length})</h2>
    <p class="muted">Each member has one activity box containing their activation and submission notifications.</p>

    ${members.map(userId => {
      const profile = profileMap.get(userId) || {};
      const activation = activationMap.get(userId);
      const payment = paymentMap.get(userId);
      const fbk = fbkMap.get(userId);

      const name = activation?.full_name || profile.full_name || "Member";
      const phone = activation?.phone || profile.phone || "Not available";
      const country = payment?.country || profile.country || "Kenya";
      const level = activation?.membership_level || payment?.membership_level;

      const kesPrices = { 1: 580, 2: 1000, 3: 2000, 4: 4500 };
      const rates = { Nigeria: 10.3734, Ghana: 0.0900059, Kenya: 1 };

      let packageCost = "Not available";

      if (level && kesPrices[level]) {
        const currency = country === "Nigeria" ? "NGN" :
          country === "Ghana" ? "GHS" : "KES";

        const amount = kesPrices[level] * (rates[country] || 1);
        packageCost = SF.adminMoney(
          currency === "NGN" ? Math.round(amount) :
          currency === "GHS" ? Number(amount.toFixed(2)) :
          amount,
          currency
        );
      }

      const paymentCost = payment
        ? SF.adminMoney(payment.amount, payment.currency)
        : packageCost;

      let paymentLinkHTML = "";

      if (payment?.payment_link) {
        let safeLink = "";

        try {
          const parsed = new URL(payment.payment_link);
          if (["https:", "http:"].includes(parsed.protocol)) {
            safeLink = parsed.href;
          }
        } catch {}

        paymentLinkHTML = safeLink
          ? `<p>MiniPay link: <a href="${SF.adminEscape(safeLink)}" target="_blank" rel="noopener noreferrer">Open submitted payment link</a></p>`
          : "<p>MiniPay link: Invalid or unavailable link</p>";
      }

      const activationHTML = activation ? `
        <div class="activity-item" style="margin-top:12px;">
          <strong>Membership activation notification</strong>
          <p>Name: ${SF.adminEscape(name)}</p>
          <p>Phone: ${SF.adminEscape(phone)}</p>
          <p>Country: ${SF.adminEscape(country)}</p>
          <p>Membership level: ${SF.adminEscape(level || "Not stated")}</p>
          <p>Package cost: ${SF.adminEscape(packageCost)}</p>
          <p>Status: ${SF.adminEscape(activation.status)}</p>
          <p>Date: ${SF.adminEscape(new Date(activation.created_at).toLocaleString())}</p>
        </div>` : "";

      const paymentHTML = payment ? `
        <div class="activity-item" style="margin-top:12px;">
          <strong>${SF.adminEscape(payment.payment_provider || "Payment")} notification</strong>
          <p>Package: Level ${SF.adminEscape(payment.membership_level)}</p>
          <p>Amount: ${SF.adminEscape(paymentCost)}</p>
          <p>Status: ${SF.adminEscape(payment.status)}</p>
          <p>Date: ${SF.adminEscape(new Date(payment.submitted_at).toLocaleString())}</p>
          ${paymentLinkHTML}
          ${["submitted", "under_review"].includes(String(payment.status).toLowerCase())
            ? `<div class="admin-actions" style="margin-top:12px;">
                <button class="btn btn-gold" data-review-minipay="${payment.id}" data-action="approve">Approve payment</button>
                <button class="btn btn-outline" data-review-minipay="${payment.id}" data-action="reject">Reject payment</button>
              </div>`
            : ""}
        </div>` : "";

      const fbkHTML = fbk ? `
        <div class="activity-item" style="margin-top:12px;">
          <strong>FBK notification</strong>
          <p>FBK code: <strong style="letter-spacing:3px;">${SF.adminEscape(fbk.submitted_code)}</strong></p>
          <p>Status: ${SF.adminEscape(fbk.status)}</p>
          <p>Date: ${SF.adminEscape(new Date(fbk.created_at).toLocaleString())}</p>
          <p><a href="#" data-open-fbk="${fbk.id}">Open FBK review</a></p>
        </div>` : "";

      return `
        <div class="admin-row" style="display:block;margin-bottom:18px;padding:16px;">
          <strong>${SF.adminEscape(name)}</strong>
          <p class="muted">Member ID: ${SF.adminEscape(userId)}</p>
          ${activationHTML}
          ${paymentHTML}
          ${fbkHTML}
        </div>`;
    }).join("")}
  `;

  box.querySelectorAll("[data-review-minipay]").forEach(button => {
    button.addEventListener("click", () =>
      SF.reviewMiniPay(button.dataset.reviewMinipay, button.dataset.action)
    );
  });

  box.querySelectorAll("[data-open-fbk]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      SF.loadAdmin("fbk");
    });
  });
};

/* MINIPAY MANUAL REVIEW */

SF.reviewMiniPay = async (paymentId, action) => {
  const db = SF.getClient();
  const approve = action === "approve";

  let reason = null;

  if (!approve) {
    reason = window.prompt("Enter the reason for rejecting this payment:");

    if (reason === null) return;

    reason = reason.trim();

    if (!reason) {
      SF.showToast("A rejection reason is required.");
      return;
    }
  }

  if (!window.confirm(
    approve
      ? "Have you manually confirmed this MiniPay payment? Approve this member?"
      : "Reject this MiniPay payment submission?"
  )) return;

  try {
    const { data: payment, error: fetchError } = await db
      .from("payment_submissions")
      .select("id,user_id,status")
      .eq("id", paymentId)
      .single();

    if (fetchError) throw fetchError;

    if (!["submitted", "under_review"].includes(String(payment.status).toLowerCase())) {
      throw new Error("This payment has already been reviewed.");
    }

    const newStatus = approve ? "approved" : "rejected";

    const { error: paymentError } = await db
      .from("payment_submissions")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: SF.currentUser.id,
        review_reason: reason
      })
      .eq("id", paymentId);

    if (paymentError) throw paymentError;

    if (approve) {
      const { error: profileError } = await db
        .from("profiles")
        .update({ account_status: "approved" })
        .eq("id", payment.user_id);

      if (profileError) {
        throw new Error("Payment was approved, but member account status could not be updated: " + profileError.message);
      }

      const { error: activationError } = await db
        .from("activation_requests")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: SF.currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", payment.user_id);

      if (activationError) {
        console.warn("Activation request status update failed:", activationError.message);
      }
    } else {
      const { error: profileError } = await db
        .from("profiles")
        .update({ account_status: "rejected" })
        .eq("id", payment.user_id);

      if (profileError) {
        console.warn("Profile status update failed:", profileError.message);
      }

      const { error: activationError } = await db
        .from("activation_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", payment.user_id);

      if (activationError) {
        console.warn("Activation request status update failed:", activationError.message);
      }
    }

    SF.showToast(
      approve
        ? "MiniPay payment approved. Member account activated."
        : "MiniPay payment rejected."
    );

    await SF.loadAdmin("payments");

  } catch (error) {
    SF.showToast(error.message || "Could not review MiniPay payment.");
  }
};

/* ALARM 2 — FBK SUBMISSION REVIEW */

SF.loadFBKAdminQueue = async box => {
  const client = SF.getClient();

  const { data: submissions, error } = await client
    .from("fbk_code_submissions")
    .select("id,user_id,submitted_code,status,admin_note,created_at,reviewed_at")
    .in("status", ["submitted", "reviewed"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!submissions?.length) {
    box.innerHTML = `
      <h2>Alarm 2 · FBK submissions</h2>
      <p class="muted">No FBK submissions are currently awaiting review.</p>`;
    return;
  }

  const userIds = [...new Set(submissions.map(s => s.user_id).filter(Boolean))];

  const { data: profiles, error: profileError } = await client
    .from("profiles")
    .select("id,full_name,email,phone")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  box.innerHTML = `
    <h2>Alarm 2 · FBK submissions (${submissions.length})</h2>
    <p class="muted">Review submitted FBK codes and manually approve or reject members.</p>

    ${submissions.map(s => {
      const profile = profileMap.get(s.user_id) || {};

      return `
        <div class="admin-row" style="display:block;margin-bottom:16px;">
          <div>
            <strong>${SF.adminEscape(profile.full_name || "Member")}</strong>
            <p>Phone: ${SF.adminEscape(profile.phone || "Not available")}</p>
            <p>Email: ${SF.adminEscape(profile.email || "Not available")}</p>
            <p>FBK code: <strong style="letter-spacing:3px;">${SF.adminEscape(s.submitted_code)}</strong></p>
            <p>Status: ${SF.adminEscape(s.status.toUpperCase())}</p>
            <p>Submitted: ${SF.adminEscape(new Date(s.created_at).toLocaleString())}</p>
          </div>

          <div class="admin-actions" style="margin-top:12px;">
            <button class="btn btn-gold" data-review-fbk="${s.id}" data-action="approve">Approve member</button>
            <button class="btn btn-outline" data-review-fbk="${s.id}" data-action="reject">Reject submission</button>
          </div>
        </div>`;
    }).join("")}
  `;

  box.querySelectorAll("[data-review-fbk]").forEach(button => {
    button.addEventListener("click", async () => {
      const approve = button.dataset.action === "approve";
      let reason = null;

      if (!approve) {
        reason = window.prompt("Enter the reason for rejecting this FBK submission:");

        if (reason === null) return;

        reason = reason.trim();

        if (!reason) {
          SF.showToast("A rejection reason is required.");
          return;
        }
      }

      if (!window.confirm(
        approve
          ? "Approve this member and grant dashboard access?"
          : "Reject this FBK submission?"
      )) return;

      button.disabled = true;

      try {
        const { data, error } = await client.rpc(
          "scf_review_fbk_activation",
          {
            p_submission_id: button.dataset.reviewFbk,
            p_approve: approve,
            p_admin_note: reason
          }
        );

        if (error) throw error;

        if (data && data.success === false) {
          throw new Error(data.message || "The review was not completed.");
        }

        SF.showToast(approve ? "Member approved." : "FBK submission rejected.");
        await SF.loadAdmin("fbk");

      } catch (error) {
        SF.showToast(error.message || "Could not complete the review.");
        button.disabled = false;
      }
    });
  });
};

/* PRODUCT, PAYMENT AND SALES REVIEW ACTIONS */

SF.reviewProduct = async (id, status) => {
  const { error } = await SF.getClient()
    .from("sf_products")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: SF.currentUser.id
    })
    .eq("id", id);

  if (error) return SF.showToast(error.message);

  SF.showToast(`Product ${status}.`);
  SF.loadAdmin("products");
};

SF.reviewPayment = async (id, status) => {
  const { error } = await SF.getClient()
    .from("payment_submissions")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: SF.currentUser.id,
      review_reason: status === "rejected" ? "Rejected by administrator" : null
    })
    .eq("id", id);

  if (error) return SF.showToast(error.message);

  SF.showToast(`Payment marked ${status}.`);
  SF.loadAdmin("payments");
};

SF.reviewSale = async (id, status) => {
  const patch = {
    status,
    verified_by: SF.currentUser.id,
    verified_at: status === "verified" ? new Date().toISOString() : null
  };

  const { error } = await SF.getClient()
    .from("sf_product_sales")
    .update(patch)
    .eq("id", id);

  if (error) return SF.showToast(error.message);

  SF.showToast(`Product sale ${status}.`);
  SF.loadAdmin("sales");
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-admin-tab]").forEach(button =>
    button.addEventListener("click", () =>
      SF.loadAdmin(button.dataset.adminTab)
    )
  );
});
