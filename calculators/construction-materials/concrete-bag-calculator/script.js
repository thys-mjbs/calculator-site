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

  const volumeM3 = document.getElementById("volumeM3");

  const slabLengthM = document.getElementById("slabLengthM");
  const slabWidthM = document.getElementById("slabWidthM");
  const slabThicknessMm = document.getElementById("slabThicknessMm");

  const wastePercent = document.getElementById("wastePercent");

  const bagPreset = document.getElementById("bagPreset");
  const customYieldBlock = document.getElementById("customYieldBlock");
  const customYieldM3 = document.getElementById("customYieldM3");

  const modeBlockVolume = document.getElementById("modeBlockVolume");
  const modeBlockSlab = document.getElementById("modeBlockSlab");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(volumeM3);
  attachLiveFormatting(slabLengthM);
  attachLiveFormatting(slabWidthM);
  attachLiveFormatting(slabThicknessMm);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(customYieldM3);

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
    if (modeBlockVolume) modeBlockVolume.classList.add("hidden");
    if (modeBlockSlab) modeBlockSlab.classList.add("hidden");

    if (mode === "slab") {
      if (modeBlockSlab) modeBlockSlab.classList.remove("hidden");
    } else {
      if (modeBlockVolume) modeBlockVolume.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
  }

  function updateCustomYieldVisibility() {
    if (!bagPreset || !customYieldBlock) return;
    if (bagPreset.value === "custom") {
      customYieldBlock.classList.remove("hidden");
    } else {
      customYieldBlock.classList.add("hidden");
    }
    clearResult();
  }

  if (bagPreset) {
    updateCustomYieldVisibility();
    bagPreset.addEventListener("change", updateCustomYieldVisibility);
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
      const mode = modeSelect ? modeSelect.value : "volume";

      const wastePct = toNumber(wastePercent ? wastePercent.value : "");
      if (!validateNonNegative(wastePct, "waste allowance (%)")) return;

      let baseVolumeM3 = 0;

      if (mode === "slab") {
        const lenM = toNumber(slabLengthM ? slabLengthM.value : "");
        const widM = toNumber(slabWidthM ? slabWidthM.value : "");
        const thickMm = toNumber(slabThicknessMm ? slabThicknessMm.value : "");

        if (!validatePositive(lenM, "slab length (m)")) return;
        if (!validatePositive(widM, "slab width (m)")) return;
        if (!validatePositive(thickMm, "slab thickness (mm)")) return;

        const thickM = thickMm / 1000;
        baseVolumeM3 = lenM * widM * thickM;
      } else {
        const vol = toNumber(volumeM3 ? volumeM3.value : "");
        if (!validatePositive(vol, "concrete volume (m³)")) return;
        baseVolumeM3 = vol;
      }

      // Determine yield per bag (m³ per bag)
      let yieldPerBagM3 = 0;

      if (bagPreset && bagPreset.value === "custom") {
        const customYield = toNumber(customYieldM3 ? customYieldM3.value : "");
        if (!validatePositive(customYield, "yield per bag (m³)")) return;
        yieldPerBagM3 = customYield;
      } else {
        const preset = bagPreset ? bagPreset.value : "40";
        // Typical yield estimates. These can vary by brand, moisture, and mix.
        if (preset === "20") yieldPerBagM3 = 0.01;
        else if (preset === "25") yieldPerBagM3 = 0.012;
        else if (preset === "40") yieldPerBagM3 = 0.02;
        else if (preset === "50") yieldPerBagM3 = 0.023;
        else yieldPerBagM3 = 0.02;
      }

      if (!validatePositive(yieldPerBagM3, "bag yield")) return;

      const multiplier = 1 + wastePct / 100;
      const totalVolumeM3 = baseVolumeM3 * multiplier;

      const rawBags = totalVolumeM3 / yieldPerBagM3;
      const bagsRounded = Math.ceil(rawBags);

      // Total weight estimate (based on preset bag size if chosen; otherwise unknown)
      let bagWeightKg = 0;
      if (bagPreset && bagPreset.value !== "custom") {
        bagWeightKg = Number(bagPreset.value);
      }
      const totalWeightKg = bagWeightKg > 0 ? bagsRounded * bagWeightKg : null;

      const purchasedVolumeM3 = bagsRounded * yieldPerBagM3;
      const leftoverM3 = purchasedVolumeM3 - totalVolumeM3;

      const baseVolumeStr = formatNumberTwoDecimals(baseVolumeM3);
      const totalVolumeStr = formatNumberTwoDecimals(totalVolumeM3);
      const yieldStr = formatNumberTwoDecimals(yieldPerBagM3);
      const rawBagsStr = formatNumberTwoDecimals(rawBags);
      const purchasedVolumeStr = formatNumberTwoDecimals(purchasedVolumeM3);
      const leftoverStr = formatNumberTwoDecimals(leftoverM3);

      const resultHtml = `
        <p><strong>Base volume:</strong> ${baseVolumeStr} m³</p>
        <p><strong>Volume with waste (${formatNumberTwoDecimals(wastePct)}%):</strong> ${totalVolumeStr} m³</p>
        <p><strong>Yield per bag:</strong> ${yieldStr} m³</p>
        <p><strong>Bags needed (exact):</strong> ${rawBagsStr}</p>
        <p><strong>Bags to buy (rounded up):</strong> ${bagsRounded}</p>
        ${totalWeightKg !== null ? `<p><strong>Total bag weight:</strong> ${formatNumberTwoDecimals(totalWeightKg)} kg</p>` : ""}
        <p><strong>Estimated volume from purchased bags:</strong> ${purchasedVolumeStr} m³</p>
        <p><strong>Estimated leftover after pour:</strong> ${leftoverStr} m³</p>
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
      const message = "Concrete Bag Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
