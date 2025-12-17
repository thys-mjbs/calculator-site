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
  const interestRateInput = document.getElementById("interestRate");
  const amortYearsInput = document.getElementById("amortYears");
  const balloonYearsInput = document.getElementById("balloonYears");
  const refiRateInput = document.getElementById("refiRate");
  const refiYearsInput = document.getElementById("refiYears");

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
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(interestRateInput);
  attachLiveFormatting(amortYearsInput);
  attachLiveFormatting(balloonYearsInput);
  attachLiveFormatting(refiRateInput);
  attachLiveFormatting(refiYearsInput);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function monthlyPayment(principal, annualRatePct, termMonths) {
    if (termMonths <= 0) return NaN;
    const r = (annualRatePct / 100) / 12;
    if (!Number.isFinite(r)) return NaN;

    if (Math.abs(r) < 1e-12) {
      return principal / termMonths;
    }

    const pow = Math.pow(1 + r, termMonths);
    return principal * (r * pow) / (pow - 1);
  }

  function remainingBalance(principal, annualRatePct, termMonths, paymentsMade) {
    const r = (annualRatePct / 100) / 12;
    if (paymentsMade <= 0) return principal;
    if (paymentsMade >= termMonths) return 0;

    if (Math.abs(r) < 1e-12) {
      const paidPrincipal = (principal / termMonths) * paymentsMade;
      return Math.max(0, principal - paidPrincipal);
    }

    const pmt = monthlyPayment(principal, annualRatePct, termMonths);
    const pow = Math.pow(1 + r, paymentsMade);
    const bal = principal * pow - pmt * ((pow - 1) / r);
    return Math.max(0, bal);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const interestRate = toNumber(interestRateInput ? interestRateInput.value : "");
      const amortYears = toNumber(amortYearsInput ? amortYearsInput.value : "");
      const balloonYears = toNumber(balloonYearsInput ? balloonYearsInput.value : "");
      const refiRate = toNumber(refiRateInput ? refiRateInput.value : "");
      const refiYears = toNumber(refiYearsInput ? refiYearsInput.value : "");

      // Basic existence guard
      if (!loanAmountInput || !interestRateInput || !amortYearsInput || !balloonYearsInput) return;

      // Validation
      if (!validatePositive(loanAmount, "loan amount")) return;
      if (!validateNonNegative(interestRate, "interest rate")) return;
      if (!validatePositive(amortYears, "amortization term (years)")) return;
      if (!validatePositive(balloonYears, "balloon term (years)")) return;

      if (balloonYears > amortYears) {
        setResultError("Balloon term cannot be longer than the amortization term. Enter a balloon term that is less than or equal to the amortization term.");
        return;
      }

      if (interestRate > 100) {
        setResultError("Enter a realistic interest rate (APR %) below 100.");
        return;
      }

      // Calculation logic
      const amortMonths = Math.round(amortYears * 12);
      const balloonMonths = Math.round(balloonYears * 12);

      if (amortMonths <= 0 || balloonMonths <= 0) {
        setResultError("Enter valid year values for amortization term and balloon term.");
        return;
      }

      const pmt = monthlyPayment(loanAmount, interestRate, amortMonths);
      if (!Number.isFinite(pmt) || pmt <= 0) {
        setResultError("Could not calculate a payment with the values provided. Check your inputs and try again.");
        return;
      }

      const balAtBalloon = remainingBalance(loanAmount, interestRate, amortMonths, balloonMonths);

      const totalPaidToBalloon = pmt * balloonMonths;
      const principalPaidToBalloon = Math.max(0, loanAmount - balAtBalloon);
      const interestPaidToBalloon = Math.max(0, totalPaidToBalloon - principalPaidToBalloon);

      let refiBlockHtml = "";
      const refiRateProvided = Number.isFinite(refiRate) && refiRate > 0;
      const refiYearsProvided = Number.isFinite(refiYears) && refiYears > 0;

      if ((refiRateProvided && !refiYearsProvided) || (!refiRateProvided && refiYearsProvided)) {
        refiBlockHtml = `
          <hr>
          <p><strong>Refinance estimate:</strong> To estimate a refinance payment, enter both an optional refinance rate and an optional refinance term.</p>
        `;
      } else if (refiRateProvided && refiYearsProvided) {
        if (refiRate > 100) {
          setResultError("Enter a realistic refinance rate (APR %) below 100.");
          return;
        }
        const refiMonths = Math.round(refiYears * 12);
        const refiPmt = monthlyPayment(balAtBalloon, refiRate, refiMonths);

        if (Number.isFinite(refiPmt) && refiPmt > 0) {
          refiBlockHtml = `
            <hr>
            <p><strong>Optional refinance estimate at balloon:</strong></p>
            <p>Estimated new monthly payment: <strong>${formatNumberTwoDecimals(refiPmt)}</strong></p>
            <p class="small-note">This estimate assumes you refinance the balloon balance as a new loan and does not include fees or closing costs.</p>
          `;
        } else {
          refiBlockHtml = `
            <hr>
            <p><strong>Refinance estimate:</strong> Could not calculate a refinance payment with the optional values provided.</p>
          `;
        }
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Monthly payment (during balloon period):</strong> ${formatNumberTwoDecimals(pmt)}</p>
        <p><strong>Estimated balloon payment at year ${balloonYears}:</strong> ${formatNumberTwoDecimals(balAtBalloon)}</p>
        <hr>
        <p><strong>Paid by the balloon date (estimate):</strong></p>
        <p>Total paid: <strong>${formatNumberTwoDecimals(totalPaidToBalloon)}</strong></p>
        <p>Principal paid: <strong>${formatNumberTwoDecimals(principalPaidToBalloon)}</strong></p>
        <p>Interest paid: <strong>${formatNumberTwoDecimals(interestPaidToBalloon)}</strong></p>
        ${refiBlockHtml}
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
      const message = "Balloon Mortgage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
