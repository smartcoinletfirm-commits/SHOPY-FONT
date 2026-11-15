window.SF = window.SF || {};

document.addEventListener("DOMContentLoaded", () => {
  if (SF.adminInternationalReady) return;
  SF.adminInternationalReady = true;

  const originalNotifications = SF.adminNotifications;

  if (typeof originalNotifications !== "function") return;

  SF.adminNotifications = async () => {
    const html = await originalNotifications();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    doc.querySelectorAll("article").forEach(card => {
      const paragraphs = [...card.querySelectorAll("p")];

      const countryLine = paragraphs.find(p =>
        p.textContent.includes("Country:")
      );

      const levelLine = paragraphs.find(p =>
        p.textContent.includes("Membership level:")
      );

      const priceLine = paragraphs.find(p =>
        p.textContent.includes("Package price:")
      );

      if (!countryLine || !levelLine || !priceLine) return;

      const country = countryLine.textContent
        .replace("Country:", "").trim();

      const levelText = levelLine.textContent
        .replace("Membership level:", "").trim();

      const level = Number(levelText);

      const kesPrices = {
        1: 580,
        2: 1000,
        3: 2000,
        4: 4500
      };

      const kes = kesPrices[level];

      let display = "NardoPay — local currency shown at checkout";

      if (country === "Kenya" && kes) {
        display = "KES " + kes.toLocaleString("en-KE");
      } else if (country === "Nigeria" && kes) {
        display = "₦" +
          Math.round(kes * 10.3734).toLocaleString("en-NG");
      } else if (country === "Ghana" && kes) {
        display = "GH₵" +
          (kes * 0.0900059).toFixed(2);
      }

      const strong = priceLine.querySelector("strong");

      if (strong) {
        strong.textContent = "Package price:";
        priceLine.replaceChildren(
          strong,
          document.createTextNode(" " + display)
        );
      }
    });

    return doc.body.innerHTML;
  };
});

