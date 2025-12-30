document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const scoreInput = document.getElementById("scoreInput");
  const meanInput = document.getElementById("meanInput");
  const sdInput = document.getElementById("sdInput");
  const classSizeInput = document.getElementById("classSizeInput");

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
  attachLiveFormatting(scoreInput);
  attachLiveFormatting(meanInput);
  attachLiveFormatting(sdInput);
  attachLiveFormatting(classSizeInput);

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
  // Helpers: normal CDF approximation (no external deps)
  // ------------------------------------------------------------
  function erfApprox(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);

    // Abramowitz and Stegun 7.1.26 approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * ax);
    const y =
      1 -
      (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
        Math.exp(-ax * ax);

    return sign * y;
  }

  function normalCdf(z) {
    // Φ(z) = 0.5 * (1 + erf(z / sqrt(2)))
    return 0.5 * (1 + erfApprox(z / Math.SQRT2));
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const score = toNumber(scoreInput ? scoreInput.value : "");
      const mean = toNumber(meanInput ? meanInput.value : "");
      const sd = toNumber(sdInput ? sdInput.value : "");
      const classSizeRaw = toNumber(classSizeInput ? classSizeInput.value : "");

      // Basic existence guard
      if (!scoreInput || !meanInput || !sdInput) return;

      // Validation
      if (!Number.isFinite(score)) return setResultError("Enter a valid score.");
      if (!Number.isFinite(mean)) return setResultError("Enter a valid class average (mean).");
      if (!validatePositive(sd, "standard deviation")) return;

      // Optional class size (defaults if missing)
      let classSize = classSizeRaw;
      if (!Number.isFinite(classSize) || classSize <= 0) {
        classSize = 100;
      } else {
        classSize = Math.round(classSize);
      }

      // Calculation logic
      const z = (score - mean) / sd;
      const cdf = clamp(normalCdf(z), 0, 1);
      const percentile = cdf * 100;

      // Estimated rank: rank 1 is best (highest score)
      // approxAbove = proportion above * classSize
      const proportionAbove = 1 - cdf;
      const approxAbove = Math.round(proportionAbove * classSize);
      const approxBelow = Math.round(cdf * classSize);

      // Rank estimate: if approxAbove = 0 => around #1; if approxAbove = 10 => around #11
      const approxRank = clamp(approxAbove + 1, 1, classSize);

      // Practical interpretation
      let band = "around average";
      const absZ = Math.abs(z);
      if (z >= 2) band = "very high (top range)";
      else if (z >= 1) band = "above average";
      else if (z <= -2) band = "very low (bottom range)";
      else if (z <= -1) band = "below average";
      else if (absZ < 0.25) band = "very close to the average";

      // Build output HTML
      const zText = formatNumberTwoDecimals(z);
      const pctText = formatNumberTwoDecimals(percentile);

      const resultHtml = `
        <p><strong>Your z-score:</strong> ${zText}</p>
        <p><strong>Estimated percentile:</strong> ${pctText}%</p>
        <p><strong>Interpretation:</strong> You are ${band} compared to the group under a bell curve assumption.</p>
        <hr>
        <p><strong>Estimated rank (approx.):</strong> #${approxRank} out of ${classSize}</p>
        <p><strong>Estimated students above you:</strong> ~${approxAbove}</p>
        <p><strong>Estimated students below you:</strong> ~${approxBelow}</p>
        <p style="margin-top:10px;"><em>Note:</em> Rank and counts are estimates. If the class is small or scores are not bell-shaped, the percentile can be directional rather than exact.</p>
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
      const message = "Bell Curve Position Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
