document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const principalInput = document.getElementById("principal");
  const annualRateInput = document.getElementById("annualRate");
  const termYearsInput = document.getElementById("termYears");
  const frequencySelect = document.getElementById("frequency");

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
  attachLiveFormatting(principalInput);
  attachLiveFormatting(termYearsInput);

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
    // not used
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
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(principalInput ? principalInput.value : "");
      const annualRatePercent = toNumber(annualRateInput ? annualRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");
      const frequency = frequencySelect ? frequencySelect.value : "monthly";

      // Basic existence guard
      if (!principalInput || !annualRateInput || !termYearsInput || !frequencySelect) return;

      // Validation
      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(annualRatePercent, "annual interest rate")) return;
      if (!validatePositive(termYears, "loan term")) return;

      const periodsPerYearMap = {
        monthly: 12,
        biweekly: 26,
        weekly: 52,
        annual: 1
      };

      const periodsPerYear = periodsPerYearMap[frequency] || 12;

      const annualRate = annualRatePercent / 100;
      const ratePerPeriod = annualRate / periodsPerYear;
      const numberOfPayments = Math.round(termYears * periodsPerYear);

      // Calculation logic (interest-only: payment = principal * ratePerPeriod)
      const paymentPerPeriod = principal * ratePerPeriod;
      const totalInterest = paymentPerPeriod * numberOfPayments;

      // Cash outflow comparison
      const totalPaidInterestOnly = totalInterest;
      const balloonDueEnd = principal;
      const totalCostIncludingBalloon = totalInterest + balloonDueEnd;

      const perYearInterest = principal * annualRate;

      const frequencyLabelMap = {
        monthly: "month",
        biweekly: "2 weeks",
        weekly: "week",
        annual: "year"
      };

      const freqLabel = frequencyLabelMap[frequency] || "month";

      const resultHtml = `
        <p><strong>Interest-only payment (per ${freqLabel}):</strong> ${formatNumberTwoDecimals(paymentPerPeriod)}</p>
        <p><strong>Total interest over ${formatNumberTwoDecimals(termYears)} years:</strong> ${formatNumberTwoDecimals(totalInterest)}</p>
        <p><strong>Balloon balance due at end:</strong> ${formatNumberTwoDecimals(balloonDueEnd)}</p>
        <hr>
        <p><strong>Total paid (interest-only payments):</strong> ${formatNumberTwoDecimals(totalPaidInterestOnly)}</p>
        <p><strong>Total cost including balloon payoff:</strong> ${formatNumberTwoDecimals(totalCostIncludingBalloon)}</p>
        <p><strong>Approx interest per year:</strong> ${formatNumberTwoDecimals(perYearInterest)}</p>
        <p style="margin-top:10px;"><em>Note: Interest-only payments do not reduce the principal. Plan for the balloon payoff or a refinance at the end.</em></p>
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
      const message = "Interest-Only Loan Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
