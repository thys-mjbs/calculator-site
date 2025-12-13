document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  // Replace these bindings per calculator or add more as needed.
  // Example:
  // const inputA = document.getElementById("inputA");
  // const inputB = document.getElementById("inputB");
  const principalInput = document.getElementById("principalInput");
  const rateInput = document.getElementById("rateInput");
  const timeInput = document.getElementById("timeInput");
  const timeUnitSelect = document.getElementById("timeUnitSelect");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Example:
  // const modeSelect = document.getElementById("modeSelect");
  // const modeBlockA = document.getElementById("modeBlockA");
  // const modeBlockB = document.getElementById("modeBlockB");

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
  attachLiveFormatting(principalInput);
  attachLiveFormatting(rateInput);
  attachLiveFormatting(timeInput);

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
  // If your calculator has multiple modes, implement showMode() and hook it up.
  // If not used, leave the placeholders empty and do nothing.
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
      const principal = toNumber(principalInput ? principalInput.value : "");
      const ratePercent = toNumber(rateInput ? rateInput.value : "");
      const timeValue = toNumber(timeInput ? timeInput.value : "");
      const unit = timeUnitSelect ? timeUnitSelect.value : "years";

      // Basic existence guard
      if (!principalInput || !rateInput || !timeInput || !timeUnitSelect) return;

      // Validation
      if (!validatePositive(principal, "principal amount")) return;
      if (!validateNonNegative(ratePercent, "annual interest rate")) return;
      if (!validatePositive(timeValue, "time")) return;

      // Convert time to years
      let years = timeValue;
      if (unit === "months") years = timeValue / 12;
      if (unit === "days") years = timeValue / 365;

      if (!Number.isFinite(years) || years <= 0) {
        setResultError("Enter a valid time period greater than 0.");
        return;
      }

      // Calculation logic (Simple Interest: I = P * r * t)
      const rateDecimal = ratePercent / 100;
      const interest = principal * rateDecimal * years;
      const total = principal + interest;

      // Build output HTML
      const timeLabel = unit === "years" ? "years" : unit === "months" ? "months" : "days";

      const resultHtml = `
        <p><strong>Interest:</strong> ${formatNumberTwoDecimals(interest)}</p>
        <p><strong>Total amount:</strong> ${formatNumberTwoDecimals(total)}</p>
        <p><strong>Inputs used:</strong> Principal ${formatNumberTwoDecimals(principal)}, Rate ${ratePercent}%, Time ${timeValue} ${timeLabel}.</p>
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
      const message = "Simple Interest Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
