document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  const purchasePriceInput = document.getElementById("purchasePrice");
  const upfrontCostsInput = document.getElementById("upfrontCosts");
  const monthlyRentInput = document.getElementById("monthlyRent");
  const vacancyRateInput = document.getElementById("vacancyRate");
  const monthlyExpensesInput = document.getElementById("monthlyExpenses");

  const rentGrowthRateInput = document.getElementById("rentGrowthRate");
  const expenseGrowthRateInput = document.getElementById("expenseGrowthRate");
  const appreciationRateInput = document.getElementById("appreciationRate");
  const holdingYearsInput = document.getElementById("holdingYears");
  const saleCostRateInput = document.getElementById("saleCostRate");

  const modeBlockMortgage = document.getElementById("modeBlockMortgage");
  const downPaymentRateInput = document.getElementById("downPaymentRate");
  const interestRateInput = document.getElementById("interestRate");
  const loanTermYearsInput = document.getElementById("loanTermYears");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like inputs
  attachLiveFormatting(purchasePriceInput);
  attachLiveFormatting(upfrontCostsInput);
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(monthlyExpensesInput);

  // Percentage / years inputs (commas not needed but harmless for large numbers)
  attachLiveFormatting(vacancyRateInput);
  attachLiveFormatting(rentGrowthRateInput);
  attachLiveFormatting(expenseGrowthRateInput);
  attachLiveFormatting(appreciationRateInput);
  attachLiveFormatting(holdingYearsInput);
  attachLiveFormatting(saleCostRateInput);
  attachLiveFormatting(downPaymentRateInput);
  attachLiveFormatting(interestRateInput);
  attachLiveFormatting(loanTermYearsInput);

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
    if (modeBlockMortgage) modeBlockMortgage.classList.add("hidden");
    if (mode === "mortgage" && modeBlockMortgage) modeBlockMortgage.classList.remove("hidden");
    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  function pctToRate(pct) {
    return clampPercent(pct) / 100;
  }

  function formatPctTwoDecimals(valuePct) {
    return formatNumberTwoDecimals(valuePct) + "%";
  }

  // Mortgage helpers
  function calcMonthlyPayment(principal, annualRatePct, termYears) {
    const n = Math.round(termYears * 12);
    if (n <= 0) return 0;

    const r = (annualRatePct / 100) / 12;
    if (!Number.isFinite(r) || r <= 0) {
      return principal / n;
    }

    const pow = Math.pow(1 + r, n);
    return principal * (r * pow) / (pow - 1);
  }

  function calcRemainingBalance(principal, annualRatePct, termYears, paymentsMade) {
    const n = Math.round(termYears * 12);
    const k = Math.max(0, Math.min(Math.round(paymentsMade), n));
    if (n <= 0) return 0;
    if (k >= n) return 0;

    const r = (annualRatePct / 100) / 12;
    if (!Number.isFinite(r) || r <= 0) {
      const paid = (principal / n) * k;
      return Math.max(0, principal - paid);
    }

    const powN = Math.pow(1 + r, n);
    const powK = Math.pow(1 + r, k);
    const balance = principal * (powN - powK) / (powN - 1);
    return Math.max(0, balance);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "cash";

      const purchasePrice = toNumber(purchasePriceInput ? purchasePriceInput.value : "");
      const upfrontCosts = toNumber(upfrontCostsInput ? upfrontCostsInput.value : "");
      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");
      const vacancyRatePct = toNumber(vacancyRateInput ? vacancyRateInput.value : "");
      const monthlyExpenses = toNumber(monthlyExpensesInput ? monthlyExpensesInput.value : "");

      const rentGrowthPct = toNumber(rentGrowthRateInput ? rentGrowthRateInput.value : "");
      const expenseGrowthPct = toNumber(expenseGrowthRateInput ? expenseGrowthRateInput.value : "");
      const appreciationPct = toNumber(appreciationRateInput ? appreciationRateInput.value : "");
      const holdingYearsRaw = toNumber(holdingYearsInput ? holdingYearsInput.value : "");
      const saleCostPct = toNumber(saleCostRateInput ? saleCostRateInput.value : "");

      const holdingYears = Number.isFinite(holdingYearsRaw) && holdingYearsRaw > 0 ? holdingYearsRaw : 10;

      if (!validatePositive(purchasePrice, "purchase price")) return;
      if (!validateNonNegative(upfrontCosts, "upfront costs")) return;
      if (!validatePositive(monthlyRent, "monthly rent")) return;
      if (!validateNonNegative(monthlyExpenses, "monthly operating expenses")) return;

      const vacancyRate = pctToRate(vacancyRatePct);
      const rentGrowth = pctToRate(rentGrowthPct);
      const expenseGrowth = pctToRate(expenseGrowthPct);
      const appreciation = (Number.isFinite(appreciationPct) ? appreciationPct : 0) / 100;
      const saleCostRate = pctToRate(saleCostPct);

      // Mortgage inputs (only used in mortgage mode)
      let downPaymentRate = 0;
      let interestRatePct = 0;
      let loanTermYears = 0;

      if (mode === "mortgage") {
        downPaymentRate = pctToRate(toNumber(downPaymentRateInput ? downPaymentRateInput.value : ""));
        interestRatePct = toNumber(interestRateInput ? interestRateInput.value : "");
        loanTermYears = toNumber(loanTermYearsInput ? loanTermYearsInput.value : "");

        if (!Number.isFinite(interestRatePct) || interestRatePct < 0) {
          setResultError("Enter a valid interest rate (0 or higher).");
          return;
        }
        if (!Number.isFinite(loanTermYears) || loanTermYears <= 0) {
          setResultError("Enter a valid loan term (years) greater than 0.");
          return;
        }
      }

      const effectiveAnnualRentYear1 = monthlyRent * 12 * (1 - vacancyRate);
      const annualExpensesYear1 = monthlyExpenses * 12;
      const noiYear1 = effectiveAnnualRentYear1 - annualExpensesYear1;

      const capRatePct = (noiYear1 / purchasePrice) * 100;

      // Determine initial cash invested and financing cash flows
      let initialCashInvested = 0;
      let monthlyMortgagePayment = 0;
      let loanPrincipal = 0;

      if (mode === "mortgage") {
        const downPaymentAmount = purchasePrice * downPaymentRate;
        loanPrincipal = Math.max(0, purchasePrice - downPaymentAmount);

        initialCashInvested = downPaymentAmount + upfrontCosts;

        monthlyMortgagePayment = calcMonthlyPayment(loanPrincipal, interestRatePct, loanTermYears);
      } else {
        initialCashInvested = purchasePrice + upfrontCosts;
      }

      if (!validatePositive(initialCashInvested, "cash invested")) return;

      // Model annual cash flows
      const yearsInt = Math.max(1, Math.round(holdingYears));
      let totalNetCashFlow = 0;
      let netCashFlowYear1 = 0;

      let currentAnnualRent = effectiveAnnualRentYear1;
      let currentAnnualExpenses = annualExpensesYear1;

      for (let y = 1; y <= yearsInt; y++) {
        const mortgageAnnual = mode === "mortgage" ? monthlyMortgagePayment * 12 : 0;
        const net = currentAnnualRent - currentAnnualExpenses - mortgageAnnual;

        if (y === 1) netCashFlowYear1 = net;
        totalNetCashFlow += net;

        currentAnnualRent = currentAnnualRent * (1 + rentGrowth);
        currentAnnualExpenses = currentAnnualExpenses * (1 + expenseGrowth);
      }

      // Sale proceeds
      const salePrice = purchasePrice * Math.pow(1 + appreciation, yearsInt);
      const saleNetBeforeDebt = salePrice * (1 - saleCostRate);

      let remainingBalance = 0;
      if (mode === "mortgage") {
        const paymentsMade = yearsInt * 12;
        remainingBalance = calcRemainingBalance(loanPrincipal, interestRatePct, loanTermYears, paymentsMade);
      }

      const saleProceeds = Math.max(0, saleNetBeforeDebt - remainingBalance);

      const totalValueBack = totalNetCashFlow + saleProceeds;
      const profit = totalValueBack - initialCashInvested;

      const roiPct = (profit / initialCashInvested) * 100;

      const endingValue = initialCashInvested + profit;
      let annualizedReturnPct = 0;
      if (endingValue > 0 && initialCashInvested > 0 && yearsInt > 0) {
        annualizedReturnPct = (Math.pow(endingValue / initialCashInvested, 1 / yearsInt) - 1) * 100;
      }

      const cashOnCashPct = (netCashFlowYear1 / initialCashInvested) * 100;

      // Build output HTML
      const scenarioLabel = mode === "mortgage" ? "Mortgage financing" : "Cash purchase";

      const mortgageLine =
        mode === "mortgage"
          ? `<p><strong>Estimated mortgage payment:</strong> ${formatNumberTwoDecimals(monthlyMortgagePayment)} per month</p>
             <p><strong>Estimated remaining loan balance at sale:</strong> ${formatNumberTwoDecimals(remainingBalance)}</p>`
          : "";

      const resultHtml = `
        <p><strong>Scenario:</strong> ${scenarioLabel}</p>

        <p><strong>Cash invested upfront:</strong> ${formatNumberTwoDecimals(initialCashInvested)}</p>

        <p><strong>Year 1 cap rate (before mortgage):</strong> ${formatPctTwoDecimals(capRatePct)}</p>
        <p><strong>Year 1 cash-on-cash return:</strong> ${formatPctTwoDecimals(cashOnCashPct)}</p>

        <p><strong>Total net cash flow (over ${yearsInt} years):</strong> ${formatNumberTwoDecimals(totalNetCashFlow)}</p>
        <p><strong>Estimated sale proceeds (after costs${mode === "mortgage" ? " and loan payoff" : ""}):</strong> ${formatNumberTwoDecimals(saleProceeds)}</p>

        ${mortgageLine}

        <hr>

        <p><strong>Total profit / loss:</strong> ${formatNumberTwoDecimals(profit)}</p>
        <p><strong>Total ROI over ${yearsInt} years:</strong> ${formatPctTwoDecimals(roiPct)}</p>
        <p><strong>Estimated annualized return:</strong> ${formatPctTwoDecimals(annualizedReturnPct)}</p>

        <p><em>Interpretation:</em> ROI includes your rental cash flow plus your net proceeds from selling, compared against your upfront cash invested. If Year 1 cash-on-cash is negative, the property may be costing you money each month (often due to high interest rate, low rent, or underestimated expenses).</p>
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
      const message = "Property Investment ROI Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
