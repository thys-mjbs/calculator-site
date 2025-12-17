document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentBalance = document.getElementById("currentBalance");
  const currentRate = document.getElementById("currentRate");
  const remainingTermYears = document.getElementById("remainingTermYears");
  const newRate = document.getElementById("newRate");
  const newTermYears = document.getElementById("newTermYears");
  const cashOut = document.getElementById("cashOut");
  const closingCosts = document.getElementById("closingCosts");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like inputs
  attachLiveFormatting(currentBalance);
  attachLiveFormatting(cashOut);
  attachLiveFormatting(closingCosts);

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

  function validateRate(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function monthlyPayment(principal, annualRatePercent, months) {
    if (!Number.isFinite(principal) || !Number.isFinite(annualRatePercent) || !Number.isFinite(months)) return NaN;
    if (months <= 0) return NaN;

    const r = (annualRatePercent / 100) / 12;

    // 0% interest edge case
    if (r === 0) {
      return principal / months;
    }

    const pow = Math.pow(1 + r, months);
    return principal * (r * pow) / (pow - 1);
  }

  function totalInterest(principal, payment, annualRatePercent, months) {
    if (!Number.isFinite(principal) || !Number.isFinite(payment) || !Number.isFinite(annualRatePercent) || !Number.isFinite(months)) return NaN;
    if (months <= 0) return NaN;

    const totalPaid = payment * months;
    return totalPaid - principal;
  }

  function fmtMoney(n) {
    return formatNumberTwoDecimals(n);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const bal = toNumber(currentBalance ? currentBalance.value : "");
      const curRate = toNumber(currentRate ? currentRate.value : "");
      const remYears = toNumber(remainingTermYears ? remainingTermYears.value : "");
      const refiRate = toNumber(newRate ? newRate.value : "");
      const newYearsRaw = toNumber(newTermYears ? newTermYears.value : "");
      const cashOutAmt = toNumber(cashOut ? cashOut.value : "");
      const closing = toNumber(closingCosts ? closingCosts.value : "");

      // Existence guard
      if (!currentBalance || !currentRate || !remainingTermYears || !newRate) return;

      // Validation (required fields)
      if (!validatePositive(bal, "current loan balance")) return;
      if (!validateRate(curRate, "current interest rate")) return;
      if (!validatePositive(remYears, "remaining term (years)")) return;
      if (!validateRate(refiRate, "new interest rate")) return;

      // Optional fields (no penalty if blank)
      const cashOutSafe = Number.isFinite(cashOutAmt) ? cashOutAmt : 0;
      const closingSafe = Number.isFinite(closing) ? closing : 0;

      if (!validateNonNegative(cashOutSafe, "cash-out amount")) return;
      if (!validateNonNegative(closingSafe, "closing costs")) return;

      // Determine new term (default to remaining term)
      let newYears = remYears;
      if (Number.isFinite(newYearsRaw) && newYearsRaw > 0) {
        newYears = newYearsRaw;
      }

      const remMonths = Math.round(remYears * 12);
      const newMonths = Math.round(newYears * 12);

      if (remMonths <= 0 || newMonths <= 0) {
        setResultError("Enter valid term values (years).");
        return;
      }

      // New principal assumes cash-out is added to the new loan balance.
      // Closing costs are treated as upfront for break-even purposes (not financed).
      const newPrincipal = bal + cashOutSafe;

      // Calculate payments
      const curPmt = monthlyPayment(bal, curRate, remMonths);
      const newPmt = monthlyPayment(newPrincipal, refiRate, newMonths);

      if (!Number.isFinite(curPmt) || !Number.isFinite(newPmt) || curPmt <= 0 || newPmt <= 0) {
        setResultError("Something looks off. Double-check your rates and terms.");
        return;
      }

      // Interest totals
      const curInterest = totalInterest(bal, curPmt, curRate, remMonths);
      const newInterest = totalInterest(newPrincipal, newPmt, refiRate, newMonths);

      // Savings
      const monthlySavings = curPmt - newPmt;

      // Break-even (months) using closing costs (upfront)
      let breakEvenText = "Not applicable";
      if (closingSafe > 0 && monthlySavings > 0) {
        const monthsToBreakEven = Math.ceil(closingSafe / monthlySavings);
        breakEvenText = monthsToBreakEven + " month" + (monthsToBreakEven === 1 ? "" : "s");
      } else if (closingSafe === 0 && monthlySavings > 0) {
        breakEvenText = "Immediate (no closing costs entered)";
      } else if (monthlySavings <= 0) {
        breakEvenText = "No break-even (new payment is not lower)";
      }

      // Overall remaining cost comparison (payments + closing costs)
      const curTotalPaid = curPmt * remMonths;
      const newTotalPaid = (newPmt * newMonths) + closingSafe; // closing costs upfront
      const totalDifference = curTotalPaid - newTotalPaid; // positive means refinance is cheaper overall

      // Output
      const savingsLabel = monthlySavings >= 0 ? "Estimated monthly savings" : "Estimated monthly increase";
      const savingsValue = Math.abs(monthlySavings);

      const totalLabel = totalDifference >= 0 ? "Estimated total savings (payments + closing costs)" : "Estimated total extra cost (payments + closing costs)";
      const totalValue = Math.abs(totalDifference);

      const html = `
        <p><strong>Current monthly payment:</strong> ${fmtMoney(curPmt)}</p>
        <p><strong>New monthly payment:</strong> ${fmtMoney(newPmt)}</p>
        <p><strong>${savingsLabel}:</strong> ${fmtMoney(savingsValue)}</p>
        <p><strong>Break-even on closing costs:</strong> ${breakEvenText}</p>
        <hr class="calc-divider" aria-hidden="true">
        <p><strong>Current total interest remaining:</strong> ${fmtMoney(curInterest)}</p>
        <p><strong>New total interest (refinance scenario):</strong> ${fmtMoney(newInterest)}</p>
        <p><strong>${totalLabel}:</strong> ${fmtMoney(totalValue)}</p>
        <p class="result-note"><em>Note:</em> Closing costs are treated as upfront. Cash-out increases the new loan balance. This is a simplified comparison and does not include taxes, insurance, or variable-rate changes.</p>
      `;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Refinance Savings Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
