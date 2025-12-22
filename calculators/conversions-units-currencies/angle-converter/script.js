document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const angleValue = document.getElementById("angleValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const decimalsInput = document.getElementById("decimals");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(angleValue);
  attachLiveFormatting(decimalsInput);

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
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function parseDecimalsOrDefault() {
    const raw = decimalsInput ? decimalsInput.value : "";
    const cleaned = String(raw || "").replace(/,/g, "").trim();
    if (cleaned === "") return 6;

    const n = Number(cleaned);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    if (n < 0 || n > 12) return null;
    return n;
  }

  function formatToDecimals(num, decimals) {
    if (!Number.isFinite(num)) return "";
    const fixed = num.toFixed(decimals);
    return formatInputWithCommas(fixed);
  }

  function toRadians(value, unit) {
    const pi = Math.PI;
    if (unit === "rad") return value;
    if (unit === "deg") return value * (pi / 180);
    if (unit === "grad") return value * (pi / 200);
    if (unit === "turn") return value * (2 * pi);
    if (unit === "arcmin") return (value / 60) * (pi / 180);
    if (unit === "arcsec") return (value / 3600) * (pi / 180);
    return NaN;
  }

  function fromRadians(radValue, unit) {
    const pi = Math.PI;
    if (unit === "rad") return radValue;
    if (unit === "deg") return radValue * (180 / pi);
    if (unit === "grad") return radValue * (200 / pi);
    if (unit === "turn") return radValue / (2 * pi);
    if (unit === "arcmin") return (radValue * (180 / pi)) * 60;
    if (unit === "arcsec") return (radValue * (180 / pi)) * 3600;
    return NaN;
  }

  function unitLabel(unit) {
    if (unit === "deg") return "Degrees (°)";
    if (unit === "rad") return "Radians (rad)";
    if (unit === "grad") return "Gradians (gon)";
    if (unit === "turn") return "Turns (rev)";
    if (unit === "arcmin") return "Arcminutes (′)";
    if (unit === "arcsec") return "Arcseconds (″)";
    return "Angle";
  }

  function formatDMSFromDegrees(deg) {
    if (!Number.isFinite(deg)) return "";
    const sign = deg < 0 ? "-" : "";
    const abs = Math.abs(deg);

    const d = Math.floor(abs);
    const minutesFloat = (abs - d) * 60;
    const m = Math.floor(minutesFloat);
    const seconds = (minutesFloat - m) * 60;

    const sRounded = Math.round(seconds * 100) / 100;
    return sign + d + "° " + m + "′ " + sRounded + "″";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!angleValue || !fromUnit || !toUnit) return;

      const decimals = parseDecimalsOrDefault();
      if (decimals === null) {
        setResultError("Decimal places must be a whole number from 0 to 12 (or leave it blank for the default).");
        return;
      }

      const inputVal = toNumber(angleValue.value);
      if (!validateFinite(inputVal, "angle value")) return;

      const from = fromUnit.value;
      const to = toUnit.value;

      const rad = toRadians(inputVal, from);
      if (!validateFinite(rad, "angle conversion")) return;

      const converted = fromRadians(rad, to);
      if (!validateFinite(converted, "converted angle")) return;

      const degAll = fromRadians(rad, "deg");
      const radAll = rad;
      const gradAll = fromRadians(rad, "grad");
      const turnAll = fromRadians(rad, "turn");
      const arcminAll = fromRadians(rad, "arcmin");
      const arcsecAll = fromRadians(rad, "arcsec");

      const piMultiple = radAll / Math.PI;

      const primaryLine = `<p><strong>Converted:</strong> ${formatToDecimals(converted, decimals)} <span>(${unitLabel(to)})</span></p>`;

      let extras = "";
      if (to === "deg") {
        extras += `<p><strong>Degrees in DMS:</strong> ${formatDMSFromDegrees(converted)}</p>`;
      }
      if (to === "rad") {
        extras += `<p><strong>Radians as a multiple of π:</strong> ${formatToDecimals(piMultiple, decimals)}π</p>`;
      }

      const breakdown = `
        <div class="result-breakdown">
          <p><strong>All units (same angle):</strong></p>
          <ul>
            <li>Degrees (°): ${formatToDecimals(degAll, decimals)}</li>
            <li>Radians (rad): ${formatToDecimals(radAll, decimals)} (≈ ${formatToDecimals(piMultiple, decimals)}π)</li>
            <li>Gradians (gon): ${formatToDecimals(gradAll, decimals)}</li>
            <li>Turns (rev): ${formatToDecimals(turnAll, decimals)}</li>
            <li>Arcminutes (′): ${formatToDecimals(arcminAll, decimals)}</li>
            <li>Arcseconds (″): ${formatToDecimals(arcsecAll, decimals)}</li>
          </ul>
        </div>
      `;

      const resultHtml = primaryLine + extras + breakdown;
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Angle Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
