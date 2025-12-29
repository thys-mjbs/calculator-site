document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const principalInput = document.getElementById("principalInput");
  const rateInput = document.getElementById("rateInput");
  const timeInput = document.getElementById("timeInput");
  const timeUnit = document.getElementById("timeUnit");
  const dayCount = document.getElementById("dayCount");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
      // No modes

      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(principalInput ? principalInput.value : "");
      const annualRatePct = toNumber(rateInput ? rateInput.value : "");
      const timeValue = toNumber(timeInput ? timeInput.value : "");

      // Basic existence guard
      if (!principalInput || !rateInput || !timeInput || !timeUnit) return;

      // Validation
      if (!validatePositive(principal, "principal amount")) return;
      if (!validateNonNegative(annualRatePct, "annual interest rate")) return;
      if (!validatePositive(timeValue, "time")) return;

      const unit = timeUnit.value || "years";
      const basis = dayCount ? toNumber(dayCount.value) : 365;
      const dayBasis = basis === 360 ? 360 : 365;

      // Convert time to years
      let years = 0;
      if (unit === "years") {
        years = timeValue;
      } else if (unit === "months") {
        years = timeValue / 12;
      } else if (unit === "days") {
        years = timeValue / dayBasis;
      } else {
        years = timeValue;
      }

      if (!Number.isFinite(years) || years <= 0) {
        setResultError("Enter a valid time period.");
        return;
      }

      // Calculation logic (simple interest only)
      const rateDecimal = annualRatePct / 100;
      const interest = principal * rateDecimal * years;
      const total = principal + interest;

      // Supporting figures
      const months = years * 12;
      const days = years * dayBasis;

      const interestPerMonth = months > 0 ? interest / months : 0;
      const interestPerDay = days > 0 ? interest / days : 0;

      const formattedPrincipal = formatNumberTwoDecimals(principal);
      const formattedInterest = formatNumberTwoDecimals(interest);
      const formattedTotal = formatNumberTwoDecimals(total);
      const formattedPerMonth = formatNumberTwoDecimals(interestPerMonth);
      const formattedPerDay = formatNumberTwoDecimals(interestPerDay);

      let termLabel = "";
      if (unit === "years") termLabel = timeValue + " years";
      if (unit === "months") termLabel = timeValue + " months";
      if (unit === "days") termLabel = timeValue + " days";

      const basisNote =
        unit === "days"
          ? " (day-count basis: " + dayBasis + ")"
          : "";

      const resultHtml = `
        <p><strong>Simple interest:</strong> ${formattedInterest}</p>
        <p><strong>Total amount (principal + interest):</strong> ${formattedTotal}</p>
        <p><strong>Principal used:</strong> ${formattedPrincipal}</p>
        <p><strong>Rate used:</strong> ${annualRatePct}% per year</p>
        <p><strong>Term used:</strong> ${termLabel}${basisNote}</p>
        <hr>
        <p><strong>Average interest per month:</strong> ${formattedPerMonth}</p>
        <p><strong>Average interest per day:</strong> ${formattedPerDay}</p>
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
      const message = "Simple Interest Calculator (General Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
