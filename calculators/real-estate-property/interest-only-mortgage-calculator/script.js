document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAmountInput = document.getElementById("loanAmount");
  const annualRateInput = document.getElementById("annualRate");
  const paymentFrequencySelect = document.getElementById("paymentFrequency");
  const ioYearsInput = document.getElementById("ioYears");
  const comparisonTermYearsInput = document.getElementById("comparisonTermYears");
  const monthlyExtrasInput = document.getElementById("monthlyExtras");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

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
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(ioYearsInput);
  attachLiveFormatting(comparisonTermYearsInput);
  attachLiveFormatting(monthlyExtrasInput);

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
      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const annualRatePct = toNumber(annualRateInput ? annualRateInput.value : "");
      const frequency = paymentFrequencySelect ? paymentFrequencySelect.value : "monthly";

      const ioYearsRaw = toNumber(ioYearsInput ? ioYearsInput.value : "");
      const termYearsRaw = toNumber(comparisonTermYearsInput ? comparisonTermYearsInput.value : "");
      const monthlyExtras = toNumber(monthlyExtrasInput ? monthlyExtrasInput.value : "");

      // Basic existence guard
      if (!loanAmountInput || !annualRateInput || !paymentFrequencySelect) return;

      // Validation (required)
      if (!validatePositive(loanAmount, "loan amount")) return;
      if (!validatePositive(annualRatePct, "interest rate")) return;

      // Optional inputs with defaults
      const ioYears = Number.isFinite(ioYearsRaw) && ioYearsRaw > 0 ? ioYearsRaw : 5;
      const termYears = Number.isFinite(termYearsRaw) && termYearsRaw > 0 ? termYearsRaw : 30;

      if (!validateNonNegative(monthlyExtras, "monthly extras")) return;

      // Frequency config
      let paymentsPerYear = 12;
      let periodLabel = "month";
      if (frequency === "biweekly") {
        paymentsPerYear = 26;
        periodLabel = "2 weeks";
      } else if (frequency === "weekly") {
        paymentsPerYear = 52;
        periodLabel = "week";
      }

      const annualRate = annualRatePct / 100;
      const periodicRate = annualRate / paymentsPerYear;

      // Interest-only payment per period (principal does not change)
      const interestOnlyPayment = loanAmount * periodicRate;

      // Total interest over the interest-only period
      const totalInterestIoPeriod = interestOnlyPayment * paymentsPerYear * ioYears;

      // Convert monthly extras to per-payment extras for selected frequency
      const extrasPerPayment = (monthlyExtras * 12) / paymentsPerYear;
      const allInPerPayment = interestOnlyPayment + extrasPerPayment;

      // Monthly view (always helpful)
      const monthlyInterestOnlyPayment = loanAmount * (annualRate / 12);
      const monthlyAllIn = monthlyInterestOnlyPayment + monthlyExtras;

      // Repayment comparison (monthly amortizing payment)
      const n = termYears * 12;
      const r = annualRate / 12;

      let amortMonthly = 0;
      if (r === 0) {
        amortMonthly = loanAmount / n;
      } else {
        amortMonthly = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
      }

      const monthlyDifference = amortMonthly - monthlyInterestOnlyPayment;
      const firstYearInterestOnly = monthlyInterestOnlyPayment * 12;

      // Build output HTML
      const resultHtml = `
        <p><strong>Interest-only payment (per ${periodLabel}):</strong> ${formatNumberTwoDecimals(interestOnlyPayment)}</p>
        <p><strong>Estimated all-in (per ${periodLabel}, incl. extras):</strong> ${formatNumberTwoDecimals(allInPerPayment)}</p>

        <hr>

        <p><strong>Interest-only payment (monthly):</strong> ${formatNumberTwoDecimals(monthlyInterestOnlyPayment)}</p>
        <p><strong>Estimated all-in (monthly, incl. extras):</strong> ${formatNumberTwoDecimals(monthlyAllIn)}</p>

        <hr>

        <p><strong>Estimated total interest over ${ioYears} years (interest-only phase):</strong> ${formatNumberTwoDecimals(totalInterestIoPeriod)}</p>
        <p><strong>Estimated interest paid in the first year (interest-only):</strong> ${formatNumberTwoDecimals(firstYearInterestOnly)}</p>

        <hr>

        <p><strong>Repayment comparison (standard ${termYears}-year mortgage, monthly):</strong> ${formatNumberTwoDecimals(amortMonthly)}</p>
        <p><strong>Difference vs interest-only (monthly):</strong> ${formatNumberTwoDecimals(monthlyDifference)}</p>
        <p style="margin-top:8px;">Lower interest-only payments improve short-term cash flow, but the principal balance stays unchanged during the interest-only phase.</p>
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
      const message = "Interest-Only Mortgage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
