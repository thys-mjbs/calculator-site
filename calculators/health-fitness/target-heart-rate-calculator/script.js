document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const ageYearsInput = document.getElementById("ageYears");
  const intensityPresetSelect = document.getElementById("intensityPreset");
  const restingHrInput = document.getElementById("restingHr");
  const customLowInput = document.getElementById("customLow");
  const customHighInput = document.getElementById("customHigh");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Keep formatting minimal for this calculator (no commas needed).
  // Intentionally not attaching formatInputWithCommas to bpm/% fields.

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

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function roundBpm(value) {
    return Math.round(value);
  }

  function percentToDecimal(p) {
    return p / 100;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read preset
      const preset = intensityPresetSelect ? intensityPresetSelect.value : "moderate";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const ageYears = toNumber(ageYearsInput ? ageYearsInput.value : "");
      const restingHrRaw = toNumber(restingHrInput ? restingHrInput.value : "");
      const customLowRaw = toNumber(customLowInput ? customLowInput.value : "");
      const customHighRaw = toNumber(customHighInput ? customHighInput.value : "");

      // Existence guard
      if (!ageYearsInput || !intensityPresetSelect) return;

      // Validate age
      if (!validatePositive(ageYears, "age")) return;
      if (ageYears < 5 || ageYears > 110) {
        setResultError("Enter an age between 5 and 110 years.");
        return;
      }

      // Determine intensity range (percent)
      let lowPct = 50;
      let highPct = 70;

      if (preset === "fatburn") {
        lowPct = 60;
        highPct = 70;
      } else if (preset === "vigorous") {
        lowPct = 70;
        highPct = 85;
      } else if (preset === "moderate") {
        lowPct = 50;
        highPct = 70;
      } else if (preset === "custom") {
        if (!Number.isFinite(customLowRaw) || !Number.isFinite(customHighRaw)) {
          setResultError("For a custom range, enter both a low and high intensity percent.");
          return;
        }
        if (customLowRaw <= 0 || customHighRaw <= 0) {
          setResultError("Custom intensity percents must be greater than 0.");
          return;
        }
        if (customLowRaw >= customHighRaw) {
          setResultError("Custom low intensity must be less than custom high intensity.");
          return;
        }
        if (customLowRaw < 10 || customHighRaw > 95) {
          setResultError("Use a realistic custom range between 10% and 95%.");
          return;
        }
        lowPct = customLowRaw;
        highPct = customHighRaw;
      }

      // Calculation logic
      const maxHr = 220 - ageYears;

      if (!Number.isFinite(maxHr) || maxHr <= 0) {
        setResultError("Unable to calculate a valid maximum heart rate from the age provided.");
        return;
      }

      const hasResting = Number.isFinite(restingHrRaw) && restingHrRaw > 0;

      if (hasResting) {
        if (restingHrRaw < 30 || restingHrRaw > 120) {
          setResultError("Enter a realistic resting heart rate between 30 and 120 bpm, or leave it blank.");
          return;
        }
        if (restingHrRaw >= maxHr) {
          setResultError("Resting heart rate must be lower than estimated maximum heart rate. Check your inputs.");
          return;
        }
      }

      let methodLabel = "Simple percent of max HR";
      let lowTarget = 0;
      let highTarget = 0;

      if (hasResting) {
        methodLabel = "Karvonen (heart rate reserve)";
        const hrr = maxHr - restingHrRaw;
        lowTarget = restingHrRaw + hrr * percentToDecimal(lowPct);
        highTarget = restingHrRaw + hrr * percentToDecimal(highPct);
      } else {
        lowTarget = maxHr * percentToDecimal(lowPct);
        highTarget = maxHr * percentToDecimal(highPct);
      }

      lowTarget = roundBpm(lowTarget);
      highTarget = roundBpm(highTarget);

      // Zone table (common bands)
      const zoneBands = [
        { name: "Easy (50% to 60%)", lo: 50, hi: 60 },
        { name: "Moderate (60% to 70%)", lo: 60, hi: 70 },
        { name: "Tempo (70% to 80%)", lo: 70, hi: 80 },
        { name: "Hard (80% to 90%)", lo: 80, hi: 90 }
      ];

      function bandToRange(loPctBand, hiPctBand) {
        let lo = 0;
        let hi = 0;
        if (hasResting) {
          const hrr = maxHr - restingHrRaw;
          lo = restingHrRaw + hrr * percentToDecimal(loPctBand);
          hi = restingHrRaw + hrr * percentToDecimal(hiPctBand);
        } else {
          lo = maxHr * percentToDecimal(loPctBand);
          hi = maxHr * percentToDecimal(hiPctBand);
        }
        return { lo: roundBpm(lo), hi: roundBpm(hi) };
      }

      const zonesHtml = zoneBands
        .map(function (z) {
          const r = bandToRange(z.lo, z.hi);
          return `<li><strong>${z.name}:</strong> ${r.lo} to ${r.hi} bpm</li>`;
        })
        .join("");

      // Build output HTML
      const resultHtml = `
        <p><strong>Target heart rate range:</strong> ${lowTarget} to ${highTarget} bpm</p>
        <p><strong>Estimated max heart rate:</strong> ${roundBpm(maxHr)} bpm</p>
        <p><strong>Method:</strong> ${methodLabel}${hasResting ? ` (resting HR ${roundBpm(restingHrRaw)} bpm)` : ""}</p>
        <p><strong>Quick zones (same method):</strong></p>
        <ul>
          ${zonesHtml}
        </ul>
        <p class="field-help">Use this as a training guide, not a medical diagnosis. If you feel unwell, stop and get medical advice.</p>
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
      const message = "Target Heart Rate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
