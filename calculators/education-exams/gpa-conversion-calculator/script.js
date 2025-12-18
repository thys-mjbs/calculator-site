document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const gpaValueInput = document.getElementById("gpaValue");
  const fromScaleSelect = document.getElementById("fromScale");
  const toScaleSelect = document.getElementById("toScale");
  const roundingSelect = document.getElementById("rounding");

  const fromCustomWrap = document.getElementById("fromCustomWrap");
  const toCustomWrap = document.getElementById("toCustomWrap");
  const fromCustomMaxInput = document.getElementById("fromCustomMax");
  const toCustomMaxInput = document.getElementById("toCustomMax");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // GPA inputs should not use comma grouping. Intentionally no live formatting.

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
  // 4) UI TOGGLES (CUSTOM SCALE INPUTS)
  // ------------------------------------------------------------
  function toggleCustomMaxInputs() {
    if (!fromScaleSelect || !toScaleSelect) return;

    const fromIsCustom = fromScaleSelect.value === "custom";
    const toIsCustom = toScaleSelect.value === "custom";

    if (fromCustomWrap) {
      fromCustomWrap.classList.toggle("hidden", !fromIsCustom);
    }
    if (toCustomWrap) {
      toCustomWrap.classList.toggle("hidden", !toIsCustom);
    }

    clearResult();
  }

  if (fromScaleSelect) fromScaleSelect.addEventListener("change", toggleCustomMaxInputs);
  if (toScaleSelect) toScaleSelect.addEventListener("change", toggleCustomMaxInputs);
  toggleCustomMaxInputs();

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function validateRangeInclusive(value, min, max, fieldLabel) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function parseScaleMax(selectEl, customInputEl, label) {
    if (!selectEl) return null;

    const v = selectEl.value;
    if (v === "custom") {
      const customMax = toNumber(customInputEl ? customInputEl.value : "");
      if (!validateFinite(customMax, label + " maximum")) return null;
      if (customMax <= 0) {
        setResultError("Enter a valid " + label + " maximum greater than 0.");
        return null;
      }
      return customMax;
    }

    const fixed = toNumber(v);
    if (!Number.isFinite(fixed) || fixed <= 0) {
      setResultError("Select a valid " + label + " scale.");
      return null;
    }
    return fixed;
  }

  function formatToDecimals(value, decimals) {
    const d = Number.isFinite(decimals) ? decimals : 2;
    const factor = Math.pow(10, d);
    const rounded = Math.round(value * factor) / factor;

    if (d === 2) return formatNumberTwoDecimals(rounded);

    // Fallback for 3-4 decimals without re-implementing global 2dp helper.
    return rounded.toFixed(d);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const gpaValue = toNumber(gpaValueInput ? gpaValueInput.value : "");
      const decimals = roundingSelect ? parseInt(roundingSelect.value, 10) : 2;

      if (!gpaValueInput || !fromScaleSelect || !toScaleSelect) return;

      if (!validateFinite(gpaValue, "GPA")) return;
      if (!Number.isFinite(decimals) || decimals < 2 || decimals > 4) {
        setResultError("Select a valid rounding option (2 to 4 decimals).");
        return;
      }

      const fromMax = parseScaleMax(fromScaleSelect, fromCustomMaxInput, "From scale");
      if (fromMax === null) return;

      const toMax = parseScaleMax(toScaleSelect, toCustomMaxInput, "To scale");
      if (toMax === null) return;

      // Validation: GPA within the chosen source scale
      if (!validateRangeInclusive(gpaValue, 0, fromMax, "GPA")) return;

      // Calculation logic (transparent proportional conversion)
      const ratio = fromMax === 0 ? 0 : (gpaValue / fromMax);
      const clampedRatio = Math.min(Math.max(ratio, 0), 1);

      const converted = clampedRatio * toMax;
      const impliedPercent = clampedRatio * 100;

      // Helper: build a quick cross-scale table
      const commonScales = [
        { label: "4.0 scale", max: 4.0 },
        { label: "4.3 scale", max: 4.3 },
        { label: "5.0 scale", max: 5.0 },
        { label: "7.0 scale", max: 7.0 },
        { label: "10.0 scale", max: 10.0 },
        { label: "Percentage", max: 100.0 }
      ];

      let tableRows = "";
      for (let i = 0; i < commonScales.length; i++) {
        const item = commonScales[i];
        const value = clampedRatio * item.max;

        const formatted = item.max === 100.0
          ? (formatToDecimals(value, decimals) + "%")
          : formatToDecimals(value, decimals);

        tableRows += `<tr><td>${item.label}</td><td style="text-align:right;"><strong>${formatted}</strong></td></tr>`;
      }

      const fromLabel = fromScaleSelect.value === "custom"
        ? ("Custom (max " + formatToDecimals(fromMax, decimals) + ")")
        : (fromScaleSelect.options[fromScaleSelect.selectedIndex].text);

      const toLabel = toScaleSelect.value === "custom"
        ? ("Custom (max " + formatToDecimals(toMax, decimals) + ")")
        : (toScaleSelect.options[toScaleSelect.selectedIndex].text);

      const convertedFormatted = (toMax === 100)
        ? (formatToDecimals(converted, decimals) + "%")
        : formatToDecimals(converted, decimals);

      const sourcePercentText = formatToDecimals(impliedPercent, decimals) + "%";

      const note =
        "<p><strong>Note:</strong> This is an estimate using proportional conversion. Official equivalencies vary by institution (grade mapping, weighting, and policy).</p>";

      const resultHtml = `
        <p><strong>Converted GPA:</strong> ${convertedFormatted}</p>
        <p><strong>What this means:</strong> Your input is approximately <strong>${sourcePercentText}</strong> of the source scale (${fromLabel}). Applied to ${toLabel}, that estimate becomes the value above.</p>
        ${note}
        <div class="result-table-wrap">
          <p><strong>Quick equivalents (same relative performance):</strong></p>
          <table class="result-table" aria-label="GPA equivalents table">
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
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
      const message = "GPA Conversion Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
