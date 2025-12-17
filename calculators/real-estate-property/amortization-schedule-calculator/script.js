document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const loanAmountInput = document.getElementById("loanAmount");
  const annualRateInput = document.getElementById("annualRate");
  const termYearsInput = document.getElementById("termYears");
  const startDateInput = document.getElementById("startDate");
  const extraPaymentInput = document.getElementById("extraPayment");
  const rowsToShowInput = document.getElementById("rowsToShow");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(loanAmountInput);
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
    const trimmed = (raw || "").trim();
    if (!trimmed) return new Date();

    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;

    const dt = new Date(y, mo - 1, d);
    if (Number.isNaN(dt.getTime())) return null;

    // Basic sanity check: JS Date autocorrect can roll over
    if (dt.getFullYear() !== y || dt.getMonth() !== (mo - 1) || dt.getDate() !== d) return null;

    return dt;
  }

  function addMonths(dateObj, monthsToAdd) {
    const d = new Date(dateObj.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + monthsToAdd);

    // If month rollover changed day (eg 31st), clamp by stepping back
    while (d.getDate() !== day && d.getDate() < day) {
      d.setDate(d.getDate() - 1);
    }
    return d;
  }

  function formatDateYYYYMM(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    return y + "-" + m;
  }

  function safeMoney(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const principal = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const annualRate = toNumber(annualRateInput ? annualRateInput.value : "");
      const termYears = toNumber(termYearsInput ? termYearsInput.value : "");
      const extraPayment = toNumber(extraPaymentInput ? extraPaymentInput.value : "");
      const rowsToShowRaw = toNumber(rowsToShowInput ? rowsToShowInput.value : "");
      const startDate = parseStartDateOrToday(startDateInput ? startDateInput.value : "");

      if (!loanAmountInput || !annualRateInput || !termYearsInput || !resultDiv) return;

      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(annualRate, "interest rate")) return;
      if (!validatePositive(termYears, "loan term (years)")) return;
      if (!validateNonNegative(extraPayment, "extra monthly payment")) return;

      if (startDate === null) {
        setResultError("Enter a valid start date in YYYY-MM-DD format, or leave it blank.");
        return;
      }

      const n = Math.round(termYears * 12);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid loan term in years.");
        return;
      }

      const r = (annualRate / 100) / 12;

      let basePayment = 0;
      if (r === 0) {
        basePayment = principal / n;
      } else {
        const pow = Math.pow(1 + r, n);
        basePayment = principal * (r * pow) / (pow - 1);
      }

      if (!Number.isFinite(basePayment) || basePayment <= 0) {
        setResultError("Unable to calculate a monthly payment with the values provided.");
        return;
      }

      const paymentWithExtra = basePayment + (Number.isFinite(extraPayment) ? extraPayment : 0);

      // Build schedule
      const schedule = [];
      let balance = principal;
      let totalInterest = 0;
      let totalPaid = 0;

      // Hard safety cap to avoid infinite loops on bad inputs
      const maxMonths = 1200;

      for (let i = 1; i <= maxMonths; i++) {
        if (balance <= 0) break;

        const interest = (r === 0) ? 0 : balance * r;
        let principalPaid = paymentWithExtra - interest;

        if (principalPaid <= 0) {
          setResultError("Your payment is not enough to cover monthly interest. Increase the payment or reduce the interest rate.");
          return;
        }

        let actualPayment = paymentWithExtra;

        if (principalPaid > balance) {
          principalPaid = balance;
          actualPayment = principalPaid + interest;
        }

        balance = balance - principalPaid;

        totalInterest += interest;
        totalPaid += actualPayment;

        const payDate = addMonths(startDate, i - 1);

        schedule.push({
          monthIndex: i,
          dateLabel: formatDateYYYYMM(payDate),
          payment: actualPayment,
          principal: principalPaid,
          interest: interest,
          balance: Math.max(0, balance)
        });

        if (balance <= 0) break;
      }

      if (schedule.length === 0) {
        setResultError("No schedule could be generated with the values provided.");
        return;
      }

      const payoffMonths = schedule.length;
      const payoffDate = addMonths(startDate, payoffMonths - 1);

      // Determine rows to display
      let rowsToShow = 24;
      if (Number.isFinite(rowsToShowRaw)) {
        const asInt = Math.round(rowsToShowRaw);
        if (asInt === 0) rowsToShow = 0;
        if (asInt > 0) rowsToShow = asInt;
      }

      const rows = (rowsToShow === 0) ? schedule : schedule.slice(0, Math.min(rowsToShow, schedule.length));

      // Build table HTML
      let tableRowsHtml = "";
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        tableRowsHtml +=
          "<tr>" +
            "<td>" + row.dateLabel + "</td>" +
            "<td>" + safeMoney(row.payment) + "</td>" +
            "<td>" + safeMoney(row.principal) + "</td>" +
            "<td>" + safeMoney(row.interest) + "</td>" +
            "<td>" + safeMoney(row.balance) + "</td>" +
          "</tr>";
      }

      const shownNote =
        (rowsToShow === 0 || rows.length === schedule.length)
          ? "Showing full schedule (" + schedule.length + " months)."
          : "Showing first " + rows.length + " of " + schedule.length + " months. Set Schedule display to 0 to show all months.";

      const resultHtml =
        '<div class="result-summary">' +
          '<p><strong>Base monthly payment:</strong> ' + safeMoney(basePayment) + '</p>' +
          '<p><strong>Monthly payment with extra:</strong> ' + safeMoney(paymentWithExtra) + '</p>' +
          '<p><strong>Total interest paid:</strong> ' + safeMoney(totalInterest) + '</p>' +
          '<p><strong>Total amount repaid:</strong> ' + safeMoney(totalPaid) + '</p>' +
          '<p><strong>Estimated payoff date:</strong> ' + formatDateYYYYMM(payoffDate) + ' (' + payoffMonths + ' months)</p>' +
          '<p>' + shownNote + '</p>' +
        '</div>' +
        '<div class="table-wrap" role="region" aria-label="Amortization schedule table">' +
          '<table class="amort-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Month</th>' +
                '<th>Payment</th>' +
                '<th>Principal</th>' +
                '<th>Interest</th>' +
                '<th>Balance</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              tableRowsHtml +
            '</tbody>' +
          '</table>' +
        '</div>';

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Amortization Schedule Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
