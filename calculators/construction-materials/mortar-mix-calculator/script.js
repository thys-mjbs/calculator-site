document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const mortarVolume = document.getElementById("mortarVolume");
  const volumeUnit = document.getElementById("volumeUnit");
  const mixRatio = document.getElementById("mixRatio");
  const wastePercent = document.getElementById("wastePercent");
  const bagSizeKg = document.getElementById("bagSizeKg");
  const dryFactor = document.getElementById("dryFactor");
  const cementDensity = document.getElementById("cementDensity");
  const sandDensity = document.getElementById("sandDensity");
  const waterCementRatio = document.getElementById("waterCementRatio");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(mortarVolume);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(dryFactor);
  attachLiveFormatting(cementDensity);
  attachLiveFormatting(sandDensity);
  attachLiveFormatting(waterCementRatio);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const mortarVolumeRaw = toNumber(mortarVolume ? mortarVolume.value : "");
      const unit = volumeUnit ? volumeUnit.value : "liters";
      const sandParts = mixRatio ? parseInt(mixRatio.value, 10) : 5;

      const wastePctInput = toNumber(wastePercent ? wastePercent.value : "");
      const wastePct = Number.isFinite(wastePctInput) ? wastePctInput : 10;

      const bagKg = bagSizeKg ? parseInt(bagSizeKg.value, 10) : 50;

      const dryFactorInput = toNumber(dryFactor ? dryFactor.value : "");
      const dryFactorValue = Number.isFinite(dryFactorInput) && dryFactorInput > 0 ? dryFactorInput : 1.33;

      const cementDensityInput = toNumber(cementDensity ? cementDensity.value : "");
      const cementDensityValue =
        Number.isFinite(cementDensityInput) && cementDensityInput > 0 ? cementDensityInput : 1440;

      const sandDensityInput = toNumber(sandDensity ? sandDensity.value : "");
      const sandDensityValue =
        Number.isFinite(sandDensityInput) && sandDensityInput > 0 ? sandDensityInput : 1600;

      const wcrInput = toNumber(waterCementRatio ? waterCementRatio.value : "");
      const wcrValue = Number.isFinite(wcrInput) && wcrInput > 0 ? wcrInput : 0.5;

      // Basic existence guard
      if (!mortarVolume || !volumeUnit || !mixRatio || !bagSizeKg) return;

      // Validation
      if (!validatePositive(mortarVolumeRaw, "mortar volume")) return;
      if (!validateNonNegative(wastePct, "waste percentage")) return;

      if (!Number.isFinite(sandParts) || sandParts <= 0) {
        setResultError("Select a valid mix ratio.");
        return;
      }

      if (!Number.isFinite(bagKg) || bagKg <= 0) {
        setResultError("Select a valid cement bag size.");
        return;
      }

      if (!Number.isFinite(dryFactorValue) || dryFactorValue <= 0) {
        setResultError("Enter a valid dry factor greater than 0.");
        return;
      }

      if (!Number.isFinite(cementDensityValue) || cementDensityValue <= 0) {
        setResultError("Enter a valid cement density greater than 0.");
        return;
      }

      if (!Number.isFinite(sandDensityValue) || sandDensityValue <= 0) {
        setResultError("Enter a valid sand density greater than 0.");
        return;
      }

      if (!Number.isFinite(wcrValue) || wcrValue <= 0) {
        setResultError("Enter a valid water to cement ratio greater than 0.");
        return;
      }

      // Calculation logic
      const wetM3 = unit === "m3" ? mortarVolumeRaw : mortarVolumeRaw / 1000;
      const wetWithWasteM3 = wetM3 * (1 + wastePct / 100);
      const dryIngredientsM3 = wetWithWasteM3 * dryFactorValue;

      const totalParts = 1 + sandParts;
      const cementVolM3 = dryIngredientsM3 * (1 / totalParts);
      const sandVolM3 = dryIngredientsM3 * (sandParts / totalParts);

      const cementKg = cementVolM3 * cementDensityValue;
      const sandKg = sandVolM3 * sandDensityValue;

      const exactBags = cementKg / bagKg;
      const roundedBags = Math.ceil(exactBags);

      const waterLiters = cementKg * wcrValue;

      // Build output HTML
      const wetDisplay = unit === "m3"
        ? `${formatNumberTwoDecimals(wetM3)} m³`
        : `${formatNumberTwoDecimals(mortarVolumeRaw)} L`;

      const resultHtml =
        `<p><strong>Target mortar:</strong> ${wetDisplay}</p>` +
        `<p><strong>With waste:</strong> ${formatNumberTwoDecimals(wetWithWasteM3)} m³ (wet)</p>` +
        `<p><strong>Estimated dry ingredients:</strong> ${formatNumberTwoDecimals(dryIngredientsM3)} m³</p>` +
        `<hr>` +
        `<p><strong>Cement:</strong> ${formatNumberTwoDecimals(cementKg)} kg ` +
        `(${formatNumberTwoDecimals(exactBags)} bags of ${bagKg} kg, buy <strong>${roundedBags}</strong>)</p>` +
        `<p><strong>Sand:</strong> ${formatNumberTwoDecimals(sandVolM3)} m³ ` +
        `(${formatNumberTwoDecimals(sandKg)} kg)</p>` +
        `<p><strong>Water (estimate):</strong> ${formatNumberTwoDecimals(waterLiters)} L</p>` +
        `<hr>` +
        `<p><strong>Mix:</strong> 1 : ${sandParts} (cement : sand). ` +
        `Defaults used where blank: waste 10%, dry factor 1.33, cement 1,440 kg/m³, sand 1,600 kg/m³, water ratio 0.50.</p>`;

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
      const message = "Mortar Mix Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }

  // Clear result on load
  clearResult();
});
