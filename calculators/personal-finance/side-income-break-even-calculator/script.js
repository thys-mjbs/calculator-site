document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const setupCostInput = document.getElementById("setupCost");
  const monthlyIncomeInput = document.getElementById("monthlyIncome");
  const monthlyExpensesInput = document.getElementById("monthlyExpenses");
  const taxRateInput = document.getElementById("taxRate");
  const hoursPerMonthInput = document.getElementById("hoursPerMonth");
  const hourlyValueInput = document.getElementById("hourlyValue");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Currency-like / money-like inputs
  attachLiveFormatting(setupCostInput);
  attachLiveFormatting(monthlyIncomeInput);
  attachLiveFormatting(monthlyExpensesInput);
  attachLiveFormatting(hourlyValueInput);

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

      // Parse inputs using toNumber() (from /scripts/main.js)
      const setupCost = toNumber(setupCostInput ? setupCostInput.value : "");
      const monthlyIncome = toNumber(monthlyIncomeInput ? monthlyIncomeInput.value : "");
      const monthlyExpensesRaw = toNumber(monthlyExpensesInput ? monthlyExpensesInput.value : "");
      const taxRateRaw = toNumber(taxRateInput ? taxRateInput.value : "");
      const hoursPerMonthRaw = toNumber(hoursPerMonthInput ? hoursPerMonthInput.value : "");
      const hourlyValueRaw = toNumber(hourlyValueInput ? hourlyValueInput.value : "");

      // Basic existence guard
      if (!setupCostInput || !monthlyIncomeInput) return;

      // Required validation
      if (!validatePositive(setupCost, "one-time setup cost")) return;
      if (!validatePositive(monthlyIncome, "monthly side income")) return;

      // Optional fields: use defaults if missing
      const monthlyExpenses = Number.isFinite(monthlyExpensesRaw) ? Math.max(0, monthlyExpensesRaw) : 0;
      const taxRate = Number.isFinite(taxRateRaw) ? taxRateRaw : 0;
      const hoursPerMonth = Number.isFinite(hoursPerMonthRaw) ? hoursPerMonthRaw : 0;
      const hourlyValue = Number.isFinite(hourlyValueRaw) ? hourlyValueRaw : 0;

      // Optional validation (only if user entered something)
      if (Number.isFinite(monthlyExpensesRaw) && !validateNonNegative(monthlyExpensesRaw, "monthly side expenses")) return;

      if (Number.isFinite(taxRateRaw)) {
        if (!validateNonNegative(taxRateRaw, "tax rate")) return;
        if (taxRateRaw > 80) {
          setResultError("Enter a realistic tax rate (0% to 80%).");
          return;
        }
      }

      if (Number.isFinite(hoursPerMonthRaw)) {
        if (!validateNonNegative(hoursPerMonthRaw, "hours per month")) return;
        if (hoursPerMonthRaw > 400) {
          setResultError("Enter a realistic hours per month value (0 to 400).");
          return;
        }
      }

      if (Number.isFinite(hourlyValueRaw) && !validateNonNegative(hourlyValueRaw, "value per hour")) return;

      // Calculation logic
      const monthlyProfitBeforeTax = monthlyIncome - monthlyExpenses;

      if (!Number.isFinite(monthlyProfitBeforeTax) || monthlyProfitBeforeTax <= 0) {
        setResultError("Your monthly profit is 0 or negative. Increase income or reduce expenses to reach break-even.");
        return;
      }

      const taxMultiplier = 1 - Math.min(Math.max(taxRate, 0), 100) / 100;
      const monthlyProfitAfterTax = monthlyProfitBeforeTax * taxMultiplier;

      if (!Number.isFinite(monthlyProfitAfterTax) || monthlyProfitAfterTax <= 0) {
        setResultError("After tax, your monthly profit is 0 or negative. Adjust income, expenses, or tax rate.");
        return;
      }

      const breakEvenMonths = setupCost / monthlyProfitAfterTax;
      const approxDays = breakEvenMonths * 30.44;

      // 12-month view
      const yearNetAfterTax = monthlyProfitAfterTax * 12;
      const yearNetAfterSetup = yearNetAfterTax - setupCost;

      // Optional: time cost view
      const includeTimeCost = hoursPerMonth > 0 && hourlyValue > 0;
      let timeCostPerMonth = 0;
      let effectiveMonthlyProfit = 0;
      let effectiveBreakEvenMonths = 0;
      let effectiveApproxDays = 0;

      if (includeTimeCost) {
        timeCostPerMonth = hoursPerMonth * hourlyValue;
        effectiveMonthlyProfit = monthlyProfitAfterTax - timeCostPerMonth;

        if (effectiveMonthlyProfit > 0) {
          effectiveBreakEvenMonths = setupCost / effectiveMonthlyProfit;
          effectiveApproxDays = effectiveBreakEvenMonths * 30.44;
        }
      }

      // Build output HTML
      const currencySetup = formatNumberTwoDecimals(setupCost);
      const currencyMonthlyIncome = formatNumberTwoDecimals(monthlyIncome);
      const currencyMonthlyExpenses = formatNumberTwoDecimals(monthlyExpenses);
      const currencyProfitBeforeTax = formatNumberTwoDecimals(monthlyProfitBeforeTax);
      const currencyProfitAfterTax = formatNumberTwoDecimals(monthlyProfitAfterTax);
      const currencyYearAfterTax = formatNumberTwoDecimals(yearNetAfterTax);
      const currencyYearAfterSetup = formatNumberTwoDecimals(yearNetAfterSetup);

      const breakEvenMonthsText = formatNumberTwoDecimals(breakEvenMonths);
      const approxDaysText = formatNumberTwoDecimals(approxDays);

      let timeBlockHtml = "";
      if (includeTimeCost) {
        const currencyTimeCost = formatNumberTwoDecimals(timeCostPerMonth);

        if (effectiveMonthlyProfit <= 0) {
          timeBlockHtml = `
            <p><strong>Time cost per month:</strong> ${currencyTimeCost}</p>
            <p><strong>Effective profit after time cost:</strong> ${formatNumberTwoDecimals(effectiveMonthlyProfit)}</p>
            <p><strong>Effective break-even:</strong> Not reachable (your time cost exceeds your monthly profit).</p>
          `;
        } else {
          timeBlockHtml = `
            <p><strong>Time cost per month:</strong> ${currencyTimeCost}</p>
            <p><strong>Effective profit after time cost:</strong> ${formatNumberTwoDecimals(effectiveMonthlyProfit)}</p>
            <p><strong>Effective break-even:</strong> ${formatNumberTwoDecimals(effectiveBreakEvenMonths)} months (about ${formatNumberTwoDecimals(effectiveApproxDays)} days)</p>
          `;
        }
      } else {
        timeBlockHtml = `
          <p><strong>Time cost view:</strong> Not included (add hours per month and a value per hour to estimate effective break-even).</p>
        `;
      }

      const assumptionsUsed = `
        <ul>
          <li>Monthly expenses defaulted to 0 if left blank.</li>
          <li>Tax rate defaulted to 0% if left blank.</li>
          <li>Break-even months converted to days using an average month length (30.44 days).</li>
        </ul>
      `;

      const resultHtml = `
        <p><strong>Setup cost:</strong> ${currencySetup}</p>
        <p><strong>Monthly income:</strong> ${currencyMonthlyIncome}</p>
        <p><strong>Monthly expenses:</strong> ${currencyMonthlyExpenses}</p>

        <p><strong>Monthly profit (before tax):</strong> ${currencyProfitBeforeTax}</p>
        <p><strong>Monthly profit (after tax):</strong> ${currencyProfitAfterTax}</p>

        <p><strong>Break-even time:</strong> ${breakEvenMonthsText} months (about ${approxDaysText} days)</p>

        <p><strong>12-month profit (after tax):</strong> ${currencyYearAfterTax}</p>
        <p><strong>12-month net after setup cost:</strong> ${currencyYearAfterSetup}</p>

        <hr>

        ${timeBlockHtml}

        <hr>

        <p><strong>Assumptions used for this result:</strong></p>
        ${assumptionsUsed}
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
      const message = "Side Income Break-Even Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
