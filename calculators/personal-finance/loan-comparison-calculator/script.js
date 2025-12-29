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
  const loanAApr = document.getElementById("loanAApr");
  const loanATermYears = document.getElementById("loanATermYears");
  const loanAUpfrontFee = document.getElementById("loanAUpfrontFee");
  const loanAFeeFinanced = document.getElementById("loanAFeeFinanced");

  const loanBAmount = document.getElementById("loanBAmount");
  const loanBApr = document.getElementById("loanBApr");
  const loanBTermYears = document.getElementById("loanBTermYears");
  const loanBUpfrontFee = document.getElementById("loanBUpfrontFee");
  const loanBFeeFinanced = document.getElementById("loanBFeeFinanced");

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
  attachLiveFormatting(loanAAmount);
  attachLiveFormatting(loanAUpfrontFee);
  attachLiveFormatting(loanATermYears);

  attachLiveFormatting(loanBAmount);
  attachLiveFormatting(loanBUpfrontFee);
  attachLiveFormatting(loanBTermYears);

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

  function validateApr(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  function monthlyPayment(principal, aprPercent, months) {
    const n = months;
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(n) || n <= 0) return NaN;

    const r = (aprPercent / 100) / 12;

    // Handle 0% APR
    if (r === 0) return principal / n;

    const pow = Math.pow(1 + r, n);
    return (principal * r * pow) / (pow - 1);
  }

  function computeLoan(label, amount, apr, termYears, fee, feeFinanced) {
    const months = Math.round(termYears * 12);

    const feeValue = Number.isFinite(fee) ? fee : 0;
    const feeRolledIn = !!feeFinanced;

    const principalUsed = feeRolledIn ? (amount + feeValue) : amount;

    const payment = monthlyPayment(principalUsed, apr, months);
    const totalPayments = payment * months;
    const totalInterest = totalPayments - principalUsed;

    // If fee not financed, it is an extra cost paid outside the monthly schedule
    const totalCost = feeRolledIn ? totalPayments : (totalPayments + feeValue);

    return {
      label: label,
      months: months,
      principalUsed: principalUsed,
      payment: payment,
      totalPayments: totalPayments,
      totalInterest: totalInterest,
      upfrontFee: feeValue,
      feeFinanced: feeRolledIn,
      totalCost: totalCost
    };
  }

  function money(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const aAmount = toNumber(loanAAmount ? loanAAmount.value : "");
      const aApr = toNumber(loanAApr ? loanAApr.value : "");
      const aTermYears = toNumber(loanATermYears ? loanATermYears.value : "");
      const aFee = toNumber(loanAUpfrontFee ? loanAUpfrontFee.value : "");

      const bAmount = toNumber(loanBAmount ? loanBAmount.value : "");
      const bApr = toNumber(loanBApr ? loanBApr.value : "");
      const bTermYears = toNumber(loanBTermYears ? loanBTermYears.value : "");
      const bFee = toNumber(loanBUpfrontFee ? loanBUpfrontFee.value : "");

      // Basic existence guard
      if (!loanAAmount || !loanAApr || !loanATermYears || !loanBAmount || !loanBApr || !loanBTermYears) return;

      // Validation (required inputs)
      if (!validatePositive(aAmount, "Loan A amount")) return;
      if (!validateApr(aApr, "Loan A APR")) return;
      if (!validatePositive(aTermYears, "Loan A term (years)")) return;

      if (!validatePositive(bAmount, "Loan B amount")) return;
      if (!validateApr(bApr, "Loan B APR")) return;
      if (!validatePositive(bTermYears, "Loan B term (years)")) return;

      // Optional fields
      const aFeeSafe = Number.isFinite(aFee) ? aFee : 0;
      const bFeeSafe = Number.isFinite(bFee) ? bFee : 0;

      if (!validateNonNegative(aFeeSafe, "Loan A upfront fee")) return;
      if (!validateNonNegative(bFeeSafe, "Loan B upfront fee")) return;

      const loanA = computeLoan(
        "Loan A",
        aAmount,
        aApr,
        aTermYears,
        aFeeSafe,
        loanAFeeFinanced ? loanAFeeFinanced.checked : false
      );

      const loanB = computeLoan(
        "Loan B",
        bAmount,
        bApr,
        bTermYears,
        bFeeSafe,
        loanBFeeFinanced ? loanBFeeFinanced.checked : false
      );

      if (!Number.isFinite(loanA.payment) || !Number.isFinite(loanB.payment)) {
        setResultError("Unable to calculate. Check that amounts, APR, and term are valid.");
        return;
      }

      // Comparison logic
      const cheaperByTotalCost = loanA.totalCost < loanB.totalCost ? "A" : (loanB.totalCost < loanA.totalCost ? "B" : "tie");
      const cheaperByMonthly = loanA.payment < loanB.payment ? "A" : (loanB.payment < loanA.payment ? "B" : "tie");

      const costDiff = Math.abs(loanA.totalCost - loanB.totalCost);
      const paymentDiff = Math.abs(loanA.payment - loanB.payment);

      const winnerText =
        cheaperByTotalCost === "tie"
          ? "Overall cost is effectively the same across both loans (based on the inputs)."
          : ("Cheapest overall: Loan " + cheaperByTotalCost + " (lower total cost).");

      const monthlyText =
        cheaperByMonthly === "tie"
          ? "Monthly payments are effectively the same across both loans."
          : ("Lower monthly payment: Loan " + cheaperByMonthly + ".");

      function feeSummary(loan) {
        if (!loan.upfrontFee || loan.upfrontFee === 0) return "No upfront fee entered.";
        return loan.feeFinanced
          ? ("Upfront fee is financed (added to the loan balance).")
          : ("Upfront fee is paid upfront (added to total cost).");
      }

      const resultHtml = `
        <p class="result-note"><strong>${winnerText}</strong></p>
        <p class="result-subtle">${monthlyText}</p>

        <table aria-label="Loan comparison results">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Loan A</th>
              <th>Loan B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly payment</td>
              <td>${money(loanA.payment)}</td>
              <td>${money(loanB.payment)}</td>
            </tr>
            <tr>
              <td>Total of monthly payments</td>
              <td>${money(loanA.totalPayments)}</td>
              <td>${money(loanB.totalPayments)}</td>
            </tr>
            <tr>
              <td>Total interest</td>
              <td>${money(loanA.totalInterest)}</td>
              <td>${money(loanB.totalInterest)}</td>
            </tr>
            <tr>
              <td>Total cost (incl fees)</td>
              <td>${money(loanA.totalCost)}</td>
              <td>${money(loanB.totalCost)}</td>
            </tr>
            <tr>
              <td>Term</td>
              <td>${loanA.months} months</td>
              <td>${loanB.months} months</td>
            </tr>
            <tr>
              <td>Fee handling</td>
              <td>${feeSummary(loanA)}</td>
              <td>${feeSummary(loanB)}</td>
            </tr>
          </tbody>
        </table>

        <p class="result-subtle"><strong>Difference:</strong> Total cost differs by ${money(costDiff)}. Monthly payment differs by ${money(paymentDiff)}.</p>
        <p class="result-subtle">If you care most about paying the least overall, pick the loan with the lower <strong>Total cost</strong>. If you care most about monthly affordability, pick the loan with the lower <strong>Monthly payment</strong>.</p>
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
      const message = "Loan Comparison Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
