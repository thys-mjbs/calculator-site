document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyIncome = document.getElementById("monthlyIncome");
  const monthlyExpenses = document.getElementById("monthlyExpenses");
  const existingDebt = document.getElementById("existingDebt");
  const affordabilityPercent = document.getElementById("affordabilityPercent");
  const annualRate = document.getElementById("annualRate");
  const termYears = document.getElementById("termYears");
  const desiredLoanAmount = document.getElementById("desiredLoanAmount");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = document.getElementById("modeSelect");
  const modeCheckBlock = document.getElementById("modeCheckBlock");

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
  attachLiveFormatting(monthlyIncome);
  attachLiveFormatting(monthlyExpenses);
  attachLiveFormatting(existingDebt);
  attachLiveFormatting(affordabilityPercent);
  attachLiveFormatting(annualRate);
  attachLiveFormatting(termYears);
  attachLiveFormatting(desiredLoanAmount);

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
    if (modeCheckBlock) {
      if (mode === "checkLoan") {
        modeCheckBlock.classList.remove("hidden");
      } else {
        modeCheckBlock.classList.add("hidden");
      }
    }

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "maxLoan";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const income = toNumber(monthlyIncome ? monthlyIncome.value : "");
      const expenses = toNumber(monthlyExpenses ? monthlyExpenses.value : "");
      const debt = toNumber(existingDebt ? existingDebt.value : "");
      const pct = toNumber(affordabilityPercent ? affordabilityPercent.value : "");
      const rateAnnual = toNumber(annualRate ? annualRate.value : "");
      const years = toNumber(termYears ? termYears.value : "");
      const desiredPrincipal = toNumber(desiredLoanAmount ? desiredLoanAmount.value : "");

      // Basic existence guard
      if (!monthlyIncome || !monthlyExpenses || !existingDebt || !affordabilityPercent || !annualRate || !termYears) return;

      // Validation
      if (!validatePositive(income, "monthly net income")) return;
      if (!validateNonNegative(expenses, "monthly essential expenses")) return;
      if (!validateNonNegative(debt, "existing monthly debt payments")) return;
      if (!validatePositive(pct, "target percentage")) return;
      if (pct > 100) {
        setResultError("Target percentage should be 100 or less.");
        return;
      }
      if (!validatePositive(rateAnnual, "interest rate")) return;
      if (!validatePositive(years, "loan term (years)")) return;

      const remainingBudget = income - expenses - debt;
      if (!Number.isFinite(remainingBudget) || remainingBudget <= 0) {
        setResultError("Your remaining budget is 0 or less. Increase income or reduce expenses and existing debt.");
        return;
      }

      const paymentLimit = remainingBudget * (pct / 100);
      if (!Number.isFinite(paymentLimit) || paymentLimit <= 0) {
        setResultError("Your estimated payment limit is 0 or less. Adjust your inputs.");
        return;
      }

      const r = (rateAnnual / 100) / 12;
      const n = Math.round(years * 12);

      if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid interest rate and term.");
        return;
      }

      // Calculation logic (amortization)
      // Payment = P * r / (1 - (1+r)^-n)
      // Principal = Payment * (1 - (1+r)^-n) / r
      const discountFactor = 1 - Math.pow(1 + r, -n);
      if (!Number.isFinite(discountFactor) || discountFactor <= 0) {
        setResultError("Unable to calculate with these values. Check interest rate and term.");
        return;
      }

      let resultHtml = "";

      if (mode === "checkLoan") {
        if (!desiredLoanAmount) return;
        if (!validatePositive(desiredPrincipal, "loan amount to check")) return;

        const requiredPayment = desiredPrincipal * (r / discountFactor);
        const totalPaid = requiredPayment * n;
        const totalInterest = totalPaid - desiredPrincipal;

        const affordable = requiredPayment <= paymentLimit;

        resultHtml =
          `<p><strong>Estimated payment limit:</strong> ${formatNumberTwoDecimals(paymentLimit)}</p>` +
          `<p><strong>Required monthly payment:</strong> ${formatNumberTwoDecimals(requiredPayment)}</p>` +
          `<p><strong>Status:</strong> ${affordable ? "Within your estimated limit" : "Above your estimated limit"}</p>` +
          `<p><strong>Total repaid (estimated):</strong> ${formatNumberTwoDecimals(totalPaid)}</p>` +
          `<p><strong>Total interest (estimated):</strong> ${formatNumberTwoDecimals(totalInterest)}</p>` +
          `<p class="result-note">Note: Excludes fees and insurance. Use this as a baseline and compare to lender quotes.</p>`;
      } else {
        const maxPrincipal = paymentLimit * (discountFactor / r);
        const totalPaid = paymentLimit * n;
        const totalInterest = totalPaid - maxPrincipal;

        resultHtml =
          `<p><strong>Estimated payment limit:</strong> ${formatNumberTwoDecimals(paymentLimit)}</p>` +
          `<p><strong>Maximum affordable loan amount (estimated):</strong> ${formatNumberTwoDecimals(maxPrincipal)}</p>` +
          `<p><strong>Total repaid (estimated):</strong> ${formatNumberTwoDecimals(totalPaid)}</p>` +
          `<p><strong>Total interest (estimated):</strong> ${formatNumberTwoDecimals(totalInterest)}</p>` +
          `<p class="result-note">Note: Excludes fees and insurance. Lower payments are safer than maximizing borrowing.</p>`;
      }

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
      const message = "Loan Affordability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
