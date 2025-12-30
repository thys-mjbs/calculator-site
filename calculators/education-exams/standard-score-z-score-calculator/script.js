document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const rawScoreInput = document.getElementById("rawScore");
  const meanScoreInput = document.getElementById("meanScore");
  const stdDevInput = document.getElementById("stdDev");
  const groupSizeInput = document.getElementById("groupSize");

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

  // Attach formatting where it makes sense
  attachLiveFormatting(rawScoreInput);
  attachLiveFormatting(meanScoreInput);
  attachLiveFormatting(stdDevInput);
  attachLiveFormatting(groupSizeInput);

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
  // Helper: normal CDF approximation (for percentile)
  // ------------------------------------------------------------
  function normalCdf(z) {
    // Abramowitz and Stegun approximation
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.sqrt(2);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const erfApprox =
      1 -
      (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
        Math.exp(-x * x);

    const erf = sign * erfApprox;
    return 0.5 * (1 + erf);
  }

  function percentileFromZ(z) {
    const cdf = normalCdf(z);
    const pct = cdf * 100;
    if (!Number.isFinite(pct)) return null;
    return Math.min(100, Math.max(0, pct));
  }

  function bandLabelFromAbsZ(absZ) {
    if (absZ < 0.5) return "very close to average";
    if (absZ < 1) return "slightly away from average";
    if (absZ < 2) return "notably away from average";
    if (absZ < 3) return "far from average";
    return "extremely far from average";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const rawScore = toNumber(rawScoreInput ? rawScoreInput.value : "");
      const meanScore = toNumber(meanScoreInput ? meanScoreInput.value : "");
      const stdDev = toNumber(stdDevInput ? stdDevInput.value : "");
      const groupSize = toNumber(groupSizeInput ? groupSizeInput.value : "");

      // Basic existence guard
      if (!rawScoreInput || !meanScoreInput || !stdDevInput) return;

      // Validation
      if (!Number.isFinite(rawScore)) {
        setResultError("Enter a valid score.");
        return;
      }
      if (!Number.isFinite(meanScore)) {
        setResultError("Enter a valid mean (average) score.");
        return;
      }
      if (!validatePositive(stdDev, "standard deviation (SD)")) return;

      if (Number.isFinite(groupSize) && groupSizeInput && groupSizeInput.value.trim() !== "") {
        if (!Number.isInteger(groupSize) || groupSize < 2) {
          setResultError("Enter a valid group size as a whole number of 2 or more (or leave it blank).");
          return;
        }
      }

      // Calculation logic
      const diff = rawScore - meanScore;
      const z = diff / stdDev;

      const absZ = Math.abs(z);
      const pct = percentileFromZ(z);

      let directionText = "equal to";
      if (z > 0) directionText = "above";
      if (z < 0) directionText = "below";

      const band = bandLabelFromAbsZ(absZ);

      // Build output HTML
      const zText = formatNumberTwoDecimals(z);
      const diffText = formatNumberTwoDecimals(diff);
      const sdText = formatNumberTwoDecimals(absZ);

      let percentileText = "Unavailable";
      if (pct !== null) {
        percentileText = pct.toFixed(1) + "%";
      }

      let groupLine = "";
      if (Number.isFinite(groupSize) && groupSizeInput && groupSizeInput.value.trim() !== "") {
        const below = pct === null ? null : Math.round((pct / 100) * groupSize);
        const above = below === null ? null : Math.max(0, groupSize - below);

        if (below !== null) {
          groupLine = `<p><strong>Estimated in a group of ${groupSize}:</strong> about ${below} below you and about ${above} at or above you.</p>`;
        }
      }

      const resultHtml = `
        <p><strong>Z-score (standard score):</strong> ${zText}</p>
        <p><strong>Estimated percentile rank:</strong> ${percentileText} <span>(assumes an approximately normal score distribution)</span></p>
        <p><strong>How to read this:</strong> Your score is ${sdText} standard deviations ${directionText} the mean. That is ${band} for this group.</p>
        <p><strong>Raw difference from the mean:</strong> ${diffText} points</p>
        ${groupLine}
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
      const message = "Standard Score (Z-Score) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
