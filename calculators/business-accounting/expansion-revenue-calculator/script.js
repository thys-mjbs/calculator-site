document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentMonthlyRevenueInput = document.getElementById("currentMonthlyRevenue");
  const expectedUpliftPercentInput = document.getElementById("expectedUpliftPercent");
  const timeHorizonMonthsInput = document.getElementById("timeHorizonMonths");

  const rampUpMonthsInput = document.getElementById("rampUpMonths");
  const oneTimeExpansionCostInput = document.getElementById("oneTimeExpansionCost");
  const ongoingMonthlyCostInput = document.getElementById("ongoingMonthlyCost");
  const grossMarginPercentInput = document.getElementById("grossMarginPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(currentMonthlyRevenueInput);
  attachLiveFormatting(expectedUpliftPercentInput);
  attachLiveFormatting(timeHorizonMonthsInput);
  attachLiveFormatting(rampUpMonthsInput);
  attachLiveFormatting(oneTimeExpansionCostInput);
  attachLiveFormatting(ongoingMonthlyCostInput);
  attachLiveFormatting(grossMarginPercentInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function formatMoney(value) {
    return formatNumberTwoDecimals(value);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const currentMonthlyRevenue = toNumber(currentMonthlyRevenueInput ? currentMonthlyRevenueInput.value : "");
      const expectedUpliftPercent = toNumber(expectedUpliftPercentInput ? expectedUpliftPercentInput.value : "");
      const timeHorizonMonthsRaw = toNumber(timeHorizonMonthsInput ? timeHorizonMonthsInput.value : "");

      const rampUpMonthsRaw = toNumber(rampUpMonthsInput ? rampUpMonthsInput.value : "");
      const oneTimeExpansionCost = toNumber(oneTimeExpansionCostInput ? oneTimeExpansionCostInput.value : "");
      const ongoingMonthlyCost = toNumber(ongoingMonthlyCostInput ? ongoingMonthlyCostInput.value : "");
      const grossMarginPercentRaw = toNumber(grossMarginPercentInput ? grossMarginPercentInput.value : "60");

      // Required validations (minimal inputs)
      if (!validatePositive(currentMonthlyRevenue, "current monthly revenue")) return;
      if (!validateNonNegative(expectedUpliftPercent, "expected uplift percent")) return;
      if (!validatePositive(timeHorizonMonthsRaw, "time horizon (months)")) return;

      const timeHorizonMonths = Math.floor(timeHorizonMonthsRaw);
      if (!Number.isFinite(timeHorizonMonths) || timeHorizonMonths <= 0) {
        setResultError("Enter a valid time horizon in whole months (1 or higher).");
        return;
      }
      if (timeHorizonMonths > 600) {
        setResultError("Time horizon is too large. Use 600 months or fewer.");
        return;
      }

      // Optional inputs with defaults and safe handling
      const rampUpMonths = Math.floor(validateNonNegative(rampUpMonthsRaw, "ramp-up period (months)") ? rampUpMonthsRaw : 0);
      if (rampUpMonths < 0) return;
      if (rampUpMonths > timeHorizonMonths) {
        setResultError("Ramp-up months cannot be greater than the time horizon.");
        return;
      }

      if (!validateNonNegative(oneTimeExpansionCost, "one-time expansion cost")) return;
      if (!validateNonNegative(ongoingMonthlyCost, "ongoing monthly expansion cost")) return;

      if (!validateNonNegative(grossMarginPercentRaw, "gross margin percent")) return;
      const grossMarginPercent = clamp(grossMarginPercentRaw, 0, 100);
      const grossMargin = grossMarginPercent / 100;

      const uplift = expectedUpliftPercent / 100;

      // Baseline totals
      const baselineTotalRevenue = currentMonthlyRevenue * timeHorizonMonths;

      // Expansion totals with ramp-up (linear)
      let expansionTotalRevenue = 0;
      let incrementalRevenueTotal = 0;

      // For break-even
      let breakEvenMonth = null;
      let cumulativeNet = -oneTimeExpansionCost;

      for (let m = 1; m <= timeHorizonMonths; m++) {
        let rampFactor = 1;
        if (rampUpMonths > 0) {
          rampFactor = m <= rampUpMonths ? m / rampUpMonths : 1;
        }
        const upliftThisMonth = uplift * rampFactor;
        const revenueThisMonth = currentMonthlyRevenue * (1 + upliftThisMonth);

        expansionTotalRevenue += revenueThisMonth;

        const incrementalRevenueThisMonth = revenueThisMonth - currentMonthlyRevenue;
        incrementalRevenueTotal += incrementalRevenueThisMonth;

        const incrementalGrossProfitThisMonth = incrementalRevenueThisMonth * grossMargin;
        const netThisMonth = incrementalGrossProfitThisMonth - ongoingMonthlyCost;

        cumulativeNet += netThisMonth;

        if (breakEvenMonth === null && cumulativeNet >= 0) {
          breakEvenMonth = m;
        }
      }

      const totalCosts = oneTimeExpansionCost + ongoingMonthlyCost * timeHorizonMonths;
      const incrementalGrossProfitTotal = incrementalRevenueTotal * grossMargin;
      const netGain = incrementalGrossProfitTotal - totalCosts;

      const steadyStateMonthlyRevenue = currentMonthlyRevenue * (1 + uplift);
      const avgMonthlyIncrementalRevenue = incrementalRevenueTotal / timeHorizonMonths;

      let roiText = "Not applicable";
      if (totalCosts > 0) {
        const roi = netGain / totalCosts;
        roiText = (roi * 100).toFixed(2) + "%";
      } else {
        if (netGain > 0) roiText = "No costs entered (ROI undefined, net gain is positive)";
        if (netGain === 0) roiText = "No costs entered (ROI undefined, net gain is zero)";
        if (netGain < 0) roiText = "No costs entered (ROI undefined, net gain is negative)";
      }

      let breakEvenText = "No break-even within the selected horizon";
      if (breakEvenMonth !== null) {
        breakEvenText = "Month " + breakEvenMonth + " (within " + timeHorizonMonths + " months)";
      }

      const resultHtml =
        `<p><strong>Projected total revenue (no expansion):</strong> ${formatMoney(baselineTotalRevenue)}</p>` +
        `<p><strong>Projected total revenue (with expansion):</strong> ${formatMoney(expansionTotalRevenue)}</p>` +
        `<p><strong>Incremental revenue from expansion:</strong> ${formatMoney(incrementalRevenueTotal)}</p>` +
        `<p><strong>Steady-state monthly revenue (at full uplift):</strong> ${formatMoney(steadyStateMonthlyRevenue)}</p>` +
        `<p><strong>Average monthly incremental revenue:</strong> ${formatMoney(avgMonthlyIncrementalRevenue)}</p>` +
        `<hr>` +
        `<p><strong>Assumed gross margin used:</strong> ${grossMarginPercent.toFixed(2)}%</p>` +
        `<p><strong>Incremental gross profit (estimated):</strong> ${formatMoney(incrementalGrossProfitTotal)}</p>` +
        `<p><strong>Total expansion costs (one-time + ongoing):</strong> ${formatMoney(totalCosts)}</p>` +
        `<p><strong>Net gain after costs (estimated):</strong> ${formatMoney(netGain)}</p>` +
        `<p><strong>Break-even timing (estimated):</strong> ${breakEvenText}</p>` +
        `<p><strong>ROI over horizon (estimated):</strong> ${roiText}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Expansion Revenue Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
