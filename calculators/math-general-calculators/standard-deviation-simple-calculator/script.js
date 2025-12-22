document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const valuesInput = document.getElementById("valuesInput");
  const sdType = document.getElementById("sdType");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Not used: this calculator accepts pasted lists, so we avoid live comma formatting.

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
    // Not used
    clearResult();
  }

  // Not used

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

  function parseValues(raw) {
    const text = (raw || "").trim();
    if (!text) return [];

    // Split on commas OR whitespace. This supports:
    // - comma-separated: 1,2,3
    // - space-separated: 1 2 3
    // - new lines: column paste
    const parts = text.split(/[\s,]+/).filter(Boolean);

    const nums = [];
    for (let i = 0; i < parts.length; i++) {
      const n = toNumber(parts[i]);
      if (Number.isFinite(n)) nums.push(n);
      else return null; // hard fail on any non-numeric token
    }
    return nums;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read mode (not used)
      // Parse inputs using toNumber() (from /scripts/main.js)
      if (!valuesInput || !sdType) return;

      const values = parseValues(valuesInput.value);
      if (values === null) {
        setResultError("Your list contains something that is not a number. Remove any letters, symbols, or stray characters and try again.");
        return;
      }

      if (!values || values.length < 2) {
        setResultError("Enter at least 2 valid numbers to calculate standard deviation.");
        return;
      }

      const type = sdType.value === "population" ? "population" : "sample";
      const n = values.length;

      // Mean
      let sum = 0;
      for (let i = 0; i < n; i++) sum += values[i];
      const mean = sum / n;

      // Sum of squared deviations
      let ssd = 0;
      for (let i = 0; i < n; i++) {
        const diff = values[i] - mean;
        ssd += diff * diff;
      }

      // Variance + SD
      const denom = type === "sample" ? (n - 1) : n;
      if (denom <= 0) {
        setResultError("Enter at least 2 numbers for sample standard deviation.");
        return;
      }

      const variance = ssd / denom;
      const sd = Math.sqrt(variance);

      // Min, max, range
      let min = values[0];
      let max = values[0];
      for (let i = 1; i < n; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
      }
      const range = max - min;

      // CV%
      let cvHtml = "";
      if (mean !== 0) {
        const cv = (sd / Math.abs(mean)) * 100;
        if (Number.isFinite(cv)) {
          cvHtml = `
            <div class="result-row">
              <span>Coefficient of variation (CV%)</span>
              <strong>${formatNumberTwoDecimals(cv)}%</strong>
            </div>
          `;
        }
      }

      const typeLabel = type === "sample" ? "Sample (n − 1)" : "Population (n)";

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span>Standard deviation</span>
            <strong>${formatNumberTwoDecimals(sd)}</strong>
          </div>
          <div class="result-row">
            <span>Variance</span>
            <strong>${formatNumberTwoDecimals(variance)}</strong>
          </div>
          <div class="result-row">
            <span>Mean (average)</span>
            <strong>${formatNumberTwoDecimals(mean)}</strong>
          </div>
          <div class="result-row">
            <span>Count (n)</span>
            <strong>${n}</strong>
          </div>
          <div class="result-row">
            <span>Minimum</span>
            <strong>${formatNumberTwoDecimals(min)}</strong>
          </div>
          <div class="result-row">
            <span>Maximum</span>
            <strong>${formatNumberTwoDecimals(max)}</strong>
          </div>
          <div class="result-row">
            <span>Range (max − min)</span>
            <strong>${formatNumberTwoDecimals(range)}</strong>
          </div>
          ${cvHtml}
        </div>
        <p class="result-note"><strong>Type used:</strong> ${typeLabel}. Standard deviation shows typical distance from the mean in the same unit as your values.</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Standard Deviation (Simple) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
