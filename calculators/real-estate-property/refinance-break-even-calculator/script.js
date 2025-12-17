document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currentBalanceInput = document.getElementById("currentBalance");
  const currentRateInput = document.getElementById("currentRate");
  const remainingYearsInput = document.getElementById("remainingYears");
  const newRateInput = document.getElementById("newRate");
  const newTermYearsInput = document.getElementById("newTermYears");
  const closingCostsInput = document.getElementById("closingCosts");
  const costsRolledSelect = document.getElementById("costsRolledIn");
  const stayMonthsInput = document.getElementById("stayMonths");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(currentBalanceInput);
  attachLiveFormatting(closingCostsInput);
  attachLiveFormatting(stayMonthsInput);

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

  function monthsFromYears(years) {
    const m = Math.round(years * 12);
    return m;
  }

  function monthlyPayment(principal, annualRatePercent, months) {
    const r = (annualRatePercent / 100) / 12;
    const n = months;

    if (!Number.isFinite(principal) || !Number.isFinite(r) || !Number.isFinite(n) || n <= 0) return NaN;

    if (r === 0) {
      return principal / n;
    }

    const pow = Math.pow(1 + r, -n);
    const denom = 1 - pow;
    if (denom === 0) return NaN;

    return (r * principal) / denom;
  }

  function safeCurrency(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const currentBalance = toNumber(currentBalanceInput ? currentBalanceInput.value : "");
      const currentRate = toNumber(currentRateInput ? currentRateInput.value : "");
      const remainingYears = toNumber(remainingYearsInput ? remainingYearsInput.value : "");
      const newRate = toNumber(newRateInput ? newRateInput.value : "");
      const newTermYearsRaw = toNumber(newTermYearsInput ? newTermYearsInput.value : "");
      const closingCosts = toNumber(closingCostsInput ? closingCostsInput.value : "");
      const stayMonthsRaw = toNumber(stayMonthsInput ? stayMonthsInput.value : "");

      // Basic existence guard
      if (
        !currentBalanceInput ||
        !currentRateInput ||
        !remainingYearsInput ||
        !newRateInput ||
        !newTermYearsInput ||
        !closingCostsInput ||
        !costsRolledSelect ||
        !stayMonthsInput
      ) return;

      // Validation
      if (!validatePositive(currentBalance, "current loan balance")) return;
      if (!validatePositive(currentRate, "current interest rate")) return;
      if (!validatePositive(remainingYears, "remaining term (years)")) return;
      if (!validatePositive(newRate, "new interest rate")) return;

      if (!validateNonNegative(closingCosts, "closing costs")) return;

      const remainingMonths = monthsFromYears(remainingYears);
      if (!Number.isFinite(remainingMonths) || remainingMonths <= 0) {
        setResultError("Enter a valid remaining term (years) greater than 0.");
        return;
      }

      let newTermYears = newTermYearsRaw;
      if (!Number.isFinite(newTermYears) || newTermYears <= 0) {
        newTermYears = remainingYears;
      }
      const newMonths = monthsFromYears(newTermYears);
      if (!Number.isFinite(newMonths) || newMonths <= 0) {
        setResultError("Enter a valid new term (years) greater than 0 (or leave it blank).");
        return;
      }

      let stayMonths = stayMonthsRaw;
      const hasStayMonths = Number.isFinite(stayMonths) && stayMonths > 0;
      if (hasStayMonths) {
        stayMonths = Math.round(stayMonths);
        if (stayMonths <= 0) {
          stayMonths = NaN;
        }
      }

      // Calculation logic
      const currentPmt = monthlyPayment(currentBalance, currentRate, remainingMonths);

      const costsMode = costsRolledSelect.value === "rolled" ? "rolled" : "upfront";
      const newPrincipal = costsMode === "rolled" ? (currentBalance + closingCosts) : currentBalance;

      const newPmt = monthlyPayment(newPrincipal, newRate, newMonths);

      if (!Number.isFinite(currentPmt) || !Number.isFinite(newPmt)) {
        setResultError("Could not calculate payments with the values provided. Double-check your rates and terms.");
        return;
      }

      const monthlySavings = currentPmt - newPmt;

      let breakEvenMonths = null;
      let breakEvenMessage = "";

      if (closingCosts === 0) {
        breakEvenMonths = 0;
        breakEvenMessage = "You entered zero closing costs, so break-even is immediate.";
      } else if (monthlySavings <= 0) {
        breakEvenMonths = null;
        breakEvenMessage = "This refinance does not reduce your monthly payment, so it may not break even on a payment-savings basis.";
      } else {
        breakEvenMonths = Math.ceil(closingCosts / monthlySavings);
        breakEvenMessage = "Break-even is when your cumulative monthly savings equals your closing costs.";
      }

      // Optional horizon insight (if user provides stay months)
      let horizonHtml = "";
      if (hasStayMonths) {
        const effectiveCosts = closingCosts; // shown as a simple cash cost for insight, even if rolled
        const grossSavings = monthlySavings * stayMonths;
        const netSavings = grossSavings - effectiveCosts;

        const netLabel = netSavings >= 0 ? "Estimated net savings" : "Estimated net shortfall";
        const netAbs = Math.abs(netSavings);

        horizonHtml = `
          <hr style="border:none;border-top:1px solid #e6e6e6;margin:12px 0;">
          <p><strong>Holding period insight (${stayMonths} months):</strong></p>
          <ul>
            <li><strong>Gross payment savings:</strong> ${safeCurrency(grossSavings)}</li>
            <li><strong>Closing costs used for this estimate:</strong> ${safeCurrency(effectiveCosts)} (${costsMode === "rolled" ? "rolled into loan" : "paid upfront"})</li>
            <li><strong>${netLabel}:</strong> ${safeCurrency(netAbs)}${netSavings >= 0 ? "" : " (you do not recover costs within this period)"}</li>
          </ul>
        `;
      }

      // Build output HTML
      const currentPmtFmt = safeCurrency(currentPmt);
      const newPmtFmt = safeCurrency(newPmt);
      const monthlySavingsFmt = safeCurrency(Math.abs(monthlySavings));

      let savingsLine = "";
      if (monthlySavings > 0) {
        savingsLine = `<p><strong>Estimated monthly savings:</strong> ${monthlySavingsFmt}</p>`;
      } else if (monthlySavings < 0) {
        savingsLine = `<p><strong>Estimated monthly increase:</strong> ${monthlySavingsFmt}</p>`;
      } else {
        savingsLine = `<p><strong>Estimated monthly change:</strong> ${monthlySavingsFmt}</p>`;
      }

      let breakEvenHtml = "";
      if (breakEvenMonths === 0) {
        breakEvenHtml = `<p><strong>Break-even time:</strong> 0 months</p><p>${breakEvenMessage}</p>`;
      } else if (breakEvenMonths === null) {
        breakEvenHtml = `<p><strong>Break-even time:</strong> Not reached (based on monthly payment savings)</p><p>${breakEvenMessage}</p>`;
      } else {
        breakEvenHtml = `<p><strong>Break-even time:</strong> ${breakEvenMonths} month${breakEvenMonths === 1 ? "" : "s"}</p><p>${breakEvenMessage}</p>`;
      }

      const resultHtml = `
        <p><strong>Current estimated payment:</strong> ${currentPmtFmt} per month</p>
        <p><strong>New estimated payment:</strong> ${newPmtFmt} per month</p>
        ${savingsLine}
        <p><strong>Closing costs:</strong> ${safeCurrency(closingCosts)} (${costsMode === "rolled" ? "rolled into loan" : "paid upfront"})</p>
        ${breakEvenHtml}
        ${horizonHtml}
        <p style="margin-top:10px;"><em>Note:</em> This compares principal-and-interest payments only. It does not include taxes, insurance, escrow, or fees that may change after refinancing.</p>
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
      const message = "Refinance Break-Even Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
