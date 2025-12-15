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
  const termMonthsInput = document.getElementById("termMonths");

  const balloonType = document.getElementById("balloonType");
  const balloonPercentBlock = document.getElementById("balloonPercentBlock");
  const balloonAmountBlock = document.getElementById("balloonAmountBlock");
  const balloonPercentInput = document.getElementById("balloonPercent");
  const balloonAmountInput = document.getElementById("balloonAmount");

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
  attachLiveFormatting(termMonthsInput);
  attachLiveFormatting(balloonPercentInput);
  attachLiveFormatting(balloonAmountInput);

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
    if (balloonPercentBlock) balloonPercentBlock.classList.add("hidden");
    if (balloonAmountBlock) balloonAmountBlock.classList.add("hidden");

    if (mode === "percent") {
      if (balloonPercentBlock) balloonPercentBlock.classList.remove("hidden");
    }

    if (mode === "amount") {
      if (balloonAmountBlock) balloonAmountBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (balloonType) {
    showMode(balloonType.value);
    balloonType.addEventListener("change", function () {
      showMode(balloonType.value);
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
      const mode = balloonType ? balloonType.value : "percent";

      const loanAmount = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const annualRate = toNumber(annualRateInput ? annualRateInput.value : "");
      const termMonths = toNumber(termMonthsInput ? termMonthsInput.value : "");

      const balloonPercentRaw = toNumber(balloonPercentInput ? balloonPercentInput.value : "");
      const balloonAmountRaw = toNumber(balloonAmountInput ? balloonAmountInput.value : "");

      if (!loanAmountInput || !annualRateInput || !termMonthsInput) return;

      if (!validatePositive(loanAmount, "loan amount")) return;
      if (!validateNonNegative(annualRate, "interest rate")) return;
      if (!validatePositive(termMonths, "loan term (months)")) return;

      if (termMonths > 1200) {
        setResultError("Enter a realistic loan term in months (for example, 6 to 480).");
        return;
      }

      let balloonValue = 0;

      if (mode === "percent") {
        let bp = Number.isFinite(balloonPercentRaw) ? balloonPercentRaw : 0;

        if (!Number.isFinite(bp) || bp < 0) {
          setResultError("Enter a valid balloon percentage (0 or higher).");
          return;
        }

        if (bp > 100) {
          setResultError("Balloon percentage must be 100 or less.");
          return;
        }

        if (!balloonPercentInput || balloonPercentInput.value.trim() === "") {
          bp = 20;
          if (balloonPercentInput) balloonPercentInput.value = "20";
        }

        balloonValue = (loanAmount * bp) / 100;
      } else {
        balloonValue = Number.isFinite(balloonAmountRaw) ? balloonAmountRaw : 0;

        if (balloonAmountInput && balloonAmountInput.value.trim() === "") {
          balloonValue = 0;
        }

        if (!validateNonNegative(balloonValue, "balloon amount")) return;
      }

      if (balloonValue > loanAmount) {
        setResultError("Balloon amount should not be greater than the loan amount.");
        return;
      }

      const monthlyRate = (annualRate / 100) / 12;
      const n = Math.round(termMonths);

      let monthlyPayment = 0;

      if (monthlyRate === 0) {
        monthlyPayment = (loanAmount - balloonValue) / n;
      } else {
        const discount = Math.pow(1 + monthlyRate, -n);
        const pvOfBalloon = balloonValue * discount;
        const numerator = monthlyRate * (loanAmount - pvOfBalloon);
        const denominator = 1 - discount;

        if (denominator === 0) {
          setResultError("These inputs produce an invalid calculation. Adjust the term or rate.");
          return;
        }

        monthlyPayment = numerator / denominator;
      }

      if (!Number.isFinite(monthlyPayment) || monthlyPayment < 0) {
        setResultError("These inputs produce an unrealistic result. Reduce the balloon or check the interest rate.");
        return;
      }

      const totalPaidBeforeBalloon = monthlyPayment * n;
      const principalRepaidBeforeBalloon = loanAmount - balloonValue;
      const interestPaidBeforeBalloon = totalPaidBeforeBalloon - principalRepaidBeforeBalloon;

      const totalCostIncludingBalloon = totalPaidBeforeBalloon + balloonValue;
      const totalInterestIncludingBalloon = totalCostIncludingBalloon - loanAmount;

      const monthlyPaymentDisplay = formatNumberTwoDecimals(monthlyPayment);
      const balloonDisplay = formatNumberTwoDecimals(balloonValue);
      const totalPaidBeforeBalloonDisplay = formatNumberTwoDecimals(totalPaidBeforeBalloon);
      const interestPaidBeforeBalloonDisplay = formatNumberTwoDecimals(interestPaidBeforeBalloon);
      const totalCostIncludingBalloonDisplay = formatNumberTwoDecimals(totalCostIncludingBalloon);
      const totalInterestIncludingBalloonDisplay = formatNumberTwoDecimals(totalInterestIncludingBalloon);

      const resultHtml = `
        <p><strong>Estimated monthly payment:</strong> ${monthlyPaymentDisplay}</p>
        <p><strong>Balloon payment due at the end:</strong> ${balloonDisplay}</p>
        <hr>
        <p><strong>Total paid before the balloon:</strong> ${totalPaidBeforeBalloonDisplay}</p>
        <p><strong>Interest paid before the balloon:</strong> ${interestPaidBeforeBalloonDisplay}</p>
        <p><strong>Total cost including the balloon:</strong> ${totalCostIncludingBalloonDisplay}</p>
        <p><strong>Total interest including the balloon:</strong> ${totalInterestIncludingBalloonDisplay}</p>
        <p style="margin-top:10px;"><em>Tip:</em> If you plan to refinance or sell to settle the balloon, test a higher interest rate or a lower resale value to stress-check the risk.</p>
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
      const message = "Balloon Payment Loan Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
