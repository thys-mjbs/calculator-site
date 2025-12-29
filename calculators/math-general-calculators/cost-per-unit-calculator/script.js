document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const priceAInput = document.getElementById("priceA");
  const quantityAInput = document.getElementById("quantityA");
  const unitNameInput = document.getElementById("unitName");

  const priceBInput = document.getElementById("priceB");
  const quantityBInput = document.getElementById("quantityB");

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
  attachLiveFormatting(priceAInput);
  attachLiveFormatting(quantityAInput);
  attachLiveFormatting(priceBInput);
  attachLiveFormatting(quantityBInput);

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
    // Not used
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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const priceA = toNumber(priceAInput ? priceAInput.value : "");
      const qtyA = toNumber(quantityAInput ? quantityAInput.value : "");
      const priceB = toNumber(priceBInput ? priceBInput.value : "");
      const qtyB = toNumber(quantityBInput ? quantityBInput.value : "");
      const unitNameRaw = unitNameInput ? (unitNameInput.value || "").trim() : "";

      // Basic existence guard
      if (!priceAInput || !quantityAInput) return;

      // Validation for required inputs
      if (!validatePositive(priceA, "total price for Option A")) return;
      if (!validatePositive(qtyA, "quantity for Option A")) return;

      // Optional comparison: if either B value is entered, require both
      const bPriceEntered = priceBInput && (priceBInput.value || "").trim() !== "";
      const bQtyEntered = quantityBInput && (quantityBInput.value || "").trim() !== "";
      const useCompareB = bPriceEntered || bQtyEntered;

      if (useCompareB) {
        if (!validatePositive(priceB, "total price for Option B")) return;
        if (!validatePositive(qtyB, "quantity for Option B")) return;
      }

      const unitName = unitNameRaw ? unitNameRaw : "unit";

      // Calculation logic
      const unitCostA = priceA / qtyA;
      const per100A = unitCostA * 100;
      const per1000A = unitCostA * 1000;

      let compareHtml = "";
      if (useCompareB) {
        const unitCostB = priceB / qtyB;
        const per100B = unitCostB * 100;
        const per1000B = unitCostB * 1000;

        let winnerText = "";
        let savingsPerUnit = 0;
        let savingsPercent = 0;

        if (unitCostA === unitCostB) {
          winnerText = "Both options have the same cost per " + unitName + ".";
        } else {
          const cheaper = unitCostA < unitCostB ? "A" : "B";
          const higher = unitCostA < unitCostB ? unitCostB : unitCostA;
          const lower = unitCostA < unitCostB ? unitCostA : unitCostB;

          savingsPerUnit = higher - lower;
          savingsPercent = (savingsPerUnit / higher) * 100;

          winnerText =
            "Option " +
            cheaper +
            " is better value by " +
            formatNumberTwoDecimals(savingsPercent) +
            "% per " +
            unitName +
            ".";
        }

        compareHtml = `
          <hr class="result-sep">
          <p><strong>Option B cost per ${unitName}:</strong> ${formatNumberTwoDecimals(unitCostB)} per ${unitName}</p>
          <p><strong>Option B per 100 ${unitName}:</strong> ${formatNumberTwoDecimals(per100B)} per 100 ${unitName}</p>
          <p><strong>Option B per 1,000 ${unitName}:</strong> ${formatNumberTwoDecimals(per1000B)} per 1,000 ${unitName}</p>
          <p><strong>Comparison:</strong> ${winnerText}</p>
        `;
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Option A cost per ${unitName}:</strong> ${formatNumberTwoDecimals(unitCostA)} per ${unitName}</p>
        <p><strong>Option A per 100 ${unitName}:</strong> ${formatNumberTwoDecimals(per100A)} per 100 ${unitName}</p>
        <p><strong>Option A per 1,000 ${unitName}:</strong> ${formatNumberTwoDecimals(per1000A)} per 1,000 ${unitName}</p>
        ${compareHtml}
      `;

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
      const message = "Cost per Unit Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
