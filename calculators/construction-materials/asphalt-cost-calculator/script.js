document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lengthMetersInput = document.getElementById("lengthMeters");
  const widthMetersInput = document.getElementById("widthMeters");
  const installedRatePerM2Input = document.getElementById("installedRatePerM2");

  const thicknessMmInput = document.getElementById("thicknessMm");
  const wastePercentInput = document.getElementById("wastePercent");
  const densityKgM3Input = document.getElementById("densityKgM3");
  const mixCostPerTonInput = document.getElementById("mixCostPerTon");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(lengthMetersInput);
  attachLiveFormatting(widthMetersInput);
  attachLiveFormatting(installedRatePerM2Input);
  attachLiveFormatting(thicknessMmInput);
  attachLiveFormatting(wastePercentInput);
  attachLiveFormatting(densityKgM3Input);
  attachLiveFormatting(mixCostPerTonInput);

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
      // Parse required inputs
      const lengthMeters = toNumber(lengthMetersInput ? lengthMetersInput.value : "");
      const widthMeters = toNumber(widthMetersInput ? widthMetersInput.value : "");
      const installedRatePerM2 = toNumber(
        installedRatePerM2Input ? installedRatePerM2Input.value : ""
      );

      // Validation (required)
      if (!validatePositive(lengthMeters, "length (metres)")) return;
      if (!validatePositive(widthMeters, "width (metres)")) return;
      if (!validatePositive(installedRatePerM2, "installed price (per m²)")) return;

      // Defaults for optional advanced inputs
      const thicknessMmRaw = toNumber(thicknessMmInput ? thicknessMmInput.value : "");
      const wastePercentRaw = toNumber(wastePercentInput ? wastePercentInput.value : "");
      const densityKgM3Raw = toNumber(densityKgM3Input ? densityKgM3Input.value : "");
      const mixCostPerTonRaw = toNumber(mixCostPerTonInput ? mixCostPerTonInput.value : "");

      const thicknessMm = Number.isFinite(thicknessMmRaw) && thicknessMmRaw > 0 ? thicknessMmRaw : 50;
      const wastePercent = Number.isFinite(wastePercentRaw) && wastePercentRaw >= 0 ? wastePercentRaw : 5;
      const densityKgM3 = Number.isFinite(densityKgM3Raw) && densityKgM3Raw > 0 ? densityKgM3Raw : 2320;

      // Validate optional inputs only if user provided something meaningful
      if (thicknessMmInput && thicknessMmInput.value.trim() !== "") {
        if (!validatePositive(thicknessMmRaw, "asphalt thickness (mm)")) return;
      }
      if (wastePercentInput && wastePercentInput.value.trim() !== "") {
        if (!validateNonNegative(wastePercentRaw, "waste allowance (%)")) return;
      }
      if (densityKgM3Input && densityKgM3Input.value.trim() !== "") {
        if (!validatePositive(densityKgM3Raw, "asphalt density (kg/m³)")) return;
      }
      if (mixCostPerTonInput && mixCostPerTonInput.value.trim() !== "") {
        if (!validateNonNegative(mixCostPerTonRaw, "mix cost (per ton)")) return;
      }

      // Core calculations
      const areaM2 = lengthMeters * widthMeters;
      const totalInstalledCost = areaM2 * installedRatePerM2;

      // Advanced: tonnage estimate
      const thicknessM = thicknessMm / 1000;
      const baseVolumeM3 = areaM2 * thicknessM;
      const allowanceFactor = 1 + wastePercent / 100;
      const adjustedVolumeM3 = baseVolumeM3 * allowanceFactor;
      const massKg = adjustedVolumeM3 * densityKgM3;
      const metricTons = massKg / 1000;

      // Optional: material cost estimate (sanity-check)
      let materialCost = null;
      let materialSharePercent = null;

      if (Number.isFinite(mixCostPerTonRaw) && mixCostPerTonRaw > 0) {
        materialCost = metricTons * mixCostPerTonRaw;
        if (totalInstalledCost > 0) {
          materialSharePercent = (materialCost / totalInstalledCost) * 100;
        }
      }

      // Build output HTML
      const totalCostFormatted = formatNumberTwoDecimals(totalInstalledCost);
      const rateFormatted = formatNumberTwoDecimals(installedRatePerM2);
      const areaFormatted = formatNumberTwoDecimals(areaM2);
      const tonsFormatted = formatNumberTwoDecimals(metricTons);
      const thicknessFormatted = formatNumberTwoDecimals(thicknessMm);
      const wasteFormatted = formatNumberTwoDecimals(wastePercent);
      const densityFormatted = formatNumberTwoDecimals(densityKgM3);

      let html = "";
      html += `<p><strong>Estimated total installed cost:</strong> ${totalCostFormatted}</p>`;
      html += `<p><strong>Area:</strong> ${areaFormatted} m²</p>`;
      html += `<p><strong>Installed price used:</strong> ${rateFormatted} per m²</p>`;

      html += `<hr />`;
      html += `<p><strong>Estimated asphalt quantity (optional):</strong> ${tonsFormatted} tons</p>`;
      html += `<p><strong>Assumptions used for quantity:</strong> thickness ${thicknessFormatted} mm, allowance ${wasteFormatted}%, density ${densityFormatted} kg/m³</p>`;

      if (materialCost !== null) {
        const materialCostFormatted = formatNumberTwoDecimals(materialCost);
        const shareText =
          materialSharePercent !== null && Number.isFinite(materialSharePercent)
            ? `${formatNumberTwoDecimals(materialSharePercent)}%`
            : "";

        html += `<hr />`;
        html += `<p><strong>Estimated material cost (sanity check):</strong> ${materialCostFormatted}</p>`;
        if (shareText) {
          html += `<p><strong>Material share of installed total:</strong> ${shareText}</p>`;
        }
        html += `<p>This material estimate does not replace the installed price. It helps you sanity-check quote realism.</p>`;
      } else {
        html += `<p>If you enter an asphalt mix cost per ton, the calculator will estimate a rough material cost for sanity checking.</p>`;
      }

      const resultHtml = html;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Asphalt Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
