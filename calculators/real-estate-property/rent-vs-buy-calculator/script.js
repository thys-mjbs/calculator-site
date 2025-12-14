document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const homePriceInput = document.getElementById("homePrice");
  const downPaymentPercentInput = document.getElementById("downPaymentPercent");
  const interestRateInput = document.getElementById("interestRate");
  const loanTermYearsInput = document.getElementById("loanTermYears");
  const propertyTaxPercentInput = document.getElementById("propertyTaxPercent");
  const insuranceAnnualInput = document.getElementById("insuranceAnnual");
  const maintenancePercentInput = document.getElementById("maintenancePercent");
  const hoaMonthlyInput = document.getElementById("hoaMonthly");
  const closingCostsPercentInput = document.getElementById("closingCostsPercent");
  const sellingCostsPercentInput = document.getElementById("sellingCostsPercent");
  const rentMonthlyInput = document.getElementById("rentMonthly");
  const rentIncreasePercentInput = document.getElementById("rentIncreasePercent");
  const homeAppreciationPercentInput = document.getElementById("homeAppreciationPercent");
  const investmentReturnPercentInput = document.getElementById("investmentReturnPercent");
  const horizonYearsInput = document.getElementById("horizonYears");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Format money-like fields with commas
  attachLiveFormatting(homePriceInput);
  attachLiveFormatting(insuranceAnnualInput);
  attachLiveFormatting(hoaMonthlyInput);
  attachLiveFormatting(rentMonthlyInput);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  function monthlyRateFromAnnualPercent(annualPercent) {
    const r = annualPercent / 100;
    return Math.pow(1 + r, 1 / 12) - 1;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const homePrice = toNumber(homePriceInput ? homePriceInput.value : "");
      const downPaymentPercent = toNumber(downPaymentPercentInput ? downPaymentPercentInput.value : "");
      const interestRate = toNumber(interestRateInput ? interestRateInput.value : "");
      const loanTermYears = toNumber(loanTermYearsInput ? loanTermYearsInput.value : "");
      const propertyTaxPercent = toNumber(propertyTaxPercentInput ? propertyTaxPercentInput.value : "");
      const insuranceAnnual = toNumber(insuranceAnnualInput ? insuranceAnnualInput.value : "");
      const maintenancePercent = toNumber(maintenancePercentInput ? maintenancePercentInput.value : "");
      const hoaMonthly = toNumber(hoaMonthlyInput ? hoaMonthlyInput.value : "");
      const closingCostsPercent = toNumber(closingCostsPercentInput ? closingCostsPercentInput.value : "");
      const sellingCostsPercent = toNumber(sellingCostsPercentInput ? sellingCostsPercentInput.value : "");
      const rentMonthlyStart = toNumber(rentMonthlyInput ? rentMonthlyInput.value : "");
      const rentIncreasePercent = toNumber(rentIncreasePercentInput ? rentIncreasePercentInput.value : "");
      const homeAppreciationPercent = toNumber(homeAppreciationPercentInput ? homeAppreciationPercentInput.value : "");
      const investmentReturnPercent = toNumber(investmentReturnPercentInput ? investmentReturnPercentInput.value : "");
      const horizonYears = toNumber(horizonYearsInput ? horizonYearsInput.value : "");

      // Basic existence guard
      if (
        !homePriceInput ||
        !downPaymentPercentInput ||
        !interestRateInput ||
        !loanTermYearsInput ||
        !propertyTaxPercentInput ||
        !insuranceAnnualInput ||
        !maintenancePercentInput ||
        !hoaMonthlyInput ||
        !closingCostsPercentInput ||
        !sellingCostsPercentInput ||
        !rentMonthlyInput ||
        !rentIncreasePercentInput ||
        !homeAppreciationPercentInput ||
        !investmentReturnPercentInput ||
        !horizonYearsInput
      ) {
        setResultError("Calculator inputs are missing on the page.");
        return;
      }

      // Validation
      if (!validatePositive(homePrice, "home price")) return;
      if (!validatePercent(downPaymentPercent, "down payment percent")) return;
      if (!validatePercent(propertyTaxPercent, "property tax percent")) return;
      if (!validatePercent(maintenancePercent, "maintenance percent")) return;
      if (!validatePercent(closingCostsPercent, "closing costs percent")) return;
      if (!validatePercent(sellingCostsPercent, "selling costs percent")) return;
      if (!validatePercent(rentIncreasePercent, "rent increase percent")) return;
      if (!validatePercent(homeAppreciationPercent, "home appreciation percent")) return;
      if (!validatePercent(investmentReturnPercent, "investment return percent")) return;

      if (!validateNonNegative(insuranceAnnual, "home insurance (annual amount)")) return;
      if (!validateNonNegative(hoaMonthly, "HOA or levies (monthly amount)")) return;
      if (!validatePositive(rentMonthlyStart, "current monthly rent")) return;

      if (!validatePositive(interestRate, "interest rate")) return;
      if (!validatePositive(loanTermYears, "loan term (years)")) return;
      if (!validatePositive(horizonYears, "time horizon (years)")) return;

      const horizonMonths = Math.max(1, Math.floor(horizonYears * 12));
      const loanMonths = Math.max(1, Math.floor(loanTermYears * 12));

      const downPayment = homePrice * (downPaymentPercent / 100);
      const loanAmount = Math.max(0, homePrice - downPayment);
      const buyClosingCosts = homePrice * (closingCostsPercent / 100);

      const monthlyMortgageRate = monthlyRateFromAnnualPercent(interestRate);
      let mortgagePayment = 0;

      if (loanAmount <= 0) {
        mortgagePayment = 0;
      } else if (monthlyMortgageRate === 0) {
        mortgagePayment = loanAmount / loanMonths;
      } else {
        const factor = Math.pow(1 + monthlyMortgageRate, loanMonths);
        mortgagePayment = loanAmount * (monthlyMortgageRate * factor) / (factor - 1);
      }

      const monthlyInvestmentRate = monthlyRateFromAnnualPercent(investmentReturnPercent);
      const monthlyHomeAppreciationRate = monthlyRateFromAnnualPercent(homeAppreciationPercent);
      const monthlyRentIncreaseRate = monthlyRateFromAnnualPercent(rentIncreasePercent);

      // Simulation state
      let homeValue = homePrice;
      let loanBalance = loanAmount;

      let renterInvestment = downPayment + buyClosingCosts; // renter invests the upfront cash they did not spend
      let buyerInvestment = 0;

      let totalOutOfPocketBuy = downPayment + buyClosingCosts;
      let totalOutOfPocketRent = 0;

      let currentRent = rentMonthlyStart;

      for (let m = 1; m <= horizonMonths; m++) {
        // Grow rent and home value monthly
        currentRent = currentRent * (1 + monthlyRentIncreaseRate);
        homeValue = homeValue * (1 + monthlyHomeAppreciationRate);

        // Buyer costs for the month
        const propertyTaxMonthly = (homeValue * (propertyTaxPercent / 100)) / 12;
        const insuranceMonthly = insuranceAnnual / 12;
        const maintenanceMonthly = (homeValue * (maintenancePercent / 100)) / 12;

        // Mortgage interest and principal for the month (stop amortizing after loan term ends)
        let interestPayment = 0;
        let principalPayment = 0;

        if (loanBalance > 0 && m <= loanMonths) {
          interestPayment = loanBalance * monthlyMortgageRate;
          principalPayment = mortgagePayment - interestPayment;

          // Guard against negative principal due to extreme inputs
          if (principalPayment < 0) principalPayment = 0;

          loanBalance = loanBalance - principalPayment;
          if (loanBalance < 0) loanBalance = 0;
        }

        const buyerMonthlyCost =
          (m <= loanMonths ? mortgagePayment : 0) +
          propertyTaxMonthly +
          insuranceMonthly +
          maintenanceMonthly +
          hoaMonthly;

        // Track out of pocket totals
        totalOutOfPocketBuy += buyerMonthlyCost;
        totalOutOfPocketRent += currentRent;

        // Grow investment accounts monthly
        renterInvestment = renterInvestment * (1 + monthlyInvestmentRate);
        buyerInvestment = buyerInvestment * (1 + monthlyInvestmentRate);

        // Invest the monthly difference (cheaper option invests)
        const diff = buyerMonthlyCost - currentRent;

        if (diff > 0) {
          // Renting is cheaper, renter invests the savings
          renterInvestment += diff;
        } else if (diff < 0) {
          // Buying is cheaper, buyer invests the savings
          buyerInvestment += Math.abs(diff);
        }
      }

      // End-of-horizon outcomes
      const sellingCosts = homeValue * (sellingCostsPercent / 100);
      const buyerEquityBeforeSale = Math.max(0, homeValue - loanBalance);
      const buyerHomeProceeds = Math.max(0, buyerEquityBeforeSale - sellingCosts);

      const buyerNetWorth = buyerHomeProceeds + buyerInvestment;
      const renterNetWorth = renterInvestment;

      const netWorthDiff = buyerNetWorth - renterNetWorth;

      const buyOut = formatNumberTwoDecimals(totalOutOfPocketBuy);
      const rentOut = formatNumberTwoDecimals(totalOutOfPocketRent);

      const buyerNW = formatNumberTwoDecimals(buyerNetWorth);
      const renterNW = formatNumberTwoDecimals(renterNetWorth);

      const homeValOut = formatNumberTwoDecimals(homeValue);
      const loanBalOut = formatNumberTwoDecimals(loanBalance);
      const proceedsOut = formatNumberTwoDecimals(buyerHomeProceeds);

      const diffAbs = Math.abs(netWorthDiff);
      const diffOut = formatNumberTwoDecimals(diffAbs);

      let winnerLine = "";
      if (netWorthDiff > 0) {
        winnerLine = "<p><strong>Estimated winner:</strong> Buying by " + diffOut + " (net worth difference).</p>";
      } else if (netWorthDiff < 0) {
        winnerLine = "<p><strong>Estimated winner:</strong> Renting by " + diffOut + " (net worth difference).</p>";
      } else {
        winnerLine = "<p><strong>Estimated winner:</strong> Tie (based on these assumptions).</p>";
      }

      const resultHtml =
        "<p><strong>Total out-of-pocket cost over horizon</strong></p>" +
        "<p>Buy: " + buyOut + "</p>" +
        "<p>Rent: " + rentOut + "</p>" +
        "<hr>" +
        "<p><strong>Estimated end-of-horizon net worth</strong></p>" +
        "<p>Buy: " + buyerNW + "</p>" +
        "<p>Rent: " + renterNW + "</p>" +
        winnerLine +
        "<hr>" +
        "<p><strong>Buying details at end</strong></p>" +
        "<p>Estimated home value: " + homeValOut + "</p>" +
        "<p>Remaining loan balance: " + loanBalOut + "</p>" +
        "<p>Estimated home proceeds after selling costs: " + proceedsOut + "</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Rent vs Buy Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
