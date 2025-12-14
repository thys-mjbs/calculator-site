document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalVolumeInput = document.getElementById("totalVolume");
  const volumeUnitSelect = document.getElementById("volumeUnit");
  const ratioCementInput = document.getElementById("ratioCement");
  const ratioSandInput = document.getElementById("ratioSand");
  const ratioStoneInput = document.getElementById("ratioStone");
  const wastePercentInput = document.getElementById("wastePercent");
  const bagSizeSelect = document.getElementById("bagSize");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(totalVolumeInput);
  attachLiveFormatting(ratioCementInput);
  attachLiveFormatting(ratioSandInput);
  attachLiveFormatting(ratioStoneInput);
  attachLiveFormatting(wastePercentInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const totalVolumeRaw = toNumber(totalVolumeInput ? totalVolumeInput.value : "");
      const ratioCement = toNumber(ratioCementInput ? ratioCementInput.value : "");
      const ratioSand = toNumber(ratioSandInput ? ratioSandInput.value : "");
      const ratioStone = toNumber(ratioStoneInput ? ratioStoneInput.value : "");
      const wastePercent = toNumber(wastePercentInput ? wastePercentInput.value : "");

      // Basic existence guard
      if (
        !totalVolumeInput ||
        !volumeUnitSelect ||
        !ratioCementInput ||
        !ratioSandInput ||
        !ratioStoneInput ||
        !wastePercentInput ||
        !bagSizeSelect
      ) {
        return;
      }

      // Validation
      if (!validatePositive(totalVolumeRaw, "total mix volume")) return;
      if (!validatePositive(ratioCement, "cement parts")) return;
      if (!validatePositive(ratioSand, "sand parts")) return;
      if (!validatePositive(ratioStone, "stone parts")) return;
      if (!validateNonNegative(wastePercent, "waste allowance (%)")) return;

      const totalParts = ratioCement + ratioSand + ratioStone;
      if (!Number.isFinite(totalParts) || totalParts <= 0) {
        setResultError("Enter a valid ratio. The total parts must be greater than 0.");
        return;
      }

      // Convert total volume to liters for consistent math
      const unit = volumeUnitSelect.value;
      let totalLiters = totalVolumeRaw;

      if (unit === "m3") {
        totalLiters = totalVolumeRaw * 1000;
      }

      if (!Number.isFinite(totalLiters) || totalLiters <= 0) {
        setResultError("Enter a valid total mix volume.");
        return;
      }

      // Apply waste
      const wasteFactor = 1 + wastePercent / 100;
      const adjustedLiters = totalLiters * wasteFactor;

      // Split by ratio (volume-based)
      const cementLiters = adjustedLiters * (ratioCement / totalParts);
      const sandLiters = adjustedLiters * (ratioSand / totalParts);
      const stoneLiters = adjustedLiters * (ratioStone / totalParts);

      const adjustedM3 = adjustedLiters / 1000;
      const cementM3 = cementLiters / 1000;
      const sandM3 = sandLiters / 1000;
      const stoneM3 = stoneLiters / 1000;

      // Cement bag estimate (rough planning)
      // Assumption: cement bulk density ~ 1440 kg/m3
      // 50kg bag ~ 0.0347 m3 = 34.72 L, 25kg bag ~ 17.36 L
      const bagKg = bagSizeSelect.value === "25" ? 25 : 50;
      const bagVolumeLiters = bagKg === 25 ? 17.36 : 34.72;
      const bagsExact = cementLiters / bagVolumeLiters;
      const bagsRoundedUp = Math.ceil(bagsExact);

      const ratioText =
        Math.round(ratioCement) +
        ":" +
        Math.round(ratioSand) +
        ":" +
        Math.round(ratioStone);

      const resultHtml = `
        <p><strong>Adjusted total mix:</strong> ${formatNumberTwoDecimals(adjustedM3)} m³ (${formatNumberTwoDecimals(adjustedLiters)} L)</p>
        <p><strong>Ratio used:</strong> ${ratioText} (cement:sand:stone) with ${formatNumberTwoDecimals(wastePercent)}% waste allowance</p>
        <hr>
        <p><strong>Cement:</strong> ${formatNumberTwoDecimals(cementM3)} m³ (${formatNumberTwoDecimals(cementLiters)} L)</p>
        <p><strong>Sand:</strong> ${formatNumberTwoDecimals(sandM3)} m³ (${formatNumberTwoDecimals(sandLiters)} L)</p>
        <p><strong>Stone:</strong> ${formatNumberTwoDecimals(stoneM3)} m³ (${formatNumberTwoDecimals(stoneLiters)} L)</p>
        <hr>
        <p><strong>Estimated cement bags (${bagKg} kg):</strong> ${bagsRoundedUp} bag(s) <span style="font-weight:400;">(estimate: ${formatNumberTwoDecimals(bagsExact)} bags)</span></p>
        <p style="font-size:12px; color:#555; margin-top:8px;">
          Bag counts are a rough planning estimate based on typical cement bulk density. Confirm with your supplier or mix design if accuracy matters.
        </p>
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
      const message = "Cement/Sand/Stone Mix Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
