/* SHOPY FONT — NEW MEMBER WELCOME PAGE */
(() => {
  "use strict";

  if (!window.SF) return;

  const main = document.querySelector("main");
  if (!main || document.getElementById("welcomeView")) return;

  const markup = `
    <section id="welcomeView" class="view sf-welcome">
      <style>
        .sf-welcome{background:#f5f7fb;color:#17243a}
        .sf-w-hero{background:linear-gradient(110deg,#101d36,#203858);color:white;padding:65px 7%;display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center}
        .sf-w-hero h1{font:800 clamp(38px,5vw,60px)/1.1 Manrope,sans-serif;margin:0}
        .sf-w-hero h1 em{color:#d8b56e;font-style:normal}
        .sf-w-hero p{color:#c8d2e0;line-height:1.8}
        .sf-w-hero img{width:100%;height:330px;object-fit:cover;border-radius:18px}
        .sf-w-content{max-width:1150px;margin:auto;padding:55px 22px}
        .sf-w-heading{text-align:center;margin-bottom:30px}
        .sf-w-heading h2{font:800 32px Manrope,sans-serif}
        .sf-w-heading p,.sf-w-card p,.sf-w-vip p{color:#718096;line-height:1.8;font-size:13px}
        .sf-w-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        .sf-w-card{background:white;border:1px solid #e6e9ef;border-radius:15px;overflow:hidden}
        .sf-w-card img{width:100%;height:190px;object-fit:cover}
        .sf-w-card div{padding:20px}
        .sf-w-card h3{font:800 19px Manrope,sans-serif}
        .sf-w-vip{margin-top:30px;background:white;border:1px solid #e6e9ef;border-radius:15px;padding:28px;display:flex;justify-content:space-between;align-items:center;gap:20px}
        .sf-w-rate{font:800 38px Manrope,sans-serif;color:#a98442;white-space:nowrap}
        .sf-w-cta{margin-top:30px;padding:35px 22px;text-align:center;background:#101d36;color:white;border-radius:16px}
        .sf-w-cta p{color:#c8d2e0;line-height:1.8}
        .sf-w-note{text-align:center;color:#718096;font-size:11px;line-height:1.6;margin-top:20px}
        @media(max-width:760px){
          .sf-w-hero{grid-template-columns:1fr;padding:45px 22px}
          .sf-w-hero img{height:230px}
          .sf-w-grid{grid-template-columns:1fr}
          .sf-w-vip{flex-direction:column;text-align:center}
        }
      </style>

      <div class="sf-w-hero">
        <div>
          <p class="eyebrow">WELCOME TO SHOPY FONT</p>
          <h1>The world connected through <em>opportunity.</em></h1>
          <p>Discover a global digital marketplace where members can explore products, promote approved offers, grow their reach and access learning opportunities across borders.</p>
          <button class="btn btn-gold btn-large" data-action="welcome-continue">
            Proceed to membership activation →
          </button>
        </div>
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85" alt="Modern retail store">
      </div>

      <div class="sf-w-content">
        <div class="sf-w-heading">
          <p class="eyebrow">DISCOVER SHOPY FONT</p>
          <h2>One platform. Different opportunities.</h2>
          <p>Explore the services available to activated members.</p>
        </div>

        <div class="sf-w-grid">
          <article class="sf-w-card">
            <img src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=85" alt="Online shopping">
            <div>
              <h3>Shop & discover</h3>
              <p>Explore approved product listings, compare items and connect with sellers through the marketplace.</p>
            </div>
          </article>

          <article class="sf-w-card">
            <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85" alt="Business collaboration">
            <div>
              <h3>Promote & earn</h3>
              <p>Share approved products and campaigns. Qualifying commissions are recorded after sales are verified.</p>
            </div>
          </article>

          <article class="sf-w-card">
            <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85" alt="Digital learning workspace">
            <div>
              <h3>Learn & develop</h3>
              <p>Explore ScholarBridge resources and develop practical digital and academic skills.</p>
            </div>
          </article>
        </div>

        <div class="sf-w-vip">
          <div>
            <p class="eyebrow">VIP MEMBER BENEFIT</p>
            <h2>Promote eligible products and campaigns</h2>
            <p>Eligible VIP members may receive commissions of up to 2% on verified qualifying sales. Campaign terms and eligibility apply.</p>
          </div>
          <div class="sf-w-rate">UP TO 2%</div>
        </div>

        <div class="sf-w-cta">
          <h2>Your journey starts here.</h2>
          <p>Create your membership profile, choose your package and complete secure checkout. Member-area access begins after activation approval.</p>
          <button class="btn btn-gold btn-large" data-action="welcome-continue">
            Proceed to membership activation →
          </button>
        </div>

        <p class="sf-w-note">Commissions are not guaranteed income. Only eligible, verified transactions qualify under applicable campaign terms.</p>
      </div>
    </section>
  `;

  const auth = document.getElementById("authView");
  if (auth) auth.insertAdjacentHTML("beforebegin", markup);
  else main.insertAdjacentHTML("afterbegin", markup);

  /* Remember newly registered members. */
  const originalRegister = SF.register;

  if (typeof originalRegister === "function") {
    SF.register = async form => {
      const result = await originalRegister(form);
      try {
        sessionStorage.setItem("sf_show_welcome", "1");
      } catch (_) {}
      return result;
    };
  }

  /* Show the introduction to new registrations only. */
  const originalNavigate = SF.navigate;

  if (typeof originalNavigate === "function") {
    SF.navigate = async view => {
      let showWelcome = false;

      if (view === "dashboard") {
        try {
          showWelcome =
            sessionStorage.getItem("sf_show_welcome") === "1";

          if (showWelcome) {
            sessionStorage.removeItem("sf_show_welcome");
          }
        } catch (_) {}
      }

      return originalNavigate(showWelcome ? "welcome" : view);
    };
  }

  document.addEventListener("click", event => {
    const button = event.target.closest(
      '[data-action="welcome-continue"]'
    );

    if (!button) return;

    event.preventDefault();
    SF.navigate("dashboard");
  });
})();
