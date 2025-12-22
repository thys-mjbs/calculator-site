document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const awgSelect = document.getElementById("awgSelect");
  const materialSelect = document.getElementById("materialSelect");
  const tempRatingSelect = document.getElementById("tempRatingSelect");
  const ambientTempCInput = document.getElementById("ambientTempC");
  const conductorsCountInput = document.getElementById("conductorsCount");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No live formatting needed for this calculator (AWG is a select, other fields are small numbers)

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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function roundToOneDecimal(n) {
    return Math.round(n * 10) / 10;
  }

  function pickStandardBreaker(amps) {
    const sizes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200];
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] <= amps) return sizes[i];
    }
    return sizes[0];
  }

  function getAmbientFactor(ambientC) {
    // Simplified temperature correction factor (typical planning factors around a 30°C baseline)
    // 30°C => 1.00
    if (ambientC <= 30) return 1.0;
    if (ambientC <= 35) return 0.94;
    if (ambientC <= 40) return 0.88;
    if (ambientC <= 45) return 0.82;
    if (ambientC <= 50) return 0.75;
    if (ambientC <= 55) return 0.67;
    return 0.58; // 56–60°C
  }

  function getBundlingFactor(conductors) {
    // Simplified conductor-count derating (planning-friendly)
    if (conductors <= 3) return 1.0;
    if (conductors <= 6) return 0.8;
    if (conductors <= 9) return 0.7;
    if (conductors <= 20) return 0.5;
    return 0.45;
  }

  function getBaseAmpacity(material, tempRating, awgKey) {
    // Base ampacity table (typical building-wire reference values at ~30°C)
    // This is intentionally a simplified estimator for common sizing decisions.
    const copper = {
      "60": { "14": 15, "12": 20, "10": 30, "8": 40, "6": 55, "4": 70, "3": 85, "2": 95, "1": 110, "1/0": 125, "2/0": 145, "3/0": 165, "4/0": 195 },
      "75": { "14": 20, "12": 25, "10": 35, "8": 50, "6": 65, "4": 85, "3": 100, "2": 115, "1": 130, "1/0": 150, "2/0": 175, "3/0": 200, "4/0": 230 },
      "90": { "14": 25, "12": 30, "10": 40, "8": 55, "6": 75, "4": 95, "3": 110, "2": 130, "1": 145, "1/0": 170, "2/0": 195, "3/0": 225, "4/0": 260 }
    };

    const aluminum = {
      "60": { "14": 0, "12": 0, "10": 0, "8": 0, "6": 40, "4": 55, "3": 65, "2": 75, "1": 85, "1/0": 100, "2/0": 115, "3/0": 130, "4/0": 150 },
      "75": { "14": 0, "12": 0, "10": 0, "8": 0, "6": 50, "4": 65, "3": 75, "2": 90, "1": 100, "1/0": 120, "2/0": 135, "3/0": 155, "4/0": 180 },
      "90": { "14": 0, "12": 0, "10": 0, "8": 0, "6": 55, "4": 75, "3": 85, "2": 100, "1": 115, "1/0": 135, "2/0": 150, "3/0": 175, "4/0": 205 }
    };

    const table = material === "aluminum" ? aluminum : copper;
    const byTemp = table[String(tempRating)];
    if (!byTemp) return null;

    const amps = byTemp[String(awgKey)];
    if (!Number.isFinite(amps) || amps <= 0) return null;

    return amps;
  }

  function awgDisplayLabel(awgKey) {
    return String(awgKey).toUpperCase() + " AWG";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs
      if (!awgSelect || !materialSelect) return;

      const awgKey = awgSelect.value;
      const material = materialSelect.value === "aluminum" ? "aluminum" : "copper";

      const tempRatingRaw = tempRatingSelect ? tempRatingSelect.value : "75";
      const tempRating = tempRatingRaw === "60" || tempRatingRaw === "90" ? tempRatingRaw : "75";

      let ambientC = toNumber(ambientTempCInput ? ambientTempCInput.value : "");
      if (!Number.isFinite(ambientC)) ambientC = 30;

      let conductors = toNumber(conductorsCountInput ? conductorsCountInput.value : "");
      if (!Number.isFinite(conductors)) conductors = 3;

      // Validation
      if (!awgKey) {
        setResultError("Select a wire size (AWG) to calculate current capacity.");
        return;
      }

      ambientC = clamp(ambientC, -20, 60);
      conductors = Math.round(clamp(conductors, 1, 30));

      const baseAmpacity = getBaseAmpacity(material, tempRating, awgKey);
      if (!Number.isFinite(baseAmpacity)) {
        setResultError(
          "That combination is not supported in this estimator. Try copper, or a larger wire size."
        );
        return;
      }

      const ambientFactor = getAmbientFactor(ambientC);
      const bundlingFactor = getBundlingFactor(conductors);

      const adjustedAmpacity = baseAmpacity * ambientFactor * bundlingFactor;
      const adjustedRounded = roundToOneDecimal(adjustedAmpacity);

      const continuousLoad = adjustedAmpacity * 0.8;
      const continuousRounded = roundToOneDecimal(continuousLoad);

      const breakerSize = pickStandardBreaker(Math.floor(adjustedAmpacity));

      const materialLabel = material === "aluminum" ? "Aluminum" : "Copper";

      const resultHtml = `
        <p><strong>Estimated safe current capacity:</strong> ${formatNumberTwoDecimals(adjustedRounded)} A</p>
        <p><strong>Recommended continuous-load current (80%):</strong> ${formatNumberTwoDecimals(continuousRounded)} A</p>
        <p><strong>Suggested standard breaker size (not exceeding estimate):</strong> ${breakerSize} A</p>
        <hr>
        <p><strong>Details used:</strong></p>
        <ul>
          <li><strong>Wire:</strong> ${awgDisplayLabel(awgKey)} (${materialLabel})</li>
          <li><strong>Base ampacity at 30°C:</strong> ${formatNumberTwoDecimals(baseAmpacity)} A (${tempRating}°C insulation)</li>
          <li><strong>Ambient temperature:</strong> ${formatNumberTwoDecimals(ambientC)} °C (factor ${formatNumberTwoDecimals(ambientFactor)})</li>
          <li><strong>Current-carrying conductors:</strong> ${conductors} (factor ${formatNumberTwoDecimals(bundlingFactor)})</li>
        </ul>
        <p><strong>Interpretation:</strong> Treat this as a planning estimate for steady loads. Real limits depend on installation method, terminations, and local code.</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Wire Gauge (AWG) Current Capacity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
