document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const capValue = document.getElementById("capValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Capacitance values may include decimals, but comma formatting still helps for large pF counts
  attachLiveFormatting(capValue);

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
  // 6) CALCULATOR HELPERS (SPECIFIC)
  // ------------------------------------------------------------
  const unitToFarads = {
    F: 1,
    mF: 1e-3,
    uF: 1e-6,
    nF: 1e-9,
    pF: 1e-12
  };

  function unitLabel(unit) {
    if (unit === "uF") return "µF";
    return unit;
  }

  function formatCapacitanceNumber(value) {
    if (!Number.isFinite(value)) return "0";
    const abs = Math.abs(value);

    if (abs !== 0 && (abs < 0.01 || abs >= 1000000)) {
      return value.toExponential(6);
    }

    return formatNumberTwoDecimals(value);
  }

  function toFarads(value, unit) {
    return value * (unitToFarads[unit] || 1);
  }

  function fromFarads(faradsValue, unit) {
    return faradsValue / (unitToFarads[unit] || 1);
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const rawValue = toNumber(capValue ? capValue.value : "");
      const from = fromUnit ? fromUnit.value : "uF";
      const to = toUnit ? toUnit.value : "nF";

      // Basic existence guard
      if (!capValue || !fromUnit || !toUnit) return;

      // Validation
      if (!validatePositive(rawValue, "capacitance value")) return;

      if (!unitToFarads[from] || !unitToFarads[to]) {
        setResultError("Select valid units to convert between.");
        return;
      }

      // Calculation logic
      const farads = toFarads(rawValue, from);
      const converted = fromFarads(farads, to);

      // Breakdown in all units
      const inF = fromFarads(farads, "F");
      const inmF = fromFarads(farads, "mF");
      const inuF = fromFarads(farads, "uF");
      const innF = fromFarads(farads, "nF");
      const inpF = fromFarads(farads, "pF");

      // Build output HTML
      const primary = `
        <p><strong>Converted value:</strong> ${formatCapacitanceNumber(converted)} ${unitLabel(to)}</p>
        <p><strong>Input:</strong> ${formatCapacitanceNumber(rawValue)} ${unitLabel(from)}</p>
      `;

      const table = `
        <table class="result-table" aria-label="Capacitance value shown in common units">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Equivalent value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>F</td><td>${formatCapacitanceNumber(inF)} F</td></tr>
            <tr><td>mF</td><td>${formatCapacitanceNumber(inmF)} mF</td></tr>
            <tr><td>µF</td><td>${formatCapacitanceNumber(inuF)} µF</td></tr>
            <tr><td>nF</td><td>${formatCapacitanceNumber(innF)} nF</td></tr>
            <tr><td>pF</td><td>${formatCapacitanceNumber(inpF)} pF</td></tr>
          </tbody>
        </table>
      `;

      const note = `
        <p><strong>Quick check:</strong> If your number looks unexpectedly huge or tiny, re-check whether you meant mF vs µF, or nF vs pF.</p>
      `;

      const resultHtml = primary + table + note;

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
      const message = "Capacitance Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
