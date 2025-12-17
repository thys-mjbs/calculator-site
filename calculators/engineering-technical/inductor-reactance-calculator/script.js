document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const frequencyHzInput = document.getElementById("frequencyHz");
  const inductanceValueInput = document.getElementById("inductanceValue");
  const inductanceUnitSelect = document.getElementById("inductanceUnit");
  const compareFrequencyHzInput = document.getElementById("compareFrequencyHz");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(frequencyHzInput);
  attachLiveFormatting(inductanceValueInput);
  attachLiveFormatting(compareFrequencyHzInput);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function unitToHenries(value, unit) {
    if (!Number.isFinite(value)) return NaN;
    if (unit === "H") return value;
    if (unit === "mH") return value / 1000;
    if (unit === "uH") return value / 1000000;
    return NaN;
  }

  function safeTwoDecimals(value) {
    if (!Number.isFinite(value)) return "0.00";
    return formatNumberTwoDecimals(value);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const fHz = toNumber(frequencyHzInput ? frequencyHzInput.value : "");
      const lValue = toNumber(inductanceValueInput ? inductanceValueInput.value : "");
      const compareFHz = toNumber(compareFrequencyHzInput ? compareFrequencyHzInput.value : "");
      const unit = inductanceUnitSelect ? inductanceUnitSelect.value : "H";

      // Basic existence guard
      if (!frequencyHzInput || !inductanceValueInput || !inductanceUnitSelect) return;

      // Validation (required inputs)
      if (!validatePositive(fHz, "frequency (Hz)")) return;
      if (!validatePositive(lValue, "inductance")) return;

      const lHenries = unitToHenries(lValue, unit);
      if (!validatePositive(lHenries, "inductance")) {
        setResultError("Choose a valid inductance unit.");
        return;
      }

      // Calculation logic
      const twoPi = 2 * Math.PI;
      const omega = twoPi * fHz;
      const xL = omega * lHenries;

      // Optional comparison (no penalty if missing)
      const compareProvided = Number.isFinite(compareFHz) && compareFHz > 0;
      let xL2 = null;
      let omega2 = null;
      let ratio = null;

      if (compareProvided) {
        omega2 = twoPi * compareFHz;
        xL2 = omega2 * lHenries;
        if (Number.isFinite(xL) && xL > 0) {
          ratio = xL2 / xL;
        }
      }

      // Build output HTML
      let resultHtml = "";
      resultHtml += `<p><strong>Inductive reactance (XL):</strong> ${safeTwoDecimals(xL)} Ω</p>`;
      resultHtml += `<p><strong>At frequency:</strong> ${safeTwoDecimals(fHz)} Hz</p>`;
      resultHtml += `<p><strong>Inductance:</strong> ${safeTwoDecimals(lHenries)} H</p>`;
      resultHtml += `<p><strong>Angular frequency (ω):</strong> ${safeTwoDecimals(omega)} rad/s</p>`;
      resultHtml += `<p><strong>Formula used:</strong> XL = 2πfL</p>`;

      if (compareProvided) {
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Comparison at:</strong> ${safeTwoDecimals(compareFHz)} Hz</p>`;
        resultHtml += `<p><strong>XL at ${safeTwoDecimals(compareFHz)} Hz:</strong> ${safeTwoDecimals(xL2)} Ω</p>`;
        resultHtml += `<p><strong>ω at ${safeTwoDecimals(compareFHz)} Hz:</strong> ${safeTwoDecimals(omega2)} rad/s</p>`;
        if (Number.isFinite(ratio) && ratio > 0) {
          resultHtml += `<p><strong>Change factor:</strong> ${safeTwoDecimals(ratio)}× (reactance scales linearly with frequency)</p>`;
        }
      } else {
        resultHtml += `<p><em>Tip:</em> Add a second frequency to compare how XL changes.</p>`;
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
      const message = "Inductor Reactance Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
