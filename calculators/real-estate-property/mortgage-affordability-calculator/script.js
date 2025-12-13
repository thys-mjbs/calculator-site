document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyIncomeInput = document.getElementById("monthlyIncome");
  const monthlyDebtsInput = document.getElementById("monthlyDebts");
  const downPaymentInput = document.getElementById("downPayment");
  const interestRateInput = document.getElementById("interestRate");
  const loanTermYearsInput = document.getElementById("loanTermYears");
  const annualPropertyTaxesInput = document.getElementById("annualPropertyTaxes");
  const annualInsuranceInput = document.getElementById("annualInsurance");
  const monthlyHoaInput = document.getElementById("monthlyHoa");
  const frontEndDtiInput = document.getElementById("frontEndDti");
  const backEndDtiInput = document.getElementById("backEndDti");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(monthlyIncomeInput);
  attachLiveFormatting(monthlyDebtsInput);
  attachLiveFormatting(downPaymentInput);
  attachLiveFormatting(annualPropertyTaxesInput);
  attachLiveFormatting(annualInsuranceInput);
  attachLiveFormatting(monthlyHoaInput);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || value >= 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
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
      const monthlyIncome = toNumber(monthlyIncomeInput ? monthlyIncomeInput.value : "");
      const monthlyDebts = toNumber(monthlyDebtsInput ? monthlyDebtsInput.value : "");
      const downPayment = toNumber(downPaymentInput ? downPaymentInput.value : "");
      const interestRateAnnual = toNumber(interestRateInput ? interestRateInput.value : "");
      const loanTermYears = toNumber(loanTermYearsInput ? loanTermYearsInput.value : "");
      const annualTaxes = toNumber(annualPropertyTaxesInput ? annualPropertyTaxesInput.value : "");
      const annualInsurance = toNumber(annualInsuranceInput ? annualInsuranceInput.value : "");
      const monthlyHoa = toNumber(monthlyHoaInput ? monthlyHoaInput.value : "");
      const frontEndDtiPct = toNumber(frontEndDtiInput ? frontEndDtiInput.value : "");
      const backEndDtiPct = toNumber(backEndDtiInput ? backEndDtiInput.value : "");

      // Basic existence guard
      if (
        !monthlyIncomeInput ||
        !monthlyDebtsInput ||
        !downPaymentInput ||
        !interestRateInput ||
        !loanTermYearsInput ||
        !annualPropertyTaxesInput ||
        !annualInsuranceInput ||
        !monthlyHoaInput ||
        !frontEndDtiInput ||
        !backEndDtiInput
      ) {
        return;
      }

      // Validation
      if (!validatePositive(monthlyIncome, "gross monthly income")) return;
      if (!validateNonNegative(monthlyDebts, "monthly debt payments")) return;
      if (!validateNonNegative(downPayment, "deposit / down payment")) return;
      if (!validateNonNegative(annualTaxes, "annual property taxes")) return;
      if (!validateNonNegative(annualInsurance, "annual insurance")) return;
      if (!validateNonNegative(monthlyHoa, "monthly HOA / levies")) return;
      if (!validatePositive(loanTermYears, "loan term (years)")) return;
      if (!validateNonNegative(interestRateAnnual, "interest rate")) return;
      if (!validatePercent(frontEndDtiPct, "front-end DTI limit")) return;
      if (!validatePercent(backEndDtiPct, "back-end DTI limit")) return;

      const termMonthsRaw = loanTermYears * 12;
      const termMonths = Math.round(termMonthsRaw);
      if (!Number.isFinite(termMonths) || termMonths <= 0) {
        setResultError("Enter a valid loan term (years) greater than 0.");
        return;
      }

      // Monthly non-mortgage housing costs
      const monthlyTaxes = annualTaxes / 12;
      const monthlyInsurance = annualInsurance / 12;
      const monthlyNonPI = monthlyTaxes + monthlyInsurance + monthlyHoa;

      // DTI-based max monthly housing budget
      const frontEndLimit = (frontEndDtiPct / 100) * monthlyIncome;
      const backEndLimitHousing = (backEndDtiPct / 100) * monthlyIncome - monthlyDebts;

      const maxHousingBudget = Math.min(frontEndLimit, backEndLimitHousing);

      if (!Number.isFinite(maxHousingBudget) || maxHousingBudget <= 0) {
        setResultError("Based on your DTI limits and debts, there is no available housing budget. Reduce debts, increase income, or adjust DTI limits.");
        return;
      }

      const maxPI = maxHousingBudget - monthlyNonPI;

      if (!Number.isFinite(maxPI) || maxPI <= 0) {
        setResultError("Your estimated taxes, insurance, and HOA leave no budget for the mortgage payment. Reduce those costs, increase income, or adjust DTI limits.");
        return;
      }

      // Convert max principal-and-interest payment into loan amount
      const r = interestRateAnnual > 0 ? (interestRateAnnual / 100) / 12 : 0;

      let maxLoanAmount = 0;
      if (r === 0) {
        maxLoanAmount = maxPI * termMonths;
      } else {
        const pow = Math.pow(1 + r, termMonths);
        maxLoanAmount = maxPI * (pow - 1) / (r * pow);
      }

      if (!Number.isFinite(maxLoanAmount) || maxLoanAmount <= 0) {
        setResultError("Unable to calculate a valid loan amount with the values provided.");
        return;
      }

      const maxHomePrice = maxLoanAmount + downPayment;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated max home price:</strong> ${formatNumberTwoDecimals(maxHomePrice)}</p>
        <p><strong>Estimated max loan amount:</strong> ${formatNumberTwoDecimals(maxLoanAmount)}</p>
        <p><strong>Estimated max monthly housing budget:</strong> ${formatNumberTwoDecimals(maxHousingBudget)}</p>
        <p><strong>Monthly payment breakdown (at max budget):</strong></p>
        <ul>
          <li>Mortgage principal &amp; interest (P&amp;I): ${formatNumberTwoDecimals(maxPI)}</li>
          <li>Property taxes (monthly): ${formatNumberTwoDecimals(monthlyTaxes)}</li>
          <li>Insurance (monthly): ${formatNumberTwoDecimals(monthlyInsurance)}</li>
          <li>HOA / levies (monthly): ${formatNumberTwoDecimals(monthlyHoa)}</li>
        </ul>
        <p><strong>DTI limits applied:</strong> Front-end ${frontEndDtiPct}% and back-end ${backEndDtiPct}% (stricter result used).</p>
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
      const message = "Mortgage Affordability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
