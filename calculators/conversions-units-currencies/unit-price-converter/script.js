document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const price1Input = document.getElementById("price1");
  const quantity1Input = document.getElementById("quantity1");
  const unitTypeSelect = document.getElementById("unitType");
  const unitInputSelect = document.getElementById("unitInput");
  const perBasisSelect = document.getElementById("perBasis");

  const price2Input = document.getElementById("price2");
  const quantity2Input = document.getElementById("quantity2");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(price1Input);
  attachLiveFormatting(quantity1Input);
  attachLiveFormatting(price2Input);
  attachLiveFormatting(quantity2Input);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
  }

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) UNIT CONFIG (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const unitConfig = {
    items: {
      label: "item",
      baseLabel: "item",
      units: [
        { value: "item", label: "Items (count)", factorToBase: 1 }
      ],
      perOptions: [
        { value: "1", label: "1 item", perBase: 1 },
        { value: "10", label: "10 items", perBase: 10 }
      ],
      commonBreakdown: [
        { label: "Per 1 item", perBase: 1, suffix: "item" },
        { label: "Per 10 items", perBase: 10, suffix: "10 items" }
      ]
    },
    mass: {
      label: "g",
      baseLabel: "g",
      units: [
        { value: "g", label: "Grams (g)", factorToBase: 1 },
        { value: "kg", label: "Kilograms (kg)", factorToBase: 1000 }
      ],
      perOptions: [
        { value: "100", label: "100 g", perBase: 100 },
        { value: "1000", label: "1 kg", perBase: 1000 }
      ],
      commonBreakdown: [
        { label: "Per 100 g", perBase: 100, suffix: "100 g" },
        { label: "Per 1 kg", perBase: 1000, suffix: "kg" }
      ]
    },
    volume: {
      label: "ml",
      baseLabel: "ml",
      units: [
        { value: "ml", label: "Millilitres (ml)", factorToBase: 1 },
        { value: "l", label: "Litres (l)", factorToBase: 1000 }
      ],
      perOptions: [
        { value: "100", label: "100 ml", perBase: 100 },
        { value: "1000", label: "1 litre", perBase: 1000 }
      ],
      commonBreakdown: [
        { label: "Per 100 ml", perBase: 100, suffix: "100 ml" },
        { label: "Per 1 litre", perBase: 1000, suffix: "litre" }
      ]
    },
    length: {
      label: "m",
      baseLabel: "m",
      units: [
        { value: "m", label: "Metres (m)", factorToBase: 1 },
        { value: "cm", label: "Centimetres (cm)", factorToBase: 0.01 }
      ],
      perOptions: [
        { value: "1", label: "1 metre", perBase: 1 },
        { value: "10", label: "10 metres", perBase: 10 }
      ],
      commonBreakdown: [
        { label: "Per 1 metre", perBase: 1, suffix: "m" },
        { label: "Per 10 metres", perBase: 10, suffix: "10 m" }
      ]
    }
  };

  function populateUnitSelects() {
    if (!unitTypeSelect || !unitInputSelect || !perBasisSelect) return;

    const mode = unitTypeSelect.value;
    const cfg = unitConfig[mode];
    if (!cfg) return;

    unitInputSelect.innerHTML = "";
    cfg.units.forEach(function (u) {
      const opt = document.createElement("option");
      opt.value = u.value;
      opt.textContent = u.label;
      unitInputSelect.appendChild(opt);
    });

    perBasisSelect.innerHTML = "";
    cfg.perOptions.forEach(function (p) {
      const opt = document.createElement("option");
      opt.value = p.value;
      opt.textContent = p.label;
      perBasisSelect.appendChild(opt);
    });

    showMode(mode);
  }

  if (unitTypeSelect) {
    populateUnitSelects();
    unitTypeSelect.addEventListener("change", function () {
      populateUnitSelects();
    });
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const unitType = unitTypeSelect ? unitTypeSelect.value : "items";
      const cfg = unitConfig[unitType];

      const unitInput = unitInputSelect ? unitInputSelect.value : "";
      const perBasisRaw = perBasisSelect ? perBasisSelect.value : "";

      const price1 = toNumber(price1Input ? price1Input.value : "");
      const qty1 = toNumber(quantity1Input ? quantity1Input.value : "");

      const price2 = toNumber(price2Input ? price2Input.value : "");
      const qty2 = toNumber(quantity2Input ? quantity2Input.value : "");

      if (!price1Input || !quantity1Input || !unitTypeSelect || !unitInputSelect || !perBasisSelect) return;

      if (!cfg) {
        setResultError("Choose a valid quantity type.");
        return;
      }

      if (!validatePositive(price1, "product price")) return;
      if (!validatePositive(qty1, "quantity")) return;

      const unitEntry = cfg.units.find(function (u) { return u.value === unitInput; });
      if (!unitEntry) {
        setResultError("Choose a valid quantity unit.");
        return;
      }

      const perBase = toNumber(perBasisRaw);
      if (!Number.isFinite(perBase) || perBase <= 0) {
        setResultError("Choose a valid unit price basis.");
        return;
      }

      const qty1Base = qty1 * unitEntry.factorToBase;
      if (!validatePositive(qty1Base, "quantity")) return;

      const unitPricePerBase1 = (price1 / qty1Base) * perBase;

      let compareHtml = "";
      const hasAnyCompare = (Number.isFinite(price2) && price2 > 0) || (Number.isFinite(qty2) && qty2 > 0);

      if (hasAnyCompare) {
        if (!validatePositive(price2, "second product price")) return;
        if (!validatePositive(qty2, "second product quantity")) return;

        const qty2Base = qty2 * unitEntry.factorToBase;
        if (!validatePositive(qty2Base, "second product quantity")) return;

        const unitPricePerBase2 = (price2 / qty2Base) * perBase;

        const cheaper = unitPricePerBase1 < unitPricePerBase2 ? "Product 1" : "Product 2";
        const diff = Math.abs(unitPricePerBase1 - unitPricePerBase2);
        const pct = unitPricePerBase2 !== 0 ? (diff / unitPricePerBase2) * 100 : 0;

        compareHtml = `
          <hr>
          <p><strong>Comparison:</strong></p>
          <p>Product 1 unit price: <strong>${formatNumberTwoDecimals(unitPricePerBase1)}</strong> per ${perBasisSelect.options[perBasisSelect.selectedIndex].text}</p>
          <p>Product 2 unit price: <strong>${formatNumberTwoDecimals(unitPricePerBase2)}</strong> per ${perBasisSelect.options[perBasisSelect.selectedIndex].text}</p>
          <p><strong>${cheaper}</strong> is cheaper on this basis.</p>
          <p>Difference: ${formatNumberTwoDecimals(diff)} (about ${formatNumberTwoDecimals(pct)}%)</p>
        `;
      }

      const basisLabel = perBasisSelect.options[perBasisSelect.selectedIndex]
        ? perBasisSelect.options[perBasisSelect.selectedIndex].text
        : "selected unit";

      let breakdownRows = "";
      cfg.commonBreakdown.forEach(function (b) {
        const val = (price1 / qty1Base) * b.perBase;
        breakdownRows += `<li>${b.label}: <strong>${formatNumberTwoDecimals(val)}</strong></li>`;
      });

      const resultHtml = `
        <p><strong>Unit price:</strong> ${formatNumberTwoDecimals(unitPricePerBase1)} per ${basisLabel}</p>
        <p>This means if you scaled this product to ${basisLabel}, it would cost about ${formatNumberTwoDecimals(unitPricePerBase1)}.</p>
        <p><strong>Quick equivalents (Product 1):</strong></p>
        <ul>
          ${breakdownRows}
        </ul>
        ${compareHtml}
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Unit Price Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
