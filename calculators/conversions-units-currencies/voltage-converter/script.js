document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const voltageValue = document.getElementById("voltageValue");
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

  // Voltage inputs can be large (kV) and benefit from grouping commas
  attachLiveFormatting(voltageValue);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) CONVERSION HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const unitToVoltsFactor = {
    mV: 0.001,
    V: 1,
    kV: 1000,
    MV: 1000000
  };

  function formatVoltageReadable(value) {
    const abs = Math.abs(value);

    // If very small or very large, show a compact significant-figures view too
    if (abs !== 0 && (abs < 0.01 || abs >= 1000000)) {
      return (
        formatNumberTwoDecimals(value) +
        " <span style=\"color:#555555\">(" +
        value.toPrecision(6) +
        ")</span>"
      );
    }

    return formatNumberTwoDecimals(value);
  }

  function convertVoltage(value, fromU, toU) {
    const fromFactor = unitToVoltsFactor[fromU];
    const toFactor = unitToVoltsFactor[toU];
    const volts = value * fromFactor;
    return volts / toFactor;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!voltageValue || !fromUnit || !toUnit) return;

      const rawValue = toNumber(voltageValue.value);
      const fromU = fromUnit.value;
      const toU = toUnit.value;

      if (!validateFinite(rawValue, "voltage value")) return;
      if (!unitToVoltsFactor[fromU] || !unitToVoltsFactor[toU]) {
        setResultError("Select valid units to convert from and to.");
        return;
      }

      const converted = convertVoltage(rawValue, fromU, toU);

      const mainLine =
        "<p><strong>Converted voltage:</strong> " +
        formatVoltageReadable(converted) +
        " " +
        toU +
        "</p>";

      const detailLine =
        "<p><strong>Input:</strong> " +
        formatVoltageReadable(rawValue) +
        " " +
        fromU +
        "</p>";

      let allUnitsBlock = "";
      const showAll = !!(showAllUnits && showAllUnits.checked);

      if (showAll) {
        const asMV = convertVoltage(rawValue, fromU, "MV");
        const asKV = convertVoltage(rawValue, fromU, "kV");
        const asV = convertVoltage(rawValue, fromU, "V");
        const asMVl = convertVoltage(rawValue, fromU, "mV");

        allUnitsBlock =
          "<p><strong>Quick reference:</strong></p>" +
          "<ul>" +
          "<li>" + formatVoltageReadable(asMVl) + " mV</li>" +
          "<li>" + formatVoltageReadable(asV) + " V</li>" +
          "<li>" + formatVoltageReadable(asKV) + " kV</li>" +
          "<li>" + formatVoltageReadable(asMV) + " MV</li>" +
          "</ul>";
      }

      const note =
        "<p style=\"color:#555555\">This tool converts units only. It does not convert RMS, peak, or peak-to-peak values.</p>";

      const resultHtml = mainLine + detailLine + allUnitsBlock + note;
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Voltage Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
