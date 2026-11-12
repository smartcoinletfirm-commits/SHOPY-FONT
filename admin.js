
window.SF = window.SF || {};

SF.adminTab = "notifications";
SF.adminAuthorized = false;

SF.checkAdmin = async () => {
  if (!SF.currentUser) return false;

  const { data, error } = await SF.getClient().rpc("scf_is_admin");

  if (error) {
    console.error("Admin verification:", error.message);
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

SF.adminTabs = () => `
  <div class="admin-actions" style="flex-wrap:wrap;margin-bottom:20px;">
    ${[
      ["notifications","Notifications"],
      ["members","All members"],
      ["payments","Payments"],
      ["fbk","FBK review"],
      ["products","Products"],
      ["sales","Sales"]
    ].map(([key,label]) => `
      <button class="btn ${SF.adminTab === key ? "btn-gold" : "btn-outline"}"
        data-admin-tab="${key}">${label}</button>
    `).join("")}
  </div>
`;

SF.loadAdmin = async (tab = SF.adminTab || "notifications") => {
  const box = document.getElementById("adminContent");
  if (!box) return;

  if (!SF.currentUser || !(await SF.checkAdmin())) {
    box.innerHTML = "<p>Administrator access is required.</p>";
    return;
  }

  SF.adminTab = tab;
  box.innerHTML = '<p class="muted">Loading administration workspace…</p>';

  try {
    let content = "";

    if (tab === "notifications") {
      content = await SF.adminNotifications();
    } else if (tab === "members") {
      content = await SF.adminMembers();
    } else if (tab === "payments") {
      content = await SF.adminPayments();
    } else if (tab === "fbk") {
      content = await SF.adminFBK();
    } else if (tab === "products") {
      content = await SF.adminProducts();
    } else if (tab === "sales") {
      content = await SF.adminSales();
    }

    box.innerHTML = SF.adminTabs() + content;
    SF.adminBindActions(box);

  } catch (error) {
    box.innerHTML = SF.adminTabs() +
      `<p class="form-message">${SF.adminEscape(error.message)}</p>`;
  }
};

/* ADMIN NOTIFICATIONS */


SF.adminNotifications = async () => {
  const db = SF.getClient();

  const { data, error } = await db
    .from("admin_notifications")
    .select("id,user_id,event_type,membership_level,phone,message,is_read,created_at,submitted_fbk_code")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const notifications = data || [];
  const unread = notifications.filter(n => !n.is_read).length;

  if (!notifications.length) {
    return `
      <h2>Member notifications</h2>
      <p class="muted">There are currently no notifications.</p>`;
  }

  const userIds = [
    ...new Set(notifications.map(n => n.user_id).filter(Boolean))
  ];

  const { data: profiles, error: profileError } = await db
    .from("profiles")
    .select("id,full_name,email,phone,country,membership_type,account_status")
    .in("id", userIds);

  if (profileError) throw profileError;

  const { data: activations, error: activationError } = await db
    .from("activation_requests")
    .select("id,user_id,full_name,phone,membership_level,status,created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  if (activationError) throw activationError;

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, p])
  );

  const activationMap = new Map();

  (activations || []).forEach(a => {
    if (!activationMap.has(a.user_id)) {
      activationMap.set(a.user_id, a);
    }
  });

  const grouped = new Map();

  notifications.forEach(n => {
    if (!grouped.has(n.user_id)) {
      grouped.set(n.user_id, []);
    }

    grouped.get(n.user_id).push(n);
  });

  const isFBK = n =>
    String(n.event_type || "").toLowerCase().includes("fbk") ||
    Boolean(n.submitted_fbk_code);

  const isMembership = n =>
    !isFBK(n);

  const notificationCard = (n, title, details) => `
    <div style="
      margin:12px 0;
      padding:14px;
      border:1px solid var(--border,#ddd);
      border-radius:10px;
      background:var(--surface,transparent);
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        gap:10px;
        flex-wrap:wrap;
      ">
        <strong>${title}</strong>
        <span class="status-pill">
          ${n.is_read ? "READ" : "UNREAD"}
        </span>
      </div>

      ${details}

      <p class="muted">
        ${SF.adminEscape(
          new Date(n.created_at).toLocaleString()
        )}
      </p>

      <div class="admin-actions">
        ${
          !n.is_read
            ? `<button class="btn btn-gold"
                data-mark-notification="${n.id}">
                Acknowledge notification
              </button>`
            : ""
        }
      </div>
    </div>
  `;

  const memberBoxes = [...grouped.entries()].map(
    ([userId, memberNotifications]) => {

      const p = profileMap.get(userId) || {};
      const activation = activationMap.get(userId) || {};

      const name =
        activation.full_name ||
        p.full_name ||
        "Member";

      const phone =
        activation.phone ||
        p.phone ||
        memberNotifications.find(n => n.phone)?.phone ||
        "Not available";

      const country = p.country || "Not available";

      const membership = [...memberNotifications]
        .filter(isMembership)
        .sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );

      const fbk = [...memberNotifications]
        .filter(isFBK)
        .sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );

      const other = memberNotifications.filter(
        n => !isMembership(n) && !isFBK(n)
      );

      const level =
        activation.membership_level ||
        membership[0]?.membership_level ||
        "Not stated";

      const priceMap = {
        1: 580,
        2: 1000,
        3: 2000,
        4: 4500
      };

      const kesPrice = priceMap[Number(level)];

      const price = kesPrice
        ? "KES " + kesPrice.toLocaleString("en-KE")
        : "Not available";

      const unreadMember = memberNotifications.filter(
        n => !n.is_read
      ).length;

      return `
        <article style="
          margin:18px 0;
          padding:18px;
          border:1px solid var(--border,#ddd);
          border-radius:15px;
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
          ">
            <div>
              <h3 style="margin:0 0 6px">
                ${SF.adminEscape(name)}
              </h3>
              <p class="muted" style="margin:0">
                ${SF.adminEscape(country)} ·
                ${SF.adminEscape(p.email || "")}
              </p>
            </div>

            <span class="status-pill">
              ${unreadMember} unread alert(s)
            </span>
          </div>

          <div style="
            margin-top:15px;
            padding:14px;
            border-radius:10px;
            background:var(--surface,transparent);
          ">
            <strong>MEMBERSHIP REQUEST DETAILS</strong>

            <p><strong>Name:</strong>
              ${SF.adminEscape(name)}
            </p>

            <p><strong>Phone:</strong>
              ${SF.adminEscape(phone)}
            </p>

            <p><strong>Country:</strong>
              ${SF.adminEscape(country)}
            </p>

            <p><strong>Membership level:</strong>
              ${SF.adminEscape(level)}
            </p>

            <p><strong>Package price:</strong>
              ${SF.adminEscape(price)}
            </p>

            ${
              membership.length
                ? membership.map(n =>
                    notificationCard(
                      n,
                      "ALARM 1 — NEW MEMBERSHIP REQUEST",
                      `<p>New membership request received.</p>`
                    )
                  ).join("")
                : `<p class="muted">No membership request notification recorded.</p>`
            }
          </div>

          <div style="
            margin-top:15px;
            padding:14px;
            border:1px solid var(--border,#ddd);
            border-radius:10px;
          ">
            <strong>FBK SUBMISSION DETAILS</strong>

            ${
              fbk.length
                ? fbk.map(n => `
                    <div style="
                      margin-top:12px;
                      padding:12px;
                      border-radius:9px;
                      background:var(--surface,transparent);
                    ">
                      <strong>ALARM 2 — NEW FBK RECEIVED</strong>

                      <p><strong>Member:</strong>
                        ${SF.adminEscape(name)}
                      </p>

                      <p><strong>Phone:</strong>
                        ${SF.adminEscape(phone)}
                      </p>

                      <p style="font-size:18px">
                        <strong>FBK NUMBER:</strong>
                        ${SF.adminEscape(
                          n.submitted_fbk_code || "Not recorded"
                        )}
                      </p>

                      ${n.message
                        ? `<p>${SF.adminEscape(n.message)}</p>`
                        : ""}

                      <p class="muted">
                        ${SF.adminEscape(
                          new Date(n.created_at).toLocaleString()
                        )}
                      </p>

                      <div class="admin-actions">
                        ${
                          !n.is_read
                            ? `<button class="btn btn-gold"
                                data-mark-notification="${n.id}">
                                Acknowledge FBK
                              </button>`
                            : ""
                        }
                      </div>
                    </div>
                  `).join("")
                : `<p class="muted">
                    FBK has not yet been submitted.
                  </p>`
            }
          </div>

          ${
            other.length
              ? `<div style="margin-top:12px">
                  ${other.map(n =>
                    notificationCard(
                      n,
                      "OTHER NOTIFICATION",
                      `<p>${SF.adminEscape(n.message || n.event_type)}</p>`
                    )
                  ).join("")}
                </div>`
              : ""
          }

          <div class="admin-actions" style="margin-top:15px">
            <button class="btn btn-outline"
              data-open-member="${userId}">
              Open member record
            </button>
          </div>

        </article>
      `;
    }
  ).join("");

  return `
    <h2>Member notification centre</h2>
    <p class="muted">
      ${grouped.size} member box(es) ·
      ${notifications.length} notification(s) ·
      ${unread} unread alert(s).
    </p>

    ${memberBoxes}
  `;
};


/* ALL MEMBER DETAILS */

SF.adminMembers = async () => {
  const db = SF.getClient();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id,full_name,username,email,phone,country,education_level,age_confirmed,account_status,referral_code,referred_by,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!profiles?.length) {
    return `<h2>All members</h2><p class="muted">No member profiles found.</p>`;
  }

  const { data: activations, error: activationError } = await db
    .from("activation_requests")
    .select("id,user_id,membership_level,status,created_at")
    .order("created_at", { ascending: false });

  if (activationError) throw activationError;

  const latest = new Map();
  (activations || []).forEach(a => {
    if (!latest.has(a.user_id)) latest.set(a.user_id,a);
  });

  return `
    <h2>All members (${profiles.length})</h2>
    <p class="muted">View member records and edit their profile details and account status.</p>

    ${profiles.map(p => {
      const a = latest.get(p.id) || {};

      return `
        <details class="admin-row" style="display:block;margin:12px 0;padding:15px;">
          <summary style="cursor:pointer;">
            <strong>${SF.adminEscape(p.full_name || "Unnamed member")}</strong>
            <span class="status-pill">${SF.adminEscape(p.account_status || "unknown")}</span>
            <p class="muted">${SF.adminEscape(p.email || "")} · ${SF.adminEscape(p.country || "Country not set")}</p>
          </summary>

          <form data-edit-member="${p.id}" class="form-card" style="margin-top:15px;">
            <label>Full name
              <input name="full_name" value="${SF.adminEscape(p.full_name)}" maxlength="100">
            </label>
            <label>Username
              <input name="username" value="${SF.adminEscape(p.username)}" maxlength="50">
            </label>
            <label>Phone number
              <input name="phone" value="${SF.adminEscape(p.phone)}" maxlength="30">
            </label>
            <label>Country
              <select name="country">
                ${["Kenya","Nigeria","Ghana","Other"].map(c =>
                  `<option value="${c}" ${p.country === c ? "selected" : ""}>${c}</option>`
                ).join("")}
              </select>
            </label>
            <label>Education level
              <input name="education_level" value="${SF.adminEscape(p.education_level)}">
            </label>
            <label>Account status
              <select name="account_status">
                ${["awaiting_activation","approved","rejected","suspended"].map(status =>
                  `<option value="${status}" ${p.account_status === status ? "selected" : ""}>${status}</option>`
                ).join("")}
              </select>
            </label>

            <p><strong>Email:</strong> ${SF.adminEscape(p.email || "Not available")}</p>
            <p><strong>Member ID:</strong> ${SF.adminEscape(p.id)}</p>
            <p><strong>Referral code:</strong> ${SF.adminEscape(p.referral_code || "Not assigned")}</p>
            <p><strong>Referred by:</strong> ${SF.adminEscape(p.referred_by || "None")}</p>
            <p><strong>Membership level:</strong> ${SF.adminEscape(a.membership_level || "Not selected")}</p>
            <p><strong>Activation status:</strong> ${SF.adminEscape(a.status || "No activation request")}</p>
            <p><strong>Joined:</strong> ${SF.adminEscape(p.created_at ? new Date(p.created_at).toLocaleString() : "Unknown")}</p>

            <button class="btn btn-gold" type="submit">Save member changes</button>
          </form>
        </details>`;
    }).join("")}
  `;
};

/* SAVE MEMBER PROFILE */

SF.adminSaveMember = async (form) => {
  const id = form.dataset.editMember;
  const values = Object.fromEntries(new FormData(form).entries());

  const allowedStatuses = ["awaiting_activation","approved","rejected","suspended"];
  if (!allowedStatuses.includes(values.account_status)) {
    throw new Error("Invalid account status.");
  }

  const { error } = await SF.getClient()
    .from("profiles")
    .update({
      full_name: values.full_name.trim(),
      username: values.username.trim() || null,
      phone: values.phone.trim() || null,
      country: values.country,
      education_level: values.education_level.trim() || null,
      account_status: values.account_status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw error;

  SF.showToast("Member details updated.");
  await SF.loadAdmin("members");
};

/* PAYMENT SUBMISSIONS */

SF.adminPayments = async () => {
  const db = SF.getClient();

  const { data, error } = await db
    .from("payment_submissions")
    .select("id,user_id,country,membership_level,payment_provider,payment_reference,payment_link,currency,amount,status,submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  if (!data?.length) {
    return `<h2>Payments</h2><p class="muted">No payment submissions found.</p>`;
  }

  const ids = [...new Set(data.map(x => x.user_id).filter(Boolean))];
  const result = await db.from("profiles")
    .select("id,full_name,email,phone")
    .in("id",ids);

  if (result.error) throw result.error;

  const map = new Map((result.data || []).map(p => [p.id,p]));

  return `
    <h2>Payment submissions (${data.length})</h2>
    ${data.map(x => {
      const p = map.get(x.user_id) || {};
      let link = "";

      try {
        const u = new URL(x.payment_link || "");
        if (u.protocol === "https:" || u.protocol === "http:") {
          link = `<a href="${SF.adminEscape(u.href)}" target="_blank" rel="noopener noreferrer">Open private payment link</a>`;
        }
      } catch {}

      return `
        <div class="admin-row" style="display:block;margin:12px 0;padding:15px;">
          <strong>${SF.adminEscape(p.full_name || "Member")}</strong>
          <p>${SF.adminEscape(p.email || "")} · ${SF.adminEscape(p.phone || "")}</p>
          <p>Country: ${SF.adminEscape(x.country)}</p>
          <p>Level: ${SF.adminEscape(x.membership_level)}</p>
          <p>Amount: ${SF.adminEscape(SF.adminMoney(x.amount,x.currency))}</p>
          <p>Status: ${SF.adminEscape(x.status)}</p>
          <p>${link}</p>
          <p class="muted">${SF.adminEscape(new Date(x.submitted_at).toLocaleString())}</p>
          ${["submitted","under_review"].includes(String(x.status).toLowerCase()) ? `
            <div class="admin-actions">
              <button class="btn btn-gold" data-review-minipay="${x.id}" data-action="approve">Approve payment</button>
              <button class="btn btn-outline" data-review-minipay="${x.id}" data-action="reject">Reject payment</button>
            </div>` : ""}
        </div>`;
    }).join("")}
  `;
};

SF.reviewMiniPay = async (id, action) => {
  const db = SF.getClient();
  const approve = action === "approve";
  let reason = null;

  if (!approve) {
    reason = prompt("Enter the reason for rejecting this payment:");
    if (reason === null) return;
    reason = reason.trim();
    if (!reason) return SF.showToast("A rejection reason is required.");
  }

  if (!confirm(approve
    ? "Have you manually confirmed this payment?"
    : "Reject this payment submission?")) return;

  try {
    const { data: payment, error } = await db
      .from("payment_submissions")
      .select("id,user_id,status")
      .eq("id",id)
      .single();

    if (error) throw error;

    if (!["submitted","under_review"].includes(String(payment.status).toLowerCase())) {
      throw new Error("This payment has already been reviewed.");
    }

    const status = approve ? "approved" : "rejected";

    const update = await db.from("payment_submissions").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: SF.currentUser.id,
      review_reason: reason
    }).eq("id",id);

    if (update.error) throw update.error;

    const profileUpdate = await db.from("profiles")
      .update({account_status: status})
      .eq("id",payment.user_id);

    if (profileUpdate.error) throw profileUpdate.error;

    await db.from("activation_requests")
      .update({status,updated_at:new Date().toISOString()})
      .eq("user_id",payment.user_id);

    SF.showToast(approve ? "Payment approved and member activated." : "Payment rejected.");
    await SF.loadAdmin("payments");

  } catch (error) {
    SF.showToast(error.message);
  }
};

/* FBK SUBMISSIONS */

SF.adminFBK = async () => {
  const db = SF.getClient();

  const { data, error } = await db
    .from("fbk_code_submissions")
    .select("id,user_id,submitted_code,status,admin_note,created_at")
    .in("status",["submitted","reviewed"])
    .order("created_at",{ascending:false});

  if (error) throw error;

  if (!data?.length) {
    return `<h2>FBK review</h2><p class="muted">No FBK submissions awaiting review.</p>`;
  }

  const ids = [...new Set(data.map(x => x.user_id).filter(Boolean))];
  const result = await db.from("profiles")
    .select("id,full_name,email,phone,country")
    .in("id",ids);

  if (result.error) throw result.error;

  const map = new Map((result.data || []).map(p => [p.id,p]));

  return `
    <h2>FBK submissions (${data.length})</h2>
    ${data.map(x => {
      const p = map.get(x.user_id) || {};
      return `
        <div class="admin-row" style="display:block;margin:12px 0;padding:15px;">
          <strong>${SF.adminEscape(p.full_name || "Member")}</strong>
          <p>Phone: ${SF.adminEscape(p.phone || "Not available")}</p>
          <p>Email: ${SF.adminEscape(p.email || "Not available")}</p>
          <p>Country: ${SF.adminEscape(p.country || "Not available")}</p>
          <p>FBK code: <strong>${SF.adminEscape(x.submitted_code)}</strong></p>
          <p>Status: ${SF.adminEscape(x.status)}</p>
          <p class="muted">${SF.adminEscape(new Date(x.created_at).toLocaleString())}</p>
          <div class="admin-actions">
            <button class="btn btn-gold" data-review-fbk="${x.id}" data-action="approve">Approve member</button>
            <button class="btn btn-outline" data-review-fbk="${x.id}" data-action="reject">Reject</button>
          </div>
        </div>`;
    }).join("")}
  `;
};

SF.reviewFBK = async (id, action) => {
  const approve = action === "approve";
  let reason = null;

  if (!approve) {
    reason = prompt("Enter the reason for rejecting this FBK submission:");
    if (reason === null) return;
    reason = reason.trim();
    if (!reason) return SF.showToast("A rejection reason is required.");
  }

  if (!confirm(approve ? "Approve this member?" : "Reject this FBK submission?")) return;

  try {
    const { data, error } = await SF.getClient().rpc("scf_review_fbk_activation",{
      p_submission_id:id,
      p_approve:approve,
      p_admin_note:reason
    });

    if (error) throw error;
    if (data?.success === false) throw new Error(data.message || "Review failed.");

    SF.showToast(approve ? "Member approved." : "FBK submission rejected.");
    await SF.loadAdmin("fbk");
  } catch (error) {
    SF.showToast(error.message);
  }
};

/* PRODUCT REVIEW */

SF.adminProducts = async () => {
  const { data,error } = await SF.getClient()
    .from("sf_products")
    .select("id,title,category,price_usd,status,created_at,supplier_reference,source_type")
    .eq("status","pending")
    .order("created_at",{ascending:true});

  if (error) throw error;

  return `
    <h2>Pending products (${data.length})</h2>
    ${data.length ? data.map(p => `
      <div class="admin-row">
        <div>
          <strong>${SF.adminEscape(p.title)}</strong>
          <p>${SF.adminEscape(p.category)} · ${SF.formatUsd(p.price_usd)}</p>
        </div>
        <div class="admin-actions">
          <button class="btn btn-gold" data-review-product="${p.id}" data-status="approved">Approve</button>
          <button class="btn btn-outline" data-review-product="${p.id}" data-status="rejected">Reject</button>
        </div>
      </div>`).join("") : `<p class="muted">No pending products.</p>`}
  `;
};

SF.reviewProduct = async (id,status) => {
  const { error } = await SF.getClient().from("sf_products").update({
    status,
    reviewed_at:new Date().toISOString(),
    reviewed_by:SF.currentUser.id
  }).eq("id",id);

  if (error) return SF.showToast(error.message);

  SF.showToast("Product " + status + ".");
  SF.loadAdmin("products");
};

/* SALES REVIEW */

SF.adminSales = async () => {
  const { data,error } = await SF.getClient()
    .from("sf_product_sales")
    .select("id,product_id,referrer_id,order_reference,sale_amount_usd,status,created_at")
    .eq("status","pending")
    .order("created_at",{ascending:true});

  if (error) throw error;

  return `
    <h2>Pending sales (${data.length})</h2>
    ${data.length ? data.map(s => `
      <div class="admin-row">
        <div>
          <strong>${SF.adminEscape(s.order_reference)}</strong>
          <p>${SF.formatUsd(s.sale_amount_usd)}</p>
        </div>
        <div class="admin-actions">
          <button class="btn btn-gold" data-review-sale="${s.id}" data-status="verified">Verify</button>
          <button class="btn btn-outline" data-review-sale="${s.id}" data-status="rejected">Reject</button>
        </div>
      </div>`).join("") : `<p class="muted">No pending sales.</p>`}
  `;
};

SF.reviewSale = async (id,status) => {
  const { error } = await SF.getClient().from("sf_product_sales").update({
    status,
    verified_by:SF.currentUser.id,
    verified_at:status === "verified" ? new Date().toISOString() : null
  }).eq("id",id);

  if (error) return SF.showToast(error.message);

  SF.showToast("Sale " + status + ".");
  SF.loadAdmin("sales");
};

/* ADMIN BUTTON ACTIONS */

SF.adminBindActions = box => {
  box.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.addEventListener("click",() => SF.loadAdmin(button.dataset.adminTab));
  });

  box.querySelectorAll("[data-mark-notification]").forEach(button => {
    button.addEventListener("click",async () => {
      const { error } = await SF.getClient()
        .from("admin_notifications")
        .update({is_read:true})
        .eq("id",button.dataset.markNotification);

      if (error) return SF.showToast(error.message);

      SF.showToast("Notification marked as read.");
      SF.loadAdmin("notifications");
    });
  });

  box.querySelectorAll("[data-open-member]").forEach(button => {
    button.addEventListener("click",() => SF.loadAdmin("members"));
  });

  box.querySelectorAll("[data-edit-member]").forEach(form => {
    form.addEventListener("submit",async event => {
      event.preventDefault();
      try {
        await SF.adminSaveMember(form);
      } catch (error) {
        SF.showToast(error.message);
      }
    });
  });

  
  box.querySelectorAll("[data-review-minipay]").forEach(button => {
    button.addEventListener("click", () =>
      SF.reviewMiniPay(
        button.dataset.reviewMinipay,
        button.dataset.action
      )
    );
  });

  box.querySelectorAll("[data-review-fbk]").forEach(button => {
    button.addEventListener("click", () =>
      SF.reviewFBK(
        button.dataset.reviewFbk,
        button.dataset.action
      )
    );
  });

  box.querySelectorAll("[data-review-product]").forEach(button => {
    button.addEventListener("click", () =>
      SF.reviewProduct(
        button.dataset.reviewProduct,
        button.dataset.status
      )
    );
  });

  box.querySelectorAll("[data-review-sale]").forEach(button => {
    button.addEventListener("click", () =>
      SF.reviewSale(
        button.dataset.reviewSale,
        button.dataset.status
      )
    );
  });
};

document.addEventListener("DOMContentLoaded", () => {
  // Admin navigation is generated inside adminContent.
});

