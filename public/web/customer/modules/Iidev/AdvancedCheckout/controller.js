function AdvancedCheckout(base) {
  AdvancedCheckout.superclass.constructor.apply(this, arguments);

  this.bind("local.loaded", _.bind(this.assignInputHandlers, this));

  this.assignInputHandlers();
}

extend(AdvancedCheckout, ALoadable);

AdvancedCheckout.autoload = function () {
  new AdvancedCheckout(".checkout-block");
};

AdvancedCheckout.prototype.assignInputHandlers = function () {
  this.initInputMask();
  this.initMapScript();
  this.initEmailSuggestions();
};

AdvancedCheckout.prototype.initEmailSuggestions = function () {
  function createSuggestionsList(emailInput) {
    const itemList = document.createElement("ul");
    itemList.classList.add('email-suggestions');
    emailInput.closest(".input-field-wrapper").appendChild(itemList);

    return itemList;
  }

  function clearSuggestionsList(list) {
    list.innerHTML = "";
  }

  function createSuggestionsItem(input, extension, suggestionsList) {
    const item = document.createElement("li");
    item.textContent = `${input}@${extension}`;
    suggestionsList.appendChild(item);
  }

  const emailExtensions = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "aol.com",
    "outlook.com",
    "icloud.com",
    "live.com",
    "mac.com",
    "msn.com",
    "zoho.com",
    "mail.com",
  ];

  const emailFieldIds = ["email", "login-email"];

  emailFieldIds.forEach((emailId) => {
    const emailInput = document.querySelector(`.email-field #${emailId}`);

    if (!emailInput) return;

    const suggestionsList = createSuggestionsList(emailInput);

    emailInput.addEventListener("input", (e) => {
      const inputValue = e.target.value;

      clearSuggestionsList(suggestionsList);

      const inputParts = inputValue.split("@");
      const beforeAt = inputParts[0];
      let afterAt = inputParts.length > 1 ? inputParts[1] : "";

      if (inputParts.length === 1 || afterAt.length >= 0) {
        const filteredExtensions =
          afterAt.length > 0
            ? emailExtensions.filter((extension) =>
                extension.startsWith(afterAt)
              )
            : emailExtensions;

        for (const extension of filteredExtensions) {
          createSuggestionsItem(beforeAt, extension, suggestionsList);
        }
      }
      if (inputValue.length === 0) {
        clearSuggestionsList(suggestionsList);
      }
    });

    suggestionsList.addEventListener("click", (e) => {
      emailInput.value = e.target.textContent;
      clearSuggestionsList(suggestionsList);
    });
  });
};

AdvancedCheckout.prototype.initInputMask = function () {
  const im = new Inputmask("(999) 999-9999");
  const bPhone = document.getElementById("shippingaddress-phone");
  const sPhone = document.getElementById("billingaddress-phone");
  if (sPhone) {
    im.mask(sPhone);
  }
  if (bPhone) {
    im.mask(bPhone);
  }
};

AdvancedCheckout.prototype.initMap = async function () {
  const { Autocomplete } = google.maps.places;
  const autocompleteBilling = new Autocomplete(
    document.getElementById("billingaddress-street"),
    {
      fields: ["address_components", "geometry", "name"],
      types: ["address"],
    }
  );
  const autocompleteShipping = new Autocomplete(
    document.getElementById("shippingaddress-street"),
    {
      fields: ["address_components", "geometry", "name"],
      types: ["address"],
    }
  );

  autocompleteBilling.addListener("place_changed", () => {
    const place = autocompleteBilling.getPlace();
    if (!place.geometry) {
      window.alert(`No details available for: '${place.name}'`);
      return;
    }
    this.fillInAddress(place, "billing");
  });

  autocompleteShipping.addListener("place_changed", () => {
    const place = autocompleteShipping.getPlace();
    if (!place.geometry) {
      window.alert(`No details available for: '${place.name}'`);
      return;
    }
    this.fillInAddress(place, "shipping");
  });
};

AdvancedCheckout.prototype.initMapScript = async function () {
  const apiKey = xcart.getCommentedData(jQuery("body"), "google_api_key");

  let url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&solution_channel=GMP_QB_addressselection_v2_cA`;
  let script = document.createElement("script");
  let container = document.body || document.head;

  script.setAttribute("src", url);
  script.setAttribute("async", true);
  script.onload = () => {
    this.initMap();
  };

  container.append(script);
};

AdvancedCheckout.prototype.fillInAddress = function (place, type) {
  const address = {
    address_1: ["billingaddress-street", "shippingaddress-street"],
    city: ["billingaddress-city", "shippingaddress-city"],
    country: ["billingaddress-country-code", "shippingaddress-country-code"],
    state: ["billingaddress-state-id", "shippingaddress-state-id"],
    zipcode: ["billingaddress-zipcode", "shippingaddress-zipcode"],
  };

  function getAddressField(name, type) {
    return document.getElementById(address[name][type]);
  }

  function setParentListItemFocused(name, type) {
    document
      .getElementById(address[name][type])
      .closest("li")
      .classList.remove("no-value-selected");
    document
      .getElementById(address[name][type])
      .closest("li")
      .classList.add("focused");
  }

  function getAddressValue(item) {
    return item.short_name || item.long_name || item;
  }

  function setAddressValue(field, item, type) {
    getAddressField(field, type).value = getAddressValue(item);
    setParentListItemFocused(field, type);
  }

  function selectElement(field, item, type) {
    const selectElement = getAddressField(field, type);
    const optionText = item.long_name || item;

    selectElement.options.forEach((option, index) => {
      if (option.text === optionText) {
        selectElement.selectedIndex = index;
      }
    });

    setParentListItemFocused(field, type);
  }

  let addressDetails = place.address_components;

  if (type === "billing") type = 0;
  if (type === "shipping") type = 1;

  for (const addressItem of addressDetails) {
    switch (addressItem.types[0]) {
      case "street_number":
        const streetNumber = getAddressValue(addressItem);
        const streetName = getAddressValue(
          addressDetails.find((details) => details.types[0] === "route")
        );

        setAddressValue("address_1", `${streetNumber} ${streetName}`, type);
        break;

      case "locality":
        setAddressValue("city", addressItem, type);
        break;

      case "administrative_area_level_1":
        selectElement("state", addressItem, type);
        break;

      case "country":
        setAddressValue("country", addressItem, type);
        break;

      case "postal_code":
        setAddressValue("zipcode", addressItem, type);
        break;

      default:
        break;
    }
  }
};

xcart.autoload(AdvancedCheckout);
