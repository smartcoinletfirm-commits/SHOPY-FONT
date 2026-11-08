
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
                <strong>${SF.escapeHtml(p.title)}</strong>
                <p>${SF.escapeHtml(p.category)} · ${SF.formatUsd(p.price_usd)} · ${SF.escapeHtml(p.source_type)} · ${SF.escapeHtml(p.supplier_reference || "No reference")}</p>
              </div>
              <div class="admin-actions">
                <button class="btn btn-gold" data-review-product="${p.id}" data-status="approved">Approve</button>
                <button class="btn btn-outline" data-review-product="${p.id}" data-status="rejected">Reject</button>
              </div>
            </div>`).join("")
          : '<p class="muted">No pending product submissions.</p>');

      box.querySelectorAll("[data-review-product]").forEach(b =>
        b.addEventListener("click", () =>
          SF.reviewProduct(b.dataset.reviewProduct, b.dataset.status)
        )
      );

    } else if (tab === "payments") {
      const { data, error } = await SF.getClient()
        .from("payment_submissions")
        .select("id,user_id,country,membership_level,payment_provider,payment_reference,status,submitted_at")
        .in("status", ["submitted", "under_review"])
        .order("submitted_at", { ascending: true });

      if (error) throw error;

      box.innerHTML =
        `<h2>Payment submissions awaiting review (${data.length})</h2>` +
        (data.length
          ? data.map(p => `
            <div class="admin-row">
              <div>
                <strong>${SF.escapeHtml(p.payment_reference || "No reference supplied")}</strong>
                <p>Level ${p.membership_level} · ${SF.escapeHtml(p.payment_provider || "Provider not stated")} · ${SF.escapeHtml(p.country || "")} · ${p.user_id.slice(0, 8)}…</p>
              </div>
              <div class="admin-actions">
                <button class="btn btn-gold" data-review-payment="${p.id}" data-status="approved">Approve</button>
                <button class="btn btn-outline" data-review-payment="${p.id}" data-status="rejected">Reject</button>
              </div>
            </div>`).join("")
          : '<p class="muted">No payment submissions awaiting review.</p>');

      box.querySelectorAll("[data-review-payment]").forEach(b =>
        b.addEventListener("click", () =>
          SF.reviewPayment(b.dataset.reviewPayment, b.dataset.status)
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
                <strong>${SF.escapeHtml(s.order_reference)}</strong>
                <p>Product ${s.product_id.slice(0, 8)}… · ${SF.formatUsd(s.sale_amount_usd)} · Referrer ${s.referrer_id ? s.referrer_id.slice(0, 8) + "…" : "Direct"}</p>
              </div>
              <div class="admin-actions">
                <button class="btn btn-gold" data-review-sale="${s.id}" data-status="verified">Verify</button>
                <button class="btn btn-outline" data-review-sale="${s.id}" data-status="rejected">Reject</button>
              </div>
            </div>`).join("")
          : '<p class="muted">No pending product-sale records.</p>');

      box.querySelectorAll("[data-review-sale]").forEach(b =>
        b.addEventListener("click", () =>
          SF.reviewSale(b.dataset.reviewSale, b.dataset.status)
        )
      );
    }

  } catch (err) {
    box.innerHTML = `<p class="form-message">${SF.escapeHtml(err.message)}</p>`;
  }
};

/* ALARM 2 — FBK SUBMISSION REVIEW */

SF.loadFBKAdminQueue = async (box) => {
  const client = SF.getClient();

  const { data: notifications, error: notificationError } = await client
    .from("admin_notifications")
    .select("id,user_id,membership_level,phone,message,is_read,created_at,submitted_fbk_code")
    .eq("event_type", "fbk_submitted")
    .order("created_at", { ascending: false });

  if (notificationError) throw notificationError;

  const { data: submissions, error: submissionError } = await client
    .from("fbk_code_submissions")
    .select("id,user_id,submitted_code,status,admin_note,created_at,reviewed_at")
    .in("status", ["submitted", "reviewed"])
    .order("created_at", { ascending: false });

  if (submissionError) throw submissionError;

  const pendingNotifications = (notifications || []).filter(n =>
    (submissions || []).some(s =>
      s.user_id === n.user_id &&
      s.submitted_code === n.submitted_fbk_code
    )
  );

  const uniqueNotifications = [];
  const seen = new Set();

  pendingNotifications.forEach(n => {
    const key = `${n.user_id}:${n.submitted_fbk_code}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNotifications.push(n);
    }
  });

  if (!uniqueNotifications.length) {
    box.innerHTML = `
      <h2>Alarm 2 · FBK submissions</h2>
      <p class="muted">No FBK submissions are currently awaiting review.</p>`;
    return;
  }

  const userIds = [...new Set(uniqueNotifications.map(n => n.user_id))];

  const { data: profiles, error: profileError } = await client
    .from("profiles")
    .select("id,full_name,email")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, p])
  );

  const submissionMap = new Map();

  (submissions || []).forEach(s => {
    const key = `${s.user_id}:${s.submitted_code}`;
    if (!submissionMap.has(key)) submissionMap.set(key, s);
  });

  box.innerHTML = `
    <h2>Alarm 2 · FBK submissions (${uniqueNotifications.length})</h2>
    <p class="muted">Review each submitted FBK code and manually approve or reject the member.</p>
    ${uniqueNotifications.map(n => {
      const key = `${n.user_id}:${n.submitted_fbk_code}`;
      const submission = submissionMap.get(key);
      const profile = profileMap.get(n.user_id) || {};

      if (!submission) return "";

      const submittedDate = n.created_at
        ? new Date(n.created_at).toLocaleString()
        : "Date unavailable";

      return `
        <div class="admin-row" style="display:block;margin-bottom:16px;">
          <div>
            <strong>${SF.escapeHtml(profile.full_name || "Member name unavailable")}</strong>
            <p>Email: ${SF.escapeHtml(profile.email || "Not available")}</p>
            <p>Phone: ${SF.escapeHtml(n.phone || "Not available")}</p>
            <p>Membership level: ${SF.escapeHtml(String(n.membership_level || "Not stated"))}</p>
            <p>Submitted FBK:
              <strong style="letter-spacing:3px;">${SF.escapeHtml(submission.submitted_code)}</strong>
            </p>
            <p>Status: <strong>${SF.escapeHtml(submission.status.toUpperCase())}</strong></p>
            <p>Submitted: ${SF.escapeHtml(submittedDate)}</p>
            <p>${SF.escapeHtml(n.message || "FBK submitted for review.")}</p>
          </div>
          <div class="admin-actions" style="margin-top:12px;">
            <button class="btn btn-gold"
              data-review-fbk="${submission.id}"
              data-notification="${n.id}"
              data-action="approve">Approve member</button>
            <button class="btn btn-outline"
              data-review-fbk="${submission.id}"
              data-notification="${n.id}"
              data-action="reject">Reject submission</button>
          </div>
        </div>`;
    }).join("")}
  `;

  box.querySelectorAll("[data-review-fbk]").forEach(button => {
    button.addEventListener("click", async () => {
      const submissionId = button.dataset.reviewFbk;
      const notificationId = button.dataset.notification;
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

      const confirmed = window.confirm(
        approve
          ? "Approve this member and grant dashboard access?"
          : "Reject this FBK submission?"
      );

      if (!confirmed) return;

      button.disabled = true;
      button.textContent = "Processing…";

      try {
        const { data, error } = await client.rpc(
          "scf_review_fbk_activation",
          {
            p_submission_id: submissionId,
            p_approve: approve,
            p_admin_note: reason
          }
        );

        if (error) throw error;

        if (data && data.success === false) {
          throw new Error(data.message || "The review was not completed.");
        }

        await client
          .from("admin_notifications")
          .update({ is_read: true })
          .eq("id", notificationId);

        SF.showToast(
          approve
            ? "Member approved. Dashboard access granted."
            : "FBK submission rejected."
        );

        await SF.loadAdmin("fbk");

      } catch (err) {
        SF.showToast(err.message || "Could not complete the review.");
        button.disabled = false;
        button.textContent = approve ? "Approve member" : "Reject submission";
      }
    });
  });
};

/* EXISTING PRODUCT, PAYMENT AND SALES REVIEW ACTIONS */

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
      review_reason: status === "rejected"
        ? "Rejected by administrator"
        : null
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
    verified_at: status === "verified"
      ? new Date().toISOString()
      : null
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
  
