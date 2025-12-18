document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const pricePerUnit = document.getElementById("pricePerUnit");
  const variableCostPerUnit = document.getElementById("variableCostPerUnit");
  const fixedCosts = document.getElementById("fixedCosts");
  const unitsInPeriod = document.getElementById("unitsInPeriod");
  const cacPerCustomer = document.getElementById("cacPerCustomer");
  const unitsPerCustomer = document.getElementById("unitsPerCustomer");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(pricePerUnit);
  attachLiveFormatting(variableCostPerUnit);
  attachLiveFormatting(fixedCosts);
  attachLiveFormatting(unitsInPeriod);
  attachLiveFormatting(cacPerCustomer);
  attachLiveFormatting(unitsPerCustomer);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const price = toNumber(pricePerUnit ? pricePerUnit.value : "");
      const varCost = toNumber(variableCostPerUnit ? variableCostPerUnit.value : "");

      const fixed = toNumber(fixedCosts ? fixedCosts.value : "");
      const unitsPeriod = toNumber(unitsInPeriod ? unitsInPeriod.value : "");
      const cac = toNumber(cacPerCustomer ? cacPerCustomer.value : "");
      const unitsCust = toNumber(unitsPerCustomer ? unitsPerCustomer.value : "");

      // Input existence guard
      if (!pricePerUnit || !variableCostPerUnit) return;

      // Validation (required)
      if (!validatePositive(price, "selling price per unit")) return;
      if (!validateNonNegative(varCost, "variable cost per unit")) return;

      if (varCost > price) {
        setResultError("Your variable cost is higher than your selling price. That means you lose money on each unit.");
        return;
      }

      // Optional validations (only if user provided something)
      const fixedProvided = fixedCosts && fixedCosts.value.trim() !== "";
      const unitsProvided = unitsInPeriod && unitsInPeriod.value.trim() !== "";
      const cacProvided = cacPerCustomer && cacPerCustomer.value.trim() !== "";
      const unitsPerCustomerProvided = unitsPerCustomer && unitsPerCustomer.value.trim() !== "";

      if (fixedProvided && !validateNonNegative(fixed, "fixed costs")) return;
      if (unitsProvided && !validatePositive(unitsPeriod, "units sold in period")) return;
      if (cacProvided && !validateNonNegative(cac, "CAC per customer")) return;
      if (unitsPerCustomerProvided && !validatePositive(unitsCust, "units per customer")) return;

      // Calculation logic
      const contributionMargin = price - varCost;
      const contributionMarginPct = price > 0 ? (contributionMargin / price) * 100 : 0;

      let breakEvenUnits = null;
      let breakEvenRevenue = null;
      if (fixedProvided) {
        if (contributionMargin <= 0) {
          breakEvenUnits = Infinity;
          breakEvenRevenue = Infinity;
        } else {
          breakEvenUnits = fixed / contributionMargin;
          breakEvenRevenue = breakEvenUnits * price;
        }
      }

      let estProfitInPeriod = null;
      if (fixedProvided && unitsProvided) {
        estProfitInPeriod = (contributionMargin * unitsPeriod) - fixed;
      } else if (!fixedProvided && unitsProvided) {
        estProfitInPeriod = contributionMargin * unitsPeriod;
      }

      // CAC payback calculations (optional)
      let paybackUnits = null;
      let grossProfitPerCustomer = null;
      let netProfitPerCustomerAfterCAC = null;

      if (cacProvided) {
        if (contributionMargin > 0) {
          paybackUnits = cac / contributionMargin;
        } else {
          paybackUnits = Infinity;
        }

        if (unitsPerCustomerProvided) {
          grossProfitPerCustomer = contributionMargin * unitsCust;
          netProfitPerCustomerAfterCAC = grossProfitPerCustomer - cac;
        }
      }

      // Build output HTML
      const cmStr = formatNumberTwoDecimals(contributionMargin);
      const priceStr = formatNumberTwoDecimals(price);
      const varCostStr = formatNumberTwoDecimals(varCost);

      let resultHtml = "";
      resultHtml += `<p><strong>Contribution margin per unit:</strong> ${cmStr}</p>`;
      resultHtml += `<p><strong>Contribution margin %:</strong> ${formatNumberTwoDecimals(contributionMarginPct)}%</p>`;
      resultHtml += `<p><strong>Price vs variable cost:</strong> ${priceStr} − ${varCostStr}</p>`;

      // Secondary insights
      const markupOnCost = varCost > 0 ? ((price - varCost) / varCost) * 100 : null;
      if (markupOnCost !== null && Number.isFinite(markupOnCost)) {
        resultHtml += `<p><strong>Markup on variable cost:</strong> ${formatNumberTwoDecimals(markupOnCost)}%</p>`;
      }

      if (fixedProvided) {
        if (!Number.isFinite(breakEvenUnits) || breakEvenUnits === Infinity) {
          resultHtml += `<p><strong>Break-even units (this period):</strong> Not achievable with current margin</p>`;
        } else {
          resultHtml += `<p><strong>Break-even units (this period):</strong> ${formatNumberTwoDecimals(breakEvenUnits)}</p>`;
          resultHtml += `<p><strong>Break-even revenue (this period):</strong> ${formatNumberTwoDecimals(breakEvenRevenue)}</p>`;
        }
      } else {
        resultHtml += `<p><strong>Break-even units:</strong> Enter fixed costs to calculate this.</p>`;
      }

      if (unitsProvided) {
        if (fixedProvided) {
          resultHtml += `<p><strong>Estimated profit for the period:</strong> ${formatNumberTwoDecimals(estProfitInPeriod)}</p>`;
        } else {
          resultHtml += `<p><strong>Estimated contribution for the period:</strong> ${formatNumberTwoDecimals(estProfitInPeriod)} <span style="color:#666">(fixed costs not included)</span></p>`;
        }
      } else if (fixedProvided) {
        resultHtml += `<p><strong>Period outcome:</strong> Enter units sold in the period to estimate profit or loss.</p>`;
      }

      if (cacProvided) {
        if (!Number.isFinite(paybackUnits) || paybackUnits === Infinity) {
          resultHtml += `<p><strong>CAC payback (units):</strong> Not achievable with current margin</p>`;
        } else {
          resultHtml += `<p><strong>CAC payback (units):</strong> ${formatNumberTwoDecimals(paybackUnits)} units</p>`;
        }

        if (unitsPerCustomerProvided) {
          resultHtml += `<p><strong>Gross profit per customer (from units):</strong> ${formatNumberTwoDecimals(grossProfitPerCustomer)}</p>`;
          resultHtml += `<p><strong>Net profit per customer after CAC:</strong> ${formatNumberTwoDecimals(netProfitPerCustomerAfterCAC)}</p>`;
        } else {
          resultHtml += `<p><strong>Per-customer profit after CAC:</strong> Enter units per customer to estimate this.</p>`;
        }
      } else {
        resultHtml += `<p><strong>CAC payback:</strong> Enter CAC (optional) to see payback units and per-customer profitability.</p>`;
      }

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
      const message = "Unit Economics Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
