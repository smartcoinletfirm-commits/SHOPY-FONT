
window.SF = window.SF || {};

SF.UN_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas",
  "Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei",
  "Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon",
  "Canada","Central African Republic","Chad","Chile","China","Colombia",
  "Comoros","Congo","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus",
  "Czechia","Democratic People's Republic of Korea",
  "Democratic Republic of the Congo","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Monaco","Mongolia","Montenegro",
  "Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Republic of Korea","Romania",
  "Russian Federation","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles",
  "Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands",
  "Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syrian Arab Republic","Tajikistan",
  "Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Türkiye","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United Republic of Tanzania",
  "United States","Uruguay","Uzbekistan","Vanuatu","Venezuela","Viet Nam",
  "Yemen","Zambia","Zimbabwe"
];

SF.populateCountrySelects = () => {
  const selectIds = ["activationCountry"];
  const registrationSelect = document.querySelector(
    '#registerForm select[name="country"]'
  );

  const selects = [
    ...(registrationSelect ? [registrationSelect] : []),
    ...selectIds.map(id => document.getElementById(id)).filter(Boolean)
  ];

  selects.forEach(select => {
    const previousValue = select.value;
    const placeholder = select.querySelector('option[value=""]');

    select.replaceChildren();

    if (placeholder) {
      select.appendChild(placeholder.cloneNode(true));
    } else {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Select your country";
      select.appendChild(option);
    }

    SF.UN_COUNTRIES.forEach(country => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      select.appendChild(option);
    });

    if (SF.UN_COUNTRIES.includes(previousValue)) {
      select.value = previousValue;
    }
  });
};

document.addEventListener("DOMContentLoaded", SF.populateCountrySelects);
