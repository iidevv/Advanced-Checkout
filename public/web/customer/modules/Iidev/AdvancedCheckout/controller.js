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
};

AdvancedCheckout.prototype.initInputMask = function () {
  const im = new Inputmask("(999) 999-9999");
  im.mask(document.getElementById("shippingaddress-phone"));
  im.mask(document.getElementById("billingaddress-phone"));
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
