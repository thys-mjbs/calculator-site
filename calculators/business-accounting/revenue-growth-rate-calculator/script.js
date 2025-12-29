document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startRevenueInput = document.getElementById("startRevenue");
  const endRevenueInput = document.getElementById("endRevenue");
  const periodLengthInput = document.getElementById("periodLength");
  const periodUnitSelect = document.getElementById("periodUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(startRevenueInput);
  attachLiveFormatting(endRevenueInput);
  attachLiveFormatting(periodLengthInput);

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
      const startRevenue = toNumber(startRevenueInput ? startRevenueInput.value : "");
      const endRevenue = toNumber(endRevenueInput ? endRevenueInput.value : "");
      const periodLengthRaw = toNumber(periodLengthInput ? periodLengthInput.value : "");
      const periodUnit = periodUnitSelect ? periodUnitSelect.value : "months";

      // Basic existence guard
      if (!startRevenueInput || !endRevenueInput || !periodLengthInput || !periodUnitSelect) return;

      // Validation
      if (!validatePositive(startRevenue, "starting revenue")) return;
      if (!validateNonNegative(endRevenue, "ending revenue")) return;
      if (!validatePositive(periodLengthRaw, "time between periods")) return;

      // Convert time to years for annualized growth
      let periodYears = 0;
      if (periodUnit === "years") {
        periodYears = periodLengthRaw;
      } else {
        periodYears = periodLengthRaw / 12;
      }

      if (!Number.isFinite(periodYears) || periodYears <= 0) {
        setResultError("Enter a valid time between periods greater than 0.");
        return;
      }

      // Calculation logic
      const absoluteChange = endRevenue - startRevenue;
      const totalGrowthRate = (absoluteChange / startRevenue) * 100;

      // CAGR: (End/Start)^(1/Years) - 1
      // If endRevenue is 0, CAGR is -100% (over any positive period) in this simplified model.
      let cagrPercent = null;
      if (endRevenue === 0) {
        cagrPercent = -100;
      } else {
        const ratio = endRevenue / startRevenue;
        if (ratio <= 0) {
          setResultError("Ending revenue must be greater than 0 to calculate an annualized growth rate (CAGR).");
          return;
        }
        const cagr = Math.pow(ratio, 1 / periodYears) - 1;
        cagrPercent = cagr * 100;
      }

      const directionLabel = absoluteChange >= 0 ? "Increase" : "Decrease";
      const absChangeMagnitude = Math.abs(absoluteChange);

      const startFormatted = formatNumberTwoDecimals(startRevenue);
      const endFormatted = formatNumberTwoDecimals(endRevenue);
      const absChangeFormatted = formatNumberTwoDecimals(absChangeMagnitude);

      const totalGrowthFormatted = totalGrowthRate.toFixed(2);
      const cagrFormatted = cagrPercent.toFixed(2);

      const timeLabel = periodUnit === "years" ? "years" : "months";

      // Build output HTML
      const resultHtml = `
        <p><strong>Total growth:</strong> ${totalGrowthFormatted}%</p>
        <p><strong>${directionLabel} in revenue:</strong> ${absChangeFormatted}</p>
        <p><strong>Annualized growth (CAGR):</strong> ${cagrFormatted}% per year</p>
        <hr />
        <p><strong>Start revenue:</strong> ${startFormatted}</p>
        <p><strong>End revenue:</strong> ${endFormatted}</p>
        <p><strong>Time between periods:</strong> ${periodLengthRaw} ${timeLabel}</p>
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
      const message = "Revenue Growth Rate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
