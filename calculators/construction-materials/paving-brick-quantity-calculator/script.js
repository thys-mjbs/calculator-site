document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaM2Input = document.getElementById("areaM2");
  const lengthMInput = document.getElementById("lengthM");
  const widthMInput = document.getElementById("widthM");

  const brickLengthMmInput = document.getElementById("brickLengthMm");
  const brickWidthMmInput = document.getElementById("brickWidthMm");
  const jointGapMmInput = document.getElementById("jointGapMm");
  const wastePercentInput = document.getElementById("wastePercent");
  const bricksPerPackInput = document.getElementById("bricksPerPack");

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
  attachLiveFormatting(areaM2Input);
  attachLiveFormatting(lengthMInput);
  attachLiveFormatting(widthMInput);
  attachLiveFormatting(brickLengthMmInput);
  attachLiveFormatting(brickWidthMmInput);
  attachLiveFormatting(jointGapMmInput);
  attachLiveFormatting(wastePercentInput);
  attachLiveFormatting(bricksPerPackInput);

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

  function formatIntegerWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    return formatInputWithCommas(String(Math.round(n)));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const areaM2 = toNumber(areaM2Input ? areaM2Input.value : "");
      const lengthM = toNumber(lengthMInput ? lengthMInput.value : "");
      const widthM = toNumber(widthMInput ? widthMInput.value : "");

      const brickLengthMm = toNumber(brickLengthMmInput ? brickLengthMmInput.value : "");
      const brickWidthMm = toNumber(brickWidthMmInput ? brickWidthMmInput.value : "");
      const jointGapMm = toNumber(jointGapMmInput ? jointGapMmInput.value : "");
      const wastePercent = toNumber(wastePercentInput ? wastePercentInput.value : "");
      const bricksPerPack = toNumber(bricksPerPackInput ? bricksPerPackInput.value : "");

      // Input existence guard
      if (
        !calculateButton ||
        !resultDiv ||
        !brickLengthMmInput ||
        !brickWidthMmInput ||
        !jointGapMmInput ||
        !wastePercentInput
      ) {
        return;
      }

      // Validate required advanced defaults
      if (!validatePositive(brickLengthMm, "brick length (mm)")) return;
      if (!validatePositive(brickWidthMm, "brick width (mm)")) return;
      if (!validateNonNegative(jointGapMm, "joint gap (mm)")) return;
      if (!validateNonNegative(wastePercent, "waste allowance (%)")) return;

      if (wastePercent > 50) {
        setResultError("Waste allowance above 50% is unusually high. Enter a smaller percentage.");
        return;
      }

      // Determine total area
      let finalAreaM2 = 0;

      if (Number.isFinite(areaM2) && areaM2 > 0) {
        finalAreaM2 = areaM2;
      } else {
        // Need both length and width
        if (!validatePositive(lengthM, "length (m)")) return;
        if (!validatePositive(widthM, "width (m)")) return;
        finalAreaM2 = lengthM * widthM;
      }

      if (!Number.isFinite(finalAreaM2) || finalAreaM2 <= 0) {
        setResultError("Enter a valid total area, or enter both length and width.");
        return;
      }

      if (finalAreaM2 > 20000) {
        setResultError("That area is extremely large for paving bricks. Check your units and try again.");
        return;
      }

      // Convert mm to m
      const brickLengthM = brickLengthMm / 1000;
      const brickWidthM = brickWidthMm / 1000;
      const jointGapM = jointGapMm / 1000;

      // Effective module area (brick + joint on both axes)
      const moduleLengthM = brickLengthM + jointGapM;
      const moduleWidthM = brickWidthM + jointGapM;

      if (moduleLengthM <= 0 || moduleWidthM <= 0) {
        setResultError("Brick size plus joint gap must be greater than 0.");
        return;
      }

      const areaPerBrickM2 = moduleLengthM * moduleWidthM;

      // Bricks required (base)
      const bricksNoWaste = finalAreaM2 / areaPerBrickM2;

      if (!Number.isFinite(bricksNoWaste) || bricksNoWaste <= 0) {
        setResultError("Could not calculate bricks. Check your inputs and try again.");
        return;
      }

      // Waste
      const wasteMultiplier = 1 + wastePercent / 100;
      const bricksWithWaste = Math.ceil(bricksNoWaste * wasteMultiplier);
      const bricksBaseRounded = Math.ceil(bricksNoWaste);

      // Secondary: bricks per m² (approx)
      const bricksPerM2 = 1 / areaPerBrickM2;

      // Optional packs
      let packsHtml = "";
      if (Number.isFinite(bricksPerPack) && bricksPerPack > 0) {
        const packsNeeded = Math.ceil(bricksWithWaste / bricksPerPack);
        packsHtml = `
          <div class="result-row">
            <span class="result-label">Estimated packs/pallets</span>
            <span class="result-value">${formatIntegerWithCommas(packsNeeded)} (size: ${formatIntegerWithCommas(bricksPerPack)} bricks)</span>
          </div>
        `;
      } else if (Number.isFinite(bricksPerPack) && bricksPerPack < 0) {
        setResultError("Enter a valid bricks per pack/pallet value (0 or higher).");
        return;
      }

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span class="result-label">Recommended order quantity</span>
            <span class="result-value">${formatIntegerWithCommas(bricksWithWaste)} bricks</span>
          </div>
          <div class="result-row">
            <span class="result-label">Base quantity (no waste)</span>
            <span class="result-value">${formatIntegerWithCommas(bricksBaseRounded)} bricks</span>
          </div>
          <div class="result-row">
            <span class="result-label">Total area used</span>
            <span class="result-value">${formatNumberTwoDecimals(finalAreaM2)} m²</span>
          </div>
          <div class="result-row">
            <span class="result-label">Effective coverage per brick</span>
            <span class="result-value">${formatNumberTwoDecimals(areaPerBrickM2)} m²</span>
          </div>
          <div class="result-row">
            <span class="result-label">Approx bricks per m²</span>
            <span class="result-value">${formatNumberTwoDecimals(bricksPerM2)} bricks/m²</span>
          </div>
          <div class="result-row">
            <span class="result-label">Waste allowance applied</span>
            <span class="result-value">${formatNumberTwoDecimals(wastePercent)}%</span>
          </div>
          ${packsHtml}
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
      const message = "Paving Brick Quantity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
