document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const intensityValue = document.getElementById("intensityValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const showAllUnits = document.getElementById("showAllUnits");

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
  attachLiveFormatting(intensityValue);

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
  function factorToCandela(unit) {
    if (unit === "mcd") return 0.001;
    if (unit === "cd") return 1;
    if (unit === "kcd") return 1000;
    if (unit === "Mcd") return 1000000;
    if (unit === "cp") return 1; // Practical convention for modern listings
    return NaN;
  }

  function unitLabel(unit) {
    if (unit === "mcd") return "mcd";
    if (unit === "cd") return "cd";
    if (unit === "kcd") return "kcd";
    if (unit === "Mcd") return "Mcd";
    if (unit === "cp") return "cp";
    return "";
  }

  function convertIntensity(value, fromU, toU) {
    const fromFactor = factorToCandela(fromU);
    const toFactor = factorToCandela(toU);
    if (!Number.isFinite(fromFactor) || !Number.isFinite(toFactor) || toFactor === 0) return NaN;

    const inCandela = value * fromFactor;
    const outValue = inCandela / toFactor;
    return outValue;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const value = toNumber(intensityValue ? intensityValue.value : "");
      const fromU = fromUnit ? fromUnit.value : "";
      const toU = toUnit ? toUnit.value : "";
      const includeAll = !!(showAllUnits && showAllUnits.checked);

      if (!intensityValue || !fromUnit || !toUnit) return;

      if (!validateNonNegative(value, "luminous intensity value")) return;

      const converted = convertIntensity(value, fromU, toU);
      if (!Number.isFinite(converted)) {
        setResultError("Select valid units to convert between.");
        return;
      }

      const primary = formatNumberTwoDecimals(converted);
      const fromDisplay = formatNumberTwoDecimals(value);

      let allUnitsHtml = "";
      if (includeAll) {
        const cdVal = convertIntensity(value, fromU, "cd");
        const mcdVal = convertIntensity(value, fromU, "mcd");
        const kcdVal = convertIntensity(value, fromU, "kcd");
        const McdVal = convertIntensity(value, fromU, "Mcd");
        const cpVal = convertIntensity(value, fromU, "cp");

        allUnitsHtml = `
          <h4 style="margin:12px 0 6px; font-size:14px;">Equivalent in all units</h4>
          <ul style="margin:0; padding-left:18px;">
            <li><strong>mcd:</strong> ${formatNumberTwoDecimals(mcdVal)}</li>
            <li><strong>cd:</strong> ${formatNumberTwoDecimals(cdVal)}</li>
            <li><strong>kcd:</strong> ${formatNumberTwoDecimals(kcdVal)}</li>
            <li><strong>Mcd:</strong> ${formatNumberTwoDecimals(McdVal)}</li>
            <li><strong>cp:</strong> ${formatNumberTwoDecimals(cpVal)}</li>
          </ul>
        `;
      }

      const resultHtml = `
        <p><strong>Converted value:</strong> ${primary} ${unitLabel(toU)}</p>
        <p><strong>Input:</strong> ${fromDisplay} ${unitLabel(fromU)}</p>
        <p style="margin-top:10px;"><strong>Scale check:</strong> ${Number(converted).toExponential(6)} ${unitLabel(toU)}</p>
        ${allUnitsHtml}
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
      const message = "Luminous Intensity Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
