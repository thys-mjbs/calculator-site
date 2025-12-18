document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaValueInput = document.getElementById("areaValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");
  const decimalsInput = document.getElementById("decimals");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(areaValueInput);
  attachLiveFormatting(decimalsInput);

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
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateUnit(value, fieldLabel) {
    if (!value) {
      setResultError("Select a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function clampDecimals(d) {
    if (!Number.isFinite(d)) return 2;
    const rounded = Math.round(d);
    if (rounded < 0) return 0;
    if (rounded > 8) return 8;
    return rounded;
  }

  function formatWithDecimals(num, decimals) {
    if (!Number.isFinite(num)) return "0";
    return num.toFixed(decimals);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const factorsToM2 = {
    mm2: 0.000001,
    cm2: 0.0001,
    m2: 1,
    km2: 1000000,
    in2: 0.00064516,
    ft2: 0.09290304,
    yd2: 0.83612736,
    acre: 4046.8564224,
    hectare: 10000,
    mi2: 2589988.110336
  };

  const unitLabels = {
    mm2: "mm²",
    cm2: "cm²",
    m2: "m²",
    km2: "km²",
    in2: "in²",
    ft2: "ft²",
    yd2: "yd²",
    acre: "acres",
    hectare: "hectares",
    mi2: "mi²"
  };

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const areaValue = toNumber(areaValueInput ? areaValueInput.value : "");
      const fromUnit = fromUnitSelect ? fromUnitSelect.value : "";
      const toUnit = toUnitSelect ? toUnitSelect.value : "";
      const decimalsRaw = toNumber(decimalsInput ? decimalsInput.value : "");

      // Basic existence guard
      if (!areaValueInput || !fromUnitSelect || !toUnitSelect) return;

      // Validation
      if (!validatePositive(areaValue, "area value")) return;
      if (!validateUnit(fromUnit, "from unit")) return;
      if (!validateUnit(toUnit, "to unit")) return;

      const fromFactor = factorsToM2[fromUnit];
      const toFactor = factorsToM2[toUnit];

      if (!Number.isFinite(fromFactor) || !Number.isFinite(toFactor) || fromFactor <= 0 || toFactor <= 0) {
        setResultError("Select valid area units to convert.");
        return;
      }

      const decimals = clampDecimals(decimalsRaw);

      // Calculation logic (base unit: m²)
      const valueInM2 = areaValue * fromFactor;
      const converted = valueInM2 / toFactor;

      // Secondary insights (quick references)
      const valueInFt2 = valueInM2 / factorsToM2.ft2;
      const valueInAcres = valueInM2 / factorsToM2.acre;

      const fromLabel = unitLabels[fromUnit] || fromUnit;
      const toLabel = unitLabels[toUnit] || toUnit;

      const convertedPretty = formatWithDecimals(converted, decimals);
      const convertedTwo = formatNumberTwoDecimals(converted);

      const m2Pretty = formatWithDecimals(valueInM2, Math.min(decimals, 6));
      const ft2Pretty = formatWithDecimals(valueInFt2, Math.min(decimals, 6));
      const acresPretty = formatWithDecimals(valueInAcres, Math.min(decimals, 6));

      const resultHtml = `
        <p><strong>Converted area:</strong> ${convertedPretty} ${toLabel}</p>
        <p><strong>Quick view (2 decimals):</strong> ${convertedTwo} ${toLabel}</p>
        <p><strong>Reference conversions:</strong></p>
        <ul>
          <li>${m2Pretty} m²</li>
          <li>${ft2Pretty} ft²</li>
          <li>${acresPretty} acres</li>
        </ul>
        <p><strong>Used precision:</strong> ${decimals} decimals</p>
        <p><strong>Input:</strong> ${formatInputWithCommas(String(areaValue))} ${fromLabel}</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Area Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
