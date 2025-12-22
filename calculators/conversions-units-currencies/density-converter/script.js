document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const densityValue = document.getElementById("densityValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const decimals = document.getElementById("decimals");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Density inputs often include commas for readability
  attachLiveFormatting(densityValue);

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
  // Local formatting (non-currency)
  // ------------------------------------------------------------
  function formatNumber(value, dp) {
    if (!Number.isFinite(value)) return "";
    const safeDp = Number.isFinite(dp) ? Math.min(6, Math.max(0, Math.floor(dp))) : 4;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: safeDp,
      maximumFractionDigits: safeDp
    });
  }

  function getUnitLabel(code) {
    const map = {
      kg_m3: "kg/m³",
      g_cm3: "g/cm³",
      g_ml: "g/mL",
      kg_l: "kg/L",
      lb_ft3: "lb/ft³",
      lb_in3: "lb/in³"
    };
    return map[code] || code;
  }

  // Convert any supported unit to kg/m³ (base), then back out
  function toKgPerM3(value, unitCode) {
    if (!Number.isFinite(value)) return NaN;

    switch (unitCode) {
      case "kg_m3":
        return value;

      case "g_cm3":
        return value * 1000;

      case "g_ml":
        return value * 1000;

      case "kg_l":
        return value * 1000;

      case "lb_ft3":
        // 1 lb/ft³ = 16.018463 kg/m³
        return value * 16.018463;

      case "lb_in3":
        // 1 lb/in³ = 27679.904710 kg/m³
        return value * 27679.904710;

      default:
        return NaN;
    }
  }

  function fromKgPerM3(valueKgM3, unitCode) {
    if (!Number.isFinite(valueKgM3)) return NaN;

    switch (unitCode) {
      case "kg_m3":
        return valueKgM3;

      case "g_cm3":
        return valueKgM3 / 1000;

      case "g_ml":
        return valueKgM3 / 1000;

      case "kg_l":
        return valueKgM3 / 1000;

      case "lb_ft3":
        return valueKgM3 / 16.018463;

      case "lb_in3":
        return valueKgM3 / 27679.904710;

      default:
        return NaN;
    }
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const inputDensity = toNumber(densityValue ? densityValue.value : "");
      const fromCode = fromUnit ? fromUnit.value : "";
      const toCode = toUnit ? toUnit.value : "";
      const dp = toNumber(decimals ? decimals.value : "4");

      // Basic existence guard
      if (!densityValue || !fromUnit || !toUnit) return;

      // Validation
      if (!validatePositive(inputDensity, "density value")) return;

      if (!fromCode || !toCode) {
        setResultError("Select both a From unit and a To unit.");
        return;
      }

      // Calculation
      const baseKgM3 = toKgPerM3(inputDensity, fromCode);
      if (!Number.isFinite(baseKgM3) || baseKgM3 <= 0) {
        setResultError("That density and unit combination could not be converted. Check your unit selection and try again.");
        return;
      }

      const converted = fromKgPerM3(baseKgM3, toCode);
      if (!Number.isFinite(converted) || converted <= 0) {
        setResultError("Conversion failed for the selected To unit. Try a different unit.");
        return;
      }

      const safeDp = Number.isFinite(dp) ? Math.min(6, Math.max(0, Math.floor(dp))) : 4;

      // Build output HTML
      const fromLabel = getUnitLabel(fromCode);
      const toLabel = getUnitLabel(toCode);

      const allUnits = ["kg_m3", "g_cm3", "g_ml", "kg_l", "lb_ft3", "lb_in3"];
      const rows = allUnits
        .map(function (code) {
          const val = fromKgPerM3(baseKgM3, code);
          return {
            code: code,
            label: getUnitLabel(code),
            value: val
          };
        })
        .filter(function (r) {
          return Number.isFinite(r.value) && r.value > 0;
        });

      const referenceLines = rows
        .map(function (r) {
          const isTarget = r.code === toCode;
          const strongOpen = isTarget ? "<strong>" : "";
          const strongClose = isTarget ? "</strong>" : "";
          return (
            "<li>" +
            strongOpen +
            formatNumber(r.value, safeDp) +
            " " +
            r.label +
            strongClose +
            "</li>"
          );
        })
        .join("");

      const resultHtml =
        "<p><strong>Converted density:</strong> " +
        formatNumber(converted, safeDp) +
        " " +
        toLabel +
        "</p>" +
        "<p><strong>Input:</strong> " +
        formatNumber(inputDensity, safeDp) +
        " " +
        fromLabel +
        "</p>" +
        "<p><strong>Quick reference (same density in other units):</strong></p>" +
        "<ul>" +
        referenceLines +
        "</ul>" +
        "<p><strong>Tip:</strong> If you are copying into a spec sheet or spreadsheet, increase decimal places to reduce rounding loss.</p>";

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
      const message = "Density Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
