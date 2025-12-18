document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const fixedCostsInput = document.getElementById("fixedCosts");
  const expectedUnitsInput = document.getElementById("expectedUnits");
  const variableCostPerUnitInput = document.getElementById("variableCostPerUnit");
  const totalVariableCostsInput = document.getElementById("totalVariableCosts");
  const sellingPricePerUnitInput = document.getElementById("sellingPricePerUnit");
  const actualUnitsInput = document.getElementById("actualUnits");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(fixedCostsInput);
  attachLiveFormatting(expectedUnitsInput);
  attachLiveFormatting(variableCostPerUnitInput);
  attachLiveFormatting(totalVariableCostsInput);
  attachLiveFormatting(sellingPricePerUnitInput);
  attachLiveFormatting(actualUnitsInput);

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
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
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
      const fixedCosts = toNumber(fixedCostsInput ? fixedCostsInput.value : "");
      const expectedUnits = toNumber(expectedUnitsInput ? expectedUnitsInput.value : "");
      const variablePerUnit = toNumber(variableCostPerUnitInput ? variableCostPerUnitInput.value : "");
      const totalVariableCosts = toNumber(totalVariableCostsInput ? totalVariableCostsInput.value : "");
      const sellingPrice = toNumber(sellingPricePerUnitInput ? sellingPricePerUnitInput.value : "");
      const actualUnits = toNumber(actualUnitsInput ? actualUnitsInput.value : "");

      // Input existence guard
      if (!fixedCostsInput || !expectedUnitsInput || !resultDiv) return;

      // Validation
      if (!validateNonNegative(fixedCosts, "total fixed costs")) return;
      if (!validatePositive(expectedUnits, "expected units")) return;
      if (!validateNonNegative(variablePerUnit, "variable cost per unit")) return;
      if (!validateNonNegative(totalVariableCosts, "total variable costs")) return;
      if (!validateNonNegative(sellingPrice, "selling price per unit")) return;
      if (!validateNonNegative(actualUnits, "actual units")) return;

      // Determine variable cost per unit
      let variableCostPerUnit = 0;
      let variableAssumptionNote = "";

      if (variablePerUnit > 0) {
        variableCostPerUnit = variablePerUnit;
        if (totalVariableCosts > 0) {
          variableAssumptionNote = "You entered both variable cost per unit and total variable costs. This result uses the per-unit value.";
        }
      } else if (totalVariableCosts > 0) {
        variableCostPerUnit = totalVariableCosts / expectedUnits;
        variableAssumptionNote = "Variable cost per unit was estimated from total variable costs ÷ expected units.";
      } else {
        variableCostPerUnit = 0;
        variableAssumptionNote = "No variable cost was entered. Variable cost per unit is treated as 0.";
      }

      // Core calculations
      const fixedCostPerUnit = fixedCosts / expectedUnits;
      const totalCostPerUnit = fixedCostPerUnit + variableCostPerUnit;

      const totalVariableAtExpected = variableCostPerUnit * expectedUnits;
      const totalCostAtExpected = fixedCosts + totalVariableAtExpected;

      // Optional: margins and break-even
      let marginHtml = "";
      if (sellingPrice > 0) {
        const contributionMarginPerUnit = sellingPrice - variableCostPerUnit;
        const contributionMarginPct = sellingPrice > 0 ? (contributionMarginPerUnit / sellingPrice) * 100 : 0;

        if (contributionMarginPerUnit <= 0) {
          marginHtml = `
            <p><strong>Contribution margin:</strong> ${formatNumberTwoDecimals(contributionMarginPerUnit)} per unit (${formatNumberTwoDecimals(contributionMarginPct)}%)</p>
            <p><strong>Break-even:</strong> Not achievable with these inputs (selling price is not above variable cost per unit).</p>
          `;
        } else {
          const breakEvenUnits = fixedCosts / contributionMarginPerUnit;
          const breakEvenRevenue = breakEvenUnits * sellingPrice;

          marginHtml = `
            <p><strong>Contribution margin:</strong> ${formatNumberTwoDecimals(contributionMarginPerUnit)} per unit (${formatNumberTwoDecimals(contributionMarginPct)}%)</p>
            <p><strong>Break-even volume:</strong> ${formatNumberTwoDecimals(breakEvenUnits)} units</p>
            <p><strong>Break-even revenue:</strong> ${formatNumberTwoDecimals(breakEvenRevenue)}</p>
          `;

          if (actualUnits > 0) {
            const revenueAtActual = actualUnits * sellingPrice;
            const variableAtActual = actualUnits * variableCostPerUnit;
            const profitAtActual = revenueAtActual - variableAtActual - fixedCosts;

            marginHtml += `
              <p><strong>Estimated profit at actual units:</strong> ${formatNumberTwoDecimals(profitAtActual)}</p>
            `;
          }
        }
      } else if (actualUnits > 0) {
        marginHtml = `
          <p><strong>Note:</strong> Add a selling price per unit to calculate contribution margin, break-even units, and profit.</p>
        `;
      }

      const noteHtml = variableAssumptionNote
        ? `<p><em>${variableAssumptionNote}</em></p>`
        : "";

      const resultHtml = `
        <p><strong>Fixed cost per unit:</strong> ${formatNumberTwoDecimals(fixedCostPerUnit)}</p>
        <p><strong>Variable cost per unit:</strong> ${formatNumberTwoDecimals(variableCostPerUnit)}</p>
        <p><strong>Total cost per unit:</strong> ${formatNumberTwoDecimals(totalCostPerUnit)}</p>

        <hr>

        <p><strong>Total fixed costs (period):</strong> ${formatNumberTwoDecimals(fixedCosts)}</p>
        <p><strong>Total variable costs (at expected units):</strong> ${formatNumberTwoDecimals(totalVariableAtExpected)}</p>
        <p><strong>Total cost (at expected units):</strong> ${formatNumberTwoDecimals(totalCostAtExpected)}</p>

        ${marginHtml}
        ${noteHtml}
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
      const message = "Fixed vs Variable Cost Allocator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
