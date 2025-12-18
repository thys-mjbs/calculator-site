document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyIncomeInput = document.getElementById("monthlyIncome");
  const monthlyRentInput = document.getElementById("monthlyRent");
  const monthlyUtilitiesInput = document.getElementById("monthlyUtilities");
  const monthlyDebtsInput = document.getElementById("monthlyDebts");
  const roommateContributionInput = document.getElementById("roommateContribution");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(monthlyIncomeInput);
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(monthlyUtilitiesInput);
  attachLiveFormatting(monthlyDebtsInput);
  attachLiveFormatting(roommateContributionInput);

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

  // (not used)
  

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
      // Optional: if you have modes, read it here:
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      const monthlyIncome = toNumber(monthlyIncomeInput ? monthlyIncomeInput.value : "");
      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");
      const monthlyUtilities = toNumber(monthlyUtilitiesInput ? monthlyUtilitiesInput.value : "");
      const monthlyDebts = toNumber(monthlyDebtsInput ? monthlyDebtsInput.value : "");
      const roommateContribution = toNumber(roommateContributionInput ? roommateContributionInput.value : "");

      // Basic existence guard (optional but recommended)
      if (
        !monthlyIncomeInput ||
        !monthlyRentInput ||
        !monthlyUtilitiesInput ||
        !monthlyDebtsInput ||
        !roommateContributionInput
      ) {
        return;
      }

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validatePositive(monthlyIncome, "monthly take-home income")) return;
      if (!validatePositive(monthlyRent, "monthly rent")) return;

      const utilitiesSafe = Number.isFinite(monthlyUtilities) ? monthlyUtilities : 0;
      const debtsSafe = Number.isFinite(monthlyDebts) ? monthlyDebts : 0;
      const contribSafe = Number.isFinite(roommateContribution) ? roommateContribution : 0;

      if (!validateNonNegative(utilitiesSafe, "monthly utilities estimate")) return;
      if (!validateNonNegative(debtsSafe, "other monthly debt payments")) return;
      if (!validateNonNegative(contribSafe, "roommate or household contribution")) return;

      const effectiveRent = Math.max(0, monthlyRent - contribSafe);
      if (effectiveRent === 0) {
        setResultError("Your rent after contribution is 0. If this is correct, your housing cost ratio will be driven by utilities only.");
      }

      // Calculation logic
      const rentToIncome = monthlyIncome > 0 ? (effectiveRent / monthlyIncome) * 100 : NaN;
      const housingCost = effectiveRent + utilitiesSafe;
      const housingToIncome = monthlyIncome > 0 ? (housingCost / monthlyIncome) * 100 : NaN;

      const remainingAfterHousing = monthlyIncome - housingCost;
      const remainingAfterHousingAndDebts = monthlyIncome - housingCost - debtsSafe;

      const maxRent30 = monthlyIncome * 0.30;
      const maxRent35 = monthlyIncome * 0.35;

      const incomeNeeded30 = effectiveRent > 0 ? effectiveRent / 0.30 : 0;
      const incomeNeeded35 = effectiveRent > 0 ? effectiveRent / 0.35 : 0;

      function verdictFromRatio(ratioPercent) {
        if (!Number.isFinite(ratioPercent)) return { label: "Unknown", note: "Not enough valid data to score affordability." };
        if (ratioPercent <= 30) return { label: "Comfortable range", note: "Often leaves room for saving and day-to-day costs, depending on your other obligations." };
        if (ratioPercent <= 40) return { label: "Stretched range", note: "May be manageable, but shocks like higher utilities or medical costs can create pressure." };
        return { label: "High risk range", note: "Commonly leads to cash flow stress unless your other costs are very low or income is very stable." };
      }

      const verdict = verdictFromRatio(rentToIncome);

      // Build output HTML
      const fmtMoney = (n) => formatNumberTwoDecimals(n);
      const fmtPct = (n) => (Number.isFinite(n) ? formatNumberTwoDecimals(n) + "%" : "N/A");

      const resultHtml = `
        <p><strong>Rent-to-income (your share):</strong> ${fmtPct(rentToIncome)}</p>
        <p><strong>Total housing cost ratio (rent + utilities):</strong> ${fmtPct(housingToIncome)}</p>
        <p><strong>Affordability indicator:</strong> ${verdict.label}<br>${verdict.note}</p>
        <hr>
        <p><strong>Your estimated monthly cash left:</strong></p>
        <p>After housing (rent + utilities): <strong>${fmtMoney(remainingAfterHousing)}</strong></p>
        <p>After housing and debts: <strong>${fmtMoney(remainingAfterHousingAndDebts)}</strong></p>
        <hr>
        <p><strong>Quick reference limits (based on your income):</strong></p>
        <p>30% rent guideline: <strong>${fmtMoney(maxRent30)}</strong> per month</p>
        <p>35% rent guideline: <strong>${fmtMoney(maxRent35)}</strong> per month</p>
        <hr>
        <p><strong>If your rent share stays the same:</strong></p>
        <p>Income needed for 30%: <strong>${fmtMoney(incomeNeeded30)}</strong> per month</p>
        <p>Income needed for 35%: <strong>${fmtMoney(incomeNeeded35)}</strong> per month</p>
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
      const message = "Rent Affordability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
