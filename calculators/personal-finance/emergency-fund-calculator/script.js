document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyEssentialsInput = document.getElementById("monthlyEssentials");
  const targetMonthsInput = document.getElementById("targetMonths");
  const currentSavingsInput = document.getElementById("currentSavings");
  const monthlyContributionInput = document.getElementById("monthlyContribution");
  const annualApyInput = document.getElementById("annualApy");

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

  attachLiveFormatting(monthlyEssentialsInput);
  attachLiveFormatting(currentSavingsInput);
  attachLiveFormatting(monthlyContributionInput);

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
      const monthlyEssentials = toNumber(monthlyEssentialsInput ? monthlyEssentialsInput.value : "");
      const rawTargetMonths = toNumber(targetMonthsInput ? targetMonthsInput.value : "");
      const currentSavings = toNumber(currentSavingsInput ? currentSavingsInput.value : "");
      const monthlyContribution = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");
      const annualApy = toNumber(annualApyInput ? annualApyInput.value : "");

      // Input existence guard
      if (!monthlyEssentialsInput || !targetMonthsInput || !currentSavingsInput || !monthlyContributionInput || !annualApyInput) {
        return;
      }

      // Validation
      if (!validatePositive(monthlyEssentials, "essential monthly expenses")) return;

      let targetMonths = rawTargetMonths;
      if (!Number.isFinite(targetMonths) || targetMonths <= 0) {
        targetMonths = 3;
      }

      if (targetMonths > 60) {
        setResultError("Enter a target months value of 60 or less (or leave it blank to use 3).");
        return;
      }

      const safeCurrentSavings = Number.isFinite(currentSavings) ? currentSavings : 0;
      const safeMonthlyContribution = Number.isFinite(monthlyContribution) ? monthlyContribution : 0;
      const safeAnnualApy = Number.isFinite(annualApy) ? annualApy : 0;

      if (!validateNonNegative(safeCurrentSavings, "current emergency savings")) return;
      if (!validateNonNegative(safeMonthlyContribution, "monthly contribution")) return;
      if (!validateNonNegative(safeAnnualApy, "interest rate")) return;

      if (safeAnnualApy > 25) {
        setResultError("Enter a realistic interest rate (25% or less).");
        return;
      }

      // Calculation logic
      const targetAmount = monthlyEssentials * targetMonths;
      const gap = Math.max(0, targetAmount - safeCurrentSavings);

      const currentCoverageMonths = safeCurrentSavings > 0 ? (safeCurrentSavings / monthlyEssentials) : 0;

      const monthlyRate = safeAnnualApy > 0 ? (safeAnnualApy / 100) / 12 : 0;

      let monthsToGoal = null;
      let timelineNote = "";

      if (gap === 0) {
        monthsToGoal = 0;
      } else if (safeMonthlyContribution > 0) {
        if (monthlyRate <= 0) {
          monthsToGoal = Math.ceil(gap / safeMonthlyContribution);
          timelineNote = "Timeline assumes a constant monthly contribution and no interest.";
        } else {
          // Future value with contributions:
          // FV(n) = P*(1+r)^n + PMT*(((1+r)^n - 1)/r)
          // Solve for n where FV(n) >= targetAmount.
          const P = safeCurrentSavings;
          const PMT = safeMonthlyContribution;
          const r = monthlyRate;
          const target = targetAmount;

          // If contributions are too small relative to interest scenario, still compute iteratively (safe, bounded).
          let n = 0;
          let fv = P;
          const maxMonths = 1200; // 100 years safety cap

          while (n < maxMonths && fv < target) {
            fv = fv * (1 + r) + PMT;
            n += 1;
          }

          if (n >= maxMonths) {
            monthsToGoal = null;
            timelineNote = "Timeline could not be estimated with these inputs.";
          } else {
            monthsToGoal = n;
            timelineNote = "Timeline assumes constant monthly contributions and a steady interest rate compounded monthly.";
          }
        }
      }

      // Build output HTML
      const targetAmountFormatted = formatNumberTwoDecimals(targetAmount);
      const currentSavingsFormatted = formatNumberTwoDecimals(safeCurrentSavings);
      const gapFormatted = formatNumberTwoDecimals(gap);

      const coverageText = Number.isFinite(currentCoverageMonths) && currentCoverageMonths > 0
        ? `${formatNumberTwoDecimals(currentCoverageMonths)} months`
        : "0.00 months";

      let monthsLine = "";
      if (monthsToGoal === 0) {
        monthsLine = `<p><strong>Estimated time to goal:</strong> You are already at or above your target.</p>`;
      } else if (typeof monthsToGoal === "number") {
        const years = Math.floor(monthsToGoal / 12);
        const remMonths = monthsToGoal % 12;
        const yearsPart = years > 0 ? `${years} year${years === 1 ? "" : "s"}` : "";
        const monthsPart = remMonths > 0 ? `${remMonths} month${remMonths === 1 ? "" : "s"}` : "";
        const combined = yearsPart && monthsPart ? `${yearsPart} ${monthsPart}` : (yearsPart || monthsPart);

        monthsLine = `<p><strong>Estimated time to goal:</strong> ${combined} (${monthsToGoal} months)</p>`;
      } else if (gap > 0 && safeMonthlyContribution <= 0) {
        monthsLine = `<p><strong>Estimated time to goal:</strong> Add a monthly contribution to estimate a timeline.</p>`;
      } else {
        monthsLine = `<p><strong>Estimated time to goal:</strong> Not available with these inputs.</p>`;
      }

      const usedMonthsText = rawTargetMonths && rawTargetMonths > 0 ? `${targetMonths}` : "3 (default)";
      const usedApyText = safeAnnualApy > 0 ? `${formatNumberTwoDecimals(safeAnnualApy)}%` : "0% (default)";

      const resultHtml = `
        <p><strong>Emergency fund target:</strong> ${targetAmountFormatted}</p>
        <p><strong>Current emergency savings:</strong> ${currentSavingsFormatted}</p>
        <p><strong>Remaining gap:</strong> ${gapFormatted}</p>
        <p><strong>Current coverage:</strong> ${coverageText} of essential expenses</p>
        ${monthsLine}
        <p><strong>Assumptions used in this result:</strong> Target months = ${usedMonthsText}. Interest rate (APY) = ${usedApyText}.</p>
        ${timelineNote ? `<p>${timelineNote}</p>` : ""}
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
      const message = "Emergency Fund Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
