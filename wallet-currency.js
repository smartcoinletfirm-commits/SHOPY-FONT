
(function () {
    "use strict";

    const SF = window.SF;

    if (!SF || !SF.wallet || !SF.supabase) {
        console.warn("SHOPY FONT currency switcher: wallet or Supabase not ready.");
        return;
    }

    if (window.SFWalletCurrencyInstalled) return;
    window.SFWalletCurrencyInstalled = true;

    const STORAGE_KEY = "sf_wallet_display_currency";

    const currencyInfo = {
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
    let walletSnapshot = null;
    let transactionsSnapshot = [];
    let currencySelector = null;
    let originalRender = null;

    function getSupabaseClient() {
        return SF.supabase;
    }

    function getCountryCurrency() {
        const country =
            SF.profile?.country ||
            SF.userProfile?.country ||
            SF.currentUser?.country ||
            "";

        return countryCurrencies[String(country).trim().toLowerCase()] || "USD";
    }

    async function readRates() {
        const client = getSupabaseClient();

        const { data, error } = await client
            .from("sf_currency_rates")
            .select("currency_code, exchange_rate_per_usd, country_name, currency_name")
            .eq("is_active", true);

        if (error) {
            console.error("SHOPY FONT currency rates error:", error);
            return;
        }

        const updatedRates = { USD: 1 };

        (data || []).forEach(function (item) {
            const code = String(item.currency_code || "").toUpperCase();
            const rate = Number(item.exchange_rate_per_usd);

            if (
                currencyInfo[code] &&
                code !== "USD" &&
                Number.isFinite(rate) &&
                rate > 0
            ) {
                updatedRates[code] = rate;
            }
        });

        rates = updatedRates;
    }

    function getAvailableCurrencies() {
        return Object.keys(currencyInfo).filter(function (code) {
            return code === "USD" || Number(rates[code]) > 0;
        });
    }

    function formatAmount(usdAmount) {
        const amount = Number(usdAmount) || 0;
        const info = currencyInfo[selectedCurrency] || currencyInfo.USD;
        const rate = Number(rates[selectedCurrency]) || 1;
        const converted = amount * rate;

        const formatted = new Intl.NumberFormat(info.locale, {
            minimumFractionDigits: info.decimals,
            maximumFractionDigits: info.decimals
        }).format(Math.abs(converted));

        return (converted < 0 ? "-" : "") + info.symbol + formatted;
    }

    function getTransactionSign(transaction) {
        const type = String(transaction.transaction_type || "").toLowerCase();

        const positiveTypes = [
            "earning",
            "earnings",
            "credit",
            "deposit",
            "bonus",
            "reward",
            "commission",
            "referral",
            "refund"
        ];

        return positiveTypes.some(function (item) {
            return type.includes(item);
        }) ? "+" : "-";
    }

    function updateWalletDisplay() {
        if (!walletSnapshot) return;

        const available = Number(walletSnapshot.available_balance_usd) || 0;
        const reserved = Number(walletSnapshot.reserved_balance_usd) || 0;
        const earned = Number(walletSnapshot.total_earned_usd) || 0;
        const withdrawn = Number(walletSnapshot.total_withdrawn_usd) || 0;

        const mainBalance = document.querySelector(".sf-wallet-main strong");
        const stats = document.querySelectorAll(".sf-wallet-stats strong");

        if (mainBalance) {
            mainBalance.textContent = formatAmount(available);
        }

        if (stats.length >= 3) {
            stats[0].textContent = formatAmount(reserved);
            stats[1].textContent = formatAmount(earned);
            stats[2].textContent = formatAmount(withdrawn);
        }

        const transactionElements = document.querySelectorAll(
            ".sf-wallet-transaction"
        );

        transactionElements.forEach(function (element, index) {
            const transaction = transactionsSnapshot[index];
            if (!transaction) return;

            const amountElement = element.querySelector("strong");

            if (amountElement) {
                amountElement.textContent =
                    getTransactionSign(transaction) +
                    formatAmount(Math.abs(Number(transaction.amount_usd) || 0));
            }
        });

        const heading = document.querySelector(".sf-wallet-heading h2");

        if (heading) {
            heading.textContent = "My " + selectedCurrency + " Wallet";
        }

        const note = document.querySelector(".sf-wallet-heading p");

        if (note) {
            note.textContent =
                "Displaying your wallet in " +
                selectedCurrency +
                ". Your actual wallet and transaction records remain in USD.";
        }
    }

    function createCurrencySelector() {
        const heading = document.querySelector(".sf-wallet-heading");
        if (!heading) return;

        let wrapper = heading.querySelector(".sf-wallet-currency-control");

        if (!wrapper) {
            wrapper = document.createElement("label");
            wrapper.className = "sf-wallet-currency-control";

            const label = document.createElement("span");
            label.textContent = "Display currency";

            currencySelector = document.createElement("select");
            currencySelector.id = "sfWalletCurrencySelector";
            currencySelector.setAttribute("aria-label", "Choose wallet display currency");

            wrapper.appendChild(label);
            wrapper.appendChild(currencySelector);
            heading.appendChild(wrapper);
        } else {
            currencySelector = wrapper.querySelector("select");
        }

        const available = getAvailableCurrencies();

        currencySelector.innerHTML = "";

        available.forEach(function (code) {
            const option = document.createElement("option");
            option.value = code;
            option.textContent = code + " — " + currencyInfo[code].name;
            currencySelector.appendChild(option);
        });

        const savedCurrency = localStorage.getItem(STORAGE_KEY);
        const countryCurrency = getCountryCurrency();

        if (savedCurrency && available.includes(savedCurrency)) {
            selectedCurrency = savedCurrency;
        } else if (available.includes(countryCurrency)) {
            selectedCurrency = countryCurrency;
        } else {
            selectedCurrency = "USD";
        }

        currencySelector.value = selectedCurrency;

        currencySelector.onchange = function () {
            const newCurrency = currencySelector.value;

            if (!available.includes(newCurrency)) return;

            selectedCurrency = newCurrency;
            localStorage.setItem(STORAGE_KEY, selectedCurrency);
            updateWalletDisplay();
        };

        addCurrencyStyles();
    }

    function addCurrencyStyles() {
        if (document.getElementById("sf-wallet-currency-styles")) return;

        const style = document.createElement("style");
        style.id = "sf-wallet-currency-styles";

        style.textContent = `
            .sf-wallet-currency-control {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-top: 14px;
                max-width: 260px;
                font-size: 13px;
                font-weight: 600;
            }

            .sf-wallet-currency-control select {
                width: 100%;
                min-height: 42px;
                padding: 9px 12px;
                border: 1px solid #cbd5d1;
                border-radius: 10px;
                background: #ffffff;
                color: #123b2d;
                font-size: 14px;
                outline: none;
            }

            .sf-wallet-currency-control select:focus {
                border-color: #13865c;
                box-shadow: 0 0 0 2px rgba(19, 134, 92, 0.12);
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

    async function refreshCurrencyDisplay() {
        await readRates();
        createCurrencySelector();
        updateWalletDisplay();
    }

    function installWalletWrapper() {
        if (typeof SF.wallet.render !== "function") {
            console.warn("SHOPY FONT currency switcher: wallet render function unavailable.");
            return;
        }

        if (SF.wallet.render.__currencyWrapped) return;

        originalRender = SF.wallet.render;

        const wrappedRender = async function () {
            const result = await originalRender.apply(this, arguments);

            try {
                walletSnapshot = SF.wallet.walletSnapshot || SF.wallet.currentWallet || null;
                transactionsSnapshot =
                    SF.wallet.transactionsSnapshot ||
                    SF.wallet.transactions ||
                    [];

                if (!walletSnapshot) {
                    console.warn(
                        "Currency switcher could not access the wallet snapshot. " +
                        "The wallet display remains unchanged."
                    );
                    return result;
                }

                await refreshCurrencyDisplay();
            } catch (error) {
                console.error("SHOPY FONT currency display error:", error);
            }

            return result;
        };

        wrappedRender.__currencyWrapped = true;
        SF.wallet.render = wrappedRender;
    }

    function start() {
        installWalletWrapper();

        const observer = new MutationObserver(function () {
            if (!currencySelector && walletSnapshot) {
                createCurrencySelector();
                updateWalletDisplay();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.SFWalletCurrency = {
        refresh: refreshCurrencyDisplay,
        getRates: function () {
            return Object.assign({}, rates);
        },
        getSelectedCurrency: function () {
            return selectedCurrency;
        }
    };
})();
       
