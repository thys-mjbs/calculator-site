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

  const modeMetricBlock = document.getElementById("modeMetricBlock");
  const diameterMm = document.getElementById("diameterMm");
  const lengthM = document.getElementById("lengthM");
  const quantityMetric = document.getElementById("quantityMetric");

  const modeUsBlock = document.getElementById("modeUsBlock");
  const barSize = document.getElementById("barSize");
  const lengthFt = document.getElementById("lengthFt");
  const quantityUs = document.getElementById("quantityUs");

  const steelDensity = document.getElementById("steelDensity");

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
  attachLiveFormatting(diameterMm);
  attachLiveFormatting(lengthM);
  attachLiveFormatting(quantityMetric);
  attachLiveFormatting(lengthFt);
  attachLiveFormatting(quantityUs);
  attachLiveFormatting(steelDensity);

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
    if (modeMetricBlock) modeMetricBlock.classList.add("hidden");
    if (modeUsBlock) modeUsBlock.classList.add("hidden");

    if (mode === "us") {
      if (modeUsBlock) modeUsBlock.classList.remove("hidden");
    } else {
      if (modeMetricBlock) modeMetricBlock.classList.remove("hidden");
    }

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
      const mode = modeSelect ? modeSelect.value : "metric";

      const densityInput = toNumber(steelDensity ? steelDensity.value : "");
      const densityKgM3 = Number.isFinite(densityInput) && densityInput > 0 ? densityInput : 7850;

      // Rebar nominal diameters (inches) for US bar sizes
      const usDiametersIn = {
        3: 0.375,
        4: 0.5,
        5: 0.625,
        6: 0.75,
        7: 0.875,
        8: 1.0,
        9: 1.128,
        10: 1.27,
        11: 1.41
      };

      // Parse inputs using toNumber() (from /scripts/main.js)
      let dMm = NaN;
      let lenM = NaN;
      let qty = NaN;

      if (mode === "us") {
        const size = barSize ? parseInt(barSize.value, 10) : NaN;
        const dIn = usDiametersIn[size];

        const lenFtVal = toNumber(lengthFt ? lengthFt.value : "");
        const qtyVal = toNumber(quantityUs ? quantityUs.value : "");

        // Convert to metric for consistent geometry + density approach
        // inch -> mm: *25.4, ft -> m: *0.3048
        dMm = Number.isFinite(dIn) ? dIn * 25.4 : NaN;
        lenM = lenFtVal * 0.3048;
        qty = qtyVal;
      } else {
        dMm = toNumber(diameterMm ? diameterMm.value : "");
        lenM = toNumber(lengthM ? lengthM.value : "");
        qty = toNumber(quantityMetric ? quantityMetric.value : "");
      }

      // Basic existence guard
      if (!resultDiv) return;

      // Validation
      if (!validatePositive(dMm, "bar diameter")) return;
      if (!validatePositive(lenM, "length per bar")) return;
      if (!validatePositive(qty, "quantity")) return;
      if (!validatePositive(densityKgM3, "steel density")) return;

      // Simple realism checks (soft guardrails)
      if (dMm > 80) {
        setResultError("That diameter looks unusually large for rebar. Check your units (mm vs inches).");
        return;
      }
      if (lenM > 60) {
        setResultError("That length looks unusually long for a single bar. Check your units (m vs ft).");
        return;
      }

      // Calculation logic
      const dM = dMm / 1000;
      const areaM2 = Math.PI * (dM * dM) / 4;
      const volumePerBarM3 = areaM2 * lenM;
      const massPerBarKg = volumePerBarM3 * densityKgM3;
      const totalKg = massPerBarKg * qty;

      const kgPerM = (areaM2 * densityKgM3);
      const lbPerKg = 2.2046226218;
      const totalLb = totalKg * lbPerKg;
      const perBarLb = massPerBarKg * lbPerKg;

      const lenFtComputed = lenM / 0.3048;
      const kgPerFt = kgPerM * 0.3048;
      const lbPerFt = kgPerFt * lbPerKg;

      // Build output HTML
      const resultHtml = `
        <p><strong>Total rebar weight:</strong> ${formatNumberTwoDecimals(totalKg)} kg (${formatNumberTwoDecimals(totalLb)} lb)</p>
        <p><strong>Weight per bar:</strong> ${formatNumberTwoDecimals(massPerBarKg)} kg (${formatNumberTwoDecimals(perBarLb)} lb)</p>
        <p><strong>Unit weight:</strong> ${formatNumberTwoDecimals(kgPerM)} kg/m (${formatNumberTwoDecimals(lbPerFt)} lb/ft)</p>
        <p><strong>Inputs used:</strong> Diameter ${formatNumberTwoDecimals(dMm)} mm, Length ${formatNumberTwoDecimals(lenM)} m (${formatNumberTwoDecimals(lenFtComputed)} ft), Quantity ${formatNumberTwoDecimals(qty)}, Density ${formatNumberTwoDecimals(densityKgM3)} kg/m³</p>
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
      const message = "Rebar Weight Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
