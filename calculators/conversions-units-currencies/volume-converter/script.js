document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const volumeValue = document.getElementById("volumeValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const swapUnitsButton = document.getElementById("swapUnitsButton");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(volumeValue);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------

  const unitLabels = {
    l: "Liters (L)",
    ml: "Milliliters (mL)",
    m3: "Cubic meters (m³)",
    cm3: "Cubic centimeters (cm³)",
    us_gal: "US gallons (gal)",
    us_qt: "US quarts (qt)",
    us_pt: "US pints (pt)",
    us_floz: "US fluid ounces (fl oz)",
    imp_gal: "Imperial gallons (UK gal)",
    imp_qt: "Imperial quarts (UK qt)",
    imp_pt: "Imperial pints (UK pt)",
    imp_floz: "Imperial fluid ounces (UK fl oz)",
    cup_us: "Cups (US)",
    tbsp_us: "Tablespoons (US)",
    tsp_us: "Teaspoons (US)"
  };

  // Factors to liters
  const toLitersFactor = {
    l: 1,
    ml: 0.001,
    m3: 1000,
    cm3: 0.001,

    us_gal: 3.785411784,
    us_qt: 0.946352946,
    us_pt: 0.473176473,
    us_floz: 0.0295735295625,

    imp_gal: 4.54609,
    imp_qt: 1.1365225,
    imp_pt: 0.56826125,
    imp_floz: 0.0284130625,

    cup_us: 0.2365882365,
    tbsp_us: 0.01478676478125,
    tsp_us: 0.00492892159375
  };

  function safeExactString(num) {
    if (!Number.isFinite(num)) return "";
    const abs = Math.abs(num);
    if (abs === 0) return "0";
    if (abs >= 1e9 || abs < 1e-6) return num.toExponential(10);
    return num.toPrecision(12);
  }

  if (swapUnitsButton && fromUnit && toUnit) {
    swapUnitsButton.addEventListener("click", function () {
      const tmp = fromUnit.value;
      fromUnit.value = toUnit.value;
      toUnit.value = tmp;
      clearResult();
    });
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const value = toNumber(volumeValue ? volumeValue.value : "");
      const from = fromUnit ? fromUnit.value : "";
      const to = toUnit ? toUnit.value : "";

      if (!volumeValue || !fromUnit || !toUnit) return;

      if (!validatePositive(value, "value")) return;

      if (!toLitersFactor[from] || !toLitersFactor[to]) {
        setResultError("Select valid units for both From and To.");
        return;
      }

      const liters = value * toLitersFactor[from];
      const converted = liters / toLitersFactor[to];

      const rounded = formatNumberTwoDecimals(converted);
      const exact = safeExactString(converted);

      const fromLabel = unitLabels[from] || from;
      const toLabel = unitLabels[to] || to;

      const resultHtml = `
        <p><strong>Converted:</strong> ${rounded} (${toLabel})</p>
        <p><strong>Higher precision:</strong> ${exact} (${toLabel})</p>
        <p><strong>Input:</strong> ${safeExactString(value)} (${fromLabel})</p>
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
      const message = "Volume Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
