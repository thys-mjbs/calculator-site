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
  const currentApr = document.getElementById("currentApr");
  const currentTermYears = document.getElementById("currentTermYears");
  const newApr = document.getElementById("newApr");
  const newTermYears = document.getElementById("newTermYears");
  const refiFees = document.getElementById("refiFees");
  const monthsPlanned = document.getElementById("monthsPlanned");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(currentBalance);
  attachLiveFormatting(currentApr);
  attachLiveFormatting(currentTermYears);
  attachLiveFormatting(newApr);
  attachLiveFormatting(newTermYears);
  attachLiveFormatting(refiFees);
  attachLiveFormatting(monthsPlanned);

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

  // ------------------------------------------------------------
  // Calculator helpers (local)
  // ------------------------------------------------------------
  function monthlyPayment(principal, annualRatePercent, months) {
    const r = (annualRatePercent / 100) / 12;
    if (months <= 0) return NaN;

    if (r === 0) {
      return principal / months;
    }

    const pow = Math.pow(1 + r, -months);
    return (principal * r) / (1 - pow);
  }

  function simulateRemainingBalance(principal, annualRatePercent, monthsTotal, monthsPaid) {
    const r = (annualRatePercent / 100) / 12;
    const payment = monthlyPayment(principal, annualRatePercent, monthsTotal);

    if (!Number.isFinite(payment)) return { remaining: NaN, totalPaid: NaN, totalInterest: NaN };

    let balance = principal;
    let totalInterest = 0;
    let totalPaid = 0;

    const m = Math.max(0, Math.min(monthsPaid, monthsTotal));

    for (let i = 0; i < m; i++) {
      const interest = r === 0 ? 0 : balance * r;
      let principalPaid = payment - interest;

      if (principalPaid > balance) {
        principalPaid = balance;
      }

      balance = balance - principalPaid;
      totalInterest += interest;
      totalPaid += (interest + principalPaid);

      if (balance <= 0) {
        balance = 0;
        break;
      }
    }

    return { remaining: balance, totalPaid: totalPaid, totalInterest: totalInterest };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const bal = toNumber(currentBalance ? currentBalance.value : "");
      const aprCurrent = toNumber(currentApr ? currentApr.value : "");
      const termCurrentYears = toNumber(currentTermYears ? currentTermYears.value : "");
      const aprNew = toNumber(newApr ? newApr.value : "");
      const termNewYears = toNumber(newTermYears ? newTermYears.value : "");
      const fees = toNumber(refiFees ? refiFees.value : "");
      const monthsKeep = toNumber(monthsPlanned ? monthsPlanned.value : "");

      // Basic existence guard
      if (!currentBalance || !currentApr || !currentTermYears || !newApr || !newTermYears) return;

      // Validation
      if (!validatePositive(bal, "current loan balance")) return;
      if (!validateNonNegative(aprCurrent, "current APR")) return;
      if (!validatePositive(termCurrentYears, "remaining term (years)")) return;

      if (!validateNonNegative(aprNew, "refinance APR")) return;
      if (!validatePositive(termNewYears, "refinance term (years)")) return;

      if (Number.isFinite(fees) && fees < 0) {
        setResultError("Enter valid refinance fees (0 or higher).");
        return;
      }

      const currentMonths = Math.round(termCurrentYears * 12);
      const newMonths = Math.round(termNewYears * 12);

      if (!Number.isFinite(currentMonths) || currentMonths <= 0) {
        setResultError("Enter a valid remaining term in years.");
        return;
      }

      if (!Number.isFinite(newMonths) || newMonths <= 0) {
        setResultError("Enter a valid refinance term in years.");
        return;
      }

      // Calculation logic
      const currentPmt = monthlyPayment(bal, aprCurrent, currentMonths);
      const newPmt = monthlyPayment(bal, aprNew, newMonths);

      if (!Number.isFinite(currentPmt) || !Number.isFinite(newPmt)) {
        setResultError("Unable to calculate payments with the values provided. Check your inputs and try again.");
        return;
      }

      const currentTotalPaid = currentPmt * currentMonths;
      const newTotalPaid = newPmt * newMonths;

      const currentTotalInterest = currentTotalPaid - bal;
      const newTotalInterest = newTotalPaid - bal;

      const monthlyDiff = currentPmt - newPmt; // positive means refinance payment is lower
      const lifetimeSavingsBeforeFees = (currentTotalPaid - newTotalPaid);
      const lifetimeNetSavings = lifetimeSavingsBeforeFees - (Number.isFinite(fees) ? fees : 0);

      // Optional time-window view
      let windowHtml = "";
      let monthsUsed = null;

      if (Number.isFinite(monthsKeep) && monthsKeep > 0) {
        monthsUsed = Math.round(monthsKeep);

        const curSim = simulateRemainingBalance(bal, aprCurrent, currentMonths, monthsUsed);
        const newSim = simulateRemainingBalance(bal, aprNew, newMonths, monthsUsed);

        if (Number.isFinite(curSim.remaining) && Number.isFinite(newSim.remaining)) {
          const curWindowCost = curSim.totalPaid;
          const newWindowCost = newSim.totalPaid + (Number.isFinite(fees) ? fees : 0);

          const costDiff = curWindowCost - newWindowCost;
          const balDiff = curSim.remaining - newSim.remaining; // positive means refinance leaves higher balance

          const costLine =
            costDiff >= 0
              ? `<p><strong>Estimated savings over ${monthsUsed} months:</strong> R${formatNumberTwoDecimals(costDiff)}</p>`
              : `<p><strong>Estimated extra cost over ${monthsUsed} months:</strong> R${formatNumberTwoDecimals(Math.abs(costDiff))}</p>`;

          const balLine =
            balDiff >= 0
              ? `<p><strong>Remaining balance difference after ${monthsUsed} months:</strong> refinancing leaves about R${formatNumberTwoDecimals(Math.abs(balDiff))} less balance.</p>`
              : `<p><strong>Remaining balance difference after ${monthsUsed} months:</strong> refinancing leaves about R${formatNumberTwoDecimals(Math.abs(balDiff))} more balance.</p>`;

          windowHtml =
            `<hr class="result-divider">` +
            `<p><strong>Short-horizon view</strong> (based on keeping the loan for about ${monthsUsed} months):</p>` +
            costLine +
            balLine +
            `<p class="result-note">This view estimates what you pay and what you still owe after the chosen time window. It helps if you expect to refinance again or repay early.</p>`;
        }
      }

      // Break-even estimate (fees vs monthly payment savings)
      let breakEvenHtml = "";
      const feeVal = Number.isFinite(fees) ? fees : 0;

      if (feeVal > 0) {
        if (monthlyDiff > 0) {
          const monthsToBreakEven = feeVal / monthlyDiff;
          breakEvenHtml = `<p><strong>Estimated break-even time:</strong> about ${formatNumberTwoDecimals(monthsToBreakEven)} months (fees paid back by monthly payment savings).</p>`;
        } else if (monthlyDiff === 0) {
          breakEvenHtml = `<p><strong>Break-even time:</strong> not applicable because the estimated monthly payments are the same, and fees would not be recovered through payment savings.</p>`;
        } else {
          breakEvenHtml = `<p><strong>Break-even time:</strong> unlikely, because the refinance payment is higher and fees add additional cost.</p>`;
        }
      }

      // Build output HTML
      const currentPmtStr = formatNumberTwoDecimals(currentPmt);
      const newPmtStr = formatNumberTwoDecimals(newPmt);

      const interestCurrentStr = formatNumberTwoDecimals(currentTotalInterest);
      const interestNewStr = formatNumberTwoDecimals(newTotalInterest);

      const monthlyDiffAbsStr = formatNumberTwoDecimals(Math.abs(monthlyDiff));
      const lifetimeNetAbsStr = formatNumberTwoDecimals(Math.abs(lifetimeNetSavings));

      const monthlyLine =
        monthlyDiff > 0
          ? `<p><strong>Estimated monthly payment change:</strong> you pay about R${monthlyDiffAbsStr} less per month.</p>`
          : monthlyDiff < 0
          ? `<p><strong>Estimated monthly payment change:</strong> you pay about R${monthlyDiffAbsStr} more per month.</p>`
          : `<p><strong>Estimated monthly payment change:</strong> no change.</p>`;

      const lifetimeLine =
        lifetimeNetSavings > 0
          ? `<p><strong>Estimated lifetime net savings:</strong> about R${lifetimeNetAbsStr} (including fees).</p>`
          : lifetimeNetSavings < 0
          ? `<p><strong>Estimated lifetime net increase in cost:</strong> about R${lifetimeNetAbsStr} (including fees).</p>`
          : `<p><strong>Estimated lifetime net change:</strong> about R0.00 (including fees).</p>`;

      const feesLine =
        feeVal > 0
          ? `<p><strong>Refinance fees included:</strong> R${formatNumberTwoDecimals(feeVal)}</p>`
          : `<p><strong>Refinance fees included:</strong> R0.00</p>`;

      const resultHtml =
        `<p><strong>Current loan estimated payment:</strong> R${currentPmtStr} per month</p>` +
        `<p><strong>Refinance estimated payment:</strong> R${newPmtStr} per month</p>` +
        `<hr class="result-divider">` +
        monthlyLine +
        feesLine +
        breakEvenHtml +
        `<hr class="result-divider">` +
        `<p><strong>Total interest (current loan):</strong> R${interestCurrentStr}</p>` +
        `<p><strong>Total interest (refinance):</strong> R${interestNewStr}</p>` +
        lifetimeLine +
        windowHtml +
        `<p class="result-note">Estimates assume fixed-rate amortized payments. Your lender’s exact figures can differ due to timing, compounding rules, and rounding.</p>`;

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
      const message = "Student Loan Refinance Savings Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
