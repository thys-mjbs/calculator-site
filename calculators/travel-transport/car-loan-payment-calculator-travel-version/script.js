document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const vehiclePriceInput = document.getElementById("vehiclePriceInput");
  const downPaymentInput = document.getElementById("downPaymentInput");
  const aprInput = document.getElementById("aprInput");
  const termYearsInput = document.getElementById("termYearsInput");

  const toggleAdvancedButton = document.getElementById("toggleAdvancedButton");
  const advancedSection = document.getElementById("advancedSection");
  const taxRateInput = document.getElementById("taxRateInput");
  const feesInput = document.getElementById("feesInput");
  const exchangeRateInput = document.getElementById("exchangeRateInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(vehiclePriceInput);
  attachLiveFormatting(downPaymentInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(termYearsInput);
  attachLiveFormatting(taxRateInput);
  attachLiveFormatting(feesInput);
  attachLiveFormatting(exchangeRateInput);

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
  // Advanced UI toggle (calculator-specific)
  // ------------------------------------------------------------
  if (toggleAdvancedButton && advancedSection) {
    toggleAdvancedButton.addEventListener("click", function () {
      const isHidden = advancedSection.classList.contains("hidden");
      if (isHidden) {
        advancedSection.classList.remove("hidden");
        toggleAdvancedButton.textContent = "Hide advanced options";
        toggleAdvancedButton.setAttribute("aria-expanded", "true");
      } else {
        advancedSection.classList.add("hidden");
        toggleAdvancedButton.textContent = "Show advanced options";
        toggleAdvancedButton.setAttribute("aria-expanded", "false");
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const vehiclePrice = toNumber(vehiclePriceInput ? vehiclePriceInput.value : "");
      const downPayment = toNumber(downPaymentInput ? downPaymentInput.value : "");
      const aprPercent = toNumber(aprInput ? aprInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");

      const taxPercentRaw = toNumber(taxRateInput ? taxRateInput.value : "");
      const feesRaw = toNumber(feesInput ? feesInput.value : "");
      const exchangeRateRaw = toNumber(exchangeRateInput ? exchangeRateInput.value : "");

      // Existence guard
      if (!vehiclePriceInput || !aprInput || !termYearsInput) return;

      // Validation (required inputs)
      if (!validatePositive(vehiclePrice, "vehicle price")) return;
      if (!Number.isFinite(aprPercent) || aprPercent < 0 || aprPercent > 100) {
        setResultError("Enter a valid interest rate (APR %) between 0 and 100.");
        return;
      }
      if (!validatePositive(termYears, "loan term (years)")) return;

      // Optional inputs validation
      const down = Number.isFinite(downPayment) ? downPayment : 0;
      if (!validateNonNegative(down, "down payment")) return;

      const taxPercent = Number.isFinite(taxPercentRaw) ? taxPercentRaw : 0;
      if (taxPercent < 0 || taxPercent > 40) {
        setResultError("Enter a valid purchase tax or VAT percentage between 0 and 40.");
        return;
      }

      const fees = Number.isFinite(feesRaw) ? feesRaw : 0;
      if (!validateNonNegative(fees, "fees")) return;

      const exchangeRate = Number.isFinite(exchangeRateRaw) ? exchangeRateRaw : 0;
      if (exchangeRateRaw !== 0 && (!Number.isFinite(exchangeRateRaw) || exchangeRateRaw < 0)) {
        setResultError("Enter a valid exchange rate (0 or higher).");
        return;
      }
      if (exchangeRate > 0 && exchangeRate < 0.000001) {
        setResultError("Exchange rate is too small to be realistic. Enter a larger number.");
        return;
      }

      // Calculation logic
      const taxAmount = vehiclePrice * (taxPercent / 100);
      const priceWithTaxAndFees = vehiclePrice + taxAmount + fees;

      const financedAmountRaw = priceWithTaxAndFees - down;
      const financedAmount = financedAmountRaw < 0 ? 0 : financedAmountRaw;

      const n = Math.round(termYears * 12);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid loan term. Years must convert to at least 1 month.");
        return;
      }

      const r = (aprPercent / 100) / 12;

      let monthlyPayment = 0;
      if (financedAmount === 0) {
        monthlyPayment = 0;
      } else if (r === 0) {
        monthlyPayment = financedAmount / n;
      } else {
        const pow = Math.pow(1 + r, n);
        monthlyPayment = financedAmount * (r * pow) / (pow - 1);
      }

      const totalPaid = monthlyPayment * n;
      const totalInterest = totalPaid - financedAmount;

      // Optional currency conversion
      const hasConversion = exchangeRate > 0;
      const monthlyHome = hasConversion ? monthlyPayment * exchangeRate : 0;
      const totalPaidHome = hasConversion ? totalPaid * exchangeRate : 0;
      const totalInterestHome = hasConversion ? totalInterest * exchangeRate : 0;

      // Build output HTML
      const monthlyText = formatNumberTwoDecimals(monthlyPayment);
      const financedText = formatNumberTwoDecimals(financedAmount);
      const totalPaidText = formatNumberTwoDecimals(totalPaid);
      const totalInterestText = formatNumberTwoDecimals(totalInterest);

      const taxText = formatNumberTwoDecimals(taxAmount);
      const feesText = formatNumberTwoDecimals(fees);

      let conversionHtml = "";
      if (hasConversion) {
        conversionHtml = `
          <p><strong>Monthly payment (home currency):</strong> ${formatNumberTwoDecimals(monthlyHome)}</p>
          <p><strong>Total repaid (home currency):</strong> ${formatNumberTwoDecimals(totalPaidHome)}</p>
          <p><strong>Total interest (home currency):</strong> ${formatNumberTwoDecimals(totalInterestHome)}</p>
        `;
      } else {
        conversionHtml = `<p><strong>Home currency conversion:</strong> Not included (leave exchange rate blank if you do not need it).</p>`;
      }

      const resultHtml = `
        <p><strong>Estimated monthly payment:</strong> ${monthlyText}</p>
        <p><strong>Financed amount:</strong> ${financedText}</p>
        <p><strong>Total repaid over ${n} months:</strong> ${totalPaidText}</p>
        <p><strong>Total interest cost:</strong> ${totalInterestText}</p>
        <hr>
        <p><strong>Included in financed amount (if provided):</strong></p>
        <p>Tax/VAT added: ${taxText}</p>
        <p>One-time fees added: ${feesText}</p>
        <hr>
        ${conversionHtml}
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
      const message = "Car Loan Payment Calculator (Travel Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
