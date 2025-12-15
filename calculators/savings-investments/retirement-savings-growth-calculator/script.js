document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentAgeInput = document.getElementById("currentAge");
  const retirementAgeInput = document.getElementById("retirementAge");
  const currentBalanceInput = document.getElementById("currentBalance");
  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const annualReturnRateInput = document.getElementById("annualReturnRate");
  const annualFeeRateInput = document.getElementById("annualFeeRate");
  const annualInflationRateInput = document.getElementById("annualInflationRate");
  const annualContributionIncreaseInput = document.getElementById("annualContributionIncrease");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(currentAgeInput);
  attachLiveFormatting(retirementAgeInput);
  attachLiveFormatting(currentBalanceInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(annualReturnRateInput);
  attachLiveFormatting(annualFeeRateInput);
  attachLiveFormatting(annualInflationRateInput);
  attachLiveFormatting(annualContributionIncreaseInput);

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

  function validatePercentRange(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    if (value < 0 || value > 100) {
      setResultError(fieldLabel + " must be between 0 and 100.");
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

      const currentAge = toNumber(currentAgeInput ? currentAgeInput.value : "");
      const retirementAge = toNumber(retirementAgeInput ? retirementAgeInput.value : "");
      const currentBalance = toNumber(currentBalanceInput ? currentBalanceInput.value : "");
      const monthlyContribution = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const annualReturnRate = toNumber(annualReturnRateInput ? annualReturnRateInput.value : "");

      const annualFeeRateRaw = toNumber(annualFeeRateInput ? annualFeeRateInput.value : "");
      const annualInflationRateRaw = toNumber(annualInflationRateInput ? annualInflationRateInput.value : "");
      const annualContributionIncreaseRaw = toNumber(annualContributionIncreaseInput ? annualContributionIncreaseInput.value : "");

      if (
        !currentAgeInput ||
        !retirementAgeInput ||
        !currentBalanceInput ||
        !monthlyContributionInput ||
        !annualReturnRateInput
      ) {
        return;
      }

      if (!validatePositive(currentAge, "current age")) return;
      if (!validatePositive(retirementAge, "retirement age")) return;

      if (!Number.isFinite(currentBalance) || currentBalance < 0) {
        setResultError("Enter a valid current retirement savings amount (0 or higher).");
        return;
      }
      if (!validateNonNegative(monthlyContribution, "monthly contribution")) return;

      if (!validatePercentRange(annualReturnRate, "Expected annual return")) return;

      const annualFeeRate = Number.isFinite(annualFeeRateRaw) ? annualFeeRateRaw : 0;
      const annualInflationRate = Number.isFinite(annualInflationRateRaw) ? annualInflationRateRaw : 0;
      const annualContributionIncrease = Number.isFinite(annualContributionIncreaseRaw) ? annualContributionIncreaseRaw : 0;

      if (!validatePercentRange(annualFeeRate, "Annual fees")) return;
      if (!validatePercentRange(annualInflationRate, "Inflation")) return;
      if (!validatePercentRange(annualContributionIncrease, "Contribution increase per year")) return;

      if (retirementAge <= currentAge) {
        setResultError("Retirement age must be greater than current age.");
        return;
      }

      const years = retirementAge - currentAge;
      const months = Math.round(years * 12);

      const netAnnualReturnPct = annualReturnRate - annualFeeRate;
      if (netAnnualReturnPct < -100) {
        setResultError("Annual fees are too high relative to your return assumption.");
        return;
      }

      const netAnnualReturn = netAnnualReturnPct / 100;
      const monthlyRate = Math.pow(1 + netAnnualReturn, 1 / 12) - 1;

      const contribIncreaseAnnual = annualContributionIncrease / 100;
      const contribIncreaseMonthly = Math.pow(1 + contribIncreaseAnnual, 1 / 12) - 1;

      let balance = currentBalance;
      let totalContributions = 0;

      for (let m = 0; m < months; m++) {
        const contribThisMonth = monthlyContribution * Math.pow(1 + contribIncreaseMonthly, m);
        balance = balance * (1 + monthlyRate) + contribThisMonth;
        totalContributions += contribThisMonth;
      }

      const projectedBalance = balance;
      const growthAmount = projectedBalance - currentBalance - totalContributions;

      const inflationAnnual = annualInflationRate / 100;
      const inflationFactor = Math.pow(1 + inflationAnnual, years);
      const inflationAdjusted = inflationFactor > 0 ? projectedBalance / inflationFactor : projectedBalance;

      const safeWithdrawalAnnual = projectedBalance * 0.04;
      const safeWithdrawalMonthly = safeWithdrawalAnnual / 12;

      const projectedBalanceFmt = formatNumberTwoDecimals(projectedBalance);
      const totalContribFmt = formatNumberTwoDecimals(totalContributions);
      const growthFmt = formatNumberTwoDecimals(growthAmount);
      const inflationAdjustedFmt = formatNumberTwoDecimals(inflationAdjusted);
      const swMonthlyFmt = formatNumberTwoDecimals(safeWithdrawalMonthly);
      const swAnnualFmt = formatNumberTwoDecimals(safeWithdrawalAnnual);

      const resultHtml = `
        <p><strong>Projected balance at age ${retirementAge}:</strong> ${projectedBalanceFmt}</p>
        <p><strong>Total contributions (from today to retirement):</strong> ${totalContribFmt}</p>
        <p><strong>Estimated investment growth:</strong> ${growthFmt}</p>
        <p><strong>Inflation-adjusted balance (today’s money):</strong> ${inflationAdjustedFmt}</p>
        <p><strong>Rule-of-thumb retirement income (4% guideline):</strong> ${swAnnualFmt} per year (${swMonthlyFmt} per month)</p>
        <p><em>Assumptions used:</em> Net return ${formatNumberTwoDecimals(netAnnualReturnPct)}% per year, fees ${formatNumberTwoDecimals(annualFeeRate)}%, inflation ${formatNumberTwoDecimals(annualInflationRate)}%, contribution increase ${formatNumberTwoDecimals(annualContributionIncrease)}%.</p>
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
      const message = "Retirement Savings Growth Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
