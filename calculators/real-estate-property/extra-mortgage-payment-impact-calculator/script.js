document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanBalanceInput = document.getElementById("loanBalance");
  const annualRateInput = document.getElementById("annualRate");
  const remainingYearsInput = document.getElementById("remainingYears");
  const monthlyPaymentInput = document.getElementById("monthlyPayment");

  const extraModeSelect = document.getElementById("extraMode");
  const modeMonthly = document.getElementById("modeMonthly");
  const modeLumpSum = document.getElementById("modeLumpSum");

  const extraMonthlyInput = document.getElementById("extraMonthly");
  const lumpSumAmountInput = document.getElementById("lumpSumAmount");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(loanBalanceInput);
  attachLiveFormatting(annualRateInput);
  attachLiveFormatting(remainingYearsInput);
  attachLiveFormatting(monthlyPaymentInput);
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
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeMonthly) modeMonthly.classList.add("hidden");
    if (modeLumpSum) modeLumpSum.classList.add("hidden");

    if (mode === "monthly") {
      if (modeMonthly) modeMonthly.classList.remove("hidden");
    } else if (mode === "lumpsum") {
      if (modeLumpSum) modeLumpSum.classList.remove("hidden");
    }

    clearResult();
  }

  if (extraModeSelect) {
    showMode(extraModeSelect.value);
    extraModeSelect.addEventListener("change", function () {
      showMode(extraModeSelect.value);
    });
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
  // Helpers: amortization simulation
  // ------------------------------------------------------------
  function safeAddMonths(dateObj, monthsToAdd) {
    const d = new Date(dateObj.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + monthsToAdd);

    // Handle month-end rollovers by stepping back if needed
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  }

  function formatMonthYear(dateObj) {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const mm = m < 10 ? "0" + m : "" + m;
    return y + "-" + mm;
  }

  function computePayment(balance, monthlyRate, months) {
    if (months <= 0) return NaN;
    if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) {
      return balance / months;
    }
    const r = monthlyRate;
    const denom = 1 - Math.pow(1 + r, -months);
    if (denom <= 0) return NaN;
    return (r * balance) / denom;
  }

  function simulateLoan(params) {
    const startingBalance = params.balance;
    const monthlyRate = params.monthlyRate;
    const monthlyPayment = params.monthlyPayment;
    const extraMonthly = params.extraMonthly;
    const lumpSum = params.lumpSum;

    let balance = startingBalance;

    if (Number.isFinite(lumpSum) && lumpSum > 0) {
      balance = Math.max(0, balance - lumpSum);
    }

    let totalInterest = 0;
    let months = 0;

    // Safety limit to prevent runaway loops
    const MAX_MONTHS = 2000;

    while (balance > 0 && months < MAX_MONTHS) {
      const interest = monthlyRate > 0 ? balance * monthlyRate : 0;
      totalInterest += interest;

      let paymentThisMonth = monthlyPayment;
      let extraThisMonth = extraMonthly;

      if (!Number.isFinite(paymentThisMonth) || paymentThisMonth <= 0) {
        return { ok: false, error: "Monthly payment must be greater than 0." };
      }

      if (!Number.isFinite(extraThisMonth) || extraThisMonth < 0) {
        extraThisMonth = 0;
      }

      // Total paid toward the loan this month
      let totalPaid = paymentThisMonth + extraThisMonth;

      // If the payment does not cover interest, the loan will not amortize
      if (monthlyRate > 0 && totalPaid <= interest + 0.0000001) {
        return {
          ok: false,
          error: "Your payment is too low to reduce the balance at this interest rate. Increase the payment or check your inputs."
        };
      }

      // Apply payment: interest first, remainder to principal
      let principalPaid = totalPaid - interest;

      // Do not overpay beyond the remaining principal
      if (principalPaid > balance) {
        principalPaid = balance;
      }

      balance = balance - principalPaid;
      months += 1;
    }

    if (months >= MAX_MONTHS) {
      return { ok: false, error: "Result exceeded the maximum supported payoff period. Check your inputs." };
    }

    return {
      ok: true,
      months: months,
      totalInterest: totalInterest
    };
  }

  function monthsToYearsMonths(totalMonths) {
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return { years: y, months: m };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = extraModeSelect ? extraModeSelect.value : "monthly";

      const balance = toNumber(loanBalanceInput ? loanBalanceInput.value : "");
      const annualRatePct = toNumber(annualRateInput ? annualRateInput.value : "");
      const remainingYears = toNumber(remainingYearsInput ? remainingYearsInput.value : "");
      const monthlyPaymentRaw = toNumber(monthlyPaymentInput ? monthlyPaymentInput.value : "");

      const extraMonthly = toNumber(extraMonthlyInput ? extraMonthlyInput.value : "");
      const lumpSum = toNumber(lumpSumAmountInput ? lumpSumAmountInput.value : "");

      if (!validatePositive(balance, "loan balance")) return;
      if (!validateNonNegative(annualRatePct, "interest rate")) return;
      if (!validatePositive(remainingYears, "remaining term (years)")) return;

      const monthsRemaining = Math.round(remainingYears * 12);
      if (!Number.isFinite(monthsRemaining) || monthsRemaining <= 0) {
        setResultError("Enter a valid remaining term greater than 0.");
        return;
      }

      const monthlyRate = (annualRatePct / 100) / 12;

      // Determine base monthly payment
      let monthlyPayment = monthlyPaymentRaw;
      const usingEstimatedPayment = !Number.isFinite(monthlyPayment) || monthlyPayment <= 0;

      if (usingEstimatedPayment) {
        monthlyPayment = computePayment(balance, monthlyRate, monthsRemaining);
      }

      if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
        setResultError("Enter a valid monthly payment, or leave it blank so the calculator can estimate it.");
        return;
      }

      // Mode-based extra values
      let extraMonthlyUsed = 0;
      let lumpSumUsed = 0;

      if (mode === "monthly") {
        extraMonthlyUsed = Number.isFinite(extraMonthly) ? extraMonthly : 0;
        if (!validateNonNegative(extraMonthlyUsed, "extra monthly payment")) return;
      } else if (mode === "lumpsum") {
        lumpSumUsed = Number.isFinite(lumpSum) ? lumpSum : 0;
        if (!validateNonNegative(lumpSumUsed, "lump sum amount")) return;
      }

      // If both are zero, still compute baseline and show a useful message
      const baseline = simulateLoan({
        balance: balance,
        monthlyRate: monthlyRate,
        monthlyPayment: monthlyPayment,
        extraMonthly: 0,
        lumpSum: 0
      });

      if (!baseline.ok) {
        setResultError(baseline.error);
        return;
      }

      const scenario = simulateLoan({
        balance: balance,
        monthlyRate: monthlyRate,
        monthlyPayment: monthlyPayment,
        extraMonthly: extraMonthlyUsed,
        lumpSum: lumpSumUsed
      });

      if (!scenario.ok) {
        setResultError(scenario.error);
        return;
      }

      const interestSaved = baseline.totalInterest - scenario.totalInterest;
      const monthsSaved = baseline.months - scenario.months;

      const baseYM = monthsToYearsMonths(baseline.months);
      const scenYM = monthsToYearsMonths(scenario.months);
      const savedYM = monthsToYearsMonths(Math.max(0, monthsSaved));

      const now = new Date();
      const baselinePayoffDate = safeAddMonths(now, baseline.months);
      const scenarioPayoffDate = safeAddMonths(now, scenario.months);

      const paymentLabel = usingEstimatedPayment ? "Estimated monthly payment" : "Monthly payment";

      const extraSummary =
        mode === "monthly"
          ? ("Extra per month: " + formatNumberTwoDecimals(extraMonthlyUsed))
          : ("Lump sum paid now: " + formatNumberTwoDecimals(lumpSumUsed));

      const guidanceLine =
        monthsSaved > 0
          ? "You pay the loan off sooner and reduce total interest paid."
          : "With the current inputs, the payoff time does not improve. Increase the extra amount or confirm your monthly payment and rate.";

      const resultHtml = `
        <p><strong>${guidanceLine}</strong></p>

        <div class="table-wrap">
          <table class="result-table" aria-label="Mortgage payoff comparison">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Baseline</th>
                <th>With extra</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${paymentLabel}</td>
                <td>${formatNumberTwoDecimals(monthlyPayment)}</td>
                <td>${formatNumberTwoDecimals(monthlyPayment)}</td>
              </tr>
              <tr>
                <td>Extra payment</td>
                <td>0.00</td>
                <td>${extraSummary}</td>
              </tr>
              <tr>
                <td>Payoff time</td>
                <td>${baseYM.years} years, ${baseYM.months} months</td>
                <td>${scenYM.years} years, ${scenYM.months} months</td>
              </tr>
              <tr>
                <td>Estimated payoff month</td>
                <td>${formatMonthYear(baselinePayoffDate)}</td>
                <td>${formatMonthYear(scenarioPayoffDate)}</td>
              </tr>
              <tr>
                <td>Total interest</td>
                <td>${formatNumberTwoDecimals(baseline.totalInterest)}</td>
                <td>${formatNumberTwoDecimals(scenario.totalInterest)}</td>
              </tr>
              <tr>
                <td>Interest saved</td>
                <td colspan="2">${formatNumberTwoDecimals(Math.max(0, interestSaved))}</td>
              </tr>
              <tr>
                <td>Time saved</td>
                <td colspan="2">${savedYM.years} years, ${savedYM.months} months</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p><strong>Secondary insight:</strong> Extra payments usually save more when made earlier because they reduce the balance that future interest is calculated on. If you have the same amount available, a lump sum typically saves more interest than spreading it out slowly.</p>
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
      const message = "Extra Mortgage Payment Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
