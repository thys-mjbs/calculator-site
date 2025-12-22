document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaValue = document.getElementById("areaValue");
  const areaUnit = document.getElementById("areaUnit");
  const thicknessValue = document.getElementById("thicknessValue");
  const thicknessUnit = document.getElementById("thicknessUnit");
  const wastePercent = document.getElementById("wastePercent");
  const densityLbFt3 = document.getElementById("densityLbFt3");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used for this calculator)

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
  attachLiveFormatting(areaValue);
  attachLiveFormatting(thicknessValue);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(densityLbFt3);

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

  // (not used)

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const area = toNumber(areaValue ? areaValue.value : "");
      const thickness = toNumber(thicknessValue ? thicknessValue.value : "");
      const waste = toNumber(wastePercent ? wastePercent.value : "");
      const density = toNumber(densityLbFt3 ? densityLbFt3.value : "");

      // Basic existence guard
      if (!areaValue || !areaUnit || !thicknessValue || !thicknessUnit) return;

      // Validation (required fields)
      if (!validatePositive(area, "area")) return;
      if (!validatePositive(thickness, "thickness")) return;

      // Optional fields with defaults
      const wastePct = Number.isFinite(waste) ? waste : 0;
      if (!validateNonNegative(wastePct, "waste factor")) return;
      if (wastePct > 50) {
        setResultError("Waste factor looks too high. Enter 0% to 50%.");
        return;
      }

      const densityLbPerFt3 = Number.isFinite(density) ? density : 145;
      if (!validatePositive(densityLbPerFt3, "asphalt density")) return;
      if (densityLbPerFt3 < 100 || densityLbPerFt3 > 170) {
        setResultError(
          "Asphalt density looks unusual. Use a value roughly between 100 and 170 lb/ft³, or leave it blank to use 145."
        );
        return;
      }

      // Unit conversions to internal ft² and ft
      let areaFt2 = area;
      const aUnit = areaUnit.value;

      if (aUnit === "m2") {
        areaFt2 = area * 10.76391041671;
      } else if (aUnit === "yd2") {
        areaFt2 = area * 9;
      } else {
        areaFt2 = area;
      }

      let thicknessFt = thickness;
      const tUnit = thicknessUnit.value;

      if (tUnit === "mm") {
        thicknessFt = thickness / 304.8;
      } else if (tUnit === "cm") {
        thicknessFt = thickness / 30.48;
      } else if (tUnit === "in") {
        thicknessFt = thickness / 12;
      } else {
        thicknessFt = thickness;
      }

      if (!Number.isFinite(areaFt2) || areaFt2 <= 0) {
        setResultError("Enter a valid area value.");
        return;
      }
      if (!Number.isFinite(thicknessFt) || thicknessFt <= 0) {
        setResultError("Enter a valid thickness value.");
        return;
      }

      // Calculation
      const wasteFactor = 1 + wastePct / 100;
      const volumeFt3Raw = areaFt2 * thicknessFt;
      const volumeFt3 = volumeFt3Raw * wasteFactor;

      const volumeYd3 = volumeFt3 / 27;
      const volumeM3 = volumeFt3 / 35.3146667215;

      const weightLb = volumeFt3 * densityLbPerFt3;
      const weightShortTons = weightLb / 2000;
      const weightMetricTonnes = weightLb / 2204.62262185;

      // Supporting figure: typical 1-ton increments (rough truckload guidance)
      const oneShortTonLoads = weightShortTons;
      const oneTonneLoads = weightMetricTonnes;

      // Build output HTML
      const html = `
        <p><strong>Estimated asphalt needed:</strong></p>
        <ul>
          <li><strong>Volume:</strong> ${formatNumberTwoDecimals(volumeYd3)} yd³ (${formatNumberTwoDecimals(volumeM3)} m³)</li>
          <li><strong>Weight:</strong> ${formatNumberTwoDecimals(weightShortTons)} tons (US) (${formatNumberTwoDecimals(weightMetricTonnes)} tonnes)</li>
        </ul>
        <p><strong>Details used:</strong></p>
        <ul>
          <li>Area: ${formatNumberTwoDecimals(area)} ${aUnit}</li>
          <li>Thickness: ${formatNumberTwoDecimals(thickness)} ${tUnit}</li>
          <li>Waste factor: ${formatNumberTwoDecimals(wastePct)}%</li>
          <li>Density: ${formatNumberTwoDecimals(densityLbPerFt3)} lb/ft³</li>
        </ul>
        <p><strong>Quick ordering check:</strong> About ${formatNumberTwoDecimals(oneShortTonLoads)} US tons (or ${formatNumberTwoDecimals(oneTonneLoads)} tonnes) total.</p>
      `;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Asphalt Volume Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
