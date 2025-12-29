document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const fareAmount = document.getElementById("fareAmount");
  const tipPercent = document.getElementById("tipPercent");
  const ridersCount = document.getElementById("ridersCount");
  const roundTo = document.getElementById("roundTo");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Only format currency-like fields with commas
  attachLiveFormatting(fareAmount);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const fare = toNumber(fareAmount ? fareAmount.value : "");
      const tipPctRaw = toNumber(tipPercent ? tipPercent.value : "");
      const ridersRaw = toNumber(ridersCount ? ridersCount.value : "");
      const roundToRaw = toNumber(roundTo ? roundTo.value : "");

      // Guards
      if (!fareAmount || !tipPercent || !ridersCount || !roundTo) return;

      // Validation (required: fare)
      if (!validatePositive(fare, "ride fare")) return;

      // Tip %: optional, default if blank or invalid
      const tipPct = Number.isFinite(tipPctRaw) ? tipPctRaw : 10;
      if (!validateNonNegative(tipPct, "tip percentage")) return;
      if (tipPct > 100) {
        setResultError("Enter a tip percentage of 100 or less.");
        return;
      }

      // Riders: optional, default to 1
      let riders = Number.isFinite(ridersRaw) ? Math.floor(ridersRaw) : 1;
      if (!Number.isFinite(riders) || riders < 1) riders = 1;

      // Rounding: optional, 0 means no rounding
      const roundingStep = Number.isFinite(roundToRaw) ? roundToRaw : 0;
      if (Number.isFinite(roundingStep) && roundingStep < 0) {
        setResultError("Enter a valid rounding amount (0 or higher).");
        return;
      }

      // Calculation
      const tip = fare * (tipPct / 100);
      const total = fare + tip;

      let usedRounding = false;
      let roundedTotal = total;
      let adjustedTip = tip;

      if (Number.isFinite(roundingStep) && roundingStep > 0) {
        roundedTotal = Math.ceil(total / roundingStep) * roundingStep;
        adjustedTip = roundedTotal - fare;
        if (adjustedTip < 0) adjustedTip = 0;
        usedRounding = true;
      }

      const finalTotal = usedRounding ? roundedTotal : total;
      const finalTip = usedRounding ? adjustedTip : tip;

      const perPersonTip = finalTip / riders;
      const perPersonTotal = finalTotal / riders;

      // Build output HTML
      let resultHtml = `
        <p><strong>Tip:</strong> ${formatNumberTwoDecimals(finalTip)}</p>
        <p><strong>Total (fare + tip):</strong> ${formatNumberTwoDecimals(finalTotal)}</p>
      `;

      if (usedRounding) {
        resultHtml += `
          <p><strong>Original total (before rounding):</strong> ${formatNumberTwoDecimals(total)}</p>
          <p><strong>Rounding applied:</strong> Rounded up to nearest ${formatNumberTwoDecimals(roundingStep)}</p>
        `;
      }

      if (riders > 1) {
        resultHtml += `
          <p><strong>Per rider tip (${riders} riders):</strong> ${formatNumberTwoDecimals(perPersonTip)}</p>
          <p><strong>Per rider total:</strong> ${formatNumberTwoDecimals(perPersonTotal)}</p>
        `;
      } else {
        resultHtml += `
          <p><strong>Split:</strong> Not applied (1 rider)</p>
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
      const message = "Uber/Taxi Tip Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
