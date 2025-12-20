document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const purchasePriceInput = document.getElementById("purchasePrice");
  const transferTaxPercentInput = document.getElementById("transferTaxPercent");
  const legalFeePercentInput = document.getElementById("legalFeePercent");
  const registrationFeesInput = document.getElementById("registrationFees");
  const loanAmountInput = document.getElementById("loanAmount");
  const bondRegPercentInput = document.getElementById("bondRegPercent");
  const otherCostsInput = document.getElementById("otherCosts");

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
  attachLiveFormatting(purchasePriceInput);
  attachLiveFormatting(transferTaxPercentInput);
  attachLiveFormatting(legalFeePercentInput);
  attachLiveFormatting(registrationFeesInput);
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(bondRegPercentInput);
  attachLiveFormatting(otherCostsInput);

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

  function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const purchasePrice = toNumber(purchasePriceInput ? purchasePriceInput.value : "");
      const transferTaxPercentRaw = toNumber(transferTaxPercentInput ? transferTaxPercentInput.value : "");
      const legalFeePercentRaw = toNumber(legalFeePercentInput ? legalFeePercentInput.value : "");
      const registrationFees = toNumber(registrationFeesInput ? registrationFeesInput.value : "");
      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const bondRegPercentRaw = toNumber(bondRegPercentInput ? bondRegPercentInput.value : "");
      const otherCosts = toNumber(otherCostsInput ? otherCostsInput.value : "");

      if (!validatePositive(purchasePrice, "purchase price")) return;

      if (!validateNonNegative(registrationFees, "registration and admin fees")) return;
      if (!validateNonNegative(loanAmount, "loan amount")) return;
      if (!validateNonNegative(otherCosts, "other fixed costs")) return;

      const transferTaxPercent = clampPercent(transferTaxPercentRaw);
      const legalFeePercent = clampPercent(legalFeePercentRaw);
      const bondRegPercent = clampPercent(bondRegPercentRaw);

      const transferTax = purchasePrice * (transferTaxPercent / 100);
      const legalFees = purchasePrice * (legalFeePercent / 100);
      const bondRegistrationCosts = loanAmount > 0 ? loanAmount * (bondRegPercent / 100) : 0;

      const totalCosts = transferTax + legalFees + registrationFees + bondRegistrationCosts + otherCosts;

      const totalAsPercentOfPrice = (totalCosts / purchasePrice) * 100;
      const monthlyEquivalent12 = totalCosts / 12;

      function fmt(n) {
        return formatNumberTwoDecimals(n);
      }

      function pctOfPrice(amount) {
        if (purchasePrice <= 0) return "0.00";
        return formatNumberTwoDecimals((amount / purchasePrice) * 100);
      }

      const resultHtml = `
        <p><strong>Estimated total transfer and closing costs:</strong> ${fmt(totalCosts)}</p>
        <ul>
          <li><strong>Transfer tax or duty:</strong> ${fmt(transferTax)} (${pctOfPrice(transferTax)}% of price)</li>
          <li><strong>Legal or conveyancing fees:</strong> ${fmt(legalFees)} (${pctOfPrice(legalFees)}% of price)</li>
          <li><strong>Deeds registration and admin fees:</strong> ${fmt(registrationFees)} (${pctOfPrice(registrationFees)}% of price)</li>
          <li><strong>Bond or mortgage registration costs:</strong> ${fmt(bondRegistrationCosts)} (${pctOfPrice(bondRegistrationCosts)}% of price)</li>
          <li><strong>Other fixed costs:</strong> ${fmt(otherCosts)} (${pctOfPrice(otherCosts)}% of price)</li>
        </ul>
        <p><strong>Secondary insight:</strong> Total costs are about ${formatNumberTwoDecimals(totalAsPercentOfPrice)}% of the purchase price.</p>
        <p><strong>Budget lens:</strong> Spread over 12 months, that is roughly ${fmt(monthlyEquivalent12)} per month (for planning only).</p>
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
      const message = "Property Transfer Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
