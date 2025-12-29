document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const initialInvestment = document.getElementById("initialInvestment");
  const holdingYears = document.getElementById("holdingYears");
  const grossReturn = document.getElementById("grossReturn");
  const expenseA = document.getElementById("expenseA");
  const expenseB = document.getElementById("expenseB");

  // Advanced (optional)
  const annualContribution = document.getElementById("annualContribution");
  const platformFee = document.getElementById("platformFee");
  const buyCommission = document.getElementById("buyCommission");
  const sellCommission = document.getElementById("sellCommission");
  const buysPerYear = document.getElementById("buysPerYear");
  const spreadPct = document.getElementById("spreadPct");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(initialInvestment);
  attachLiveFormatting(holdingYears);
  attachLiveFormatting(grossReturn);
  attachLiveFormatting(expenseA);
  attachLiveFormatting(expenseB);
  attachLiveFormatting(annualContribution);
  attachLiveFormatting(platformFee);
  attachLiveFormatting(buyCommission);
  attachLiveFormatting(sellCommission);
  attachLiveFormatting(buysPerYear);
  attachLiveFormatting(spreadPct);

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

  function clampToNonNegativeFinite(value, fallback) {
    if (!Number.isFinite(value) || value < 0) return fallback;
    return value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const P0 = toNumber(initialInvestment ? initialInvestment.value : "");
      const years = toNumber(holdingYears ? holdingYears.value : "");
      const grossPct = toNumber(grossReturn ? grossReturn.value : "");
      const erA = toNumber(expenseA ? expenseA.value : "");
      const erB = toNumber(expenseB ? expenseB.value : "");

      if (!validatePositive(P0, "initial investment")) return;
      if (!validatePositive(years, "holding period")) return;
      if (!validateNonNegative(grossPct, "expected annual return")) return;
      if (!validateNonNegative(erA, "ETF A expense ratio")) return;
      if (!validateNonNegative(erB, "ETF B expense ratio")) return;

      // Basic realism checks (soft guards)
      if (years > 60) {
        setResultError("Holding period looks unusually high. Enter a more realistic number of years.");
        return;
      }
      if (grossPct > 50) {
        setResultError("Expected annual return looks unusually high. Enter a more realistic percentage.");
        return;
      }
      if (erA > 5 || erB > 5) {
        setResultError("Expense ratio looks unusually high. Enter a percentage that matches the ETF factsheet.");
        return;
      }

      // Parse optional inputs with defaults
      const contribAnnual = clampToNonNegativeFinite(
        toNumber(annualContribution ? annualContribution.value : ""),
        0
      );

      const platformPct = clampToNonNegativeFinite(
        toNumber(platformFee ? platformFee.value : ""),
        0
      );

      const buyComm = clampToNonNegativeFinite(
        toNumber(buyCommission ? buyCommission.value : ""),
        0
      );

      const sellComm = clampToNonNegativeFinite(
        toNumber(sellCommission ? sellCommission.value : ""),
        0
      );

      let buysYr = clampToNonNegativeFinite(
        toNumber(buysPerYear ? buysPerYear.value : ""),
        1
      );
      if (buysYr === 0) buysYr = 1;

      const spread = clampToNonNegativeFinite(
        toNumber(spreadPct ? spreadPct.value : ""),
        0
      );

      if (spread > 5) {
        setResultError("Bid-ask spread looks unusually high. Enter a realistic percentage (often well under 1%).");
        return;
      }
      if (platformPct > 5) {
        setResultError("Platform fee looks unusually high. Enter a realistic percentage.");
        return;
      }

      const rGross = grossPct / 100;
      const spreadRate = spread / 100;

      function simulate(etfExpensePct) {
        const feeRateAnnual = (etfExpensePct + platformPct) / 100;

        let balance = P0;

        // One-time buy costs on initial investment
        let tradingCostTotal = 0;
        if (buyComm > 0) tradingCostTotal += buyComm;
        if (spreadRate > 0) tradingCostTotal += balance * spreadRate;

        balance = Math.max(0, balance - tradingCostTotal);

        let annualFeeCostTotal = 0;

        for (let y = 1; y <= Math.floor(years); y++) {
          // Contributions spread across the year by fixed buys per year.
          if (contribAnnual > 0) {
            const perBuy = contribAnnual / buysYr;

            for (let b = 0; b < buysYr; b++) {
              let buyCost = 0;
              if (buyComm > 0) buyCost += buyComm;
              if (spreadRate > 0) buyCost += perBuy * spreadRate;

              tradingCostTotal += buyCost;
              balance += Math.max(0, perBuy - buyCost);
            }
          }

          const balanceBeforeGrowth = balance;

          // Apply net growth with annual fee drag (practical approximation)
          const netReturn = rGross - feeRateAnnual;
          balance = balance * (1 + netReturn);

          // Track annual fee cost as if it were applied to starting balance
          // This is an approximation but consistent for comparison.
          const feeCostThisYear = Math.max(0, balanceBeforeGrowth * feeRateAnnual);
          annualFeeCostTotal += feeCostThisYear;
        }

        // Handle fractional year (if any)
        const frac = years - Math.floor(years);
        if (frac > 0) {
          // Add pro-rated contributions (still approximate)
          if (contribAnnual > 0) {
            const contribFrac = contribAnnual * frac;

            // Treat as one buy in the fractional period
            let buyCost = 0;
            if (buyComm > 0) buyCost += buyComm;
            if (spreadRate > 0) buyCost += contribFrac * spreadRate;

            tradingCostTotal += buyCost;
            balance += Math.max(0, contribFrac - buyCost);
          }

          const balanceBeforeGrowth = balance;
          const netReturn = rGross - feeRateAnnual;
          balance = balance * (1 + netReturn * frac);

          const feeCostThisPeriod = Math.max(0, balanceBeforeGrowth * feeRateAnnual * frac);
          annualFeeCostTotal += feeCostThisPeriod;
        }

        // Final sell costs at end
        let finalSellCost = 0;
        if (sellComm > 0) finalSellCost += sellComm;
        if (spreadRate > 0) finalSellCost += balance * spreadRate;

        tradingCostTotal += finalSellCost;
        balance = Math.max(0, balance - finalSellCost);

        return {
          endingValue: balance,
          annualFees: annualFeeCostTotal,
          tradingCosts: tradingCostTotal,
          totalCost: annualFeeCostTotal + tradingCostTotal
        };
      }

      const resA = simulate(erA);
      const resB = simulate(erB);

      const winner = resA.endingValue > resB.endingValue ? "A" : "B";
      const endingDiff = Math.abs(resA.endingValue - resB.endingValue);
      const costDiff = Math.abs(resA.totalCost - resB.totalCost);

      const html = `
        <p><strong>Best (higher estimated ending value):</strong> ETF ${winner}</p>

        <p><strong>Estimated ending value (ETF A):</strong> ${formatNumberTwoDecimals(resA.endingValue)}</p>
        <p><strong>Estimated ending value (ETF B):</strong> ${formatNumberTwoDecimals(resB.endingValue)}</p>
        <p><strong>Ending value difference:</strong> ${formatNumberTwoDecimals(endingDiff)}</p>

        <hr>

        <p><strong>Total estimated costs (ETF A):</strong> ${formatNumberTwoDecimals(resA.totalCost)}</p>
        <p><strong>Total estimated costs (ETF B):</strong> ${formatNumberTwoDecimals(resB.totalCost)}</p>
        <p><strong>Total cost difference:</strong> ${formatNumberTwoDecimals(costDiff)}</p>

        <hr>

        <p><strong>Cost breakdown (ETF A):</strong> Fund + platform fees ${formatNumberTwoDecimals(resA.annualFees)} | Trading costs ${formatNumberTwoDecimals(resA.tradingCosts)}</p>
        <p><strong>Cost breakdown (ETF B):</strong> Fund + platform fees ${formatNumberTwoDecimals(resB.annualFees)} | Trading costs ${formatNumberTwoDecimals(resB.tradingCosts)}</p>

        <p><em>Note:</em> This is a cost-focused estimate using your return assumption. It does not model tracking difference, taxes, or different index exposure.</p>
      `;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "ETF Cost Comparison Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
