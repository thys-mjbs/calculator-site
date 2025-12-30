document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaUnit = document.getElementById("areaUnit");
  const roofArea = document.getElementById("roofArea");
  const wastePercent = document.getElementById("wastePercent");
  const bundleCoverage = document.getElementById("bundleCoverage");
  const shinglesPerBundle = document.getElementById("shinglesPerBundle");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(roofArea);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(bundleCoverage);
  attachLiveFormatting(shinglesPerBundle);

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

  // Not used
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
  // 6) CALCULATOR-SPECIFIC HELPERS
  // ------------------------------------------------------------
  const SQ_FT_PER_SQUARE = 100;
  const SQ_M_PER_SQUARE = 9.290304; // 100 ft² in m²

  function defaultCoveragePerBundle(unit) {
    // Typical asphalt shingles: 3 bundles per square
    // 1 square = 100 ft² = 9.290304 m²
    if (unit === "ft2") return SQ_FT_PER_SQUARE / 3; // 33.333... ft²
    return SQ_M_PER_SQUARE / 3; // 3.096768 m²
  }

  function setDefaultAdvancedValues() {
    const unit = areaUnit ? areaUnit.value : "m2";

    if (wastePercent && (wastePercent.value === "" || wastePercent.value.trim() === "0")) {
      wastePercent.value = "10";
    }

    if (bundleCoverage && (bundleCoverage.value === "" || bundleCoverage.value.trim() === "0")) {
      bundleCoverage.value = formatNumberTwoDecimals(defaultCoveragePerBundle(unit));
    }
  }

  setDefaultAdvancedValues();

  if (areaUnit) {
    areaUnit.addEventListener("change", function () {
      // Only auto-fill bundle coverage if the user has not set something meaningful
      const current = toNumber(bundleCoverage ? bundleCoverage.value : "");
      if (!Number.isFinite(current) || current <= 0) {
        if (bundleCoverage) {
          bundleCoverage.value = formatNumberTwoDecimals(defaultCoveragePerBundle(areaUnit.value));
        }
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const unit = areaUnit ? areaUnit.value : "m2";
      const area = toNumber(roofArea ? roofArea.value : "");
      let waste = toNumber(wastePercent ? wastePercent.value : "");
      let coverage = toNumber(bundleCoverage ? bundleCoverage.value : "");
      const shinglesEachBundle = toNumber(shinglesPerBundle ? shinglesPerBundle.value : "");

      // Basic existence guard
      if (!roofArea || !wastePercent || !bundleCoverage || !areaUnit) return;

      // Defaults for optional inputs
      if (!Number.isFinite(waste) || waste < 0) waste = 10;
      if (!Number.isFinite(coverage) || coverage <= 0) coverage = defaultCoveragePerBundle(unit);

      // Validation
      if (!validatePositive(area, "roof area")) return;

      if (!validateNonNegative(waste, "waste allowance")) return;
      if (waste > 50) {
        setResultError("Waste allowance looks too high. Enter a percent between 0 and 50.");
        return;
      }

      if (!validatePositive(coverage, "bundle coverage")) return;

      if (Number.isFinite(shinglesEachBundle) && shinglesEachBundle < 0) {
        setResultError("Enter a valid shingles-per-bundle value (leave blank if unknown).");
        return;
      }

      // Calculation logic
      const effectiveArea = area * (1 + waste / 100);
      const rawBundles = effectiveArea / coverage;
      const bundlesToBuy = Math.ceil(rawBundles);

      const squaresEquivalent =
        unit === "ft2"
          ? effectiveArea / SQ_FT_PER_SQUARE
          : effectiveArea / SQ_M_PER_SQUARE;

      const totalCoverageFromPurchase = bundlesToBuy * coverage;
      const surplusArea = totalCoverageFromPurchase - effectiveArea;

      let shinglesEstimateHtml = "";
      if (Number.isFinite(shinglesEachBundle) && shinglesEachBundle > 0) {
        const shinglesNeeded = bundlesToBuy * shinglesEachBundle;
        shinglesEstimateHtml = `<p><strong>Estimated shingles:</strong> ${formatInputWithCommas(String(Math.round(shinglesNeeded)))}</p>`;
      }

      // Build output HTML
      const unitLabel = unit === "ft2" ? "ft²" : "m²";
      const coverageLabel = unit === "ft2" ? "ft² per bundle" : "m² per bundle";

      const resultHtml = `
        <p><strong>Bundles to buy (rounded up):</strong> ${formatInputWithCommas(String(bundlesToBuy))}</p>
        <p><strong>Raw bundles (before rounding):</strong> ${formatNumberTwoDecimals(rawBundles)}</p>
        <p><strong>Effective roof area (including waste):</strong> ${formatNumberTwoDecimals(effectiveArea)} ${unitLabel}</p>
        <p><strong>Roof squares (reference):</strong> ${formatNumberTwoDecimals(squaresEquivalent)} squares</p>
        <hr>
        <p><strong>Bundle coverage used:</strong> ${formatNumberTwoDecimals(coverage)} ${coverageLabel}</p>
        <p><strong>Coverage from your purchase:</strong> ${formatNumberTwoDecimals(totalCoverageFromPurchase)} ${unitLabel}</p>
        <p><strong>Approximate surplus after waste:</strong> ${formatNumberTwoDecimals(surplusArea)} ${unitLabel}</p>
        ${shinglesEstimateHtml}
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
      const message = "Shingle Quantity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
