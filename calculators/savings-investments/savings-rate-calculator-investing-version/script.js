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
  const incomeType = document.getElementById("incomeType");
  const nonInvestmentSpending = document.getElementById("nonInvestmentSpending");
  const monthlyInvesting = document.getElementById("monthlyInvesting");
  const includeEmployerMatch = document.getElementById("includeEmployerMatch");
  const employerMatch = document.getElementById("employerMatch");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator.)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(incomeAmount);
  attachLiveFormatting(nonInvestmentSpending);
  attachLiveFormatting(monthlyInvesting);
  attachLiveFormatting(employerMatch);

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
      const income = toNumber(incomeAmount ? incomeAmount.value : "");
      const spending = toNumber(nonInvestmentSpending ? nonInvestmentSpending.value : "");
      const investingBase = toNumber(monthlyInvesting ? monthlyInvesting.value : "");
      const match = toNumber(employerMatch ? employerMatch.value : "");
      const matchIncluded = includeEmployerMatch && includeEmployerMatch.value === "yes";

      // Basic existence guard
      if (!incomeAmount || !nonInvestmentSpending || !incomeType || !monthlyInvesting || !includeEmployerMatch || !employerMatch) {
        return;
      }

      // Validation
      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(spending, "monthly spending")) return;
      if (!validateNonNegative(investingBase, "monthly investing contributions")) return;
      if (!validateNonNegative(match, "employer match per month")) return;

      // Calculation logic
      const investingTotal = investingBase + (matchIncluded ? match : 0);
      const savingsTotal = income - spending; // total savings includes investments + cash surplus (or deficit)
      const cashSurplus = income - spending - investingTotal; // after investing allocation, what remains (or shortfall)

      const totalSavingsRate = (savingsTotal / income) * 100;
      const investingRate = (investingTotal / income) * 100;
      const cashRate = (cashSurplus / income) * 100;

      const annualIncome = income * 12;
      const annualSpending = spending * 12;
      const annualInvesting = investingTotal * 12;
      const annualCashSurplus = cashSurplus * 12;

      // Guard against extreme outputs (still show, but label)
      const isOverspending = savingsTotal < 0;
      const isInvestingBeyondCashflow = cashSurplus < 0;

      const incomeLabel = incomeType.value === "net" ? "Net (after tax) income" : "Gross (before tax) income";

      const totalSavingsRateText = formatNumberTwoDecimals(totalSavingsRate);
      const investingRateText = formatNumberTwoDecimals(investingRate);
      const cashRateText = formatNumberTwoDecimals(cashRate);

      const savingsTotalAbs = Math.abs(savingsTotal);
      const cashSurplusAbs = Math.abs(cashSurplus);

      const savingsTotalFmt = formatNumberTwoDecimals(savingsTotalAbs);
      const investingTotalFmt = formatNumberTwoDecimals(investingTotal);
      const cashSurplusFmt = formatNumberTwoDecimals(cashSurplusAbs);

      const annualIncomeFmt = formatNumberTwoDecimals(annualIncome);
      const annualSpendingFmt = formatNumberTwoDecimals(annualSpending);
      const annualInvestingFmt = formatNumberTwoDecimals(annualInvesting);
      const annualCashSurplusFmt = formatNumberTwoDecimals(Math.abs(annualCashSurplus));

      // Build output HTML
      let statusLine = "";
      if (isOverspending) {
        statusLine = `<p><strong>Status:</strong> You are spending more than your income by <strong>${savingsTotalFmt}</strong> per month (before considering investments).</p>`;
      } else if (isInvestingBeyondCashflow) {
        statusLine = `<p><strong>Status:</strong> Your investing plan exceeds your available cash flow by <strong>${cashSurplusFmt}</strong> per month.</p>`;
      } else {
        statusLine = `<p><strong>Status:</strong> After investing, you have a cash surplus of <strong>${cashSurplusFmt}</strong> per month.</p>`;
      }

      const savingsLineLabel = isOverspending ? "Monthly shortfall (income minus spending)" : "Monthly savings (income minus spending)";
      const cashLineLabel = isInvestingBeyondCashflow ? "Monthly investing shortfall (after investing)" : "Monthly cash surplus (after investing)";

      const savingsSign = isOverspending ? "-" : "";
      const cashSign = isInvestingBeyondCashflow ? "-" : "";

      const annualCashLabel = isInvestingBeyondCashflow ? "Annual investing shortfall (after investing)" : "Annual cash surplus (after investing)";
      const annualCashSign = isInvestingBeyondCashflow ? "-" : "";

      const employerMatchNote = matchIncluded
        ? `<p style="margin-top:8px;"><em>Employer match is included in the investing rate.</em></p>`
        : `<p style="margin-top:8px;"><em>Employer match is not included in the investing rate.</em></p>`;

      const resultHtml = `
        <p><strong>${incomeLabel}:</strong> ${formatNumberTwoDecimals(income)} per month</p>

        <p><strong>Total savings rate:</strong> ${totalSavingsRateText}%</p>
        <p><strong>Investing rate:</strong> ${investingRateText}%</p>
        <p><strong>Cash leftover rate:</strong> ${cashRateText}%</p>

        <hr>

        ${statusLine}

        <p><strong>${savingsLineLabel}:</strong> ${savingsSign}${savingsTotalFmt} per month</p>
        <p><strong>Monthly investing (incl. optional match):</strong> ${investingTotalFmt} per month</p>
        <p><strong>${cashLineLabel}:</strong> ${cashSign}${cashSurplusFmt} per month</p>

        <hr>

        <p><strong>Annual income:</strong> ${annualIncomeFmt}</p>
        <p><strong>Annual spending (excluding investments):</strong> ${annualSpendingFmt}</p>
        <p><strong>Annual investing (incl. optional match):</strong> ${annualInvestingFmt}</p>
        <p><strong>${annualCashLabel}:</strong> ${annualCashSign}${annualCashSurplusFmt}</p>

        ${employerMatchNote}
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
      const message = "Savings Rate Calculator (Investing Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
