document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const cashAvailableInput = document.getElementById("cashAvailable");
  const vehiclePriceInput = document.getElementById("vehiclePrice");
  const downPaymentInput = document.getElementById("downPayment");
  const salesTaxRateInput = document.getElementById("salesTaxRate");
  const feesInput = document.getElementById("fees");
  const aprInput = document.getElementById("apr");
  const termMonthsInput = document.getElementById("termMonths");
  const investmentReturnInput = document.getElementById("investmentReturn");

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
  attachLiveFormatting(cashAvailableInput);
  attachLiveFormatting(vehiclePriceInput);
  attachLiveFormatting(downPaymentInput);
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
      const cashAvailable = toNumber(cashAvailableInput ? cashAvailableInput.value : "");
      const vehiclePrice = toNumber(vehiclePriceInput ? vehiclePriceInput.value : "");
      const downPaymentRaw = toNumber(downPaymentInput ? downPaymentInput.value : "");
      const salesTaxRate = toNumber(salesTaxRateInput ? salesTaxRateInput.value : "");
      const fees = toNumber(feesInput ? feesInput.value : "");
      const apr = toNumber(aprInput ? aprInput.value : "");
      const termMonths = toNumber(termMonthsInput ? termMonthsInput.value : "");
      const investmentReturn = toNumber(investmentReturnInput ? investmentReturnInput.value : "");

      // Basic existence guard
      if (!vehiclePriceInput || !termMonthsInput) return;

      // Validation (required minimums)
      if (!validatePositive(vehiclePrice, "vehicle price")) return;
      if (!validatePositive(termMonths, "loan term (months)")) return;

      // Optional inputs: apply defaults when missing or invalid
      const downPayment = Number.isFinite(downPaymentRaw) && downPaymentRaw > 0 ? downPaymentRaw : 0;
      const taxRate = Number.isFinite(salesTaxRate) && salesTaxRate >= 0 ? salesTaxRate : 0;
      const upfrontFees = Number.isFinite(fees) && fees >= 0 ? fees : 0;
      const aprPct = Number.isFinite(apr) && apr >= 0 ? apr : 0;
      const invPct = Number.isFinite(investmentReturn) && investmentReturn >= 0 ? investmentReturn : 5;

      // Additional validation
      if (!validateNonNegative(downPayment, "down payment")) return;
      if (!validateNonNegative(taxRate, "sales tax rate")) return;
      if (!validateNonNegative(upfrontFees, "upfront fees")) return;
      if (!validateNonNegative(aprPct, "loan APR")) return;
      if (!validateNonNegative(invPct, "expected annual return")) return;

      // Core totals
      const outTheDoor = vehiclePrice * (1 + taxRate / 100) + upfrontFees;

      if (downPayment > outTheDoor) {
        setResultError("Down payment cannot be greater than the out-the-door cost.");
        return;
      }

      // If cash available provided, check feasibility for cash purchase
      const cashProvided = Number.isFinite(cashAvailable) && cashAvailable > 0;
      if (cashProvided && cashAvailable < outTheDoor) {
        setResultError(
          "Your cash available is less than the out-the-door cost. Cash purchase is not possible with these inputs."
        );
        return;
      }

      // Loan amount after down payment
      const principal = outTheDoor - downPayment;

      // Loan payment calculations
      const n = Math.round(termMonths);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid loan term (months) greater than 0.");
        return;
      }

      const monthlyRate = aprPct / 100 / 12;
      let monthlyPayment = 0;

      if (principal <= 0) {
        monthlyPayment = 0;
      } else if (monthlyRate === 0) {
        monthlyPayment = principal / n;
      } else {
        const factor = Math.pow(1 + monthlyRate, n);
        monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
      }

      const totalPaid = downPayment + monthlyPayment * n;
      const totalInterest = Math.max(0, totalPaid - outTheDoor);

      // Opportunity cost model: invest the cash you did not spend upfront by financing
      const keptCash = Math.max(0, outTheDoor - downPayment);
      const invMonthlyRate = invPct / 100 / 12;
      const futureValueKeptCash = keptCash * Math.pow(1 + invMonthlyRate, n);
      const investmentGain = Math.max(0, futureValueKeptCash - keptCash);

      // Net comparison (simple, practical): investment gain vs interest cost
      const netBenefitFinance = investmentGain - totalInterest;

      // Optional: if cash available provided, show remaining cash after cash purchase
      let remainingCashAfterCashPurchase = null;
      let futureValueRemainingCash = null;
      let gainOnRemainingCash = null;

      if (cashProvided) {
        remainingCashAfterCashPurchase = Math.max(0, cashAvailable - outTheDoor);
        futureValueRemainingCash = remainingCashAfterCashPurchase * Math.pow(1 + invMonthlyRate, n);
        gainOnRemainingCash = Math.max(0, futureValueRemainingCash - remainingCashAfterCashPurchase);
      }

      // Build output HTML
      const monthlyPaymentText = formatNumberTwoDecimals(monthlyPayment);
      const outTheDoorText = formatNumberTwoDecimals(outTheDoor);
      const principalText = formatNumberTwoDecimals(principal);
      const totalPaidText = formatNumberTwoDecimals(totalPaid);
      const totalInterestText = formatNumberTwoDecimals(totalInterest);
      const keptCashText = formatNumberTwoDecimals(keptCash);
      const investmentGainText = formatNumberTwoDecimals(investmentGain);
      const netBenefitText = formatNumberTwoDecimals(Math.abs(netBenefitFinance));

      let decisionLine = "";
      if (principal <= 0) {
        decisionLine =
          "<p><strong>Result:</strong> With this down payment, there is no loan needed. This is effectively a cash purchase.</p>";
      } else if (netBenefitFinance > 0) {
        decisionLine =
          "<p><strong>Result:</strong> Financing is ahead by about <strong>" +
          netBenefitText +
          "</strong> (investment gain exceeds interest cost).</p>";
      } else if (netBenefitFinance < 0) {
        decisionLine =
          "<p><strong>Result:</strong> Paying cash is ahead by about <strong>" +
          netBenefitText +
          "</strong> (interest cost exceeds investment gain).</p>";
      } else {
        decisionLine =
          "<p><strong>Result:</strong> The comparison is effectively break-even with these inputs.</p>";
      }

      let cashOptionalBlock = "";
      if (cashProvided) {
        const remainingCashText = formatNumberTwoDecimals(remainingCashAfterCashPurchase);
        const futureRemainingText = formatNumberTwoDecimals(futureValueRemainingCash);
        const gainRemainingText = formatNumberTwoDecimals(gainOnRemainingCash);

        cashOptionalBlock =
          "<hr />" +
          "<p><strong>Cash position (because you entered cash available):</strong></p>" +
          "<p>If you pay cash today, you keep <strong>" +
          remainingCashText +
          "</strong> unspent.</p>" +
          "<p>If that remaining cash earns " +
          invPct +
          "% per year for " +
          n +
          " months, it could grow to <strong>" +
          futureRemainingText +
          "</strong> (gain of <strong>" +
          gainRemainingText +
          "</strong>).</p>";
      }

      const resultHtml =
        decisionLine +
        "<p><strong>Out-the-door cost (price + tax + fees):</strong> " +
        outTheDoorText +
        "</p>" +
        "<hr />" +
        "<p><strong>Finance option:</strong></p>" +
        "<p>Loan amount (after down payment): <strong>" +
        principalText +
        "</strong></p>" +
        "<p>Estimated monthly payment: <strong>" +
        monthlyPaymentText +
        "</strong></p>" +
        "<p>Total paid over " +
        n +
        " months (including down payment): <strong>" +
        totalPaidText +
        "</strong></p>" +
        "<p>Total interest cost: <strong>" +
        totalInterestText +
        "</strong></p>" +
        "<hr />" +
        "<p><strong>Cash vs finance opportunity cost:</strong></p>" +
        "<p>Cash you keep invested by financing (instead of paying full cash): <strong>" +
        keptCashText +
        "</strong></p>" +
        "<p>Estimated investment gain on that cash at " +
        invPct +
        "% per year for " +
        n +
        " months: <strong>" +
        investmentGainText +
        "</strong></p>" +
        "<p><strong>Net comparison:</strong> investment gain minus interest = <strong>" +
        formatNumberTwoDecimals(netBenefitFinance) +
        "</strong></p>" +
        cashOptionalBlock;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Auto Loan vs Cash Purchase Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
