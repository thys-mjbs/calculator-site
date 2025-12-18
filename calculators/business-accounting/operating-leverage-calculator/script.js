document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const revenueInput = document.getElementById("revenueInput");
  const variableCostsInput = document.getElementById("variableCostsInput");
  const fixedCostsInput = document.getElementById("fixedCostsInput");
  const salesChangePctInput = document.getElementById("salesChangePctInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(revenueInput);
  attachLiveFormatting(variableCostsInput);
  attachLiveFormatting(fixedCostsInput);
  attachLiveFormatting(salesChangePctInput);

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
      const revenue = toNumber(revenueInput ? revenueInput.value : "");
      const variableCosts = toNumber(variableCostsInput ? variableCostsInput.value : "");
      const fixedCosts = toNumber(fixedCostsInput ? fixedCostsInput.value : "");
      const salesChangePctRaw = toNumber(salesChangePctInput ? salesChangePctInput.value : "");

      // Basic existence guard
      if (!revenueInput || !variableCostsInput || !fixedCostsInput || !salesChangePctInput) return;

      // Validation
      if (!validatePositive(revenue, "revenue")) return;
      if (!validateNonNegative(variableCosts, "variable costs")) return;
      if (!validateNonNegative(fixedCosts, "fixed costs")) return;

      if (variableCosts > revenue * 10) {
        setResultError("Variable costs look unusually high relative to revenue. Check the numbers and try again.");
        return;
      }

      // Optional sales change percent
      const salesChangePct = Number.isFinite(salesChangePctRaw) && salesChangePctRaw !== 0 ? salesChangePctRaw : 10;

      // Calculation logic
      const contributionMargin = revenue - variableCosts;
      const contributionMarginRatio = contributionMargin / revenue; // can be negative
      const ebit = contributionMargin - fixedCosts;

      // Break-even sales if contribution margin ratio is positive
      let breakEvenSales = null;
      if (contributionMarginRatio > 0) {
        breakEvenSales = fixedCosts / contributionMarginRatio;
      }

      // DOL (Degree of Operating Leverage) when meaningful
      let dol = null;
      if (ebit !== 0) {
        dol = contributionMargin / ebit;
      }

      // Scenario: approximate EBIT change from sales change
      let approxEbitChangePct = null;
      let approxNewEbit = null;
      if (dol !== null && Number.isFinite(dol)) {
        approxEbitChangePct = dol * salesChangePct;
        approxNewEbit = ebit * (1 + approxEbitChangePct / 100);
      }

      // Build output HTML
      const revenueFmt = formatNumberTwoDecimals(revenue);
      const variableFmt = formatNumberTwoDecimals(variableCosts);
      const fixedFmt = formatNumberTwoDecimals(fixedCosts);
      const cmFmt = formatNumberTwoDecimals(contributionMargin);
      const ebitFmt = formatNumberTwoDecimals(ebit);

      const cmRatioPct = contributionMarginRatio * 100;
      const cmRatioPctFmt = formatNumberTwoDecimals(cmRatioPct);

      let dolLine = "";
      if (ebit > 0 && dol !== null && Number.isFinite(dol)) {
        dolLine = `<p><strong>Degree of Operating Leverage (DOL):</strong> ${formatNumberTwoDecimals(dol)}</p>`;
      } else if (ebit === 0) {
        dolLine = `<p><strong>Degree of Operating Leverage (DOL):</strong> Not meaningful at break-even (operating profit is 0).</p>`;
      } else {
        dolLine = `<p><strong>Degree of Operating Leverage (DOL):</strong> Not meaningful while operating profit is zero or negative.</p>`;
      }

      let breakEvenBlock = "";
      if (breakEvenSales !== null && Number.isFinite(breakEvenSales)) {
        const beFmt = formatNumberTwoDecimals(breakEvenSales);
        const safetyMargin = (revenue - breakEvenSales) / revenue;
        const safetyMarginPct = safetyMargin * 100;
        const safetyMarginPctFmt = formatNumberTwoDecimals(safetyMarginPct);

        breakEvenBlock = `
          <p><strong>Estimated break-even revenue:</strong> ${beFmt}</p>
          <p><strong>Safety margin:</strong> ${safetyMarginPctFmt}% (how far revenue is above break-even)</p>
        `;
      } else {
        breakEvenBlock = `
          <p><strong>Break-even revenue:</strong> Not available because contribution margin ratio is zero or negative.</p>
        `;
      }

      let scenarioBlock = "";
      if (ebit > 0 && approxEbitChangePct !== null && approxNewEbit !== null && Number.isFinite(approxNewEbit)) {
        const approxEbitChangePctFmt = formatNumberTwoDecimals(approxEbitChangePct);
        const approxNewEbitFmt = formatNumberTwoDecimals(approxNewEbit);

        scenarioBlock = `
          <p><strong>Scenario:</strong> If sales change by ${formatNumberTwoDecimals(salesChangePct)}%, EBIT is estimated to change by about ${approxEbitChangePctFmt}% (approximation).</p>
          <p><strong>Estimated new EBIT:</strong> ${approxNewEbitFmt}</p>
        `;
      } else {
        scenarioBlock = `
          <p><strong>Scenario:</strong> A DOL-based profit sensitivity estimate is most useful when EBIT is positive and not near zero.</p>
        `;
      }

      const resultHtml = `
        <p><strong>Revenue:</strong> ${revenueFmt}</p>
        <p><strong>Variable costs:</strong> ${variableFmt}</p>
        <p><strong>Fixed operating costs:</strong> ${fixedFmt}</p>
        <hr>
        <p><strong>Contribution margin:</strong> ${cmFmt}</p>
        <p><strong>Contribution margin ratio:</strong> ${cmRatioPctFmt}%</p>
        <p><strong>Operating profit (EBIT):</strong> ${ebitFmt}</p>
        ${dolLine}
        <hr>
        ${breakEvenBlock}
        <hr>
        ${scenarioBlock}
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
      const message = "Operating Leverage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
