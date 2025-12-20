document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const homePriceInput = document.getElementById("homePrice");
  const downPaymentMode = document.getElementById("downPaymentMode");
  const downPaymentPercentInput = document.getElementById("downPaymentPercent");
  const downPaymentAmountInput = document.getElementById("downPaymentAmount");
  const creditScoreInput = document.getElementById("creditScore");
  const loanTermYearsInput = document.getElementById("loanTermYears");
  const interestRateInput = document.getElementById("interestRate");
  const customPmiRateInput = document.getElementById("customPmiRate");

  const downPaymentPercentBlock = document.getElementById("downPaymentPercentBlock");
  const downPaymentAmountBlock = document.getElementById("downPaymentAmountBlock");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money fields
  attachLiveFormatting(homePriceInput);
  attachLiveFormatting(downPaymentAmountInput);

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
    if (downPaymentPercentBlock) downPaymentPercentBlock.classList.add("hidden");
    if (downPaymentAmountBlock) downPaymentAmountBlock.classList.add("hidden");

    if (mode === "amount") {
      if (downPaymentAmountBlock) downPaymentAmountBlock.classList.remove("hidden");
    } else {
      if (downPaymentPercentBlock) downPaymentPercentBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (downPaymentMode) {
    showMode(downPaymentMode.value);
    downPaymentMode.addEventListener("change", function () {
      showMode(downPaymentMode.value);
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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.max(min, Math.min(max, value));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function pickEstimatedPmiRatePercentPerYear(ltvPercent, creditScore) {
    // Conservative, simplified PMI rate bands (annual % of loan amount)
    // Real quotes vary widely; this is for planning only.
    const cs = clamp(creditScore, 300, 850);

    let csTier = "t3";
    if (cs >= 760) csTier = "t1";
    else if (cs >= 740) csTier = "t2";
    else if (cs >= 720) csTier = "t3";
    else if (cs >= 700) csTier = "t4";
    else if (cs >= 680) csTier = "t5";
    else if (cs >= 660) csTier = "t6";
    else csTier = "t7";

    // LTV tiers: >95, >90, >85, >80, <=80
    let ltvTier = "l4";
    if (ltvPercent > 95) ltvTier = "l1";
    else if (ltvPercent > 90) ltvTier = "l2";
    else if (ltvPercent > 85) ltvTier = "l3";
    else if (ltvPercent > 80) ltvTier = "l4";
    else ltvTier = "l0";

    if (ltvTier === "l0") return 0;

    const table = {
      t1: { l1: 0.85, l2: 0.55, l3: 0.35, l4: 0.20 },
      t2: { l1: 0.95, l2: 0.65, l3: 0.40, l4: 0.23 },
      t3: { l1: 1.10, l2: 0.75, l3: 0.48, l4: 0.28 },
      t4: { l1: 1.30, l2: 0.90, l3: 0.60, l4: 0.35 },
      t5: { l1: 1.55, l2: 1.10, l3: 0.75, l4: 0.45 },
      t6: { l1: 1.80, l2: 1.30, l3: 0.90, l4: 0.55 },
      t7: { l1: 2.20, l2: 1.70, l3: 1.20, l4: 0.75 }
    };

    const rate = table[csTier] && table[csTier][ltvTier] ? table[csTier][ltvTier] : 0.60;
    return rate;
  }

  function monthlyPayment(principal, annualRatePercent, termYears) {
    const r = (annualRatePercent / 100) / 12;
    const n = Math.round(termYears * 12);

    if (!Number.isFinite(principal) || principal <= 0) return 0;
    if (!Number.isFinite(r) || r <= 0) {
      // Zero rate fallback: simple principal / months
      return n > 0 ? principal / n : 0;
    }
    if (!Number.isFinite(n) || n <= 0) return 0;

    const pow = Math.pow(1 + r, n);
    return principal * (r * pow) / (pow - 1);
  }

  function estimateMonthsToReachTargetBalance(principal, annualRatePercent, termYears, targetBalance) {
    const r = (annualRatePercent / 100) / 12;
    const n = Math.round(termYears * 12);
    const pmt = monthlyPayment(principal, annualRatePercent, termYears);

    if (!Number.isFinite(principal) || principal <= 0) return null;
    if (!Number.isFinite(targetBalance)) return null;
    if (principal <= targetBalance) return 0;

    // If rate is 0, linear payoff
    if (!Number.isFinite(r) || r <= 0) {
      if (pmt <= 0) return null;
      const months = Math.ceil((principal - targetBalance) / pmt);
      return clamp(months, 0, n);
    }

    if (!Number.isFinite(pmt) || pmt <= 0) return null;

    let balance = principal;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      let principalPaid = pmt - interest;
      if (principalPaid <= 0) return null;
      balance = balance - principalPaid;
      if (balance <= targetBalance) return m;
      if (balance < 0) return m;
    }
    return null;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const homePrice = toNumber(homePriceInput ? homePriceInput.value : "");
      const dpMode = downPaymentMode ? downPaymentMode.value : "percent";
      const dpPercent = toNumber(downPaymentPercentInput ? downPaymentPercentInput.value : "");
      const dpAmount = toNumber(downPaymentAmountInput ? downPaymentAmountInput.value : "");
      const creditScoreRaw = toNumber(creditScoreInput ? creditScoreInput.value : "");
      const loanTermYearsRaw = toNumber(loanTermYearsInput ? loanTermYearsInput.value : "");
      const interestRateRaw = toNumber(interestRateInput ? interestRateInput.value : "");
      const customPmiRateRaw = toNumber(customPmiRateInput ? customPmiRateInput.value : "");

      // Basic existence guard
      if (!homePriceInput || !resultDiv) return;

      // Validation: required minimum inputs
      if (!validatePositive(homePrice, "home price")) return;

      let downPaymentValue = 0;
      let downPaymentPercentFinal = 0;

      if (dpMode === "amount") {
        if (!Number.isFinite(dpAmount) || dpAmount < 0) {
          setResultError("Enter a valid down payment amount (0 or higher).");
          return;
        }
        if (dpAmount > homePrice) {
          setResultError("Down payment amount cannot be greater than the home price.");
          return;
        }
        downPaymentValue = dpAmount;
        downPaymentPercentFinal = homePrice > 0 ? (downPaymentValue / homePrice) * 100 : 0;
      } else {
        // Percent mode
        if (!Number.isFinite(dpPercent) || dpPercent < 0) {
          setResultError("Enter a valid down payment percent (0 or higher).");
          return;
        }
        if (dpPercent > 100) {
          setResultError("Down payment percent cannot be more than 100%.");
          return;
        }
        downPaymentPercentFinal = dpPercent;
        downPaymentValue = homePrice * (downPaymentPercentFinal / 100);
      }

      const loanAmount = homePrice - downPaymentValue;

      if (loanAmount <= 0) {
        const resultHtml =
          `<p><strong>Loan amount:</strong> ${formatNumberTwoDecimals(0)}</p>` +
          `<p><strong>LTV:</strong> 0.00%</p>` +
          `<p><strong>PMI estimate:</strong> No PMI (no loan balance).</p>`;
        setResultSuccess(resultHtml);
        return;
      }

      const ltvPercent = (loanAmount / homePrice) * 100;

      // If LTV <= 80, assume no PMI for planning
      if (ltvPercent <= 80) {
        const resultHtml =
          `<p><strong>Loan amount:</strong> ${formatNumberTwoDecimals(loanAmount)}</p>` +
          `<p><strong>Down payment:</strong> ${formatNumberTwoDecimals(downPaymentValue)} (${formatNumberTwoDecimals(downPaymentPercentFinal)}%)</p>` +
          `<p><strong>LTV:</strong> ${formatNumberTwoDecimals(ltvPercent)}%</p>` +
          `<p><strong>PMI estimate:</strong> No PMI expected (LTV is 80% or lower).</p>`;
        setResultSuccess(resultHtml);
        return;
      }

      // Optional defaults (only used if missing)
      const creditScore = Number.isFinite(creditScoreRaw) && creditScoreRaw > 0 ? clamp(creditScoreRaw, 300, 850) : 740;
      const loanTermYears = Number.isFinite(loanTermYearsRaw) && loanTermYearsRaw > 0 ? clamp(loanTermYearsRaw, 5, 40) : 30;
      const interestRate = Number.isFinite(interestRateRaw) && interestRateRaw > 0 ? clamp(interestRateRaw, 0.01, 30) : 7.0;

      // PMI rate: use override if provided, else estimate
      let pmiRateAnnualPercent = 0;
      let pmiRateSource = "Estimated";
      if (Number.isFinite(customPmiRateRaw) && customPmiRateRaw > 0) {
        pmiRateAnnualPercent = clamp(customPmiRateRaw, 0.01, 5.0);
        pmiRateSource = "Override";
      } else {
        pmiRateAnnualPercent = pickEstimatedPmiRatePercentPerYear(ltvPercent, creditScore);
        pmiRateSource = "Estimated";
      }

      // PMI cost
      const annualPmiAmount = loanAmount * (pmiRateAnnualPercent / 100);
      const monthlyPmiAmount = annualPmiAmount / 12;

      // Secondary insight: approximate month PMI could end at 80% LTV (original value)
      const targetBalance = homePrice * 0.80;
      const monthsTo80 = estimateMonthsToReachTargetBalance(loanAmount, interestRate, loanTermYears, targetBalance);

      let pmiEndLine = "<p><strong>PMI end estimate:</strong> Not enough info to estimate timeline.</p>";
      if (monthsTo80 === 0) {
        pmiEndLine = "<p><strong>PMI end estimate:</strong> Already at or below 80% LTV based on your numbers.</p>";
      } else if (Number.isFinite(monthsTo80) && monthsTo80 !== null) {
        const years = Math.floor(monthsTo80 / 12);
        const months = monthsTo80 % 12;
        const readable = (years > 0 ? years + " yr " : "") + months + " mo";
        pmiEndLine =
          `<p><strong>PMI end estimate:</strong> About ${readable} to reach ~80% LTV (planning estimate, assuming standard payments).</p>`;
      }

      const resultHtml =
        `<p><strong>Loan amount:</strong> ${formatNumberTwoDecimals(loanAmount)}</p>` +
        `<p><strong>Down payment:</strong> ${formatNumberTwoDecimals(downPaymentValue)} (${formatNumberTwoDecimals(downPaymentPercentFinal)}%)</p>` +
        `<p><strong>LTV:</strong> ${formatNumberTwoDecimals(ltvPercent)}%</p>` +
        `<p><strong>PMI rate:</strong> ${formatNumberTwoDecimals(pmiRateAnnualPercent)}% per year (${pmiRateSource})</p>` +
        `<p><strong>Estimated PMI:</strong> ${formatNumberTwoDecimals(monthlyPmiAmount)} per month (${formatNumberTwoDecimals(annualPmiAmount)} per year)</p>` +
        `<p><strong>Monthly principal + interest (estimate):</strong> ${formatNumberTwoDecimals(monthlyPayment(loanAmount, interestRate, loanTermYears))}</p>` +
        pmiEndLine +
        `<p><strong>All-in payment impact:</strong> PMI adds about ${formatNumberTwoDecimals(monthlyPmiAmount)} per month until it ends.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Mortgage Insurance (PMI) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
