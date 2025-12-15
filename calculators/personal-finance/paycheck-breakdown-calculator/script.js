document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const inputMode = document.getElementById("inputMode");
  const modeAnnualBlock = document.getElementById("modeAnnualBlock");
  const modePaycheckBlock = document.getElementById("modePaycheckBlock");

  const annualSalary = document.getElementById("annualSalary");
  const grossPerPaycheck = document.getElementById("grossPerPaycheck");
  const payFrequency = document.getElementById("payFrequency");
  const taxRate = document.getElementById("taxRate");
  const preTaxDeductions = document.getElementById("preTaxDeductions");
  const postTaxDeductions = document.getElementById("postTaxDeductions");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(annualSalary);
  attachLiveFormatting(grossPerPaycheck);
  attachLiveFormatting(preTaxDeductions);
  attachLiveFormatting(postTaxDeductions);

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
    if (modeAnnualBlock) modeAnnualBlock.classList.add("hidden");
    if (modePaycheckBlock) modePaycheckBlock.classList.add("hidden");

    if (mode === "annual" && modeAnnualBlock) modeAnnualBlock.classList.remove("hidden");
    if (mode === "paycheck" && modePaycheckBlock) modePaycheckBlock.classList.remove("hidden");

    clearResult();
  }

  if (inputMode) {
    showMode(inputMode.value);
    inputMode.addEventListener("change", function () {
      showMode(inputMode.value);
    });
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

  function getPeriodsPerYear(freq) {
    if (freq === "weekly") return 52;
    if (freq === "biweekly") return 26;
    if (freq === "semimonthly") return 24;
    if (freq === "monthly") return 12;
    return 26;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = inputMode ? inputMode.value : "annual";

      const salaryAnnual = toNumber(annualSalary ? annualSalary.value : "");
      const grossPaycheck = toNumber(grossPerPaycheck ? grossPerPaycheck.value : "");
      const freq = payFrequency ? payFrequency.value : "biweekly";
      const periodsPerYear = getPeriodsPerYear(freq);

      const taxRatePctRaw = toNumber(taxRate ? taxRate.value : "");
      const preTax = toNumber(preTaxDeductions ? preTaxDeductions.value : "");
      const postTax = toNumber(postTaxDeductions ? postTaxDeductions.value : "");

      if (!validateNonNegative(preTax, "pre-tax deductions")) return;
      if (!validateNonNegative(postTax, "post-tax deductions")) return;

      let effectiveTaxRatePct;
      if (Number.isFinite(taxRatePctRaw) && taxRatePctRaw > 0) {
        effectiveTaxRatePct = taxRatePctRaw;
      } else {
        effectiveTaxRatePct = 25;
      }

      if (!Number.isFinite(effectiveTaxRatePct) || effectiveTaxRatePct < 0 || effectiveTaxRatePct > 60) {
        setResultError("Enter a realistic tax rate between 0% and 60%, or leave it blank to use the default.");
        return;
      }

      let grossPerPeriod;
      if (mode === "annual") {
        if (!validatePositive(salaryAnnual, "annual salary")) return;
        grossPerPeriod = salaryAnnual / periodsPerYear;
      } else {
        if (!validatePositive(grossPaycheck, "gross per paycheck")) return;
        grossPerPeriod = grossPaycheck;
      }

      if (preTax > grossPerPeriod) {
        setResultError("Pre-tax deductions cannot be greater than gross pay per paycheck.");
        return;
      }

      const taxablePay = Math.max(0, grossPerPeriod - preTax);
      const estimatedTaxes = taxablePay * (effectiveTaxRatePct / 100);

      const totalWithholdings = preTax + estimatedTaxes + postTax;
      if (totalWithholdings > grossPerPeriod) {
        setResultError("Your taxes and deductions exceed your gross pay. Reduce deductions or adjust the tax rate.");
        return;
      }

      const netPay = Math.max(0, grossPerPeriod - estimatedTaxes - preTax - postTax);

      const annualGross = grossPerPeriod * periodsPerYear;
      const annualNet = netPay * periodsPerYear;

      const monthlyGross = annualGross / 12;
      const monthlyNet = annualNet / 12;

      const takeHomePct = grossPerPeriod > 0 ? (netPay / grossPerPeriod) * 100 : 0;

      const resultHtml = `
        <p><strong>Estimated net pay (take-home) per paycheck:</strong> ${formatNumberTwoDecimals(netPay)}</p>
        <p><strong>Take-home percentage:</strong> ${formatNumberTwoDecimals(takeHomePct)}%</p>
        <hr>
        <p><strong>Breakdown per paycheck</strong></p>
        <p>Gross pay: ${formatNumberTwoDecimals(grossPerPeriod)}</p>
        <p>Pre-tax deductions: ${formatNumberTwoDecimals(preTax)}</p>
        <p>Taxable pay (estimated): ${formatNumberTwoDecimals(taxablePay)}</p>
        <p>Taxes (estimated at ${formatNumberTwoDecimals(effectiveTaxRatePct)}%): ${formatNumberTwoDecimals(estimatedTaxes)}</p>
        <p>Post-tax deductions: ${formatNumberTwoDecimals(postTax)}</p>
        <hr>
        <p><strong>Equivalent net pay</strong></p>
        <p>Monthly net (estimated): ${formatNumberTwoDecimals(monthlyNet)}</p>
        <p>Annual net (estimated): ${formatNumberTwoDecimals(annualNet)}</p>
        <p style="margin-top:10px;"><em>Note:</em> If you left tax rate blank, a default 25% effective rate was used.</p>
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
      const message = "Paycheck Breakdown Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
