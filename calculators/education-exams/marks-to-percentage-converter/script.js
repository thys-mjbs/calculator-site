document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const marksObtainedInput = document.getElementById("marksObtained");
  const totalMarksInput = document.getElementById("totalMarks");
  const targetPercentageInput = document.getElementById("targetPercentage");
  const decimalPlacesInput = document.getElementById("decimalPlaces");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(marksObtainedInput);
  attachLiveFormatting(totalMarksInput);
  attachLiveFormatting(targetPercentageInput);
  attachLiveFormatting(decimalPlacesInput);

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

  function clampDecimalPlaces(n) {
    if (!Number.isFinite(n)) return 2;
    const rounded = Math.round(n);
    if (rounded < 0) return 0;
    if (rounded > 4) return 4;
    return rounded;
  }

  function formatToPlaces(value, places) {
    const p = clampDecimalPlaces(places);
    return Number.isFinite(value) ? value.toFixed(p) : "";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!marksObtainedInput || !totalMarksInput) return;

      const marksObtained = toNumber(marksObtainedInput.value);
      const totalMarks = toNumber(totalMarksInput.value);

      const targetPctRaw = targetPercentageInput ? toNumber(targetPercentageInput.value) : NaN;
      const decimalPlacesRaw = decimalPlacesInput ? toNumber(decimalPlacesInput.value) : NaN;

      const decimalPlaces = clampDecimalPlaces(decimalPlacesRaw);

      // Validation
      if (!validatePositive(totalMarks, "total marks")) return;
      if (!validateNonNegative(marksObtained, "marks obtained")) return;

      // Calculation
      const ratio = marksObtained / totalMarks;
      const percentage = ratio * 100;

      const percentageDisplay = formatToPlaces(percentage, decimalPlaces);
      const ratioDisplay = formatToPlaces(ratio, Math.max(2, decimalPlaces));

      const obtainedDisplay = formatToPlaces(marksObtained, Math.max(0, decimalPlaces));
      const totalDisplay = formatToPlaces(totalMarks, Math.max(0, decimalPlaces));

      let noteLine = "";
      if (marksObtained > totalMarks) {
        noteLine =
          "<p><strong>Note:</strong> Your obtained marks exceed the total marks. This usually happens with bonus marks, so your percentage can be above 100%.</p>";
      }

      // Optional target calculation
      let targetBlock = "";
      if (Number.isFinite(targetPctRaw) && targetPctRaw !== 0) {
        if (targetPctRaw < 0) {
          setResultError("Enter a valid target percentage (0 or higher), or leave it blank.");
          return;
        }

        const requiredMarks = (targetPctRaw / 100) * totalMarks;
        const requiredMarksDisplay = formatToPlaces(requiredMarks, decimalPlaces);

        const deltaMarks = requiredMarks - marksObtained;
        const deltaDisplay = formatToPlaces(Math.abs(deltaMarks), decimalPlaces);

        if (deltaMarks <= 0) {
          targetBlock =
            "<p><strong>Target check:</strong> You are already at or above " +
            formatToPlaces(targetPctRaw, decimalPlaces) +
            "% for this total.</p>" +
            "<p><strong>Marks at target:</strong> " +
            requiredMarksDisplay +
            " out of " +
            totalDisplay +
            "</p>";
        } else {
          targetBlock =
            "<p><strong>Marks needed for " +
            formatToPlaces(targetPctRaw, decimalPlaces) +
            "%:</strong> " +
            requiredMarksDisplay +
            " out of " +
            totalDisplay +
            "</p>" +
            "<p><strong>Additional marks needed:</strong> " +
            deltaDisplay +
            "</p>";
        }
      }

      // Supporting figure: marks margin to 100% (only if under 100)
      let maxBlock = "";
      const remainingToFull = totalMarks - marksObtained;
      if (Number.isFinite(remainingToFull) && remainingToFull >= 0) {
        maxBlock =
          "<p><strong>Marks to reach 100%:</strong> " +
          formatToPlaces(remainingToFull, decimalPlaces) +
          "</p>";
      }

      const resultHtml =
        "<p><strong>Percentage:</strong> " +
        percentageDisplay +
        "%</p>" +
        "<p><strong>Score:</strong> " +
        obtainedDisplay +
        " / " +
        totalDisplay +
        "</p>" +
        "<p><strong>Decimal ratio:</strong> " +
        ratioDisplay +
        "</p>" +
        maxBlock +
        targetBlock +
        noteLine;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Marks to Percentage Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
