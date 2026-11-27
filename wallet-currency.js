
(function () {
    "use strict";

    const SF = window.SF;

    if (!SF || !SF.wallet || typeof SF.getClient !== "function") {
        console.error("SHOPY FONT: Wallet or Supabase client is not ready.");
        return;
    }

    if (window.SFWalletCurrencyInstalled) return;
    window.SFWalletCurrencyInstalled = true;

    const STORAGE_KEY = "sf_wallet_display_currency";

    const currencies = {
        USD: { name: "US Dollar", symbol: "$", locale: "en-US", decimals: 2 },
        KES: { name: "Kenyan Shilling", symbol: "KES ", locale: "en-KE", decimals: 2 },
        NGN: { name: "Nigerian Naira", symbol: "₦", locale: "en-NG", decimals: 2 },
        GHS: { name: "Ghanaian Cedi", symbol: "GH₵", locale: "en-GH", decimals: 2 },
        UGX: { name: "Ugandan Shilling", symbol: "UGX ", locale: "en-UG", decimals: 0 },
        TZS: { name: "Tanzanian Shilling", symbol: "TZS ", locale: "en-TZ", decimals: 0 },
        RWF: { name: "Rwandan Franc", symbol: "RWF ", locale: "en-RW", decimals: 0 },
        ZAR: { name: "South African Rand", symbol: "R ", locale: "en-ZA", decimals: 2 },
        ZMW: { name: "Zambian Kwacha", symbol: "ZK ", locale: "en-ZM", decimals: 2 },
        MWK: { name: "Malawian Kwacha", symbol: "MK ", locale: "en-MW", decimals: 2 },
        ETB: { name: "Ethiopian Birr", symbol: "Br ", locale: "am-ET", decimals: 2 }
    };

    const countryCurrencies = {
        kenya: "KES",
        nigeria: "NGN",
        ghana: "GHS",
        uganda: "UGX",
        tanzania: "TZS",
        rwanda: "RWF",
        "south africa": "ZAR",
        zambia: "ZMW",
        malawi: "MWK",
        ethiopia: "ETB"
    };

    let rates = { USD: 1 };
    let selectedCurrency = "USD";
    let walletData = null;
    let transactionData = [];

    function getCountryCurrency() {
        const country = String(SF.profile?.country || "")
            .trim()
            .toLowerCase();

        return countryCurrencies[country] || "USD";
    }

    async function loadRates() {
        const db = SF.getClient();

        const { data, error } = await db
            .from("sf_currency_rates")
            .select("currency_code, exchange_rate_per_usd")
            .eq("is_active", true);

        if (error) {
            console.error("Currency rates could not load:", error);
            return;
        }

        const result = { USD: 1 };

        (data || []).forEach(function (item) {
            const code = String(item.currency_code || "").toUpperCase();
            const rate = Number(item.exchange_rate_per_usd);

            if (currencies[code] && code !== "USD" && rate > 0) {
                result[code] = rate;
            }
        });

        rates = result;
    }

    function availableCurrencies() {
        return Object.keys(currencies).filter(function (code) {
            return code === "USD" || Number(rates[code]) > 0;
        });
    }

    function money(usdAmount) {
        const info = currencies[selectedCurrency] || currencies.USD;
        const rate = Number(rates[selectedCurrency]) || 1;
        const amount = (Number(usdAmount) || 0) * rate;

        const formatted = new Intl.NumberFormat(info.locale, {
            minimumFractionDigits: info.decimals,
            maximumFractionDigits: info.decimals
        }).format(Math.abs(amount));

        return (amount < 0 ? "-" : "") + info.symbol + formatted;
    }

    function addStyles() {
        if (document.getElementById("sf-currency-switcher-style")) return;

        const style = document.createElement("style");
        style.id = "sf-currency-switcher-style";

        style.textContent = `
            .sf-wallet-currency-control {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-top: 12px;
                max-width: 260px;
                font-size: 13px;
                font-weight: 700;
                color: #176b47;
            }

            .sf-wallet-currency-control select {
                width: 100%;
                min-height: 44px;
                padding: 10px 12px;
                border: 1px solid #b8d3c2;
                border-radius: 10px;
                background: #fff;
                color: #173b2e;
                font-size: 14px;
            }

            @media (max-width: 600px) {
                .sf-wallet-currency-control {
                    max-width: 100%;
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createSelector() {
        const heading = document.querySelector(".sf-wallet-heading");
        if (!heading) return;

        const content = heading.querySelector(":scope > div") || heading;

        let wrapper = document.getElementById("sfWalletCurrencyControl");

        if (!wrapper) {
            wrapper = document.createElement("label");
            wrapper.id = "sfWalletCurrencyControl";
            wrapper.className = "sf-wallet-currency-control";

            const label = document.createElement("span");
            label.textContent = "Choose wallet display currency";

            const select = document.createElement("select");
            select.id = "sfWalletCurrencySelector";
            select.setAttribute("aria-label", "Choose wallet display currency");

            wrapper.appendChild(label);
            wrapper.appendChild(select);
            content.appendChild(wrapper);
        }

        const select = wrapper.querySelector("select");
        const available = availableCurrencies();

        select.innerHTML = "";

        available.forEach(function (code) {
            const option = document.createElement("option");
            option.value = code;
            option.textContent = code + " — " + currencies[code].name;
            select.appendChild(option);
        });

        let saved = "";

        try {
            saved = localStorage.getItem(STORAGE_KEY) || "";
        } catch (error) {
            console.warn("Currency preference storage unavailable.");
        }

        if (available.includes(saved)) {
            selectedCurrency = saved;
        } else {
            const countryCurrency = getCountryCurrency();
            selectedCurrency = available.includes(countryCurrency)
                ? countryCurrency
                : "USD";
        }

        select.value = selectedCurrency;

        select.onchange = function () {
            selectedCurrency = select.value;

            try {
                localStorage.setItem(STORAGE_KEY, selectedCurrency);
            } catch (error) {
                console.warn("Could not save currency preference.");
            }

            updateDisplay();
        };

        addStyles();
    }

    function updateDisplay() {
        if (!walletData) return;

        const mainBalance = document.querySelector(".sf-wallet-main strong");
        const stats = document.querySelectorAll(".sf-wallet-stats strong");

        if (mainBalance) {
            mainBalance.textContent = money(walletData.available_usd);
        }

        if (stats.length >= 3) {
            stats[0].textContent = money(walletData.reserved_usd);
            stats[1].textContent = money(walletData.total_earned_usd);
            stats[2].textContent = money(walletData.total_withdrawn_usd);
        }

        const transactionElements = document.querySelectorAll(
            ".sf-wallet-transaction"
        );

        transactionElements.forEach(function (element, index) {
            const transaction = transactionData[index];
            if (!transaction) return;

            const amountElement = element.querySelector(":scope > strong");
            if (!amountElement) return;

            const type = String(transaction.transaction_type || "").toLowerCase();
            const positive = ["earning", "deposit", "credit"].includes(type);

            amountElement.textContent =
                (positive ? "+" : "−") +
                money(Math.abs(Number(transaction.amount_usd) || 0));
        });

        const heading = document.querySelector(".sf-wallet-heading h2");
        if (heading) {
            heading.textContent = "My " + selectedCurrency + " Wallet";
        }

        const note = document.querySelector(".sf-wallet-heading p");
        if (note) {
            note.textContent =
                "Display currency: " + selectedCurrency +
                ". Your actual wallet ledger remains in USD.";
        }

        const symbol = document.querySelector(".sf-wallet-symbol");
        if (symbol) {
            symbol.textContent = currencies[selectedCurrency].symbol.trim();
        }
    }

    async function loadWalletData() {
        if (!SF.currentUser?.id) return;

        const db = SF.getClient();
        const userId = SF.currentUser.id;

        const [walletResult, historyResult] = await Promise.all([
            db.from("sf_usd_wallets")
                .select("available_usd,reserved_usd,total_earned_usd,total_withdrawn_usd")
                .eq("user_id", userId)
                .maybeSingle(),

            db.from("sf_usd_wallet_transactions")
                .select("transaction_type,amount_usd,description,created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(10)
        ]);

        if (walletResult.error) throw walletResult.error;
        if (historyResult.error) throw historyResult.error;

        walletData = walletResult.data;
        transactionData = historyResult.data || [];
    }

    async function refresh() {
        try {
            await loadRates();
            await loadWalletData();

            if (!walletData) return;

            createSelector();
            updateDisplay();
        } catch (error) {
            console.error("SHOPY FONT currency switcher error:", error);
        }
    }

    function install() {
        if (typeof SF.wallet.render !== "function") {
            console.error("SHOPY FONT wallet render function not found.");
            return;
        }

        const originalRender = SF.wallet.render;

        if (originalRender.__currencyWrapped) return;

        const wrappedRender = async function () {
            const result = await originalRender.apply(this, arguments);

            const panel = document.getElementById("sfWalletPanel");

            if (panel && panel.querySelector(".sf-wallet-heading")) {
                await refresh();
            }

            return result;
        };

        wrappedRender.__currencyWrapped = true;
        SF.wallet.render = wrappedRender;
    }

    install();

    window.SFWalletCurrency = {
        refresh: refresh,
        getRates: function () {
            return { ...rates };
        },
        getSelectedCurrency: function () {
            return selectedCurrency;
        }
    };

    console.log("SHOPY FONT currency switcher installed.");
})();
            
