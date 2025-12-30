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
  const modeBlockArea = document.getElementById("modeBlockArea");
  const modeBlockDimensions = document.getElementById("modeBlockDimensions");

  const areaM2 = document.getElementById("areaM2");
  const lengthM = document.getElementById("lengthM");
  const widthM = document.getElementById("widthM");

  const coveragePerBag = document.getElementById("coveragePerBag");
  const wastagePercent = document.getElementById("wastagePercent");
  const bagKg = document.getElementById("bagKg");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(areaM2);
  attachLiveFormatting(lengthM);
  attachLiveFormatting(widthM);
  attachLiveFormatting(coveragePerBag);
  attachLiveFormatting(wastagePercent);
  attachLiveFormatting(bagKg);

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
    if (modeBlockArea) modeBlockArea.classList.add("hidden");
    if (modeBlockDimensions) modeBlockDimensions.classList.add("hidden");

    if (mode === "dimensions") {
      if (modeBlockDimensions) modeBlockDimensions.classList.remove("hidden");
    } else {
      if (modeBlockArea) modeBlockArea.classList.remove("hidden");
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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "area";

      // Defaults (used when optional fields are blank)
      const defaultCoverage = 4.0; // m² per bag (common midpoint)
      const defaultWastage = 10; // %
      const defaultBagKg = 20; // kg

      // Parse advanced inputs (optional)
      const coverageInput = toNumber(coveragePerBag ? coveragePerBag.value : "");
      const wastageInput = toNumber(wastagePercent ? wastagePercent.value : "");
      const bagKgInput = toNumber(bagKg ? bagKg.value : "");

      const coverage = Number.isFinite(coverageInput) && coverageInput > 0 ? coverageInput : defaultCoverage;
      const wastageRaw = Number.isFinite(wastageInput) && wastageInput >= 0 ? wastageInput : defaultWastage;
      const wastage = clamp(wastageRaw, 0, 50);
      const bagSizeKg = Number.isFinite(bagKgInput) && bagKgInput > 0 ? bagKgInput : defaultBagKg;

      // Determine area
      let area = 0;

      if (mode === "dimensions") {
        const L = toNumber(lengthM ? lengthM.value : "");
        const W = toNumber(widthM ? widthM.value : "");

        if (!validatePositive(L, "length (m)")) return;
        if (!validatePositive(W, "width (m)")) return;

        area = L * W;
      } else {
        const A = toNumber(areaM2 ? areaM2.value : "");
        if (!validatePositive(A, "area (m²)")) return;
        area = A;
      }

      // Validate advanced-derived values
      if (!validatePositive(coverage, "coverage per bag (m²)")) return;
      if (!validateNonNegative(wastage, "wastage (%)")) return;
      if (!validatePositive(bagSizeKg, "bag size (kg)")) return;

      // Calculation
      const effectiveArea = area * (1 + wastage / 100);
      const bagsExact = effectiveArea / coverage;
      const bagsToBuy = Math.ceil(bagsExact);
      const totalKg = bagsToBuy * bagSizeKg;

      const kgPerM2 = bagSizeKg / coverage;
      const kgPerM2Effective = totalKg / effectiveArea;

      // Output HTML
      const resultHtml = `
        <p><strong>Bags to buy:</strong> ${bagsToBuy} (rounded up)</p>
        <p><strong>Base area:</strong> ${formatNumberTwoDecimals(area)} m²</p>
        <p><strong>Area with wastage (${formatNumberTwoDecimals(wastage)}%):</strong> ${formatNumberTwoDecimals(effectiveArea)} m²</p>
        <p><strong>Coverage used:</strong> ${formatNumberTwoDecimals(coverage)} m² per ${formatNumberTwoDecimals(bagSizeKg)} kg bag</p>
        <p><strong>Total adhesive weight:</strong> ${formatNumberTwoDecimals(totalKg)} kg</p>
        <p><strong>Quick insight:</strong> This estimate assumes about ${formatNumberTwoDecimals(kgPerM2)} kg of adhesive per m² (your settings). With whole bags, your actual allowance is about ${formatNumberTwoDecimals(kgPerM2Effective)} kg per m² over the effective area.</p>
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
      const message = "Tile Adhesive Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
