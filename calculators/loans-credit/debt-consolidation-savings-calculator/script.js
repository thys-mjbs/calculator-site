document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const modeBlockQuick = document.getElementById("modeBlockQuick");
  const modeBlockDetailed = document.getElementById("modeBlockDetailed");

  // Quick mode inputs
  const currentBalance = document.getElementById("currentBalance");
  const currentApr = document.getElementById("currentApr");
  const currentMonthlyPayment = document.getElementById("currentMonthlyPayment");
  const minPaymentPercent = document.getElementById("minPaymentPercent");

  // Detailed mode inputs (up to 3 debts)
  const d1Balance = document.getElementById("d1Balance");
  const d1Apr = document.getElementById("d1Apr");
  const d1Payment = document.getElementById("d1Payment");

  const d2Balance = document.getElementById("d2Balance");
  const d2Apr = document.getElementById("d2Apr");
  const d2Payment = document.getElementById("d2Payment");

  const d3Balance = document.getElementById("d3Balance");
  const d3Apr = document.getElementById("d3Apr");
  const d3Payment = document.getElementById("d3Payment");

  const minPaymentPercentDetailed = document.getElementById("minPaymentPercentDetailed");

  // Consolidation inputs (common)
  const newApr = document.getElementById("newApr");
  const newTermYears = document.getElementById("newTermYears");
  const originationFeePercent = document.getElementById("originationFeePercent");
  const feeTreatment = document.getElementById("feeTreatment");

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
  attachLiveFormatting(currentMonthlyPayment);

  attachLiveFormatting(d1Balance);
  attachLiveFormatting(d1Payment);
  attachLiveFormatting(d2Balance);
  attachLiveFormatting(d2Payment);
  attachLiveFormatting(d3Balance);
  attachLiveFormatting(d3Payment);

  attachLiveFormatting(newTermYears);

  // Percent-like inputs (still fine to comma-format, but typically no commas will appear)
  attachLiveFormatting(currentApr);
  attachLiveFormatting(minPaymentPercent);
  attachLiveFormatting(d1Apr);
  attachLiveFormatting(d2Apr);
  attachLiveFormatting(d3Apr);
  attachLiveFormatting(minPaymentPercentDetailed);
  attachLiveFormatting(newApr);
  attachLiveFormatting(originationFeePercent);

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
  // 4) MODE HANDLING
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeBlockQuick) modeBlockQuick.classList.add("hidden");
    if (modeBlockDetailed) modeBlockDetailed.classList.add("hidden");

    if (mode === "detailed") {
      if (modeBlockDetailed) modeBlockDetailed.classList.remove("hidden");
    } else {
      if (modeBlockQuick) modeBlockQuick.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
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

  function clampPercent(p, fallback) {
    if (!Number.isFinite(p) || p <= 0) return fallback;
    if (p > 100) return 100;
    return p;
  }

  function monthsToText(months) {
    if (!Number.isFinite(months) || months <= 0) return "N/A";
    const rounded = Math.round(months);
    const years = Math.floor(rounded / 12);
    const rem = rounded % 12;
    if (years <= 0) return rem + " months";
    if (rem === 0) return years + (years === 1 ? " year" : " years");
    return years + (years === 1 ? " year " : " years ") + rem + " months";
  }

  function payoffMonthsFromFixedPayment(balance, aprPercent, payment) {
    const r = (aprPercent / 100) / 12;
    if (balance <= 0) return 0;

    if (r === 0) {
      return payment > 0 ? balance / payment : Infinity;
    }

    // Payment must exceed monthly interest to amortize.
    const monthlyInterest = balance * r;
    if (payment <= monthlyInterest) return Infinity;

    const ratio = 1 - (r * balance) / payment;
    if (ratio <= 0) return Infinity;

    const n = -Math.log(ratio) / Math.log(1 + r);
    return n;
  }

  function amortizedPayment(principal, aprPercent, months) {
    const r = (aprPercent / 100) / 12;
    if (months <= 0) return NaN;
    if (r === 0) return principal / months;
    return (r * principal) / (1 - Math.pow(1 + r, -months));
  }

  function currency(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "quick";

      const newAprVal = toNumber(newApr ? newApr.value : "");
      const newTermYearsVal = toNumber(newTermYears ? newTermYears.value : "");
      const feePctValRaw = toNumber(originationFeePercent ? originationFeePercent.value : "");
      const feePctVal = Number.isFinite(feePctValRaw) && feePctValRaw >= 0 ? feePctValRaw : 0;
      const feeMode = feeTreatment ? feeTreatment.value : "finance";

      if (!validatePositive(newAprVal, "consolidation loan APR")) return;
      if (!validatePositive(newTermYearsVal, "consolidation loan term (years)")) return;
      if (!Number.isFinite(feePctVal) || feePctVal < 0 || feePctVal > 100) {
        setResultError("Enter a valid origination fee % between 0 and 100.");
        return;
      }

      let totalBalance = 0;
      let currentMonthlyPay = 0;
      let estimatedUsed = false;

      // For interest comparison, we compute payoff and interest using either:
      // - User payment (fixed) OR
      // - Estimated minimum payment (percent of balance, with floor)
      const floorPerDebt = 25;

      // Quick defaults
      const defaultMinPct = 3;

      if (mode === "detailed") {
        const minPctInput = toNumber(minPaymentPercentDetailed ? minPaymentPercentDetailed.value : "");
        const minPct = clampPercent(minPctInput, defaultMinPct);

        const debts = [
          { b: toNumber(d1Balance ? d1Balance.value : ""), apr: toNumber(d1Apr ? d1Apr.value : ""), p: toNumber(d1Payment ? d1Payment.value : ""), label: "Debt 1" },
          { b: toNumber(d2Balance ? d2Balance.value : ""), apr: toNumber(d2Apr ? d2Apr.value : ""), p: toNumber(d2Payment ? d2Payment.value : ""), label: "Debt 2" },
          { b: toNumber(d3Balance ? d3Balance.value : ""), apr: toNumber(d3Apr ? d3Apr.value : ""), p: toNumber(d3Payment ? d3Payment.value : ""), label: "Debt 3" }
        ];

        const active = debts.filter(d => Number.isFinite(d.b) && d.b > 0);

        if (active.length === 0) {
          setResultError("Enter at least one debt balance in detailed mode.");
          return;
        }

        // Validate APRs for active debts
        for (let i = 0; i < active.length; i++) {
          if (!Number.isFinite(active[i].apr) || active[i].apr <= 0 || active[i].apr > 100) {
            setResultError("Enter a valid APR for " + active[i].label + " (greater than 0 and up to 100).");
            return;
          }
        }

        // Aggregate totals and compute weighted APR for display
        let weightedAprSum = 0;
        for (let i = 0; i < active.length; i++) {
          totalBalance += active[i].b;
          weightedAprSum += active[i].b * active[i].apr;

          let pay = active[i].p;
          if (!Number.isFinite(pay) || pay <= 0) {
            pay = Math.max(floorPerDebt, active[i].b * (minPct / 100));
            estimatedUsed = true;
          }
          currentMonthlyPay += pay;
        }

        if (!validatePositive(totalBalance, "total current debt balance")) return;
        if (!validatePositive(currentMonthlyPay, "current monthly payment")) return;

        const weightedApr = weightedAprSum / totalBalance;

        // Current scenario payoff and interest
        const currentMonths = payoffMonthsFromFixedPayment(totalBalance, weightedApr, currentMonthlyPay);
        if (!Number.isFinite(currentMonths) || currentMonths === Infinity) {
          setResultError("Your current monthly payment appears too low to pay down the balance (it may be near or below monthly interest). Increase the payment amount to get a usable payoff estimate.");
          return;
        }

        const currentTotalPaid = currentMonthlyPay * currentMonths;
        const currentInterest = currentTotalPaid - totalBalance;

        // Consolidation scenario
        const termMonths = Math.round(newTermYearsVal * 12);
        if (termMonths <= 0) {
          setResultError("Enter a valid consolidation loan term (years).");
          return;
        }

        const feeAmount = totalBalance * (feePctVal / 100);
        const financedFee = feeMode === "finance" ? feeAmount : 0;
        const upfrontFee = feeMode === "upfront" ? feeAmount : 0;

        const newPrincipal = totalBalance + financedFee;
        const newPayment = amortizedPayment(newPrincipal, newAprVal, termMonths);

        if (!Number.isFinite(newPayment) || newPayment <= 0) {
          setResultError("Could not compute a valid consolidation payment. Check your APR and term.");
          return;
        }

        const newTotalPaid = newPayment * termMonths + upfrontFee;
        const newInterest = (newPayment * termMonths) - newPrincipal;

        const monthlyDiff = newPayment - currentMonthlyPay;
        const timeDiffMonths = termMonths - currentMonths;
        const costDiff = newTotalPaid - currentTotalPaid;

        const savingsLabel = costDiff < 0 ? "Estimated savings" : "Estimated extra cost";
        const savingsValue = Math.abs(costDiff);

        const assumptionNote = estimatedUsed
          ? `<p><em>Note:</em> At least one current monthly payment was estimated using a ${formatNumberTwoDecimals(minPct)}% minimum payment assumption (with a ${formatNumberTwoDecimals(floorPerDebt)} floor per debt).</p>`
          : "";

        const resultHtml = `
          <p><strong>${savingsLabel}:</strong> ${currency(savingsValue)}</p>
          <p><strong>Monthly payment change:</strong> ${currency(Math.abs(monthlyDiff))} ${monthlyDiff > 0 ? "more" : "less"} per month</p>
          <p><strong>Payoff time change:</strong> ${monthsToText(Math.abs(timeDiffMonths))} ${timeDiffMonths > 0 ? "longer" : "shorter"}</p>

          <hr>

          <p><strong>Current setup (estimated):</strong></p>
          <p>Total balance: ${currency(totalBalance)}<br>
             Estimated monthly payment: ${currency(currentMonthlyPay)}<br>
             Weighted average APR: ${formatNumberTwoDecimals(weightedApr)}%<br>
             Payoff time: ${monthsToText(currentMonths)}<br>
             Total interest: ${currency(currentInterest)}<br>
             Total paid: ${currency(currentTotalPaid)}
          </p>

          <p><strong>Consolidation loan (estimated):</strong></p>
          <p>New APR: ${formatNumberTwoDecimals(newAprVal)}%<br>
             Term: ${termMonths} months<br>
             Origination fee: ${formatNumberTwoDecimals(feePctVal)}% (${currency(feeAmount)})${feeMode === "finance" ? ", financed" : ", paid upfront"}<br>
             New principal: ${currency(newPrincipal)}<br>
             New monthly payment: ${currency(newPayment)}<br>
             Total interest: ${currency(newInterest)}<br>
             Total paid (including upfront fees): ${currency(newTotalPaid)}
          </p>

          ${assumptionNote}
          <p><em>Tip:</em> If you want the best comparison, enter your real current monthly payments or increase payments to reflect what you plan to pay (not just minimums).</p>
        `;

        setResultSuccess(resultHtml);
        return;
      }

      // QUICK MODE
      const balanceVal = toNumber(currentBalance ? currentBalance.value : "");
      const currentAprVal = toNumber(currentApr ? currentApr.value : "");
      const paymentVal = toNumber(currentMonthlyPayment ? currentMonthlyPayment.value : "");
      const minPctInput = toNumber(minPaymentPercent ? minPaymentPercent.value : "");
      const minPct = clampPercent(minPctInput, defaultMinPct);

      if (!validatePositive(balanceVal, "total current debt balance")) return;
      if (!validatePositive(currentAprVal, "average APR (current debts)")) return;
      if (currentAprVal > 100) {
        setResultError("Enter a valid average APR (up to 100).");
        return;
      }

      totalBalance = balanceVal;

      if (Number.isFinite(paymentVal) && paymentVal > 0) {
        currentMonthlyPay = paymentVal;
      } else {
        currentMonthlyPay = Math.max(floorPerDebt, totalBalance * (minPct / 100));
        estimatedUsed = true;
      }

      const currentMonths = payoffMonthsFromFixedPayment(totalBalance, currentAprVal, currentMonthlyPay);
      if (!Number.isFinite(currentMonths) || currentMonths === Infinity) {
        setResultError("Your current monthly payment appears too low to pay down the balance (it may be near or below monthly interest). Increase the payment amount to get a usable payoff estimate.");
        return;
      }

      const currentTotalPaid = currentMonthlyPay * currentMonths;
      const currentInterest = currentTotalPaid - totalBalance;

      const termMonths = Math.round(newTermYearsVal * 12);
      if (termMonths <= 0) {
        setResultError("Enter a valid consolidation loan term (years).");
        return;
      }

      const feeAmount = totalBalance * (feePctVal / 100);
      const financedFee = feeMode === "finance" ? feeAmount : 0;
      const upfrontFee = feeMode === "upfront" ? feeAmount : 0;

      const newPrincipal = totalBalance + financedFee;
      const newPayment = amortizedPayment(newPrincipal, newAprVal, termMonths);

      if (!Number.isFinite(newPayment) || newPayment <= 0) {
        setResultError("Could not compute a valid consolidation payment. Check your APR and term.");
        return;
      }

      const newTotalPaid = newPayment * termMonths + upfrontFee;
      const newInterest = (newPayment * termMonths) - newPrincipal;

      const monthlyDiff = newPayment - currentMonthlyPay;
      const timeDiffMonths = termMonths - currentMonths;
      const costDiff = newTotalPaid - currentTotalPaid;

      const savingsLabel = costDiff < 0 ? "Estimated savings" : "Estimated extra cost";
      const savingsValue = Math.abs(costDiff);

      const assumptionNote = estimatedUsed
        ? `<p><em>Note:</em> Your current monthly payment was estimated using a ${formatNumberTwoDecimals(minPct)}% minimum payment assumption (with a ${formatNumberTwoDecimals(floorPerDebt)} floor).</p>`
        : "";

      const resultHtml = `
        <p><strong>${savingsLabel}:</strong> ${currency(savingsValue)}</p>
        <p><strong>Monthly payment change:</strong> ${currency(Math.abs(monthlyDiff))} ${monthlyDiff > 0 ? "more" : "less"} per month</p>
        <p><strong>Payoff time change:</strong> ${monthsToText(Math.abs(timeDiffMonths))} ${timeDiffMonths > 0 ? "longer" : "shorter"}</p>

        <hr>

        <p><strong>Current setup (estimated):</strong></p>
        <p>Total balance: ${currency(totalBalance)}<br>
           Monthly payment: ${currency(currentMonthlyPay)}<br>
           APR: ${formatNumberTwoDecimals(currentAprVal)}%<br>
           Payoff time: ${monthsToText(currentMonths)}<br>
           Total interest: ${currency(currentInterest)}<br>
           Total paid: ${currency(currentTotalPaid)}
        </p>

        <p><strong>Consolidation loan (estimated):</strong></p>
        <p>New APR: ${formatNumberTwoDecimals(newAprVal)}%<br>
           Term: ${termMonths} months<br>
           Origination fee: ${formatNumberTwoDecimals(feePctVal)}% (${currency(feeAmount)})${feeMode === "finance" ? ", financed" : ", paid upfront"}<br>
           New principal: ${currency(newPrincipal)}<br>
           New monthly payment: ${currency(newPayment)}<br>
           Total interest: ${currency(newInterest)}<br>
           Total paid (including upfront fees): ${currency(newTotalPaid)}
        </p>

        ${assumptionNote}
        <p><em>Tip:</em> If you want a tighter estimate, enter your real current monthly payment and use the exact consolidation quote (APR, term, and fee).</p>
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
      const message = "Debt Consolidation Savings Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
