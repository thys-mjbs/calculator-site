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
  const targetPercentInput = document.getElementById("targetPercent");

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
      const earned = toNumber(pointsEarnedInput ? pointsEarnedInput.value : "");
      const possible = toNumber(pointsPossibleInput ? pointsPossibleInput.value : "");
      const targetPercent = toNumber(targetPercentInput ? targetPercentInput.value : "");

      if (!pointsEarnedInput || !pointsPossibleInput || !targetPercentInput) return;

      if (!validateNonNegative(earned, "points earned")) return;
      if (!validatePositive(possible, "points possible")) return;

      const percent = (earned / possible) * 100;

      let letter = "F";
      if (percent >= 90) letter = "A";
      else if (percent >= 80) letter = "B";
      else if (percent >= 70) letter = "C";
      else if (percent >= 60) letter = "D";

      let targetHtml = "";
      if (Number.isFinite(targetPercent) && targetPercent > 0) {
        if (targetPercent > 1000) {
          setResultError("Enter a realistic target percentage.");
          return;
        }

        const targetPoints = (targetPercent / 100) * possible;
        const pointsNeeded = targetPoints - earned;

        if (pointsNeeded <= 0) {
          targetHtml = `<p><strong>Target:</strong> You have already met your target of ${formatNumberTwoDecimals(targetPercent)}% for this total.</p>`;
        } else {
          targetHtml = `<p><strong>Target:</strong> To reach ${formatNumberTwoDecimals(targetPercent)}%, you need about <strong>${formatNumberTwoDecimals(pointsNeeded)}</strong> more points (based on ${formatNumberTwoDecimals(possible)} total points).</p>`;
        }
      }

      const resultHtml =
        `<p><strong>Percentage:</strong> ${formatNumberTwoDecimals(percent)}%</p>` +
        `<p><strong>Estimated letter grade:</strong> ${letter}</p>` +
        targetHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Grade Percentage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
