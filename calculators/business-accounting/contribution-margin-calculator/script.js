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

  // Total mode inputs
  const revenueInput = document.getElementById("revenueInput");
  const variableCostsInput = document.getElementById("variableCostsInput");

  // Unit mode inputs
  const pricePerUnitInput = document.getElementById("pricePerUnitInput");
  const variableCostPerUnitInput = document.getElementById("variableCostPerUnitInput");
  const unitsSoldInput = document.getElementById("unitsSoldInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeTotalBlock = document.getElementById("modeTotalBlock");
  const modeUnitBlock = document.getElementById("modeUnitBlock");

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
  attachLiveFormatting(revenueInput);
  attachLiveFormatting(variableCostsInput);
  attachLiveFormatting(pricePerUnitInput);
  attachLiveFormatting(variableCostPerUnitInput);
  attachLiveFormatting(unitsSoldInput);

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
    if (modeTotalBlock) modeTotalBlock.classList.add("hidden");
    if (modeUnitBlock) modeUnitBlock.classList.add("hidden");

    if (mode === "unit") {
      if (modeUnitBlock) modeUnitBlock.classList.remove("hidden");
    } else {
      if (modeTotalBlock) modeTotalBlock.classList.remove("hidden");
    }

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "total";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const revenue = toNumber(revenueInput ? revenueInput.value : "");
      const variableCosts = toNumber(variableCostsInput ? variableCostsInput.value : "");

      const pricePerUnit = toNumber(pricePerUnitInput ? pricePerUnitInput.value : "");
      const variableCostPerUnit = toNumber(variableCostPerUnitInput ? variableCostPerUnitInput.value : "");
      const unitsSold = toNumber(unitsSoldInput ? unitsSoldInput.value : "");

      // Validation + calculation
      let contributionMargin = 0;
      let contributionMarginRatioPct = 0;
      let resultHtml = "";

      if (mode === "unit") {
        if (!validatePositive(pricePerUnit, "selling price per unit")) return;
        if (!validateNonNegative(variableCostPerUnit, "variable cost per unit")) return;
        if (!validatePositive(unitsSold, "units sold")) return;

        if (variableCostPerUnit > pricePerUnit) {
          setResultError("Variable cost per unit cannot be greater than selling price per unit.");
          return;
        }

        const cmPerUnit = pricePerUnit - variableCostPerUnit;
        const totalRevenue = pricePerUnit * unitsSold;
        contributionMargin = cmPerUnit * unitsSold;
        contributionMarginRatioPct = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

        resultHtml =
          `<p><strong>Contribution margin (total):</strong> ${formatNumberTwoDecimals(contributionMargin)}</p>` +
          `<p><strong>Contribution margin per unit:</strong> ${formatNumberTwoDecimals(cmPerUnit)}</p>` +
          `<p><strong>Contribution margin ratio:</strong> ${formatNumberTwoDecimals(contributionMarginRatioPct)}%</p>` +
          `<p><strong>Total revenue (for these units):</strong> ${formatNumberTwoDecimals(totalRevenue)}</p>`;
      } else {
        if (!validatePositive(revenue, "revenue")) return;
        if (!validateNonNegative(variableCosts, "variable costs")) return;

        if (variableCosts > revenue) {
          setResultError("Total variable costs cannot be greater than revenue.");
          return;
        }

        contributionMargin = revenue - variableCosts;
        contributionMarginRatioPct = revenue > 0 ? (contributionMargin / revenue) * 100 : 0;

        resultHtml =
          `<p><strong>Contribution margin:</strong> ${formatNumberTwoDecimals(contributionMargin)}</p>` +
          `<p><strong>Contribution margin ratio:</strong> ${formatNumberTwoDecimals(contributionMarginRatioPct)}%</p>` +
          `<p><strong>Revenue:</strong> ${formatNumberTwoDecimals(revenue)}</p>` +
          `<p><strong>Variable costs:</strong> ${formatNumberTwoDecimals(variableCosts)}</p>`;
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
      const message = "Contribution Margin Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
