document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentValueInput = document.getElementById("currentValue");
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

  // Add every input that should live-format with commas
  attachLiveFormatting(currentValueInput);

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
  // 4) OPTIONAL MODE HANDLING (NOT USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    clearResult();
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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function unitLabel(unit) {
    if (unit === "uA") return "µA";
    return unit;
  }

  function factorToAmps(unit) {
    // Returns multiplier to convert from the given unit to amps.
    // value_in_amps = value * factorToAmps(unit)
    switch (unit) {
      case "A":
        return 1;
      case "mA":
        return 1e-3;
      case "uA":
        return 1e-6;
      case "nA":
        return 1e-9;
      case "kA":
        return 1e3;
      default:
        return NaN;
    }
  }

  function formatSmart(value) {
    // Keep outputs readable: show up to 2 decimals, but avoid "0.00" for tiny values.
    if (!Number.isFinite(value)) return "";
    const abs = Math.abs(value);

    if (abs === 0) return "0";
    if (abs >= 1) return formatNumberTwoDecimals(value);

    // For small values, use more precision without scientific notation if possible.
    // Cap at 8 decimals to keep it readable.
    const s = value.toFixed(8);
    return s.replace(/\.?0+$/, "");
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Existence guard
      if (!currentValueInput || !fromUnitSelect || !toUnitSelect) return;

      const rawValue = toNumber(currentValueInput.value);
      const fromUnit = fromUnitSelect.value;
      const toUnit = toUnitSelect.value;

      if (!Number.isFinite(rawValue)) {
        setResultError("Enter a valid current value.");
        return;
      }

      if (!validateNonNegative(rawValue, "current value")) return;

      const fromFactor = factorToAmps(fromUnit);
      const toFactor = factorToAmps(toUnit);

      if (!Number.isFinite(fromFactor) || !Number.isFinite(toFactor)) {
        setResultError("Select valid units to convert.");
        return;
      }

      // Convert to amps, then to target
      const amps = rawValue * fromFactor;
      const targetValue = amps / toFactor;

      // Multi-unit reference
      const units = ["A", "mA", "uA", "nA", "kA"];
      const allRows = units
        .map(function (u) {
          const v = amps / factorToAmps(u);
          return "<li><strong>" + unitLabel(u) + ":</strong> " + formatSmart(v) + "</li>";
        })
        .join("");

      const resultHtml =
        "<p><strong>Converted current:</strong> " +
        formatSmart(targetValue) +
        " " +
        unitLabel(toUnit) +
        "</p>" +
        "<p><strong>Reference (same current in other units):</strong></p>" +
        "<ul>" +
        allRows +
        "</ul>" +
        "<p><strong>Base value:</strong> " +
        formatSmart(amps) +
        " A</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Electric Current Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
