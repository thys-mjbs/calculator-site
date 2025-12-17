document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const unitSelect = document.getElementById("unitSelect");

  const c1 = document.getElementById("c1");
  const c2 = document.getElementById("c2");
  const c3 = document.getElementById("c3");
  const c4 = document.getElementById("c4");
  const c5 = document.getElementById("c5");
  const c6 = document.getElementById("c6");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Light formatting (commas) for any large values users might paste
  attachLiveFormatting(c1);
  attachLiveFormatting(c2);
  attachLiveFormatting(c3);
  attachLiveFormatting(c4);
  attachLiveFormatting(c5);
  attachLiveFormatting(c6);

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
    // No UI sections to toggle for this calculator.
    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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
  // 6) CALCULATOR-SPECIFIC HELPERS
  // ------------------------------------------------------------
  function unitToMultiplier(unit) {
    // Multiplier to convert input unit -> Farads
    if (unit === "pF") return 1e-12;
    if (unit === "nF") return 1e-9;
    if (unit === "uF") return 1e-6;
    if (unit === "mF") return 1e-3;
    return 1; // F
  }

  function faradsToUnit(valueF, unit) {
    // Convert Farads -> selected unit
    const m = unitToMultiplier(unit);
    return valueF / m;
  }

  function formatCapacitance(valueInUnit, unit) {
    // Keep consistent two-decimal formatting via global helper
    return formatNumberTwoDecimals(valueInUnit) + " " + unit;
  }

  function safeList(valuesF) {
    // valuesF: array of numbers in Farads
    // return HTML list of original values in selected unit for context
    if (!unitSelect) return "";
    const unit = unitSelect.value;
    const items = valuesF.map(function (vF) {
      const vU = faradsToUnit(vF, unit);
      return "<li>" + formatCapacitance(vU, unit) + "</li>";
    });
    return "<ul>" + items.join("") + "</ul>";
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "series";
      const unit = unitSelect ? unitSelect.value : "uF";
      const mult = unitToMultiplier(unit);

      // Parse inputs using toNumber() (from /scripts/main.js)
      const raw = [
        { el: c1, label: "Capacitor 1" },
        { el: c2, label: "Capacitor 2" },
        { el: c3, label: "Capacitor 3" },
        { el: c4, label: "Capacitor 4" },
        { el: c5, label: "Capacitor 5" },
        { el: c6, label: "Capacitor 6" }
      ];

      const valuesF = [];
      for (let i = 0; i < raw.length; i++) {
        const el = raw[i].el;
        if (!el) continue;
        const str = (el.value || "").trim();
        if (str === "") continue;

        const v = toNumber(str);
        if (!validatePositive(v, raw[i].label)) return;

        valuesF.push(v * mult);
      }

      if (valuesF.length < 2) {
        setResultError("Enter at least two capacitor values to calculate an equivalent capacitance.");
        return;
      }

      // Calculation logic
      let ceqF = 0;

      if (mode === "parallel") {
        // Ceq = sum(Ci)
        for (let i = 0; i < valuesF.length; i++) ceqF += valuesF[i];
      } else {
        // Series: 1/Ceq = sum(1/Ci)
        let invSum = 0;
        for (let i = 0; i < valuesF.length; i++) {
          invSum += 1 / valuesF[i];
        }
        ceqF = 1 / invSum;
      }

      if (!Number.isFinite(ceqF) || ceqF <= 0) {
        setResultError("Something went wrong with the calculation. Check your inputs and try again.");
        return;
      }

      const ceqInUnit = faradsToUnit(ceqF, unit);

      // Secondary insights (useful, not over-engineered)
      const valuesSorted = valuesF.slice().sort(function (a, b) { return a - b; });
      const smallestF = valuesSorted[0];
      const largestF = valuesSorted[valuesSorted.length - 1];

      const ceqUF = faradsToUnit(ceqF, "uF");
      const ceqNF = faradsToUnit(ceqF, "nF");
      const ceqPF = faradsToUnit(ceqF, "pF");

      const modeLabel = mode === "parallel" ? "Parallel" : "Series";

      let practicalNote = "";
      if (mode === "parallel") {
        practicalNote =
          "In parallel, capacitances add. The equivalent is always larger than the largest single capacitor in the set.";
      } else {
        practicalNote =
          "In series, the equivalent is always smaller than the smallest capacitor in the set. Small values dominate the result.";
      }

      // Build output HTML
      const resultHtml =
        "<p><strong>Mode:</strong> " + modeLabel + "</p>" +
        "<p><strong>Equivalent capacitance (Ceq):</strong> " + formatCapacitance(ceqInUnit, unit) + "</p>" +
        "<p><strong>Quick unit check:</strong> " +
          formatNumberTwoDecimals(ceqUF) + " µF, " +
          formatNumberTwoDecimals(ceqNF) + " nF, " +
          formatNumberTwoDecimals(ceqPF) + " pF" +
        "</p>" +
        "<p><strong>Capacitors used:</strong> " + valuesF.length + "</p>" +
        "<p><strong>Smallest capacitor:</strong> " + formatCapacitance(faradsToUnit(smallestF, unit), unit) + "</p>" +
        "<p><strong>Largest capacitor:</strong> " + formatCapacitance(faradsToUnit(largestF, unit), unit) + "</p>" +
        "<p><strong>Why this matters:</strong> " + practicalNote + "</p>" +
        "<p><strong>Entered values:</strong></p>" +
        safeList(valuesF);

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Series & Parallel Capacitor Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
