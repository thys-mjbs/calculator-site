document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentBalanceInput = document.getElementById("currentBalance");
  const drawAprInput = document.getElementById("drawApr");
  const drawYearsInput = document.getElementById("drawYears");
  const repaymentYearsInput = document.getElementById("repaymentYears");
  const endOfDrawBalanceInput = document.getElementById("endOfDrawBalance");
  const repaymentAprInput = document.getElementById("repaymentApr");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like fields and term fields (commas are fine for large numbers)
  attachLiveFormatting(currentBalanceInput);
  attachLiveFormatting(drawYearsInput);
  attachLiveFormatting(repaymentYearsInput);
  attachLiveFormatting(endOfDrawBalanceInput);

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

  function validateAprPercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    if (value > 60) {
      setResultError(fieldLabel + " looks unrealistically high. Enter an APR of 60% or less.");
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

      // Parse inputs using toNumber() (from /scripts/main.js)
      const currentBalance = toNumber(currentBalanceInput ? currentBalanceInput.value : "");
      const drawAprPercent = toNumber(drawAprInput ? drawAprInput.value : "");
      const drawYearsRaw = toNumber(drawYearsInput ? drawYearsInput.value : "");
      const repaymentYearsRaw = toNumber(repaymentYearsInput ? repaymentYearsInput.value : "");
      const endOfDrawBalanceRaw = toNumber(endOfDrawBalanceInput ? endOfDrawBalanceInput.value : "");
      const repaymentAprPercentRaw = toNumber(repaymentAprInput ? repaymentAprInput.value : "");

      // Basic existence guard
      if (!currentBalanceInput || !drawAprInput || !drawYearsInput || !repaymentYearsInput) return;

      // Required validations
      if (!validatePositive(currentBalance, "current HELOC balance")) return;
      if (!validateAprPercent(drawAprPercent, "draw period APR")) return;

      // Defaults (optional fields)
      const drawYears = Number.isFinite(drawYearsRaw) && drawYearsRaw > 0 ? drawYearsRaw : 10;
      const repaymentYears = Number.isFinite(repaymentYearsRaw) && repaymentYearsRaw > 0 ? repaymentYearsRaw : 20;

      if (drawYears > 30) {
        setResultError("Draw period length looks too long. Enter 30 years or less.");
        return;
      }
      if (repaymentYears > 40) {
        setResultError("Repayment period length looks too long. Enter 40 years or less.");
        return;
      }

      // Advanced defaults
      const endOfDrawBalance = Number.isFinite(endOfDrawBalanceRaw) && endOfDrawBalanceRaw > 0
        ? endOfDrawBalanceRaw
        : currentBalance;

      if (!validatePositive(endOfDrawBalance, "end of draw balance")) return;

      const repaymentAprPercent = Number.isFinite(repaymentAprPercentRaw) && repaymentAprPercentRaw > 0
        ? repaymentAprPercentRaw
        : drawAprPercent;

      if (!validateAprPercent(repaymentAprPercent, "repayment period APR")) return;

      // Convert APR to monthly rates
      const drawMonthlyRate = (drawAprPercent / 100) / 12;
      const repayMonthlyRate = (repaymentAprPercent / 100) / 12;

      const drawMonths = Math.round(drawYears * 12);
      const repayMonths = Math.round(repaymentYears * 12);

      // Draw period: interest-only estimate (minimum payment)
      const drawMonthlyInterestOnly = endOfDrawBalance * drawMonthlyRate;
      const drawTotalInterest = drawMonthlyInterestOnly * drawMonths;

      // Repayment period: amortizing payment
      let repaymentMonthlyPayment = 0;
      let repaymentTotalPaid = 0;
      let repaymentTotalInterest = 0;

      if (repayMonthlyRate === 0) {
        repaymentMonthlyPayment = endOfDrawBalance / repayMonths;
        repaymentTotalPaid = repaymentMonthlyPayment * repayMonths;
        repaymentTotalInterest = 0;
      } else {
        const r = repayMonthlyRate;
        const n = repayMonths;
        const pv = endOfDrawBalance;
        const factor = Math.pow(1 + r, n);

        repaymentMonthlyPayment = pv * (r * factor) / (factor - 1);
        repaymentTotalPaid = repaymentMonthlyPayment * n;
        repaymentTotalInterest = repaymentTotalPaid - pv;
      }

      // Payment jump insight
      const paymentIncrease = repaymentMonthlyPayment - drawMonthlyInterestOnly;
      const paymentIncreasePct = drawMonthlyInterestOnly > 0
        ? (paymentIncrease / drawMonthlyInterestOnly) * 100
        : 0;

      const combinedInterest = drawTotalInterest + repaymentTotalInterest;
      const combinedPaid = drawTotalInterest + repaymentTotalPaid; // draw phase assumes interest-only payments only

      // Output formatting helpers
      const drawPayFmt = formatNumberTwoDecimals(drawMonthlyInterestOnly);
      const drawInterestFmt = formatNumberTwoDecimals(drawTotalInterest);

      const repayPayFmt = formatNumberTwoDecimals(repaymentMonthlyPayment);
      const repayInterestFmt = formatNumberTwoDecimals(repaymentTotalInterest);
      const repayTotalFmt = formatNumberTwoDecimals(repaymentTotalPaid);

      const combinedInterestFmt = formatNumberTwoDecimals(combinedInterest);
      const combinedPaidFmt = formatNumberTwoDecimals(combinedPaid);

      const paymentIncreaseFmt = formatNumberTwoDecimals(Math.abs(paymentIncrease));
      const paymentIncreaseDirection = paymentIncrease >= 0 ? "higher" : "lower";

      const endBalFmt = formatNumberTwoDecimals(endOfDrawBalance);

      const resultHtml = `
        <p><strong>Estimated draw period payment (interest-only):</strong> ${drawPayFmt} per month</p>
        <p><strong>Estimated draw period interest cost:</strong> ${drawInterestFmt} over ${drawMonths} months</p>

        <p><strong>Estimated repayment period payment (principal + interest):</strong> ${repayPayFmt} per month</p>
        <p><strong>Estimated repayment period interest cost:</strong> ${repayInterestFmt} over ${repayMonths} months</p>

        <p><strong>Payment change at repayment start:</strong> ${paymentIncreaseFmt} ${paymentIncreaseDirection} per month
        ${drawMonthlyInterestOnly > 0 ? `(${formatNumberTwoDecimals(Math.abs(paymentIncreasePct))}% change)` : ""}</p>

        <p><strong>Balance entering repayment (assumed):</strong> ${endBalFmt}</p>

        <p><strong>Combined interest (draw + repayment):</strong> ${combinedInterestFmt}</p>
        <p><strong>Combined payments made (draw interest + full repayment):</strong> ${combinedPaidFmt}</p>

        <p><em>Note:</em> Draw totals assume an interest-only minimum payment and a constant balance during the draw period.</p>
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
      const message = "HELOC Draw vs Repayment Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
