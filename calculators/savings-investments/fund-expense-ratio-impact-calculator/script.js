document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const initialAmountInput = document.getElementById("initialAmount");
  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const annualReturnInput = document.getElementById("annualReturn");
  const expenseRatioInput = document.getElementById("expenseRatio");
  const yearsInput = document.getElementById("years");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(initialAmountInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(annualReturnInput);
  attachLiveFormatting(expenseRatioInput);
  attachLiveFormatting(yearsInput);

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
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Basic existence guard
      if (
        !initialAmountInput ||
        !monthlyContributionInput ||
        !annualReturnInput ||
        !expenseRatioInput ||
        !yearsInput
      ) {
        return;
      }

      // Parse inputs using toNumber() (from /scripts/main.js)
      const initialAmount = toNumber(initialAmountInput.value);
      const monthlyContribution = toNumber(monthlyContributionInput.value);
      const annualReturnPct = toNumber(annualReturnInput.value);
      const expenseRatioPct = toNumber(expenseRatioInput.value);
      const years = toNumber(yearsInput.value);

      // Validation
      if (!validatePositive(initialAmount, "initial investment amount")) return;
      if (!validateNonNegative(monthlyContribution, "monthly contribution")) return;
      if (!validateNonNegative(annualReturnPct, "expected annual return")) return;
      if (!validateNonNegative(expenseRatioPct, "expense ratio")) return;
      if (!validatePositive(years, "time horizon (years)")) return;

      if (annualReturnPct > 100) {
        setResultError("Enter a realistic expected annual return (100% or less).");
        return;
      }

      if (expenseRatioPct > 10) {
        setResultError("Enter a realistic expense ratio (10% or less).");
        return;
      }

      const monthsRaw = years * 12;
      const months = Math.max(1, Math.round(monthsRaw));

      // Calculation logic
      const grossAnnual = annualReturnPct / 100;
      const expenseAnnual = expenseRatioPct / 100;

      const grossMonthly = Math.pow(1 + grossAnnual, 1 / 12) - 1;
      const expenseMonthly = expenseAnnual / 12;

      function simulate(withFees) {
        let balance = initialAmount;
        let totalFees = 0;

        for (let i = 0; i < months; i++) {
          // Contributions assumed at the start of each month
          balance += monthlyContribution;

          // Growth
          balance = balance * (1 + grossMonthly);

          // Fee charged on assets after growth (simplified monthly model)
          if (withFees && expenseMonthly > 0) {
            const fee = balance * expenseMonthly;
            totalFees += fee;
            balance -= fee;
          }
        }

        return { balance: balance, totalFees: totalFees };
      }

      const withFees = simulate(true);
      const noFees = simulate(false);

      const endingWithFees = withFees.balance;
      const endingNoFees = noFees.balance;

      const difference = endingNoFees - endingWithFees;
      const totalFeesPaid = withFees.totalFees;

      const totalContributed = initialAmount + monthlyContribution * months;
      const avgFeesPerYear = totalFeesPaid / years;

      const percentGap = endingNoFees > 0 ? (difference / endingNoFees) * 100 : 0;

      // Build output HTML
      const resultHtml = `
        <p><strong>Ending balance (with fees):</strong> ${formatNumberTwoDecimals(endingWithFees)}</p>
        <p><strong>Ending balance (no-fee baseline):</strong> ${formatNumberTwoDecimals(endingNoFees)}</p>
        <p><strong>Difference due to fees:</strong> ${formatNumberTwoDecimals(difference)}</p>

        <hr>

        <p><strong>Total contributions:</strong> ${formatNumberTwoDecimals(totalContributed)}</p>
        <p><strong>Estimated total fees paid:</strong> ${formatNumberTwoDecimals(totalFeesPaid)}</p>
        <p><strong>Average fees per year:</strong> ${formatNumberTwoDecimals(avgFeesPerYear)}</p>
        <p><strong>Fee drag vs no-fee ending value:</strong> ${formatNumberTwoDecimals(percentGap)}%</p>

        <p style="margin-top:10px;">
          This estimate isolates the impact of the fund’s expense ratio under a steady return assumption.
          Real results will vary with market returns, contribution timing, and how the fund accrues fees.
        </p>
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
      const message = "Fund Expense Ratio Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
