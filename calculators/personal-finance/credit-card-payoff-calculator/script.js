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
      const balance = toNumber(balanceInput ? balanceInput.value : "");
      const apr = toNumber(aprInput ? aprInput.value : "");
      const monthlyPayment = toNumber(monthlyPaymentInput ? monthlyPaymentInput.value : "");
      const extraMonthly = toNumber(extraMonthlyInput ? extraMonthlyInput.value : "");
      const lumpSum = toNumber(lumpSumInput ? lumpSumInput.value : "");

      // Basic existence guard
      if (!balanceInput || !aprInput || !monthlyPaymentInput) return;

      // Validation
      if (!validatePositive(balance, "current balance")) return;
      if (!validateNonNegative(apr, "APR")) return;
      if (!validatePositive(monthlyPayment, "monthly payment")) return;
      if (!validateNonNegative(extraMonthly, "extra monthly payment")) return;
      if (!validateNonNegative(lumpSum, "lump sum payment")) return;

      const monthlyRate = apr > 0 ? apr / 100 / 12 : 0;

      // Apply lump sum immediately
      let currentBalance = balance - lumpSum;
      if (currentBalance < 0) currentBalance = 0;

      const totalMonthlyPayment = monthlyPayment + extraMonthly;

      // If balance is already cleared
      if (currentBalance === 0) {
        const today = new Date();
        const payoffDateStr = today.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric"
        });

        const resultHtml =
          `<p><strong>Payoff time:</strong> Paid off now (0 months)</p>` +
          `<p><strong>Total interest:</strong> ${formatNumberTwoDecimals(0)}</p>` +
          `<p><strong>Total paid:</strong> ${formatNumberTwoDecimals(Math.min(balance, lumpSum))}</p>` +
          `<p><strong>Estimated payoff date:</strong> ${payoffDateStr}</p>` +
          `<p><em>Note:</em> Your lump sum covers the remaining balance.</p>`;
        setResultSuccess(resultHtml);
        return;
      }

      // Guard against non-payoff when interest exceeds payment
      if (monthlyRate > 0) {
        const firstMonthInterest = currentBalance * monthlyRate;
        if (totalMonthlyPayment <= firstMonthInterest + 0.000001) {
          setResultError(
            "Your monthly payment is too low to reduce the balance. Increase the monthly payment, add an extra amount, or make a larger lump sum payment."
          );
          return;
        }
      }

      // Simulation (cap to prevent infinite loops)
      const maxMonths = 600; // 50 years safety cap
      let months = 0;
      let totalInterest = 0;
      let totalPaid = Math.min(balance, lumpSum); // lump sum actually applied (capped by balance)

      while (currentBalance > 0 && months < maxMonths) {
        const interest = monthlyRate > 0 ? currentBalance * monthlyRate : 0;
        totalInterest += interest;

        let paymentThisMonth = totalMonthlyPayment;
        const payoffAmount = currentBalance + interest;

        if (paymentThisMonth > payoffAmount) paymentThisMonth = payoffAmount;

        currentBalance = payoffAmount - paymentThisMonth;
        totalPaid += paymentThisMonth;

        months += 1;

        // numerical cleanup
        if (currentBalance < 0.005) currentBalance = 0;
      }

      if (months >= maxMonths && currentBalance > 0) {
        setResultError(
          "This payoff timeline is longer than 50 years with the values provided. Increase your monthly payment or add a larger lump sum to get a realistic payoff estimate."
        );
        return;
      }

      const yearsPart = Math.floor(months / 12);
      const monthsPart = months % 12;

      const timeParts = [];
      if (yearsPart > 0) timeParts.push(yearsPart + (yearsPart === 1 ? " year" : " years"));
      if (monthsPart > 0) timeParts.push(monthsPart + (monthsPart === 1 ? " month" : " months"));
      if (timeParts.length === 0) timeParts.push("0 months");

      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + months);
      const payoffDateStr = payoffDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const resultHtml =
        `<p><strong>Payoff time:</strong> ${months} months (${timeParts.join(" ")})</p>` +
        `<p><strong>Total interest:</strong> ${formatNumberTwoDecimals(totalInterest)}</p>` +
        `<p><strong>Total paid:</strong> ${formatNumberTwoDecimals(totalPaid)}</p>` +
        `<p><strong>Estimated payoff date:</strong> ${payoffDateStr}</p>` +
        `<p><em>Secondary insight:</em> Every extra amount you pay monthly reduces both the payoff time and the total interest, because it lowers the balance faster.</p>`;

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
