document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalDebtInput = document.getElementById("totalDebt");
  const currentAprInput = document.getElementById("currentApr");
  const currentMonthlyPaymentInput = document.getElementById("currentMonthlyPayment");
  const newAprInput = document.getElementById("newApr");
  const termMonthsInput = document.getElementById("termMonths");
  const originationFeeInput = document.getElementById("originationFee");
  const feeAddedToLoanInput = document.getElementById("feeAddedToLoan");

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
  attachLiveFormatting(totalDebtInput);
  attachLiveFormatting(currentAprInput);
  attachLiveFormatting(currentMonthlyPaymentInput);
  attachLiveFormatting(newAprInput);
  attachLiveFormatting(termMonthsInput);
  attachLiveFormatting(originationFeeInput);

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
  function monthsToPayoffFixedPayment(pv, monthlyRate, payment) {
    // Returns { months, interest, totalPaid } or { error }
    if (!Number.isFinite(pv) || pv <= 0) return { error: "Invalid balance." };
    if (!Number.isFinite(payment) || payment <= 0) return { error: "Invalid payment." };

    if (monthlyRate <= 0) {
      const months = Math.ceil(pv / payment);
      const totalPaid = months * payment;
      const interest = Math.max(0, totalPaid - pv);
      return { months, interest, totalPaid };
    }

    const interestOnly = pv * monthlyRate;
    if (payment <= interestOnly + 1e-9) {
      return { error: "Your monthly payment is too low to reduce the balance at this interest rate." };
    }

    // n = -ln(1 - r*PV/P) / ln(1+r)
    const ratio = 1 - (monthlyRate * pv) / payment;
    const n = -Math.log(ratio) / Math.log(1 + monthlyRate);
    const months = Math.ceil(n);

    // Approx totals (payment is fixed; last payment may be smaller in reality)
    const totalPaid = months * payment;
    const interest = Math.max(0, totalPaid - pv);

    return { months, interest, totalPaid };
  }

  function paymentForAmortizedLoan(pv, monthlyRate, months) {
    if (months <= 0) return NaN;
    if (monthlyRate <= 0) return pv / months;
    const denom = 1 - Math.pow(1 + monthlyRate, -months);
    if (denom <= 0) return NaN;
    return (monthlyRate * pv) / denom;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const totalDebt = toNumber(totalDebtInput ? totalDebtInput.value : "");
      const currentApr = toNumber(currentAprInput ? currentAprInput.value : "");
      const currentMonthlyPayment = toNumber(currentMonthlyPaymentInput ? currentMonthlyPaymentInput.value : "");
      const newApr = toNumber(newAprInput ? newAprInput.value : "");
      const termMonths = toNumber(termMonthsInput ? termMonthsInput.value : "");
      const originationFee = toNumber(originationFeeInput ? originationFeeInput.value : "");
      const feeAddedToLoan = !!(feeAddedToLoanInput && feeAddedToLoanInput.checked);

      // Basic existence guard
      if (
        !totalDebtInput ||
        !currentAprInput ||
        !currentMonthlyPaymentInput ||
        !newAprInput ||
        !termMonthsInput ||
        !originationFeeInput ||
        !feeAddedToLoanInput
      ) {
        return;
      }

      // Validation
      if (!validatePositive(totalDebt, "total current debt balance")) return;
      if (!validateNonNegative(currentApr, "current average APR")) return;
      if (!validatePositive(currentMonthlyPayment, "current monthly payment")) return;
      if (!validateNonNegative(newApr, "consolidation loan APR")) return;
      if (!validatePositive(termMonths, "consolidation loan term (months)")) return;
      if (!validateNonNegative(originationFee, "origination / setup fee")) return;

      // Rates
      const currentMonthlyRate = (currentApr / 100) / 12;
      const newMonthlyRate = (newApr / 100) / 12;

      // Scenario A: keep current debt, pay fixed monthly amount
      const current = monthsToPayoffFixedPayment(totalDebt, currentMonthlyRate, currentMonthlyPayment);
      if (current.error) {
        setResultError(current.error);
        return;
      }

      // Scenario B: consolidate into amortized loan
      const newPrincipal = feeAddedToLoan ? (totalDebt + originationFee) : totalDebt;
      const newPayment = paymentForAmortizedLoan(newPrincipal, newMonthlyRate, termMonths);
      if (!Number.isFinite(newPayment) || newPayment <= 0) {
        setResultError("Enter values that produce a valid consolidation loan payment.");
        return;
      }

      const newTotalPaid = newPayment * termMonths;
      const newInterest = Math.max(0, newTotalPaid - newPrincipal);
      const newAllInCost = feeAddedToLoan ? newTotalPaid : (newTotalPaid + originationFee);

      // Comparisons
      const monthlyDiff = currentMonthlyPayment - newPayment; // positive means consolidation payment is lower
      const totalCostDiff = current.totalPaid - newAllInCost; // positive means consolidation costs less overall
      const interestDiff = current.interest - newInterest; // positive means consolidation interest is lower (fee may still reduce net savings)

      // Break-even (only makes sense if fee paid upfront and consolidation payment is lower)
      let breakEvenHtml = "";
      if (!feeAddedToLoan && originationFee > 0 && monthlyDiff > 0) {
        const breakEvenMonths = Math.ceil(originationFee / monthlyDiff);
        breakEvenHtml = `<p><strong>Fee break-even:</strong> About ${breakEvenMonths} month(s) of payment savings to recover the upfront fee.</p>`;
      }

      // Build output HTML
      const fmtMoney = (n) => formatNumberTwoDecimals(n);
      const fmtMonths = (m) => `${m} month(s)`;

      const monthlyDiffText =
        monthlyDiff > 0
          ? `You pay about ${fmtMoney(monthlyDiff)} less per month with consolidation.`
          : monthlyDiff < 0
          ? `You pay about ${fmtMoney(Math.abs(monthlyDiff))} more per month with consolidation.`
          : `Your monthly payment is about the same in both cases.`;

      const totalCostDiffText =
        totalCostDiff > 0
          ? `Total cost is about ${fmtMoney(totalCostDiff)} lower with consolidation.`
          : totalCostDiff < 0
          ? `Total cost is about ${fmtMoney(Math.abs(totalCostDiff))} higher with consolidation.`
          : `Total cost is about the same in both cases.`;

      const interestDiffText =
        interestDiff > 0
          ? `Estimated interest is about ${fmtMoney(interestDiff)} lower with the consolidation loan (before considering upfront fee effects).`
          : interestDiff < 0
          ? `Estimated interest is about ${fmtMoney(Math.abs(interestDiff))} higher with the consolidation loan.`
          : `Estimated interest is about the same in both cases.`;

      const feeNote = originationFee > 0
        ? (feeAddedToLoan
          ? `Fee handling: the ${fmtMoney(originationFee)} fee is added to the new loan balance.`
          : `Fee handling: the ${fmtMoney(originationFee)} fee is treated as an upfront cost (not earning interest).`)
        : `Fee handling: no fee included.`;

      const resultHtml = `
        <p><strong>Current plan (keep debts):</strong></p>
        <p>Payoff time: <strong>${fmtMonths(current.months)}</strong></p>
        <p>Total paid: <strong>${fmtMoney(current.totalPaid)}</strong></p>
        <p>Total interest: <strong>${fmtMoney(current.interest)}</strong></p>

        <hr>

        <p><strong>Consolidation loan:</strong></p>
        <p>Monthly payment: <strong>${fmtMoney(newPayment)}</strong></p>
        <p>Term: <strong>${fmtMonths(termMonths)}</strong></p>
        <p>Total paid over term: <strong>${fmtMoney(newTotalPaid)}</strong></p>
        <p>Total interest (on loan): <strong>${fmtMoney(newInterest)}</strong></p>
        <p>All-in cost (including fees): <strong>${fmtMoney(newAllInCost)}</strong></p>
        <p>${feeNote}</p>

        <hr>

        <p><strong>Comparison:</strong></p>
        <p>${monthlyDiffText}</p>
        <p>${totalCostDiffText}</p>
        <p>${interestDiffText}</p>
        ${breakEvenHtml}
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
      const message = "Debt Consolidation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
