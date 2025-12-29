document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const grossMonthlyIncome = document.getElementById("grossMonthlyIncome");
  const monthlyDebtPayments = document.getElementById("monthlyDebtPayments");
  const downPayment = document.getElementById("downPayment");
  const interestRate = document.getElementById("interestRate");
  const loanTermYears = document.getElementById("loanTermYears");

  const propertyTaxAnnual = document.getElementById("propertyTaxAnnual");
  const homeInsuranceAnnual = document.getElementById("homeInsuranceAnnual");
  const hoaMonthly = document.getElementById("hoaMonthly");
  const housingLimit = document.getElementById("housingLimit");
  const dtiLimit = document.getElementById("dtiLimit");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

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
  attachLiveFormatting(grossMonthlyIncome);
  attachLiveFormatting(monthlyDebtPayments);
  attachLiveFormatting(downPayment);
  attachLiveFormatting(propertyTaxAnnual);
  attachLiveFormatting(homeInsuranceAnnual);
  attachLiveFormatting(hoaMonthly);
  attachLiveFormatting(interestRate);
  attachLiveFormatting(loanTermYears);
  attachLiveFormatting(housingLimit);
  attachLiveFormatting(dtiLimit);

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

  function clampPercent(p, fallback) {
    if (!Number.isFinite(p)) return fallback;
    if (p <= 0) return fallback;
    if (p > 100) return 100;
    return p;
  }

  // Solve loan principal from payment (PMT), rate per period r, periods n
  function principalFromPayment(payment, r, n) {
    if (!Number.isFinite(payment) || payment <= 0) return 0;
    if (!Number.isFinite(n) || n <= 0) return 0;

    if (!Number.isFinite(r) || r === 0) {
      return payment * n;
    }

    const pow = Math.pow(1 + r, n);
    const principal = payment * (pow - 1) / (r * pow);
    return principal;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const income = toNumber(grossMonthlyIncome ? grossMonthlyIncome.value : "");
      const debts = toNumber(monthlyDebtPayments ? monthlyDebtPayments.value : "");
      const dp = toNumber(downPayment ? downPayment.value : "");
      const aprPercent = toNumber(interestRate ? interestRate.value : "");
      const termYears = toNumber(loanTermYears ? loanTermYears.value : "");

      const taxAnnual = toNumber(propertyTaxAnnual ? propertyTaxAnnual.value : "");
      const insAnnual = toNumber(homeInsuranceAnnual ? homeInsuranceAnnual.value : "");
      const hoa = toNumber(hoaMonthly ? hoaMonthly.value : "");

      const housingLimitPercent = toNumber(housingLimit ? housingLimit.value : "");
      const dtiLimitPercent = toNumber(dtiLimit ? dtiLimit.value : "");

      // Basic existence guard
      if (
        !grossMonthlyIncome ||
        !monthlyDebtPayments ||
        !downPayment ||
        !interestRate ||
        !loanTermYears
      ) {
        return;
      }

      // Validation (required inputs)
      if (!validatePositive(income, "gross monthly income")) return;
      if (!validateNonNegative(debts, "monthly debt payments")) return;
      if (!validateNonNegative(dp, "down payment")) return;
      if (!validatePositive(termYears, "loan term (years)")) return;
      if (!Number.isFinite(aprPercent) || aprPercent < 0) {
        setResultError("Enter a valid interest rate (0 or higher).");
        return;
      }
      if (!validateNonNegative(taxAnnual, "property tax (per year)")) return;
      if (!validateNonNegative(insAnnual, "homeowners insurance (per year)")) return;
      if (!validateNonNegative(hoa, "HOA / levies (per month)")) return;

      const housingPct = clampPercent(housingLimitPercent, 28);
      const dtiPct = clampPercent(dtiLimitPercent, 36);

      // Guard against impossible ratio setup
      if (housingPct <= 0 || dtiPct <= 0) {
        setResultError("Enter valid ratio limits (greater than 0%).");
        return;
      }

      // Calculation logic
      const grossHousingCap = (housingPct / 100) * income;
      const grossTotalDebtCap = (dtiPct / 100) * income;

      const housingCapFromDTI = grossTotalDebtCap - debts;

      const maxTotalHousingPayment = Math.min(grossHousingCap, housingCapFromDTI);

      if (!Number.isFinite(maxTotalHousingPayment) || maxTotalHousingPayment <= 0) {
        setResultError(
          "Based on the ratios and your current debts, there is no room for a mortgage payment. Reduce monthly debts, increase income, or adjust the ratio limits."
        );
        return;
      }

      const monthlyTax = taxAnnual / 12;
      const monthlyIns = insAnnual / 12;
      const monthlyExtras = monthlyTax + monthlyIns + hoa;

      const maxPI = maxTotalHousingPayment - monthlyExtras;

      if (!Number.isFinite(maxPI) || maxPI <= 0) {
        setResultError(
          "Your estimated taxes, insurance, and HOA costs use up the full housing budget. Reduce those costs, increase income, or adjust the ratio limits."
        );
        return;
      }

      const n = Math.round(termYears * 12);
      const r = (aprPercent / 100) / 12;

      const maxLoanAmount = principalFromPayment(maxPI, r, n);

      if (!Number.isFinite(maxLoanAmount) || maxLoanAmount <= 0) {
        setResultError("Could not calculate a valid loan amount from the inputs.");
        return;
      }

      const maxHomePrice = maxLoanAmount + dp;

      // Build output HTML
      const maxHomePriceFmt = formatNumberTwoDecimals(maxHomePrice);
      const maxLoanFmt = formatNumberTwoDecimals(maxLoanAmount);

      const maxHousingFmt = formatNumberTwoDecimals(maxTotalHousingPayment);
      const maxPIFmt = formatNumberTwoDecimals(maxPI);

      const monthlyExtrasFmt = formatNumberTwoDecimals(monthlyExtras);
      const monthlyTaxFmt = formatNumberTwoDecimals(monthlyTax);
      const monthlyInsFmt = formatNumberTwoDecimals(monthlyIns);
      const hoaFmt = formatNumberTwoDecimals(hoa);

      const grossHousingCapFmt = formatNumberTwoDecimals(grossHousingCap);
      const grossTotalDebtCapFmt = formatNumberTwoDecimals(grossTotalDebtCap);
      const housingCapFromDTIFmt = formatNumberTwoDecimals(housingCapFromDTI);

      const resultHtml = `
        <p><strong>Maximum home price:</strong> ${maxHomePriceFmt}</p>
        <p><strong>Maximum loan amount:</strong> ${maxLoanFmt}</p>

        <hr>

        <p><strong>Maximum total monthly housing payment:</strong> ${maxHousingFmt}</p>
        <p><strong>Maximum monthly principal + interest (P&amp;I):</strong> ${maxPIFmt}</p>

        <p><strong>Monthly non-mortgage costs included:</strong> ${monthlyExtrasFmt}</p>
        <p style="margin-top:6px;">
          Breakdown: Property tax ${monthlyTaxFmt} + Insurance ${monthlyInsFmt} + HOA/Levies ${hoaFmt}
        </p>

        <hr>

        <p><strong>Limits used:</strong></p>
        <p style="margin-top:6px;">
          Housing ratio (${housingPct}% of income): ${grossHousingCapFmt}<br>
          Back-end DTI (${dtiPct}% of income) minus debts: ${housingCapFromDTIFmt}<br>
          Total debt cap (${dtiPct}% of income): ${grossTotalDebtCapFmt}
        </p>

        <p style="margin-top:10px;">
          Interpretation: Your affordability is set by the tighter of the two limits above. If you want a safer payment, aim below the maximum home price.
        </p>
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
      const message =
        "Mortgage Affordability (Loans Category Version) - check this calculator: " +
        pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
