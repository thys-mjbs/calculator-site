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
  const extraMonthlyContributionInput = document.getElementById("extraMonthlyContribution");
  const annualReturnInput = document.getElementById("annualReturn");
  const annualFeeInput = document.getElementById("annualFee");
  const annualContributionIncreaseInput = document.getElementById("annualContributionIncrease");
  const annualInflationInput = document.getElementById("annualInflation");
  const withdrawalRateInput = document.getElementById("withdrawalRate");

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
  attachLiveFormatting(currentAgeInput);
  attachLiveFormatting(retirementAgeInput);
  attachLiveFormatting(currentBalanceInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(extraMonthlyContributionInput);
  attachLiveFormatting(annualReturnInput);
  attachLiveFormatting(annualFeeInput);
  attachLiveFormatting(annualContributionIncreaseInput);
  attachLiveFormatting(annualInflationInput);
  attachLiveFormatting(withdrawalRateInput);

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

  function validateRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function projectScenario(params) {
    const months = params.months;
    const monthlyRate = params.monthlyRate;
    const annualIncreaseRate = params.annualIncreaseRate;

    let balance = params.startBalance;
    let totalContrib = 0;

    // Monthly contribution starts at baseMonthly, steps up once per year (every 12 months)
    let monthlyContrib = params.baseMonthly;

    for (let m = 1; m <= months; m++) {
      // Add contribution at start of month (simple and consistent)
      balance += monthlyContrib;
      totalContrib += monthlyContrib;

      // Grow the whole balance for the month
      balance *= (1 + monthlyRate);

      // Step up contribution after each 12 months
      if (annualIncreaseRate > 0 && m % 12 === 0) {
        monthlyContrib *= (1 + annualIncreaseRate);
      }
    }

    return {
      endingBalance: balance,
      totalContributions: totalContrib,
      totalGrowth: balance - params.startBalance - totalContrib
    };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const currentAge = toNumber(currentAgeInput ? currentAgeInput.value : "");
      const retirementAge = toNumber(retirementAgeInput ? retirementAgeInput.value : "");
      const currentBalance = toNumber(currentBalanceInput ? currentBalanceInput.value : "");
      const monthlyContribution = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const extraMonthlyContributionRaw = toNumber(extraMonthlyContributionInput ? extraMonthlyContributionInput.value : "");
      const annualReturnPct = toNumber(annualReturnInput ? annualReturnInput.value : "");
      const annualFeePct = toNumber(annualFeeInput ? annualFeeInput.value : "");
      const annualContribIncreasePct = toNumber(annualContributionIncreaseInput ? annualContributionIncreaseInput.value : "");
      const annualInflationPct = toNumber(annualInflationInput ? annualInflationInput.value : "");
      const withdrawalRatePct = toNumber(withdrawalRateInput ? withdrawalRateInput.value : "");

      // Basic existence guard
      if (
        !currentAgeInput ||
        !retirementAgeInput ||
        !currentBalanceInput ||
        !monthlyContributionInput ||
        !annualReturnInput
      ) {
        return;
      }

      // Required validations
      if (!validatePositive(currentAge, "current age")) return;
      if (!validatePositive(retirementAge, "retirement age")) return;
      if (!validateNonNegative(currentBalance, "current retirement balance")) return;
      if (!validatePositive(monthlyContribution, "monthly contribution")) return;

      // Age sanity
      if (!validateRange(currentAge, "current age", 10, 90)) return;
      if (!validateRange(retirementAge, "retirement age", 20, 100)) return;
      if (retirementAge <= currentAge) {
        setResultError("Retirement age must be greater than current age.");
        return;
      }

      // Rate validations (allow 0 or more for optional; return required but can be 0)
      if (!validateRange(annualReturnPct, "expected annual return (percent)", -50, 50)) return;

      const annualFee = Number.isFinite(annualFeePct) ? annualFeePct : 0;
      const annualContribIncrease = Number.isFinite(annualContribIncreasePct) ? annualContribIncreasePct : 0;
      const annualInflation = Number.isFinite(annualInflationPct) ? annualInflationPct : 0;
      const withdrawalRate = Number.isFinite(withdrawalRatePct) ? withdrawalRatePct : 4;

      if (!validateRange(annualFee, "annual fees (percent)", 0, 10)) return;
      if (!validateRange(annualContribIncrease, "annual contribution increase (percent)", 0, 25)) return;
      if (!validateRange(annualInflation, "inflation (percent)", 0, 20)) return;
      if (!validateRange(withdrawalRate, "withdrawal rate (percent per year)", 1, 10)) return;

      const extraMonthlyContribution = Number.isFinite(extraMonthlyContributionRaw) ? extraMonthlyContributionRaw : 0;
      if (!validateNonNegative(extraMonthlyContribution, "extra monthly contribution")) return;

      const years = retirementAge - currentAge;
      const months = Math.round(years * 12);

      // Net annual return after fees
      const netAnnualReturnPct = annualReturnPct - annualFee;
      const monthlyRate = (netAnnualReturnPct / 100) / 12;

      const annualIncreaseRate = (annualContribIncrease / 100);

      // Run baseline scenario
      const baseline = projectScenario({
        months: months,
        monthlyRate: monthlyRate,
        annualIncreaseRate: annualIncreaseRate,
        startBalance: currentBalance,
        baseMonthly: monthlyContribution
      });

      // Run increased contribution scenario
      const increased = projectScenario({
        months: months,
        monthlyRate: monthlyRate,
        annualIncreaseRate: annualIncreaseRate,
        startBalance: currentBalance,
        baseMonthly: monthlyContribution + extraMonthlyContribution
      });

      const diffBalance = increased.endingBalance - baseline.endingBalance;
      const diffContrib = increased.totalContributions - baseline.totalContributions;

      // Inflation adjustment (today's money), optional
      let baselineReal = null;
      let increasedReal = null;
      if (annualInflation > 0) {
        const inflationFactor = Math.pow(1 + (annualInflation / 100), years);
        baselineReal = baseline.endingBalance / inflationFactor;
        increasedReal = increased.endingBalance / inflationFactor;
      }

      // Retirement income estimate (annual and monthly) using withdrawal rate
      const annualIncomeBaseline = baseline.endingBalance * (withdrawalRate / 100);
      const annualIncomeIncreased = increased.endingBalance * (withdrawalRate / 100);
      const monthlyIncomeBaseline = annualIncomeBaseline / 12;
      const monthlyIncomeIncreased = annualIncomeIncreased / 12;

      const pctLift = baseline.endingBalance > 0 ? (diffBalance / baseline.endingBalance) * 100 : 0;

      const resultHtml = `
        <p><strong>Time horizon:</strong> ${years} years (${months} months)</p>

        <p><strong>Baseline projected balance at retirement:</strong> ${formatNumberTwoDecimals(baseline.endingBalance)}</p>
        <p><strong>Increased contribution projected balance:</strong> ${formatNumberTwoDecimals(increased.endingBalance)}</p>
        <p><strong>Difference:</strong> ${formatNumberTwoDecimals(diffBalance)} (${formatNumberTwoDecimals(pctLift)}% higher)</p>

        <hr>

        <p><strong>Total contributions (baseline):</strong> ${formatNumberTwoDecimals(baseline.totalContributions)}</p>
        <p><strong>Total contributions (increased):</strong> ${formatNumberTwoDecimals(increased.totalContributions)}</p>
        <p><strong>Extra contributed:</strong> ${formatNumberTwoDecimals(diffContrib)}</p>

        <hr>

        <p><strong>Estimated retirement income (baseline):</strong> ${formatNumberTwoDecimals(monthlyIncomeBaseline)} per month (${formatNumberTwoDecimals(annualIncomeBaseline)} per year)</p>
        <p><strong>Estimated retirement income (increased):</strong> ${formatNumberTwoDecimals(monthlyIncomeIncreased)} per month (${formatNumberTwoDecimals(annualIncomeIncreased)} per year)</p>
        <p><strong>Monthly income difference:</strong> ${formatNumberTwoDecimals(monthlyIncomeIncreased - monthlyIncomeBaseline)} per month</p>
        ${
          annualInflation > 0
            ? `<hr>
               <p><strong>In today’s money (inflation-adjusted):</strong></p>
               <p>Baseline: ${formatNumberTwoDecimals(baselineReal)}</p>
               <p>Increased: ${formatNumberTwoDecimals(increasedReal)}</p>
               <p>Difference: ${formatNumberTwoDecimals(increasedReal - baselineReal)}</p>`
            : ""
        }
        <hr>
        <p><strong>Assumptions used:</strong> Net return ${formatNumberTwoDecimals(netAnnualReturnPct)}% per year, contribution increase ${formatNumberTwoDecimals(annualContribIncrease)}% per year${annualInflation > 0 ? `, inflation ${formatNumberTwoDecimals(annualInflation)}% per year` : ""}, withdrawal rate ${formatNumberTwoDecimals(withdrawalRate)}% per year.</p>
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
      const message = "Retirement Contribution Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
