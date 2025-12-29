document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanBalanceInput = document.getElementById("loanBalance");
  const annualRateInput = document.getElementById("annualRate");
  const termYearsInput = document.getElementById("termYears");
  const extraPaymentInput = document.getElementById("extraPayment");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used in this calculator)

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
  attachLiveFormatting(loanBalanceInput);
  attachLiveFormatting(annualRateInput);
  attachLiveFormatting(termYearsInput);
  attachLiveFormatting(extraPaymentInput);

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

  function formatCurrency(amount) {
    const safe = Number.isFinite(amount) ? amount : 0;
    return formatNumberTwoDecimals(safe);
  }

  function monthsToYearsMonths(totalMonths) {
    const m = Math.max(0, Math.floor(totalMonths));
    const years = Math.floor(m / 12);
    const months = m % 12;
    if (years <= 0) return months + " months";
    if (months === 0) return years + (years === 1 ? " year" : " years");
    return years + (years === 1 ? " year " : " years ") + months + " months";
  }

  function computeMonthlyPayment(principal, annualRatePercent, termMonths) {
    const r = (annualRatePercent / 100) / 12;
    if (r === 0) return principal / termMonths;
    const denom = 1 - Math.pow(1 + r, -termMonths);
    return (principal * r) / denom;
  }

  function simulatePayoff(principal, annualRatePercent, monthlyPayment) {
    const r = (annualRatePercent / 100) / 12;

    let balance = principal;
    let months = 0;
    let totalInterest = 0;

    const maxMonths = 1200; // hard guard
    while (balance > 0 && months < maxMonths) {
      const interest = balance * r;
      let principalPaid = monthlyPayment - interest;

      if (principalPaid <= 0) {
        return {
          ok: false,
          months: null,
          totalInterest: null,
          message: "Your payment is too low to reduce the balance at this interest rate."
        };
      }

      if (principalPaid > balance) principalPaid = balance;

      balance = balance - principalPaid;
      totalInterest += interest;
      months += 1;
    }

    if (months >= maxMonths) {
      return {
        ok: false,
        months: null,
        totalInterest: null,
        message: "This payoff takes too long to estimate with the current inputs. Reduce the term or increase the payment."
      };
    }

    return {
      ok: true,
      months: months,
      totalInterest: totalInterest
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const loanBalance = toNumber(loanBalanceInput ? loanBalanceInput.value : "");
      const annualRate = toNumber(annualRateInput ? annualRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");
      const extraPayment = toNumber(extraPaymentInput ? extraPaymentInput.value : "");

      // Basic existence guard
      if (!loanBalanceInput || !annualRateInput || !termYearsInput) return;

      // Validation
      if (!validatePositive(loanBalance, "loan balance")) return;
      if (!validateNonNegative(annualRate, "interest rate")) return;
      if (!validatePositive(termYears, "repayment term (years)")) return;
      if (!validateNonNegative(extraPayment, "extra monthly payment")) return;

      if (annualRate > 50) {
        setResultError("Enter an interest rate that looks realistic (0% to 50%).");
        return;
      }

      if (termYears > 50) {
        setResultError("Enter a repayment term of 50 years or less.");
        return;
      }

      const termMonths = Math.round(termYears * 12);
      if (!Number.isFinite(termMonths) || termMonths <= 0) {
        setResultError("Enter a valid repayment term (years).");
        return;
      }

      // Calculation logic (standard fixed-rate amortization)
      const basePayment = computeMonthlyPayment(loanBalance, annualRate, termMonths);

      if (!Number.isFinite(basePayment) || basePayment <= 0) {
        setResultError("Enter inputs that produce a valid payment.");
        return;
      }

      // Standard schedule totals (no extra payments)
      const standardTotalPaid = basePayment * termMonths;
      const standardTotalInterest = Math.max(0, standardTotalPaid - loanBalance);

      // Extra payment scenario (optional)
      const totalMonthlyWithExtra = basePayment + (Number.isFinite(extraPayment) ? extraPayment : 0);

      let extraHtml = "";
      if (extraPayment > 0) {
        const sim = simulatePayoff(loanBalance, annualRate, totalMonthlyWithExtra);

        if (!sim.ok) {
          setResultError(sim.message);
          return;
        }

        const totalPaidWithExtra = loanBalance + sim.totalInterest;
        const interestSaved = Math.max(0, standardTotalInterest - sim.totalInterest);
        const monthsSaved = Math.max(0, termMonths - sim.months);

        extraHtml = `
          <hr class="result-sep">
          <p><strong>With extra payment:</strong> ${formatCurrency(totalMonthlyWithExtra)} per month</p>
          <p><strong>Estimated payoff time:</strong> ${monthsToYearsMonths(sim.months)} (save ${monthsToYearsMonths(monthsSaved)})</p>
          <p><strong>Total interest with extra:</strong> ${formatCurrency(sim.totalInterest)}</p>
          <p><strong>Interest saved:</strong> ${formatCurrency(interestSaved)}</p>
          <p><strong>Total paid with extra:</strong> ${formatCurrency(totalPaidWithExtra)}</p>
        `;
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated monthly payment:</strong> ${formatCurrency(basePayment)}</p>
        <p><strong>Total interest (standard term):</strong> ${formatCurrency(standardTotalInterest)}</p>
        <p><strong>Total paid (standard term):</strong> ${formatCurrency(standardTotalPaid)}</p>
        <p><strong>Payoff time (standard term):</strong> ${monthsToYearsMonths(termMonths)}</p>
        ${extraHtml}
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
      const message = "Student Loan Payment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
