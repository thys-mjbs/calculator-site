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

  const modeBlockOperating = document.getElementById("modeBlockOperating");
  const modeBlockNetIncome = document.getElementById("modeBlockNetIncome");

  // Operating-cost method inputs
  const revenue = document.getElementById("revenue");
  const cogs = document.getElementById("cogs");
  const operatingExpenses = document.getElementById("operatingExpenses");
  const depreciationOp = document.getElementById("depreciationOp");
  const amortizationOp = document.getElementById("amortizationOp");

  // Net income method inputs
  const netIncome = document.getElementById("netIncome");
  const interest = document.getElementById("interest");
  const taxes = document.getElementById("taxes");
  const depreciationNi = document.getElementById("depreciationNi");
  const amortizationNi = document.getElementById("amortizationNi");
  const revenueOptional = document.getElementById("revenueOptional");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(revenue);
  attachLiveFormatting(cogs);
  attachLiveFormatting(operatingExpenses);
  attachLiveFormatting(depreciationOp);
  attachLiveFormatting(amortizationOp);

  attachLiveFormatting(netIncome);
  attachLiveFormatting(interest);
  attachLiveFormatting(taxes);
  attachLiveFormatting(depreciationNi);
  attachLiveFormatting(amortizationNi);
  attachLiveFormatting(revenueOptional);

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
    if (modeBlockOperating) modeBlockOperating.classList.add("hidden");
    if (modeBlockNetIncome) modeBlockNetIncome.classList.add("hidden");

    if (mode === "netincome") {
      if (modeBlockNetIncome) modeBlockNetIncome.classList.remove("hidden");
    } else {
      if (modeBlockOperating) modeBlockOperating.classList.remove("hidden");
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
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid number for " + fieldLabel + ".");
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
      const mode = modeSelect ? modeSelect.value : "operating";

      // Parse inputs using toNumber() (from /scripts/main.js)
      if (mode === "netincome") {
        const ni = toNumber(netIncome ? netIncome.value : "");
        const intExp = toNumber(interest ? interest.value : "");
        const tax = toNumber(taxes ? taxes.value : "");
        const dep = toNumber(depreciationNi ? depreciationNi.value : "");
        const amort = toNumber(amortizationNi ? amortizationNi.value : "");
        const revOpt = toNumber(revenueOptional ? revenueOptional.value : "");

        if (!validateFinite(ni, "Net income")) return;
        if (!validateNonNegative(intExp, "Interest expense")) return;
        if (!validateNonNegative(tax, "Income taxes")) return;
        if (!validateNonNegative(dep, "Depreciation")) return;
        if (!validateNonNegative(amort, "Amortization")) return;
        if (revenueOptional && revenueOptional.value.trim() !== "") {
          if (!validatePositive(revOpt, "Revenue (for margin)")) return;
        }

        const ebitda = ni + intExp + tax + dep + amort;

        let marginHtml = "<span>EBITDA margin: not calculated (add revenue to calculate a margin).</span>";
        if (Number.isFinite(revOpt) && revOpt > 0) {
          const margin = (ebitda / revOpt) * 100;
          marginHtml = "<span>EBITDA margin: " + formatNumberTwoDecimals(margin) + "%</span>";
        }

        const html =
          "<p><strong>EBITDA:</strong> " + formatNumberTwoDecimals(ebitda) + "</p>" +
          "<p><strong>Breakdown:</strong> Net income (" + formatNumberTwoDecimals(ni) + ") + Interest (" + formatNumberTwoDecimals(intExp) + ") + Taxes (" + formatNumberTwoDecimals(tax) + ") + Depreciation (" + formatNumberTwoDecimals(dep) + ") + Amortization (" + formatNumberTwoDecimals(amort) + ")</p>" +
          "<p>" + marginHtml + "</p>" +
          "<p><strong>Practical meaning:</strong> This is an operating-earnings estimate before financing, tax, and non-cash charges. Use it for rough comparability, not as cash available.</p>";

        setResultSuccess(html);
        return;
      }

      // Operating-cost method
      const rev = toNumber(revenue ? revenue.value : "");
      const c = toNumber(cogs ? cogs.value : "");
      const opex = toNumber(operatingExpenses ? operatingExpenses.value : "");
      const depOp = toNumber(depreciationOp ? depreciationOp.value : "");
      const amortOp = toNumber(amortizationOp ? amortizationOp.value : "");

      if (!validatePositive(rev, "Revenue")) return;
      if (!validateNonNegative(c, "COGS")) return;
      if (!validateNonNegative(opex, "Operating expenses")) return;
      if (!validateNonNegative(depOp, "Depreciation")) return;
      if (!validateNonNegative(amortOp, "Amortization")) return;

      const ebit = rev - c - opex;
      const ebitda = ebit + depOp + amortOp;

      const margin = (ebitda / rev) * 100;

      const totalOperatingCosts = c + opex;

      const html =
        "<p><strong>EBITDA:</strong> " + formatNumberTwoDecimals(ebitda) + "</p>" +
        "<p><strong>EBITDA margin:</strong> " + formatNumberTwoDecimals(margin) + "%</p>" +
        "<p><strong>EBIT (operating profit):</strong> " + formatNumberTwoDecimals(ebit) + "</p>" +
        "<p><strong>Operating costs (COGS + OpEx):</strong> " + formatNumberTwoDecimals(totalOperatingCosts) + "</p>" +
        "<p><strong>Practical meaning:</strong> This estimates operating earnings before financing, tax, and non-cash D&amp;A. If EBITDA is strong but cash is tight, investigate working capital and capital spending.</p>";

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "EBITDA Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
