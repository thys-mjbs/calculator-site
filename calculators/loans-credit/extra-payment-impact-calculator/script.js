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
  const termYearsInput = document.getElementById("termYears");
  const extraMonthlyInput = document.getElementById("extraMonthly");
  const extraStartMonthInput = document.getElementById("extraStartMonth");
  const lumpSumAmountInput = document.getElementById("lumpSumAmount");
  const lumpSumMonthInput = document.getElementById("lumpSumMonth");

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
  attachLiveFormatting(extraMonthlyInput);
  attachLiveFormatting(lumpSumAmountInput);

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

  function formatMoney(value) {
    return formatNumberTwoDecimals(value);
  }

  function monthsToYearsMonths(totalMonths) {
    const m = Math.max(0, Math.round(totalMonths));
    const years = Math.floor(m / 12);
    const months = m % 12;
    if (years <= 0) return months + " months";
    if (months === 0) return years + " years";
    return years + " years " + months + " months";
  }

  function calcMonthlyPayment(principal, monthlyRate, months) {
    if (months <= 0) return NaN;
    if (monthlyRate === 0) return principal / months;
    const pow = Math.pow(1 + monthlyRate, months);
    return principal * (monthlyRate * pow) / (pow - 1);
  }

  function simulateLoan(params) {
    const principal = params.principal;
    const monthlyRate = params.monthlyRate;
    const scheduledPayment = params.scheduledPayment;
    const extraMonthly = params.extraMonthly;
    const extraStartMonth = params.extraStartMonth;
    const lumpSumAmount = params.lumpSumAmount;
    const lumpSumMonth = params.lumpSumMonth;

    let balance = principal;
    let month = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    // Safety cap to avoid infinite loops from bad inputs
    const hardCapMonths = Math.max(12, Math.round(params.termMonths) * 10);

    while (balance > 0 && month < hardCapMonths) {
      month += 1;

      const interest = balance * monthlyRate;
      totalInterest += interest;

      let paymentThisMonth = scheduledPayment;

      // Extra monthly payment starting from a given month
      if (extraMonthly > 0 && month >= extraStartMonth) {
        paymentThisMonth += extraMonthly;
      }

      // One-time lump sum payment in a specific month
      if (lumpSumAmount > 0 && lumpSumMonth > 0 && month === lumpSumMonth) {
        paymentThisMonth += lumpSumAmount;
      }

      // If the scheduled payment does not cover interest, the balance grows (negative amortization)
      if (paymentThisMonth <= interest && monthlyRate > 0) {
        return {
          ok: false,
          error: "Your payment (including extras) is not enough to cover the monthly interest. Increase extra payments or check the interest rate/term."
        };
      }

      // Apply payment
      let principalPaid = paymentThisMonth - interest;

      // Final month adjustment
      if (principalPaid >= balance) {
        principalPaid = balance;
        paymentThisMonth = interest + principalPaid;
      }

      balance = balance - principalPaid;
      totalPaid += paymentThisMonth;
    }

    if (balance > 0) {
      return {
        ok: false,
        error: "The loan did not pay off within a reasonable timeframe. Check inputs and try again."
      };
    }

    return {
      ok: true,
      months: month,
      totalInterest: totalInterest,
      totalPaid: totalPaid
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const annualRatePct = toNumber(annualRateInput ? annualRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");

      const extraMonthlyRaw = toNumber(extraMonthlyInput ? extraMonthlyInput.value : "");
      const extraStartMonthRaw = toNumber(extraStartMonthInput ? extraStartMonthInput.value : "");

      const lumpSumAmountRaw = toNumber(lumpSumAmountInput ? lumpSumAmountInput.value : "");
      const lumpSumMonthRaw = toNumber(lumpSumMonthInput ? lumpSumMonthInput.value : "");

      // Basic existence guard
      if (!loanAmountInput || !annualRateInput || !termYearsInput) return;

      // Validation (required)
      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(annualRatePct, "annual interest rate")) return;
      if (!validatePositive(termYears, "loan term")) return;

      // Optional inputs defaults
      const extraMonthly = Number.isFinite(extraMonthlyRaw) && extraMonthlyRaw > 0 ? extraMonthlyRaw : 0;
      const extraStartMonth = Number.isFinite(extraStartMonthRaw) && extraStartMonthRaw > 0 ? Math.floor(extraStartMonthRaw) : 1;

      const lumpSumAmount = Number.isFinite(lumpSumAmountRaw) && lumpSumAmountRaw > 0 ? lumpSumAmountRaw : 0;
      const lumpSumMonth = Number.isFinite(lumpSumMonthRaw) && lumpSumMonthRaw > 0 ? Math.floor(lumpSumMonthRaw) : 0;

      if (!validateNonNegative(extraMonthly, "extra monthly payment")) return;
      if (!validateNonNegative(lumpSumAmount, "lump sum amount")) return;
      if (!validateNonNegative(extraStartMonth, "start month")) return;
      if (!validateNonNegative(lumpSumMonth, "lump sum month")) return;

      const termMonths = Math.round(termYears * 12);
      if (!Number.isFinite(termMonths) || termMonths <= 0) {
        setResultError("Enter a valid loan term in years (greater than 0).");
        return;
      }

      const monthlyRate = (annualRatePct / 100) / 12;

      // Calculate baseline payment
      const scheduledPayment = calcMonthlyPayment(principal, monthlyRate, termMonths);
      if (!Number.isFinite(scheduledPayment) || scheduledPayment <= 0) {
        setResultError("Could not calculate a valid monthly payment. Check your loan inputs.");
        return;
      }

      // Run baseline and accelerated simulations
      const baseline = simulateLoan({
        principal: principal,
        monthlyRate: monthlyRate,
        scheduledPayment: scheduledPayment,
        extraMonthly: 0,
        extraStartMonth: 1,
        lumpSumAmount: 0,
        lumpSumMonth: 0,
        termMonths: termMonths
      });

      if (!baseline.ok) {
        setResultError(baseline.error);
        return;
      }

      const accelerated = simulateLoan({
        principal: principal,
        monthlyRate: monthlyRate,
        scheduledPayment: scheduledPayment,
        extraMonthly: extraMonthly,
        extraStartMonth: extraStartMonth,
        lumpSumAmount: lumpSumAmount,
        lumpSumMonth: lumpSumMonth,
        termMonths: termMonths
      });

      if (!accelerated.ok) {
        setResultError(accelerated.error);
        return;
      }

      const monthsSaved = baseline.months - accelerated.months;
      const interestSaved = baseline.totalInterest - accelerated.totalInterest;
      const totalPaidSaved = baseline.totalPaid - accelerated.totalPaid;

      const effectiveMonthlyOutflow = scheduledPayment + extraMonthly;
      const hasAnyExtras = extraMonthly > 0 || (lumpSumAmount > 0 && lumpSumMonth > 0);

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row"><span><strong>Standard monthly payment:</strong></span><span>${formatMoney(scheduledPayment)}</span></div>
          <div class="result-row"><span><strong>Baseline payoff time:</strong></span><span>${monthsToYearsMonths(baseline.months)}</span></div>
          <div class="result-row"><span><strong>Baseline total interest:</strong></span><span>${formatMoney(baseline.totalInterest)}</span></div>
          <hr class="calc-divider">
          <div class="result-row"><span><strong>Payoff time with extras:</strong></span><span>${monthsToYearsMonths(accelerated.months)}</span></div>
          <div class="result-row"><span><strong>Total interest with extras:</strong></span><span>${formatMoney(accelerated.totalInterest)}</span></div>
          <hr class="calc-divider">
          <div class="result-row"><span><strong>Time saved:</strong></span><span>${monthsSaved > 0 ? monthsToYearsMonths(monthsSaved) : "0 months"}</span></div>
          <div class="result-row"><span><strong>Interest saved:</strong></span><span>${interestSaved > 0 ? formatMoney(interestSaved) : formatMoney(0)}</span></div>
          <div class="result-row"><span><strong>Total payments avoided:</strong></span><span>${totalPaidSaved > 0 ? formatMoney(totalPaidSaved) : formatMoney(0)}</span></div>
        </div>
        <div class="result-note">
          ${hasAnyExtras
            ? `This assumes interest is charged monthly and extra payments reduce principal directly. Your effective monthly outflow is <strong>${formatMoney(effectiveMonthlyOutflow)}</strong>${extraMonthly > 0 ? " after month " + extraStartMonth : ""}.`
            : `Add a monthly extra payment or a one-time lump sum to see how much time and interest you can save.`}
          ${lumpSumAmount > 0 && lumpSumMonth > 0 ? ` Lump sum applied in month <strong>${lumpSumMonth}</strong>.` : ""}
        </div>
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
      const message = "Extra Payment Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
