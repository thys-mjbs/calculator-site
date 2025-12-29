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
  const monthlyOperatingExpensesInput = document.getElementById("monthlyOperatingExpenses");
  const monthlyOtherIncomeInput = document.getElementById("monthlyOtherIncome");
  const vacancyRateInput = document.getElementById("vacancyRate");
  const monthlyReservesInput = document.getElementById("monthlyReserves");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(monthlyOperatingExpensesInput);
  attachLiveFormatting(monthlyOtherIncomeInput);
  attachLiveFormatting(vacancyRateInput);
  attachLiveFormatting(monthlyReservesInput);

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

  function validatePercentRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + "% and " + max + "%.");
      return false;
    }
    return true;
  }

  function oerBand(oerPercent) {
    if (!Number.isFinite(oerPercent)) return "";
    if (oerPercent < 35) return "Low cost burden (efficient)";
    if (oerPercent <= 50) return "Typical cost burden (normal range)";
    return "High cost burden (needs scrutiny)";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");
      const monthlyOpExBase = toNumber(monthlyOperatingExpensesInput ? monthlyOperatingExpensesInput.value : "");
      const monthlyOtherIncomeRaw = toNumber(monthlyOtherIncomeInput ? monthlyOtherIncomeInput.value : "");
      const vacancyRateRaw = toNumber(vacancyRateInput ? vacancyRateInput.value : "");
      const monthlyReservesRaw = toNumber(monthlyReservesInput ? monthlyReservesInput.value : "");

      if (!validatePositive(monthlyRent, "monthly rent")) return;
      if (!validateNonNegative(monthlyOpExBase, "monthly operating expenses")) return;

      const monthlyOtherIncome = Number.isFinite(monthlyOtherIncomeRaw) ? monthlyOtherIncomeRaw : 0;
      const vacancyRate = Number.isFinite(vacancyRateRaw) ? vacancyRateRaw : 0;
      const monthlyReserves = Number.isFinite(monthlyReservesRaw) ? monthlyReservesRaw : 0;

      if (!validateNonNegative(monthlyOtherIncome, "other monthly income")) return;
      if (!validatePercentRange(vacancyRate, "vacancy allowance", 0, 60)) return;
      if (!validateNonNegative(monthlyReserves, "monthly reserves")) return;

      const grossMonthlyIncome = monthlyRent + monthlyOtherIncome;
      const vacancyFactor = 1 - (vacancyRate / 100);

      const effectiveGrossMonthlyIncome = grossMonthlyIncome * vacancyFactor;
      if (!Number.isFinite(effectiveGrossMonthlyIncome) || effectiveGrossMonthlyIncome <= 0) {
        setResultError("Effective monthly income must be greater than 0. Reduce vacancy allowance or increase income.");
        return;
      }

      const totalMonthlyOpEx = monthlyOpExBase + monthlyReserves;

      const oer = (totalMonthlyOpEx / effectiveGrossMonthlyIncome) * 100;

      const egiAnnual = effectiveGrossMonthlyIncome * 12;
      const opExAnnual = totalMonthlyOpEx * 12;
      const noiAnnual = egiAnnual - opExAnnual;

      const oerText = formatNumberTwoDecimals(oer) + "%";
      const band = oerBand(oer);

      const resultHtml =
        `<p><strong>Operating Expense Ratio (OER):</strong> ${oerText}</p>` +
        `<p><strong>Interpretation:</strong> ${band}</p>` +
        `<hr>` +
        `<p><strong>Effective gross income (annual):</strong> ${formatNumberTwoDecimals(egiAnnual)}</p>` +
        `<p><strong>Operating expenses (annual):</strong> ${formatNumberTwoDecimals(opExAnnual)}</p>` +
        `<p><strong>Net operating income (NOI, annual):</strong> ${formatNumberTwoDecimals(noiAnnual)}</p>` +
        `<p style="margin-top:10px;"><em>Note:</em> OER excludes mortgage or bond payments. Use NOI and financing calculators separately for debt impact.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Operating Expense Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
