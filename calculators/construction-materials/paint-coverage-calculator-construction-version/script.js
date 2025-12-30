document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalArea = document.getElementById("totalArea");
  const coats = document.getElementById("coats");
  const coverageRate = document.getElementById("coverageRate");
  const wastePercent = document.getElementById("wastePercent");
  const canSize = document.getElementById("canSize");
  const pricePerLitre = document.getElementById("pricePerLitre");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(totalArea);
  attachLiveFormatting(coats);
  attachLiveFormatting(coverageRate);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(canSize);
  attachLiveFormatting(pricePerLitre);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const areaM2 = toNumber(totalArea ? totalArea.value : "");
      const coatsRaw = toNumber(coats ? coats.value : "");
      const coverageRaw = toNumber(coverageRate ? coverageRate.value : "");
      const wasteRaw = toNumber(wastePercent ? wastePercent.value : "");
      const canSizeRaw = toNumber(canSize ? canSize.value : "");
      const priceRaw = toNumber(pricePerLitre ? pricePerLitre.value : "");

      // Input existence guard
      if (!totalArea || !coats) return;

      // Defaults (advanced inputs optional)
      const coatsCount = Number.isFinite(coatsRaw) && coatsRaw > 0 ? Math.round(coatsRaw) : 2;
      const coverageM2PerL = Number.isFinite(coverageRaw) && coverageRaw > 0 ? coverageRaw : 10;
      const wastePct = Number.isFinite(wasteRaw) && wasteRaw >= 0 ? clamp(wasteRaw, 0, 50) : 10;
      const canSizeL = Number.isFinite(canSizeRaw) && canSizeRaw > 0 ? canSizeRaw : 5;
      const pricePerL = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : null;

      // Validation (required)
      if (!validatePositive(areaM2, "total paintable area")) return;

      // Validation (coats must be positive integer, but user can leave blank to use default)
      if (!Number.isFinite(coatsCount) || coatsCount <= 0) {
        setResultError("Enter a valid number of coats greater than 0 (or leave it blank to use 2).");
        return;
      }

      if (!validatePositive(coverageM2PerL, "coverage rate")) return;
      if (!validateNonNegative(wastePct, "waste allowance")) return;
      if (!validatePositive(canSizeL, "can size")) return;
      if (pricePerL !== null && !validateNonNegative(pricePerL, "price per litre")) return;

      // Calculation logic
      const baseLitres = (areaM2 * coatsCount) / coverageM2PerL;
      const extraLitres = baseLitres * (wastePct / 100);
      const totalLitres = baseLitres + extraLitres;

      const cansToBuy = Math.ceil(totalLitres / canSizeL);
      const litresByCans = cansToBuy * canSizeL;
      const estimatedCost = pricePerL !== null ? totalLitres * pricePerL : null;

      // Build output HTML
      let costHtml = "";
      if (estimatedCost !== null) {
        costHtml = `<p><strong>Estimated paint cost:</strong> ${formatNumberTwoDecimals(estimatedCost)}</p>`;
      }

      const resultHtml = `
        <p><strong>Total paint to buy (incl. allowance):</strong> ${formatNumberTwoDecimals(totalLitres)} L</p>
        <p><strong>Cans to buy:</strong> ${cansToBuy} can(s) of ${formatNumberTwoDecimals(canSizeL)} L</p>
        <p><strong>Total litres you will have:</strong> ${formatNumberTwoDecimals(litresByCans)} L</p>
        <hr>
        <p><strong>Breakdown</strong></p>
        <p>Base litres (no allowance): ${formatNumberTwoDecimals(baseLitres)} L</p>
        <p>Allowance added (${formatNumberTwoDecimals(wastePct)}%): ${formatNumberTwoDecimals(extraLitres)} L</p>
        ${costHtml}
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
      const message = "Paint Coverage Calculator (Construction Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
