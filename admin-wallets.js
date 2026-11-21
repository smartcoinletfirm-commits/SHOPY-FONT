
/* =====================================================
   SHOPY FONT — ADMIN WALLET MANAGEMENT
   Add / Deduct / Set available USD balance
   One-time welcome bonus administration
   Wallet adjustment audit history
===================================================== */

window.SF = window.SF || {};

(() => {
  const SF = window.SF;

  if (SF.adminWalletModuleInstalled) return;
  SF.adminWalletModuleInstalled = true;

  const esc = value =>
    SF.adminEscape
      ? SF.adminEscape(value)
      : String(value ?? "");

  const money = value =>
    "$" + Number(value || 0).toFixed(2);

  /* =====================================================
     ADD WALLET TAB
  ===================================================== */

  const originalAdminTabs = SF.adminTabs;

  SF.adminTabs = () => {
    const html = originalAdminTabs();

    return html.replace(
      "</div>",
      `
        <button
          class="btn ${
            SF.adminTab === "wallets"
              ? "btn-gold"
              : "btn-outline"
          }"
          data-admin-tab="wallets">
          Wallets
        </button>
      </div>
      `
    );
  };

  /* =====================================================
     LOAD MEMBER WALLETS
  ===================================================== */

  SF.adminWallets = async () => {
    const db = SF.getClient();

    const [
      membersResult,
      walletsResult,
      claimsResult,
      auditResult
    ] = await Promise.all([

      db.from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone,
          country,
          membership_type,
          account_status,
          role
        `)
        .eq("role", "member")
        .eq("account_status", "approved")
        .order("full_name", { ascending: true })
        .limit(500),

      db.from("sf_usd_wallets")
        .select(`
          user_id,
          available_usd,
          reserved_usd,
          total_earned_usd,
          total_withdrawn_usd
        `),

      db.from("sf_welcome_bonus_claims")
        .select(`
          user_id,
          amount_usd,
          claimed_at
        `),

      db.from("sf_wallet_admin_adjustments")
        .select(`
          id,
          user_id,
          admin_id,
          action,
          amount_usd,
          old_balance_usd,
          new_balance_usd,
          reason,
          created_at
        `)
        .order("created_at", {
          ascending: false
        })
        .limit(50)

    ]);

    for (const result of [
      membersResult,
      walletsResult,
      claimsResult,
      auditResult
    ]) {
      if (result.error) throw result.error;
    }

    const members = membersResult.data || [];

    const wallets = new Map(
      (walletsResult.data || []).map(wallet => [
        wallet.user_id,
        wallet
      ])
    );

    const claims = new Map(
      (claimsResult.data || []).map(claim => [
        claim.user_id,
        claim
      ])
    );

    const audit = auditResult.data || [];

    /* =====================================================
       MEMBER WALLET CARDS
    ===================================================== */

    const cards = members.map(member => {

      const wallet = wallets.get(member.id) || {};

      const claim = claims.get(member.id);

      return `
        <article
          class="admin-row sf-admin-wallet-card"
          style="
            display:block;
            margin:14px 0;
            padding:16px;
            border-radius:14px;
          ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            flex-wrap:wrap;
          ">

            <div>
              <strong>
                ${esc(member.full_name || "Member")}
              </strong>

              <p class="muted">
                ${esc(member.email || "")}
                ·
                ${esc(member.phone || "")}
                ·
                ${esc(member.country || "")}
              </p>

              <small class="muted">
                Member ID: ${esc(member.id)}
              </small>
            </div>

            <div style="text-align:right">

              <strong style="
                font-size:22px;
                color:#176b47;
              ">
                ${money(wallet.available_usd)}
              </strong>

              <p class="muted">
                Available USD
              </p>

            </div>

          </div>

          <div class="sf-wallet-stats"
            style="margin:12px 0;">

            <div>
              <span>Reserved</span>
              <strong>
                ${money(wallet.reserved_usd)}
              </strong>
            </div>

            <div>
              <span>Total earned</span>
              <strong>
                ${money(wallet.total_earned_usd)}
              </strong>
            </div>

            <div>
              <span>Total withdrawn</span>
              <strong>
                ${money(wallet.total_withdrawn_usd)}
              </strong>
            </div>

          </div>

          <form
            data-wallet-adjust="${esc(member.id)}"
            class="form-card"
            style="margin:12px 0;">

            <h3>Adjust available balance</h3>

            <p class="muted">
              Only available USD balance will change.
              Reserved funds and historical totals remain untouched.
            </p>

            <div class="form-grid">

              <label>
                Action

                <select name="action" required>

                  <option value="add">
                    Add funds
                  </option>

                  <option value="deduct">
                    Deduct funds
                  </option>

                  <option value="set">
                    Set exact balance
                  </option>

                </select>
              </label>

              <label>
                Amount (USD)

                <input
                  name="amount_usd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00">
              </label>

              <label class="span-2">
                Reason

                <input
                  name="reason"
                  type="text"
                  minlength="3"
                  maxlength="250"
                  required
                  placeholder="Explain this adjustment">
              </label>

            </div>

            <button
              class="btn btn-gold"
              type="submit">
              Save wallet adjustment
            </button>

          </form>

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            align-items:center;
            flex-wrap:wrap;
          ">

            <div>

              <strong>
                One-time $0.60 welcome bonus
              </strong>

              <p class="muted">
                ${
                  claim
                    ? "Claimed " +
                      esc(
                        new Date(
                          claim.claimed_at
                        ).toLocaleString()
                      )
                    : "Not yet claimed"
                }
              </p>

            </div>

            <button
              class="btn btn-outline"
              type="button"
              data-admin-award-bonus="${esc(member.id)}"
              ${claim ? "disabled" : ""}>

              ${
                claim
                  ? "Already claimed"
                  : "Award $0.60 bonus"
              }

            </button>

          </div>

        </article>
      `;
    }).join("");

    /* =====================================================
       WALLET AUDIT HISTORY
    ===================================================== */

    const auditRows = audit.map(entry => {

      const member = members.find(
        item => item.id === entry.user_id
      );

      return `
        <div
          class="admin-row"
          style="margin:8px 0;padding:12px;">

          <strong>
            ${esc(member?.full_name || entry.user_id)}
          </strong>

          <p>
            ${esc(entry.action.toUpperCase())}
            ·
            ${money(entry.amount_usd)}
          </p>

          <p>
            Old balance:
            ${money(entry.old_balance_usd)}
          </p>

          <p>
            New balance:
            ${money(entry.new_balance_usd)}
          </p>

          <p>
            Reason:
            ${esc(entry.reason)}
          </p>

          <small class="muted">
            ${esc(
              new Date(
                entry.created_at
              ).toLocaleString()
            )}
          </small>

        </div>
      `;
    }).join("");

    return `
      <h2>
        Member wallets (${members.length})
      </h2>

      <p class="muted">
        Manage available USD balances and welcome bonuses.
        All changes are recorded in the audit history.
      </p>

      ${cards || `
        <p class="muted">
          No approved member wallets found.
        </p>
      `}

      <h2 style="margin-top:28px;">
        Recent wallet adjustments
      </h2>

      ${
        auditRows ||
        `<p class="muted">
          No manual wallet adjustments recorded.
        </p>`
      }
    `;
  };

  /* =====================================================
     LOAD ADMIN WALLET TAB
  ===================================================== */

  const originalLoadAdmin = SF.loadAdmin;

  SF.loadAdmin = async function(
    tab = SF.adminTab || "notifications"
  ) {

    if (tab !== "wallets") {
      return originalLoadAdmin.apply(
        this,
        arguments
      );
    }

    const box = document.getElementById(
      "adminContent"
    );

    if (!box) return;

    if (
      !SF.currentUser ||
      !(await SF.checkAdmin())
    ) {
      box.innerHTML = `
        <p>Administrator access is required.</p>
      `;
      return;
    }

    SF.adminTab = "wallets";

    box.innerHTML = `
      <p class="muted">
        Loading wallet controls...
      </p>
    `;

    try {

      box.innerHTML =
        SF.adminTabs() +
        await SF.adminWallets();

      SF.adminBindActions(box);

      /* WALLET ADJUSTMENT FORMS */

      box.querySelectorAll(
        "[data-wallet-adjust]"
      ).forEach(form => {

        form.addEventListener(
          "submit",
          async event => {

            event.preventDefault();

            const button = form.querySelector(
              '[type="submit"]'
            );

            if (button) {
              button.disabled = true;
              button.textContent = "Saving...";
            }

            try {

              const formData = new FormData(form);

              const { data, error } =
                await SF.getClient().rpc(
                  "sf_admin_adjust_usd_wallet",
                  {
                    p_user_id:
                      form.dataset.walletAdjust,

                    p_action:
                      String(
                        formData.get("action")
                      ),

                    p_amount_usd:
                      Number(
                        formData.get("amount_usd")
                      ),

                    p_reason:
                      String(
                        formData.get("reason") || ""
                      ).trim()
                  }
                );

              if (error) throw error;

              if (data?.success === false) {
                throw new Error(
                  data.message ||
                  "Wallet adjustment failed."
                );
              }

              SF.showToast(
                "Wallet updated. New balance: " +
                money(data.new_balance_usd)
              );

              await SF.loadAdmin("wallets");

            } catch (error) {

              SF.showToast(
                error.message ||
                "Wallet adjustment failed."
              );

              if (button) {
                button.disabled = false;
                button.textContent =
                  "Save wallet adjustment";
              }

            }

          }
        );

      });

      /* ADMIN WELCOME BONUS */

      box.querySelectorAll(
        "[data-admin-award-bonus]"
      ).forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            if (!confirm(
              "Award the one-time $0.60 welcome bonus to this member?"
            )) return;

            button.disabled = true;

            try {

              const { data, error } =
                await SF.getClient().rpc(
                  "sf_admin_award_welcome_bonus",
                  {
                    p_user_id:
                      button.dataset.adminAwardBonus
                  }
                );

              if (error) throw error;

              SF.showToast(
                data?.message ||
                "Welcome bonus processed."
              );

              await SF.loadAdmin("wallets");

            } catch (error) {

              SF.showToast(
                error.message ||
                "Unable to award welcome bonus."
              );

              button.disabled = false;

            }

          }
        );

      });

    } catch (error) {

      box.innerHTML =
        SF.adminTabs() +
        `<p class="form-message">
          ${esc(error.message)}
        </p>`;

    }

  };

})();
    
