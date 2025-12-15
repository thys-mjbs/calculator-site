document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const incomeAmount = document.getElementById("incomeAmount");
  const incomePeriod = document.getElementById("incomePeriod");
  const needsPct = document.getElementById("needsPct");
  const wantsPct = document.getElementById("wantsPct");
  const savingsPct = document.getElementById("savingsPct");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(incomeAmount);

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

      if (!incomeAmount || !incomePeriod) return;

      const incomeRaw = toNumber(incomeAmount.value);
      if (!validatePositive(incomeRaw, "income amount")) return;

      const period = incomePeriod.value || "monthly";

      // Convert to estimated monthly income
      let monthlyIncome = incomeRaw;
      if (period === "weekly") monthlyIncome = (incomeRaw * 52) / 12;
      if (period === "fortnightly") monthlyIncome = (incomeRaw * 26) / 12;
      if (period === "annual") monthlyIncome = incomeRaw / 12;

      // Percent inputs are optional. Defaults to 50/30/20.
      const defaultNeeds = 50;
      const defaultWants = 30;
      const defaultSavings = 20;

      const needsVal = needsPct ? toNumber(needsPct.value) : NaN;
      const wantsVal = wantsPct ? toNumber(wantsPct.value) : NaN;
      const savingsVal = savingsPct ? toNumber(savingsPct.value) : NaN;

      const hasNeeds = Number.isFinite(needsVal);
      const hasWants = Number.isFinite(wantsVal);
      const hasSavings = Number.isFinite(savingsVal);

      let n = defaultNeeds;
      let w = defaultWants;
      let s = defaultSavings;

      // If none provided, use defaults.
      // If some provided, fill missing with defaults, then try to auto-balance once.
      if (hasNeeds || hasWants || hasSavings) {
        n = hasNeeds ? needsVal : defaultNeeds;
        w = hasWants ? wantsVal : defaultWants;
        s = hasSavings ? savingsVal : defaultSavings;

        // If exactly one is missing, auto-compute the remainder to reach 100.
        const providedCount = (hasNeeds ? 1 : 0) + (hasWants ? 1 : 0) + (hasSavings ? 1 : 0);
        if (providedCount === 2) {
          if (!hasNeeds) n = 100 - w - s;
          if (!hasWants) w = 100 - n - s;
          if (!hasSavings) s = 100 - n - w;
        }
      }

      // Validate percentages
      if (!validateNonNegative(n, "Needs %")) return;
      if (!validateNonNegative(w, "Wants %")) return;
      if (!validateNonNegative(s, "Savings/Debt %")) return;

      const pctSum = n + w + s;
      if (!Number.isFinite(pctSum) || Math.abs(pctSum - 100) > 0.0001) {
        setResultError("Your percentages must add up to 100%. Adjust the split and try again.");
        return;
      }

      // Calculation logic
      const needsAmtMonthly = (monthlyIncome * n) / 100;
      const wantsAmtMonthly = (monthlyIncome * w) / 100;
      const savingsAmtMonthly = (monthlyIncome * s) / 100;

      // Helpful secondary insight: weekly equivalents
      const weeklyIncome = (monthlyIncome * 12) / 52;
      const needsAmtWeekly = (weeklyIncome * n) / 100;
      const wantsAmtWeekly = (weeklyIncome * w) / 100;
      const savingsAmtWeekly = (weeklyIncome * s) / 100;

      const monthlyIncomeFmt = formatNumberTwoDecimals(monthlyIncome);
      const weeklyIncomeFmt = formatNumberTwoDecimals(weeklyIncome);

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated monthly income:</strong> ${monthlyIncomeFmt}</p>
        <p><strong>Estimated weekly income:</strong> ${weeklyIncomeFmt}</p>

        <p><strong>Monthly targets (${n}/${w}/${s}):</strong></p>
        <ul>
          <li><strong>Needs (${n}%):</strong> ${formatNumberTwoDecimals(needsAmtMonthly)}</li>
          <li><strong>Wants (${w}%):</strong> ${formatNumberTwoDecimals(wantsAmtMonthly)}</li>
          <li><strong>Savings/Debt (${s}%):</strong> ${formatNumberTwoDecimals(savingsAmtMonthly)}</li>
        </ul>

        <p><strong>Weekly targets (useful for paychecks and weekly limits):</strong></p>
        <ul>
          <li><strong>Needs:</strong> ${formatNumberTwoDecimals(needsAmtWeekly)}</li>
          <li><strong>Wants:</strong> ${formatNumberTwoDecimals(wantsAmtWeekly)}</li>
          <li><strong>Savings/Debt:</strong> ${formatNumberTwoDecimals(savingsAmtWeekly)}</li>
        </ul>
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
      const message = "50/30/20 Budget Rule Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
