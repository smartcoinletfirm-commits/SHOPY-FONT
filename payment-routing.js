window.SF = window.SF || {};

/* =========================================
   SHOPY FONT PAYMENT LINKS
========================================= */

SF.PAYMENT_LINKS = {
  Kenya: {
    1: "https://pay.lipwa.app/p/55fa76e1a",
    2: "https://pay.lipwa.app/p/72bdffab3",
    3: "https://pay.lipwa.app/p/0b41e0e5b",
    4: "https://pay.lipwa.app/p/40cb75768"
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

/* =========================================
   PAYMENT PROOF FORM
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const proofForm = document.getElementById("sfPaymentProofForm");
  const proofButton = document.getElementById("sfOpenPaymentProof");
  const proofWorkspace = document.getElementById("sfPaymentProofWorkspace");
  const proofType = document.getElementById("sfProofType");
  const proofMessage = document.getElementById("sfPaymentProofMessage");

  const receiptField = document.getElementById("sfReceiptField");
  const referenceField = document.getElementById("sfReferenceField");
  const linkField = document.getElementById("sfLinkField");

  const receiptInput = document.getElementById("sfPaymentReceipt");
  const referenceInput = document.getElementById("sfPaymentReference");
  const linkInput = document.getElementById("sfPaymentLink");

  const showProofMessage = (message, isError = false) => {
    if (!proofMessage) return;

    proofMessage.style.color = isError ? "#b42318" : "#237a57";
    proofMessage.textContent = message;
  };

  const toggleEvidenceFields = () => {
    const selected = proofType?.value || "";

    receiptField?.classList.toggle("hidden", selected !== "receipt");
    referenceField?.classList.toggle("hidden", selected !== "reference");
    linkField?.classList.toggle("hidden", selected !== "link");

    if (receiptInput) receiptInput.required = selected === "receipt";
    if (referenceInput) referenceInput.required = selected === "reference";
    if (linkInput) linkInput.required = selected === "link";
  };

  proofType?.addEventListener("change", toggleEvidenceFields);

  proofButton?.addEventListener("click", async () => {
    if (!SF.currentUser) {
      showProofMessage("Please sign in before submitting payment proof.", true);

      if (typeof SF.navigate === "function") {
        SF.setAuthTab?.("login");
        SF.navigate("auth");
      }
      return;
    }

    proofWorkspace?.classList.toggle("hidden");
    showProofMessage("");
  });

  document.getElementById("sfCancelPaymentProof")
    ?.addEventListener("click", () => {
      proofWorkspace?.classList.add("hidden");
      proofForm?.reset();
      toggleEvidenceFields();
      showProofMessage("");
    });

  /* =========================================
     PACKAGE SELECTION
  ========================================= */

  document.querySelectorAll("[data-select-level]").forEach(button => {
    button.addEventListener("click", () => {
      const level = Number(button.dataset.selectLevel);
      const levelInput = document.getElementById("activationLevel");
      const selectedName = document.getElementById("sfSelectedLevel");
      const selectedPrice = document.getElementById("sfSelectedPrice");

      if (!SF.PACKAGE_PRICES[level]) return;

      if (levelInput) levelInput.value = String(level);

      if (selectedName) {
        selectedName.textContent = `Level ${level}`;
      }

      const country =
        document.getElementById("activationCountry")?.value || "";

      const price = SF.getPackagePrice(level, country);

      if (selectedPrice) {
        selectedPrice.textContent = price?.display || "Select your country";
      }

      SF.updatePackagePreview?.();

      document.getElementById("sfRegistrationDetails")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.getElementById("activationCountry")
    ?.addEventListener("change", () => {
      const level = document.getElementById("activationLevel")?.value;
      const selectedPrice = document.getElementById("sfSelectedPrice");

      if (level && selectedPrice) {
        const price = SF.getPackagePrice(level,
          document.getElementById("activationCountry")?.value || "");

        selectedPrice.textContent = price?.display || "Select a package";
      }

      SF.updatePackagePreview?.();
    });

  /* =========================================
     SUBMIT PAYMENT EVIDENCE TO SUPABASE
  ========================================= */

  proofForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = document.getElementById("sfSubmitPaymentProof");

    if (submitButton) submitButton.disabled = true;

    let uploadedPath = null;

    try {
      if (!SF.currentUser) {
        throw new Error("Please sign in again.");
      }

      const db = SF.getClient();
      const userId = SF.currentUser.id;

      let level = Number(
        document.getElementById("activationLevel")?.value || 0
      );

      let country =
        document.getElementById("activationCountry")?.value ||
        SF.profile?.country ||
        "";

      /*
       * If the member returned from checkout and the package
       * selection is no longer on the page, recover the latest
       * activation request for that signed-in member.
       */
      if (!level || !country) {
        const { data: activation, error: activationError } = await db
          .from("activation_requests")
          .select("membership_level")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activationError) throw activationError;

        if (!level) level = Number(activation?.membership_level || 0);
      }

      if (!country && typeof SF.loadProfile === "function") {
        const profile = await SF.loadProfile();
        country = profile?.country || SF.profile?.country || "";
      }

      if (!SF.PACKAGE_PRICES[level]) {
        throw new Error("Choose your membership package before submitting proof.");
      }

      if (!country) {
        throw new Error("Select your country before submitting payment proof.");
      }

      const selectedType = proofType?.value || "";

      if (!["receipt", "reference", "link"].includes(selectedType)) {
        throw new Error("Choose the type of payment evidence you are submitting.");
      }

      let paymentReference = null;
      let paymentLink = null;

      if (selectedType === "receipt") {
        const file = receiptInput?.files?.[0];

        if (!file) {
          throw new Error("Please select your payment receipt.");
        }

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf"
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error("Upload a JPG, PNG, WebP or PDF receipt.");
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Your receipt must not exceed 10 MB.");
        }

        const safeName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(-100);

        const uniquePart = window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

        uploadedPath = `${userId}/${uniquePart}_${safeName}`;

        const { error: uploadError } = await db.storage
          .from("shopy-payment-proofs")
          .upload(uploadedPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;
      }

      if (selectedType === "reference") {
        paymentReference = String(referenceInput?.value || "").trim();

        if (!paymentReference) {
          throw new Error("Enter your payment transaction reference.");
        }
      }

      if (selectedType === "link") {
        paymentLink = String(linkInput?.value || "").trim();

        if (!paymentLink) {
          throw new Error("Enter your shareable payment link.");
        }

        let parsedLink;

        try {
          parsedLink = new URL(paymentLink);
        } catch {
          throw new Error("Enter a valid shareable payment link.");
        }

        if (parsedLink.protocol !== "https:") {
          throw new Error("Your payment link must begin with https://.");
        }
      }

      const provider = country === "Kenya" ? "LIPWA" : "NardoPay";
      const amount = country === "Kenya"
        ? SF.PACKAGE_PRICES[level]
        : null;
      const currency = country === "Kenya" ? "KES" : null;

      const submission = {
        user_id: userId,
        country,
        membership_level: level,
        payment_provider: provider,
        payment_reference: paymentReference,
        proof_path: uploadedPath,
        status: "submitted",
        level: String(level),
        provider,
        reference: paymentReference,
        payment_link: paymentLink,
        currency,
        amount
      };

      const { error: insertError } = await db
        .from("payment_submissions")
        .insert(submission);

      if (insertError) throw insertError;

      proofForm.reset();
      toggleEvidenceFields();

      showProofMessage(
        "Your payment evidence has been submitted successfully. Your account is awaiting manual admin verification."
      );

    } catch (error) {
      console.error("SHOPY FONT payment proof:", error);

      /*
       * If the receipt upload worked but the database insert failed,
       * remove the unused private file.
       */
      if (uploadedPath) {
        try {
          await SF.getClient()
            .storage
            .from("shopy-payment-proofs")
            .remove([uploadedPath]);
        } catch (cleanupError) {
          console.warn("Receipt cleanup needs attention:", cleanupError);
        }
      }

      showProofMessage(
        error.message || "Unable to submit payment evidence. Please try again.",
        true
      );

    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  toggleEvidenceFields();

  /* =========================================
     EXISTING COMMUNITY CHECKOUT
  ========================================= */

  [
    "fbkWorkspace",
    "miniPayWorkspace",
    "communityRequestWorkspace"
  ].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  document.getElementById("communityStartButton")
    ?.addEventListener("click", () => {
      window.location.assign(SF.PAYMENT_LINKS.Community);
    });

  /* =========================================
     EXISTING STANDARD ACTIVATION CHECKOUT
  ========================================= */

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

    card.querySelectorAll(".sf-currency-row").forEach(row => row.remove());
  });

  const activationForm = document.getElementById("activationForm");

  activationForm?.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = activationForm.querySelector('[type="submit"]');
    const message = document.getElementById("activationMessage");

    if (button) button.disabled = true;

    try {
      if (!SF.currentUser) {
        throw new Error("Please sign in again.");
      }

      const fd = new FormData(activationForm);

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

/* =========================================
   PAYMENT PROVIDER PREVIEW
========================================= */

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
