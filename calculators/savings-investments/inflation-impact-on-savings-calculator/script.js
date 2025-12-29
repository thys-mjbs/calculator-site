document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startingBalanceInput = document.getElementById("startingBalance");
  const yearsInput = document.getElementById("years");
  const inflationRateInput = document.getElementById("inflationRate");
  const interestRateInput = document.getElementById("interestRate");
  const monthlyContributionInput = document.getElementById("monthlyContribution");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(startingBalanceInput);
  attachLiveFormatting(yearsInput);
  attachLiveFormatting(inflationRateInput);
  attachLiveFormatting(interestRateInput);
  attachLiveFormatting(monthlyContributionInput);

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

  function validateRate(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  function validateYears(value) {
    if (!Number.isFinite(value) || value <= 0 || value > 80) {
      setResultError("Enter a valid time horizon (years) between 1 and 80.");
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
      const startingBalance = toNumber(startingBalanceInput ? startingBalanceInput.value : "");
      const years = toNumber(yearsInput ? yearsInput.value : "");
      const inflationRatePct = toNumber(inflationRateInput ? inflationRateInput.value : "");

      const interestRatePct = toNumber(interestRateInput ? interestRateInput.value : "");
      const monthlyContribution = toNumber(monthlyContributionInput ? monthlyContributionInput.value : "");

      if (!startingBalanceInput || !yearsInput || !inflationRateInput) return;

      if (!validatePositive(startingBalance, "current savings balance")) return;
      if (!validateYears(years)) return;
      if (!validateRate(inflationRatePct, "expected inflation rate")) return;

      // Optional inputs default to 0 if blank or invalid
      const safeInterestRatePct = Number.isFinite(interestRatePct) ? interestRatePct : 0;
      const safeMonthlyContribution = Number.isFinite(monthlyContribution) ? monthlyContribution : 0;

      if (safeInterestRatePct < 0) {
        setResultError("Enter a valid expected savings interest rate (0 or higher).");
        return;
      }
      if (!validateNonNegative(safeMonthlyContribution, "monthly contribution")) return;

      // Convert rates
      const annualInflation = inflationRatePct / 100;
      const annualInterest = safeInterestRatePct / 100;

      // Monthly compounding assumption
      const months = Math.round(years * 12);
      const monthlyRate = annualInterest / 12;

      // Future Value with monthly contributions (end of month)
      let nominalFutureValue = 0;

      if (monthlyRate === 0) {
        nominalFutureValue = startingBalance + safeMonthlyContribution * months;
      } else {
        const growth = Math.pow(1 + monthlyRate, months);
        const fvStarting = startingBalance * growth;
        const fvContrib = safeMonthlyContribution * ((growth - 1) / monthlyRate);
        nominalFutureValue = fvStarting + fvContrib;
      }

      // Inflation adjustment
      const inflationFactor = Math.pow(1 + annualInflation, years);
      const realFutureValue = nominalFutureValue / inflationFactor;

      // "No interest" reference
      const nominalNoInterest = startingBalance + safeMonthlyContribution * months;
      const realNoInterest = nominalNoInterest / inflationFactor;

      // Real rate estimate from nominal and inflation (Fisher approx, exact ratio)
      const realRateExact = (1 + annualInterest) / (1 + annualInflation) - 1;

      // "Break-even" nominal rate to preserve purchasing power (pre-tax, ignoring fees)
      const breakEvenNominalPct = inflationRatePct;

      // Amount needed in the future to match today's starting balance purchasing power
      const nominalToMatchToday = startingBalance * inflationFactor;

      const diffReal = realFutureValue - startingBalance;
      const diffRealSign = diffReal >= 0 ? "higher" : "lower";
      const diffRealAbs = Math.abs(diffReal);

      const resultHtml = `
        <p><strong>Inflation-adjusted value (today’s money):</strong> ${formatNumberTwoDecimals(realFutureValue)}</p>
        <p><strong>Nominal future balance:</strong> ${formatNumberTwoDecimals(nominalFutureValue)}</p>

        <hr>

        <p><strong>Purchasing power change vs today:</strong> ${formatNumberTwoDecimals(diffRealAbs)} ${diffRealSign}</p>
        <p><strong>Estimated real interest rate:</strong> ${formatNumberTwoDecimals(realRateExact * 100)}%</p>

        <hr>

        <p><strong>Reference (no interest):</strong></p>
        <p>Nominal: ${formatNumberTwoDecimals(nominalNoInterest)} | Inflation-adjusted: ${formatNumberTwoDecimals(realNoInterest)}</p>

        <hr>

        <p><strong>What inflation does to your starting balance:</strong></p>
        <p>To have the same purchasing power as ${formatNumberTwoDecimals(startingBalance)} today, you would need about <strong>${formatNumberTwoDecimals(nominalToMatchToday)}</strong> in ${years} years (in nominal money), assuming ${formatNumberTwoDecimals(inflationRatePct)}% inflation.</p>

        <p><strong>Break-even rule of thumb:</strong> A nominal interest rate around <strong>${formatNumberTwoDecimals(breakEvenNominalPct)}%</strong> is needed just to keep up with inflation (before taxes and fees).</p>
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
      const message = "Inflation Impact on Savings Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
