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
  const yearsInput = document.getElementById("yearsInput");
  const monthsInput = document.getElementById("monthsInput");

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
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(monthsInput);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(principalInput ? principalInput.value : "");
      const annualRatePercent = toNumber(rateInput ? rateInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");
      const months = toNumber(monthsInput ? monthsInput.value : "");

      // Basic existence guard
      if (!principalInput || !rateInput || !yearsInput || !monthsInput) return;

      // Validation
      if (!validatePositive(principal, "loan amount")) return;
      if (!validatePositive(annualRatePercent, "annual interest rate")) return;

      if (!validateNonNegative(years, "years")) return;
      if (!validateNonNegative(months, "months")) return;

      if (years === 0 && months === 0) {
        setResultError("Enter a valid loan term (years, months, or both).");
        return;
      }

      if (months >= 1200) {
        setResultError("Months looks unusually high. Use years for long terms and keep months under 1200.");
        return;
      }

      // Calculation logic (simple interest)
      const timeYears = years + (months / 12);
      const rateDecimal = annualRatePercent / 100;

      const interest = principal * rateDecimal * timeYears;
      const totalRepayment = principal + interest;

      const totalMonths = (years * 12) + months;
      const avgMonthlyPayment = totalMonths > 0 ? (totalRepayment / totalMonths) : totalRepayment;

      const interestPerMonth = totalMonths > 0 ? (interest / totalMonths) : interest;
      const interestPerDay = interest / (timeYears * 365);

      // Build output HTML
      const resultHtml = `
        <p><strong>Total interest:</strong> ${formatNumberTwoDecimals(interest)}</p>
        <p><strong>Total repayment (principal + interest):</strong> ${formatNumberTwoDecimals(totalRepayment)}</p>
        <p><strong>Average monthly payment estimate:</strong> ${formatNumberTwoDecimals(avgMonthlyPayment)}</p>
        <p><strong>Interest per month (average):</strong> ${formatNumberTwoDecimals(interestPerMonth)}</p>
        <p><strong>Interest per day (approx.):</strong> ${formatNumberTwoDecimals(interestPerDay)}</p>
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
      const message = "Simple Interest Loan Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }

  clearResult();
});
