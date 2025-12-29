document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAmountInput = document.getElementById("loanAmount");
  const aprInput = document.getElementById("apr");
  const termMonthsInput = document.getElementById("termMonths");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)

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
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(termMonthsInput);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const aprPercent = toNumber(aprInput ? aprInput.value : "");
      const termMonthsRaw = toNumber(termMonthsInput ? termMonthsInput.value : "");

      // Basic existence guard
      if (!loanAmountInput || !aprInput || !termMonthsInput) return;

      // Validation
      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(aprPercent, "APR")) return;
      if (!validatePositive(termMonthsRaw, "term (months)")) return;

      const termMonths = Math.round(termMonthsRaw);
      if (!Number.isFinite(termMonths) || termMonths <= 0) {
        setResultError("Enter a valid term in months (1 or higher).");
        return;
      }
      if (termMonths !== termMonthsRaw) {
        // Silent rounding is fine, but we keep results consistent
      }

      // Calculation logic (standard amortizing loan)
      const monthlyRate = (aprPercent / 100) / 12;

      let monthlyPayment = 0;
      if (monthlyRate === 0) {
        monthlyPayment = principal / termMonths;
      } else {
        const factor = Math.pow(1 + monthlyRate, termMonths);
        monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
      }

      if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
        setResultError("Unable to calculate a valid payment with these inputs.");
        return;
      }

      const totalRepaid = monthlyPayment * termMonths;
      const totalInterest = totalRepaid - principal;

      const paymentPerThousand = (principal > 0) ? (monthlyPayment / principal) * 1000 : 0;

      const monthlyPaymentStr = formatNumberTwoDecimals(monthlyPayment);
      const totalRepaidStr = formatNumberTwoDecimals(totalRepaid);
      const totalInterestStr = formatNumberTwoDecimals(totalInterest);
      const paymentPerThousandStr = formatNumberTwoDecimals(paymentPerThousand);
      const monthlyRateStr = formatNumberTwoDecimals(monthlyRate * 100);

      const resultHtml =
        `<p><strong>Estimated monthly payment:</strong> ${monthlyPaymentStr}</p>` +
        `<p><strong>Total repaid over ${termMonths} months:</strong> ${totalRepaidStr}</p>` +
        `<p><strong>Total interest paid:</strong> ${totalInterestStr}</p>` +
        `<p><strong>Payment per 1,000 borrowed:</strong> ${paymentPerThousandStr} per month</p>` +
        `<p><strong>Monthly interest rate used:</strong> ${monthlyRateStr}%</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Personal Loan Payment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
