
/* =========================================================
   SHOPY FONT — PREMIUM PUBLIC HOMEPAGE
   Public landing page + first-visit route correction.
   Existing authentication and member functions are preserved.
========================================================= */

(() => {
  "use strict";

  const SF = window.SF = window.SF || {};

  const css = `
    #homeView.sf-public-home {
      display: block;
      background: #f7f8fb;
      color: #17243a;
      padding: 0;
    }

    #homeView.sf-public-home .sf-home-hero {
      min-height: 620px;
      display: grid;
      grid-template-columns: 1.05fr .95fr;
      align-items: center;
      gap: 45px;
      padding: 75px max(calc((100vw - 1200px)/2),6%);
      color: white;
      background:
        radial-gradient(circle at 85% 20%,#314d78 0,transparent 32%),
        linear-gradient(115deg,#0d1930,#172c4c 65%,#203b5d);
      overflow: hidden;
    }

    #homeView.sf-public-home .sf-home-eyebrow {
      color: #d8b56e;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 2.5px;
      margin: 0 0 20px;
    }

    #homeView.sf-public-home .sf-home-hero h1 {
      max-width: 680px;
      margin: 0;
      color: white;
      font: 800 clamp(42px,5.5vw,70px)/1.08 Manrope,sans-serif;
      letter-spacing: -2.5px;
    }

    #homeView.sf-public-home .sf-home-hero h1 em {
      color: #e0bd78;
      font-style: normal;
    }

    #homeView.sf-public-home .sf-home-lead {
      max-width: 570px;
      margin: 25px 0;
      color: #d0d9e7;
      font-size: 15px;
      line-height: 1.9;
    }

    #homeView.sf-public-home .sf-home-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }

    #homeView.sf-public-home .sf-home-actions button {
      min-height: 50px;
      padding: 0 23px;
      border-radius: 9px;
      font-weight: 800;
      cursor: pointer;
    }

    #homeView.sf-public-home .sf-home-join {
      border: 1px solid #dfbd7a;
      background: linear-gradient(120deg,#dfbd7a,#f0d9a5);
      color: #17243a;
    }

    #homeView.sf-public-home .sf-home-login {
      border: 1px solid #ffffff80;
      background: #ffffff0b;
      color: white;
    }

    #homeView.sf-public-home .sf-home-proof {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 35px;
      color: #cbd5e3;
      font-size: 11px;
    }

    #homeView.sf-public-home .sf-home-visual {
      position: relative;
      min-height: 420px;
      display: grid;
      place-items: center;
    }

    #homeView.sf-public-home .sf-home-visual img {
      width: 100%;
      height: 390px;
      object-fit: cover;
      border: 5px solid #ffffff20;
      border-radius: 23px;
      box-shadow: 0 25px 70px #050d1d80;
    }

    #homeView.sf-public-home .sf-home-image-tag {
      position: absolute;
      left: -22px;
      bottom: 25px;
      max-width: 235px;
      padding: 18px;
      border: 1px solid #ffffff50;
      border-radius: 14px;
      background: #fff;
      color: #17243a;
      box-shadow: 0 12px 35px #050d1d45;
    }

    #homeView.sf-public-home .sf-home-image-tag strong {
      display: block;
      font: 800 16px Manrope,sans-serif;
    }

    #homeView.sf-public-home .sf-home-image-tag small {
      display: block;
      margin-top: 6px;
      color: #718096;
      line-height: 1.5;
    }

    #homeView.sf-public-home .sf-home-section {
      max-width: 1200px;
      margin: auto;
      padding: 75px 24px;
    }

    #homeView.sf-public-home .sf-home-section-heading {
      max-width: 700px;
      margin: 0 auto 38px;
      text-align: center;
    }

    #homeView.sf-public-home .sf-home-section-heading h2 {
      margin: 0 0 12px;
      color: #17243a;
      font: 800 clamp(27px,3.5vw,39px)/1.2 Manrope,sans-serif;
    }

    #homeView.sf-public-home .sf-home-section-heading p {
      color: #718096;
      line-height: 1.8;
      font-size: 14px;
    }

    #homeView.sf-public-home .sf-home-services {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 22px;
    }

    #homeView.sf-public-home .sf-home-service {
      overflow: hidden;
      border: 1px solid #e6e9ef;
      border-radius: 17px;
      background: white;
      box-shadow: 0 8px 25px #17243a08;
      transition: .2s ease;
    }

    #homeView.sf-public-home .sf-home-service:hover {
      transform: translateY(-4px);
      box-shadow: 0 15px 35px #17243a12;
    }

    #homeView.sf-public-home .sf-home-service img {
      display: block;
      width: 100%;
      height: 205px;
      object-fit: cover;
    }

    #homeView.sf-public-home .sf-home-service-content {
      padding: 23px;
    }

    #homeView.sf-public-home .sf-home-service h3 {
      margin: 0 0 10px;
      color: #17243a;
      font: 800 19px Manrope,sans-serif;
    }

    #homeView.sf-public-home .sf-home-service p {
      min-height: 65px;
      margin: 0 0 17px;
      color: #718096;
      font-size: 13px;
      line-height: 1.8;
    }

    #homeView.sf-public-home .sf-home-service button {
      border: 0;
      padding: 0;
      background: transparent;
      color: #9a7639;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
    }

    #homeView.sf-public-home .sf-home-about {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 45px;
      padding: 48px;
      border: 1px solid #e8eaf0;
      border-radius: 22px;
      background: white;
    }

    #homeView.sf-public-home .sf-home-about img {
      width: 100%;
      height: 310px;
      object-fit: cover;
      border-radius: 16px;
    }

    #homeView.sf-public-home .sf-home-about h2 {
      color: #17243a;
      font: 800 32px/1.2 Manrope,sans-serif;
    }

    #homeView.sf-public-home .sf-home-about p {
      color: #718096;
      font-size: 14px;
      line-height: 1.9;
    }

    #homeView.sf-public-home .sf-home-steps {
      display: grid;
      grid-template-columns: repeat(3,1fr);
      gap: 18px;
    }

    #homeView.sf-public-home .sf-home-step {
      padding: 25px;
      border: 1px solid #e6e9ef;
      border-radius: 15px;
      background: white;
    }

    #homeView.sf-public-home .sf-home-step span {
      display: grid;
      width: 39px;
      height: 39px;
      place-items: center;
      border-radius: 12px;
      background: #f5edda;
      color: #89682e;
      font-weight: 900;
    }

    #homeView.sf-public-home .sf-home-step h3 {
      color: #17243a;
      font: 800 17px Manrope,sans-serif;
    }

    #homeView.sf-public-home .sf-home-step p {
      color: #718096;
      font-size: 13px;
      line-height: 1.8;
    }

    #homeView.sf-public-home .sf-home-final {
      margin: 0;
      padding: 65px 22px;
      text-align: center;
      color: white;
      background:
        radial-gradient(circle at 50% 0%,#304a72,transparent 60%),
        #101d36;
    }

    #homeView.sf-public-home .sf-home-final h2 {
      margin: 0 0 13px;
      color: white;
      font: 800 clamp(28px,4vw,42px) Manrope,sans-serif;
    }

    #homeView.sf-public-home .sf-home-final p {
      max-width: 620px;
      margin: 0 auto 25px;
      color: #cbd5e3;
      line-height: 1.8;
      font-size: 14px;
    }

    #homeView.sf-public-home .sf-home-disclaimer {
      max-width: 900px;
      margin: 22px auto 0;
      color: #aebbd0;
      font-size: 10px;
      line-height: 1.7;
    }

    @media(max-width:800px) {
      #homeView.sf-public-home .sf-home-hero {
        grid-template-columns: 1fr;
        padding: 55px 22px;
        gap: 20px;
      }

      #homeView.sf-public-home .sf-home-hero h1 {
        font-size: clamp(40px,11vw,57px);
      }

      #homeView.sf-public-home .sf-home-visual {
        min-height: 290px;
        margin-top: 15px;
      }

      #homeView.sf-public-home .sf-home-visual img {
        height: 285px;
      }

      #homeView.sf-public-home .sf-home-image-tag {
        left: 8px;
        bottom: 5px;
      }

      #homeView.sf-public-home .sf-home-services,
      #homeView.sf-public-home .sf-home-steps {
        grid-template-columns: 1fr;
      }

      #homeView.sf-public-home .sf-home-about {
        grid-template-columns: 1fr;
        padding: 22px;
        gap: 20px;
      }

      #homeView.sf-public-home .sf-home-about img {
        height: 230px;
      }

      #homeView.sf-public-home .sf-home-section {
        padding: 52px 17px;
      }
    }
  `;

  const style = document.createElement("style");
  style.id = "sf-public-home-style";
  style.textContent = css;
  document.head.appendChild(style);

  const home = document.getElementById("homeView");
  if (!home) return;

  home.classList.add("sf-public-home");

  home.innerHTML = `
    <section class="sf-home-hero">
      <div>
        <p class="sf-home-eyebrow">THE WORLD CONNECTED THROUGH OPPORTUNITY</p>

        <h1>Your world.<br>Your next <em>opportunity.</em></h1>

        <p class="sf-home-lead">
          Discover a connected digital platform bringing together
          online commerce, approved promotions, services and learning.
          Explore opportunities and connect beyond borders.
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
          <span>🌍 Global connections</span>
          <span>🔒 Secure member access</span>
          <span>✦ Connected services</span>
        </div>
      </div>

      <div class="sf-home-visual">
        <img
          src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85"
          alt="Professionals collaborating in a modern workspace"
        >
        <div class="sf-home-image-tag">
          <strong>Connect beyond borders.</strong>
          <small>Commerce · Promotion · Skills · Learning</small>
        </div>
      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-section-heading">
        <p class="sf-home-eyebrow">DISCOVER SHOPY FONT</p>
        <h2>One platform. Different possibilities.</h2>
        <p>
          Explore the connected services available through
          the SHOPY FONT platform.
        </p>
      </div>

      <div class="sf-home-services">
        <article class="sf-home-service">
          <img
            src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=85"
            alt="Online shopping and payment"
            loading="lazy"
          >
          <div class="sf-home-service-content">
            <h3>Global Marketplace</h3>
            <p>
              Discover approved product listings and connect
              with sellers through a digital marketplace.
            </p>
            <button data-view="marketplace">Explore marketplace →</button>
          </div>
        </article>

        <article class="sf-home-service">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85"
            alt="Business team planning a campaign"
            loading="lazy"
          >
          <div class="sf-home-service-content">
            <h3>Promotions & Opportunities</h3>
            <p>
              Explore approved campaigns, promotional activities
              and available opportunities.
            </p>
            <button data-view="opportunities">Discover opportunities →</button>
          </div>
        </article>

        <article class="sf-home-service">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85"
            alt="Modern digital learning workspace"
            loading="lazy"
          >
          <div class="sf-home-service-content">
            <h3>ScholarBridge</h3>
            <p>
              Explore academic learning support, study resources
              and responsible writing development.
            </p>
            <button data-view="scholarbridge">Discover ScholarBridge →</button>
          </div>
        </article>
      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-about">
        <img
          src="https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&w=1100&q=85"
          alt="International business collaboration"
          loading="lazy"
        >
        <div>
          <p class="sf-home-eyebrow">A CONNECTED DIGITAL WORLD</p>
          <h2>Built to connect people with possibilities.</h2>
          <p>
            SHOPY FONT brings different digital services into
            one connected environment. Members can access the
            services available to their approved membership level.
          </p>
          <p>
            Our vision is to make digital commerce, learning
            and opportunity more accessible across borders.
          </p>
          <button class="btn btn-gold" data-action="register">
            Become a member →
          </button>
        </div>
      </div>
    </section>

    <section class="sf-home-section">
      <div class="sf-home-section-heading">
        <p class="sf-home-eyebrow">GETTING STARTED</p>
        <h2>Your journey starts in three steps.</h2>
        <p>Set up your account and complete the membership process.</p>
      </div>

      <div class="sf-home-steps">
        <article class="sf-home-step">
          <span>01</span>
          <h3>Create an account</h3>
          <p>Register with your name, email address and country.</p>
        </article>
        <article class="sf-home-step">
          <span>02</span>
          <h3>Choose membership</h3>
          <p>Follow the activation instructions for your selected membership.</p>
        </article>
        <article class="sf-home-step">
          <span>03</span>
          <h3>Complete verification</h3>
          <p>Wait for the required checks and administrator approval.</p>
        </article>
      </div>
    </section>

    <section class="sf-home-final">
      <p class="sf-home-eyebrow">SHOPY FONT</p>
      <h2>The world connected through opportunity.</h2>
      <p>
        Take the first step. Create your account and discover
        the services available on SHOPY FONT.
      </p>
      <button class="btn btn-gold btn-large" data-action="register">
        Join SHOPY FONT →
      </button>
      <p class="sf-home-disclaimer">
        Membership access is subject to the applicable activation,
        verification and platform terms. Commissions and earnings
        are not guaranteed and depend on eligible verified activity.
      </p>
    </section>
  `;

  /*
   * If a browser opens the main website with an old #dashboard
   * address, show the public homepage on that initial visit.
   * Normal login navigation to the member dashboard remains intact.
   */
  const originalNavigate = SF.navigate;
  let firstNavigation = true;

  if (typeof originalNavigate === "function") {
    SF.navigate = async function (view) {
      if (firstNavigation) {
        firstNavigation = false;

        const isMainSite =
          location.pathname === "/" ||
          location.pathname.endsWith("/index.html");

        if (isMainSite && view === "dashboard") {
          history.replaceState(null, "", location.pathname);
          return originalNavigate("home");
        }
      }

      firstNavigation = false;
      return originalNavigate(view);
    };
  }

})();
    
