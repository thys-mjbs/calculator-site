document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const powerValueInput = document.getElementById("powerValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // [OPTIONAL_MODE_BINDINGS_BLOCK]

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
  attachLiveFormatting(powerValueInput);

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
    // [SHOW_MODE_BLOCK]
    clearResult();
  }

  // [MODE_INIT_BLOCK]

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
  function wattsFrom(value, unit) {
    switch (unit) {
      case "W":
        return value;
      case "kW":
        return value * 1000;
      case "MW":
        return value * 1000000;
      case "hp":
        return value * 745.6998715822702; // mechanical horsepower
      case "ps":
        return value * 735.49875; // metric horsepower (PS)
      case "btuhr":
        return value * 0.29307107; // 1 BTU/hr to W
      case "kbtuhr":
        return value * 1000 * 0.29307107; // 1 kBTU/hr to W
      default:
        return NaN;
    }
  }

  function fromWatts(watts, unit) {
    switch (unit) {
      case "W":
        return watts;
      case "kW":
        return watts / 1000;
      case "MW":
        return watts / 1000000;
      case "hp":
        return watts / 745.6998715822702;
      case "ps":
        return watts / 735.49875;
      case "btuhr":
        return watts / 0.29307107;
      case "kbtuhr":
        return watts / (1000 * 0.29307107);
      default:
        return NaN;
    }
  }

  function unitLabel(unit) {
    switch (unit) {
      case "W":
        return "Watts (W)";
      case "kW":
        return "Kilowatts (kW)";
      case "MW":
        return "Megawatts (MW)";
      case "hp":
        return "Horsepower (hp)";
      case "ps":
        return "Metric horsepower (PS)";
      case "btuhr":
        return "BTU per hour (BTU/hr)";
      case "kbtuhr":
        return "kBTU per hour (kBTU/hr)";
      default:
        return unit;
    }
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // [READ_MODE_BLOCK]

      // Parse inputs using toNumber() (from /scripts/main.js)
      const inputValue = toNumber(powerValueInput ? powerValueInput.value : "");
      const fromUnit = fromUnitSelect ? fromUnitSelect.value : "";
      const toUnit = toUnitSelect ? toUnitSelect.value : "";

      // Basic existence guard (optional but recommended)
      if (!powerValueInput || !fromUnitSelect || !toUnitSelect) return;

      // Validation
      if (!validateNonNegative(inputValue, "power value")) return;
      if (!fromUnit || !toUnit) {
        setResultError("Select both the starting unit and the target unit.");
        return;
      }

      // Calculation logic
      const watts = wattsFrom(inputValue, fromUnit);
      if (!Number.isFinite(watts)) {
        setResultError("Enter a valid power value and units to convert.");
        return;
      }

      const converted = fromWatts(watts, toUnit);
      if (!Number.isFinite(converted)) {
        setResultError("Enter a valid power value and units to convert.");
        return;
      }

      const w = fromWatts(watts, "W");
      const kw = fromWatts(watts, "kW");
      const mw = fromWatts(watts, "MW");
      const hp = fromWatts(watts, "hp");
      const ps = fromWatts(watts, "ps");
      const btuhr = fromWatts(watts, "btuhr");
      const kbtuhr = fromWatts(watts, "kbtuhr");

      const inputPretty = formatNumberTwoDecimals(inputValue);
      const convertedPretty = formatNumberTwoDecimals(converted);

      // Build output HTML
      const resultHtml = `
        <p><strong>Converted:</strong> ${inputPretty} ${unitLabel(fromUnit)} = ${convertedPretty} ${unitLabel(toUnit)}</p>
        <p><strong>Quick reference (same power):</strong></p>
        <ul>
          <li>${formatNumberTwoDecimals(w)} Watts (W)</li>
          <li>${formatNumberTwoDecimals(kw)} Kilowatts (kW)</li>
          <li>${formatNumberTwoDecimals(mw)} Megawatts (MW)</li>
          <li>${formatNumberTwoDecimals(hp)} Horsepower (hp)</li>
          <li>${formatNumberTwoDecimals(ps)} Metric horsepower (PS)</li>
          <li>${formatNumberTwoDecimals(btuhr)} BTU per hour (BTU/hr)</li>
          <li>${formatNumberTwoDecimals(kbtuhr)} kBTU per hour (kBTU/hr)</li>
        </ul>
        <p><strong>Practical note:</strong> This is a unit conversion only. If you are comparing device ratings, confirm whether the rating is continuous vs peak and input vs output.</p>
      `;

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
      const message = "Power Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
