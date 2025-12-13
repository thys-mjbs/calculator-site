document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const valueInput = document.getElementById("valueInput");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Example:
  // const modeSelect = document.getElementById("modeSelect");
  // const modeBlockA = document.getElementById("modeBlockA");
  // const modeBlockB = document.getElementById("modeBlockB");

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
  attachLiveFormatting(valueInput);

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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const unitToGrams = {
    ug: 0.000001,
    mg: 0.001,
    g: 1,
    kg: 1000,
    t: 1000000,
    oz: 28.349523125,
    lb: 453.59237,
    st: 6350.29318,
    ust: 907184.74,
    impt: 1016046.9088
  };

  const unitLabels = {
    ug: "µg",
    mg: "mg",
    g: "g",
    kg: "kg",
    t: "t",
    oz: "oz",
    lb: "lb",
    st: "st",
    ust: "US short ton",
    impt: "Imperial long ton"
  };

  function safeExactString(n) {
    if (!Number.isFinite(n)) return "";
    if (n === 0) return "0";
    const abs = Math.abs(n);
    if (abs >= 1e9 || abs < 1e-6) return n.toExponential(8);
    return n.toPrecision(10);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const value = toNumber(valueInput ? valueInput.value : "");
      const from = fromUnit ? fromUnit.value : "";
      const to = toUnit ? toUnit.value : "";

      if (!valueInput || !fromUnit || !toUnit) return;

      if (!validateNonNegative(value, "value")) return;

      if (!unitToGrams[from] || !unitToGrams[to]) {
        setResultError("Select valid units to convert between.");
        return;
      }

      const grams = value * unitToGrams[from];
      const converted = grams / unitToGrams[to];

      const formattedTwoDecimals = formatNumberTwoDecimals(converted);
      const exact = safeExactString(converted);

      const quickKg = grams / unitToGrams["kg"];
      const quickG = grams / unitToGrams["g"];
      const quickLb = grams / unitToGrams["lb"];
      const quickOz = grams / unitToGrams["oz"];

      const resultHtml =
        `<p><strong>Converted:</strong> ${formattedTwoDecimals} ${unitLabels[to] || ""}</p>` +
        `<p><strong>Exact:</strong> ${exact} ${unitLabels[to] || ""}</p>` +
        `<p><strong>Quick equivalents:</strong></p>` +
        `<ul>` +
        `<li>${formatNumberTwoDecimals(quickKg)} kg</li>` +
        `<li>${formatNumberTwoDecimals(quickG)} g</li>` +
        `<li>${formatNumberTwoDecimals(quickLb)} lb</li>` +
        `<li>${formatNumberTwoDecimals(quickOz)} oz</li>` +
        `</ul>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Weight/Mass Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
