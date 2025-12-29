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
  const heightInput = document.getElementById("heightInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Light formatting is fine here (handles big numbers and copy-paste)
  attachLiveFormatting(waistInput);
  attachLiveFormatting(heightInput);

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
      const unit = unitSelect ? unitSelect.value : "cm";
      const waist = toNumber(waistInput ? waistInput.value : "");
      const height = toNumber(heightInput ? heightInput.value : "");

      // Basic existence guard
      if (!unitSelect || !waistInput || !heightInput) return;

      // Required validation
      if (!validatePositive(waist, "waist circumference")) return;
      if (!validatePositive(height, "height")) return;

      // Range checks (adult-focused, practical guardrails)
      if (unit === "cm") {
        if (height < 80 || height > 250) {
          setResultError("Enter a realistic adult height in cm (typically 80 to 250).");
          return;
        }
        if (waist < 30 || waist > 200) {
          setResultError("Enter a realistic waist measurement in cm (typically 30 to 200).");
          return;
        }
      } else {
        if (height < 30 || height > 100) {
          setResultError("Enter a realistic adult height in inches (typically 30 to 100).");
          return;
        }
        if (waist < 12 || waist > 80) {
          setResultError("Enter a realistic waist measurement in inches (typically 12 to 80).");
          return;
        }
      }

      if (height <= waist) {
        setResultError("Your height should be greater than your waist measurement. Re-check the numbers and units.");
        return;
      }

      // Calculation logic
      const whtr = waist / height;

      // Interpretation bands (simple adult screening guide)
      let bandLabel = "";
      let bandNote = "";

      if (whtr < 0.5) {
        bandLabel = "Lower central-size band";
        bandNote = "Your waist is under half your height, which is commonly used as a lower-risk screening threshold.";
      } else if (whtr < 0.6) {
        bandLabel = "Increased central-size band";
        bandNote = "Your waist is at or above half your height. Many people use this as a prompt to reduce central fat over time.";
      } else {
        bandLabel = "Higher central-size band";
        bandNote = "Your waist is well above half your height. This is often treated as a stronger signal to act and to consider broader health context.";
      }

      // Practical targets based on height
      const targetWaist050 = height * 0.5;
      const referenceWaist060 = height * 0.6;
      const unitsLabel = unit === "cm" ? "cm" : "in";

      const whtrDisplay = formatNumberTwoDecimals(whtr);
      const target050Display = formatNumberTwoDecimals(targetWaist050);
      const target060Display = formatNumberTwoDecimals(referenceWaist060);

      const distanceTo050 = waist - targetWaist050;
      const distanceTo050Abs = Math.abs(distanceTo050);
      const distance050Display = formatNumberTwoDecimals(distanceTo050Abs);

      let targetLine = "";
      if (whtr < 0.5) {
        targetLine =
          "<p><strong>Buffer to 0.50 threshold:</strong> " +
          distance050Display +
          " " +
          unitsLabel +
          " below the 0.50 target waist.</p>";
      } else {
        targetLine =
          "<p><strong>Gap to 0.50 target:</strong> " +
          distance050Display +
          " " +
          unitsLabel +
          " above the 0.50 target waist.</p>";
      }

      const resultHtml =
        "<p><strong>Your WHtR:</strong> " +
        whtrDisplay +
        "</p>" +
        "<p><strong>Interpretation:</strong> " +
        bandLabel +
        "</p>" +
        "<p>" +
        bandNote +
        "</p>" +
        "<hr>" +
        "<p><strong>Waist target (WHtR 0.50):</strong> " +
        target050Display +
        " " +
        unitsLabel +
        "</p>" +
        "<p><strong>Higher-risk reference (WHtR 0.60):</strong> " +
        target060Display +
        " " +
        unitsLabel +
        "</p>" +
        targetLine +
        "<p><strong>Tip:</strong> Measure waist the same way each time. Trends over weeks matter more than one reading.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Waist-to-Height Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
