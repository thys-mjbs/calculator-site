document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentRentInput = document.getElementById("currentRent");
  const increasePercentInput = document.getElementById("increasePercent");
  const monthsToProjectInput = document.getElementById("monthsToProject");

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

  // Money fields should be formatted with commas
  attachLiveFormatting(currentRentInput);

  // Percent field: allow decimals, but still let commas helper clean input safely
  attachLiveFormatting(increasePercentInput);

  // Months: commas are harmless but not necessary; skip formatting to keep it simple

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
      clearResult();

      if (!currentRentInput || !increasePercentInput) return;

      const currentRent = toNumber(currentRentInput.value);
      const increasePercent = toNumber(increasePercentInput.value);

      let monthsToProject = 12;
      if (monthsToProjectInput && monthsToProjectInput.value.trim() !== "") {
        const parsedMonths = toNumber(monthsToProjectInput.value);
        if (Number.isFinite(parsedMonths)) monthsToProject = parsedMonths;
      }

      if (!validatePositive(currentRent, "current monthly rent")) return;
      if (!validateNonNegative(increasePercent, "rent increase percentage")) return;

      if (increasePercent > 200) {
        setResultError("That increase percentage looks unusually high. Enter a realistic rent increase percentage (for example, 5 to 15).");
        return;
      }

      if (!Number.isFinite(monthsToProject) || monthsToProject <= 0) {
        setResultError("Enter a valid months to project value greater than 0 (for example, 12).");
        return;
      }

      if (monthsToProject > 240) {
        setResultError("Months to project is too large. Use a smaller number of months (240 or less).");
        return;
      }

      const increaseRate = increasePercent / 100;
      const increaseAmountMonthly = currentRent * increaseRate;
      const newMonthlyRent = currentRent + increaseAmountMonthly;

      const currentAnnualRent = currentRent * 12;
      const newAnnualRent = newMonthlyRent * 12;
      const annualIncrease = newAnnualRent - currentAnnualRent;

      const projectedExtraCost = increaseAmountMonthly * monthsToProject;
      const weeklyRentApprox = newMonthlyRent * 12 / 52;

      const resultHtml = `
        <p><strong>New monthly rent:</strong> ${formatNumberTwoDecimals(newMonthlyRent)}</p>
        <p><strong>Increase per month:</strong> ${formatNumberTwoDecimals(increaseAmountMonthly)} (${increasePercent.toFixed(2)}%)</p>
        <p><strong>New annual rent:</strong> ${formatNumberTwoDecimals(newAnnualRent)}</p>
        <p><strong>Increase per year:</strong> ${formatNumberTwoDecimals(annualIncrease)}</p>
        <p><strong>Extra cost over ${monthsToProject} month(s):</strong> ${formatNumberTwoDecimals(projectedExtraCost)}</p>
        <p><strong>Approx. rent per week:</strong> ${formatNumberTwoDecimals(weeklyRentApprox)}</p>
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
      const message = "Rent Increase Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
