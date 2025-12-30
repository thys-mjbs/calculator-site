document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");
  const lengthInput = document.getElementById("lengthInput");
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");
  const usableFactorInput = document.getElementById("usableFactorInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // (Not attaching comma-formatting for dimensions to avoid awkward formatting.)

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
    // not used
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

  function validateReasonableDimension(value, fieldLabel, unit) {
    // Soft sanity checks to catch obvious typos without being hostile.
    // These do not block common real-world cases, but block extreme nonsense.
    const max = unit === "in" ? 120 : 300;
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    if (value > max) {
      setResultError("The " + fieldLabel + " looks unusually large. Double-check your units and value.");
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

      const unit = unitSelect ? unitSelect.value : "cm";

      const lengthVal = toNumber(lengthInput ? lengthInput.value : "");
      const widthVal = toNumber(widthInput ? widthInput.value : "");
      const heightVal = toNumber(heightInput ? heightInput.value : "");
      const usableFactorValRaw = toNumber(usableFactorInput ? usableFactorInput.value : "");

      if (!lengthInput || !widthInput || !heightInput) return;

      if (!validateReasonableDimension(lengthVal, "length", unit)) return;
      if (!validateReasonableDimension(widthVal, "width", unit)) return;
      if (!validateReasonableDimension(heightVal, "height", unit)) return;

      let usableFactor = usableFactorValRaw;
      let usedDefaultFactor = false;

      if (!Number.isFinite(usableFactor) || usableFactor <= 0) {
        usableFactor = 85;
        usedDefaultFactor = true;
      }

      if (usableFactor > 100) {
        setResultError("Usable capacity factor should be 100% or lower.");
        return;
      }

      // Convert to centimetres for a consistent base
      const cmPerUnit = unit === "in" ? 2.54 : 1;
      const lengthCm = lengthVal * cmPerUnit;
      const widthCm = widthVal * cmPerUnit;
      const heightCm = heightVal * cmPerUnit;

      const volumeCm3 = lengthCm * widthCm * heightCm;
      const volumeLitres = volumeCm3 / 1000;

      const usableLitres = volumeLitres * (usableFactor / 100);

      // Extra supporting conversions
      const cubicInches = volumeCm3 / 16.387064;

      // Simple category sanity check (not a rule engine, just a helpful comparator)
      let sizeHint = "";
      if (usableLitres < 30) sizeHint = "Very small (often under-seat or compact bags)";
      else if (usableLitres < 50) sizeHint = "Small to mid (common carry-style capacities)";
      else if (usableLitres < 80) sizeHint = "Medium (common checked-bag capacities)";
      else if (usableLitres < 110) sizeHint = "Large (high-capacity checked-bag range)";
      else sizeHint = "Very large (double-check dimensions and assumptions)";

      const unitLabel = unit === "in" ? "in" : "cm";
      const defaultNote = usedDefaultFactor
        ? "<p><strong>Assumption used:</strong> Usable capacity factor defaulted to 85% because you left it blank or invalid.</p>"
        : "";

      const resultHtml =
        `<p><strong>Estimated usable capacity:</strong> ${formatNumberTwoDecimals(usableLitres)} L</p>` +
        `<p><strong>Total geometric volume:</strong> ${formatNumberTwoDecimals(volumeLitres)} L</p>` +
        `<p><strong>Detail:</strong> ${formatNumberTwoDecimals(volumeCm3)} cm³ (${formatNumberTwoDecimals(cubicInches)} in³)</p>` +
        `<p><strong>Capacity range check:</strong> ${sizeHint}</p>` +
        `<p><strong>Inputs used:</strong> ${lengthVal} ${unitLabel} × ${widthVal} ${unitLabel} × ${heightVal} ${unitLabel}, usable factor ${formatNumberTwoDecimals(usableFactor)}%</p>` +
        defaultNote;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Luggage Volume Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
