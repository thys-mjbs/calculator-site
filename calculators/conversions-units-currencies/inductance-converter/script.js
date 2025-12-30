document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const inductanceValueInput = document.getElementById("inductanceValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(inductanceValueInput);

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
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // CALCULATOR-SPECIFIC HELPERS
  // ------------------------------------------------------------
  const unitMeta = {
    H: { label: "H", name: "henry", multiplierToH: 1 },
    mH: { label: "mH", name: "millihenry", multiplierToH: 1e-3 },
    uH: { label: "µH", name: "microhenry", multiplierToH: 1e-6 },
    nH: { label: "nH", name: "nanohenry", multiplierToH: 1e-9 },
    pH: { label: "pH", name: "picohenry", multiplierToH: 1e-12 }
  };

  function formatSmartNumber(x) {
    if (!Number.isFinite(x)) return "—";
    if (x === 0) return "0";

    const abs = Math.abs(x);

    // Scientific for very small or very large
    if (abs >= 1e6 || abs < 1e-3) {
      return x.toExponential(6);
    }

    // Normal formatting with up to 6 decimals, trimmed
    const s = x.toFixed(6);
    return s.replace(/\.?0+$/, "");
  }

  function unitLabel(unitKey) {
    return unitMeta[unitKey] ? unitMeta[unitKey].label : unitKey;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (!inductanceValueInput || !fromUnitSelect || !toUnitSelect) return;

      const rawValue = toNumber(inductanceValueInput.value);
      const fromUnit = fromUnitSelect.value;
      const toUnit = toUnitSelect.value;

      clearResult();

      if (!validateNonNegative(rawValue, "inductance value")) return;
      if (!unitMeta[fromUnit] || !unitMeta[toUnit]) {
        setResultError("Select valid units to convert between.");
        return;
      }

      const valueInH = rawValue * unitMeta[fromUnit].multiplierToH;
      const converted = valueInH / unitMeta[toUnit].multiplierToH;

      const allConversions = ["H", "mH", "uH", "nH", "pH"].map(function (u) {
        const v = valueInH / unitMeta[u].multiplierToH;
        return `<li><strong>${unitLabel(u)}:</strong> ${formatSmartNumber(v)}</li>`;
      }).join("");

      const resultHtml = `
        <div class="result-main">
          <p><strong>Converted value:</strong> ${formatSmartNumber(converted)} ${unitLabel(toUnit)}</p>
          <p><strong>Base value:</strong> ${formatSmartNumber(valueInH)} H</p>
          <p><strong>Quick reference (same inductance in all units):</strong></p>
          <ul>
            ${allConversions}
          </ul>
        </div>
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
      const message = "Inductance Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
