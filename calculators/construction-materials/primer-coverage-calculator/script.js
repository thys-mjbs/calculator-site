document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaSqmInput = document.getElementById("areaSqm");
  const coatsInput = document.getElementById("coats");
  const coverageRateInput = document.getElementById("coverageRate");
  const wastePercentInput = document.getElementById("wastePercent");
  const containerSizeLitresInput = document.getElementById("containerSizeLitres");

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
  attachLiveFormatting(areaSqmInput);
  attachLiveFormatting(coatsInput);
  attachLiveFormatting(coverageRateInput);
  attachLiveFormatting(wastePercentInput);
  attachLiveFormatting(containerSizeLitresInput);

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
      clearResult();

      if (!areaSqmInput || !coatsInput || !coverageRateInput || !wastePercentInput || !containerSizeLitresInput) {
        return;
      }

      // Parse required inputs
      const areaSqm = toNumber(areaSqmInput.value);
      const coatsRaw = toNumber(coatsInput.value);

      // Optional inputs with defaults
      const coverageRateRaw = toNumber(coverageRateInput.value);
      const wastePercentRaw = toNumber(wastePercentInput.value);
      const containerSizeRaw = toNumber(containerSizeLitresInput.value);

      const coverageRate = Number.isFinite(coverageRateRaw) && coverageRateRaw > 0 ? coverageRateRaw : 10;
      const wastePercent = Number.isFinite(wastePercentRaw) && wastePercentRaw >= 0 ? wastePercentRaw : 10;
      const containerSizeLitres = Number.isFinite(containerSizeRaw) && containerSizeRaw > 0 ? containerSizeRaw : 5;

      // Coats should be a whole number in real use
      const coats = Math.round(coatsRaw);

      // Validation
      if (!validatePositive(areaSqm, "surface area (m²)")) return;
      if (!validatePositive(coats, "number of coats")) return;
      if (!validatePositive(coverageRate, "coverage rate (m² per litre)")) return;
      if (!validateNonNegative(wastePercent, "waste percentage")) return;
      if (!validatePositive(containerSizeLitres, "can size (litres)")) return;

      // Practical bounds (non-hostile)
      if (wastePercent > 50) {
        setResultError("Waste percentage above 50% is unusually high. If you meant 10%, enter 10.");
        return;
      }
      if (coats > 10) {
        setResultError("Number of coats above 10 is unusual for primer. Enter a more realistic value.");
        return;
      }

      // Calculation
      const baseLitres = (areaSqm * coats) / coverageRate;
      const wasteFactor = 1 + (wastePercent / 100);
      const litresNeeded = baseLitres * wasteFactor;

      const cansNeeded = Math.ceil(litresNeeded / containerSizeLitres);
      const litresPurchased = cansNeeded * containerSizeLitres;
      const leftoverLitres = litresPurchased - litresNeeded;

      // Secondary insight: how much area the purchased primer can cover (at chosen coverage and coats)
      const effectiveLitresForCoats = litresPurchased / wasteFactor;
      const totalAreaCoverageAtChosenCoats = (effectiveLitresForCoats * coverageRate) / coats;

      const resultHtml = `
        <p><strong>Primer needed (incl. waste):</strong> ${formatNumberTwoDecimals(litresNeeded)} L</p>
        <p><strong>Cans to buy:</strong> ${cansNeeded} × ${formatNumberTwoDecimals(containerSizeLitres)} L</p>
        <p><strong>Total purchased:</strong> ${formatNumberTwoDecimals(litresPurchased)} L</p>
        <p><strong>Estimated leftover:</strong> ${formatNumberTwoDecimals(leftoverLitres)} L</p>
        <hr>
        <p><strong>Assumptions used:</strong></p>
        <ul>
          <li>Coverage rate: ${formatNumberTwoDecimals(coverageRate)} m² per litre</li>
          <li>Coats: ${coats}</li>
          <li>Waste and touch-ups: ${formatNumberTwoDecimals(wastePercent)}%</li>
        </ul>
        <p><strong>Sanity check:</strong> With the cans you buy, you can cover about ${formatNumberTwoDecimals(totalAreaCoverageAtChosenCoats)} m² at ${coats} coat(s) using the assumptions above.</p>
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
      const message = "Primer Coverage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
