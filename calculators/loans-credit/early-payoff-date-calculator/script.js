document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const balanceInput = document.getElementById("balanceInput");
  const aprInput = document.getElementById("aprInput");
  const monthlyPaymentInput = document.getElementById("monthlyPaymentInput");
  const extraMonthlyInput = document.getElementById("extraMonthlyInput");
  const lumpSumInput = document.getElementById("lumpSumInput");
  const startDateInput = document.getElementById("startDateInput");

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
  attachLiveFormatting(balanceInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(monthlyPaymentInput);
  attachLiveFormatting(extraMonthlyInput);
  attachLiveFormatting(lumpSumInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
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

  function parseISODateOrNull(s) {
    const raw = (s || "").trim();
    if (!raw) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== (mo - 1) || dt.getUTCDate() !== d) return null;
    return dt;
  }

  function addMonthsUTC(dateUtc, monthsToAdd) {
    const y = dateUtc.getUTCFullYear();
    const m = dateUtc.getUTCMonth();
    const d = dateUtc.getUTCDate();

    const target = new Date(Date.UTC(y, m + monthsToAdd, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    const day = Math.min(d, lastDay);
    return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day));
  }

  function formatMonthYear(dateUtc) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[dateUtc.getUTCMonth()] + " " + String(dateUtc.getUTCFullYear());
  }

  function formatISO(dateUtc) {
    const y = dateUtc.getUTCFullYear();
    const m = String(dateUtc.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateUtc.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const balance = toNumber(balanceInput ? balanceInput.value : "");
      const aprPercent = toNumber(aprInput ? aprInput.value : "");
      const monthlyPayment = toNumber(monthlyPaymentInput ? monthlyPaymentInput.value : "");
      const extraMonthly = toNumber(extraMonthlyInput ? extraMonthlyInput.value : "");
      const lumpSum = toNumber(lumpSumInput ? lumpSumInput.value : "");
      const startDateRaw = startDateInput ? startDateInput.value : "";

      // Basic existence guard
      if (!balanceInput || !aprInput || !monthlyPaymentInput) return;

      // Validation
      if (!validatePositive(balance, "current balance")) return;
      if (!validateNonNegative(aprPercent, "interest rate (APR %)")) return;
      if (!validatePositive(monthlyPayment, "monthly payment")) return;
      if (!validateNonNegative(extraMonthly, "extra monthly payment")) return;
      if (!validateNonNegative(lumpSum, "one-time extra payment")) return;

      if (aprPercent > 200) {
        setResultError("Enter a realistic interest rate (APR %). If it is correct, use a smaller time step calculator because results may be unstable.");
        return;
      }

      const monthlyRate = (aprPercent / 100) / 12;

      // Apply one-time payment immediately
      let startingBalance = balance - lumpSum;
      if (startingBalance <= 0) {
        const todayUtc = new Date();
        const payoffDateLabel = "Paid off now";
        const resultHtml =
          `<p><strong>Payoff date:</strong> ${payoffDateLabel}</p>` +
          `<p><strong>Months remaining:</strong> 0</p>` +
          `<p><strong>Total interest (from now):</strong> ${formatNumberTwoDecimals(0)}</p>` +
          `<p><strong>Interest saved:</strong> ${formatNumberTwoDecimals(0)}</p>` +
          `<p><strong>Note:</strong> Your one-time payment is enough to clear the balance immediately.</p>`;
        setResultSuccess(resultHtml);
        return;
      }

      const totalMonthlyPayment = monthlyPayment + extraMonthly;

      // If payment cannot cover first month's interest, it will never amortize.
      const firstMonthInterest = startingBalance * monthlyRate;
      if (monthlyRate > 0 && totalMonthlyPayment <= firstMonthInterest + 0.000001) {
        setResultError("Your payment is too low to reduce the balance. Increase your monthly payment or add extra payments so it exceeds the monthly interest charge.");
        return;
      }

      function simulate(balance0, monthlyPay, rate) {
        let bal = balance0;
        let months = 0;
        let totalInterest = 0;

        // Hard cap to avoid infinite loops on edge cases
        const maxMonths = 2000;

        while (bal > 0 && months < maxMonths) {
          const interest = bal * rate;
          totalInterest += interest;

          const payment = Math.min(monthlyPay, bal + interest);
          bal = (bal + interest) - payment;

          // Numerical cleanup
          if (bal < 0.0000001) bal = 0;

          months += 1;
        }

        if (months >= maxMonths) {
          return { ok: false, months: months, totalInterest: totalInterest };
        }

        return { ok: true, months: months, totalInterest: totalInterest };
      }

      // Baseline scenario (no extra monthly, no lump sum)
      const baseline = simulate(balance, monthlyPayment, monthlyRate);
      if (!baseline.ok) {
        setResultError("Unable to calculate a payoff schedule with these inputs. Check the payment amount and interest rate.");
        return;
      }

      // Early payoff scenario (lump sum applied + extra monthly)
      const early = simulate(startingBalance, totalMonthlyPayment, monthlyRate);
      if (!early.ok) {
        setResultError("Unable to calculate a payoff schedule with these inputs. Try increasing your monthly payment.");
        return;
      }

      const monthsSaved = Math.max(0, baseline.months - early.months);
      const interestSaved = Math.max(0, baseline.totalInterest - early.totalInterest);

      // Date handling
      const userStart = parseISODateOrNull(startDateRaw);
      let payoffDateText = "";
      let baselinePayoffText = "";

      if (userStart) {
        const payoffDate = addMonthsUTC(userStart, early.months);
        const baselineDate = addMonthsUTC(userStart, baseline.months);
        payoffDateText = `${formatMonthYear(payoffDate)} (${formatISO(payoffDate)})`;
        baselinePayoffText = `${formatMonthYear(baselineDate)} (${formatISO(baselineDate)})`;
      } else {
        payoffDateText = `${early.months} month(s) from now`;
        baselinePayoffText = `${baseline.months} month(s) from now`;
      }

      const resultHtml =
        `<p><strong>Estimated payoff date:</strong> ${payoffDateText}</p>` +
        `<p><strong>Months remaining:</strong> ${early.months}</p>` +
        `<p><strong>Total interest (estimated):</strong> ${formatNumberTwoDecimals(early.totalInterest)}</p>` +
        `<p><strong>Compared to no extra payments:</strong> save ${monthsSaved} month(s) and ${formatNumberTwoDecimals(interestSaved)} in interest.</p>` +
        `<p><strong>Baseline payoff (no extras):</strong> ${baselinePayoffText}</p>`;

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
