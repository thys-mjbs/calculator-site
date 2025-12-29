document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const helocBalanceInput = document.getElementById("helocBalance");
  const annualRateInput = document.getElementById("annualRate");
  const repaymentTermYearsInput = document.getElementById("repaymentTermYears");
  const roundToNearestInput = document.getElementById("roundToNearestRand");

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
  attachLiveFormatting(helocBalanceInput);
  attachLiveFormatting(annualRateInput);
  attachLiveFormatting(repaymentTermYearsInput);
  attachLiveFormatting(roundToNearestInput);

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

  function roundToStep(amount, step) {
    if (!Number.isFinite(step) || step <= 0) return amount;
    return Math.round(amount / step) * step;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const balance = toNumber(helocBalanceInput ? helocBalanceInput.value : "");
      const aprPercent = toNumber(annualRateInput ? annualRateInput.value : "");
      const repaymentYearsRaw = toNumber(repaymentTermYearsInput ? repaymentTermYearsInput.value : "");
      const roundStepRaw = toNumber(roundToNearestInput ? roundToNearestInput.value : "");

      // Basic existence guard
      if (!helocBalanceInput || !annualRateInput) return;

      // Validation
      if (!validatePositive(balance, "HELOC balance")) return;
      if (!validateNonNegative(aprPercent, "annual interest rate")) return;

      // Defaults for optional fields
      const repaymentYears = Number.isFinite(repaymentYearsRaw) && repaymentYearsRaw > 0 ? repaymentYearsRaw : 10;
      const roundStep = Number.isFinite(roundStepRaw) && roundStepRaw > 0 ? roundStepRaw : 0;

      // Calculation logic
      const monthlyRate = (aprPercent / 100) / 12;

      // Interest-only payment (common during draw period)
      const interestOnlyPayment = monthlyRate === 0 ? 0 : (balance * monthlyRate);

      // Repayment (principal + interest) estimate over repaymentYears
      const n = Math.round(repaymentYears * 12);
      let amortizedPayment = 0;

      if (n <= 0) {
        setResultError("Enter a valid repayment term greater than 0 years (or leave it blank).");
        return;
      }

      if (monthlyRate === 0) {
        amortizedPayment = balance / n;
      } else {
        const factor = Math.pow(1 + monthlyRate, -n);
        amortizedPayment = balance * monthlyRate / (1 - factor);
      }

      // Optional rounding
      const interestOnlyRounded = roundToStep(interestOnlyPayment, roundStep);
      const amortizedRounded = roundToStep(amortizedPayment, roundStep);

      // Supporting figures
      const firstMonthInterest = interestOnlyPayment;
      const totalInterestRepayment = Math.max(0, (amortizedPayment * n) - balance);

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated interest-only payment (this month):</strong> ${formatNumberTwoDecimals(interestOnlyRounded)}</p>
        <p><strong>Estimated repayment-phase payment (principal + interest):</strong> ${formatNumberTwoDecimals(amortizedRounded)} <span style="color:#555;">(over ${n} months)</span></p>
        <p><strong>Monthly interest rate used:</strong> ${(monthlyRate * 100).toFixed(4)}%</p>
        <p><strong>First-month interest on current balance:</strong> ${formatNumberTwoDecimals(firstMonthInterest)}</p>
        <p><strong>Estimated total interest if repaid over ${n} months:</strong> ${formatNumberTwoDecimals(totalInterestRepayment)}</p>
        <p style="color:#555; margin-top:10px;">
          Note: HELOC payments can vary by lender rules, daily balance changes, and rate updates. This is a planning estimate using the rate and balance you entered.
        </p>
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
      const message = "HELOC Payment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
