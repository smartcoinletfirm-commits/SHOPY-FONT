
/* =========================================================
   SHOPY FONT — PUBLIC WELCOME PAGE
   IMPORTANT: app.js controls which .view is visible.
   This file must NEVER force #homeView to display:block.
========================================================= */

(() => {
  "use strict";

  const SF = window.SF = window.SF || {};

  /* =====================================================
     HOMEPAGE STYLES
  ===================================================== */

  const css = `
    /* Do not set display here.
       style.css controls .view and .view.active. */
    #homeView.sf-public-home {
      padding:0;
      background:#f6faf7;
      color:#193629;
    }

    #homeView.sf-public-home * {
      box-sizing:border-box;
    }

    #homeView .sf-home-hero {
      display:grid;
      grid-template-columns:1fr;
      gap:30px;
      padding:76px max(calc((100vw - 1180px)/2),6%);
      color:white;
      background:
        radial-gradient(circle at 85% 15%,#287d55 0,transparent 34%),
        linear-gradient(120deg,#0c3022,#125238 65%,#176b47);
    }

    #homeView .sf-home-eyebrow {
      margin:0 0 15px;
      color:#a8e2bd;
      font-size:10px;
      font-weight:900;
      letter-spacing:2px;
    }

    #homeView .sf-home-hero h1 {
      max-width:760px;
      margin:0;
      color:white;
      font:800 clamp(39px,5.5vw,68px)/1.1 Manrope,sans-serif;
      letter-spacing:-2px;
    }

    #homeView .sf-home-hero h1 em {
      color:#a8e2bd;
      font-style:normal;
    }

    #homeView .sf-home-lead {
      max-width:720px;
      margin:23px 0;
      color:#d9eee1;
      font-size:15px;
      line-height:1.9;
    }

    #homeView .sf-home-actions {
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin-top:25px;
    }

    #homeView .sf-home-actions button {
      min-height:49px;
      padding:0 23px;
      border-radius:9px;
      font-weight:800;
      cursor:pointer;
    }

    #homeView .sf-home-join {
      border:1px solid #fff;
      background:#fff;
      color:#125238;
    }

    #homeView .sf-home-login {
      border:1px solid #ffffff80;
      background:transparent;
      color:white;
    }

    #homeView .sf-home-proof {
      display:flex;
      flex-wrap:wrap;
      gap:19px;
      margin-top:30px;
      color:#d5eadc;
      font-size:11px;
    }

    #homeView .sf-home-slider-section {
      max-width:1180px;
      margin:0 auto;
      padding:55px 22px 20px;
    }

    #homeView .sf-home-slider {
      position:relative;
      height:390px;
      overflow:hidden;
      border-radius:20px;
      background:#123b2a;
      box-shadow:0 18px 45px #153e281c;
    }

    #homeView .sf-home-slide {
      position:absolute;
      inset:0;
      opacity:0;
      visibility:hidden;
      transition:opacity .8s ease,visibility .8s ease;
    }

    #homeView .sf-home-slide.active {
      opacity:1;
      visibility:visible;
    }

    #homeView .sf-home-slide img {
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }

    #homeView .sf-home-slide:after {
      content:"";
      position:absolute;
      inset:0;
      background:linear-gradient(
        90deg,
        rgba(5,35,23,.88),
        rgba(5,35,23,.30) 75%
      );
    }

    #homeView .sf-home-slide-copy {
      position:absolute;
      z-index:2;
      left:7%;
      bottom:14%;
      max-width:570px;
      color:white;
    }

    #homeView .sf-home-slide-copy small {
      color:#b8ebca;
      font-size:10px;
      font-weight:900;
      letter-spacing:2px;
    }

    #homeView .sf-home-slide-copy h2 {
      margin:12px 0;
      color:white;
      font:800 clamp(27px,4vw,43px)/1.15 Manrope,sans-serif;
    }

    #homeView .sf-home-slide-copy p {
      color:#e1eee5;
      font-size:14px;
      line-height:1.7;
    }

    #homeView .sf-home-slider-controls {
      position:absolute;
      z-index:4;
      right:20px;
      bottom:20px;
      display:flex;
      gap:9px;
    }

    #homeView .sf-home-slider-controls button {
      width:40px;
      height:40px;
      border:1px solid #ffffff80;
      border-radius:50%;
      background:#103d2c;
      color:white;
      cursor:pointer;
    }

    #homeView .sf-home-dots {
      position:absolute;
      z-index:4;
      top:20px;
      right:20px;
      display:flex;
      gap:8px;
    }

    #homeView .sf-home-dot {
      width:9px;
      height:9px;
      padding:0;
      border:0;
      border-radius:20px;
      background:#ffffff80;
      cursor:pointer;
    }

    #homeView .sf-home-dot.active {
      width:25px;
      background:white;
    }

    #homeView .sf-home-section {
      max-width:1180px;
      margin:auto;
      padding:65px 22px;
    }

    #homeView .sf-home-section-heading {
      max-width:700px;
      margin:0 auto 35px;
      text-align:center;
    }

    #homeView .sf-home-section-heading h2 {
      margin:0 0 12px;
      color:#173e2c;
      font:800 clamp(27px,3.5vw,38px)/1.2 Manrope,sans-serif;
    }

    #homeView .sf-home-section-heading p {
      color:#687d70;
      font-size:14px;
      line-height:1.8;
    }

    #homeView .sf-home-services {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:20px;
    }

    #homeView .sf-home-service {
      overflow:hidden;
      border:1px solid #e0ebe3;
      border-radius:15px;
      background:white;
      box-shadow:0 8px 25px #123d2810;
    }

    #homeView .sf-home-service img {
      display:block;
      width:100%;
      height:205px;
      object-fit:cover;
    }

    #homeView .sf-home-service-content {
      padding:22px;
    }

    #homeView .sf-home-service h3 {
      margin:0 0 10px;
      color:#17462f;
      font:800 19px Manrope,sans-serif;
    }

    #homeView .sf-home-service p {
      min-height:65px;
      color:#718176;
      font-size:13px;
      line-height:1.8;
    }

    #homeView .sf-home-service button {
      border:0;
      padding:0;
      background:transparent;
      color:#167347;
      font-size:12px;
      font-weight:900;
      cursor:pointer;
    }

    #homeView .sf-home-trust {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:16px;
    }

    #homeView .sf-home-trust article {
      padding:23px;
      border:1px solid #dfebe2;
      border-radius:13px;
      background:white;
    }

    #homeView .sf-home-trust h3 {
      color:#17462f;
      font-size:16px;
    }

    #homeView .sf-home-trust p {
      color:#718176;
      font-size:13px;
      line-height:1.8;
    }

    #homeView .sf-home-about {
      display:grid;
      grid-template-columns:1fr 1fr;
      align-items:center;
      gap:38px;
      padding:35px;
      border:1px solid #e0ebe3;
      border-radius:19px;
      background:white;
    }

    #homeView .sf-home-about img {
      width:100%;
      height:300px;
      object-fit:cover;
      border-radius:13px;
    }

    #homeView .sf-home-about h2 {
      color:#17462f;
      font:800 31px/1.2 Manrope,sans-serif;
    }

    #homeView .sf-home-about p {
      color:#718176;
      font-size:14px;
      line-height:1.9;
    }

    #homeView .sf-home-steps {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:17px;
    }

    #homeView .sf-home-step {
      padding:23px;
      border:1px solid #e0ebe3;
      border-radius:13px;
      background:white;
    }

    #homeView .sf-home-step span {
      display:grid;
      width:39px;
      height:39px;
      place-items:center;
      border-radius:11px;
      background:#e7f5eb;
      color:#146b40;
      font-weight:900;
    }

    #homeView .sf-home-step h3 {
      color:#17462f;
      font-size:16px;
    }

    #homeView .sf-home-step p {
      color:#718176;
      font-size:13px;
      line-height:1.8;
    }

    #homeView .sf-home-final {
      padding:60px 22px;
      text-align:center;
      color:white;
      background:linear-gradient(120deg,#0c3022,#176b47);
    }

    #homeView .sf-home-final h2 {
      color:white;
      font:800 clamp(27px,4vw,41px) Manrope,sans-serif;
    }

    #homeView .sf-home-final p {
      max-width:650px;
      margin:0 auto 23px;
      color:#d9eee1;
      font-size:14px;
      line-height:1.8;
    }

    #homeView .sf-home-final button {
      min-height:49px;
      padding:0 24px;
      border:0;
      border-radius:9px;
      background:white;
      color:#125238;
      font-weight:900;
      cursor:pointer;
    }

    #homeView .sf-home-disclaimer {
      margin-top:25px;
      color:#c5dfcf;
      font-size:10px;
    }

    @media(max-width:800px) {
      #homeView .sf-home-hero {
        padding:48px 20px;
      }

      #homeView .sf-home-slider {
        height:340px;
      }

      #homeView .sf-home-services,
      #homeView .sf-home-trust,
      #homeView .sf-home-steps,
      #homeView .sf-home-about {
        grid-template-columns:1fr;
      }

      #homeView .sf-home-about {
        padding:20px;
      }

      #homeView .sf-home-about img {
        height:230px;
      }

      #homeView .sf-home-slide-copy {
        left:20px;
        right:20px;
        bottom:65px;
      }

      #homeView .sf-home-slide-copy p {
        font-size:12px;
      }
    }
  `;

  if (!document.getElementById("sf-public-home-style")) {
    const style = document.createElement("style");
    style.id = "sf-public-home-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* =====================================================
     HOMEPAGE CONTENT
  ===================================================== */

  const home = document.getElementById("homeView");

  if (!home) {
    console.warn("SHOPY FONT: homeView was not found.");
    return;
  }

  home.classList.add("sf-public-home");

  home.innerHTML = `
    <section class="sf-home-hero">
      <div>
        <p class="sf-home-eyebrow">
          THE WORLD CONNECTED THROUGH OPPORTUNITY
        </p>

        <h1>Connect to a world of <em>possibilities.</em></h1>

        <p class="sf-home-lead">
          SHOPY FONT brings together digital commerce,
          product promotion, marketing opportunities and
          academic learning in one connected platform.
          Explore available services and grow your skills
          across borders.
        </p>

        <div class="sf-home-actions">
          <button class="sf-home-join" data-action="register">
            Create your account →
          </button>

          <button class="sf-home-login" data-action="login">
            Member login
          </button>
        </div>

        <div class="sf-home-proof">
          <span>🌍 International platform</span>
          <span>🔒 Account verification</span>
          <span>✓ Transparent membership process</span>
        </div>
      </div>
    </section>

    <section class="sf-home-slider-section">
      <div class="sf-home-slider" id="sfWelcomeSlider">

        <article class="sf-home-slide active">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=85"
            alt="Financial market trading charts"
          >
          <div class="sf-home-slide-copy">
            <small>FINANCIAL MARKETS</small>
            <h2>Explore the world of financial markets.</h2>
            <p>
              Discover financial-market knowledge and
              learn about trading concepts and market analysis.
            </p>
          </div>
        </article>

        <article class="sf-home-slide">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85"
            alt="Digital marketing team planning a campaign"
            loading="lazy"
          >
          <div class="sf-home-slide-copy">
            <small>DIGITAL MARKETING</small>
            <h2>Connect ideas with global audiences.</h2>
            <p>
              Explore digital promotion, product marketing,
              advertising and approved campaigns.
            </p>
          </div>
        </article>

        <article class="sf-home-slide">
          <img
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=85"
            alt="Academic writing and research workspace"
            loading="lazy"
          >
          <div class="sf-home-slide-copy">
            <small>ACADEMIC LEARNING</small>
            <h2>Develop your academic writing skills.</h2>
            <p>
              Discover research, writing support,
              academic tasks and learning resources.
            </p>
          </div>
        </article>

        <div class="sf-home-dots">
          <button class="sf-home-dot active" data-slide="0"
            aria-label="Show financial markets slide"></button>
          <button class="sf-home-dot" data-slide="1"
            aria-label="Show digital marketing slide"></button>
          <button class="sf-home-dot" data-slide="2"
            aria-label="Show academic writing slide"></button>
        </div>

        <div class="sf-home-slider-controls">
          <button type="button" data-slider-prev
            aria-label="Previous slide">‹</button>
          <button type="button" data-slider-next
            aria-label="Next slide">›</button>
        </div>
      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-section-heading">
        <p class="sf-home-eyebrow">DISCOVER SHOPY FONT</p>
        <h2>One connected platform. Different possibilities.</h2>
        <p>
          Explore the services and departments available
          through SHOPY FONT.
        </p>
      </div>

      <div class="sf-home-services">

        <article class="sf-home-service">
          <img
            src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=85"
            alt="Online marketplace shopping"
            loading="lazy"
          >
          <div class="sf-home-service-content">
            <h3>Global Marketplace</h3>
            <p>
              Browse product listings, discover products
              and explore member promotion opportunities.
            </p>
            <button data-view="marketplace">
              Explore marketplace →
            </button>
          </div>
        </article>

        <article class="sf-home-service">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85"
            alt="Business marketing collaboration"
            loading="lazy"
          >
          <div class="sf-home-service-content">
            <h3>Marketing & Opportunities</h3>
            <p>
              Explore approved promotions, advertising
              activities and available opportunities.
            </p>
            <button data-view="opportunities">
              Discover opportunities →
            </button>
          </div>
        </article>

        <article class="sf-home-service">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85"
            alt="Academic research and digital learning"
            loading="lazy"
          >
          <div class="sf-home-service-content">
            <h3>ScholarBridge</h3>
            <p>
              Develop academic writing skills,
              research knowledge and responsible study habits.
            </p>
            <button data-view="scholarbridge">
              Discover ScholarBridge →
            </button>
          </div>
        </article>

      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-section-heading">
        <p class="sf-home-eyebrow">A CLEAR MEMBER EXPERIENCE</p>
        <h2>Know how the platform works.</h2>
        <p>
          We believe members should understand the
          membership and account verification process.
        </p>
      </div>

      <div class="sf-home-trust">
        <article>
          <h3>Clear membership information</h3>
          <p>
            Review available membership levels,
            prices and applicable benefits before proceeding.
          </p>
        </article>

        <article>
          <h3>Country-specific payment instructions</h3>
          <p>
            Follow the payment provider and instructions
            assigned to your country.
          </p>
        </article>

        <article>
          <h3>Manual account review</h3>
          <p>
            Membership activation is subject to payment
            verification and administrator approval.
          </p>
        </article>
      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-about">
        <img
          src="https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&w=1100&q=85"
          alt="International professionals collaborating"
          loading="lazy"
        >

        <div>
          <p class="sf-home-eyebrow">OUR VISION</p>
          <h2>Built to connect people with possibilities.</h2>

          <p>
            SHOPY FONT brings digital commerce,
            marketing activities and academic learning
            into one connected environment.
          </p>

          <p>
            Members access services according to
            their approved membership level and
            applicable platform requirements.
          </p>

          <button class="sf-home-join" data-action="register">
            Become a member →
          </button>
        </div>
      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-section-heading">
        <p class="sf-home-eyebrow">GETTING STARTED</p>
        <h2>Your journey starts here.</h2>
        <p>
          Follow the membership process from registration
          to account approval.
        </p>
      </div>

      <div class="sf-home-steps">
        <article class="sf-home-step">
          <span>01</span>
          <h3>Create an account</h3>
          <p>
            Register with your personal details,
            email address and country.
          </p>
        </article>

        <article class="sf-home-step">
          <span>02</span>
          <h3>Choose membership</h3>
          <p>
            Select your membership level and follow
            the payment instructions for your country.
          </p>
        </article>

        <article class="sf-home-step">
          <span>03</span>
          <h3>Complete verification</h3>
          <p>
            Submit the required payment evidence
            and wait for administrator review.
          </p>
        </article>
      </div>
    </section>

    <section class="sf-home-final">
      <p class="sf-home-eyebrow">SHOPY FONT</p>

      <h2>The world connected through opportunity.</h2>

      <p>
        Create your account and discover the
        services available through SHOPY FONT.
      </p>

      <button data-action="register">
        Join SHOPY FONT →
      </button>

      <p class="sf-home-disclaimer">
        Membership and access are subject to applicable
        payment verification, approval and platform terms.
        Earnings and commissions depend on the applicable
        platform rules and are not guaranteed.
      </p>
    </section>
  `;

  /* =====================================================
     IMAGE SLIDER
  ===================================================== */

  const slider = document.getElementById("sfWelcomeSlider");

  if (slider && !slider.dataset.initialized) {
    slider.dataset.initialized = "true";

    const slides = [
      ...slider.querySelectorAll(".sf-home-slide")
    ];

    const dots = [
      ...slider.querySelectorAll(".sf-home-dot")
    ];

    let current = 0;
    let interval = null;

        const showSlide = index => {
      if (!slides.length) return;

      current = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === current);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === current);
      });
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const start = () => {
      stop();

      interval = setInterval(() => {
        showSlide(current + 1);
      }, 5500);
    };

    slider.querySelector("[data-slider-prev]")
      ?.addEventListener("click", () => {
        showSlide(current - 1);
        start();
      });

    slider.querySelector("[data-slider-next]")
      ?.addEventListener("click", () => {
        showSlide(current + 1);
        start();
      });

    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        showSlide(Number(dot.dataset.slide));
        start();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);

    showSlide(0);
    start();
  }

  /* =====================================================
     NAVIGATION SAFETY
     app.js remains the only navigation controller.
  ===================================================== */

  // Do not set home.style.display.
  // Do not force home.classList.add("active").
  // Do not replace or override SF.navigate.
  // app.js switches between the homepage and dashboard.

})();
