document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const modeBlockMax = document.getElementById("modeBlockMax");
  const modeBlockCheck = document.getElementById("modeBlockCheck");

  // Max mode inputs
  const incomeMonthly = document.getElementById("incomeMonthly");
  const debtsMonthly = document.getElementById("debtsMonthly");
  const downPayment = document.getElementById("downPayment");
  const interestRate = document.getElementById("interestRate");
  const termYears = document.getElementById("termYears");
  const taxInsMonthly = document.getElementById("taxInsMonthly");
  const hoaMonthly = document.getElementById("hoaMonthly");
  const frontEndRatio = document.getElementById("frontEndRatio");
  const backEndRatio = document.getElementById("backEndRatio");

  // Check mode inputs
  const homePrice = document.getElementById("homePrice");
  const downPaymentCheck = document.getElementById("downPaymentCheck");
  const incomeMonthlyCheck = document.getElementById("incomeMonthlyCheck");
  const debtsMonthlyCheck = document.getElementById("debtsMonthlyCheck");
  const interestRateCheck = document.getElementById("interestRateCheck");
  const termYearsCheck = document.getElementById("termYearsCheck");
  const taxInsMonthlyCheck = document.getElementById("taxInsMonthlyCheck");
  const hoaMonthlyCheck = document.getElementById("hoaMonthlyCheck");
  const frontEndRatioCheck = document.getElementById("frontEndRatioCheck");
  const backEndRatioCheck = document.getElementById("backEndRatioCheck");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-ish inputs
  attachLiveFormatting(incomeMonthly);
  attachLiveFormatting(debtsMonthly);
  attachLiveFormatting(downPayment);
  attachLiveFormatting(taxInsMonthly);
  attachLiveFormatting(hoaMonthly);

  attachLiveFormatting(homePrice);
  attachLiveFormatting(downPaymentCheck);
  attachLiveFormatting(incomeMonthlyCheck);
  attachLiveFormatting(debtsMonthlyCheck);
  attachLiveFormatting(taxInsMonthlyCheck);
  attachLiveFormatting(hoaMonthlyCheck);

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
    if (!modeBlockMax || !modeBlockCheck) return;

    modeBlockMax.classList.add("hidden");
    modeBlockCheck.classList.add("hidden");

    if (mode === "check") modeBlockCheck.classList.remove("hidden");
    else modeBlockMax.classList.remove("hidden");

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
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

  function clampRatioPercent(value, label) {
    if (!Number.isFinite(value) || value <= 0 || value >= 100) {
      setResultError("Enter a valid " + label + " between 1 and 99.");
      return null;
    }
    return value;
  }

  function monthlyRateFromAnnualPercent(annualPercent) {
    return (annualPercent / 100) / 12;
  }

  function loanAmountFromPayment(paymentPI, annualRatePercent, termYearsVal) {
    const n = Math.round(termYearsVal * 12);
    if (!Number.isFinite(n) || n <= 0) return NaN;

    const r = monthlyRateFromAnnualPercent(annualRatePercent);

    if (!Number.isFinite(r) || r < 0) return NaN;
    if (r === 0) return paymentPI * n;

    const factor = 1 - Math.pow(1 + r, -n);
    if (factor <= 0) return NaN;

    return paymentPI * (factor / r);
  }

  function paymentFromLoanAmount(loanAmount, annualRatePercent, termYearsVal) {
    const n = Math.round(termYearsVal * 12);
    if (!Number.isFinite(n) || n <= 0) return NaN;

    const r = monthlyRateFromAnnualPercent(annualRatePercent);

    if (!Number.isFinite(r) || r < 0) return NaN;
    if (r === 0) return loanAmount / n;

    const pow = Math.pow(1 + r, n);
    return loanAmount * (r * pow) / (pow - 1);
  }

  function fmtMoney(x) {
    return formatNumberTwoDecimals(x);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "max";

      if (mode === "check") {
        const hp = toNumber(homePrice ? homePrice.value : "");
        const dp = toNumber(downPaymentCheck ? downPaymentCheck.value : "");
        const income = toNumber(incomeMonthlyCheck ? incomeMonthlyCheck.value : "");
        const debts = toNumber(debtsMonthlyCheck ? debtsMonthlyCheck.value : "");
        const rate = toNumber(interestRateCheck ? interestRateCheck.value : "");
        const term = toNumber(termYearsCheck ? termYearsCheck.value : "");
        const taxIns = toNumber(taxInsMonthlyCheck ? taxInsMonthlyCheck.value : "");
        const hoa = toNumber(hoaMonthlyCheck ? hoaMonthlyCheck.value : "");

        const ferRaw = toNumber(frontEndRatioCheck ? frontEndRatioCheck.value : "");
        const berRaw = toNumber(backEndRatioCheck ? backEndRatioCheck.value : "");
        const fer = Number.isFinite(ferRaw) && ferRaw > 0 ? ferRaw : 28;
        const ber = Number.isFinite(berRaw) && berRaw > 0 ? berRaw : 36;

        if (!validatePositive(hp, "home price")) return;
        if (!validateNonNegative(dp, "down payment")) return;
        if (dp >= hp) {
          setResultError("Down payment must be less than the home price.");
          return;
        }
        if (!validatePositive(income, "gross monthly income")) return;
        if (!validateNonNegative(debts, "monthly debt payments")) return;
        if (!validateNonNegative(taxIns, "taxes and insurance")) return;
        if (!validateNonNegative(hoa, "HOA or levies")) return;
        if (!validatePositive(term, "loan term (years)")) return;

        if (!Number.isFinite(rate) || rate < 0 || rate > 50) {
          setResultError("Enter a valid interest rate between 0 and 50.");
          return;
        }

        const ferOk = clampRatioPercent(fer, "housing ratio (front-end %)");
        if (ferOk === null) return;
        const berOk = clampRatioPercent(ber, "debt ratio (back-end %)");
        if (berOk === null) return;

        const loan = hp - dp;
        const pi = paymentFromLoanAmount(loan, rate, term);
        if (!Number.isFinite(pi) || pi <= 0) {
          setResultError("Unable to calculate the mortgage payment with these inputs.");
          return;
        }

        const housingTotal = pi + taxIns + hoa;
        const frontEnd = (housingTotal / income) * 100;
        const backEnd = ((housingTotal + debts) / income) * 100;

        const maxHousingByFront = income * (ferOk / 100);
        const maxHousingByBack = (income * (berOk / 100)) - debts;
        const maxHousingBudget = Math.min(maxHousingByFront, maxHousingByBack);

        const delta = maxHousingBudget - housingTotal;

        const verdict = (frontEnd <= ferOk) && (backEnd <= berOk) && (maxHousingByBack > 0);

        const resultHtml = `
          <p><strong>Verdict:</strong> ${verdict ? "Looks affordable under the selected ratio limits." : "Likely unaffordable under the selected ratio limits."}</p>
          <p><strong>Estimated monthly housing cost:</strong> ${fmtMoney(housingTotal)}<br>
             <span style="color:#555;">(Principal + interest ${fmtMoney(pi)} + taxes/insurance ${fmtMoney(taxIns)} + HOA/levies ${fmtMoney(hoa)})</span>
          </p>
          <p><strong>Housing ratio (front-end):</strong> ${formatNumberTwoDecimals(frontEnd)}% (limit ${formatNumberTwoDecimals(ferOk)}%)<br>
             <strong>Total debt ratio (back-end):</strong> ${formatNumberTwoDecimals(backEnd)}% (limit ${formatNumberTwoDecimals(berOk)}%)
          </p>
          <p><strong>Max monthly housing budget by ratios:</strong> ${fmtMoney(maxHousingBudget)}<br>
             <span style="color:#555;">Front-end allows ${fmtMoney(maxHousingByFront)}. Back-end allows ${fmtMoney(maxHousingByBack)}.</span>
          </p>
          <p><strong>Monthly buffer:</strong> ${fmtMoney(Math.abs(delta))} ${delta >= 0 ? "under" : "over"} the ratio-based limit.</p>
        `;

        setResultSuccess(resultHtml);
        return;
      }

      // Mode: max home price
      const income = toNumber(incomeMonthly ? incomeMonthly.value : "");
      const debts = toNumber(debtsMonthly ? debtsMonthly.value : "");
      const dp = toNumber(downPayment ? downPayment.value : "");
      const rate = toNumber(interestRate ? interestRate.value : "");
      const term = toNumber(termYears ? termYears.value : "");
      const taxIns = toNumber(taxInsMonthly ? taxInsMonthly.value : "");
      const hoa = toNumber(hoaMonthly ? hoaMonthly.value : "");

      const ferRaw = toNumber(frontEndRatio ? frontEndRatio.value : "");
      const berRaw = toNumber(backEndRatio ? backEndRatio.value : "");
      const fer = Number.isFinite(ferRaw) && ferRaw > 0 ? ferRaw : 28;
      const ber = Number.isFinite(berRaw) && berRaw > 0 ? berRaw : 36;

      if (!validatePositive(income, "gross monthly income")) return;
      if (!validateNonNegative(debts, "monthly debt payments")) return;
      if (!validateNonNegative(dp, "down payment")) return;
      if (!validateNonNegative(taxIns, "taxes and insurance")) return;
      if (!validateNonNegative(hoa, "HOA or levies")) return;
      if (!validatePositive(term, "loan term (years)")) return;

      if (!Number.isFinite(rate) || rate < 0 || rate > 50) {
        setResultError("Enter a valid interest rate between 0 and 50.");
        return;
      }

      const ferOk = clampRatioPercent(fer, "housing ratio (front-end %)");
      if (ferOk === null) return;
      const berOk = clampRatioPercent(ber, "debt ratio (back-end %)");
      if (berOk === null) return;

      const maxHousingByFront = income * (ferOk / 100);
      const maxHousingByBack = (income * (berOk / 100)) - debts;

      if (!Number.isFinite(maxHousingByBack) || maxHousingByBack <= 0) {
        setResultError("Your existing monthly debts leave no room under the selected debt ratio. Reduce debts, increase income, or increase the ratio limits.");
        return;
      }

      const maxHousingBudget = Math.min(maxHousingByFront, maxHousingByBack);
      const maxPI = maxHousingBudget - taxIns - hoa;

      if (!Number.isFinite(maxPI) || maxPI <= 0) {
        setResultError("After taxes, insurance, and HOA, there is no room left for the mortgage payment. Lower these costs, increase income, or adjust ratios.");
        return;
      }

      const loanMax = loanAmountFromPayment(maxPI, rate, term);
      if (!Number.isFinite(loanMax) || loanMax <= 0) {
        setResultError("Unable to calculate a loan amount with these inputs.");
        return;
      }

      const homePriceMax = loanMax + dp;

      const limiting = maxHousingByFront <= maxHousingByBack ? "housing ratio (front-end)" : "debt ratio (back-end)";
      const limitingBudget = Math.min(maxHousingByFront, maxHousingByBack);

      const resultHtml = `
        <p><strong>Estimated max home price:</strong> ${fmtMoney(homePriceMax)}</p>
        <p><strong>Estimated max loan amount:</strong> ${fmtMoney(loanMax)}<br>
           <span style="color:#555;">Down payment included: ${fmtMoney(dp)}</span>
        </p>
        <p><strong>Max monthly housing budget:</strong> ${fmtMoney(limitingBudget)}<br>
           <span style="color:#555;">Limited by ${limiting}. Front-end allows ${fmtMoney(maxHousingByFront)}. Back-end allows ${fmtMoney(maxHousingByBack)}.</span>
        </p>
        <p><strong>Monthly payment room for principal + interest:</strong> ${fmtMoney(maxPI)}<br>
           <span style="color:#555;">After taxes/insurance ${fmtMoney(taxIns)} and HOA/levies ${fmtMoney(hoa)}.</span>
        </p>
        <p><strong>Practical note:</strong> This is a planning estimate. Lenders may be stricter based on credit profile, income stability, and policy rules.</p>
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
      const message = "Mortgage Affordability (Personal Finance Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
