document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const pointsEarnedInput = document.getElementById("pointsEarned");
  const pointsPossibleInput = document.getElementById("pointsPossible");
  const extraCreditPointsInput = document.getElementById("extraCreditPoints");
  const targetPercentInput = document.getElementById("targetPercent");

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

  attachLiveFormatting(pointsEarnedInput);
  attachLiveFormatting(pointsPossibleInput);
  attachLiveFormatting(extraCreditPointsInput);
  attachLiveFormatting(targetPercentInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const pointsEarned = toNumber(pointsEarnedInput ? pointsEarnedInput.value : "");
      const pointsPossible = toNumber(pointsPossibleInput ? pointsPossibleInput.value : "");
      const extraCreditPoints = toNumber(extraCreditPointsInput ? extraCreditPointsInput.value : "");
      const targetPercentRaw = toNumber(targetPercentInput ? targetPercentInput.value : "");

      // Existence guard
      if (!pointsEarnedInput || !pointsPossibleInput || !extraCreditPointsInput || !targetPercentInput) return;

      // Validation
      if (!validateNonNegative(pointsEarned, "points earned so far")) return;
      if (!validatePositive(pointsPossible, "points possible so far")) return;
      if (!validateNonNegative(extraCreditPoints, "extra credit points")) return;

      // Core calculations (points-based; extra credit adds to earned only)
      const currentPercent = (pointsEarned / pointsPossible) * 100;
      const newEarned = pointsEarned + extraCreditPoints;
      const newPercent = (newEarned / pointsPossible) * 100;
      const percentPointChange = newPercent - currentPercent;

      // Optional target analysis
      const hasTarget = Number.isFinite(targetPercentRaw) && targetPercentRaw > 0;
      let targetHtml = "";
      if (hasTarget) {
        const targetPercent = targetPercentRaw;
        const requiredEarnedForTarget = (targetPercent / 100) * pointsPossible;
        const extraNeeded = Math.max(0, requiredEarnedForTarget - pointsEarned);
        const meetsTargetWithPlanned = extraCreditPoints >= extraNeeded;

        const extraNeededDisplay = formatNumberTwoDecimals(extraNeeded);
        const targetDisplay = formatNumberTwoDecimals(targetPercent);

        targetHtml = `
          <hr>
          <p><strong>Target check:</strong> ${targetDisplay}%</p>
          <p><strong>Extra credit needed to reach target (from current):</strong> ${extraNeededDisplay} points</p>
          <p><strong>Your entered extra credit:</strong> ${formatNumberTwoDecimals(extraCreditPoints)} points</p>
          <p><strong>Status:</strong> ${meetsTargetWithPlanned ? "Your planned extra credit is enough to reach the target." : "Your planned extra credit is not enough to reach the target."}</p>
        `;
      }

      const resultHtml = `
        <p><strong>Current grade:</strong> ${formatNumberTwoDecimals(currentPercent)}%</p>
        <p><strong>Estimated grade after extra credit:</strong> ${formatNumberTwoDecimals(newPercent)}%</p>
        <p><strong>Change:</strong> ${formatNumberTwoDecimals(percentPointChange)} percentage points</p>
        <p><strong>New points earned:</strong> ${formatNumberTwoDecimals(newEarned)} (out of ${formatNumberTwoDecimals(pointsPossible)})</p>
        ${targetHtml}
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
      const message = "Extra Credit Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
