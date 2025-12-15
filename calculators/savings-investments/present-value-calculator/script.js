document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const futureValueInput = document.getElementById("futureValue");
  const annualRateInput = document.getElementById("annualRate");
  const yearsInput = document.getElementById("years");
  const compoundingSelect = document.getElementById("compounding");

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
  attachLiveFormatting(futureValueInput);

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
      const fv = toNumber(futureValueInput ? futureValueInput.value : "");
      const annualRatePct = toNumber(annualRateInput ? annualRateInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");

      // Basic existence guard
      if (!futureValueInput || !annualRateInput || !yearsInput) return;

      // Validation
      if (!validatePositive(fv, "future value")) return;
      if (!validateNonNegative(annualRatePct, "discount rate")) return;
      if (!validatePositive(years, "time period")) return;

      // Calculation logic
      const rate = annualRatePct / 100;

      let n = 1;
      const mode = compoundingSelect ? compoundingSelect.value : "annual";
      if (mode === "semiannual") n = 2;
      if (mode === "quarterly") n = 4;
      if (mode === "monthly") n = 12;
      if (mode === "daily") n = 365;

      let pv = fv;
      if (rate > 0) {
        pv = fv / Math.pow(1 + rate / n, n * years);
      }

      const discount = fv - pv;

      // Sensitivity: rate -1%, base, +1% (clamp at 0)
      const rateLow = Math.max(0, (annualRatePct - 1) / 100);
      const rateHigh = (annualRatePct + 1) / 100;

      const pvLow = rateLow === 0 ? fv : fv / Math.pow(1 + rateLow / n, n * years);
      const pvHigh = fv / Math.pow(1 + rateHigh / n, n * years);

      // Build output HTML
      const pvStr = formatNumberTwoDecimals(pv);
      const fvStr = formatNumberTwoDecimals(fv);
      const discountStr = formatNumberTwoDecimals(discount);

      const pvLowStr = formatNumberTwoDecimals(pvLow);
      const pvHighStr = formatNumberTwoDecimals(pvHigh);

      const freqLabelMap = {
        annual: "Annual",
        semiannual: "Semiannual",
        quarterly: "Quarterly",
        monthly: "Monthly",
        daily: "Daily"
      };

      const freqLabel = freqLabelMap[mode] || "Annual";

      const resultHtml = `
        <p><strong>Present value (PV):</strong> ${pvStr}</p>
        <p><strong>Future value (FV):</strong> ${fvStr}</p>
        <p><strong>Discount (FV − PV):</strong> ${discountStr}</p>
        <p><strong>Assumptions used:</strong> ${annualRatePct}% annual discount rate, ${years} years, ${freqLabel} compounding.</p>
        <hr>
        <p><strong>Sensitivity (quick check):</strong></p>
        <p>${Math.max(0, annualRatePct - 1)}% rate → PV ${pvLowStr}</p>
        <p>${annualRatePct}% rate → PV ${pvStr}</p>
        <p>${annualRatePct + 1}% rate → PV ${pvHighStr}</p>
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
      const message = "Present Value Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
