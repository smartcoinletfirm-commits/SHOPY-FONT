
/* =====================================================
   SHOPY FONT — USD MEMBER WALLET
   Emerald design, USD ledger and withdrawal handling
===================================================== */

window.SF = window.SF || {};
const SF = window.SF;

SF.wallet = SF.wallet || { loading: false };

SF.wallet.escape = value =>
  SF.escapeHtml ? SF.escapeHtml(value) : String(value ?? "");

SF.wallet.money = value =>
  "$" + Number(value || 0).toFixed(2);

SF.wallet.showMessage = (message, success = false) => {
  const el = document.getElementById("sfWalletMessage");

  if (!el) {
    if (typeof SF.showToast === "function") SF.showToast(message);
    return;
  }

  el.textContent = message;
  el.style.color = success ? "#237a57" : "#b42318";
};

/* COMMUNITY ACCOUNT CHECK */

SF.wallet.isCommunity = () => {
  const profile = SF.profile || {};
  const type = String(
    profile.membership_type || profile.account_type || ""
  ).toLowerCase();

  return (
    type === "community" ||
    type === "build_community" ||
    profile.is_community === true
  );
};

/* LOAD WALLET */

SF.wallet.render = async () => {
  if (!SF.currentUser || !SF.profile || !SF.getClient) return;

  const profile = SF.profile;

  if (
    profile.role !== "member" ||
    profile.account_status !== "approved"
  ) return;

  const panel = document.getElementById("sfWalletPanel");
  if (!panel) return;

  try {
    const db = SF.getClient();

    const [walletResult, claimResult, historyResult] =
      await Promise.all([
        db.from("sf_usd_wallets")
          .select("available_usd,reserved_usd,total_earned_usd,total_withdrawn_usd")
          .eq("user_id", SF.currentUser.id)
          .maybeSingle(),

        db.from("sf_welcome_bonus_claims")
          .select("id,claimed_at")
          .eq("user_id", SF.currentUser.id)
          .maybeSingle(),

        db.from("sf_usd_wallet_transactions")
          .select("id,transaction_type,amount_usd,description,created_at")
          .eq("user_id", SF.currentUser.id)
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

    if (walletResult.error) throw walletResult.error;
    if (claimResult.error) throw claimResult.error;
    if (historyResult.error) throw historyResult.error;

    const wallet = walletResult.data;
    const claimed = !!claimResult.data;

    if (!wallet) {
      panel.innerHTML = `
        <div class="sf-wallet-empty">
          <h2>USD Wallet</h2>
          <p>Your wallet is being prepared. Please contact support if this continues.</p>
        </div>
      `;
      return;
    }

    const transactions = historyResult.data || [];

    const historyHTML = transactions.length
      ? transactions.map(item => {
          const positive = [
            "earning",
            "deposit",
            "credit"
          ].includes(String(item.transaction_type).toLowerCase());

          return `
            <div class="sf-wallet-transaction">
              <div>
                <strong>${SF.wallet.escape(
                  item.description || item.transaction_type
                )}</strong>
                <small>${new Date(item.created_at).toLocaleString()}</small>
              </div>
              <strong class="${positive ? "sf-wallet-positive" : "sf-wallet-negative"}">
                ${positive ? "+" : "−"}${SF.wallet.money(item.amount_usd)}
              </strong>
            </div>
          `;
        }).join("")
      : `<p class="sf-wallet-muted">No wallet transactions yet.</p>`;

    const isCommunity = SF.wallet.isCommunity();

    panel.innerHTML = `
      <div class="sf-wallet-heading">
        <div>
          <span class="sf-wallet-kicker">SHOPY FONT FINANCIAL CENTRE</span>
          <h2>My USD Wallet</h2>
          <p>All wallet balances and transactions are displayed in USD.</p>
        </div>
        <span class="sf-wallet-symbol">$</span>
      </div>

      <div class="sf-wallet-main">
        <span>AVAILABLE BALANCE</span>
        <strong>${SF.wallet.money(wallet.available_usd)}</strong>
        <small>Available funds in your wallet</small>
      </div>

      <div class="sf-wallet-stats">
        <div>
          <span>Reserved</span>
          <strong>${SF.wallet.money(wallet.reserved_usd)}</strong>
        </div>
        <div>
          <span>Total earned</span>
          <strong>${SF.wallet.money(wallet.total_earned_usd)}</strong>
        </div>
        <div>
          <span>Total withdrawn</span>
          <strong>${SF.wallet.money(wallet.total_withdrawn_usd)}</strong>
        </div>
      </div>

      <div class="sf-wallet-bonus">
        <div>
          <span class="sf-wallet-kicker">MEMBER WELCOME REWARD</span>
          <h3>${claimed ? "Welcome bonus claimed" : "Your $0.60 welcome bonus"}</h3>
          <p>
            ${claimed
              ? "Your one-time welcome bonus has already been credited."
              : "Claim your one-time $0.60 bonus and receive it directly in your USD wallet."}
          </p>
        </div>

        <button
          type="button"
          class="sf-wallet-claim"
          id="sfClaimWelcomeBonus"
          ${claimed ? "disabled" : ""}
        >
          ${claimed ? "Already claimed" : "Claim $0.60"}
        </button>
      </div>

      <div class="sf-wallet-actions">
        <button type="button" class="sf-wallet-withdraw" id="sfOpenWithdraw">
          Withdraw Funds
        </button>

        ${isCommunity ? `
          <button type="button" class="sf-wallet-upgrade" id="sfCommunityUpgrade">
            Upgrade to Full SHOPY FONT
          </button>
        ` : ""}
      </div>

      <div id="sfWalletWithdrawArea" class="hidden" hidden>
        <h3>Request a withdrawal</h3>
        <p class="sf-wallet-muted">
          Minimum withdrawal: KES 1,000 equivalent. Your request will be reviewed by an administrator.
        </p>

        <form id="sfWalletWithdrawForm">
          <label>
            Amount in USD
            <input name="amount_usd" type="number"
              min="0.01" step="0.01" required
              placeholder="Example: 10.00">
          </label>

          <label>
            Payment destination
            <select name="destination_type" required>
              <option value="">Choose destination</option>
              <option value="mobile_money">Mobile money</option>
              <option value="bank">Bank account</option>
            </select>
          </label>

          <label>
            Payment details
            <textarea name="destination_details"
              minlength="5" maxlength="300" required
              placeholder="Enter your account name, number and payment details"></textarea>
          </label>

          <button type="submit" class="sf-wallet-withdraw">
            Submit withdrawal request
          </button>

          <button type="button" class="sf-wallet-cancel" id="sfCancelWithdraw">
            Cancel
          </button>
        </form>
      </div>

      <div class="sf-wallet-history">
        <h3>Recent transactions</h3>
        ${historyHTML}
      </div>

      <p id="sfWalletMessage" role="status"></p>
    `;

    const balance = document.getElementById("walletBalance");
    if (balance) {
      balance.textContent = SF.wallet.money(wallet.available_usd);
    }

    const reserved = document.getElementById("walletReserved");
    if (reserved) {
      reserved.textContent =
        "Reserved: " + SF.wallet.money(wallet.reserved_usd);
    }

    SF.wallet.bindButtons();

  } catch (error) {
    console.error("Wallet loading error:", error);
    SF.showToast(error.message || "Unable to load your USD wallet.");
  }
};

/* DELEGATED WALLET BUTTON EVENTS */

SF.wallet.bindButtons = () => {
  const panel = document.getElementById("sfWalletPanel");
  if (!panel || panel.dataset.walletEventsInstalled === "true") return;

  panel.dataset.walletEventsInstalled = "true";

  panel.addEventListener("click", async event => {
    const button = event.target.closest?.("button");
    if (!button || !panel.contains(button)) return;

    if (button.id === "sfClaimWelcomeBonus") {
      event.preventDefault();
      await SF.wallet.claim({ currentTarget: button });
      return;
    }

    if (button.id === "sfOpenWithdraw") {
      event.preventDefault();

      if (SF.wallet.isCommunity()) {
        SF.wallet.showMessage(
          "Community accounts must upgrade before accessing full withdrawal services."
        );
        return;
      }

      const area = document.getElementById("sfWalletWithdrawArea");

      if (!area) {
        SF.wallet.showMessage(
          "Withdrawal form is unavailable. Please refresh your dashboard."
        );
        return;
      }

      area.hidden = false;
      area.classList.remove("hidden");

      area.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return;
    }

    if (button.id === "sfCancelWithdraw") {
      event.preventDefault();

      const area = document.getElementById("sfWalletWithdrawArea");
      if (area) {
        area.hidden = true;
        area.classList.add("hidden");
      }

      return;
    }

    if (button.id === "sfCommunityUpgrade") {
      event.preventDefault();

      const workspace = document.getElementById("activationWorkspace");
      const details = document.getElementById("sfRegistrationDetails");

      if (workspace && details) {
        workspace.style.display = "";
        details.style.display = "";
        details.classList.remove("hidden");

        details.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } else {
        SF.showToast("Please contact support to upgrade your account.");
      }
    }
  });

  /* CORRECTED WITHDRAWAL FORM SUBMISSION */

  panel.addEventListener("submit", event => {
    if (event.target.id !== "sfWalletWithdrawForm") return;

    event.preventDefault();

    // event.target is the actual submitted form.
    // event.currentTarget would be the wallet panel.
    const form = event.target;

    SF.wallet.requestWithdrawal(form);
  });
};

/* CLAIM WELCOME BONUS */

SF.wallet.claim = async event => {
  const button = event.currentTarget;
  if (!button || button.disabled) return;

  button.disabled = true;
  button.textContent = "Claiming...";

  try {
    const { data, error } = await SF.getClient()
      .rpc("sf_claim_welcome_bonus");

    if (error) throw error;

    SF.showToast(
      data?.message || "Your welcome bonus request was processed."
    );

    await SF.wallet.render();

  } catch (error) {
    SF.wallet.showMessage(
      error.message || "Unable to claim your welcome bonus."
    );

    button.disabled = false;
    button.textContent = "Claim $0.60";
  }
};

/* REQUEST WITHDRAWAL */

SF.wallet.requestWithdrawal = async form => {
  if (!(form instanceof HTMLFormElement)) {
    console.error("Invalid withdrawal form:", form);
    return;
  }

  const button = form.querySelector('[type="submit"]');

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Submitting...";
    }

    const fd = new FormData(form);

    const amount = Number(fd.get("amount_usd"));
    const destinationType = String(fd.get("destination_type") || "");
    const destinationDetails = String(
      fd.get("destination_details") || ""
    ).trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid USD withdrawal amount.");
    }

    if (!destinationType || destinationDetails.length < 5) {
      throw new Error("Complete all payment destination details.");
    }

    const { error } = await SF.getClient().rpc(
      "sf_usd_request_withdrawal",
      {
        p_amount_usd: amount,
        p_destination_type: destinationType,
        p_destination_details: destinationDetails
      }
    );

    if (error) throw error;

    SF.showToast("Your withdrawal request has been submitted.");

    form.reset();

    const area = document.getElementById("sfWalletWithdrawArea");
    if (area) {
      area.hidden = true;
      area.classList.add("hidden");
    }

    await SF.wallet.render();

  } catch (error) {
    console.error("Withdrawal request error:", error);

    SF.wallet.showMessage(
      error.message || "Withdrawal request failed."
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Submit withdrawal request";
    }
  }
};

/* WALLET DESIGN — EMERALD AND WHITE */

SF.wallet.addStyles = () => {
  if (document.getElementById("sfWalletStyles")) return;

  const style = document.createElement("style");
  style.id = "sfWalletStyles";

  style.textContent = `
    .sf-wallet-panel {
      margin:24px 0;
      padding:26px;
      border:1px solid #dcebe1;
      border-radius:18px;
      background:linear-gradient(145deg,#ffffff,#f2f8f4);
      box-shadow:0 15px 38px rgba(18,45,34,.07);
      color:#193629;
    }

    .sf-wallet-heading {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
    }

    .sf-wallet-heading h2 {
      margin:7px 0;
      color:#173b2e;
    }

    .sf-wallet-heading p,
    .sf-wallet-muted {
      color:#758278;
      font-size:13px;
      line-height:1.6;
    }

    .sf-wallet-kicker {
      color:#167347;
      font-size:10px;
      font-weight:800;
      letter-spacing:1.5px;
    }

    .sf-wallet-symbol {
      width:48px;
      height:48px;
      display:grid;
      place-items:center;
      border-radius:14px;
      background:#176b47;
      color:#fff;
      font-size:27px;
      font-weight:800;
    }

    .sf-wallet-main {
      position:relative;
      overflow:hidden;
      margin-top:22px;
      padding:28px;
      border-radius:16px;
      background:linear-gradient(125deg,#0c3022,#176b47);
      color:white;
    }

    .sf-wallet-main:after {
      content:"";
      position:absolute;
      width:180px;
      height:180px;
      right:-55px;
      top:-75px;
      border:1px solid #ffffff30;
      border-radius:50%;
      box-shadow:0 0 0 22px #ffffff0b,0 0 0 45px #ffffff08;
    }

    .sf-wallet-main span,
    .sf-wallet-main small {
      display:block;
      color:#d5eade;
      font-size:11px;
      letter-spacing:1px;
    }

    .sf-wallet-main strong {
      position:relative;
      z-index:1;
      display:block;
      margin:12px 0;
      font-size:clamp(32px,6vw,45px);
      letter-spacing:-1px;
    }

    .sf-wallet-stats {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:10px;
      margin:15px 0;
    }

    .sf-wallet-stats div {
      padding:15px 10px;
      background:white;
      border:1px solid #e5eee7;
      border-radius:12px;
    }

    .sf-wallet-stats span,
    .sf-wallet-stats strong {
      display:block;
    }

    .sf-wallet-stats span {
      color:#7c877f;
      font-size:11px;
    }

    .sf-wallet-stats strong {
      margin-top:7px;
      color:#183d30;
      font-size:15px;
    }

    .sf-wallet-bonus {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
      margin-top:18px;
      padding:19px;
      border:1px solid #dcebe1;
      border-radius:14px;
      background:#f5faf6;
    }

    .sf-wallet-bonus h3 {
      margin:7px 0;
      color:#173b2e;
    }

    .sf-wallet-bonus p {
      margin:0;
      color:#778176;
      font-size:12px;
      line-height:1.6;
    }

    .sf-wallet-claim,
    .sf-wallet-withdraw,
    .sf-wallet-upgrade {
      border:0;
      border-radius:9px;
      padding:13px 17px;
      font-weight:800;
      cursor:pointer;
    }

    .sf-wallet-claim,
    .sf-wallet-withdraw {
      background:#176b47;
      color:white;
    }

    .sf-wallet-claim:disabled {
      opacity:.6;
      cursor:default;
    }

    .sf-wallet-actions {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:16px;
    }

    .sf-wallet-upgrade {
      background:#e8f4eb;
      color:#176b47;
      border:1px solid #cfe5d5;
    }

    #sfWalletWithdrawArea {
      margin-top:20px;
      padding:20px;
      border:1px solid #e3e8e1;
      border-radius:13px;
      background:white;
    }

    #sfWalletWithdrawArea[hidden] {
      display:none !important;
    }

    #sfWalletWithdrawArea label {
      display:block;
      margin:13px 0;
      color:#34483d;
      font-size:12px;
      font-weight:700;
    }

    #sfWalletWithdrawArea input,
    #sfWalletWithdrawArea select,
    #sfWalletWithdrawArea textarea {
      display:block;
      width:100%;
      margin-top:7px;
      padding:12px;
      border:1px solid #dce3dc;
      border-radius:8px;
      background:white;
      color:#193629;
    }

    .sf-wallet-cancel {
      margin-left:10px;
      padding:12px;
      border:0;
      background:#eef4ef;
      color:#315642;
      border-radius:8px;
      cursor:pointer;
    }

    .sf-wallet-history {
      margin-top:25px;
    }

    .sf-wallet-history h3 {
      color:#173b2e;
    }

    .sf-wallet-transaction {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      padding:13px 0;
      border-bottom:1px solid #edf0eb;
    }

    .sf-wallet-transaction strong,
    .sf-wallet-transaction small {
      display:block;
    }

    .sf-wallet-transaction strong {
      font-size:12px;
    }

    .sf-wallet-transaction small {
      margin-top:5px;
      color:#89928a;
      font-size:10px;
    }

    .sf-wallet-positive { color:#237a57; }
    .sf-wallet-negative { color:#b42318; }

    @media(max-width:600px) {
      .sf-wallet-panel { padding:17px; }

      .sf-wallet-bonus {
        align-items:flex-start;
        flex-direction:column;
      }

      .sf-wallet-stats { gap:6px; }
      .sf-wallet-stats div { padding:11px 7px; }
      .sf-wallet-stats strong { font-size:12px; }
      .sf-wallet-actions button { width:100%; }
    }
  `;

  document.head.appendChild(style);
};

/* INSERT WALLET INTO DASHBOARD */

SF.wallet.mount = () => {
  const dashboard = document.getElementById("approvedDashboard");
  if (!dashboard) return;

  let panel = document.getElementById("sfWalletPanel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "sfWalletPanel";
    panel.className = "sf-wallet-panel";

    const grid = dashboard.querySelector(".dashboard-grid");

    if (grid) {
      dashboard.insertBefore(panel, grid);
    } else {
      dashboard.appendChild(panel);
    }
  }
};

/* WRAP DASHBOARD LOADER SAFELY */

if (!SF.wallet.dashboardWrapperInstalled) {
  const previousLoadDashboard = SF.loadDashboard;

  SF.loadDashboard = async function (...args) {
    const result = typeof previousLoadDashboard === "function"
      ? await previousLoadDashboard.apply(this, args)
      : undefined;

    SF.wallet.addStyles();
    SF.wallet.mount();

    if (SF.profile?.account_status === "approved") {
      await SF.wallet.render();
    }

    return result;
  };

  SF.wallet.dashboardWrapperInstalled = true;
}

document.addEventListener("DOMContentLoaded", () => {
  SF.wallet.addStyles();
  SF.wallet.mount();
});
                         
