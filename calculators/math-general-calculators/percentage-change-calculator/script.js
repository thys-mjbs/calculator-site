document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const originalValueInput = document.getElementById("originalValue");
  const newValueInput = document.getElementById("newValue");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(originalValueInput);
  attachLiveFormatting(newValueInput);

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
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
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
      const original = toNumber(originalValueInput ? originalValueInput.value : "");
      const current = toNumber(newValueInput ? newValueInput.value : "");

      // Basic existence guard
      if (!originalValueInput || !newValueInput) return;

      // Validation
      if (!validateFinite(original, "original value")) return;
      if (!validateFinite(current, "new value")) return;

      if (original === 0) {
        setResultError("Percentage change needs a non-zero original value. Enter an original value that is not 0.");
        return;
      }

      // Calculation logic
      const change = current - original;
      const percentChange = (change / original) * 100;
      const ratio = current / original;

      const direction =
        percentChange > 0 ? "Increase" : percentChange < 0 ? "Decrease" : "No change";

      const absChange = Math.abs(change);
      const absPercent = Math.abs(percentChange);

      // Build output HTML
      const sign = percentChange > 0 ? "+" : percentChange < 0 ? "−" : "";
      const changeSign = change > 0 ? "+" : change < 0 ? "−" : "";

      const resultHtml = `
        <p><strong>${direction}:</strong> ${sign}${formatNumberTwoDecimals(absPercent)}%</p>
        <p><strong>Absolute change:</strong> ${changeSign}${formatNumberTwoDecimals(absChange)}</p>
        <p><strong>From → To:</strong> ${formatNumberTwoDecimals(original)} → ${formatNumberTwoDecimals(current)}</p>
        <p><strong>Ratio (new ÷ original):</strong> ${formatNumberTwoDecimals(ratio)}×</p>
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
      const message = "Percentage Change Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
