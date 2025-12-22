document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const volumeInput = document.getElementById("volumeInput");
  const unitSelect = document.getElementById("unitSelect");
  const materialSelect = document.getElementById("materialSelect");
  const customDensityInput = document.getElementById("customDensityInput");
  const adjustmentPercentInput = document.getElementById("adjustmentPercentInput");
  const truckCapacityInput = document.getElementById("truckCapacityInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(volumeInput);
  attachLiveFormatting(customDensityInput);
  attachLiveFormatting(adjustmentPercentInput);
  attachLiveFormatting(truckCapacityInput);

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

  function validatePercentRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    if (value < min || value > max) {
      setResultError("Enter a " + fieldLabel + " between " + min + "% and " + max + "%.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const densitiesKgPerM3 = {
    gravel: { label: "Gravel (typical bulk)", density: 1700 },
    crushed_stone: { label: "Crushed stone (typical bulk)", density: 1600 },
    sand: { label: "Sand (typical bulk)", density: 1600 },
    limestone: { label: "Limestone (typical bulk)", density: 1500 },
    granite: { label: "Granite (typical bulk)", density: 1600 },
    recycled_concrete: { label: "Recycled concrete (typical bulk)", density: 1800 }
  };

  function volumeToM3(volume, unit) {
    if (unit === "m3") return volume;
    if (unit === "yd3") return volume * 0.764554857984;
    if (unit === "ft3") return volume * 0.028316846592;
    return volume;
  }

  function formatWithCommasNoDecimals(n) {
    const rounded = Math.round(n);
    return rounded.toLocaleString();
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const volumeRaw = toNumber(volumeInput ? volumeInput.value : "");
      const unit = unitSelect ? unitSelect.value : "m3";
      const materialKey = materialSelect ? materialSelect.value : "gravel";
      const customDensityRaw = toNumber(customDensityInput ? customDensityInput.value : "");
      const adjustmentRaw = toNumber(adjustmentPercentInput ? adjustmentPercentInput.value : "");
      const truckCapacityRaw = toNumber(truckCapacityInput ? truckCapacityInput.value : "");

      // Basic existence guard
      if (!volumeInput || !unitSelect || !materialSelect || !customDensityInput || !adjustmentPercentInput || !truckCapacityInput) {
        return;
      }

      // Validation
      if (!validatePositive(volumeRaw, "volume")) return;

      let adjustmentPercent = 0;
      if (Number.isFinite(adjustmentRaw) && adjustmentPercentInput.value.trim() !== "") {
        if (!validatePercentRange(adjustmentRaw, "density adjustment", -30, 60)) return;
        adjustmentPercent = adjustmentRaw;
      }

      let densityUsed = 0;
      let densityLabel = "";

      if (materialKey === "custom") {
        if (!validatePositive(customDensityRaw, "custom density (kg/m³)")) return;
        densityUsed = customDensityRaw;
        densityLabel = "Custom density";
      } else {
        const preset = densitiesKgPerM3[materialKey];
        densityUsed = preset ? preset.density : 0;
        densityLabel = preset ? preset.label : "Selected material";
        if (!validatePositive(densityUsed, "density")) return;
      }

      const volumeM3 = volumeToM3(volumeRaw, unit);
      if (!validatePositive(volumeM3, "volume")) return;

      const effectiveDensity = densityUsed * (1 + adjustmentPercent / 100);
      if (!validatePositive(effectiveDensity, "effective density")) return;

      // Calculation logic
      const totalKg = volumeM3 * effectiveDensity;
      const totalTonnes = totalKg / 1000;

      const tonnesText = formatNumberTwoDecimals(totalTonnes);
      const kgText = formatWithCommasNoDecimals(totalKg);

      const volumeM3Text = formatNumberTwoDecimals(volumeM3);
      const densityText = formatWithCommasNoDecimals(densityUsed);
      const effectiveDensityText = formatWithCommasNoDecimals(effectiveDensity);

      const tonnesPerM3 = effectiveDensity / 1000;
      const tonnesPerM3Text = formatNumberTwoDecimals(tonnesPerM3);

      const tonnesPerYd3 = (effectiveDensity * 0.764554857984) / 1000;
      const tonnesPerYd3Text = formatNumberTwoDecimals(tonnesPerYd3);

      let truckloadsHtml = "";
      if (truckCapacityInput.value.trim() !== "") {
        if (!validatePositive(truckCapacityRaw, "truck capacity (tonnes)")) return;
        const loads = Math.ceil(totalTonnes / truckCapacityRaw);
        const loadsText = loads.toLocaleString();
        const capacityText = formatNumberTwoDecimals(truckCapacityRaw);
        truckloadsHtml = `<p><strong>Estimated truckloads:</strong> ${loadsText} (at ${capacityText} t per load)</p>`;
      }

      const adjustmentLine =
        adjustmentPercentInput.value.trim() === ""
          ? "0%"
          : formatNumberTwoDecimals(adjustmentPercent) + "%";

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated total weight:</strong> ${tonnesText} t (${kgText} kg)</p>
        <p><strong>Volume (converted):</strong> ${volumeM3Text} m³</p>
        <p><strong>Material / density used:</strong> ${densityLabel} (${densityText} kg/m³)</p>
        <p><strong>Adjustment applied:</strong> ${adjustmentLine} → <strong>effective density</strong> ${effectiveDensityText} kg/m³</p>
        <p><strong>Quick reference:</strong> ${tonnesPerM3Text} t per m³ (about ${tonnesPerYd3Text} t per yd³)</p>
        ${truckloadsHtml}
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
      const message = "Aggregate Weight Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
