document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const balanceInput = document.getElementById("balance");
  const aprInput = document.getElementById("apr");
  const minRateInput = document.getElementById("minRate");
  const minFloorInput = document.getElementById("minFloor");
  const extraPaymentInput = document.getElementById("extraPayment");
  const targetMonthsInput = document.getElementById("targetMonths");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(balanceInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(minRateInput);
  attachLiveFormatting(minFloorInput);
  attachLiveFormatting(extraPaymentInput);
  attachLiveFormatting(targetMonthsInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  function formatYearsMonths(totalMonths) {
    const months = Math.max(0, Math.round(totalMonths));
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years <= 0) return rem + " months";
    if (rem === 0) return years + " years";
    return years + " years " + rem + " months";
  }

  // Simulate payoff with minimum rule (rate + floor) and optional extra
  function simulateMinimumPayoff(balance, monthlyRate, minRatePct, minFloor, extraPayment) {
    const maxMonths = 1200; // 100 years cap
    let month = 0;

    let totalPaid = 0;
    let totalInterest = 0;

    let firstPayment = null;
    let firstInterest = null;
    let firstPrincipal = null;

    while (balance > 0.005 && month < maxMonths) {
      month += 1;

      const interest = balance * monthlyRate;
      let payment = Math.max((minRatePct / 100) * balance, minFloor) + extraPayment;

      // Guard: if payment cannot even cover interest, balance will not decrease meaningfully
      if (payment <= interest + 0.005) {
        return {
          success: false,
          months: month,
          totalPaid,
          totalInterest,
          firstPayment,
          firstInterest,
          firstPrincipal,
          reason: "Your payment is not enough to cover monthly interest. This is the minimum payment trap. Increase the payment (or reduce the APR) so the payment is higher than the monthly interest."
        };
      }

      // Final month adjustment
      const payoffAmount = balance + interest;
      if (payment > payoffAmount) payment = payoffAmount;

      const principal = payment - interest;

      totalPaid += payment;
      totalInterest += interest;

      if (firstPayment === null) {
        firstPayment = payment;
        firstInterest = interest;
        firstPrincipal = principal;
      }

      balance -= principal;

      // Numeric stability
      if (!Number.isFinite(balance) || balance < 0) balance = 0;
    }

    if (month >= maxMonths) {
      return {
        success: false,
        months: month,
        totalPaid,
        totalInterest,
        firstPayment,
        firstInterest,
        firstPrincipal,
        reason: "Payoff exceeds the maximum model horizon. This typically means payments are extremely close to interest-only or the terms are unrealistic. Increase the payment or verify the APR and minimum payment settings."
      };
    }

    return {
      success: true,
      months: month,
      totalPaid,
      totalInterest,
      firstPayment,
      firstInterest,
      firstPrincipal
    };
  }

  // Simulate payoff with a fixed payment (used for target-month calculation)
  function simulateFixedPaymentPayoff(balance, monthlyRate, fixedPayment, targetMonthsCap) {
    const maxMonths = Math.max(1, targetMonthsCap);
    let month = 0;

    while (balance > 0.005 && month < maxMonths) {
      month += 1;
      const interest = balance * monthlyRate;

      if (fixedPayment <= interest + 0.005) {
        return { paidOff: false, monthsUsed: month, stuck: true };
      }

      let payment = fixedPayment;
      const payoffAmount = balance + interest;
      if (payment > payoffAmount) payment = payoffAmount;

      const principal = payment - interest;
      balance -= principal;

      if (!Number.isFinite(balance) || balance < 0) balance = 0;
    }

    return { paidOff: balance <= 0.005, monthsUsed: month, stuck: false };
  }

  function estimatePaymentForTargetMonths(balance, monthlyRate, targetMonths) {
    // Binary search a fixed payment that clears the balance within targetMonths
    const maxIter = 60;

    const firstMonthInterest = balance * monthlyRate;
    let low = firstMonthInterest + 0.01;
    let high = balance * (1 + monthlyRate) + 1;

    // Ensure high is sufficient (expand if needed)
    for (let i = 0; i < 20; i++) {
      const test = simulateFixedPaymentPayoff(balance, monthlyRate, high, targetMonths);
      if (test.paidOff) break;
      high *= 1.5;
      if (high > 1e9) break;
    }

    for (let i = 0; i < maxIter; i++) {
      const mid = (low + high) / 2;
      const sim = simulateFixedPaymentPayoff(balance, monthlyRate, mid, targetMonths);

      if (sim.stuck) {
        low = mid + 0.01;
        continue;
      }

      if (sim.paidOff) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return high;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const balance = toNumber(balanceInput ? balanceInput.value : "");
      const apr = toNumber(aprInput ? aprInput.value : "");
      const minRatePctRaw = toNumber(minRateInput ? minRateInput.value : "");
      const minFloorRaw = toNumber(minFloorInput ? minFloorInput.value : "");
      const extraPaymentRaw = toNumber(extraPaymentInput ? extraPaymentInput.value : "");
      const targetMonthsRaw = toNumber(targetMonthsInput ? targetMonthsInput.value : "");

      // Basic existence guard
      if (!balanceInput || !aprInput || !minRateInput || !minFloorInput || !extraPaymentInput || !targetMonthsInput) return;

      // Validation
      if (!validatePositive(balance, "current balance")) return;
      if (!validatePositive(apr, "APR")) return;

      // Defaults (optional inputs must not block output)
      let minRatePct = Number.isFinite(minRatePctRaw) && minRatePctRaw > 0 ? minRatePctRaw : 2;
      let minFloor = Number.isFinite(minFloorRaw) && minFloorRaw >= 0 ? minFloorRaw : 25;
      let extraPayment = Number.isFinite(extraPaymentRaw) && extraPaymentRaw >= 0 ? extraPaymentRaw : 0;

      // Guard against unrealistic entries
      minRatePct = clamp(minRatePct, 0.1, 50);
      minFloor = clamp(minFloor, 0, 1000000);
      extraPayment = clamp(extraPayment, 0, 1000000);

      const monthlyRate = (apr / 100) / 12;

      // Main simulation: minimum-only and minimum-plus-extra
      const minOnly = simulateMinimumPayoff(balance, monthlyRate, minRatePct, minFloor, 0);
      const minPlusExtra = extraPayment > 0
        ? simulateMinimumPayoff(balance, monthlyRate, minRatePct, minFloor, extraPayment)
        : null;

      if (!minOnly.success && !minPlusExtra) {
        setResultError(minOnly.reason);
        return;
      }

      // Optional target payoff months: estimate fixed payment needed
      let targetMonths = null;
      let targetPayment = null;
      let targetValid = false;

      if (Number.isFinite(targetMonthsRaw) && targetMonthsRaw > 0) {
        targetMonths = Math.round(clamp(targetMonthsRaw, 1, 600));
        targetPayment = estimatePaymentForTargetMonths(balance, monthlyRate, targetMonths);
        targetValid = Number.isFinite(targetPayment) && targetPayment > 0;
      }

      // Build output HTML
      const balanceFmt = formatNumberTwoDecimals(balance);
      const aprFmt = formatNumberTwoDecimals(apr);
      const minRateFmt = formatNumberTwoDecimals(minRatePct);
      const minFloorFmt = formatNumberTwoDecimals(minFloor);
      const extraFmt = formatNumberTwoDecimals(extraPayment);

      const minOnlyYears = minOnly.success ? formatYearsMonths(minOnly.months) : "Not payable with current settings";
      const minOnlyTotalPaid = formatNumberTwoDecimals(minOnly.totalPaid);
      const minOnlyTotalInterest = formatNumberTwoDecimals(minOnly.totalInterest);

      const firstPaymentMinOnly = minOnly.firstPayment !== null ? formatNumberTwoDecimals(minOnly.firstPayment) : "";
      const firstInterestMinOnly = minOnly.firstInterest !== null ? formatNumberTwoDecimals(minOnly.firstInterest) : "";
      const firstPrincipalMinOnly = minOnly.firstPrincipal !== null ? formatNumberTwoDecimals(minOnly.firstPrincipal) : "";

      let comparisonHtml = "";
      if (minPlusExtra && minPlusExtra.success) {
        const extraYears = formatYearsMonths(minPlusExtra.months);
        const extraTotalPaid = formatNumberTwoDecimals(minPlusExtra.totalPaid);
        const extraTotalInterest = formatNumberTwoDecimals(minPlusExtra.totalInterest);

        const monthsSaved = Math.max(0, minOnly.months - minPlusExtra.months);
        const interestSaved = Math.max(0, minOnly.totalInterest - minPlusExtra.totalInterest);

        comparisonHtml = `
          <div class="result-card">
            <h3>With extra payment</h3>
            <p class="result-metric"><strong>Extra per month:</strong> ${extraFmt}</p>
            <p class="result-metric"><strong>Estimated payoff time:</strong> ${extraYears}</p>
            <p class="result-metric"><strong>Total interest:</strong> ${extraTotalInterest}</p>
            <p class="result-metric"><strong>Total paid:</strong> ${extraTotalPaid}</p>
            <p class="result-note"><strong>Time saved:</strong> ${formatYearsMonths(monthsSaved)}. <strong>Interest saved:</strong> ${formatNumberTwoDecimals(interestSaved)}.</p>
          </div>
        `;
      } else if (minPlusExtra && !minPlusExtra.success) {
        comparisonHtml = `
          <div class="result-card">
            <h3>With extra payment</h3>
            <p class="result-metric">Even with the extra payment, the model indicates the payment may not reduce the balance meaningfully. Increase the payment so it stays above the monthly interest.</p>
          </div>
        `;
      }

      let targetHtml = "";
      if (targetMonths !== null) {
        if (!targetValid) {
          targetHtml = `
            <div class="result-card">
              <h3>Target payoff estimate</h3>
              <p class="result-metric">A target was provided, but the payment estimate could not be computed. Check the inputs and try again.</p>
            </div>
          `;
        } else {
          const targetPayFmt = formatNumberTwoDecimals(targetPayment);
          const firstMonthInterest = formatNumberTwoDecimals(balance * monthlyRate);

          targetHtml = `
            <div class="result-card">
              <h3>Payment needed for your target</h3>
              <p class="result-metric"><strong>Target payoff time:</strong> ${targetMonths} months</p>
              <p class="result-metric"><strong>Estimated fixed monthly payment:</strong> ${targetPayFmt}</p>
              <p class="result-metric"><strong>First-month interest (approx):</strong> ${firstMonthInterest}</p>
              <p class="result-note">This is a fixed-payment estimate. If you keep spending on the card, miss payments, or your APR changes, you will need a higher payment to hit the same target.</p>
            </div>
          `;
        }
      }

      // If min-only is not successful but extra path is successful, still show extra path and explain
      let minOnlyCard = "";
      if (minOnly.success) {
        minOnlyCard = `
          <div class="result-card">
            <h3>Minimum payment only</h3>
            <p class="result-metric"><strong>Balance:</strong> ${balanceFmt}</p>
            <p class="result-metric"><strong>APR:</strong> ${aprFmt}%</p>
            <p class="result-metric"><strong>Minimum rule:</strong> ${minRateFmt}% of balance (min ${minFloorFmt})</p>
            <p class="result-metric"><strong>Estimated payoff time:</strong> ${minOnlyYears}</p>
            <p class="result-metric"><strong>Total interest:</strong> ${minOnlyTotalInterest}</p>
            <p class="result-metric"><strong>Total paid:</strong> ${minOnlyTotalPaid}</p>
            <p class="result-note"><strong>First month (approx):</strong> payment ${firstPaymentMinOnly}, interest ${firstInterestMinOnly}, principal ${firstPrincipalMinOnly}.</p>
          </div>
        `;
      } else {
        minOnlyCard = `
          <div class="result-card">
            <h3>Minimum payment only</h3>
            <p class="result-metric">${minOnly.reason}</p>
          </div>
        `;
      }

      const assumptionsLine = `
        <p class="result-note">
          Assumptions used: no new purchases, APR stays constant, monthly interest compounding, minimum payment is max(percent of balance, floor) plus optional extra.
        </p>
      `;

      const resultHtml = `
        <div class="result-grid">
          ${minOnlyCard}
          ${comparisonHtml}
          ${targetHtml}
        </div>
        ${assumptionsLine}
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
      const message = "Minimum Payment Trap Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
