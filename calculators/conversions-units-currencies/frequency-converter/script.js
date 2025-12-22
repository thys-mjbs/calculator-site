document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const frequencyValue = document.getElementById("frequencyValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const showDerived = document.getElementById("showDerived");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(frequencyValue);

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
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function formatDisplayNumber(value) {
    const two = formatNumberTwoDecimals(value);
    return formatInputWithCommas(two);
  }

  function unitLabel(unit) {
    const labels = {
      hz: "Hz",
      khz: "kHz",
      mhz: "MHz",
      ghz: "GHz",
      thz: "THz",
      rpm: "RPM"
    };
    return labels[unit] || "";
  }

  function toHz(value, unit) {
    switch (unit) {
      case "hz":
        return value;
      case "khz":
        return value * 1000;
      case "mhz":
        return value * 1000000;
      case "ghz":
        return value * 1000000000;
      case "thz":
        return value * 1000000000000;
      case "rpm":
        return value / 60;
      default:
        return NaN;
    }
  }

  function fromHz(hzValue, unit) {
    switch (unit) {
      case "hz":
        return hzValue;
      case "khz":
        return hzValue / 1000;
      case "mhz":
        return hzValue / 1000000;
      case "ghz":
        return hzValue / 1000000000;
      case "thz":
        return hzValue / 1000000000000;
      case "rpm":
        return hzValue * 60;
      default:
        return NaN;
    }
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!frequencyValue || !fromUnit || !toUnit) return;

      const value = toNumber(frequencyValue.value);
      const from = fromUnit.value;
      const to = toUnit.value;

      if (!validatePositive(value, "frequency value")) return;

      const hz = toHz(value, from);
      if (!Number.isFinite(hz) || hz <= 0) {
        setResultError("Enter a valid frequency and unit to convert.");
        return;
      }

      const units = ["hz", "khz", "mhz", "ghz", "thz", "rpm"];
      let resultHtml = "";

      if (to === "all") {
        const rows = units
          .map(function (u) {
            const converted = fromHz(hz, u);
            return "<li><strong>" + unitLabel(u) + ":</strong> " + formatDisplayNumber(converted) + "</li>";
          })
          .join("");

        resultHtml +=
          "<p><strong>Converted values:</strong></p>" +
          "<ul>" +
          rows +
          "</ul>";
      } else {
        const convertedSingle = fromHz(hz, to);
        if (!Number.isFinite(convertedSingle)) {
          setResultError("Select a valid output unit.");
          return;
        }

        resultHtml +=
          "<p><strong>Converted value:</strong> " +
          formatDisplayNumber(convertedSingle) +
          " " +
          unitLabel(to) +
          "</p>";
      }

      const derivedOn = !!(showDerived && showDerived.checked);
      if (derivedOn) {
        const periodSeconds = 1 / hz;
        const angular = 2 * Math.PI * hz;

        resultHtml +=
          "<p><strong>Derived values (based on Hz):</strong></p>" +
          "<ul>" +
          "<li><strong>Period (seconds per cycle):</strong> " + formatDisplayNumber(periodSeconds) + " s</li>" +
          "<li><strong>Angular frequency:</strong> " + formatDisplayNumber(angular) + " rad/s</li>" +
          "</ul>";
      }

      resultHtml +=
        "<p><strong>Reference:</strong> 1 kHz = 1,000 Hz; 1 MHz = 1,000,000 Hz; 1 GHz = 1,000,000,000 Hz; 1 THz = 1,000,000,000,000 Hz; RPM = Hz × 60.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Frequency Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
