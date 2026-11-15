
window.SF = window.SF || {};

/* =========================================
   SHOPY FONT PAYMENT LINKS
========================================= */

SF.PAYMENT_LINKS = {
  Kenya: {
    1: "https://pay.lipwa.app/p/55fa76e1al1",
    2: "https://pay.lipwa.app/p/72bdffab3l2",
    3: "https://pay.lipwa.app/p/0b41e0e5bl3",
    4: "https://pay.lipwa.app/p/40cb75768level4"
  },

  International: {
    1: "https://shopyfont.nardopay.com/p/accountactivation",
    2: "https://shopyfont.nardopay.com/p/accountactivation-7g0fl2",
    3: "https://shopyfont.nardopay.com/p/accountactivation-ntuyl3",
    4: "https://shopyfont.nardopay.com/p/accountactivation-fpil"
  },

  Community: "https://pay.lipwa.app/p/14078c173"
};

SF.PACKAGE_PRICES = {
  1: 500,
  2: 1005,
  3: 2000,
  4: 4500
};

SF.getPaymentLink = (country, level) => {
  const packageLevel = Number(level);

  if (!SF.PACKAGE_PRICES[packageLevel]) return null;

  const links = country === "Kenya"
    ? SF.PAYMENT_LINKS.Kenya
    : SF.PAYMENT_LINKS.International;

  return links[packageLevel] || null;
};

/* =========================================
   PACKAGE PRICE DISPLAY
========================================= */

SF.getPackagePrice = (level, country) => {
  const amount = SF.PACKAGE_PRICES[Number(level)];

  if (!amount) return null;

  if (country === "Kenya") {
    return {
      amount,
      currency: "KES",
      display: "KES " + amount.toLocaleString("en-KE")
    };
  }

  return {
    amount: null,
    currency: "NARDO",
    display: "Local currency at NardoPay checkout"
  };
};

document.addEventListener("DOMContentLoaded", () => {
  /* Correct the four package cards. */
  const packageNames = [
    "STARTER",
    "GROWTH",
    "PROFESSIONAL",
    "ELITE"
  ];

  document.querySelectorAll(".sf-level-card").forEach((card, index) => {
    const level = index + 1;
    const price = SF.PACKAGE_PRICES[level];

    if (!price) return;

    const name = card.querySelector(".sf-level-label");
    const amount = card.querySelector(".sf-price-main");
    const description = card.querySelector(".sf-level-description");

    if (name) name.textContent = packageNames[index];

    if (amount) {
      amount.textContent = "KES " + price.toLocaleString("en-KE");
    }

    if (description) {
      description.textContent =
        packageNames[index].charAt(0) +
        packageNames[index].slice(1).toLowerCase() +
        " membership package";
    }

    card.querySelectorAll(".sf-currency-row").forEach(row => {
      row.remove();
    });
  });

  /* Hide obsolete FBK and MiniPay workspaces. */
  [
    "fbkWorkspace",
    "miniPayWorkspace",
    "communityRequestWorkspace"
  ].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  /* Community has its own LIPWA payment link. */
  document.getElementById("communityStartButton")
    ?.addEventListener("click", () => {
      window.location.assign(SF.PAYMENT_LINKS.Community);
    });

  const form = document.getElementById("activationForm");

  if (!form) return;

  /*
    Capture the submission before the old FBK/MiniPay
    form handlers can process it.
  */
  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = form.querySelector('[type="submit"]');
    const message = document.getElementById("activationMessage");

    if (button) button.disabled = true;

    try {
      if (!SF.currentUser) {
        throw new Error("Please sign in again.");
      }

      const fd = new FormData(form);

      const fullName = String(fd.get("full_name") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const country = String(fd.get("country") || "").trim();
      const level = Number(fd.get("membership_level"));

      if (!fullName || !phone || !country) {
        throw new Error("Complete your name, phone and country.");
      }

      if (!SF.UN_COUNTRIES?.includes(country)) {
        throw new Error("Please select a valid country.");
      }

      if (!SF.PACKAGE_PRICES[level]) {
        throw new Error("Please select a valid membership package.");
      }

      const paymentLink = SF.getPaymentLink(country, level);

      if (!paymentLink) {
        throw new Error("Payment link unavailable for this package.");
      }

      const db = SF.getClient();

      const { error: profileError } = await db
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          country
        })
        .eq("id", SF.currentUser.id);

      if (profileError) throw profileError;

      const { error: activationError } = await db.rpc(
        "scf_submit_activation",
        {
          p_full_name: fullName,
          p_phone: phone,
          p_membership_level: level
        }
      );

      if (activationError) throw activationError;

      await SF.createAdminNotification(
        "activation_requested",
        null
      );

      await SF.loadProfile();

      if (message) {
        message.style.color = "#237a57";
        message.textContent =
          "Your membership request is saved. Opening secure payment checkout...";
      }

      window.location.assign(paymentLink);

    } catch (error) {
      console.error("SHOPY FONT payment routing:", error);

      if (message) {
        message.style.color = "#b42318";
        message.textContent =
          error.message || "Unable to continue to payment.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  }, true);
});
 
/* SHOW THE CORRECT PAYMENT PROVIDER */
const SF_originalPackagePreview = SF.updatePackagePreview;

SF.updatePackagePreview = () => {
  if (typeof SF_originalPackagePreview === "function") {
    SF_originalPackagePreview();
  }

  const country =
    document.getElementById("activationCountry")?.value || "";

  const level =
    document.getElementById("activationLevel")?.value || "";

  const preview =
    document.getElementById("packagePricePreview");

  if (!preview || !country || !level) return;

  const price = SF.getPackagePrice(level, country);

  if (country === "Kenya") {
    preview.textContent =
      `Level ${level}: ${price.display}. Payment provider: LIPWA.`;
  } else {
    preview.textContent =
      `Level ${level}: Final local-currency amount will be displayed at NardoPay checkout.`;
  }
};

