document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const principalInput = document.getElementById("principal");
  const annualRateInput = document.getElementById("annualRate");
  const termYearsInput = document.getElementById("termYears");
  const paymentsPerYearSelect = document.getElementById("paymentsPerYear");
  const compoundingPerYearSelect = document.getElementById("compoundingPerYear");
  const extraPaymentInput = document.getElementById("extraPayment");

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
  attachLiveFormatting(principalInput);
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(principalInput ? principalInput.value : "");
      const annualRatePercent = toNumber(annualRateInput ? annualRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");
      const paymentsPerYear = toNumber(paymentsPerYearSelect ? paymentsPerYearSelect.value : "");
      const compoundingPerYear = toNumber(compoundingPerYearSelect ? compoundingPerYearSelect.value : "");
      const extraPayment = toNumber(extraPaymentInput ? extraPaymentInput.value : "");

      // Basic existence guard
      if (!principalInput || !annualRateInput || !termYearsInput || !paymentsPerYearSelect || !compoundingPerYearSelect || !extraPaymentInput) {
        return;
      }

      // Validation
      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(annualRatePercent, "interest rate")) return;
      if (!validatePositive(termYears, "loan term")) return;
      if (!validatePositive(paymentsPerYear, "payment frequency")) return;
      if (!validatePositive(compoundingPerYear, "compounding frequency")) return;
      if (!validateNonNegative(extraPayment, "extra payment")) return;

      const annualRate = annualRatePercent / 100;
      const totalScheduledPaymentsRaw = termYears * paymentsPerYear;

      if (!Number.isFinite(totalScheduledPaymentsRaw) || totalScheduledPaymentsRaw <= 0) {
        setResultError("Enter a valid loan term and payment frequency.");
        return;
      }

      const totalScheduledPayments = Math.round(totalScheduledPaymentsRaw);

      // Effective interest rate per payment period (handles different compounding vs payment frequencies)
      let periodRate = 0;
      if (annualRate > 0) {
        periodRate = Math.pow(1 + annualRate / compoundingPerYear, compoundingPerYear / paymentsPerYear) - 1;
      }

      // Baseline payment for the selected term (without extra)
      let basePayment = 0;
      if (periodRate === 0) {
        basePayment = principal / totalScheduledPayments;
      } else {
        const denom = 1 - Math.pow(1 + periodRate, -totalScheduledPayments);
        if (denom <= 0) {
          setResultError("These inputs produce an invalid payment calculation. Check the term and rate.");
          return;
        }
        basePayment = (principal * periodRate) / denom;
      }

      const paymentWithExtra = basePayment + extraPayment;

      // Simulate amortization to produce totals and payoff timing
      let balance = principal;
      let totalInterest = 0;
      let totalPaid = 0;
      let paymentsMade = 0;

      const maxPayments = 2000 * Math.max(1, paymentsPerYear); // large safety cap

      for (let i = 0; i < maxPayments; i++) {
        if (balance <= 0) break;

        const interestForPeriod = balance * periodRate;

        // Negative amortization check: payment must at least cover interest when rate > 0
        if (periodRate > 0 && paymentWithExtra <= interestForPeriod + 1e-12) {
          setResultError("Payment is too small to cover interest each period. Reduce extra assumptions or adjust inputs.");
          return;
        }

        let principalPaid = paymentWithExtra - interestForPeriod;

        // Final payment adjustment (avoid overpaying)
        if (principalPaid >= balance) {
          const finalPayment = interestForPeriod + balance;
          totalPaid += finalPayment;
          totalInterest += interestForPeriod;
          paymentsMade += 1;
          balance = 0;
          break;
        } else {
          balance -= principalPaid;
          totalPaid += paymentWithExtra;
          totalInterest += interestForPeriod;
          paymentsMade += 1;
        }
      }

      if (balance > 0) {
        setResultError("Could not complete the payoff simulation with these inputs. Try adjusting the term or payment frequency.");
        return;
      }

      const scheduledTotalPaid = basePayment * totalScheduledPayments;
      const scheduledTotalInterest = scheduledTotalPaid - principal;

      const interestSaved = scheduledTotalInterest - totalInterest;
      const paymentsReduced = totalScheduledPayments - paymentsMade;

      const effectiveAnnualRate = annualRate > 0 ? (Math.pow(1 + annualRate / compoundingPerYear, compoundingPerYear) - 1) : 0;

      const resultHtml = `
        <p><strong>Estimated payment (per period):</strong> ${formatNumberTwoDecimals(basePayment)}</p>
        <p><strong>Payment with extra:</strong> ${formatNumberTwoDecimals(paymentWithExtra)}</p>
        <p><strong>Total paid (with extra):</strong> ${formatNumberTwoDecimals(totalPaid)}</p>
        <p><strong>Total interest (with extra):</strong> ${formatNumberTwoDecimals(totalInterest)}</p>
        <p><strong>Payoff time (with extra):</strong> ${paymentsMade} payments</p>
        <hr>
        <p><strong>Scheduled payoff (no extra):</strong> ${totalScheduledPayments} payments</p>
        <p><strong>Scheduled total interest (no extra):</strong> ${formatNumberTwoDecimals(scheduledTotalInterest)}</p>
        <p><strong>Estimated interest saved:</strong> ${formatNumberTwoDecimals(Math.max(0, interestSaved))}</p>
        <p><strong>Estimated payments reduced:</strong> ${Math.max(0, paymentsReduced)}</p>
        <hr>
        <p><strong>Effective annual rate (based on compounding):</strong> ${formatNumberTwoDecimals(effectiveAnnualRate * 100)}%</p>
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
      const message = "Compound Interest Loan Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
