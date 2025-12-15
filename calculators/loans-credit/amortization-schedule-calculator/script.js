document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAmountInput = document.getElementById("loanAmount");
  const annualRateInput = document.getElementById("annualRate");
  const termYearsInput = document.getElementById("termYears");
  const extraPaymentInput = document.getElementById("extraPayment");
  const showScheduleInput = document.getElementById("showSchedule");

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
  // helpers
  // ------------------------------------------------------------
  function money(n) {
    return formatNumberTwoDecimals(n);
  }

  function safePow(a, b) {
    // small guard against weird inputs; Math.pow handles most cases fine
    return Math.pow(a, b);
  }

  function buildScheduleHtml(rows) {
    let html = '<div class="amort-table-wrap">';
    html += '<table class="amort-table" aria-label="Amortization schedule table">';
    html += "<thead><tr>";
    html += "<th>#</th>";
    html += "<th>Payment</th>";
    html += "<th>Interest</th>";
    html += "<th>Principal</th>";
    html += "<th>Extra</th>";
    html += "<th>Balance</th>";
    html += "</tr></thead>";
    html += "<tbody>";

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      html += "<tr>";
      html += "<td>" + r.num + "</td>";
      html += "<td>" + money(r.payment) + "</td>";
      html += "<td>" + money(r.interest) + "</td>";
      html += "<td>" + money(r.principal) + "</td>";
      html += "<td>" + money(r.extra) + "</td>";
      html += "<td>" + money(r.balance) + "</td>";
      html += "</tr>";
    }

    html += "</tbody></table></div>";
    return html;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const principal = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const apr = toNumber(annualRateInput ? annualRateInput.value : "");
      const years = toNumber(termYearsInput ? termYearsInput.value : "");
      const extraMonthly = toNumber(extraPaymentInput ? extraPaymentInput.value : "");
      const showSchedule = showScheduleInput ? !!showScheduleInput.checked : true;

      // Basic existence guard
      if (!loanAmountInput || !annualRateInput || !termYearsInput || !extraPaymentInput) return;

      // Validation
      if (!validatePositive(principal, "loan amount")) return;
      if (!validateNonNegative(apr, "interest rate")) return;
      if (!validatePositive(years, "loan term")) return;
      if (!validateNonNegative(extraMonthly, "extra monthly payment")) return;

      // extra guardrails (avoid nonsense extremes)
      if (apr > 200) {
        setResultError("Interest rate looks unusually high. Enter an APR below 200%.");
        return;
      }
      if (years > 100) {
        setResultError("Loan term looks unusually long. Enter a term under 100 years.");
        return;
      }

      const n = Math.round(years * 12);
      if (!Number.isFinite(n) || n <= 0) {
        setResultError("Enter a valid loan term in years.");
        return;
      }

      const r = (apr / 100) / 12;

      let basePayment = 0;
      if (r === 0) {
        basePayment = principal / n;
      } else {
        const pow = safePow(1 + r, n);
        basePayment = principal * (r * pow) / (pow - 1);
      }

      if (!Number.isFinite(basePayment) || basePayment <= 0) {
        setResultError("Could not calculate a valid payment. Check your inputs.");
        return;
      }

      // Build amortization schedule
      let balance = principal;
      let totalInterest = 0;
      let totalPaid = 0;
      let months = 0;

      const rows = [];

      // Protect against infinite loops if extra is too small and payment doesn't cover interest
      // This can happen on interest-only style inputs (not intended here) or extreme APR.
      if (r > 0 && basePayment <= balance * r) {
        setResultError("Your payment does not cover the monthly interest at this rate. Increase term accuracy or reduce rate, or check the APR.");
        return;
      }

      while (balance > 0 && months < 5000) {
        months += 1;

        const interest = r === 0 ? 0 : balance * r;
        let principalPortion = basePayment - interest;

        if (principalPortion < 0) principalPortion = 0;

        let extra = extraMonthly;

        // If scheduled principal + extra would overpay, cap it
        let paymentThisMonth = basePayment;
        let principalReduction = principalPortion + extra;

        if (principalReduction > balance) {
          principalReduction = balance;
          extra = Math.max(0, principalReduction - principalPortion);
          paymentThisMonth = interest + principalReduction; // last payment adjusted
        } else {
          paymentThisMonth = basePayment + extra;
        }

        balance = balance - principalReduction;

        totalInterest += interest;
        totalPaid += paymentThisMonth;

        rows.push({
          num: months,
          payment: paymentThisMonth,
          interest: interest,
          principal: principalPortion,
          extra: extra,
          balance: balance < 0 ? 0 : balance
        });
      }

      if (months >= 5000) {
        setResultError("Calculation did not converge. Check inputs (rate, term, and extra payment).");
        return;
      }

      const standardTotalPaid = (basePayment * n);
      const standardTotalInterest = standardTotalPaid - principal;

      const monthsSaved = n - months;
      const interestSaved = standardTotalInterest - totalInterest;

      const yearsPayoff = Math.floor(months / 12);
      const monthsRemainder = months % 12;

      const payoffText = (yearsPayoff > 0)
        ? (yearsPayoff + " years " + monthsRemainder + " months")
        : (months + " months");

      let resultHtml = "";
      resultHtml += "<ul class='result-kpis'>";
      resultHtml += "<li><strong>Estimated monthly payment:</strong> " + money(basePayment) + "</li>";
      resultHtml += "<li><strong>Total interest (with extra payments):</strong> " + money(totalInterest) + "</li>";
      resultHtml += "<li><strong>Total paid (with extra payments):</strong> " + money(totalPaid) + "</li>";
      resultHtml += "<li><strong>Estimated payoff time (with extra payments):</strong> " + payoffText + "</li>";
      resultHtml += "</ul>";

      // Secondary insight: savings vs no-extra scenario (only meaningful if extra > 0)
      if (extraMonthly > 0) {
        resultHtml += "<p><strong>Impact of extra payments:</strong> You save about <strong>" + money(Math.max(0, interestSaved)) + "</strong> in interest and finish about <strong>" + Math.max(0, monthsSaved) + "</strong> months earlier, compared to making only the scheduled payment.</p>";
      } else {
        resultHtml += "<p><strong>Tip:</strong> Add a small extra monthly payment to see how much interest you can save and how much sooner you can finish.</p>";
      }

      if (showSchedule) {
        resultHtml += "<h3>Amortization schedule</h3>";
        resultHtml += buildScheduleHtml(rows);
      } else {
        resultHtml += "<p>Amortization table is hidden. Enable “Show full amortization table” to view month-by-month details.</p>";
      }

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
