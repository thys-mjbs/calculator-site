document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentGradeInput = document.getElementById("currentGrade");
  const finalWeightInput = document.getElementById("finalWeight");
  const targetGradeInput = document.getElementById("targetGrade");

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

  // Percent inputs: allow live formatting (harmless, consistent)
  attachLiveFormatting(currentGradeInput);
  attachLiveFormatting(finalWeightInput);
  attachLiveFormatting(targetGradeInput);

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
  function validateRange0To100(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read and parse inputs using toNumber() (from /scripts/main.js)
      const currentGrade = toNumber(currentGradeInput ? currentGradeInput.value : "");
      const finalWeight = toNumber(finalWeightInput ? finalWeightInput.value : "");
      const targetGrade = toNumber(targetGradeInput ? targetGradeInput.value : "");

      // Basic existence guard
      if (!currentGradeInput || !finalWeightInput || !targetGradeInput) return;

      // Validation
      clearResult();

      if (!validateRange0To100(currentGrade, "current grade")) return;
      if (!validateRange0To100(finalWeight, "final exam weight")) return;
      if (!validateRange0To100(targetGrade, "target grade")) return;

      if (finalWeight === 0) {
        const lockedOverall = currentGrade;
        const lockedHtml =
          `<p><strong>Final exam weight is 0%.</strong> Your overall grade will stay at <strong>${formatNumberTwoDecimals(lockedOverall)}%</strong> regardless of the final.</p>` +
          `<p>If you need a different overall grade, the final exam cannot change it under this grading setup.</p>`;
        setResultSuccess(lockedHtml);
        return;
      }

      // Calculation logic
      // Weighted model:
      // overall = currentGrade * (100 - w)/100 + finalScore * w/100
      // Solve for finalScore:
      // finalScore = (targetGrade*100 - currentGrade*(100 - w)) / w
      const w = finalWeight;
      const requiredFinal = (targetGrade * 100 - currentGrade * (100 - w)) / w;

      // Helpful bounds analysis
      const requiredRounded = formatNumberTwoDecimals(requiredFinal);
      const minPossibleOverall = currentGrade * (100 - w) / 100 + 0 * (w / 100);
      const maxPossibleOverall = currentGrade * (100 - w) / 100 + 100 * (w / 100);

      let statusLine = "";
      if (requiredFinal > 100) {
        statusLine =
          `<p><strong>Not achievable:</strong> you would need <strong>${requiredRounded}%</strong> on the final, which is above 100%.</p>` +
          `<p>With a 100% on the final, your highest possible overall grade is <strong>${formatNumberTwoDecimals(maxPossibleOverall)}%</strong>.</p>`;
      } else if (requiredFinal < 0) {
        statusLine =
          `<p><strong>Already secured:</strong> you would need <strong>${requiredRounded}%</strong>, which is below 0%.</p>` +
          `<p>Even with 0% on the final, your overall grade would be <strong>${formatNumberTwoDecimals(minPossibleOverall)}%</strong>.</p>`;
      } else {
        statusLine =
          `<p>You need <strong>${requiredRounded}%</strong> on the final exam to reach an overall course grade of <strong>${formatNumberTwoDecimals(targetGrade)}%</strong>.</p>` +
          `<p>Your overall grade range (0% to 100% on the final) is <strong>${formatNumberTwoDecimals(minPossibleOverall)}%</strong> to <strong>${formatNumberTwoDecimals(maxPossibleOverall)}%</strong>.</p>`;
      }

      const resultHtml = statusLine;
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Final Exam Score Needed Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
