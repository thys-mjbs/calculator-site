document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const cashOnHandInput = document.getElementById("cashOnHand");
  const monthlyRevenueInput = document.getElementById("monthlyRevenue");
  const monthlyExpensesInput = document.getElementById("monthlyExpenses");

  const revenueGrowthRateInput = document.getElementById("revenueGrowthRate");
  const expenseGrowthRateInput = document.getElementById("expenseGrowthRate");
  const oneTimeInjectionInput = document.getElementById("oneTimeInjection");
  const oneTimeCostInput = document.getElementById("oneTimeCost");
  const minimumReserveInput = document.getElementById("minimumReserve");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(cashOnHandInput);
  attachLiveFormatting(monthlyRevenueInput);
  attachLiveFormatting(monthlyExpensesInput);
  attachLiveFormatting(revenueGrowthRateInput);
  attachLiveFormatting(expenseGrowthRateInput);
  attachLiveFormatting(oneTimeInjectionInput);
  attachLiveFormatting(oneTimeCostInput);
  attachLiveFormatting(minimumReserveInput);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS
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
  // 5) VALIDATION HELPERS
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

  function addMonthsToDate(dateObj, monthsToAdd) {
    const d = new Date(dateObj.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + monthsToAdd);

    // Guard against month rollover issues (e.g., adding months to the 31st)
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  }

  function formatMonthYear(dateObj) {
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
    ];
    return months[dateObj.getMonth()] + " " + dateObj.getFullYear();
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const cashOnHand = toNumber(cashOnHandInput ? cashOnHandInput.value : "");
      const monthlyRevenue = toNumber(monthlyRevenueInput ? monthlyRevenueInput.value : "");
      const monthlyExpenses = toNumber(monthlyExpensesInput ? monthlyExpensesInput.value : "");

      const revenueGrowthRatePct = toNumber(revenueGrowthRateInput ? revenueGrowthRateInput.value : "");
      const expenseGrowthRatePct = toNumber(expenseGrowthRateInput ? expenseGrowthRateInput.value : "");
      const oneTimeInjection = toNumber(oneTimeInjectionInput ? oneTimeInjectionInput.value : "");
      const oneTimeCost = toNumber(oneTimeCostInput ? oneTimeCostInput.value : "");
      const minimumReserve = toNumber(minimumReserveInput ? minimumReserveInput.value : "");

      if (!validatePositive(cashOnHand, "cash on hand")) return;
      if (!validateNonNegative(monthlyRevenue, "average monthly revenue")) return;
      if (!validatePositive(monthlyExpenses, "average monthly operating expenses")) return;

      if (!validateNonNegative(oneTimeInjection, "one-time cash injection")) return;
      if (!validateNonNegative(oneTimeCost, "one-time planned cost")) return;
      if (!validateNonNegative(minimumReserve, "minimum cash reserve")) return;

      if (minimumReserve > cashOnHand) {
        setResultError("Minimum cash reserve cannot be greater than cash on hand.");
        return;
      }

      if (!Number.isFinite(revenueGrowthRatePct) || revenueGrowthRatePct < -100) {
        setResultError("Enter a valid monthly revenue growth rate (greater than or equal to -100%).");
        return;
      }

      if (!Number.isFinite(expenseGrowthRatePct) || expenseGrowthRatePct < -100) {
        setResultError("Enter a valid monthly expense growth rate (greater than or equal to -100%).");
        return;
      }

      const revenueGrowthRate = revenueGrowthRatePct / 100;
      const expenseGrowthRate = expenseGrowthRatePct / 100;

      let cash = cashOnHand + oneTimeInjection - oneTimeCost;
      if (!Number.isFinite(cash) || cash < 0) {
        setResultError("Your month 1 cash after one-time items cannot be negative. Reduce one-time cost or increase cash/injection.");
        return;
      }

      const startingNetBurn = monthlyExpenses - monthlyRevenue;
      const formattedStartRevenue = formatNumberTwoDecimals(monthlyRevenue);
      const formattedStartExpenses = formatNumberTwoDecimals(monthlyExpenses);
      const formattedStartBurn = formatNumberTwoDecimals(Math.abs(startingNetBurn));

      const reserveThreshold = minimumReserve;

      // Quick outcomes
      if (startingNetBurn <= 0 && revenueGrowthRate === 0 && expenseGrowthRate === 0) {
        const surplus = Math.abs(startingNetBurn);
        const html =
          `<p><strong>Runway:</strong> Indefinite (cash is not decreasing at current levels).</p>
           <ul class="result-list">
             <li><strong>Monthly surplus:</strong> ${formatNumberTwoDecimals(surplus)}</li>
             <li><strong>Starting revenue:</strong> ${formattedStartRevenue}</li>
             <li><strong>Starting expenses:</strong> ${formattedStartExpenses}</li>
             <li><strong>Minimum cash reserve used:</strong> ${formatNumberTwoDecimals(reserveThreshold)}</li>
           </ul>`;
        setResultSuccess(html);
        return;
      }

      // Simulation (month-by-month) with optional growth
      const maxMonths = 1200; // 100 years cap to prevent infinite loops
      let months = 0;

      let rev = monthlyRevenue;
      let exp = monthlyExpenses;

      // If month 1 already at or below reserve, runway is 0
      if (cash <= reserveThreshold) {
        const html =
          `<p><strong>Runway:</strong> 0 months</p>
           <ul class="result-list">
             <li><strong>Cash after one-time items:</strong> ${formatNumberTwoDecimals(cash)}</li>
             <li><strong>Minimum cash reserve:</strong> ${formatNumberTwoDecimals(reserveThreshold)}</li>
           </ul>`;
        setResultSuccess(html);
        return;
      }

      while (months < maxMonths) {
        const netBurn = exp - rev;

        // If netBurn is <= 0, cash increases this month
        cash = cash - netBurn;

        months += 1;

        if (cash <= reserveThreshold) {
          break;
        }

        // Apply growth for next month
        rev = rev * (1 + revenueGrowthRate);
        exp = exp * (1 + expenseGrowthRate);

        // Guard against NaN due to extreme inputs
        if (!Number.isFinite(rev) || !Number.isFinite(exp) || !Number.isFinite(cash)) {
          setResultError("Inputs produced unrealistic projections. Reduce growth rates or check your values.");
          return;
        }
      }

      // Determine final outputs
      if (months >= maxMonths && cash > reserveThreshold) {
        const breakEvenRevenue = monthlyExpenses; // simplest: current expenses
        const html =
          `<p><strong>Runway:</strong> More than 100 years (cash does not reach your reserve within the projection cap).</p>
           <ul class="result-list">
             <li><strong>Starting net burn:</strong> ${startingNetBurn > 0 ? formattedStartBurn + " burn" : formattedStartBurn + " surplus"}</li>
             <li><strong>Starting revenue:</strong> ${formattedStartRevenue}</li>
             <li><strong>Starting expenses:</strong> ${formattedStartExpenses}</li>
             <li><strong>Revenue needed to break even today:</strong> ${formatNumberTwoDecimals(breakEvenRevenue)}</li>
             <li><strong>Minimum cash reserve used:</strong> ${formatNumberTwoDecimals(reserveThreshold)}</li>
           </ul>`;
        setResultSuccess(html);
        return;
      }

      const runwayMonths = months;
      const endDate = addMonthsToDate(new Date(), runwayMonths);
      const endLabel = formatMonthYear(endDate);

      // Supporting insight: break-even revenue at start and simple sensitivity
      const breakEvenRevenue = monthlyExpenses;
      const burn10Cut = Math.max(0, (monthlyExpenses * 0.9) - monthlyRevenue);
      const burn10RevUp = Math.max(0, monthlyExpenses - (monthlyRevenue * 1.1));

      const runwaySimple = startingNetBurn > 0 ? (cashOnHand - reserveThreshold) / startingNetBurn : null;

      const html =
        `<p><strong>Estimated runway:</strong> ${runwayMonths} month${runwayMonths === 1 ? "" : "s"} (until around <strong>${endLabel}</strong>)</p>
         <ul class="result-list">
           <li><strong>Starting net burn:</strong> ${startingNetBurn > 0 ? formattedStartBurn + " per month" : formattedStartBurn + " surplus per month"}</li>
           <li><strong>Cash after one-time items:</strong> ${formatNumberTwoDecimals(cashOnHand + oneTimeInjection - oneTimeCost)}</li>
           <li><strong>Minimum cash reserve used:</strong> ${formatNumberTwoDecimals(reserveThreshold)}</li>
           <li><strong>Revenue needed to break even today:</strong> ${formatNumberTwoDecimals(breakEvenRevenue)}</li>
           <li><strong>10% expense cut reduces burn to:</strong> ${formatNumberTwoDecimals(burn10Cut)} per month</li>
           <li><strong>10% revenue increase reduces burn to:</strong> ${formatNumberTwoDecimals(burn10RevUp)} per month</li>
         </ul>
         ${runwaySimple !== null && Number.isFinite(runwaySimple) && runwaySimple > 0
            ? `<p><em>Note:</em> A simple flat-burn estimate (no growth) is about ${formatNumberTwoDecimals(runwaySimple)} months. Growth and one-time items can shift this.</p>`
            : ``}`;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Runway Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
