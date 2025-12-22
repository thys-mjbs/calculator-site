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
  const modeBlockRectangle = document.getElementById("modeBlockRectangle");
  const modeBlockArea = document.getElementById("modeBlockArea");

  const length = document.getElementById("length");
  const width = document.getElementById("width");
  const lengthUnit = document.getElementById("lengthUnit");

  const areaValue = document.getElementById("areaValue");
  const areaUnit = document.getElementById("areaUnit");

  const depth = document.getElementById("depth");
  const depthUnit = document.getElementById("depthUnit");

  const wastePercent = document.getElementById("wastePercent");
  const bagSize = document.getElementById("bagSize");
  const densityLbFt3 = document.getElementById("densityLbFt3");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(length);
  attachLiveFormatting(width);
  attachLiveFormatting(areaValue);
  attachLiveFormatting(depth);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(densityLbFt3);

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
    if (modeBlockRectangle) modeBlockRectangle.classList.add("hidden");
    if (modeBlockArea) modeBlockArea.classList.add("hidden");

    if (mode === "area") {
      if (modeBlockArea) modeBlockArea.classList.remove("hidden");
    } else {
      if (modeBlockRectangle) modeBlockRectangle.classList.remove("hidden");
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

  function num(n) {
    return Number.isFinite(n) ? n : 0;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "rectangle";

      const lengthVal = toNumber(length ? length.value : "");
      const widthVal = toNumber(width ? width.value : "");
      const areaVal = toNumber(areaValue ? areaValue.value : "");

      const depthVal = toNumber(depth ? depth.value : "");
      const wasteVal = toNumber(wastePercent ? wastePercent.value : "");
      const bagVolFt3 = toNumber(bagSize ? bagSize.value : "");

      const densityValRaw = toNumber(densityLbFt3 ? densityLbFt3.value : "");
      const densityVal = Number.isFinite(densityValRaw) && densityValRaw > 0 ? densityValRaw : 80;

      if (!validatePositive(depthVal, "topsoil depth")) return;
      if (!validateNonNegative(num(wasteVal), "waste and settling percent")) return;
      if (!validatePositive(bagVolFt3, "bag size")) return;

      // Convert area to square feet
      let areaSqFt = 0;

      if (mode === "area") {
        if (!validatePositive(areaVal, "total area")) return;

        const aUnit = areaUnit ? areaUnit.value : "sqft";
        if (aUnit === "sqm") {
          areaSqFt = areaVal * 10.7639104167;
        } else {
          areaSqFt = areaVal;
        }
      } else {
        if (!validatePositive(lengthVal, "length")) return;
        if (!validatePositive(widthVal, "width")) return;

        const lUnit = lengthUnit ? lengthUnit.value : "ft";
        if (lUnit === "m") {
          const lengthFt = lengthVal * 3.280839895;
          const widthFt = widthVal * 3.280839895;
          areaSqFt = lengthFt * widthFt;
        } else {
          areaSqFt = lengthVal * widthVal;
        }
      }

      // Convert depth to feet
      const dUnit = depthUnit ? depthUnit.value : "in";
      let depthFt = 0;

      if (dUnit === "cm") {
        depthFt = depthVal / 30.48;
      } else {
        depthFt = depthVal / 12;
      }

      if (!validatePositive(depthFt, "topsoil depth")) return;

      // Volume in cubic feet
      let volumeFt3 = areaSqFt * depthFt;

      // Apply waste/settling buffer
      const wasteMultiplier = 1 + (num(wasteVal) / 100);
      volumeFt3 = volumeFt3 * wasteMultiplier;

      // Conversions
      const volumeYd3 = volumeFt3 / 27;
      const volumeM3 = volumeFt3 * 0.028316846592;

      // Bags (by volume)
      const bagsNeeded = volumeFt3 / bagVolFt3;

      // Weight estimate (optional)
      const weightLb = volumeFt3 * densityVal;
      const weightKg = weightLb * 0.45359237;
      const weightTonsShort = weightLb / 2000;

      const safeBags = Math.ceil(bagsNeeded);

      const resultHtml =
        `<p><strong>Topsoil needed (with buffer):</strong></p>` +
        `<p>` +
        `• ${formatNumberTwoDecimals(volumeYd3)} cubic yards<br>` +
        `• ${formatNumberTwoDecimals(volumeFt3)} cubic feet<br>` +
        `• ${formatNumberTwoDecimals(volumeM3)} cubic meters` +
        `</p>` +
        `<p><strong>Estimated bags:</strong><br>` +
        `• ${safeBags} bag(s) of ${bagVolFt3} cu ft (rounded up)</p>` +
        `<p><strong>Estimated weight (approx.):</strong><br>` +
        `• ${formatNumberTwoDecimals(weightLb)} lb` +
        ` (${formatNumberTwoDecimals(weightKg)} kg)` +
        ` (${formatNumberTwoDecimals(weightTonsShort)} short tons)` +
        `</p>` +
        `<p><em>Notes:</em> Volume is the purchasing standard. Weight depends on moisture and soil composition. The buffer is based on your percent setting.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Topsoil Coverage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
