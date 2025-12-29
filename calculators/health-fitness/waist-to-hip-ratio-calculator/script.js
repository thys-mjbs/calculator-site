document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");
  const waistInput = document.getElementById("waistInput");
  const hipInput = document.getElementById("hipInput");
  const sexSelect = document.getElementById("sexSelect");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Measurements can benefit from clean numeric input (especially 1,000+ mm or cm values)
  attachLiveFormatting(waistInput);
  attachLiveFormatting(hipInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const waist = toNumber(waistInput ? waistInput.value : "");
      const hips = toNumber(hipInput ? hipInput.value : "");
      const unit = unitSelect ? unitSelect.value : "cm";
      const sex = sexSelect ? sexSelect.value : "";

      // Basic existence guard
      if (!waistInput || !hipInput || !unitSelect || !sexSelect) return;

      // Validation
      if (!validatePositive(waist, "waist measurement")) return;
      if (!validatePositive(hips, "hip measurement")) return;

      // Simple sanity guard (not blocking, but prevents absurd ratios)
      const ratio = waist / hips;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Enter valid measurements so the ratio can be calculated.");
        return;
      }
      if (ratio > 2.5) {
        setResultError("That ratio looks unrealistic. Re-check your waist and hip measurements and units.");
        return;
      }

      // Interpretation (commonly used screening cutoffs)
      let threshold = null;
      let interpretationTitle = "Interpretation";
      let interpretationText = "Select sex for a simple interpretation using common WHR cutoffs.";
      let bandLabel = "Not classified";

      if (sex === "male") {
        threshold = 0.9;
        if (ratio <= 0.9) {
          bandLabel = "Lower risk range (commonly used cutoff)";
          interpretationText = "Your WHR is at or below 0.90, which is commonly treated as a lower central-fat risk range for men.";
        } else if (ratio < 1.0) {
          bandLabel = "Moderate risk range (common screening band)";
          interpretationText = "Your WHR is above 0.90 but below 1.00. This is commonly treated as a moderate central-fat risk screening range for men.";
        } else {
          bandLabel = "Higher risk range (common screening band)";
          interpretationText = "Your WHR is 1.00 or higher. This is commonly treated as a higher central-fat risk screening range for men.";
        }
      } else if (sex === "female") {
        threshold = 0.85;
        if (ratio <= 0.85) {
          bandLabel = "Lower risk range (commonly used cutoff)";
          interpretationText = "Your WHR is at or below 0.85, which is commonly treated as a lower central-fat risk range for women.";
        } else if (ratio < 0.9) {
          bandLabel = "Moderate risk range (common screening band)";
          interpretationText = "Your WHR is above 0.85 but below 0.90. This is commonly treated as a moderate central-fat risk screening range for women.";
        } else {
          bandLabel = "Higher risk range (common screening band)";
          interpretationText = "Your WHR is 0.90 or higher. This is commonly treated as a higher central-fat risk screening range for women.";
        }
      }

      const waistPctOfHips = ratio * 100;
      const diff = waist - hips;

      let targetHtml = "";
      if (threshold !== null) {
        const targetWaist = hips * threshold;
        const deltaToTarget = waist - targetWaist;

        const directionText = deltaToTarget <= 0
          ? "You are already at or below the cutoff waist for your current hip measurement."
          : "To reach the cutoff at your current hip measurement, your waist would need to be lower.";

        targetHtml = `
          <p><strong>Low-cutoff target waist:</strong> ${formatNumberTwoDecimals(targetWaist)} ${unit}</p>
          <p><strong>Gap to target:</strong> ${formatNumberTwoDecimals(Math.abs(deltaToTarget))} ${unit} (${directionText})</p>
        `;
      }

      const resultHtml = `
        <p><strong>Waist-to-hip ratio (WHR):</strong> ${formatNumberTwoDecimals(ratio)}</p>
        <p><strong>Status:</strong> ${bandLabel}</p>
        <p>${interpretationText}</p>
        <hr>
        <p><strong>Waist as % of hips:</strong> ${formatNumberTwoDecimals(waistPctOfHips)}%</p>
        <p><strong>Waist minus hips:</strong> ${formatNumberTwoDecimals(diff)} ${unit}</p>
        ${targetHtml}
        <p><small>Note: WHR is a screening indicator. It does not diagnose health conditions.</small></p>
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
      const message = "Waist-to-Hip Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
