document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const amountInput = document.getElementById("amountInput");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const roundingSelect = document.getElementById("roundingSelect");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
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
  attachLiveFormatting(amountInput);

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
  function unitLabel(unit) {
    if (unit === "tsp") return "tsp";
    if (unit === "tbsp") return "tbsp";
    return "cup";
  }

  function unitName(unit) {
    if (unit === "tsp") return "teaspoons";
    if (unit === "tbsp") return "tablespoons";
    return "cups";
  }

  function factorToTeaspoons(unit) {
    // Base: teaspoons
    // 1 tbsp = 3 tsp
    // 1 cup = 16 tbsp = 48 tsp
    if (unit === "tsp") return 1;
    if (unit === "tbsp") return 3;
    return 48;
  }

  function formatKitchenNumber(n) {
    // Keep consistent formatting. Two decimals is readable and stable across units.
    return formatNumberTwoDecimals(n);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const amount = toNumber(amountInput ? amountInput.value : "");
      const from = fromUnit ? fromUnit.value : "";
      const to = toUnit ? toUnit.value : "";

      if (!amountInput || !fromUnit || !toUnit || !roundingSelect) return;

      if (!validatePositive(amount, "amount")) return;
      if (!from || !to) {
        setResultError("Choose both a starting unit and a target unit.");
        return;
      }

      const fromFactor = factorToTeaspoons(from);
      const toFactor = factorToTeaspoons(to);

      const tspValue = amount * fromFactor;
      const exactTarget = tspValue / toFactor;

      // Always compute equivalents (exact)
      const exactTsp = tspValue;
      const exactTbsp = tspValue / 3;
      const exactCup = tspValue / 48;

      // Optional rounding (step is stored in teaspoons)
      const roundingRaw = roundingSelect ? roundingSelect.value : "none";
      let roundedTarget = exactTarget;
      let roundingNote = "";
      if (roundingRaw && roundingRaw !== "none") {
        const stepTsp = toNumber(roundingRaw);
        if (Number.isFinite(stepTsp) && stepTsp > 0) {
          const roundedTsp = Math.round(tspValue / stepTsp) * stepTsp;
          roundedTarget = roundedTsp / toFactor;
          roundingNote =
            "<p><strong>Rounded suggestion:</strong> " +
            formatKitchenNumber(roundedTarget) +
            " " +
            unitLabel(to) +
            " (rounded for easier measuring)</p>";
        }
      }

      const resultHtml =
        "<p><strong>Converted amount:</strong> " +
        formatKitchenNumber(exactTarget) +
        " " +
        unitLabel(to) +
        "</p>" +
        roundingNote +
        "<p><strong>Quick equivalents (exact):</strong></p>" +
        "<ul>" +
        "<li>" +
        formatKitchenNumber(exactTsp) +
        " tsp</li>" +
        "<li>" +
        formatKitchenNumber(exactTbsp) +
        " tbsp</li>" +
        "<li>" +
        formatKitchenNumber(exactCup) +
        " cup</li>" +
        "</ul>" +
        "<p><strong>What this means:</strong> You need " +
        formatKitchenNumber(exactTarget) +
        " " +
        unitName(to) +
        " to match " +
        formatKitchenNumber(amount) +
        " " +
        unitName(from) +
        ".</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Teaspoon/Tablespoon/Cup Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
