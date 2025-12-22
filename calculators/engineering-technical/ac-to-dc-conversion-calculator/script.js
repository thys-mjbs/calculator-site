document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const acVrmsInput = document.getElementById("acVrms");
  const rectifierTypeSelect = document.getElementById("rectifierType");

  const frequencyHzInput = document.getElementById("frequencyHz");
  const diodeDropVInput = document.getElementById("diodeDropV");
  const loadCurrentAInput = document.getElementById("loadCurrentA");
  const capacitanceUfInput = document.getElementById("capacitanceUf");
  const targetRippleVppInput = document.getElementById("targetRippleVpp");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Only apply comma formatting where users might type large values
  attachLiveFormatting(capacitanceUfInput);

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
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!acVrmsInput || !rectifierTypeSelect) return;

      const acVrms = toNumber(acVrmsInput.value);
      if (!validatePositive(acVrms, "AC RMS voltage (volts)")) return;

      const rectifierType = rectifierTypeSelect.value === "half" ? "half" : "full";

      // Defaults for optional inputs
      const frequencyHzRaw = toNumber(frequencyHzInput ? frequencyHzInput.value : "");
      const frequencyHz = Number.isFinite(frequencyHzRaw) && frequencyHzRaw > 0 ? frequencyHzRaw : 50;

      const diodeDropRaw = toNumber(diodeDropVInput ? diodeDropVInput.value : "");
      const diodeDropV = Number.isFinite(diodeDropRaw) && diodeDropRaw >= 0 ? diodeDropRaw : 0.7;

      const loadCurrentA = toNumber(loadCurrentAInput ? loadCurrentAInput.value : "");
      const capacitanceUf = toNumber(capacitanceUfInput ? capacitanceUfInput.value : "");
      const targetRippleVppRaw = toNumber(targetRippleVppInput ? targetRippleVppInput.value : "");
      const targetRippleVpp = Number.isFinite(targetRippleVppRaw) && targetRippleVppRaw > 0 ? targetRippleVppRaw : 1.0;

      // Core math
      const sqrt2 = Math.SQRT2;
      const vPeak = acVrms * sqrt2;

      const diodeCount = rectifierType === "full" ? 2 : 1;
      const diodeLoss = diodeCount * diodeDropV;

      const vNoLoadApprox = vPeak - diodeLoss;

      if (!Number.isFinite(vNoLoadApprox) || vNoLoadApprox <= 0) {
        setResultError("Your diode drop is too high for the entered AC voltage. Reduce diode drop or increase AC RMS voltage.");
        return;
      }

      // Ripple calculations (only if user provided both load current and capacitance)
      const hasLoad = Number.isFinite(loadCurrentA) && loadCurrentA > 0;
      const hasCap = Number.isFinite(capacitanceUf) && capacitanceUf > 0;

      const rippleFrequencyHz = rectifierType === "full" ? (2 * frequencyHz) : frequencyHz;

      let rippleVpp = null;
      let vMinApprox = null;
      let vAvgApprox = null;

      if (hasLoad && hasCap) {
        const capacitanceF = capacitanceUf / 1000000;
        if (!validatePositive(capacitanceF, "capacitance")) return;
        if (!validatePositive(rippleFrequencyHz, "frequency")) return;

        rippleVpp = loadCurrentA / (rippleFrequencyHz * capacitanceF);

        // Clamp nonsensical huge ripple to prevent confusing output
        if (!Number.isFinite(rippleVpp) || rippleVpp < 0) {
          setResultError("Ripple could not be estimated from the values provided. Check load current, frequency, and capacitance.");
          return;
        }

        vMinApprox = vNoLoadApprox - rippleVpp;
        vAvgApprox = vNoLoadApprox - (rippleVpp / 2);
      }

      // Suggested capacitance for target ripple (only if load is provided)
      let suggestedCapUf = null;
      if (hasLoad && validatePositive(targetRippleVpp, "target ripple (V peak-to-peak)")) {
        const requiredCapF = loadCurrentA / (rippleFrequencyHz * targetRippleVpp);
        if (Number.isFinite(requiredCapF) && requiredCapF > 0) {
          suggestedCapUf = requiredCapF * 1000000;
        }
      }

      // Build output HTML
      let resultHtml = "";
      resultHtml += `<p><strong>Estimated DC (no-load):</strong> ${formatNumberTwoDecimals(vNoLoadApprox)} V</p>`;
      resultHtml += `<p><strong>AC peak (from RMS):</strong> ${formatNumberTwoDecimals(vPeak)} V</p>`;
      resultHtml += `<p><strong>Assumed diode loss:</strong> ${formatNumberTwoDecimals(diodeLoss)} V (${diodeCount} diode${diodeCount === 1 ? "" : "s"} × ${formatNumberTwoDecimals(diodeDropV)} V)</p>`;

      if (hasLoad && hasCap) {
        const minText = vMinApprox <= 0 ? "Below 0 V (not usable)" : `${formatNumberTwoDecimals(vMinApprox)} V`;
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Estimated ripple (peak-to-peak):</strong> ${formatNumberTwoDecimals(rippleVpp)} V</p>`;
        resultHtml += `<p><strong>Estimated DC average under load:</strong> ${formatNumberTwoDecimals(vAvgApprox)} V</p>`;
        resultHtml += `<p><strong>Estimated minimum voltage (most important):</strong> ${minText}</p>`;
        resultHtml += `<p>Practical tip: compare the minimum voltage to your device’s minimum required input (including any regulator dropout margin). If the minimum is too low, increase capacitance, reduce load current, or increase the AC RMS voltage.</p>`;
      } else {
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Ripple estimate not shown:</strong> enter both load current and capacitor value under Advanced to estimate ripple and minimum voltage.</p>`;
        resultHtml += `<p>Without load and capacitor values, the result is a no-load estimate only. Real supplies will drop under load and will not stay at the no-load DC value.</p>`;
      }

      if (hasLoad && Number.isFinite(suggestedCapUf) && suggestedCapUf > 0) {
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Capacitance for target ripple (~${formatNumberTwoDecimals(targetRippleVpp)} Vpp):</strong> about ${formatNumberTwoDecimals(suggestedCapUf)} µF</p>`;
        resultHtml += `<p>Note: larger capacitors reduce ripple but increase inrush current and rectifier/transformer stress.</p>`;
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
      const message = "AC to DC Conversion Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
