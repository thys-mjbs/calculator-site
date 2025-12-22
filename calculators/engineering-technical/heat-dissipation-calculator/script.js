document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const powerWattsInput = document.getElementById("powerWatts");
  const ambientTempInput = document.getElementById("ambientTemp");
  const maxJunctionTempInput = document.getElementById("maxJunctionTemp");
  const rThetaJCInput = document.getElementById("rThetaJC");
  const rThetaCSInput = document.getElementById("rThetaCS");
  const designMarginInput = document.getElementById("designMargin");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(powerWattsInput);
  attachLiveFormatting(ambientTempInput);
  attachLiveFormatting(maxJunctionTempInput);
  attachLiveFormatting(rThetaJCInput);
  attachLiveFormatting(rThetaCSInput);
  attachLiveFormatting(designMarginInput);

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

  function validateReasonableTemp(value, fieldLabel) {
    if (!Number.isFinite(value) || value < -60 || value > 250) {
      setResultError("Enter a realistic " + fieldLabel + " (between -60 and 250 °C).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const powerW = toNumber(powerWattsInput ? powerWattsInput.value : "");
      const ambientC = toNumber(ambientTempInput ? ambientTempInput.value : "");
      const maxJunctionC = toNumber(maxJunctionTempInput ? maxJunctionTempInput.value : "");

      const rThetaJC = toNumber(rThetaJCInput ? rThetaJCInput.value : "");
      const rThetaCS = toNumber(rThetaCSInput ? rThetaCSInput.value : "");
      const marginPct = toNumber(designMarginInput ? designMarginInput.value : "");

      // Existence guard
      if (!powerWattsInput || !ambientTempInput || !maxJunctionTempInput) return;

      // Required validations
      if (!validatePositive(powerW, "power (W)")) return;
      if (!validateReasonableTemp(ambientC, "ambient temperature")) return;
      if (!validateReasonableTemp(maxJunctionC, "maximum junction temperature")) return;

      if (maxJunctionC <= ambientC) {
        setResultError("Maximum junction temperature must be higher than ambient temperature.");
        return;
      }

      // Optional inputs: treat blank/NaN as defaults
      const jcProvided = Number.isFinite(rThetaJC);
      const csProvided = Number.isFinite(rThetaCS);
      const marginProvided = Number.isFinite(marginPct);

      const rJC = jcProvided ? rThetaJC : 0;
      const rCS = csProvided ? rThetaCS : 0;
      const margin = marginProvided ? marginPct : 20;

      if (!validateNonNegative(rJC, "RθJC (°C/W)")) return;
      if (!validateNonNegative(rCS, "RθCS (°C/W)")) return;

      if (!Number.isFinite(margin) || margin < 0 || margin >= 100) {
        setResultError("Enter a valid design margin (%) between 0 and 99.");
        return;
      }

      // Calculation logic
      const deltaT = maxJunctionC - ambientC; // °C
      const rTotalAllowed = deltaT / powerW; // °C/W
      const rFixed = rJC + rCS; // °C/W
      const rSinkMax = rTotalAllowed - rFixed; // °C/W

      if (!Number.isFinite(rTotalAllowed) || rTotalAllowed <= 0) {
        setResultError("These inputs do not produce a valid thermal budget. Check power and temperatures.");
        return;
      }

      if (rSinkMax <= 0) {
        setResultError(
          "No heatsink can meet this thermal budget with the given RθJC and RθCS. Reduce power, lower ambient, increase the temperature limit, or improve the thermal path."
        );
        return;
      }

      const rSinkTarget = rSinkMax * (1 - margin / 100);

      // Build output HTML
      const rTotalTxt = formatNumberTwoDecimals(rTotalAllowed);
      const rFixedTxt = formatNumberTwoDecimals(rFixed);
      const rMaxTxt = formatNumberTwoDecimals(rSinkMax);
      const rTargetTxt = formatNumberTwoDecimals(rSinkTarget);
      const deltaTTxt = formatNumberTwoDecimals(deltaT);

      const powerTxt = formatNumberTwoDecimals(powerW);
      const ambientTxt = formatNumberTwoDecimals(ambientC);
      const maxJunctionTxt = formatNumberTwoDecimals(maxJunctionC);

      const jcNote = jcProvided ? formatNumberTwoDecimals(rJC) : "0.00 (assumed)";
      const csNote = csProvided ? formatNumberTwoDecimals(rCS) : "0.00 (assumed)";
      const marginNote = marginProvided ? formatNumberTwoDecimals(margin) : "20.00 (default)";

      const resultHtml =
        `<p><strong>Recommended heatsink target (RθSA):</strong> ≤ ${rTargetTxt} °C/W</p>` +
        `<p><strong>Maximum heatsink allowed (RθSA max):</strong> ${rMaxTxt} °C/W</p>` +
        `<p><strong>Thermal budget (ΔT):</strong> ${deltaTTxt} °C (from ${ambientTxt} °C ambient to ${maxJunctionTxt} °C max junction)</p>` +
        `<p><strong>Total allowed RθJA:</strong> ${rTotalTxt} °C/W at ${powerTxt} W</p>` +
        `<p><strong>Non-heatsink resistances used:</strong> RθJC ${jcNote} °C/W + RθCS ${csNote} °C/W = ${rFixedTxt} °C/W</p>` +
        `<p><strong>Design margin:</strong> ${marginNote}% (applied to the heatsink requirement)</p>` +
        `<p>Pick a heatsink with a published sink-to-ambient rating at or below the recommended target under conditions similar to your build (mounting, orientation, airflow).</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Heat Dissipation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
