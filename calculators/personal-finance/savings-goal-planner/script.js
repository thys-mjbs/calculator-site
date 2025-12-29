document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const targetAmountInput = document.getElementById("targetAmount");
  const currentSavingsInput = document.getElementById("currentSavings");
  const monthsToGoalInput = document.getElementById("monthsToGoal");
  const annualInterestRateInput = document.getElementById("annualInterestRate");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(targetAmountInput);
  attachLiveFormatting(currentSavingsInput);
  attachLiveFormatting(monthsToGoalInput);
  attachLiveFormatting(annualInterestRateInput);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const targetAmount = toNumber(targetAmountInput ? targetAmountInput.value : "");
      const currentSavings = toNumber(currentSavingsInput ? currentSavingsInput.value : "");
      const monthsToGoalRaw = toNumber(monthsToGoalInput ? monthsToGoalInput.value : "");
      const annualInterestRate = toNumber(annualInterestRateInput ? annualInterestRateInput.value : "");

      // Basic existence guard
      if (!targetAmountInput || !currentSavingsInput || !monthsToGoalInput || !annualInterestRateInput) return;

      // Validation (required: target + months)
      if (!validatePositive(targetAmount, "savings goal")) return;

      if (!Number.isFinite(monthsToGoalRaw) || monthsToGoalRaw <= 0) {
        setResultError("Enter a valid time to goal in months greater than 0.");
        return;
      }

      const monthsToGoal = Math.floor(monthsToGoalRaw);
      if (monthsToGoal !== monthsToGoalRaw) {
        setResultError("Time to goal must be a whole number of months.");
        return;
      }

      // Optional inputs with defaults
      const pv = Number.isFinite(currentSavings) ? currentSavings : 0;
      if (!validateNonNegative(pv, "current savings")) return;

      const annualRate = Number.isFinite(annualInterestRate) ? annualInterestRate : 0;
      if (annualRate < 0) {
        setResultError("Enter a valid annual interest rate (0 or higher).");
        return;
      }

      // Calculation logic
      const fv = targetAmount;
      const n = monthsToGoal;
      const r = annualRate > 0 ? (annualRate / 100) / 12 : 0;

      let monthlyContribution = 0;
      let projectedEndBalance = 0;
      let totalContributions = 0;
      let interestEarned = 0;

      if (r === 0) {
        monthlyContribution = (fv - pv) / n;
        if (monthlyContribution < 0) monthlyContribution = 0;
        totalContributions = monthlyContribution * n;
        projectedEndBalance = pv + totalContributions;
        interestEarned = 0;
      } else {
        const growth = Math.pow(1 + r, n);
        const pvFuture = pv * growth;

        if (pvFuture >= fv) {
          monthlyContribution = 0;
          projectedEndBalance = pvFuture;
          totalContributions = 0;
          interestEarned = projectedEndBalance - pv;
        } else {
          monthlyContribution = (fv - pvFuture) * r / (growth - 1);
          if (monthlyContribution < 0) monthlyContribution = 0;

          totalContributions = monthlyContribution * n;
          projectedEndBalance = pvFuture + (monthlyContribution * ((growth - 1) / r));
          interestEarned = projectedEndBalance - pv - totalContributions;
        }
      }

      // Guard against tiny negative due to floating math
      if (interestEarned < 0 && interestEarned > -0.01) interestEarned = 0;

      // Build output HTML
      const monthlyStr = formatNumberTwoDecimals(monthlyContribution);
      const totalContribStr = formatNumberTwoDecimals(totalContributions);
      const interestStr = formatNumberTwoDecimals(interestEarned);
      const endBalanceStr = formatNumberTwoDecimals(projectedEndBalance);

      let noteHtml = "";
      if (monthlyContribution === 0) {
        noteHtml = `<p><strong>Note:</strong> Based on your current savings and the interest rate, you are already on track to meet or exceed the goal within ${n} months.</p>`;
      } else if (annualRate === 0) {
        noteHtml = `<p><strong>Note:</strong> Interest is set to 0%, so this is a straight-line savings plan. If your savings earn interest, add a rate to refine the estimate.</p>`;
      } else {
        noteHtml = `<p><strong>Note:</strong> This assumes a constant ${formatNumberTwoDecimals(annualRate)}% annual rate compounded monthly and equal contributions at the end of each month.</p>`;
      }

      const resultHtml = `
        <p><strong>Monthly savings required:</strong> ${monthlyStr}</p>
        <p><strong>Total contributions:</strong> ${totalContribStr}</p>
        <p><strong>Estimated interest earned:</strong> ${interestStr}</p>
        <p><strong>Projected end balance:</strong> ${endBalanceStr}</p>
        ${noteHtml}
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
      const message = "Savings Goal Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
