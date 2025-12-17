document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAAmount = document.getElementById("loanAAmount");
  const loanARate = document.getElementById("loanARate");
  const loanATermYears = document.getElementById("loanATermYears");
  const loanAType = document.getElementById("loanAType");
  const loanAOnceOffFees = document.getElementById("loanAOnceOffFees");
  const loanAMonthlyFee = document.getElementById("loanAMonthlyFee");
  const loanAExtraPayment = document.getElementById("loanAExtraPayment");

  const loanBAmount = document.getElementById("loanBAmount");
  const loanBRate = document.getElementById("loanBRate");
  const loanBTermYears = document.getElementById("loanBTermYears");
  const loanBType = document.getElementById("loanBType");
  const loanBOnceOffFees = document.getElementById("loanBOnceOffFees");
  const loanBMonthlyFee = document.getElementById("loanBMonthlyFee");
  const loanBExtraPayment = document.getElementById("loanBExtraPayment");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like fields
  attachLiveFormatting(loanAAmount);
  attachLiveFormatting(loanAOnceOffFees);
  attachLiveFormatting(loanAMonthlyFee);
  attachLiveFormatting(loanAExtraPayment);

  attachLiveFormatting(loanBAmount);
  attachLiveFormatting(loanBOnceOffFees);
  attachLiveFormatting(loanBMonthlyFee);
  attachLiveFormatting(loanBExtraPayment);

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

  function formatMoney(n) {
    return formatNumberTwoDecimals(n);
  }

  function monthsToYearsMonths(totalMonths) {
    const m = Math.max(0, Math.round(totalMonths));
    const years = Math.floor(m / 12);
    const months = m % 12;
    if (years === 0) return months + " months";
    if (months === 0) return years + " years";
    return years + " years " + months + " months";
  }

  function computeRepaymentLoan(P, annualRatePct, termYears, monthlyFee, onceOffFees, extraMonthly) {
    const r = annualRatePct / 100 / 12;
    const n = Math.round(termYears * 12);

    let basePayment;
    if (r === 0) {
      basePayment = P / n;
    } else {
      const pow = Math.pow(1 + r, n);
      basePayment = (P * r * pow) / (pow - 1);
    }

    const extra = Math.max(0, extraMonthly);
    const scheduled = basePayment + extra;
    let balance = P;
    let totalInterest = 0;
    let months = 0;

    if (scheduled <= 0) {
      return null;
    }

    // If extra is zero, we can use closed-form totals
    if (extra === 0) {
      const totalPaidExFees = basePayment * n;
      totalInterest = totalPaidExFees - P;
      months = n;

      const totalMonthlyFees = monthlyFee * months;
      const totalFees = onceOffFees + totalMonthlyFees;
      const monthlyOutflow = basePayment + monthlyFee;
      const totalCost = P + totalInterest + totalFees;

      return {
        type: "repayment",
        basePayment: basePayment,
        monthlyFee: monthlyFee,
        monthlyOutflow: monthlyOutflow,
        months: months,
        totalInterest: totalInterest,
        totalMonthlyFees: totalMonthlyFees,
        onceOffFees: onceOffFees,
        totalFees: totalFees,
        totalCost: totalCost,
        balloon: 0
      };
    }

    // Extra payments: simulate amortization
    const maxMonths = 12 * 100; // safety cap: 100 years
    while (balance > 0.01 && months < maxMonths) {
      const interest = balance * r;
      let principalPay = scheduled - interest;

      // If payment doesn't cover interest, it's not a valid repayment
      if (principalPay <= 0) {
        return null;
      }

      if (principalPay > balance) principalPay = balance;
      balance -= principalPay;
      totalInterest += interest;
      months += 1;
    }

    const totalMonthlyFees = monthlyFee * months;
    const totalFees = onceOffFees + totalMonthlyFees;
    const monthlyOutflow = basePayment + extra + monthlyFee;
    const totalCost = P + totalInterest + totalFees;

    return {
      type: "repayment",
      basePayment: basePayment,
      monthlyFee: monthlyFee,
      monthlyOutflow: monthlyOutflow,
      months: months,
      totalInterest: totalInterest,
      totalMonthlyFees: totalMonthlyFees,
      onceOffFees: onceOffFees,
      totalFees: totalFees,
      totalCost: totalCost,
      balloon: 0
    };
  }

  function computeInterestOnlyLoan(P, annualRatePct, termYears, monthlyFee, onceOffFees) {
    const r = annualRatePct / 100 / 12;
    const n = Math.round(termYears * 12);

    const interestOnlyPayment = P * r;
    const monthlyOutflow = interestOnlyPayment + monthlyFee;

    const totalInterest = interestOnlyPayment * n;
    const totalMonthlyFees = monthlyFee * n;
    const totalFees = onceOffFees + totalMonthlyFees;

    // Principal is still due at end (balloon), but "total cost over term" includes it
    const totalCost = P + totalInterest + totalFees;

    return {
      type: "interestOnly",
      basePayment: interestOnlyPayment,
      monthlyFee: monthlyFee,
      monthlyOutflow: monthlyOutflow,
      months: n,
      totalInterest: totalInterest,
      totalMonthlyFees: totalMonthlyFees,
      onceOffFees: onceOffFees,
      totalFees: totalFees,
      totalCost: totalCost,
      balloon: P
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Basic existence guard
      if (
        !loanAAmount || !loanARate || !loanATermYears || !loanAType ||
        !loanBAmount || !loanBRate || !loanBTermYears || !loanBType
      ) {
        return;
      }

      // Parse inputs using toNumber() (from /scripts/main.js)
      const aAmount = toNumber(loanAAmount.value);
      const aRate = toNumber(loanARate.value);
      const aTermYears = toNumber(loanATermYears.value);
      const aOnceOffFees = toNumber(loanAOnceOffFees ? loanAOnceOffFees.value : "");
      const aMonthlyFee = toNumber(loanAMonthlyFee ? loanAMonthlyFee.value : "");
      const aExtra = toNumber(loanAExtraPayment ? loanAExtraPayment.value : "");

      const bAmount = toNumber(loanBAmount.value);
      const bRate = toNumber(loanBRate.value);
      const bTermYears = toNumber(loanBTermYears.value);
      const bOnceOffFees = toNumber(loanBOnceOffFees ? loanBOnceOffFees.value : "");
      const bMonthlyFee = toNumber(loanBMonthlyFee ? loanBMonthlyFee.value : "");
      const bExtra = toNumber(loanBExtraPayment ? loanBExtraPayment.value : "");

      // Validation
      if (!validatePositive(aAmount, "Loan A amount")) return;
      if (!validatePositive(aRate, "Loan A interest rate")) return;
      if (!validatePositive(aTermYears, "Loan A term (years)")) return;
      if (!validateNonNegative(aOnceOffFees, "Loan A once-off fees")) return;
      if (!validateNonNegative(aMonthlyFee, "Loan A monthly fee")) return;
      if (!validateNonNegative(aExtra, "Loan A extra monthly payment")) return;

      if (!validatePositive(bAmount, "Loan B amount")) return;
      if (!validatePositive(bRate, "Loan B interest rate")) return;
      if (!validatePositive(bTermYears, "Loan B term (years)")) return;
      if (!validateNonNegative(bOnceOffFees, "Loan B once-off fees")) return;
      if (!validateNonNegative(bMonthlyFee, "Loan B monthly fee")) return;
      if (!validateNonNegative(bExtra, "Loan B extra monthly payment")) return;

      const aType = loanAType.value || "repayment";
      const bType = loanBType.value || "repayment";

      // Calculation logic
      let aRes;
      if (aType === "interestOnly") {
        aRes = computeInterestOnlyLoan(aAmount, aRate, aTermYears, aMonthlyFee, aOnceOffFees);
      } else {
        aRes = computeRepaymentLoan(aAmount, aRate, aTermYears, aMonthlyFee, aOnceOffFees, aExtra);
        if (!aRes) {
          setResultError("Loan A: the repayment amount is not enough to cover interest. Reduce the interest rate, increase the term, or remove unrealistic inputs.");
          return;
        }
      }

      let bRes;
      if (bType === "interestOnly") {
        bRes = computeInterestOnlyLoan(bAmount, bRate, bTermYears, bMonthlyFee, bOnceOffFees);
      } else {
        bRes = computeRepaymentLoan(bAmount, bRate, bTermYears, bMonthlyFee, bOnceOffFees, bExtra);
        if (!bRes) {
          setResultError("Loan B: the repayment amount is not enough to cover interest. Reduce the interest rate, increase the term, or remove unrealistic inputs.");
          return;
        }
      }

      // Comparison
      const cheaper = aRes.totalCost < bRes.totalCost ? "A" : (bRes.totalCost < aRes.totalCost ? "B" : "tie");
      const costDiff = Math.abs(aRes.totalCost - bRes.totalCost);
      const monthlyDiff = Math.abs(aRes.monthlyOutflow - bRes.monthlyOutflow);

      const aPayoffText = (aRes.type === "repayment" && aExtra > 0) ? monthsToYearsMonths(aRes.months) : monthsToYearsMonths(aRes.months);
      const bPayoffText = (bRes.type === "repayment" && bExtra > 0) ? monthsToYearsMonths(bRes.months) : monthsToYearsMonths(bRes.months);

      // Build output HTML
      const summaryLine =
        cheaper === "tie"
          ? `<p><strong>Overall:</strong> These two loans estimate to the same total cost (difference is negligible based on your inputs).</p>`
          : `<p><strong>Overall:</strong> Loan ${cheaper} is cheaper by <strong>${formatMoney(costDiff)}</strong> in total estimated cost.</p>`;

      const monthlyLine =
        aRes.monthlyOutflow === bRes.monthlyOutflow
          ? `<p><strong>Monthly outflow:</strong> Both loans estimate to the same monthly outflow.</p>`
          : `<p><strong>Monthly outflow:</strong> Loan ${aRes.monthlyOutflow < bRes.monthlyOutflow ? "A" : "B"} is lower by <strong>${formatMoney(monthlyDiff)}</strong> per month (including monthly fees).</p>`;

      const loanABalloon =
        aRes.type === "interestOnly"
          ? `<p><strong>Balloon principal at end:</strong> ${formatMoney(aRes.balloon)}</p>`
          : "";

      const loanBBalloon =
        bRes.type === "interestOnly"
          ? `<p><strong>Balloon principal at end:</strong> ${formatMoney(bRes.balloon)}</p>`
          : "";

      const resultHtml = `
        ${summaryLine}
        ${monthlyLine}
        <hr>
        <p><strong>Loan A summary</strong></p>
        <p><strong>Estimated monthly repayment (excluding monthly fee):</strong> ${formatMoney(aRes.basePayment)}${aType === "repayment" && aExtra > 0 ? ` (plus extra ${formatMoney(aExtra)})` : ""}</p>
        <p><strong>Monthly fee:</strong> ${formatMoney(aRes.monthlyFee)}</p>
        <p><strong>Total monthly outflow:</strong> ${formatMoney(aRes.monthlyOutflow)}</p>
        <p><strong>Estimated payoff time:</strong> ${aPayoffText}</p>
        <p><strong>Total interest paid:</strong> ${formatMoney(aRes.totalInterest)}</p>
        <p><strong>Total fees (once-off + monthly):</strong> ${formatMoney(aRes.totalFees)}</p>
        ${loanABalloon}
        <p><strong>Total cost (principal + interest + fees):</strong> ${formatMoney(aRes.totalCost)}</p>
        <hr>
        <p><strong>Loan B summary</strong></p>
        <p><strong>Estimated monthly repayment (excluding monthly fee):</strong> ${formatMoney(bRes.basePayment)}${bType === "repayment" && bExtra > 0 ? ` (plus extra ${formatMoney(bExtra)})` : ""}</p>
        <p><strong>Monthly fee:</strong> ${formatMoney(bRes.monthlyFee)}</p>
        <p><strong>Total monthly outflow:</strong> ${formatMoney(bRes.monthlyOutflow)}</p>
        <p><strong>Estimated payoff time:</strong> ${bPayoffText}</p>
        <p><strong>Total interest paid:</strong> ${formatMoney(bRes.totalInterest)}</p>
        <p><strong>Total fees (once-off + monthly):</strong> ${formatMoney(bRes.totalFees)}</p>
        ${loanBBalloon}
        <p><strong>Total cost (principal + interest + fees):</strong> ${formatMoney(bRes.totalCost)}</p>
        <hr>
        <p><strong>Practical read:</strong> If you care most about cash flow, focus on the total monthly outflow. If you care most about long-term cost, focus on total cost and total interest. Fees matter most when the two offers are otherwise similar.</p>
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
      const message = "Home Loan Comparison Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
