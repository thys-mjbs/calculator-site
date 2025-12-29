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
  const extraPaymentInput = document.getElementById("extraPayment");
  const minPercentInput = document.getElementById("minPercent");
  const minDollarInput = document.getElementById("minDollar");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(balanceInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(extraPaymentInput);
  attachLiveFormatting(minPercentInput);
  attachLiveFormatting(minDollarInput);

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

  function formatMonthsToYearsMonths(months) {
    const m = Math.max(0, Math.round(months));
    const years = Math.floor(m / 12);
    const rem = m % 12;
    if (years <= 0) return rem + " months";
    if (rem === 0) return years + (years === 1 ? " year" : " years");
    return (
      years +
      (years === 1 ? " year" : " years") +
      " " +
      rem +
      (rem === 1 ? " month" : " months")
    );
  }

  function simulatePayoff(balance, apr, minPercent, minDollar, extraPayment) {
    const monthlyRate = apr / 100 / 12;
    let b = balance;

    let months = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    const maxMonths = 1200; // hard stop to prevent runaway loops

    for (let i = 0; i < maxMonths; i++) {
      if (b <= 0.000001) break;

      const interest = b * monthlyRate;
      const baseMin = Math.max((minPercent / 100) * b, minDollar);
      const paymentRequested = baseMin + extraPayment;

      // If payment does not cover interest, balance will not decline reliably.
      if (paymentRequested <= interest + 0.000001) {
        return {
          ok: false,
          message:
            "Your payment is not enough to cover the monthly interest. Increase the extra payment or use a higher minimum payment rule.",
        };
      }

      const payment = Math.min(paymentRequested, b + interest);

      totalInterest += interest;
      totalPaid += payment;

      b = b + interest - payment;
      months += 1;
    }

    if (b > 0.01) {
      return {
        ok: false,
        message:
          "This payoff scenario did not reach zero within the model limit. Increase payment levels or check your inputs.",
      };
    }

    return {
      ok: true,
      months: months,
      totalInterest: totalInterest,
      totalPaid: totalPaid,
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const balance = toNumber(balanceInput ? balanceInput.value : "");
      const apr = toNumber(aprInput ? aprInput.value : "");
      const extraPaymentRaw = toNumber(extraPaymentInput ? extraPaymentInput.value : "");
      const minPercentRaw = toNumber(minPercentInput ? minPercentInput.value : "");
      const minDollarRaw = toNumber(minDollarInput ? minDollarInput.value : "");

      if (!balanceInput || !aprInput || !extraPaymentInput || !minPercentInput || !minDollarInput) return;

      if (!validatePositive(balance, "balance")) return;
      if (!validatePositive(apr, "APR")) return;

      const extraPayment = Number.isFinite(extraPaymentRaw) ? Math.max(0, extraPaymentRaw) : 0;

      // Defaults if user clears these fields
      const minPercent = Number.isFinite(minPercentRaw) && minPercentRaw > 0 ? minPercentRaw : 2;
      const minDollar = Number.isFinite(minDollarRaw) && minDollarRaw >= 0 ? minDollarRaw : 25;

      if (!validatePositive(minPercent, "minimum payment percent")) return;
      if (!validateNonNegative(minDollar, "minimum payment floor")) return;

      const minOnly = simulatePayoff(balance, apr, minPercent, minDollar, 0);
      if (!minOnly.ok) {
        setResultError(minOnly.message);
        return;
      }

      let withExtra = null;
      let exampleExtra = null;

      if (extraPayment > 0) {
        withExtra = simulatePayoff(balance, apr, minPercent, minDollar, extraPayment);
        if (!withExtra.ok) {
          setResultError(withExtra.message);
          return;
        }
      } else {
        // Provide a concrete secondary insight without forcing extra input
        exampleExtra = 50;
        const example = simulatePayoff(balance, apr, minPercent, minDollar, exampleExtra);
        if (example.ok) withExtra = example;
      }

      const minMonthsText = formatMonthsToYearsMonths(minOnly.months);
      const minInterest = formatNumberTwoDecimals(minOnly.totalInterest);
      const minPaid = formatNumberTwoDecimals(minOnly.totalPaid);

      let resultHtml = `
        <p><strong>Minimum payments only:</strong></p>
        <p>Payoff time: <strong>${minMonthsText}</strong></p>
        <p>Total interest paid: <strong>${minInterest}</strong></p>
        <p>Total paid overall: <strong>${minPaid}</strong></p>
      `;

      if (withExtra) {
        const extraLabel =
          extraPayment > 0
            ? "Minimum + extra payment"
            : "Minimum + example extra payment";

        const extraValue =
          extraPayment > 0 ? extraPayment : exampleExtra;

        const extraMonthsText = formatMonthsToYearsMonths(withExtra.months);
        const extraInterest = formatNumberTwoDecimals(withExtra.totalInterest);
        const extraPaid = formatNumberTwoDecimals(withExtra.totalPaid);

        const monthsSaved = Math.max(0, minOnly.months - withExtra.months);
        const interestSaved = Math.max(0, minOnly.totalInterest - withExtra.totalInterest);

        resultHtml += `
          <hr>
          <p><strong>${extraLabel}:</strong></p>
          <p>Extra per month: <strong>${formatNumberTwoDecimals(extraValue)}</strong></p>
          <p>Payoff time: <strong>${extraMonthsText}</strong></p>
          <p>Total interest paid: <strong>${extraInterest}</strong></p>
          <p>Total paid overall: <strong>${extraPaid}</strong></p>
          <p><strong>Savings vs minimum only:</strong> ${formatMonthsToYearsMonths(monthsSaved)} faster, ${formatNumberTwoDecimals(interestSaved)} less interest.</p>
        `;
      }

      resultHtml += `
        <hr>
        <p><strong>What this means:</strong> Minimum payments often shrink as your balance shrinks, which drags out the payoff and increases total interest. A fixed extra amount stops that shrink and accelerates payoff.</p>
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
      const message = "Minimum Payment Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
