document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentAge = document.getElementById("currentAge");
  const retirementAge = document.getElementById("retirementAge");
  const lifeExpectancy = document.getElementById("lifeExpectancy");
  const currentSavings = document.getElementById("currentSavings");
  const monthlyContribution = document.getElementById("monthlyContribution");
  const annualReturn = document.getElementById("annualReturn");
  const inflation = document.getElementById("inflation");
  const targetMonthlyIncome = document.getElementById("targetMonthlyIncome");
  const otherMonthlyIncome = document.getElementById("otherMonthlyIncome");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like inputs only
  attachLiveFormatting(currentSavings);
  attachLiveFormatting(monthlyContribution);
  attachLiveFormatting(targetMonthlyIncome);
  attachLiveFormatting(otherMonthlyIncome);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
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

  function isNearZero(x) {
    return Math.abs(x) < 1e-10;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const currentAgeVal = toNumber(currentAge ? currentAge.value : "");
      const retirementAgeVal = toNumber(retirementAge ? retirementAge.value : "");
      const lifeExpectancyVal = toNumber(lifeExpectancy ? lifeExpectancy.value : "");

      const currentSavingsVal = toNumber(currentSavings ? currentSavings.value : "");
      const monthlyContributionVal = toNumber(monthlyContribution ? monthlyContribution.value : "");

      const annualReturnPct = toNumber(annualReturn ? annualReturn.value : "");
      const inflationPct = toNumber(inflation ? inflation.value : "");

      const targetMonthlyIncomeVal = toNumber(targetMonthlyIncome ? targetMonthlyIncome.value : "");
      const otherMonthlyIncomeVal = toNumber(otherMonthlyIncome ? otherMonthlyIncome.value : "");

      // Existence guard
      if (
        !currentAge ||
        !retirementAge ||
        !lifeExpectancy ||
        !currentSavings ||
        !monthlyContribution ||
        !annualReturn ||
        !inflation ||
        !targetMonthlyIncome ||
        !otherMonthlyIncome
      ) {
        return;
      }

      // Validation
      if (!validatePositive(currentAgeVal, "current age")) return;
      if (!validatePositive(retirementAgeVal, "retirement age")) return;
      if (!validatePositive(lifeExpectancyVal, "life expectancy")) return;

      if (retirementAgeVal <= currentAgeVal) {
        setResultError("Retirement age must be greater than current age.");
        return;
      }

      if (lifeExpectancyVal <= retirementAgeVal) {
        setResultError("Life expectancy must be greater than retirement age.");
        return;
      }

      if (!validateNonNegative(currentSavingsVal, "current savings")) return;
      if (!validateNonNegative(monthlyContributionVal, "monthly contribution")) return;

      if (!Number.isFinite(annualReturnPct) || annualReturnPct < 0) {
        setResultError("Enter a valid expected annual return (0 or higher).");
        return;
      }

      if (!Number.isFinite(inflationPct) || inflationPct < 0) {
        setResultError("Enter a valid expected inflation rate (0 or higher).");
        return;
      }

      if (!validatePositive(targetMonthlyIncomeVal, "target monthly retirement income")) return;

      if (!validateNonNegative(otherMonthlyIncomeVal, "other monthly retirement income")) return;

      // Calculation logic
      const yearsToRetirement = retirementAgeVal - currentAgeVal;
      const retirementYears = lifeExpectancyVal - retirementAgeVal;

      const rAnnual = annualReturnPct / 100;
      const iAnnual = inflationPct / 100;

      // Real annual return
      const realAnnual = (1 + rAnnual) / (1 + iAnnual) - 1;

      // Net income needed during retirement in today's money (real terms)
      const netMonthlyIncomeToday = Math.max(0, targetMonthlyIncomeVal - otherMonthlyIncomeVal);
      const netAnnualIncomeToday = netMonthlyIncomeToday * 12;

      // Required nest egg at retirement in today's money
      let requiredNestEggToday = 0;
      if (netAnnualIncomeToday <= 0) {
        requiredNestEggToday = 0;
      } else if (isNearZero(realAnnual)) {
        requiredNestEggToday = netAnnualIncomeToday * retirementYears;
      } else if (realAnnual < 0) {
        // Negative real return: still compute PV of annuity, but it grows larger
        requiredNestEggToday = netAnnualIncomeToday * (1 - Math.pow(1 + realAnnual, -retirementYears)) / realAnnual;
      } else {
        requiredNestEggToday = netAnnualIncomeToday * (1 - Math.pow(1 + realAnnual, -retirementYears)) / realAnnual;
      }

      // Accumulation projection in today's money (real terms)
      const monthlyReal = Math.pow(1 + realAnnual, 1 / 12) - 1;
      const monthsToRetirement = Math.round(yearsToRetirement * 12);

      const fvCurrentSavingsToday = currentSavingsVal * Math.pow(1 + monthlyReal, monthsToRetirement);

      let fvContribToday = 0;
      if (monthlyContributionVal > 0) {
        if (isNearZero(monthlyReal)) {
          fvContribToday = monthlyContributionVal * monthsToRetirement;
        } else {
          fvContribToday = monthlyContributionVal * ((Math.pow(1 + monthlyReal, monthsToRetirement) - 1) / monthlyReal);
        }
      }

      const projectedSavingsToday = fvCurrentSavingsToday + fvContribToday;

      const shortfallToday = requiredNestEggToday - projectedSavingsToday;

      // Convert to nominal values at retirement (inflate from today's money)
      const inflationFactorToRetirement = Math.pow(1 + iAnnual, yearsToRetirement);
      const requiredNestEggNominal = requiredNestEggToday * inflationFactorToRetirement;
      const projectedSavingsNominal = projectedSavingsToday * inflationFactorToRetirement;
      const shortfallNominal = shortfallToday * inflationFactorToRetirement;

      // Monthly contribution needed to close the gap (real terms), then convert to nominal today (same units as inputs)
      let additionalMonthlyNeeded = 0;
      if (shortfallToday > 0 && monthsToRetirement > 0) {
        if (isNearZero(monthlyReal)) {
          additionalMonthlyNeeded = shortfallToday / monthsToRetirement;
        } else {
          additionalMonthlyNeeded = shortfallToday * (monthlyReal / (Math.pow(1 + monthlyReal, monthsToRetirement) - 1));
        }
      } else {
        additionalMonthlyNeeded = 0;
      }

      const totalMonthlyNeeded = monthlyContributionVal + additionalMonthlyNeeded;

      // Build output HTML
      const shortfallLabel = shortfallToday > 0 ? "Estimated shortfall" : "Estimated surplus";
      const shortfallAbsToday = Math.abs(shortfallToday);
      const shortfallAbsNominal = Math.abs(shortfallNominal);

      const realReturnPct = realAnnual * 100;

      const resultHtml = `
        <p><strong>Years until retirement:</strong> ${formatNumberTwoDecimals(yearsToRetirement)} years</p>
        <p><strong>Retirement duration assumed:</strong> ${formatNumberTwoDecimals(retirementYears)} years</p>

        <hr>

        <p><strong>Required savings at retirement (today's money):</strong> ${formatNumberTwoDecimals(requiredNestEggToday)}</p>
        <p><strong>Projected savings at retirement (today's money):</strong> ${formatNumberTwoDecimals(projectedSavingsToday)}</p>
        <p><strong>${shortfallLabel} (today's money):</strong> ${formatNumberTwoDecimals(shortfallAbsToday)}</p>

        <hr>

        <p><strong>Required savings at retirement (nominal at retirement):</strong> ${formatNumberTwoDecimals(requiredNestEggNominal)}</p>
        <p><strong>Projected savings at retirement (nominal at retirement):</strong> ${formatNumberTwoDecimals(projectedSavingsNominal)}</p>
        <p><strong>${shortfallLabel} (nominal at retirement):</strong> ${formatNumberTwoDecimals(shortfallAbsNominal)}</p>

        <hr>

        <p><strong>Real return used (return minus inflation effect):</strong> ${formatNumberTwoDecimals(realReturnPct)}%</p>
        <p><strong>Target monthly income (today's money):</strong> ${formatNumberTwoDecimals(targetMonthlyIncomeVal)}</p>
        <p><strong>Other retirement income included (today's money):</strong> ${formatNumberTwoDecimals(otherMonthlyIncomeVal)}</p>
        <p><strong>Net monthly income needed from savings (today's money):</strong> ${formatNumberTwoDecimals(netMonthlyIncomeToday)}</p>

        <hr>

        <p><strong>Extra monthly contribution needed (starting now):</strong> ${formatNumberTwoDecimals(additionalMonthlyNeeded)}</p>
        <p><strong>Total monthly contribution suggested:</strong> ${formatNumberTwoDecimals(totalMonthlyNeeded)}</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Retirement Shortfall Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
