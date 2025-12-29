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

  // Advanced (optional)
  const vehiclePriceInput = document.getElementById("vehiclePrice");
  const downPaymentInput = document.getElementById("downPayment");
  const tradeInValueInput = document.getElementById("tradeInValue");
  const salesTaxRateInput = document.getElementById("salesTaxRate");
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

  // Money-like fields
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(vehiclePriceInput);
  attachLiveFormatting(downPaymentInput);
  attachLiveFormatting(tradeInValueInput);
  attachLiveFormatting(feesInput);

  // Rates and months can still benefit from cleanup, but avoid aggressive formatting for decimals
  // (Leave APR and tax without comma-formatting to reduce weirdness with decimals.)
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

  function isWholeNumber(value) {
    return Number.isFinite(value) && Math.floor(value) === value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const loanAmountRaw = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const apr = toNumber(aprInput ? aprInput.value : "");
      const termMonthsRaw = toNumber(termMonthsInput ? termMonthsInput.value : "");

      const vehiclePrice = toNumber(vehiclePriceInput ? vehiclePriceInput.value : "");
      const downPayment = toNumber(downPaymentInput ? downPaymentInput.value : "");
      const tradeInValue = toNumber(tradeInValueInput ? tradeInValueInput.value : "");
      const salesTaxRate = toNumber(salesTaxRateInput ? salesTaxRateInput.value : "");
      const fees = toNumber(feesInput ? feesInput.value : "");

      // Decide financed amount:
      // Primary path: user provided loan amount financed.
      // Fallback path: if loan amount is missing/zero, estimate from Advanced fields (vehicle price path).
      let financedAmount = loanAmountRaw;
      let financedAmountSource = "Loan amount financed";

      const loanAmountProvided = Number.isFinite(loanAmountRaw) && loanAmountRaw > 0;

      if (!loanAmountProvided) {
        const hasVehiclePrice = Number.isFinite(vehiclePrice) && vehiclePrice > 0;
        if (!hasVehiclePrice) {
          setResultError("Enter a loan amount financed, or enter a vehicle price in Advanced to estimate the loan amount.");
          return;
        }

        if (!validateNonNegative(downPayment, "down payment")) return;
        if (!validateNonNegative(tradeInValue, "trade-in value")) return;
        if (!validateNonNegative(salesTaxRate, "sales tax rate")) return;
        if (!validateNonNegative(fees, "fees")) return;

        const taxAmount = vehiclePrice * (salesTaxRate / 100);
        financedAmount = vehiclePrice + taxAmount + fees - downPayment - tradeInValue;
        financedAmountSource = "Estimated from price, tax, fees, down payment, and trade-in";

        if (!Number.isFinite(financedAmount) || financedAmount <= 0) {
          setResultError("Your estimated financed amount is not valid. Check that down payment and trade-in are not larger than the total purchase costs.");
          return;
        }
      }

      // Validate remaining required inputs
      if (!validatePositive(financedAmount, "loan amount")) return;

      if (!Number.isFinite(apr) || apr < 0) {
        setResultError("Enter a valid APR (0 or higher).");
        return;
      }

      if (!validatePositive(termMonthsRaw, "loan term (months)")) return;
      if (!isWholeNumber(termMonthsRaw)) {
        setResultError("Enter a whole number of months for the loan term (for example, 48, 60, or 72).");
        return;
      }

      const termMonths = termMonthsRaw;

      // Calculation (standard amortized fixed payment)
      const principal = financedAmount;
      const monthlyRate = apr / 100 / 12;

      let monthlyPayment = 0;
      if (monthlyRate === 0) {
        monthlyPayment = principal / termMonths;
      } else {
        const pow = Math.pow(1 + monthlyRate, termMonths);
        monthlyPayment = principal * (monthlyRate * pow) / (pow - 1);
      }

      if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
        setResultError("Unable to calculate a valid payment from the values entered. Double-check your APR and term.");
        return;
      }

      const totalPaid = monthlyPayment * termMonths;
      const totalInterest = totalPaid - principal;

      // Secondary insight: payment per 1,000 financed
      const perThousand = (monthlyPayment / principal) * 1000;

      // Build output HTML
      const monthlyPaymentFmt = formatNumberTwoDecimals(monthlyPayment);
      const totalPaidFmt = formatNumberTwoDecimals(totalPaid);
      const totalInterestFmt = formatNumberTwoDecimals(totalInterest);
      const principalFmt = formatNumberTwoDecimals(principal);
      const perThousandFmt = formatNumberTwoDecimals(perThousand);

      const aprFmt = formatNumberTwoDecimals(apr);
      const resultHtml = `
        <p><strong>Estimated monthly payment:</strong> ${monthlyPaymentFmt}</p>
        <p><strong>Total interest paid:</strong> ${totalInterestFmt}</p>
        <p><strong>Total paid over ${termMonths} months:</strong> ${totalPaidFmt}</p>
        <hr>
        <p><strong>Financed amount used:</strong> ${principalFmt}</p>
        <p><strong>Financed amount source:</strong> ${financedAmountSource}</p>
        <p><strong>Rate used (APR):</strong> ${aprFmt}%</p>
        <p><strong>Quick benchmark:</strong> about ${perThousandFmt} per month for each 1,000 financed (at this APR and term).</p>
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
      const message = "Auto Loan Payment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
