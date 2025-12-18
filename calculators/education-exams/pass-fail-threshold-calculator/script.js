document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const passMarkInput = document.getElementById("passMark");
  const completedWeightInput = document.getElementById("completedWeight");
  const completedAverageInput = document.getElementById("completedAverage");
  const roundingInput = document.getElementById("rounding");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma-formatting needed for typical % inputs; leave empty by design.

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
  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + " as a number.");
      return false;
    }
    if (value < 0 || value > 100) {
      setResultError(fieldLabel + " must be between 0 and 100.");
      return false;
    }
    return true;
  }

  function validateRounding(value) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid rounding value (0 to 4).");
      return false;
    }
    const rounded = Math.round(value);
    if (rounded < 0 || rounded > 4) {
      setResultError("Rounding must be between 0 and 4 (digits).");
      return false;
    }
    return true;
  }

  function roundToDigits(num, digits) {
    const d = Math.round(digits);
    const factor = Math.pow(10, d);
    return Math.round(num * factor) / factor;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const passMark = toNumber(passMarkInput ? passMarkInput.value : "");
      const completedWeight = toNumber(completedWeightInput ? completedWeightInput.value : "");
      const completedAverage = toNumber(completedAverageInput ? completedAverageInput.value : "");
      const roundingDigitsRaw = toNumber(roundingInput ? roundingInput.value : "1");

      // Basic existence guard
      if (!passMarkInput || !completedWeightInput || !completedAverageInput || !roundingInput) return;

      // Validation
      if (!validatePercent(passMark, "Overall pass mark (%)")) return;
      if (!validatePercent(completedWeight, "Completed weight (%)")) return;

      if (!Number.isFinite(completedAverage)) {
        setResultError("Enter a valid average score on completed work (%).");
        return;
      }
      if (completedAverage < 0 || completedAverage > 100) {
        setResultError("Average score on completed work (%) must be between 0 and 100.");
        return;
      }

      if (!validateRounding(roundingDigitsRaw)) return;
      const roundingDigits = Math.round(roundingDigitsRaw);

      const remainingWeight = 100 - completedWeight;

      // If nothing remains, determine pass/fail directly
      if (remainingWeight === 0) {
        const finalGrade = completedAverage;
        const status = finalGrade + 1e-9 >= passMark ? "PASS" : "FAIL";
        const finalRounded = roundToDigits(finalGrade, roundingDigits);

        const html = `
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Final grade:</strong> ${finalRounded}%</p>
          <p><strong>Pass mark:</strong> ${roundToDigits(passMark, roundingDigits)}%</p>
          <p><strong>Note:</strong> Completed weight is 100%, so there is no remaining work to raise the overall grade.</p>
        `;
        setResultSuccess(html);
        return;
      }

      // Calculation logic:
      // Final = (completedAverage * completedWeight + remainingAverage * remainingWeight) / 100
      // Solve remainingAverage needed for Final >= passMark:
      // remainingAverage >= (passMark*100 - completedAverage*completedWeight) / remainingWeight
      const neededRaw = (passMark * 100 - completedAverage * completedWeight) / remainingWeight;

      // Additional insights
      const currentContribution = (completedAverage * completedWeight) / 100;
      const maxPossibleFinal = (completedAverage * completedWeight + 100 * remainingWeight) / 100;
      const minPossibleFinal = (completedAverage * completedWeight + 0 * remainingWeight) / 100;

      let statusLine = "";
      let neededDisplay = "";
      let practicalNote = "";

      if (neededRaw <= 0) {
        statusLine = "<p><strong>Status:</strong> You are already above the pass threshold based on completed work.</p>";
        neededDisplay = `<p><strong>Minimum needed on remaining work:</strong> 0%</p>`;
        practicalNote = `<p><strong>Practical note:</strong> Even if you score 0% on what remains, your overall grade stays at ${roundToDigits(minPossibleFinal, roundingDigits)}%.</p>`;
      } else if (neededRaw > 100) {
        statusLine = "<p><strong>Status:</strong> Not achievable under a strict 0–100% grading scale.</p>";
        neededDisplay = `<p><strong>Minimum needed on remaining work:</strong> ${roundToDigits(neededRaw, roundingDigits)}%</p>`;
        practicalNote = `<p><strong>Why:</strong> Even a perfect 100% on the remaining work only reaches ${roundToDigits(maxPossibleFinal, roundingDigits)}% overall.</p>`;
      } else {
        statusLine = "<p><strong>Status:</strong> Achievable.</p>";
        neededDisplay = `<p><strong>Minimum needed on remaining work:</strong> ${roundToDigits(neededRaw, roundingDigits)}%</p>`;
        practicalNote = `<p><strong>If you hit that target:</strong> Your overall grade lands at the pass mark (${roundToDigits(passMark, roundingDigits)}%).</p>`;
      }

      const resultHtml = `
        ${statusLine}
        ${neededDisplay}
        <p><strong>Completed weight:</strong> ${roundToDigits(completedWeight, roundingDigits)}% &nbsp;|&nbsp; <strong>Remaining weight:</strong> ${roundToDigits(remainingWeight, roundingDigits)}%</p>
        <p><strong>Your completed average:</strong> ${roundToDigits(completedAverage, roundingDigits)}%</p>
        <p><strong>Current contribution to final grade:</strong> ${roundToDigits(currentContribution, roundingDigits)} percentage points</p>
        ${practicalNote}
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
      const message = "Pass/Fail Threshold Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
