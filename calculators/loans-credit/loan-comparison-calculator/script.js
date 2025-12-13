document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAAmountInput = document.getElementById("loanAAmount");
  const loanAAprInput = document.getElementById("loanAApr");
  const loanATermYearsInput = document.getElementById("loanATermYears");
  const loanAFeesInput = document.getElementById("loanAFees");

  const loanBAmountInput = document.getElementById("loanBAmount");
  const loanBAprInput = document.getElementById("loanBApr");
  const loanBTermYearsInput = document.getElementById("loanBTermYears");
  const loanBFeesInput = document.getElementById("loanBFees");

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
  attachLiveFormatting(loanAAmountInput);
  attachLiveFormatting(loanAFeesInput);
  attachLiveFormatting(loanBAmountInput);
  attachLiveFormatting(loanBFeesInput);

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

  function validateTermYears(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || value > 50) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 50.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function calcLoan(amount, aprPercent, termYears, fees) {
    const n = Math.round(termYears * 12);
    const r = (aprPercent / 100) / 12;

    let payment = 0;
    if (n <= 0) {
      return null;
    }

    if (r === 0) {
      payment = amount / n;
    } else {
      const pow = Math.pow(1 + r, -n);
      payment = amount * (r / (1 - pow));
    }

    const totalRepayments = payment * n;
    const totalInterest = totalRepayments - amount;
    const totalCostIncludingFees = totalRepayments + fees;

    return {
      n: n,
      monthlyPayment: payment,
      totalRepayments: totalRepayments,
      totalInterest: totalInterest,
      fees: fees,
      totalCostIncludingFees: totalCostIncludingFees
    };
  }

  function money(n) {
    return formatNumberTwoDecimals(n);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const aAmount = toNumber(loanAAmountInput ? loanAAmountInput.value : "");
      const aApr = toNumber(loanAAprInput ? loanAAprInput.value : "");
      const aTermYears = toNumber(loanATermYearsInput ? loanATermYearsInput.value : "");
      const aFees = toNumber(loanAFeesInput ? loanAFeesInput.value : "");

      const bAmount = toNumber(loanBAmountInput ? loanBAmountInput.value : "");
      const bApr = toNumber(loanBAprInput ? loanBAprInput.value : "");
      const bTermYears = toNumber(loanBTermYearsInput ? loanBTermYearsInput.value : "");
      const bFees = toNumber(loanBFeesInput ? loanBFeesInput.value : "");

      // Basic existence guard
      if (
        !loanAAmountInput || !loanAAprInput || !loanATermYearsInput || !loanAFeesInput ||
        !loanBAmountInput || !loanBAprInput || !loanBTermYearsInput || !loanBFeesInput
      ) {
        return;
      }

      // Normalize optional fees to 0 when blank/invalid
      const aFeesSafe = Number.isFinite(aFees) ? aFees : 0;
      const bFeesSafe = Number.isFinite(bFees) ? bFees : 0;

      // Validation
      if (!validatePositive(aAmount, "Loan A amount")) return;
      if (!validateApr(aApr, "Loan A APR")) return;
      if (!validateTermYears(aTermYears, "Loan A term (years)")) return;
      if (!validateNonNegative(aFeesSafe, "Loan A upfront fees")) return;

      if (!validatePositive(bAmount, "Loan B amount")) return;
      if (!validateApr(bApr, "Loan B APR")) return;
      if (!validateTermYears(bTermYears, "Loan B term (years)")) return;
      if (!validateNonNegative(bFeesSafe, "Loan B upfront fees")) return;

      // Calculation logic
      const loanA = calcLoan(aAmount, aApr, aTermYears, aFeesSafe);
      const loanB = calcLoan(bAmount, bApr, bTermYears, bFeesSafe);

      if (!loanA || !loanB) {
        setResultError("Enter valid loan details to compare.");
        return;
      }

      // Winner logic (by total cost including fees)
      const aCost = loanA.totalCostIncludingFees;
      const bCost = loanB.totalCostIncludingFees;

      let winnerText = "";
      if (Math.abs(aCost - bCost) < 0.005) {
        winnerText = "Both loans have the same estimated total cost including fees.";
      } else if (aCost < bCost) {
        winnerText = "Loan A is cheaper on total cost (including fees) by " + money(bCost - aCost) + ".";
      } else {
        winnerText = "Loan B is cheaper on total cost (including fees) by " + money(aCost - bCost) + ".";
      }

      // Build output HTML
      const cardA = `
        <div class="result-card">
          <h3>Loan A results</h3>
          <div class="result-row"><span class="result-label">Monthly payment</span><span class="result-value">${money(loanA.monthlyPayment)}</span></div>
          <div class="result-row"><span class="result-label">Term</span><span class="result-value">${loanA.n} months</span></div>
          <div class="result-row"><span class="result-label">Total repayments</span><span class="result-value">${money(loanA.totalRepayments)}</span></div>
          <div class="result-row"><span class="result-label">Total interest</span><span class="result-value">${money(loanA.totalInterest)}</span></div>
          <div class="result-row"><span class="result-label">Upfront fees</span><span class="result-value">${money(loanA.fees)}</span></div>
          <div class="result-row"><span class="result-label">Total cost incl. fees</span><span class="result-value">${money(loanA.totalCostIncludingFees)}</span></div>
        </div>
      `;

      const cardB = `
        <div class="result-card">
          <h3>Loan B results</h3>
          <div class="result-row"><span class="result-label">Monthly payment</span><span class="result-value">${money(loanB.monthlyPayment)}</span></div>
          <div class="result-row"><span class="result-label">Term</span><span class="result-value">${loanB.n} months</span></div>
          <div class="result-row"><span class="result-label">Total repayments</span><span class="result-value">${money(loanB.totalRepayments)}</span></div>
          <div class="result-row"><span class="result-label">Total interest</span><span class="result-value">${money(loanB.totalInterest)}</span></div>
          <div class="result-row"><span class="result-label">Upfront fees</span><span class="result-value">${money(loanB.fees)}</span></div>
          <div class="result-row"><span class="result-label">Total cost incl. fees</span><span class="result-value">${money(loanB.totalCostIncludingFees)}</span></div>
        </div>
      `;

      const resultHtml = `
        <div class="result-grid">
          ${cardA}
          ${cardB}
        </div>
        <div class="winner-box">
          <strong>Summary:</strong> ${winnerText}
        </div>
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
      const message = "Loan Comparison Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
