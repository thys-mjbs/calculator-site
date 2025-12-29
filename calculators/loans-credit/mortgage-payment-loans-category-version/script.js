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
  const interestRateInput = document.getElementById("interestRate");
  const termYearsInput = document.getElementById("termYears");

  const propertyTaxAnnualInput = document.getElementById("propertyTaxAnnual");
  const insuranceAnnualInput = document.getElementById("insuranceAnnual");
  const hoaMonthlyInput = document.getElementById("hoaMonthly");
  const pmiMonthlyInput = document.getElementById("pmiMonthly");

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
  attachLiveFormatting(propertyTaxAnnualInput);
  attachLiveFormatting(insuranceAnnualInput);
  attachLiveFormatting(hoaMonthlyInput);
  attachLiveFormatting(pmiMonthlyInput);

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
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const interestRateApr = toNumber(interestRateInput ? interestRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");

      const propertyTaxAnnual = toNumber(propertyTaxAnnualInput ? propertyTaxAnnualInput.value : "");
      const insuranceAnnual = toNumber(insuranceAnnualInput ? insuranceAnnualInput.value : "");
      const hoaMonthly = toNumber(hoaMonthlyInput ? hoaMonthlyInput.value : "");
      const pmiMonthly = toNumber(pmiMonthlyInput ? pmiMonthlyInput.value : "");

      // Validation
      if (!validatePositive(loanAmount, "loan amount")) return;
      if (!validateNonNegative(interestRateApr, "interest rate")) return;
      if (!validatePositive(termYears, "loan term (years)")) return;

      if (termYears > 50) {
        setResultError("Enter a loan term that is realistic (50 years or less).");
        return;
      }

      if (interestRateApr > 100) {
        setResultError("Enter a realistic interest rate (100% or less).");
        return;
      }

      if (!validateNonNegative(propertyTaxAnnual, "property taxes (annual)")) return;
      if (!validateNonNegative(insuranceAnnual, "home insurance (annual)")) return;
      if (!validateNonNegative(hoaMonthly, "HOA or levies (monthly)")) return;
      if (!validateNonNegative(pmiMonthly, "PMI or bond insurance (monthly)")) return;

      // Calculation logic (standard amortization)
      const n = Math.round(termYears * 12);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid loan term (years) greater than 0.");
        return;
      }

      const monthlyRate = (interestRateApr / 100) / 12;

      let principalAndInterestMonthly = 0;

      if (monthlyRate === 0) {
        principalAndInterestMonthly = loanAmount / n;
      } else {
        const pow = Math.pow(1 + monthlyRate, n);
        const denom = pow - 1;
        if (denom === 0) {
          setResultError("Enter a valid interest rate and term.");
          return;
        }
        principalAndInterestMonthly = loanAmount * (monthlyRate * pow) / denom;
      }

      const totalPaid = principalAndInterestMonthly * n;
      const totalInterest = totalPaid - loanAmount;

      const monthlyTax = propertyTaxAnnual > 0 ? (propertyTaxAnnual / 12) : 0;
      const monthlyInsurance = insuranceAnnual > 0 ? (insuranceAnnual / 12) : 0;

      const extrasMonthly = monthlyTax + monthlyInsurance + (hoaMonthly || 0) + (pmiMonthly || 0);
      const totalMonthlyOutflow = principalAndInterestMonthly + extrasMonthly;

      const hasAnyExtras =
        monthlyTax > 0 ||
        monthlyInsurance > 0 ||
        (hoaMonthly || 0) > 0 ||
        (pmiMonthly || 0) > 0;

      const piStr = formatNumberTwoDecimals(principalAndInterestMonthly);
      const totalStr = formatNumberTwoDecimals(totalMonthlyOutflow);
      const interestStr = formatNumberTwoDecimals(totalInterest);

      const taxStr = formatNumberTwoDecimals(monthlyTax);
      const insStr = formatNumberTwoDecimals(monthlyInsurance);
      const hoaStr = formatNumberTwoDecimals(hoaMonthly || 0);
      const pmiStr = formatNumberTwoDecimals(pmiMonthly || 0);
      const extrasStr = formatNumberTwoDecimals(extrasMonthly);

      let resultHtml = "";
      resultHtml += `<p><strong>Monthly principal and interest:</strong> ${piStr}</p>`;

      if (hasAnyExtras) {
        resultHtml += `<p><strong>Estimated total monthly cost:</strong> ${totalStr}</p>`;
        resultHtml += `<ul class="result-grid">
          <li><strong>Monthly extras total:</strong> ${extrasStr}</li>
          <li>Property taxes (monthly): ${taxStr}</li>
          <li>Home insurance (monthly): ${insStr}</li>
          <li>HOA or levies (monthly): ${hoaStr}</li>
          <li>PMI or bond insurance (monthly): ${pmiStr}</li>
        </ul>`;
      } else {
        resultHtml += `<p><strong>Estimated total monthly cost:</strong> ${piStr}</p>`;
        resultHtml += `<p>Optional monthly costs were not included (assumed 0). Use Advanced monthly costs if you want a more realistic total.</p>`;
      }

      resultHtml += `<p><strong>Total interest over the full term:</strong> ${interestStr}</p>`;
      resultHtml += `<p>This estimate assumes the interest rate stays the same for the entire term.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Mortgage Payment (Loans Category Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
