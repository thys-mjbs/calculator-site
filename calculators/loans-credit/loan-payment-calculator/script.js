document.addEventListener("DOMContentLoaded", function () {
  const loanAmountInput = document.getElementById("loanAmount");
  const interestRateInput = document.getElementById("interestRate");
  const termYearsInput = document.getElementById("termYears");
  const paymentsPerYearSelect = document.getElementById("paymentsPerYear");
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) {
      return;
    }
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(interestRateInput);
  attachLiveFormatting(termYearsInput);

  function clearResultClasses() {
    resultDiv.classList.remove("error");
    resultDiv.classList.remove("success");
  }

  function showError(message) {
    clearResultClasses();
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function getFrequencyLabel(paymentsPerYear) {
    if (paymentsPerYear === 12) {
      return "month";
    }
    if (paymentsPerYear === 26) {
      return "fortnight";
    }
    if (paymentsPerYear === 52) {
      return "week";
    }
    return "period";
  }

  function calculateLoanPayment() {
    if (!loanAmountInput || !interestRateInput || !termYearsInput || !paymentsPerYearSelect || !resultDiv) {
      return;
    }

    const principal = toNumber(loanAmountInput.value);
    const annualRatePercent = toNumber(interestRateInput.value);
    const termYears = toNumber(termYearsInput.value);
    const paymentsPerYear = parseInt(paymentsPerYearSelect.value, 10);

    if (!principal || principal <= 0) {
      showError("Enter a valid loan amount greater than zero.");
      return;
    }

    if (annualRatePercent < 0) {
      showError("Interest rate cannot be negative.");
      return;
    }

    if (!termYears || termYears <= 0) {
      showError("Enter a valid loan term in years greater than zero.");
      return;
    }

    if (!paymentsPerYear || paymentsPerYear <= 0) {
      showError("Select a valid payment frequency.");
      return;
    }

    const totalPayments = termYears * paymentsPerYear;
    if (!totalPayments || totalPayments <= 0) {
      showError("The number of payments must be greater than zero.");
      return;
    }

    const annualRate = annualRatePercent / 100;
    const periodicRate = annualRate / paymentsPerYear;

    let paymentPerPeriod;
    if (periodicRate === 0) {
      paymentPerPeriod = principal / totalPayments;
    } else {
      const factor = Math.pow(1 + periodicRate, -totalPayments);
      paymentPerPeriod = principal * (periodicRate / (1 - factor));
    }

    const totalPaid = paymentPerPeriod * totalPayments;
    const totalInterest = totalPaid - principal;
    const frequencyLabel = getFrequencyLabel(paymentsPerYear);

    clearResultClasses();
    resultDiv.classList.add("success");

    const paymentText = formatNumberTwoDecimals(paymentPerPeriod);
    const totalPaidText = formatNumberTwoDecimals(totalPaid);
    const totalInterestText = formatNumberTwoDecimals(totalInterest);

    resultDiv.innerHTML =
      '<div class="result-row">' +
      '<span class="result-label">Payment per ' + frequencyLabel + ':</span>' +
      '<span>' + paymentText + '</span>' +
      "</div>" +
      '<div class="result-row">' +
      '<span class="result-label">Total number of payments:</span>' +
      '<span>' + totalPayments + "</span>" +
      "</div>" +
      '<div class="result-row">' +
      '<span class="result-label">Total repaid over the term:</span>' +
      '<span>' + totalPaidText + "</span>" +
      "</div>" +
      '<div class="result-row">' +
      '<span class="result-label">Total interest paid:</span>' +
      '<span>' + totalInterestText + "</span>" +
      "</div>";
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", calculateLoanPayment);
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Loan Payment Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
