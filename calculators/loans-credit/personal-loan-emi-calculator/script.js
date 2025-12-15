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
  const annualRateInput = document.getElementById("annualRate");
  const termMonthsInput = document.getElementById("termMonths");

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
  attachLiveFormatting(loanAmountInput);
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
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const annualRate = toNumber(annualRateInput ? annualRateInput.value : "");
      const termMonths = toNumber(termMonthsInput ? termMonthsInput.value : "");

      // Basic existence guard
      if (!loanAmountInput || !annualRateInput || !termMonthsInput) return;

      // Validation
      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(annualRate, "interest rate")) return;
      if (!validatePositive(termMonths, "loan term (months)")) return;

      if (termMonths > 600) {
        setResultError("Enter a realistic loan term in months (for example, 6 to 360).");
        return;
      }

      if (annualRate > 200) {
        setResultError("Enter a realistic annual interest rate (for example, 0 to 60).");
        return;
      }

      // Calculation logic
      const n = Math.round(termMonths);
      const monthlyRate = annualRate > 0 ? (annualRate / 12) / 100 : 0;

      let emi = 0;
      if (monthlyRate === 0) {
        emi = principal / n;
      } else {
        const pow = Math.pow(1 + monthlyRate, n);
        emi = principal * monthlyRate * pow / (pow - 1);
      }

      // Amortization loop for totals and first payment split
      let balance = principal;
      let totalInterest = 0;
      let firstMonthInterest = 0;
      let firstMonthPrincipal = 0;

      for (let i = 1; i <= n; i++) {
        const interest = balance * monthlyRate;
        let principalPaid = emi - interest;

        // Guard for edge rounding on final month
        if (principalPaid > balance) {
          principalPaid = balance;
        }

        if (i === 1) {
          firstMonthInterest = interest;
          firstMonthPrincipal = principalPaid;
        }

        totalInterest += interest;
        balance = balance - principalPaid;

        if (balance < 0) balance = 0;
      }

      const totalPayment = emi * n;
      const interestSharePct = principal > 0 ? (totalInterest / principal) * 100 : 0;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated monthly EMI:</strong> ${formatNumberTwoDecimals(emi)}</p>
        <p><strong>Total interest (estimated):</strong> ${formatNumberTwoDecimals(totalInterest)}</p>
        <p><strong>Total repayment (estimated):</strong> ${formatNumberTwoDecimals(totalPayment)}</p>
        <p><strong>Interest as % of loan amount:</strong> ${formatNumberTwoDecimals(interestSharePct)}%</p>
        <hr>
        <p><strong>First payment breakdown:</strong></p>
        <p>Interest: ${formatNumberTwoDecimals(firstMonthInterest)}<br>
        Principal: ${formatNumberTwoDecimals(firstMonthPrincipal)}</p>
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
      const message = "Personal Loan EMI Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
