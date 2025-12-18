document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const speedValue = document.getElementById("speedValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Speed can be entered as a plain number, but commas help readability for large values.
  attachLiveFormatting(speedValue);

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

  // (no modes)
  

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
  function unitLabel(unit) {
    if (unit === "kmh") return "km/h";
    if (unit === "mph") return "mph";
    if (unit === "ms") return "m/s";
    if (unit === "fts") return "ft/s";
    if (unit === "knot") return "kn";
    return "";
  }

  // Convert from unit to meters per second (m/s)
  function toMetersPerSecond(value, unit) {
    if (unit === "ms") return value;
    if (unit === "kmh") return value / 3.6;
    if (unit === "mph") return value * 0.44704;
    if (unit === "fts") return value * 0.3048;
    if (unit === "knot") return value * 0.514444;
    return NaN;
  }

  // Convert from meters per second (m/s) to unit
  function fromMetersPerSecond(msValue, unit) {
    if (unit === "ms") return msValue;
    if (unit === "kmh") return msValue * 3.6;
    if (unit === "mph") return msValue / 0.44704;
    if (unit === "fts") return msValue / 0.3048;
    if (unit === "knot") return msValue / 0.514444;
    return NaN;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const value = toNumber(speedValue ? speedValue.value : "");
      const from = fromUnit ? fromUnit.value : "";
      const to = toUnit ? toUnit.value : "";

      // Basic existence guard
      if (!speedValue || !fromUnit || !toUnit) return;

      // Validation
      if (!validateNonNegative(value, "speed value")) return;

      // Calculation logic
      const ms = toMetersPerSecond(value, from);
      if (!Number.isFinite(ms)) {
        setResultError("Choose a valid 'from' unit.");
        return;
      }

      const converted = fromMetersPerSecond(ms, to);
      if (!Number.isFinite(converted)) {
        setResultError("Choose a valid 'to' unit.");
        return;
      }

      const allUnits = ["kmh", "mph", "ms", "fts", "knot"];
      const breakdownRows = allUnits
        .map(function (u) {
          const v = fromMetersPerSecond(ms, u);
          return (
            "<li><strong>" +
            unitLabel(u) +
            ":</strong> " +
            formatNumberTwoDecimals(v) +
            "</li>"
          );
        })
        .join("");

      const resultHtml =
        "<p><strong>Main result:</strong> " +
        formatNumberTwoDecimals(value) +
        " " +
        unitLabel(from) +
        " = " +
        formatNumberTwoDecimals(converted) +
        " " +
        unitLabel(to) +
        "</p>" +
        "<p><strong>Full breakdown:</strong></p>" +
        "<ul>" +
        breakdownRows +
        "</ul>" +
        "<p>Tip: If you need higher precision, treat these as rounded values and calculate with more decimals in a dedicated engineering workflow.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Speed Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
