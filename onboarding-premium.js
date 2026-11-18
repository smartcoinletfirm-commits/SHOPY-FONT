
/* =========================================================
   SHOPY FONT — PREMIUM REGISTRATION & ACTIVATION
   Visual enhancement only. Preserves existing business logic.
========================================================= */

(() => {
  "use strict";

  const SF = window.SF = window.SF || {};

  if (SF.onboardingPremiumInstalled) return;
  SF.onboardingPremiumInstalled = true;

  const css = `
  /* AUTHENTICATION */
  #authView {
    min-height: 75vh;
    padding: 45px 18px;
    background:
      radial-gradient(circle at 5% 5%,#e9edf9,transparent 35%),
      #f5f7fb;
  }

  #authView .auth-shell {
    max-width: 1050px;
    margin: 20px auto;
    padding: 0;
    gap: 0;
    overflow: hidden;
    border-radius: 23px;
    background: white;
    box-shadow: 0 25px 70px rgba(16,29,54,.12);
    border: 1px solid #e8ebf2;
  }

  #authView .auth-aside {
    min-height: 570px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 50px;
    border-radius: 0;
    background:
      radial-gradient(circle at 90% 15%,#405d89,transparent 38%),
      linear-gradient(145deg,#101d36,#1c3558);
  }

  #authView .auth-aside .brand-mark {
    width: 58px;
    height: 58px;
    border-radius: 17px;
    font-size: 18px;
    margin-bottom: 40px;
  }

  #authView .auth-aside h2 {
    font-size: clamp(31px,4vw,43px);
    line-height: 1.15;
    letter-spacing: -1px;
  }

  #authView .auth-aside p:not(.eyebrow) {
    font-size: 14px;
    line-height: 1.9;
  }

  #authView .auth-panel {
    padding: clamp(25px,4vw,48px);
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  #authView .auth-tabs {
    padding: 5px;
    border-radius: 12px;
    background: #f1f3f8;
  }

  #authView .auth-tab {
    flex: 1;
    padding: 13px;
    border-radius: 9px;
    background: transparent;
    color: #66728a;
  }

  #authView .auth-tab.active {
    background: #172b49;
    color: white;
    box-shadow: 0 4px 12px #172b4925;
  }

  #authView .auth-form h2 {
    color: #17243a;
    font: 800 27px Manrope,sans-serif;
    margin: 25px 0 8px;
  }

  #authView .auth-form > .muted {
    font-size: 13px;
    margin-bottom: 23px;
  }

  #authView .auth-form label {
    display: block;
    margin: 19px 0;
    color: #34445c;
    font-size: 12px;
    font-weight: 800;
  }

  #authView .auth-form input,
  #authView .auth-form select {
    width: 100%;
    margin-top: 8px;
    padding: 14px;
    border: 1px solid #e0e5ee;
    border-radius: 10px;
    background: #fbfcfe;
    color: #17243a;
    outline: none;
  }

  #authView .auth-form input:focus,
  #authView .auth-form select:focus {
    border-color: #7d8fd0;
    background: white;
    box-shadow: 0 0 0 4px #7185dc18;
  }

  #authView .auth-form .btn-full {
    min-height: 49px;
    margin-top: 13px;
    border-radius: 10px;
    background: linear-gradient(120deg,#263e7d,#586ed0);
    color: white;
    box-shadow: 0 7px 18px #344d9b25;
  }

  #authMessage {
    padding: 10px 0;
    line-height: 1.6;
    font-size: 12px;
  }

  /* ACTIVATION WORKSPACE */
  #activationWorkspace {
    max-width: 1120px;
    margin: 20px auto 40px;
    padding: 28px;
    border: 1px solid #e8ebf2;
    border-radius: 22px;
    background: white;
    box-shadow: 0 12px 38px rgba(16,29,54,.055);
  }

  #activationWorkspace .sf-activation-heading {
    padding: 28px;
    margin-bottom: 25px;
    border-radius: 17px;
    color: white;
    background:
      radial-gradient(circle at 90% 0%,#405b8b,transparent 40%),
      linear-gradient(120deg,#101d36,#203858);
  }

  #activationWorkspace .sf-activation-heading .sf-kicker {
    color: #e1c17f;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 2px;
  }

  #activationWorkspace .sf-activation-heading h2 {
    color: white;
    font: 800 clamp(27px,4vw,37px)/1.2 Manrope,sans-serif;
    margin: 12px 0;
  }

  #activationWorkspace .sf-activation-heading h2 em {
    color: #e1c17f;
  }

  #activationWorkspace .sf-activation-heading p {
    color: #cbd5e3;
    line-height: 1.8;
    font-size: 13px;
  }

  /* PROGRESS */
  #activationWorkspace .sf-progress {
    padding: 18px;
    border: 1px solid #e9edf4;
    border-radius: 14px;
    background: #fafbfe;
  }

  #activationWorkspace .sf-progress-step span {
    background: #e9edf8;
    color: #3c5195;
    font-weight: 900;
  }

  #activationWorkspace .sf-progress-step.active span {
    background: #344d9b;
    color: white;
  }

  #activationWorkspace .sf-progress-step strong {
    color: #24324c;
    font-size: 12px;
  }

  #activationWorkspace .sf-progress-step small {
    color: #8792a6;
  }

  #activationWorkspace .sf-progress-line {
    background: #dce2ed;
  }

  /* PACKAGE CARDS */
  #activationWorkspace .sf-package-intro {
    margin: 32px 0 17px;
  }

  #activationWorkspace .sf-package-intro h3 {
    color: #17243a;
    font: 800 22px Manrope,sans-serif;
    margin: 7px 0;
  }

  #activationWorkspace .sf-package-intro p {
    color: #8792a6;
    font-size: 12px;
  }

  #activationWorkspace .sf-level-grid {
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 14px;
  }

  #activationWorkspace .sf-level-card {
    position: relative;
    padding: 21px 17px;
    border: 1px solid #e3e8f1;
    border-radius: 16px;
    background: linear-gradient(160deg,#fff,#fafbfe);
    box-shadow: 0 6px 18px #17243a07;
    transition: .2s ease;
  }

  #activationWorkspace .sf-level-card:hover {
    transform: translateY(-4px);
    border-color: #9caadd;
    box-shadow: 0 13px 28px #344d9b15;
  }

  #activationWorkspace .sf-level-premium {
    border-color: #d7bd83;
    background: linear-gradient(155deg,#fffdf7,#f9f4e8);
  }

  #activationWorkspace .sf-level-number {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    color: #40549b;
    background: #edf0fb;
    font-weight: 900;
    font-size: 11px;
  }

  #activationWorkspace .sf-level-label {
    color: #9a793e;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  #activationWorkspace .sf-level-card h3 {
    color: #17243a;
    font: 800 20px Manrope,sans-serif;
    margin: 22px 0 7px;
  }

  #activationWorkspace .sf-level-description {
    min-height: 35px;
    color: #8792a6;
    font-size: 11px;
    line-height: 1.5;
  }

  #activationWorkspace .sf-price-main {
    color: #293f7e;
    font: 800 24px Manrope,sans-serif;
    margin: 20px 0;
  }

  #activationWorkspace .sf-price-divider {
    height: 1px;
    background: #e8ebf1;
  }

  #activationWorkspace .sf-currency-row {
    display: flex;
    justify-content: space-between;
    gap: 5px;
    margin-top: 12px;
    color: #7c879a;
    font-size: 10px;
  }

  #activationWorkspace .sf-currency-row strong {
    color: #354a83;
  }

  #activationWorkspace .sf-level-button {
    width: 100%;
    min-height: 42px;
    margin-top: 22px;
    border: 1px solid #dbe1f0;
    border-radius: 9px;
    background: #f1f3fb;
    color: #344b91;
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
  }

  #activationWorkspace .sf-level-button:hover {
    background: #344d9b;
    color: white;
  }

  /* SELECTED PACKAGE AND FORM */
  #sfRegistrationDetails {
    margin-top: 28px;
    padding: 23px;
    border: 1px solid #e6eaf2;
    border-radius: 16px;
    background: #fafbfe;
  }

  #sfRegistrationDetails .sf-selected-package {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e3e8f2;
    border-radius: 12px;
    background: white;
  }

  #sfRegistrationDetails .sf-selected-package small {
    display: block;
    color: #9a793e;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  #sfRegistrationDetails .sf-selected-package strong {
    display: block;
    margin-top: 5px;
    color: #17243a;
    font: 800 17px Manrope,sans-serif;
  }

  #sfRegistrationDetails #sfSelectedPrice {
    color: #344d9b;
    font-weight: 900;
  }

  #sfRegistrationDetails .sf-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
  }

  #sfRegistrationDetails label {
    display: block;
    color: #43516c;
    font-size: 11px;
    font-weight: 900;
  }

  #sfRegistrationDetails input,
  #sfRegistrationDetails select {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 13px;
    border: 1px solid #dfe5ef;
    border-radius: 9px;
    background: white;
    color: #17243a;
  }

  #sfRegistrationDetails .sf-form-wide {
    grid-column: 1/-1;
  }

  #packagePricePreview {
    margin: 17px 0;
    padding: 14px;
    border: 1px solid #e5e9f3;
    border-radius: 10px;
    background: #f0f3fb;
    color: #40538e;
    font-size: 12px;
    line-height: 1.7;
  }

  #activationWorkspace .sf-continue-button {
    width: 100%;
    min-height: 52px;
    border: 0;
    border-radius: 10px;
    color: white;
    background: linear-gradient(120deg,#253d83,#5c70d1);
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 7px 18px #344d9b25;
  }

  #activationWorkspace .sf-secure-note {
    text-align: center;
    color: #8792a6;
    font-size: 10px;
  }

  /* COMMUNITY */
  #communityEntryCard {
    border-radius: 16px !important;
    border-color: #e2d4b5 !important;
    background: linear-gradient(120deg,#fffdf7,#fff) !important;
  }

  #communityEntryCard h2 {
    color: #17243a;
    font-family: Manrope,sans-serif;
  }

  /* PAYMENT PROOF */
  #sfPaymentProofEntry {
    max-width: 1120px;
    margin: 22px auto;
    padding: 24px;
    border: 1px solid #e4e9f2;
    border-radius: 17px;
    background: white;
    box-shadow: 0 8px 25px #17243a08;
  }

  #sfPaymentProofEntry h3 {
    color: #17243a;
    font: 800 20px Manrope,sans-serif;
  }

  #sfPaymentProofEntry p {
    color: #77849a;
    font-size: 12px;
    line-height: 1.8;
  }

  #sfPaymentProofWorkspace {
    margin-top: 20px;
    padding: 22px;
    border: 1px solid #e5eaf2;
    border-radius: 14px;
    background: #fafbfe;
  }

  #sfPaymentProofWorkspace label {
    display: block;
    margin: 15px 0;
    color: #43516c;
    font-size: 12px;
    font-weight: 800;
  }

  #sfPaymentProofWorkspace input,
  #sfPaymentProofWorkspace select {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 13px;
    border: 1px solid #dfe5ef;
    border-radius: 9px;
    background: white;
  }

  /* REVIEW AND REJECTION */
  #reviewWorkspace,
  #rejectedWorkspace {
    max-width: 950px;
    margin: 35px auto;
    padding: 35px;
    border: 1px solid #e6eaf2;
    border-radius: 19px;
    background: white;
    box-shadow: 0 12px 35px #17243a0a;
  }

  #reviewWorkspace {
    border-top: 4px solid #d5a84e;
  }

  #rejectedWorkspace {
    border-top: 4px solid #cf6262;
    background: linear-gradient(145deg,#fff,#fffafa);
  }

  #reviewWorkspace h2,
  #rejectedWorkspace h2 {
    color: #17243a;
    font: 800 26px Manrope,sans-serif;
  }

  #reviewDetails,
  #rejectionDetails {
    color: #65738b;
    font-size: 14px;
    line-height: 1.9;
  }

  #activationMessage,
  #sfPaymentProofMessage {
    line-height: 1.7;
    font-size: 12px;
  }

  @media(max-width:850px) {
    #activationWorkspace .sf-level-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    #authView .auth-aside {
      min-height: 360px;
      padding: 35px;
    }
  }

  @media(max-width:650px) {
    #authView {
      padding: 20px 10px;
    }

    #authView .auth-shell {
      grid-template-columns: 1fr;
      border-radius: 17px;
    }

    #authView .auth-aside {
      min-height: auto;
      padding: 28px;
    }

    #authView .auth-aside .brand-mark {
      margin-bottom: 20px;
    }

    #authView .auth-aside h2 {
      font-size: 30px;
    }

    #authView .auth-panel {
      padding: 23px;
    }

    #activationWorkspace {
      margin: 10px;
      padding: 13px;
      border-radius: 16px;
    }

    #activationWorkspace .sf-activation-heading {
      padding: 22px;
    }

    #activationWorkspace .sf-level-grid {
      gap: 9px;
    }

    #activationWorkspace .sf-level-card {
      padding: 14px 11px;
    }

    #activationWorkspace .sf-level-card h3 {
      font-size: 17px;
    }

    #activationWorkspace .sf-price-main {
      font-size: 19px;
    }

    #activationWorkspace .sf-progress {
      padding: 11px;
    }

    #activationWorkspace .sf-progress-step strong {
      font-size: 10px;
    }

    #activationWorkspace .sf-progress-step small {
      font-size: 9px;
    }

    #sfRegistrationDetails {
      padding: 14px;
    }

    #sfRegistrationDetails .sf-form-grid {
      grid-template-columns: 1fr;
    }

    #sfRegistrationDetails .sf-form-wide {
      grid-column: auto;
    }

    #sfPaymentProofEntry {
      margin: 12px 10px;
      padding: 17px;
    }

    #reviewWorkspace,
    #rejectedWorkspace {
      margin: 18px 10px;
      padding: 22px;
    }
  }
  `;

  const style = document.createElement("style");
  style.id = "sf-onboarding-premium-style";
  style.textContent = css;
  document.head.appendChild(style);

  /* Improve headings without changing form behavior. */
  function polish() {
    const loginTitle = document.querySelector("#loginForm h2");
    if (loginTitle) loginTitle.textContent = "Welcome back";

    const registerTitle = document.querySelector("#registerForm h2");
    if (registerTitle) registerTitle.textContent = "Create your account";

    const aside = document.querySelector("#authView .auth-aside");
    if (aside && !aside.querySelector(".sf-auth-tagline")) {
      const tagline = document.createElement("p");
      tagline.className = "sf-auth-tagline";
      tagline.textContent =
        "THE WORLD CONNECTED THROUGH OPPORTUNITY";
      tagline.style.cssText =
        "color:#dfbd7a;font-size:10px;font-weight:900;letter-spacing:1.7px;margin-top:25px;";
      aside.appendChild(tagline);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", polish);
  } else {
    polish();
  }

})();
  
