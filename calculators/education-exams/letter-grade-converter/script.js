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
  const modePercentBlock = document.getElementById("modePercentBlock");
  const modePointsBlock = document.getElementById("modePointsBlock");

  const percentInput = document.getElementById("percentInput");
  const pointsEarnedInput = document.getElementById("pointsEarnedInput");
  const pointsPossibleInput = document.getElementById("pointsPossibleInput");

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
  attachLiveFormatting(pointsEarnedInput);
  attachLiveFormatting(pointsPossibleInput);

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
    if (modePercentBlock) modePercentBlock.classList.add("hidden");
    if (modePointsBlock) modePointsBlock.classList.add("hidden");

    if (mode === "points") {
      if (modePointsBlock) modePointsBlock.classList.remove("hidden");
    } else {
      if (modePercentBlock) modePercentBlock.classList.remove("hidden");
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function getLetterFromPercent(pct) {
    if (pct >= 97 && pct <= 100) return "A+";
    if (pct >= 93) return "A";
    if (pct >= 90) return "A-";
    if (pct >= 87) return "B+";
    if (pct >= 83) return "B";
    if (pct >= 80) return "B-";
    if (pct >= 77) return "C+";
    if (pct >= 73) return "C";
    if (pct >= 70) return "C-";
    if (pct >= 67) return "D+";
    if (pct >= 63) return "D";
    if (pct >= 60) return "D-";
    return "F";
  }

  function getNextCutoffPercent(pct) {
    // Returns the next higher boundary above pct, or null if already at top
    const cutoffs = [60, 63, 67, 70, 73, 77, 80, 83, 87, 90, 93, 97];
    for (let i = 0; i < cutoffs.length; i++) {
      if (pct < cutoffs[i]) return cutoffs[i];
    }
    return null;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "percent";

      let percent = null;
      let earned = null;
      let possible = null;

      if (mode === "points") {
        earned = toNumber(pointsEarnedInput ? pointsEarnedInput.value : "");
        possible = toNumber(pointsPossibleInput ? pointsPossibleInput.value : "");

        if (!validateNonNegative(earned, "points earned")) return;
        if (!validatePositive(possible, "total points possible")) return;

        if (earned > possible) {
          setResultError("Points earned cannot be greater than total points possible.");
          return;
        }

        percent = (earned / possible) * 100;
      } else {
        percent = toNumber(percentInput ? percentInput.value : "");

        if (!Number.isFinite(percent)) {
          setResultError("Enter a valid percentage score.");
          return;
        }

        if (percent < 0 || percent > 100) {
          setResultError("Percentage must be between 0 and 100.");
          return;
        }
      }

      const letter = getLetterFromPercent(percent);
      const nextCutoff = getNextCutoffPercent(percent);

      let secondaryHtml = "";
      if (nextCutoff === null) {
        secondaryHtml = `<p><strong>Next grade up:</strong> None (you are already at the top boundary).</p>`;
      } else {
        const gapPct = nextCutoff - percent;
        if (mode === "points" && Number.isFinite(possible) && possible > 0) {
          const minPointsForNext = (nextCutoff / 100) * possible;
          const additionalNeeded = Math.max(0, minPointsForNext - earned);
          secondaryHtml = `<p><strong>To reach the next grade boundary:</strong> +${formatNumberTwoDecimals(additionalNeeded)} points (to hit ${formatNumberTwoDecimals(nextCutoff)}%).</p>`;
        } else {
          secondaryHtml = `<p><strong>To reach the next grade boundary:</strong> +${formatNumberTwoDecimals(gapPct)} percentage points (to hit ${formatNumberTwoDecimals(nextCutoff)}%).</p>`;
        }
      }

      const percentDisplay = formatNumberTwoDecimals(percent);

      let inputSummary = "";
      if (mode === "points") {
        inputSummary = `<p><strong>Input:</strong> ${formatNumberTwoDecimals(earned)} out of ${formatNumberTwoDecimals(possible)} points.</p>`;
      } else {
        inputSummary = `<p><strong>Input:</strong> ${percentDisplay}%.</p>`;
      }

      const resultHtml = `
        <p><strong>Letter grade:</strong> ${letter}</p>
        <p><strong>Percentage:</strong> ${percentDisplay}%</p>
        ${inputSummary}
        ${secondaryHtml}
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
      const message = "Letter Grade Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
