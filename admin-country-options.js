window.SF = window.SF || {};

const originalAdminMembers = SF.adminMembers;

SF.adminMembers = async () => {
  const html = await originalAdminMembers();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const countries = SF.UN_COUNTRIES || [];

  doc.querySelectorAll(
    'form[data-edit-member] select[name="country"]'
  ).forEach(select => {
    const currentCountry = select.value;

    select.replaceChildren();

    countries.forEach(country => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;

      if (country === currentCountry) {
        option.selected = true;
      }

      select.appendChild(option);
    });
  });

  return doc.body.innerHTML;
};

