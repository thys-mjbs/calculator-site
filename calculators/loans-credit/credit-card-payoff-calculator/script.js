document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const balanceEl = document.getElementById("balance");
  const aprEl = document.getElementById("apr");
  const monthlyPaymentEl = document.getElementById("monthlyPayment");
  const extraMonthlyEl = document.getElementById("extraMonthly");
  const lumpSumEl = document.getElementById("lumpSum");
  const startDateEl = document.getElementById("startDate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(balanceEl);
  attachLiveFormatting(aprEl);
  attachLiveFormatting(monthlyPaymentEl);
  attachLiveFormatting(extraMonthlyEl);
  attachLiveFormatting(lumpSumEl);

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

  function parseStartDateOrToday(raw) {
    const s = (raw || "").trim();
    if (!s) return new Date();

    // Expect YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);

    const dt = new Date(y, mo, d);
    if (!Number.isFinite(dt.getTime())) return null;

    // Guard against invalid dates like 2025-02-31
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;

    return dt;
  }

  function addMonths(dateObj, monthsToAdd) {
    const d = new Date(dateObj.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + monthsToAdd);

    // If month roll causes date shift, clamp to last day of prior month
    if (d.getDate() !== day) {
      d.setDate(0);
    }
    return d;
  }

  function formatDateYYYYMMDD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function simulatePayoff(balance, aprPercent, monthlyPayment, extraMonthly, lumpSum) {
    const monthlyRate = (aprPercent / 100) / 12;

    let remaining = Math.max(0, balance - lumpSum);
    let month = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    // If already paid off by lump sum
    if (remaining <= 0) {
      return {
        months: 0,
        totalInterest: 0,
        totalPaid: balance,
        paidToPrincipal: balance,
        success: true
      };
    }

    // Safety cap: 100 years
    const MAX_MONTHS = 1200;

    while (remaining > 0 && month < MAX_MONTHS) {
      const interest = remaining * monthlyRate;
      totalInterest += interest;

      const paymentThisMonth = Math.max(0, monthlyPayment + extraMonthly);
      const minNeededToReduce = interest + 0.01;

      if (paymentThisMonth < minNeededToReduce) {
        return {
          success: false,
          reason: "PaymentTooSmall",
          monthlyInterest: interest
        };
      }

      const paymentApplied = Math.min(paymentThisMonth, remaining + interest);
      totalPaid += paymentApplied;

      // Payment first covers interest, then principal
      const principalReduction = Math.max(0, paymentApplied - interest);
      remaining = Math.max(0, remaining - principalReduction);

      month += 1;
    }

    if (remaining > 0) {
      return {
        success: false,
        reason: "TooLong"
      };
    }

    const paidToPrincipal = balance;
    return {
      months: month,
      totalInterest: totalInterest,
      totalPaid: paidToPrincipal + totalInterest,
      paidToPrincipal: paidToPrincipal,
      success: true
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const balance = toNumber(balanceEl ? balanceEl.value : "");
      const apr = toNumber(aprEl ? aprEl.value : "");
      const monthlyPayment = toNumber(monthlyPaymentEl ? monthlyPaymentEl.value : "");
      const extraMonthly = toNumber(extraMonthlyEl ? extraMonthlyEl.value : "");
      const lumpSum = toNumber(lumpSumEl ? lumpSumEl.value : "");

      if (!balanceEl || !aprEl || !monthlyPaymentEl) return;

      if (!validatePositive(balance, "balance")) return;
      if (!validateNonNegative(apr, "APR")) return;
      if (!validatePositive(monthlyPayment, "monthly payment")) return;
      if (!validateNonNegative(extraMonthly, "extra monthly payment")) return;
      if (!validateNonNegative(lumpSum, "one-time extra payment")) return;

      if (lumpSum > balance) {
        setResultError("One-time extra payment cannot be greater than the current balance.");
        return;
      }

      const startDate = parseStartDateOrToday(startDateEl ? startDateEl.value : "");
      if (startDate === null) {
        setResultError("Start date must be in YYYY-MM-DD format (example: 2025-12-19) or left blank.");
        return;
      }

      // Run main scenario (with extras)
      const withExtras = simulatePayoff(balance, apr, monthlyPayment, extraMonthly, lumpSum);

      if (!withExtras.success) {
        if (withExtras.reason === "PaymentTooSmall") {
          const mi = withExtras.monthlyInterest;
          const miStr = formatNumberTwoDecimals(mi);
          setResultError("Your monthly payment is too small to reduce the balance at this APR. Current month interest is about " + miStr + ". Increase your payment.");
          return;
        }
        setResultError("This payoff scenario exceeds a practical timeframe. Increase your payment or check your inputs.");
        return;
      }

      // Baseline scenario (no extras) only when user actually entered extras
      const hasExtras = (extraMonthly > 0) || (lumpSum > 0);
      let baseline = null;
      if (hasExtras) {
        baseline = simulatePayoff(balance, apr, monthlyPayment, 0, 0);
      }

      const payoffDate = addMonths(startDate, withExtras.months);
      const payoffDateStr = formatDateYYYYMMDD(payoffDate);

      const months = withExtras.months;
      const yearsPart = Math.floor(months / 12);
      const monthsPart = months % 12;

      const timeStrParts = [];
      if (yearsPart > 0) timeStrParts.push(yearsPart + (yearsPart === 1 ? " year" : " years"));
      timeStrParts.push(monthsPart + (monthsPart === 1 ? " month" : " months"));
      const timeStr = timeStrParts.join(", ");

      const totalInterestStr = formatNumberTwoDecimals(withExtras.totalInterest);
      const totalPaidStr = formatNumberTwoDecimals(withExtras.totalPaid);

      let comparisonHtml = "";
      if (baseline && baseline.success) {
        const basePayoffDate = addMonths(startDate, baseline.months);
        const basePayoffDateStr = formatDateYYYYMMDD(basePayoffDate);

        const monthsSaved = baseline.months - withExtras.months;
        const interestSaved = baseline.totalInterest - withExtras.totalInterest;

        const monthsSavedStr = String(Math.max(0, monthsSaved));
        const interestSavedStr = formatNumberTwoDecimals(Math.max(0, interestSaved));

        comparisonHtml =
          `<hr>` +
          `<p><strong>Without extra payments:</strong> ${baseline.months} months, payoff around ${basePayoffDateStr}, total interest ${formatNumberTwoDecimals(baseline.totalInterest)}.</p>` +
          `<p><strong>Impact of extras:</strong> save about <strong>${monthsSavedStr} months</strong> and <strong>${interestSavedStr}</strong> in interest.</p>`;
      }

      const resultHtml =
        `<p><strong>Estimated payoff time:</strong> ${months} months (${timeStr})</p>` +
        `<p><strong>Estimated payoff date:</strong> ${payoffDateStr}</p>` +
        `<p><strong>Total interest paid:</strong> ${totalInterestStr}</p>` +
        `<p><strong>Total paid (principal + interest):</strong> ${totalPaidStr}</p>` +
        `<p><strong>What this means:</strong> If you keep paying the same amount each month and stop adding new charges, your balance should reach zero around the payoff date above. Extra payments reduce both time and interest.</p>` +
        comparisonHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Credit Card Payoff Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
