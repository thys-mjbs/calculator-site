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

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(scoreInput);
  attachLiveFormatting(meanInput);
  attachLiveFormatting(sdInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) NORMAL CDF HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function erfApprox(x) {
    // Abramowitz & Stegun style approximation (good enough for percentile estimates)
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * ax);
    const y =
      1 -
      (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-ax * ax);

    return sign * y;
  }

  function normalCdf(z) {
    // Φ(z) = 0.5 * (1 + erf(z / sqrt(2)))
    const v = 0.5 * (1 + erfApprox(z / Math.SQRT2));
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!scoreInput || !meanInput || !sdInput) return;

      const x = toNumber(scoreInput.value);
      const mu = toNumber(meanInput.value);
      const sigma = toNumber(sdInput.value);

      if (!Number.isFinite(x)) {
        setResultError("Enter a valid score (x).");
        return;
      }
      if (!Number.isFinite(mu)) {
        setResultError("Enter a valid mean (μ).");
        return;
      }
      if (!validatePositive(sigma, "standard deviation (σ)")) return;

      // Guard against unrealistic sigma that effectively breaks interpretation
      if (sigma < 0.0000001) {
        setResultError("Standard deviation (σ) is too close to 0 to estimate a percentile.");
        return;
      }

      const z = (x - mu) / sigma;

      // Compute CDF-based estimates
      const pBelow = normalCdf(z);
      const pAbove = 1 - pBelow;
      const percentile = pBelow * 100;

      // Practical interpretation band (simple, not preachy)
      let band = "about average";
      const absZ = Math.abs(z);
      if (absZ < 0.25) band = "very close to the mean";
      else if (absZ < 0.75) band = "somewhat away from the mean";
      else if (absZ < 1.5) band = "notably away from the mean";
      else if (absZ < 2.5) band = "far from the mean";
      else band = "extremely far from the mean";

      const percentileText = formatNumberTwoDecimals(percentile);
      const belowText = formatNumberTwoDecimals(pBelow * 100);
      const aboveText = formatNumberTwoDecimals(pAbove * 100);

      const zText = Number.isFinite(z) ? z.toFixed(4) : "—";

      const direction = z >= 0 ? "above" : "below";
      const zAbsText = Math.abs(z).toFixed(4);

      const resultHtml = `
        <p><strong>Estimated percentile (at or below your score):</strong> ${percentileText}%</p>
        <p><strong>Z-score:</strong> ${zText}</p>
        <p><strong>Probability below your score:</strong> ${belowText}%</p>
        <p><strong>Probability above your score:</strong> ${aboveText}%</p>
        <p><strong>Quick read:</strong> Your score is ${zAbsText} standard deviations ${direction} the mean, which is ${band}.</p>
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
      const message = "Normal Distribution Estimate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
