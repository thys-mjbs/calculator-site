document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyRentInput = document.getElementById("monthlyRent");
  const monthlyOpExBaseInput = document.getElementById("monthlyOpExBase");
  const monthlyMortgagePaymentInput = document.getElementById("monthlyMortgagePayment");
  const cashInvestedInput = document.getElementById("cashInvested");

  const advancedToggle = document.getElementById("advancedToggle");
  const advancedSection = document.getElementById("advancedSection");

  const monthlyOtherIncomeInput = document.getElementById("monthlyOtherIncome");
  const vacancyRateInput = document.getElementById("vacancyRate");
  const managementRateInput = document.getElementById("managementRate");
  const maintenanceReserveRateInput = document.getElementById("maintenanceReserveRate");
  const otherMonthlyCostsInput = document.getElementById("otherMonthlyCosts");

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
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(monthlyOpExBaseInput);
  attachLiveFormatting(monthlyMortgagePaymentInput);
  attachLiveFormatting(cashInvestedInput);
  attachLiveFormatting(monthlyOtherIncomeInput);
  attachLiveFormatting(otherMonthlyCostsInput);

  // Percent inputs can still use commas helper (keeps consistent numeric cleanup)
  attachLiveFormatting(vacancyRateInput);
  attachLiveFormatting(managementRateInput);
  attachLiveFormatting(maintenanceReserveRateInput);

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
  function showMode() {
    if (!advancedToggle || !advancedSection) return;
    if (advancedToggle.checked) {
      advancedSection.classList.remove("hidden");
    } else {
      advancedSection.classList.add("hidden");
    }
    clearResult();
  }

  if (advancedToggle) {
    showMode();
    advancedToggle.addEventListener("change", function () {
      showMode();
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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required inputs using toNumber() (from /scripts/main.js)
      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");
      const monthlyOpExBase = toNumber(monthlyOpExBaseInput ? monthlyOpExBaseInput.value : "");
      const monthlyMortgagePayment = toNumber(monthlyMortgagePaymentInput ? monthlyMortgagePaymentInput.value : "");
      const cashInvested = toNumber(cashInvestedInput ? cashInvestedInput.value : "");

      // Optional inputs (defaults)
      const monthlyOtherIncome = toNumber(monthlyOtherIncomeInput ? monthlyOtherIncomeInput.value : "0");
      const vacancyRate = toNumber(vacancyRateInput ? vacancyRateInput.value : "5");
      const managementRate = toNumber(managementRateInput ? managementRateInput.value : "0");
      const maintenanceReserveRate = toNumber(maintenanceReserveRateInput ? maintenanceReserveRateInput.value : "5");
      const otherMonthlyCosts = toNumber(otherMonthlyCostsInput ? otherMonthlyCostsInput.value : "0");

      // Basic existence guard
      if (!monthlyRentInput || !monthlyOpExBaseInput || !monthlyMortgagePaymentInput || !cashInvestedInput) return;

      // Validation (required)
      if (!validatePositive(monthlyRent, "monthly rent")) return;
      if (!validateNonNegative(monthlyOpExBase, "monthly operating expenses")) return;
      if (!validateNonNegative(monthlyMortgagePayment, "monthly mortgage payment")) return;
      if (!validatePositive(cashInvested, "total cash invested")) return;

      // Validation (optional)
      if (!validateNonNegative(monthlyOtherIncome, "other monthly income")) return;
      if (!validatePercent(vacancyRate, "vacancy allowance (%)")) return;
      if (!validatePercent(managementRate, "management fee (%)")) return;
      if (!validatePercent(maintenanceReserveRate, "maintenance and capex reserve (%)")) return;
      if (!validateNonNegative(otherMonthlyCosts, "other fixed monthly costs")) return;

      // Calculation logic
      const grossMonthlyIncome = monthlyRent + monthlyOtherIncome;

      const v = vacancyRate / 100;
      const m = managementRate / 100;
      const r = maintenanceReserveRate / 100;

      const vacancyLoss = grossMonthlyIncome * v;
      const effectiveMonthlyIncome = grossMonthlyIncome - vacancyLoss;

      const managementFee = effectiveMonthlyIncome * m;
      const maintenanceReserve = grossMonthlyIncome * r;

      const totalMonthlyOperating =
        monthlyOpExBase + otherMonthlyCosts + managementFee + maintenanceReserve;

      const monthlyCashFlow = effectiveMonthlyIncome - totalMonthlyOperating - monthlyMortgagePayment;
      const annualCashFlow = monthlyCashFlow * 12;

      const cashOnCash = (annualCashFlow / cashInvested) * 100;

      let paybackYearsText = "Not applicable (cash flow is not positive).";
      if (annualCashFlow > 0) {
        const paybackYears = cashInvested / annualCashFlow;
        paybackYearsText = formatNumberTwoDecimals(paybackYears) + " years (approx.)";
      }

      // Break-even rent estimate
      // cash flow = (R + OI) * [ (1 - v) * (1 - m) - r ] - (baseOpEx + otherCosts + mortgage)
      const fixedMonthlyCosts = monthlyOpExBase + otherMonthlyCosts + monthlyMortgagePayment;
      const coeff = (1 - v) * (1 - m) - r;

      let breakEvenRentText = "Not available with the current advanced percentages.";
      if (coeff > 0) {
        const breakEvenRent = (fixedMonthlyCosts / coeff) - monthlyOtherIncome;
        if (Number.isFinite(breakEvenRent) && breakEvenRent > 0) {
          breakEvenRentText = formatNumberTwoDecimals(breakEvenRent) + " per month";
        } else {
          breakEvenRentText = "Not meaningful with the current inputs.";
        }
      }

      // Simple sensitivity: rent -10% and +10% (holding other inputs constant)
      function computeCashOnCashForRent(testRent) {
        const testGross = testRent + monthlyOtherIncome;
        const testVacancyLoss = testGross * v;
        const testEffective = testGross - testVacancyLoss;
        const testMgmt = testEffective * m;
        const testMaint = testGross * r;
        const testOp = monthlyOpExBase + otherMonthlyCosts + testMgmt + testMaint;
        const testMonthlyCF = testEffective - testOp - monthlyMortgagePayment;
        const testAnnualCF = testMonthlyCF * 12;
        return (testAnnualCF / cashInvested) * 100;
      }

      const cocDown = computeCashOnCashForRent(monthlyRent * 0.9);
      const cocUp = computeCashOnCashForRent(monthlyRent * 1.1);

      // Build output HTML
      const resultHtml = `
        <p><strong>Cash-on-cash return:</strong> ${formatNumberTwoDecimals(cashOnCash)}%</p>
        <p><strong>Monthly cash flow:</strong> ${formatNumberTwoDecimals(monthlyCashFlow)}</p>
        <p><strong>Annual cash flow:</strong> ${formatNumberTwoDecimals(annualCashFlow)}</p>
        <p><strong>Payback period:</strong> ${paybackYearsText}</p>
        <p><strong>Break-even rent (estimate):</strong> ${breakEvenRentText}</p>
        <p><strong>Sensitivity (rent only):</strong> if rent is 10% lower: ${formatNumberTwoDecimals(cocDown)}% • if rent is 10% higher: ${formatNumberTwoDecimals(cocUp)}%</p>
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
      const message = "Cash-on-Cash Return Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
