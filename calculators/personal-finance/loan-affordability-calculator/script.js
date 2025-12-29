document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const monthlyIncomeInput = document.getElementById("monthlyIncome");
  const monthlyDebtInput = document.getElementById("monthlyDebt");
  const aprInput = document.getElementById("apr");
  const termYearsInput = document.getElementById("termYears");

  const paymentBudgetInput = document.getElementById("paymentBudget");
  const maxDtiInput = document.getElementById("maxDti");
  const maxPtiInput = document.getElementById("maxPti");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(monthlyIncomeInput);
  attachLiveFormatting(monthlyDebtInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(termYearsInput);
  attachLiveFormatting(paymentBudgetInput);
  attachLiveFormatting(maxDtiInput);
  attachLiveFormatting(maxPtiInput);

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
  // 4) OPTIONAL MODE HANDLING (NOT USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS
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

  function clampPercent(value, defaultValue) {
    if (!Number.isFinite(value) || value <= 0) return defaultValue;
    if (value > 100) return 100;
    return value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !monthlyIncomeInput ||
        !monthlyDebtInput ||
        !aprInput ||
        !termYearsInput
      ) {
        return;
      }

      const monthlyIncome = toNumber(monthlyIncomeInput.value);
      const monthlyDebt = toNumber(monthlyDebtInput.value);
      const aprPercent = toNumber(aprInput.value);
      const termYears = toNumber(termYearsInput.value);

      const paymentBudgetRaw = paymentBudgetInput ? toNumber(paymentBudgetInput.value) : NaN;
      const maxDtiRaw = maxDtiInput ? toNumber(maxDtiInput.value) : NaN;
      const maxPtiRaw = maxPtiInput ? toNumber(maxPtiInput.value) : NaN;

      if (!validatePositive(monthlyIncome, "monthly gross income")) return;
      if (!validateNonNegative(monthlyDebt, "existing monthly debt payments")) return;
      if (!validateNonNegative(aprPercent, "APR")) return;
      if (!validatePositive(termYears, "loan term (years)")) return;

      const maxDtiPercent = clampPercent(maxDtiRaw, 36);
      const maxPtiPercent = clampPercent(maxPtiRaw, 15);

      const dtiLimitTotalDebtPayment = (maxDtiPercent / 100) * monthlyIncome;
      const maxNewPaymentFromDti = dtiLimitTotalDebtPayment - monthlyDebt;
      const maxNewPaymentFromPti = (maxPtiPercent / 100) * monthlyIncome;

      if (!Number.isFinite(maxNewPaymentFromDti) || maxNewPaymentFromDti <= 0) {
        setResultError(
          "Based on your income and existing debt payments, there is no room for an additional loan payment under the selected DTI limit. Reduce existing debt, increase income, or adjust the DTI limit in Advanced settings."
        );
        return;
      }

      let maxAffordablePayment = Math.min(maxNewPaymentFromDti, maxNewPaymentFromPti);

      const hasBudget = Number.isFinite(paymentBudgetRaw) && paymentBudgetRaw > 0;
      if (hasBudget) {
        maxAffordablePayment = Math.min(maxAffordablePayment, paymentBudgetRaw);
      }

      if (!Number.isFinite(maxAffordablePayment) || maxAffordablePayment <= 0) {
        setResultError(
          "Your maximum affordable monthly payment is not greater than 0. Check your inputs or remove a restrictive payment budget."
        );
        return;
      }

      const n = Math.round(termYears * 12);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid loan term in years.");
        return;
      }

      const r = (aprPercent / 100) / 12;

      let maxLoanAmount = 0;
      if (r === 0) {
        maxLoanAmount = maxAffordablePayment * n;
      } else {
        const denom = r;
        const factor = 1 - Math.pow(1 + r, -n);
        maxLoanAmount = maxAffordablePayment * (factor / denom);
      }

      if (!Number.isFinite(maxLoanAmount) || maxLoanAmount <= 0) {
        setResultError("Could not compute a loan amount from the given inputs. Check the interest rate and term.");
        return;
      }

      const totalRepaid = maxAffordablePayment * n;
      const totalInterest = totalRepaid - maxLoanAmount;

      const bindingLimit = (function () {
        const fromDtiIsTighter = maxNewPaymentFromDti <= maxNewPaymentFromPti;
        let base = fromDtiIsTighter ? "DTI limit" : "Payment-to-income limit";
        if (hasBudget && paymentBudgetRaw <= Math.min(maxNewPaymentFromDti, maxNewPaymentFromPti)) {
          base = "Monthly payment budget";
        }
        return base;
      })();

      const resultHtml = `
        <p><strong>Maximum loan amount:</strong> ${formatNumberTwoDecimals(maxLoanAmount)}</p>
        <p><strong>Maximum affordable monthly payment:</strong> ${formatNumberTwoDecimals(maxAffordablePayment)} (${bindingLimit})</p>
        <p><strong>Total repaid over ${n} months:</strong> ${formatNumberTwoDecimals(totalRepaid)}</p>
        <p><strong>Total interest over the full term:</strong> ${formatNumberTwoDecimals(totalInterest)}</p>
        <p><strong>What this means:</strong> If you keep your new loan payment at or below ${formatNumberTwoDecimals(maxAffordablePayment)} per month, this is the approximate loan size that fits the selected affordability limits at ${aprPercent}% APR for ${termYears} years.</p>
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
      const message = "Loan Affordability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
