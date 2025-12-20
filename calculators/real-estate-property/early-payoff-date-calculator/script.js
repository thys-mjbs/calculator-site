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
  const monthlyPaymentInput = document.getElementById("monthlyPayment");
  const extraMonthlyPaymentInput = document.getElementById("extraMonthlyPayment");
  const firstPaymentDateInput = document.getElementById("firstPaymentDate");

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
  attachLiveFormatting(loanBalanceInput);
  attachLiveFormatting(monthlyPaymentInput);
  attachLiveFormatting(extraMonthlyPaymentInput);
  attachLiveFormatting(annualRateInput);

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

  function parseDateYYYYMMDD(value) {
    const raw = (value || "").trim();
    if (!raw) return null;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    // Validate round-trip to catch invalid dates like 2025-02-31
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== mo - 1 ||
      dt.getUTCDate() !== d
    ) return null;
    return dt;
  }

  function addMonthsUTC(dateUtc, monthsToAdd) {
    const d = new Date(dateUtc.getTime());
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();

    // Move to first of target month, then clamp day to last day of month
    const target = new Date(Date.UTC(y, m + monthsToAdd, 1));
    const targetY = target.getUTCFullYear();
    const targetM = target.getUTCMonth();

    const lastDay = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
    const clampedDay = Math.min(day, lastDay);

    return new Date(Date.UTC(targetY, targetM, clampedDay));
  }

  function formatMonthYearUTC(dateUtc) {
    const y = dateUtc.getUTCFullYear();
    const m = dateUtc.getUTCMonth() + 1;
    const mm = String(m).padStart(2, "0");
    return y + "-" + mm;
  }

  function simulatePayoff(balance, monthlyRate, monthlyPayment, startDateUtc) {
    const maxMonths = 1200; // 100 years cap to prevent infinite loops
    let b = balance;
    let totalInterest = 0;
    let totalPaid = 0;
    let months = 0;

    // Payment date is end-of-period; first payment date is given by startDateUtc
    // We return payoffDate as the date of the final payment.
    let payoffDateUtc = startDateUtc;

    for (let i = 0; i < maxMonths; i++) {
      const interest = b * monthlyRate;
      const principalRoom = monthlyPayment - interest;

      if (principalRoom <= 0) {
        return {
          ok: false,
          reason: "paymentTooSmall",
          months: 0,
          payoffDateUtc: null,
          totalInterest: 0,
          totalPaid: 0,
          finalPayment: 0
        };
      }

      let paymentThisMonth = monthlyPayment;

      if (paymentThisMonth > b + interest) {
        paymentThisMonth = b + interest; // final partial payment
      }

      totalInterest += interest;
      totalPaid += paymentThisMonth;

      const principalPaid = paymentThisMonth - interest;
      b = b - principalPaid;

      months += 1;
      payoffDateUtc = addMonthsUTC(startDateUtc, months - 1);

      if (b <= 0.0000001) {
        return {
          ok: true,
          months: months,
          payoffDateUtc: payoffDateUtc,
          totalInterest: totalInterest,
          totalPaid: totalPaid,
          finalPayment: paymentThisMonth
        };
      }
    }

    return {
      ok: false,
      reason: "tooLong",
      months: months,
      payoffDateUtc: null,
      totalInterest: totalInterest,
      totalPaid: totalPaid,
      finalPayment: 0
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Optional: if you have modes, read it here:
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      const balance = toNumber(loanBalanceInput ? loanBalanceInput.value : "");
      const aprPercent = toNumber(annualRateInput ? annualRateInput.value : "");
      const monthlyPayment = toNumber(monthlyPaymentInput ? monthlyPaymentInput.value : "");
      const extraPayment = toNumber(extraMonthlyPaymentInput ? extraMonthlyPaymentInput.value : "");
      const dateStr = firstPaymentDateInput ? firstPaymentDateInput.value : "";

      // Basic existence guard
      if (!loanBalanceInput || !annualRateInput || !monthlyPaymentInput) return;

      // Validation
      if (!validatePositive(balance, "current loan balance")) return;
      if (!validateNonNegative(extraPayment, "extra monthly payment")) return;

      if (!Number.isFinite(aprPercent) || aprPercent < 0 || aprPercent > 100) {
        setResultError("Enter a valid annual interest rate (0% to 100%).");
        return;
      }

      if (!validatePositive(monthlyPayment, "monthly payment")) return;

      const monthlyRate = (aprPercent / 100) / 12;

      // Date handling
      let startDateUtc = parseDateYYYYMMDD(dateStr);
      if (!startDateUtc) {
        const now = new Date();
        startDateUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      }

      // Scenario A: baseline
      const baseline = simulatePayoff(balance, monthlyRate, monthlyPayment, startDateUtc);
      if (!baseline.ok) {
        if (baseline.reason === "paymentTooSmall") {
          setResultError("Your monthly payment is too small to cover monthly interest. Increase the payment or confirm the rate and balance.");
          return;
        }
        setResultError("Unable to calculate a payoff timeline with these inputs. Check your values and try again.");
        return;
      }

      // Scenario B: with extra (optional)
      const extraMonthly = Number.isFinite(extraPayment) ? extraPayment : 0;
      const acceleratedPayment = monthlyPayment + extraMonthly;
      let accelerated = null;

      if (extraMonthly > 0) {
        accelerated = simulatePayoff(balance, monthlyRate, acceleratedPayment, startDateUtc);
        if (!accelerated.ok) {
          setResultError("With the extra payment added, the calculator could not compute a payoff. Re-check the inputs.");
          return;
        }
      }

      // Build output HTML
      const baselinePayoff = baseline.payoffDateUtc ? formatMonthYearUTC(baseline.payoffDateUtc) : "—";
      const baselineInterest = formatNumberTwoDecimals(baseline.totalInterest);
      const baselinePaid = formatNumberTwoDecimals(baseline.totalPaid);
      const baselineFinalPayment = formatNumberTwoDecimals(baseline.finalPayment);

      let resultHtml = "";
      resultHtml += `<p><strong>Baseline payoff:</strong> ${baselinePayoff} (${baseline.months} payments)</p>`;
      resultHtml += `<p><strong>Baseline total interest (from now):</strong> ${baselineInterest}</p>`;
      resultHtml += `<p><strong>Baseline total paid (from now):</strong> ${baselinePaid}</p>`;
      resultHtml += `<p><strong>Estimated final payment:</strong> ${baselineFinalPayment}</p>`;

      if (accelerated) {
        const accelPayoff = accelerated.payoffDateUtc ? formatMonthYearUTC(accelerated.payoffDateUtc) : "—";
        const accelInterest = formatNumberTwoDecimals(accelerated.totalInterest);
        const accelPaid = formatNumberTwoDecimals(accelerated.totalPaid);
        const accelFinalPayment = formatNumberTwoDecimals(accelerated.finalPayment);

        const monthsSaved = baseline.months - accelerated.months;
        const interestSaved = baseline.totalInterest - accelerated.totalInterest;

        resultHtml += `<hr>`;
        resultHtml += `<p><strong>With extra payment:</strong> ${formatNumberTwoDecimals(acceleratedPayment)} per month</p>`;
        resultHtml += `<p><strong>New payoff:</strong> ${accelPayoff} (${accelerated.months} payments)</p>`;
        resultHtml += `<p><strong>Months saved:</strong> ${monthsSaved}</p>`;
        resultHtml += `<p><strong>Interest saved (estimate):</strong> ${formatNumberTwoDecimals(interestSaved)}</p>`;
        resultHtml += `<p><strong>Total interest (with extra):</strong> ${accelInterest}</p>`;
        resultHtml += `<p><strong>Total paid (with extra):</strong> ${accelPaid}</p>`;
        resultHtml += `<p><strong>Estimated final payment (with extra):</strong> ${accelFinalPayment}</p>`;
      } else {
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Tip:</strong> Add an extra monthly payment to see how much time and interest you can save.</p>`;
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
      const message = "Early Payoff Date Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
