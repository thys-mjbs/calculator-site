document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const ageInput = document.getElementById("ageInput");
  const maxHrInput = document.getElementById("maxHrInput");
  const restHrInput = document.getElementById("restHrInput");

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
  attachLiveFormatting(ageInput);
  attachLiveFormatting(maxHrInput);
  attachLiveFormatting(restHrInput);

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

  function roundBpm(x) {
    return Math.round(x);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function zoneLabel(i) {
    if (i === 1) return "Zone 1 (Easy)";
    if (i === 2) return "Zone 2 (Endurance)";
    if (i === 3) return "Zone 3 (Tempo)";
    if (i === 4) return "Zone 4 (Threshold)";
    return "Zone 5 (Max)";
  }

  function zoneFocus(i) {
    if (i === 1) return "Recovery and warm-ups; very sustainable.";
    if (i === 2) return "Aerobic base; steady effort you can hold for a long time.";
    if (i === 3) return "Moderately hard; controlled discomfort.";
    if (i === 4) return "Hard sustained work; used in structured intervals.";
    return "Very hard; short efforts only (heart rate may lag).";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const age = toNumber(ageInput ? ageInput.value : "");
      const maxHrOverride = toNumber(maxHrInput ? maxHrInput.value : "");
      const restHr = toNumber(restHrInput ? restHrInput.value : "");

      // Basic existence guard
      if (!ageInput || !maxHrInput || !restHrInput) return;

      // Validation (minimal required inputs)
      if (!validatePositive(age, "age")) return;

      if (age < 5 || age > 110) {
        setResultError("Enter a realistic age (between 5 and 110 years).");
        return;
      }

      let maxHr;
      let maxHrSource;

      if (Number.isFinite(maxHrOverride) && maxHrOverride > 0) {
        maxHr = maxHrOverride;
        maxHrSource = "Custom max HR";
      } else {
        maxHr = 220 - age;
        maxHrSource = "Estimated max HR (220 − age)";
      }

      if (!Number.isFinite(maxHr) || maxHr <= 0) {
        setResultError("Max heart rate could not be calculated. Check your inputs.");
        return;
      }

      // Max HR sanity range for normal use (still permissive)
      if (maxHr < 90 || maxHr > 230) {
        setResultError("Enter a realistic max heart rate (between 90 and 230 BPM), or remove it to use the age estimate.");
        return;
      }

      const useHrr = Number.isFinite(restHr) && restHr > 0;

      if (useHrr) {
        if (restHr < 30 || restHr > 130) {
          setResultError("Enter a realistic resting heart rate (between 30 and 130 BPM), or leave it blank.");
          return;
        }
        if (restHr >= maxHr) {
          setResultError("Resting heart rate must be lower than max heart rate.");
          return;
        }
      }

      // Zone boundaries (as fractions)
      const zones = [
        { z: 1, lo: 0.50, hi: 0.60 },
        { z: 2, lo: 0.60, hi: 0.70 },
        { z: 3, lo: 0.70, hi: 0.80 },
        { z: 4, lo: 0.80, hi: 0.90 },
        { z: 5, lo: 0.90, hi: 1.00 }
      ];

      const hrr = useHrr ? (maxHr - restHr) : null;

      function calcTarget(percent) {
        if (useHrr) return (hrr * percent) + restHr;
        return maxHr * percent;
      }

      // Build table rows
      let rowsHtml = "";
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        const low = roundBpm(calcTarget(z.lo));
        const high = roundBpm(calcTarget(z.hi));

        // Clamp to plausible range (0..maxHr) for display
        const lowClamped = clamp(low, 0, roundBpm(maxHr));
        const highClamped = clamp(high, 0, roundBpm(maxHr));

        rowsHtml +=
          "<tr>" +
            "<td><strong>" + zoneLabel(z.z) + "</strong></td>" +
            "<td>" + lowClamped + "–" + highClamped + " BPM</td>" +
            "<td class=\"muted\">" + zoneFocus(z.z) + "</td>" +
          "</tr>";
      }

      const methodLine = useHrr
        ? "Zones calculated using HRR (Karvonen) because you provided a resting heart rate."
        : "Zones calculated as a percentage of max heart rate (no resting heart rate provided).";

      const restLine = useHrr
        ? "<p class=\"result-meta\"><strong>Resting HR:</strong> " + roundBpm(restHr) + " BPM</p>"
        : "<p class=\"result-meta\"><strong>Resting HR:</strong> <span class=\"muted\">Not provided</span></p>";

      const resultHtml =
        "<p class=\"result-meta\"><strong>Max HR used:</strong> " + roundBpm(maxHr) + " BPM <span class=\"muted\">(" + maxHrSource + ")</span></p>" +
        restLine +
        "<p class=\"zone-note\"><strong>Method:</strong> " + methodLine + "</p>" +
        "<table class=\"result-table\" aria-label=\"Heart rate training zones\">" +
          "<thead>" +
            "<tr>" +
              "<th>Zone</th>" +
              "<th>Target range</th>" +
              "<th>What it is for</th>" +
            "</tr>" +
          "</thead>" +
          "<tbody>" + rowsHtml + "</tbody>" +
        "</table>" +
        "<p class=\"zone-note\">If your watch shows heart rate lag during short efforts, use these zones for steady segments and longer intervals.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Heart Rate Zones Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
