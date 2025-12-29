document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyBudgetInput = document.getElementById("monthlyBudget");
  const aprPercentInput = document.getElementById("aprPercent");
  const termMonthsInput = document.getElementById("termMonths");
  const downPaymentInput = document.getElementById("downPayment");
  const tradeInInput = document.getElementById("tradeIn");
  const salesTaxPercentInput = document.getElementById("salesTaxPercent");
  const feesInput = document.getElementById("fees");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(monthlyBudgetInput);
  attachLiveFormatting(aprPercentInput);
  attachLiveFormatting(termMonthsInput);
  attachLiveFormatting(downPaymentInput);
  attachLiveFormatting(tradeInInput);
  attachLiveFormatting(salesTaxPercentInput);
  attachLiveFormatting(feesInput);

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

  function validateReasonableRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
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

      if (
        !monthlyBudgetInput ||
        !aprPercentInput ||
        !termMonthsInput ||
        !downPaymentInput ||
        !tradeInInput ||
        !salesTaxPercentInput ||
        !feesInput
      ) {
        return;
      }

      const monthlyBudget = toNumber(monthlyBudgetInput.value);
      const aprPercent = toNumber(aprPercentInput.value);
      const termMonths = toNumber(termMonthsInput.value);
      const downPayment = toNumber(downPaymentInput.value);
      const tradeIn = toNumber(tradeInInput.value);
      const salesTaxPercent = toNumber(salesTaxPercentInput.value);
      const fees = toNumber(feesInput.value);

      // Required
      if (!validatePositive(monthlyBudget, "monthly payment budget")) return;

      // APR and term
      if (!validateNonNegative(aprPercent, "APR")) return;
      if (!validatePositive(termMonths, "loan term (months)")) return;

      // Optional amounts
      if (!validateNonNegative(downPayment, "down payment")) return;
      if (!validateNonNegative(tradeIn, "trade-in value")) return;
      if (!validateNonNegative(salesTaxPercent, "sales tax rate")) return;
      if (!validateNonNegative(fees, "fees")) return;

      // Guardrails for obvious bad inputs
      if (!validateReasonableRange(termMonths, "loan term (months)", 6, 120)) return;
      if (!validateReasonableRange(aprPercent, "APR (%)", 0, 60)) return;
      if (!validateReasonableRange(salesTaxPercent, "sales tax rate (%)", 0, 30)) return;

      const r = (aprPercent / 100) / 12;
      const n = Math.round(termMonths);

      let maxAmountFinanced = 0;

      if (r === 0) {
        maxAmountFinanced = monthlyBudget * n;
      } else {
        const denom = 1 - Math.pow(1 + r, -n);
        if (denom <= 0) {
          setResultError("Enter a valid APR and loan term.");
          return;
        }
        maxAmountFinanced = monthlyBudget * (denom / r);
      }

      if (!Number.isFinite(maxAmountFinanced) || maxAmountFinanced <= 0) {
        setResultError("Enter valid inputs to calculate affordability.");
        return;
      }

      const taxRate = salesTaxPercent / 100;

      // Out-the-door total supported assuming tax and fees are rolled into the loan:
      // amount financed = (vehicle price * (1 + taxRate)) + fees - downPayment - tradeIn
      // vehicle price = (amount financed + downPayment + tradeIn - fees) / (1 + taxRate)
      const numerator = maxAmountFinanced + downPayment + tradeIn - fees;

      if (numerator <= 0) {
        setResultError("Your down payment, trade-in, and fees result in a non-positive vehicle price. Adjust the inputs.");
        return;
      }

      const maxVehiclePriceBeforeTax = numerator / (1 + taxRate);

      if (!Number.isFinite(maxVehiclePriceBeforeTax) || maxVehiclePriceBeforeTax <= 0) {
        setResultError("Enter a valid sales tax rate and fees to estimate vehicle price.");
        return;
      }

      const estimatedTaxAmount = maxVehiclePriceBeforeTax * taxRate;
      const estimatedOutTheDoor = maxVehiclePriceBeforeTax + estimatedTaxAmount + fees;

      // Payment and interest totals at the maximum amount financed
      const totalPaid = monthlyBudget * n;
      const totalInterest = Math.max(0, totalPaid - maxAmountFinanced);

      const resultHtml = `
        <p><strong>Estimated max vehicle price (before tax):</strong> ${formatNumberTwoDecimals(maxVehiclePriceBeforeTax)}</p>
        <p><strong>Estimated out-the-door total (price + tax + fees):</strong> ${formatNumberTwoDecimals(estimatedOutTheDoor)}</p>
        <p><strong>Max amount financed (loan principal):</strong> ${formatNumberTwoDecimals(maxAmountFinanced)}</p>
        <hr>
        <p><strong>Monthly payment used:</strong> ${formatNumberTwoDecimals(monthlyBudget)} for ${n} months</p>
        <p><strong>Estimated total interest over the term:</strong> ${formatNumberTwoDecimals(totalInterest)}</p>
        <p><strong>Estimated total paid (principal + interest):</strong> ${formatNumberTwoDecimals(totalPaid)}</p>
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
      const message = "Auto Loan Affordability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
