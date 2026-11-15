
window.SF = window.SF || {};

/* Current package prices */
const SF_ADMIN_PRICES = {
  1: 500,
  2: 1005,
  3: 2000,
  4: 4500
};

/* Remove the obsolete FBK tab */
SF.adminTabs = () => `
  <div class="admin-actions" style="flex-wrap:wrap;margin-bottom:20px;">
    ${[
      ["notifications","Notifications"],
      ["members","All members"],
      ["payments","Payments"],
      ["products","Products"],
      ["sales","Sales"]
    ].map(([key,label]) => `
      <button class="btn ${SF.adminTab === key ? "btn-gold" : "btn-outline"}"
        data-admin-tab="${key}">${label}</button>
    `).join("")}
  </div>
`;

/* Clean membership notification centre */
SF.adminNotifications = async () => {
  const db = SF.getClient();

  const { data: notifications, error } = await db
    .from("admin_notifications")
    .select("id,user_id,event_type,membership_level,phone,message,is_read,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  if (!notifications?.length) {
    return "<h2>Member notifications</h2><p>No notifications yet.</p>";
  }

  const ids = [...new Set(notifications.map(n => n.user_id).filter(Boolean))];

  const [profileResult, activationResult] = await Promise.all([
    db.from("profiles")
      .select("id,full_name,email,phone,country")
      .in("id", ids),

    db.from("activation_requests")
      .select("id,user_id,full_name,phone,membership_level,status,created_at")
      .in("user_id", ids)
      .order("created_at", { ascending: false })
  ]);

  if (profileResult.error) throw profileResult.error;
  if (activationResult.error) throw activationResult.error;

  const profiles = new Map(
    (profileResult.data || []).map(p => [p.id, p])
  );

  const activations = new Map();

  (activationResult.data || []).forEach(a => {
    if (!activations.has(a.user_id)) {
      activations.set(a.user_id, a);
    }
  });

  const groups = new Map();

  notifications.forEach(n => {
    if (!groups.has(n.user_id)) groups.set(n.user_id, []);
    groups.get(n.user_id).push(n);
  });

  const esc = value => SF.adminEscape(value ?? "—");

  const cards = [...groups.entries()].map(([userId, alerts]) => {
    const p = profiles.get(userId) || {};
    const a = activations.get(userId) || {};

    const name = a.full_name || p.full_name || "Member";
    const phone = a.phone || p.phone || alerts[0]?.phone || "Not available";
    const country = p.country || "Not available";
    const level = Number(a.membership_level || alerts[0]?.membership_level || 0);

    const price = country === "Kenya" && SF_ADMIN_PRICES[level]
      ? "KES " + SF_ADMIN_PRICES[level].toLocaleString("en-KE")
      : "NardoPay checkout price";

    return `
      <article class="admin-row" style="display:block;margin:16px 0;padding:18px;">
        <h3>${esc(name)}</h3>
        <p>${esc(p.email || "")}</p>

        <h4>MEMBERSHIP REQUEST</h4>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
        <p><strong>Country:</strong> ${esc(country)}</p>
        <p><strong>Package:</strong> ${level ? "Level " + level : "Not selected"}</p>
        <p><strong>Package price:</strong> ${esc(price)}</p>

        <h4>NOTIFICATIONS</h4>
        ${alerts.map(n => `
          <div style="padding:12px;margin:10px 0;border:1px solid var(--border,#ddd);border-radius:10px;">
            <strong>${esc(n.event_type || "Membership notification")}</strong>
            <p>${esc(n.message || "New membership activity received.")}</p>
            <p class="muted">${esc(new Date(n.created_at).toLocaleString())}</p>
            ${!n.is_read ? `
              <button class="btn btn-gold" data-mark-notification="${esc(n.id)}">
                Acknowledge
              </button>` : `<span class="status-pill">READ</span>`}
          </div>
        `).join("")}

        <button class="btn btn-outline" data-open-member="${esc(userId)}">
          Open member record
        </button>
      </article>
    `;
  }).join("");

  return `
    <h2>Membership notification centre</h2>
    <p class="muted">${groups.size} member record(s) · ${notifications.length} notification(s).</p>
    ${cards}
  `;
};
      
