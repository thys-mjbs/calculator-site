document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const btuPerHourInput = document.getElementById("btuPerHour");
  const roundToInput = document.getElementById("roundTo");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(btuPerHourInput);
  attachLiveFormatting(roundToInput);

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
  // 4) VALIDATION HELPERS
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

  function clampInteger(value, min, max) {
    if (!Number.isFinite(value)) return null;
    const n = Math.round(value);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!btuPerHourInput) return;

      const btuPerHour = toNumber(btuPerHourInput.value);
      const roundToRaw = toNumber(roundToInput ? roundToInput.value : "");

      if (!validatePositive(btuPerHour, "BTU per hour (BTU/hr)")) return;

      // Optional rounding: allow 0 to 6 decimals. Default 2.
      let decimals = 2;
      if (roundToInput && roundToInput.value.trim() !== "") {
        if (!validateNonNegative(roundToRaw, "rounding decimals")) return;
        decimals = clampInteger(roundToRaw, 0, 6);
      }

      // Standard conversion:
      // 1 kW = 3412.141633 BTU/hr
      const KW_PER_BTU_PER_HOUR = 1 / 3412.141633;
      const kW = btuPerHour * KW_PER_BTU_PER_HOUR;
      const watts = kW * 1000;

      // HVAC reference: 1 ton of refrigeration = 12,000 BTU/hr
      const tons = btuPerHour / 12000;

      function formatFixed(value, dp) {
        if (!Number.isFinite(value)) return "";
        return value.toFixed(dp);
      }

      const kWText = formatFixed(kW, decimals);
      const wattsText = formatFixed(watts, Math.min(decimals, 2));
      const tonsText = formatFixed(tons, 2);

      const resultHtml =
        `<p><strong>kW:</strong> ${kWText} kW</p>` +
        `<p><strong>Watts:</strong> ${wattsText} W</p>` +
        `<p><strong>Cooling reference:</strong> ${tonsText} tons (TR)</p>` +
        `<p><strong>Formula used:</strong> kW = BTU/hr ÷ 3412.141633</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "BTU to kW Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
