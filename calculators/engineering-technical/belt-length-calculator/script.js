/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");
  const pulleyDiameter1 = document.getElementById("pulleyDiameter1");
  const pulleyDiameter2 = document.getElementById("pulleyDiameter2");
  const centerDistance = document.getElementById("centerDistance");
  const allowancePercent = document.getElementById("allowancePercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(pulleyDiameter1);
  attachLiveFormatting(pulleyDiameter2);
  attachLiveFormatting(centerDistance);
  attachLiveFormatting(allowancePercent);

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

  function formatLength(value, unit) {
    if (!Number.isFinite(value)) return "";
    return formatNumberTwoDecimals(value) + " " + unit;
  }

  function convertLength(value, fromUnit) {
    if (!Number.isFinite(value)) return NaN;
    if (fromUnit === "mm") return value / 25.4; // mm -> in
    return value * 25.4; // in -> mm
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const unit = unitSelect ? unitSelect.value : "mm";

      const d1 = toNumber(pulleyDiameter1 ? pulleyDiameter1.value : "");
      const d2 = toNumber(pulleyDiameter2 ? pulleyDiameter2.value : "");
      const c = toNumber(centerDistance ? centerDistance.value : "");
      const allowancePctRaw = toNumber(allowancePercent ? allowancePercent.value : "");

      if (!pulleyDiameter1 || !pulleyDiameter2 || !centerDistance) return;

      if (!validatePositive(d1, "pulley diameter 1")) return;
      if (!validatePositive(d2, "pulley diameter 2")) return;
      if (!validatePositive(c, "center distance")) return;

      const allowancePct = Number.isFinite(allowancePctRaw) ? allowancePctRaw : 0;
      if (!validateNonNegative(allowancePct, "allowance percentage")) return;

      const Dsmall = Math.min(d1, d2);
      const Dlarge = Math.max(d1, d2);

      // Basic geometry sanity check
      const minRecommendedC = (Dsmall + Dlarge) / 2;
      if (c <= minRecommendedC) {
        setResultError(
          "Center distance looks too small for these pulley sizes. Increase the center distance to more than half the sum of the pulley diameters."
        );
        return;
      }

      // Open belt length approximation:
      // L = 2C + (pi/2)(D1 + D2) + ((D2 - D1)^2)/(4C)
      const pi = Math.PI;
      const baseLength =
        2 * c + (pi / 2) * (Dsmall + Dlarge) + ((Dlarge - Dsmall) * (Dlarge - Dsmall)) / (4 * c);

      // Wrap angles (open belt)
      // alpha = asin((Dlarge - Dsmall) / (2C))
      const ratio = (Dlarge - Dsmall) / (2 * c);
      if (ratio <= -1 || ratio >= 1) {
        setResultError(
          "The pulley sizes and center distance produce an invalid geometry. Re-check your inputs and increase the center distance."
        );
        return;
      }

      const alpha = Math.asin(ratio);
      const wrapSmallRad = pi - 2 * alpha;
      const wrapLargeRad = pi + 2 * alpha;

      const wrapSmallDeg = (wrapSmallRad * 180) / pi;
      const wrapLargeDeg = (wrapLargeRad * 180) / pi;

      const adjustedLength = baseLength * (1 + allowancePct / 100);

      const otherUnit = unit === "mm" ? "in" : "mm";
      const baseOther = convertLength(baseLength, unit);
      const adjOther = convertLength(adjustedLength, unit);

      const note =
        allowancePct > 0
          ? "Adjusted length includes the allowance you entered."
          : "Adjusted length matches base length because allowance is 0%.";

      const resultHtml = `
        <p><strong>Estimated belt length (base):</strong> ${formatLength(baseLength, unit)}</p>
        <p><strong>Estimated belt length (adjusted):</strong> ${formatLength(adjustedLength, unit)}</p>
        <p><strong>Same lengths in ${otherUnit}:</strong> Base ${formatLength(baseOther, otherUnit)}, Adjusted ${formatLength(adjOther, otherUnit)}</p>
        <p><strong>Wrap angle (small pulley):</strong> ${formatNumberTwoDecimals(wrapSmallDeg)}°</p>
        <p><strong>Wrap angle (large pulley):</strong> ${formatNumberTwoDecimals(wrapLargeDeg)}°</p>
        <p>${note}</p>
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
      const message = "Belt Length Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
