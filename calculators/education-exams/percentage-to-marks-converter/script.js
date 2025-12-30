document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const percentageInput = document.getElementById("percentageInput");
  const totalMarksInput = document.getElementById("totalMarksInput");
  const roundingSelect = document.getElementById("roundingSelect");

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
  attachLiveFormatting(percentageInput);
  attachLiveFormatting(totalMarksInput);

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

  function validatePercentRange(value) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid percentage score.");
      return false;
    }
    if (value < 0) {
      setResultError("Percentage cannot be negative.");
      return false;
    }
    if (value > 100) {
      setResultError("Enter a percentage between 0 and 100.");
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
      const percent = toNumber(percentageInput ? percentageInput.value : "");
      const totalMarks = toNumber(totalMarksInput ? totalMarksInput.value : "");
      const roundingMode = roundingSelect ? roundingSelect.value : "1";

      // Basic existence guard
      if (!percentageInput || !totalMarksInput || !roundingSelect) return;

      // Validation
      if (!validatePercentRange(percent)) return;
      if (!validatePositive(totalMarks, "total marks")) return;

      // Calculation logic
      const rawMarks = (percent / 100) * totalMarks;

      let roundedMarks = rawMarks;
      let roundingLabel = "No rounding";

      if (roundingMode === "0.1") {
        roundedMarks = Math.round(rawMarks / 0.1) * 0.1;
        roundingLabel = "Nearest 0.1 mark";
      } else if (roundingMode === "0.5") {
        roundedMarks = Math.round(rawMarks / 0.5) * 0.5;
        roundingLabel = "Nearest 0.5 mark";
      } else if (roundingMode === "1") {
        roundedMarks = Math.round(rawMarks);
        roundingLabel = "Nearest whole mark";
      } else {
        roundingLabel = "No rounding";
      }

      const perOnePercent = totalMarks / 100;
      const perTenPercent = perOnePercent * 10;

      const roundedDisplay =
        roundingMode === "1" ? String(Math.round(roundedMarks)) : formatNumberTwoDecimals(roundedMarks);

      const rawDisplay = formatNumberTwoDecimals(rawMarks);
      const perOneDisplay = formatNumberTwoDecimals(perOnePercent);
      const perTenDisplay = formatNumberTwoDecimals(perTenPercent);

      // Build output HTML
      const resultHtml = `
        <p><strong>Marks:</strong> ${roundedDisplay} / ${formatNumberTwoDecimals(totalMarks)}</p>
        <p><strong>Exact (before rounding):</strong> ${rawDisplay}</p>
        <p><strong>Rounding applied:</strong> ${roundingLabel}</p>
        <p><strong>Quick check:</strong> 1% = ${perOneDisplay} marks, 10% = ${perTenDisplay} marks</p>
      `;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Percentage to Marks Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
