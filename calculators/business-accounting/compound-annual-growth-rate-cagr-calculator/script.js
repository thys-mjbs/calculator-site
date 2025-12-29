/* :contentReference[oaicite:2]{index=2} */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startValueInput = document.getElementById("startValue");
  const endValueInput = document.getElementById("endValue");
  const yearsInput = document.getElementById("years");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

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
  attachLiveFormatting(startValueInput);
  attachLiveFormatting(endValueInput);
  attachLiveFormatting(yearsInput);

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

  // ------------------------------------------------------------
  // 6) DATE HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function parseIsoDate(dateStr) {
    if (!dateStr) return null;
    const trimmed = String(dateStr).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (!Number.isFinite(dt.getTime())) return null;

    // Validate round-trip to catch invalid dates like 2025-02-30
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== mo - 1 ||
      dt.getUTCDate() !== d
    ) {
      return null;
    }

    return dt;
  }

  function yearsBetweenDates(startDt, endDt) {
    const ms = endDt.getTime() - startDt.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    const days = ms / (1000 * 60 * 60 * 24);
    return days / 365.25;
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const startValue = toNumber(startValueInput ? startValueInput.value : "");
      const endValue = toNumber(endValueInput ? endValueInput.value : "");
      const yearsRaw = toNumber(yearsInput ? yearsInput.value : "");

      if (!startValueInput || !endValueInput || !yearsInput) return;

      // Validate base required inputs
      if (!validatePositive(startValue, "starting value")) return;
      if (!validatePositive(endValue, "ending value")) return;

      // Determine years used (dates override years field when both dates are valid)
      let yearsUsed = yearsRaw;
      let yearsSource = "Years field";

      const startDt = parseIsoDate(startDateInput ? startDateInput.value : "");
      const endDt = parseIsoDate(endDateInput ? endDateInput.value : "");

      if (startDt && endDt) {
        const y = yearsBetweenDates(startDt, endDt);
        if (!y) {
          setResultError("Enter an end date that is after the start date.");
          return;
        }
        yearsUsed = y;
        yearsSource = "Dates (exact)";
      } else if ((startDateInput && startDateInput.value) || (endDateInput && endDateInput.value)) {
        setResultError("To use dates, enter both a valid start date and end date in YYYY-MM-DD format.");
        return;
      }

      if (!validatePositive(yearsUsed, "time period (years)")) return;

      // Calculation logic (standard CAGR)
      const ratio = endValue / startValue;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Check your values. Starting value and ending value must both be greater than 0.");
        return;
      }

      const cagr = Math.pow(ratio, 1 / yearsUsed) - 1;
      const totalGrowth = ratio - 1;
      const annualFactor = 1 + cagr;
      const linearAvgChangePerYear = (endValue - startValue) / yearsUsed;

      // Build output HTML
      const cagrPct = formatNumberTwoDecimals(cagr * 100);
      const totalGrowthPct = formatNumberTwoDecimals(totalGrowth * 100);
      const annualFactorFmt = formatNumberTwoDecimals(annualFactor);
      const yearsUsedFmt = formatNumberTwoDecimals(yearsUsed);

      const startFmt = formatNumberTwoDecimals(startValue);
      const endFmt = formatNumberTwoDecimals(endValue);
      const linearFmt = formatNumberTwoDecimals(linearAvgChangePerYear);

      const trendWord = cagr >= 0 ? "growth" : "decline";
      const resultHtml = `
        <p><strong>CAGR:</strong> ${cagrPct}% per year (${trendWord})</p>
        <p><strong>Total change:</strong> ${totalGrowthPct}% over the period</p>
        <p><strong>Annual growth factor:</strong> ${annualFactorFmt}× per year</p>
        <hr>
        <p><strong>Inputs used:</strong></p>
        <p>Starting value: ${startFmt}</p>
        <p>Ending value: ${endFmt}</p>
        <p>Time period: ${yearsUsedFmt} years (${yearsSource})</p>
        <p><strong>Secondary insight:</strong> Average change per year (linear): ${linearFmt}</p>
      `;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Compound Annual Growth Rate (CAGR) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
