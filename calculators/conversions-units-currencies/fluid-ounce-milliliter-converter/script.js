document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const amountInput = document.getElementById("amount");
  const directionSelect = document.getElementById("direction");
  const ozStandardSelect = document.getElementById("ozStandard");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Amount can include commas for large values (e.g., 1,000)
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
    // Not used for this calculator.
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
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read mode-like selectors (direction and standard)
      const direction = directionSelect ? directionSelect.value : "ozToMl";
      const ozStandard = ozStandardSelect ? ozStandardSelect.value : "us";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const amount = toNumber(amountInput ? amountInput.value : "");

      // Basic existence guard
      if (!amountInput || !directionSelect || !ozStandardSelect) return;

      // Validation
      if (!validatePositive(amount, "amount")) return;

      // Calculation constants
      const ML_PER_US_FLOZ = 29.5735295625;
      const ML_PER_UK_FLOZ = 28.4130625;

      const mlPerFlOz = ozStandard === "uk" ? ML_PER_UK_FLOZ : ML_PER_US_FLOZ;

      // Calculation logic
      let converted = 0;
      let primaryLine = "";
      let roundedLine = "";
      let referenceLine = "";

      if (direction === "ozToMl") {
        converted = amount * mlPerFlOz;

        const exactMl = formatNumberTwoDecimals(converted);
        const roundedMl = Math.round(converted);

        primaryLine = `<p><strong>${formatInputWithCommas(String(amount))} fl oz</strong> ≈ <strong>${formatInputWithCommas(exactMl)} mL</strong></p>`;
        roundedLine = `<p><strong>Rounded:</strong> ${formatInputWithCommas(String(roundedMl))} mL</p>`;
        referenceLine = `<p><strong>Reference:</strong> 1 fl oz = ${formatNumberTwoDecimals(mlPerFlOz)} mL (${ozStandard === "uk" ? "UK (Imperial)" : "US"})</p>`;
      } else {
        converted = amount / mlPerFlOz;

        const exactOz = formatNumberTwoDecimals(converted);
        const roundedOz = Math.round(converted * 10) / 10;

        primaryLine = `<p><strong>${formatInputWithCommas(String(amount))} mL</strong> ≈ <strong>${formatInputWithCommas(exactOz)} fl oz</strong></p>`;
        roundedLine = `<p><strong>Rounded:</strong> ${formatInputWithCommas(String(roundedOz))} fl oz</p>`;
        referenceLine = `<p><strong>Reference:</strong> 1 fl oz = ${formatNumberTwoDecimals(mlPerFlOz)} mL (${ozStandard === "uk" ? "UK (Imperial)" : "US"})</p>`;
      }

      // Small secondary insight: quick common equivalents (kept strictly within fl oz ⇄ mL)
      let quickListHtml = "";
      if (direction === "ozToMl") {
        const commonOz = [1, 2, 4, 8, 16];
        const items = commonOz
          .map(function (oz) {
            const ml = oz * mlPerFlOz;
            return `<li>${oz} fl oz ≈ ${formatNumberTwoDecimals(ml)} mL</li>`;
          })
          .join("");
        quickListHtml = `<p><strong>Quick equivalents (same standard):</strong></p><ul>${items}</ul>`;
      } else {
        const commonMl = [30, 60, 100, 250, 500];
        const items = commonMl
          .map(function (ml) {
            const oz = ml / mlPerFlOz;
            return `<li>${ml} mL ≈ ${formatNumberTwoDecimals(oz)} fl oz</li>`;
          })
          .join("");
        quickListHtml = `<p><strong>Quick equivalents (same standard):</strong></p><ul>${items}</ul>`;
      }

      const resultHtml = primaryLine + roundedLine + referenceLine + quickListHtml;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Fluid Ounce / Milliliter Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
