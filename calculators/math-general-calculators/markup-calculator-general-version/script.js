/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const costInput = document.getElementById("costInput");
  const markupInput = document.getElementById("markupInput");
  const taxInput = document.getElementById("taxInput");
  const roundingSelect = document.getElementById("roundingSelect");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Cost is the main field that benefits from comma formatting
  attachLiveFormatting(costInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function roundToIncrement(value, increment) {
    if (!Number.isFinite(value) || !Number.isFinite(increment) || increment <= 0) return value;
    return Math.round(value / increment) * increment;
  }

  function roundUpToEnd99(value) {
    if (!Number.isFinite(value)) return value;
    const base = Math.floor(value);
    let candidate = base + 0.99;
    if (candidate < value) candidate = (base + 1) + 0.99;
    return candidate;
  }

  function formatPctTwoDecimals(value) {
    if (!Number.isFinite(value)) return "0.00";
    return formatNumberTwoDecimals(value);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const cost = toNumber(costInput ? costInput.value : "");
      const markupPct = toNumber(markupInput ? markupInput.value : "");
      const taxPctRaw = toNumber(taxInput ? taxInput.value : "");
      const taxPct = Number.isFinite(taxPctRaw) ? taxPctRaw : 0;

      const roundingMode = roundingSelect ? roundingSelect.value : "none";

      // Basic existence guard
      if (!costInput || !markupInput) return;

      // Validation
      if (!validatePositive(cost, "cost price")) return;
      if (!validateNonNegative(markupPct, "markup percent")) return;
      if (!validateNonNegative(taxPct, "tax rate")) return;

      // Calculation logic
      const baseSelling = cost * (1 + markupPct / 100);
      if (!Number.isFinite(baseSelling) || baseSelling <= 0) {
        setResultError("Enter values that produce a valid selling price.");
        return;
      }

      let selling = baseSelling;
      let roundingNote = "";

      if (roundingMode === "nearest005") {
        selling = roundToIncrement(baseSelling, 0.05);
        roundingNote = "Nearest 0.05 rounding applied.";
      } else if (roundingMode === "nearest010") {
        selling = roundToIncrement(baseSelling, 0.10);
        roundingNote = "Nearest 0.10 rounding applied.";
      } else if (roundingMode === "end99") {
        selling = roundUpToEnd99(baseSelling);
        roundingNote = "End in .99 rounding applied (rounded up).";
      }

      // Keep currency-like precision stable
      selling = Math.round(selling * 100) / 100;

      const profit = selling - cost;
      const marginPct = selling > 0 ? (profit / selling) * 100 : 0;

      const taxAmount = selling * (taxPct / 100);
      const totalWithTax = selling + taxAmount;

      const sellingFmt = formatNumberTwoDecimals(selling);
      const profitFmt = formatNumberTwoDecimals(profit);
      const marginFmt = formatPctTwoDecimals(marginPct);

      const baseSellingFmt = formatNumberTwoDecimals(baseSelling);
      const taxAmountFmt = formatNumberTwoDecimals(taxAmount);
      const totalWithTaxFmt = formatNumberTwoDecimals(totalWithTax);

      // Build output HTML
      let resultHtml = `
        <p><strong>Selling price (before tax):</strong> ${sellingFmt}</p>
        <p><strong>Gross profit:</strong> ${profitFmt}</p>
        <p><strong>Gross margin:</strong> ${marginFmt}%</p>
      `;

      if (taxPct > 0) {
        resultHtml += `
          <p><strong>Tax amount (${formatPctTwoDecimals(taxPct)}%):</strong> ${taxAmountFmt}</p>
          <p><strong>Total price (including tax):</strong> ${totalWithTaxFmt}</p>
        `;
      }

      if (roundingMode !== "none") {
        resultHtml += `
          <p><strong>Rounding:</strong> ${roundingNote}</p>
          <p><strong>Unrounded selling price:</strong> ${baseSellingFmt}</p>
        `;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Markup Calculator (General Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
