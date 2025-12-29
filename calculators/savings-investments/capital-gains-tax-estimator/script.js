document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const saleProceedsInput = document.getElementById("saleProceeds");
  const costBasisInput = document.getElementById("costBasis");
  const saleFeesInput = document.getElementById("saleFees");
  const purchaseFeesInput = document.getElementById("purchaseFees");
  const lossesToOffsetInput = document.getElementById("lossesToOffset");
  const gainAllowanceInput = document.getElementById("gainAllowance");
  const taxRateInput = document.getElementById("taxRate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(saleProceedsInput);
  attachLiveFormatting(costBasisInput);
  attachLiveFormatting(saleFeesInput);
  attachLiveFormatting(purchaseFeesInput);
  attachLiveFormatting(lossesToOffsetInput);
  attachLiveFormatting(gainAllowanceInput);
  attachLiveFormatting(taxRateInput);

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
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const saleProceeds = toNumber(saleProceedsInput ? saleProceedsInput.value : "");
      const costBasis = toNumber(costBasisInput ? costBasisInput.value : "");

      // Parse optional inputs (default to 0 when empty or invalid)
      const saleFeesRaw = toNumber(saleFeesInput ? saleFeesInput.value : "");
      const purchaseFeesRaw = toNumber(purchaseFeesInput ? purchaseFeesInput.value : "");
      const lossesRaw = toNumber(lossesToOffsetInput ? lossesToOffsetInput.value : "");
      const allowanceRaw = toNumber(gainAllowanceInput ? gainAllowanceInput.value : "");
      const taxRateRaw = toNumber(taxRateInput ? taxRateInput.value : "");

      const saleFees = Number.isFinite(saleFeesRaw) ? saleFeesRaw : 0;
      const purchaseFees = Number.isFinite(purchaseFeesRaw) ? purchaseFeesRaw : 0;
      const lossesToOffset = Number.isFinite(lossesRaw) ? lossesRaw : 0;
      const gainAllowance = Number.isFinite(allowanceRaw) ? allowanceRaw : 0;

      // If tax rate is missing, use a generic default
      const taxRatePercent = Number.isFinite(taxRateRaw) ? taxRateRaw : 15;

      // Input existence guard
      if (!saleProceedsInput || !costBasisInput) return;

      // Validation
      if (!validatePositive(saleProceeds, "sale proceeds")) return;
      if (!validateNonNegative(costBasis, "cost basis")) return;
      if (!validateNonNegative(saleFees, "sale fees")) return;
      if (!validateNonNegative(purchaseFees, "purchase fees")) return;
      if (!validateNonNegative(lossesToOffset, "loss offsets")) return;
      if (!validateNonNegative(gainAllowance, "gain allowance")) return;

      if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 60) {
        setResultError("Enter a valid capital gains tax rate between 0% and 60%.");
        return;
      }

      // Calculation logic
      const adjustedProceeds = saleProceeds - saleFees;
      const adjustedBasis = costBasis + purchaseFees;
      const rawGain = adjustedProceeds - adjustedBasis;

      const gainAfterLosses = rawGain - lossesToOffset;
      const gainAfterAllowance = gainAfterLosses - gainAllowance;

      const taxableGain = Math.max(0, gainAfterAllowance);
      const taxRate = taxRatePercent / 100;
      const estimatedTax = taxableGain * taxRate;

      const netProceedsAfterTax = adjustedProceeds - estimatedTax;

      const effectiveTaxOnProceeds = saleProceeds > 0 ? (estimatedTax / saleProceeds) * 100 : 0;

      // Build output HTML
      const gainLabel = rawGain >= 0 ? "Capital gain (after fees)" : "Capital loss (after fees)";
      const gainValue = Math.abs(rawGain);

      const taxableGainLine =
        taxableGain > 0
          ? `<p><strong>Taxable gain (after offsets and allowance):</strong> ${formatNumberTwoDecimals(taxableGain)}</p>`
          : `<p><strong>Taxable gain (after offsets and allowance):</strong> 0.00</p>`;

      const noteLine =
        rawGain < 0
          ? `<p><strong>Note:</strong> This estimate shows no tax because this sale is a loss. Loss usability depends on local rules.</p>`
          : `<p><strong>Note:</strong> This is a planning estimate. Replace the default rate with your expected capital gains tax rate.</p>`;

      const resultHtml = `
        <p><strong>Adjusted sale proceeds:</strong> ${formatNumberTwoDecimals(adjustedProceeds)}</p>
        <p><strong>Adjusted cost basis:</strong> ${formatNumberTwoDecimals(adjustedBasis)}</p>
        <p><strong>${gainLabel}:</strong> ${formatNumberTwoDecimals(gainValue)}</p>
        ${taxableGainLine}
        <p><strong>Estimated tax at ${formatNumberTwoDecimals(taxRatePercent)}%:</strong> ${formatNumberTwoDecimals(estimatedTax)}</p>
        <p><strong>Net proceeds after tax:</strong> ${formatNumberTwoDecimals(netProceedsAfterTax)}</p>
        <p><strong>Effective tax on sale proceeds:</strong> ${formatNumberTwoDecimals(effectiveTaxOnProceeds)}%</p>
        ${noteLine}
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
      const message = "Capital Gains Tax Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
