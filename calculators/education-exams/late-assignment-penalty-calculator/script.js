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
  const maxPointsInput = document.getElementById("maxPoints");
  const daysLateInput = document.getElementById("daysLate");

  const penaltyRatePerDayInput = document.getElementById("penaltyRatePerDay");
  const graceDaysInput = document.getElementById("graceDays");
  const maxPenaltyCapInput = document.getElementById("maxPenaltyCap");

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
  attachLiveFormatting(maxPointsInput);

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

  function validatePercent(value, fieldLabel) {
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
      clearResult();

      // Parse required inputs using toNumber() (from /scripts/main.js)
      const pointsEarned = toNumber(pointsEarnedInput ? pointsEarnedInput.value : "");
      const maxPoints = toNumber(maxPointsInput ? maxPointsInput.value : "");
      const daysLateRaw = toNumber(daysLateInput ? daysLateInput.value : "");

      // Guard: ensure elements exist
      if (!pointsEarnedInput || !maxPointsInput || !daysLateInput) return;

      // Validate required inputs
      if (!validateNonNegative(pointsEarned, "points earned")) return;
      if (!validatePositive(maxPoints, "maximum points")) return;
      if (!validateNonNegative(daysLateRaw, "days late")) return;

      if (pointsEarned > maxPoints) {
        setResultError("Points earned cannot be greater than the assignment’s maximum points.");
        return;
      }

      // Advanced inputs (optional, with defaults)
      let penaltyRatePerDay = toNumber(penaltyRatePerDayInput ? penaltyRatePerDayInput.value : "");
      let graceDaysRaw = toNumber(graceDaysInput ? graceDaysInput.value : "");
      let maxPenaltyCap = toNumber(maxPenaltyCapInput ? maxPenaltyCapInput.value : "");

      if (!Number.isFinite(penaltyRatePerDay)) penaltyRatePerDay = 10;
      if (!Number.isFinite(graceDaysRaw)) graceDaysRaw = 0;
      if (!Number.isFinite(maxPenaltyCap)) maxPenaltyCap = 100;

      if (!validatePercent(penaltyRatePerDay, "penalty rate per day (%)")) return;
      if (!validateNonNegative(graceDaysRaw, "grace days")) return;
      if (!validatePercent(maxPenaltyCap, "maximum penalty cap (%)")) return;

      // Policy handling: treat partial days as a full day (round up)
      const daysLate = Math.ceil(daysLateRaw);
      const graceDays = Math.floor(graceDaysRaw);

      const chargedDays = Math.max(0, daysLate - graceDays);

      // Core formula:
      // penaltyPoints = maxPoints * (penaltyRatePerDay% * chargedDays), capped by maxPenaltyCap%
      const penaltyPctUncapped = chargedDays * penaltyRatePerDay;
      const penaltyPctApplied = Math.min(penaltyPctUncapped, maxPenaltyCap);

      const penaltyPoints = (maxPoints * penaltyPctApplied) / 100;
      const finalPointsRaw = pointsEarned - penaltyPoints;
      const finalPoints = Math.max(0, finalPointsRaw);

      const finalPercent = (finalPoints / maxPoints) * 100;
      const onTimePercent = (pointsEarned / maxPoints) * 100;

      const pointsLost = Math.min(pointsEarned, penaltyPoints);
      const effectivePenaltyPctOfMax = penaltyPctApplied;

      const resultHtml = `
        <p><strong>Final score:</strong> ${formatNumberTwoDecimals(finalPoints)} / ${formatNumberTwoDecimals(maxPoints)} (${formatNumberTwoDecimals(finalPercent)}%)</p>
        <p><strong>Points deducted:</strong> ${formatNumberTwoDecimals(pointsLost)} points</p>
        <p><strong>Penalty applied:</strong> ${formatNumberTwoDecimals(effectivePenaltyPctOfMax)}% of max points (${chargedDays} charged day${chargedDays === 1 ? "" : "s"} at ${formatNumberTwoDecimals(penaltyRatePerDay)}% per day)</p>
        <p><strong>On-time score (for comparison):</strong> ${formatNumberTwoDecimals(onTimePercent)}%</p>
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
      const message = "Late Assignment Penalty Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
