document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const tempValueInput = document.getElementById("tempValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");
  const swapUnitsButton = document.getElementById("swapUnitsButton");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Temperature values can be negative and often include decimals.
  // Avoid comma-formatting to reduce formatting surprises.

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
  function validateFiniteNumber(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function absoluteZeroFor(unit) {
    if (unit === "C") return -273.15;
    if (unit === "F") return -459.67;
    if (unit === "K") return 0;
    if (unit === "R") return 0;
    return null;
  }

  function isBelowAbsoluteZero(value, unit) {
    const az = absoluteZeroFor(unit);
    if (!Number.isFinite(az)) return false;
    return value < az - 1e-9;
  }

  function toKelvin(value, unit) {
    if (unit === "C") return value + 273.15;
    if (unit === "F") return (value + 459.67) * (5 / 9);
    if (unit === "K") return value;
    if (unit === "R") return value * (5 / 9);
    return NaN;
  }

  function fromKelvin(kelvin, unit) {
    if (unit === "C") return kelvin - 273.15;
    if (unit === "F") return kelvin * (9 / 5) - 459.67;
    if (unit === "K") return kelvin;
    if (unit === "R") return kelvin * (9 / 5);
    return NaN;
  }

  function unitLabel(unit) {
    if (unit === "C") return "°C";
    if (unit === "F") return "°F";
    if (unit === "K") return "K";
    if (unit === "R") return "°R";
    return "";
  }

  function near(value, target, tolerance) {
    return Math.abs(value - target) <= tolerance;
  }

  function buildReferenceNote(celsiusValue) {
    if (!Number.isFinite(celsiusValue)) return "";
    const tol = 0.5;

    if (near(celsiusValue, 0, tol)) {
      return "This is approximately the freezing point of water (0°C).";
    }
    if (near(celsiusValue, 100, tol)) {
      return "This is approximately the boiling point of water at sea level (100°C).";
    }
    if (celsiusValue < 0) {
      return "Below 0°C, water can freeze (depending on conditions).";
    }
    if (celsiusValue > 0 && celsiusValue < 100) {
      return "Between 0°C and 100°C, water is typically liquid (at standard pressure).";
    }
    if (celsiusValue >= 100) {
      return "At or above 100°C, water can boil (depending on pressure).";
    }
    return "";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const inputValue = toNumber(tempValueInput ? tempValueInput.value : "");
      const fromUnit = fromUnitSelect ? fromUnitSelect.value : "";
      const toUnit = toUnitSelect ? toUnitSelect.value : "";

      // Basic existence guard
      if (!tempValueInput || !fromUnitSelect || !toUnitSelect) return;

      // Validation
      if (!validateFiniteNumber(inputValue, "temperature value")) return;
      if (!fromUnit || !toUnit) {
        setResultError("Select both the 'From' and 'To' units.");
        return;
      }
      if (isBelowAbsoluteZero(inputValue, fromUnit)) {
        const az = absoluteZeroFor(fromUnit);
        setResultError(
          "That temperature is below absolute zero for " +
            unitLabel(fromUnit) +
            " (minimum is " +
            formatNumberTwoDecimals(az) +
            " " +
            unitLabel(fromUnit) +
            ")."
        );
        return;
      }

      // Calculation logic
      const kelvin = toKelvin(inputValue, fromUnit);
      const converted = fromKelvin(kelvin, toUnit);

      if (!Number.isFinite(kelvin) || !Number.isFinite(converted)) {
        setResultError("Unable to convert. Check your input and unit selections.");
        return;
      }

      // Secondary breakdown: show all supported scales
      const cVal = fromKelvin(kelvin, "C");
      const fVal = fromKelvin(kelvin, "F");
      const kVal = fromKelvin(kelvin, "K");
      const rVal = fromKelvin(kelvin, "R");

      const mainLine =
        "<p><strong>Converted:</strong> " +
        formatNumberTwoDecimals(inputValue) +
        " " +
        unitLabel(fromUnit) +
        " = " +
        formatNumberTwoDecimals(converted) +
        " " +
        unitLabel(toUnit) +
        "</p>";

      const breakdown =
        "<p><strong>All scales:</strong></p>" +
        "<p>• Celsius: " +
        formatNumberTwoDecimals(cVal) +
        " °C</p>" +
        "<p>• Fahrenheit: " +
        formatNumberTwoDecimals(fVal) +
        " °F</p>" +
        "<p>• Kelvin: " +
        formatNumberTwoDecimals(kVal) +
        " K</p>" +
        "<p>• Rankine: " +
        formatNumberTwoDecimals(rVal) +
        " °R</p>";

      const refNoteText = buildReferenceNote(cVal);
      const refNote = refNoteText
        ? "<p><strong>Quick context:</strong> " + refNoteText + "</p>"
        : "";

      const resultHtml = mainLine + refNote + breakdown;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // Swap helper (optional UX)
  if (swapUnitsButton && fromUnitSelect && toUnitSelect) {
    swapUnitsButton.addEventListener("click", function () {
      const a = fromUnitSelect.value;
      fromUnitSelect.value = toUnitSelect.value;
      toUnitSelect.value = a;
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Temperature Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
