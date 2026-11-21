
/* =====================================================
   SHOPY FONT — WALLET DISPLAY CURRENCY
   USD remains the official wallet ledger.
   Currency selection changes display only.
===================================================== */

window.SF = window.SF || {};

(() => {

  const SF = window.SF;

  if (
    !SF.wallet ||
    SF.wallet.currencyModuleInstalled
  ) return;

  SF.wallet.currencyModuleInstalled = true;

  /* =====================================================
     COUNTRY CURRENCY
  ===================================================== */

  const countryCurrency = country => {

    const value = String(
      country || ""
    ).trim().toLowerCase();

    if (value === "kenya") return "KES";
    if (value === "nigeria") return "NGN";
    if (value === "ghana") return "GHS";

    return "USD";
  };

  const rateKeys = {
    KES: "sf_usd_to_kes_rate",
    NGN: "sf_usd_to_ngn_rate",
    GHS: "sf_usd_to_ghs_rate"
  };

  let rates = {};
  let walletSnapshot = null;

  /* =====================================================
     FORMAT CURRENCY
  ===================================================== */

  const format = (usd, currency) => {

    const original = Number(usd || 0);

    if (currency === "USD") {
      return "$" + original.toFixed(2);
    }

    const rate = Number(
      rates[currency] || 0
    );

    if (!rate || rate <= 0) {
      return "$" + original.toFixed(2);
    }

    const converted = original * rate;

    if (currency === "KES") {
      return "KES " +
        converted.toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
    }

    if (currency === "NGN") {
      return "₦" +
        Math.round(converted).toLocaleString("en-NG");
    }

    if (currency === "GHS") {
      return "GH₵" +
        converted.toLocaleString("en-GH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
    }

    return "$" + original.toFixed(2);
  };

  /* =====================================================
     READ EXCHANGE RATES
  ===================================================== */

  const readRates = async () => {

    const keys = Object.values(rateKeys);

    const { data, error } =
      await SF.getClient()
        .from("platform_settings")
        .select("setting_key,setting_value")
        .in("setting_key", keys);

    if (error) throw error;

    rates = {};

    (data || []).forEach(row => {

      const currency = Object.keys(
        rateKeys
      ).find(
        key =>
          rateKeys[key] === row.setting_key
      );

      const value = Number(
        row.setting_value
      );

      if (
        currency &&
        Number.isFinite(value) &&
        value > 0
      ) {
        rates[currency] = value;
      }

    });

  };

  /* =====================================================
     APPLY SELECTED DISPLAY CURRENCY
  ===================================================== */

  const applyCurrency = currency => {

    if (!walletSnapshot) return;

    if (
      currency !== "USD" &&
      !(Number(rates[currency]) > 0)
    ) {
      currency = "USD";
    }

    const panel = document.getElementById(
      "sfWalletPanel"
    );

    if (!panel) return;

    const wallet = walletSnapshot.wallet;

    const main = panel.querySelector(
      ".sf-wallet-main strong"
    );

    if (main) {
      main.textContent = format(
        wallet.available_usd,
        currency
      );
    }

    const stats = panel.querySelectorAll(
      ".sf-wallet-stats strong"
    );

    const values = [
      wallet.reserved_usd,
      wallet.total_earned_usd,
      wallet.total_withdrawn_usd
    ];

    values.forEach((value, index) => {

      if (stats[index]) {
        stats[index].textContent =
          format(value, currency);
      }

    });

    const transactions =
      panel.querySelectorAll(
        ".sf-wallet-transaction > strong"
      );

    walletSnapshot.transactions.forEach(
      (transaction, index) => {

        if (!transactions[index]) return;

        const type = String(
          transaction.transaction_type || ""
        ).toLowerCase();

        const description = String(
          transaction.description || ""
        ).toLowerCase();

        const positive =
          [
            "earning",
            "deposit",
            "credit"
          ].includes(type) ||
          description.includes("admin wallet add");

        transactions[index].textContent =
          (positive ? "+" : "−") +
          format(
            transaction.amount_usd,
            currency
          );

      }
    );

    const heading = panel.querySelector(
      ".sf-wallet-heading h2"
    );

    if (heading) {
      heading.textContent =
        currency === "USD"
          ? "My USD Wallet"
          : `My ${currency} Wallet`;
    }

    const note = panel.querySelector(
      ".sf-wallet-heading p"
    );

    if (note) {

      note.textContent =
        currency === "USD"
          ? "Your official wallet ledger and withdrawals remain in USD."
          : "Display estimate only. Your official ledger and withdrawals remain in USD.";

    }

    const select = panel.querySelector(
      "#sfWalletCurrency"
    );

    if (select) {
      select.value = currency;
    }

    try {

      localStorage.setItem(
        "sf_wallet_display_currency",
        currency
      );

    } catch {}

  };

  /* =====================================================
     WRAP EXISTING WALLET RENDER
     Preserve original wallet functionality.
  ===================================================== */

  const originalRender = SF.wallet.render;

  SF.wallet.render = async function(...args) {

    const result =
      await originalRender.apply(
        this,
        args
      );

    try {

      if (!SF.currentUser) return result;

      const db = SF.getClient();

      const [
        walletResult,
        historyResult
      ] = await Promise.all([

        db.from("sf_usd_wallets")
          .select(`
            available_usd,
            reserved_usd,
            total_earned_usd,
            total_withdrawn_usd
          `)
          .eq("user_id", SF.currentUser.id)
          .maybeSingle(),

        db.from("sf_usd_wallet_transactions")
          .select(`
            transaction_type,
            amount_usd,
            description,
            created_at
          `)
          .eq("user_id", SF.currentUser.id)
          .order("created_at", {
            ascending: false
          })
          .limit(10)

      ]);

      if (walletResult.error) {
        throw walletResult.error;
      }

      if (historyResult.error) {
        throw historyResult.error;
      }

      if (!walletResult.data) return result;

      walletSnapshot = {
        wallet: walletResult.data,
        transactions: historyResult.data || []
      };

      await readRates();

      const panel = document.getElementById(
        "sfWalletPanel"
      );

      if (!panel) return result;

      const heading = panel.querySelector(
        ".sf-wallet-heading"
      );

      if (!heading) return result;

      let control = panel.querySelector(
        "#sfWalletCurrency"
      );

      if (!control) {

        control = document.createElement(
          "label"
        );

        control.className =
          "sf-wallet-currency-control";

        control.innerHTML = `
          Display currency

          <select
            id="sfWalletCurrency"
            aria-label="Wallet display currency">
          </select>
        `;

        heading.appendChild(control);

      }

      const select = control.querySelector(
        "select"
      );

      const preferred = countryCurrency(
        SF.profile?.country
      );

      const options = ["USD"];

      if (
        preferred !== "USD" &&
        Number(rates[preferred]) > 0
      ) {
        options.push(preferred);
      }

      select.innerHTML = options.map(
        currency => `
          <option value="${currency}">
            ${currency}
          </option>
        `
      ).join("");

      let saved = "USD";

      try {

        saved =
          localStorage.getItem(
            "sf_wallet_display_currency"
          ) || preferred;

      } catch {

        saved = preferred;

      }

      if (!options.includes(saved)) {
        saved = "USD";
      }

      select.value = saved;

      if (!select.dataset.bound) {

        select.dataset.bound = "1";

        select.addEventListener(
          "change",
          () => {
            applyCurrency(select.value);
          }
        );

      }

      applyCurrency(saved);

    } catch (error) {

      console.warn(
        "Wallet currency display unavailable:",
        error.message
      );

    }

    return result;

  };

  /* =====================================================
     CURRENCY SELECTOR STYLES
  ===================================================== */

  const style = document.createElement(
    "style"
  );

  style.textContent = `

    .sf-wallet-currency-control {
      display:flex;
      flex-direction:column;
      gap:6px;
      color:#66756b;
      font-size:11px;
      font-weight:700;
    }

    .sf-wallet-currency-control select {
      min-width:105px;
      padding:9px 11px;
      border:1px solid #dce7de;
      border-radius:9px;
      background:#fff;
      color:#17412e;
      font-weight:700;
    }

    @media(max-width:600px) {

      .sf-wallet-heading {
        align-items:flex-start;
        flex-wrap:wrap;
      }

      .sf-wallet-currency-control {
        width:100%;
      }

      .sf-wallet-currency-control select {
        width:100%;
      }

    }

  `;

  document.head.appendChild(style);

})();
    
