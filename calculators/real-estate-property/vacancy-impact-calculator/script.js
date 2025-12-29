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
  const vacantDaysInput = document.getElementById("vacantDays");
  const vacancyHoldingCostsInput = document.getElementById("vacancyHoldingCosts");
  const turnoverCostInput = document.getElementById("turnoverCost");

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
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(vacantDaysInput);
  attachLiveFormatting(vacancyHoldingCostsInput);
  attachLiveFormatting(turnoverCostInput);

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

  function validateVacantDays(days) {
    if (!Number.isFinite(days)) {
      setResultError("Enter a valid expected vacant days per year.");
      return false;
    }
    if (days < 0) {
      setResultError("Vacant days cannot be negative.");
      return false;
    }
    if (days >= 365) {
      setResultError("Vacant days must be less than 365 to calculate occupancy and income.");
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

      if (!monthlyRentInput || !vacantDaysInput || !vacancyHoldingCostsInput || !turnoverCostInput) {
        return;
      }

      const monthlyRent = toNumber(monthlyRentInput.value);
      const vacantDays = toNumber(vacantDaysInput.value);
      const monthlyVacancyHoldingCosts = toNumber(vacancyHoldingCostsInput.value);
      const turnoverCost = toNumber(turnoverCostInput.value);

      if (!validatePositive(monthlyRent, "monthly rent")) return;
      if (!validateVacantDays(vacantDays)) return;
      if (!validateNonNegative(monthlyVacancyHoldingCosts, "monthly holding costs during vacancy")) return;
      if (!validateNonNegative(turnoverCost, "one-time turnover cost")) return;

      const daysInYear = 365;
      const vacancyFraction = vacantDays / daysInYear;
      const occupancyFraction = 1 - vacancyFraction;

      const annualPotentialRent = monthlyRent * 12;
      const annualCollectedRentBeforeCosts = annualPotentialRent * occupancyFraction;

      const grossVacancyLoss = annualPotentialRent - annualCollectedRentBeforeCosts;

      const annualVacancyHoldingCosts = monthlyVacancyHoldingCosts * 12 * vacancyFraction;

      const netAfterVacancyCosts = annualCollectedRentBeforeCosts - annualVacancyHoldingCosts - turnoverCost;

      const effectiveMonthlyCollectedBeforeCosts = annualCollectedRentBeforeCosts / 12;

      const breakEvenOccupiedMonthlyRent = occupancyFraction > 0 ? monthlyRent / occupancyFraction : NaN;
      const rentIncreasePct = occupancyFraction > 0 ? ((breakEvenOccupiedMonthlyRent / monthlyRent) - 1) * 100 : NaN;

      const occupancyPct = occupancyFraction * 100;

      const resultHtml = `
        <p><strong>Annual vacancy loss (gross rent):</strong> ${formatNumberTwoDecimals(grossVacancyLoss)}</p>
        <p><strong>Expected annual rent collected (before vacancy costs):</strong> ${formatNumberTwoDecimals(annualCollectedRentBeforeCosts)}</p>
        <p><strong>Effective occupancy rate:</strong> ${formatNumberTwoDecimals(occupancyPct)}%</p>
        <hr>
        <p><strong>Estimated vacancy holding costs (annual):</strong> ${formatNumberTwoDecimals(annualVacancyHoldingCosts)}</p>
        <p><strong>Turnover cost assumed (annual):</strong> ${formatNumberTwoDecimals(turnoverCost)}</p>
        <p><strong>Net rent after vacancy-related costs:</strong> ${formatNumberTwoDecimals(netAfterVacancyCosts)}</p>
        <hr>
        <p><strong>Effective monthly rent collected (before vacancy costs):</strong> ${formatNumberTwoDecimals(effectiveMonthlyCollectedBeforeCosts)}</p>
        <p><strong>Break-even occupied monthly rent to match zero-vacancy income:</strong> ${formatNumberTwoDecimals(breakEvenOccupiedMonthlyRent)}</p>
        <p><strong>Equivalent rent increase needed (planning benchmark):</strong> ${formatNumberTwoDecimals(rentIncreasePct)}%</p>
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
      const message = "Vacancy Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
