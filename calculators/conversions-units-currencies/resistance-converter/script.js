document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const resistanceValueInput = document.getElementById("resistanceValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

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
  attachLiveFormatting(resistanceValueInput);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const unitToOhmFactor = {
    milliohm: 0.001,
    ohm: 1,
    kilohm: 1000,
    megaohm: 1000000,
    gigaohm: 1000000000
  };

  const unitLabel = {
    milliohm: "mΩ",
    ohm: "Ω",
    kilohm: "kΩ",
    megaohm: "MΩ",
    gigaohm: "GΩ"
  };

  function fmt(n) {
    return formatNumberTwoDecimals(n);
  }

  function buildAllUnitsTable(valueOhms) {
    const rows = [
      { key: "milliohm", label: unitLabel.milliohm, val: valueOhms / unitToOhmFactor.milliohm },
      { key: "ohm", label: unitLabel.ohm, val: valueOhms / unitToOhmFactor.ohm },
      { key: "kilohm", label: unitLabel.kilohm, val: valueOhms / unitToOhmFactor.kilohm },
      { key: "megaohm", label: unitLabel.megaohm, val: valueOhms / unitToOhmFactor.megaohm },
      { key: "gigaohm", label: unitLabel.gigaohm, val: valueOhms / unitToOhmFactor.gigaohm }
    ];

    let html = '<div class="result-block">';
    html += '<p><strong>All common units:</strong></p>';
    html += '<ul>';
    for (let i = 0; i < rows.length; i++) {
      html += "<li><strong>" + rows[i].label + ":</strong> " + fmt(rows[i].val) + "</li>";
    }
    html += "</ul>";
    html += "</div>";
    return html;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const rawValue = resistanceValueInput ? resistanceValueInput.value : "";
      const value = toNumber(rawValue);

      const fromUnit = fromUnitSelect ? fromUnitSelect.value : "ohm";
      const toUnit = toUnitSelect ? toUnitSelect.value : "all";

      if (!resistanceValueInput || !fromUnitSelect || !toUnitSelect) return;

      if (!validatePositive(value, "resistance value")) return;

      if (!unitToOhmFactor[fromUnit]) {
        setResultError("Select a valid source unit.");
        return;
      }

      const valueOhms = value * unitToOhmFactor[fromUnit];

      let resultHtml = "";
      if (toUnit !== "all") {
        if (!unitToOhmFactor[toUnit]) {
          setResultError("Select a valid target unit.");
          return;
        }
        const converted = valueOhms / unitToOhmFactor[toUnit];

        resultHtml += "<p><strong>Converted value:</strong> " + fmt(converted) + " " + unitLabel[toUnit] + "</p>";
        resultHtml += "<p><strong>In ohms:</strong> " + fmt(valueOhms) + " " + unitLabel.ohm + "</p>";
        resultHtml += buildAllUnitsTable(valueOhms);
      } else {
        resultHtml += "<p><strong>In ohms:</strong> " + fmt(valueOhms) + " " + unitLabel.ohm + "</p>";
        resultHtml += buildAllUnitsTable(valueOhms);
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Resistance Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
