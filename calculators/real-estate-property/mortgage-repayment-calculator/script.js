document.addEventListener("DOMContentLoaded", function () {
  const loanAmountInput = document.getElementById("loanAmount");
  const annualRateInput = document.getElementById("annualInterestRate");
  const termYearsInput = document.getElementById("loanTermYears");
  const extraPaymentInput = document.getElementById("extraMonthlyPayment");
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const calculatorName = "Mortgage Repayment Calculator";

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(annualRateInput);
  attachLiveFormatting(termYearsInput);
  attachLiveFormatting(extraPaymentInput);

  function clearResult() {
    resultDiv.className = "";
    resultDiv.textContent = "";
  }

  function setError(message) {
    resultDiv.className = "error";
    resultDiv.textContent = message;
  }

  function setSuccess(html) {
    resultDiv.className = "success";
    resultDiv.innerHTML = html;
  }

  function calculateMortgage() {
    clearResult();

    const loanAmount = toNumber(loanAmountInput.value);
    const annualRate = toNumber(annualRateInput.value);
    const termYears = toNumber(termYearsInput.value);
    const extraPayment = toNumber(extraPaymentInput.value);

    if (!loanAmount || loanAmount <= 0) {
      setError("Enter a valid loan amount greater than zero.");
      return;
    }

    if (annualRate < 0) {
      setError("Enter a valid annual interest rate (0 or higher).");
      return;
    }

    if (!termYears || termYears <= 0) {
      setError("Enter a valid loan term in years greater than zero.");
      return;
    }

    const months = Math.round(termYears * 12);
    const monthlyRate = annualRate / 100 / 12;

    let monthlyRepayment;
    if (monthlyRate === 0) {
      monthlyRepayment = loanAmount / months;
    } else {
      const factor = Math.pow(1 + monthlyRate, months);
      monthlyRepayment = loanAmount * monthlyRate * factor / (factor - 1);
    }

    const formattedMonthly = formatNumberTwoDecimals(monthlyRepayment);
    const totalPaid = monthlyRepayment * months;
    const totalInterest = totalPaid - loanAmount;

    const formattedTotalPaid = formatNumberTwoDecimals(totalPaid);
    const formattedInterest = formatNumberTwoDecimals(totalInterest);

    let extraSection = "";

    if (extraPayment > 0) {
      const accelerated = simulateWithExtraPayment(
        loanAmount,
        monthlyRate,
        monthlyRepayment,
        extraPayment,
        months
      );

      if (accelerated && accelerated.monthsUsed > 0) {
        const monthsSaved = months - accelerated.monthsUsed;
        const interestSaved = totalInterest - accelerated.totalInterest;
        const formattedExtraPayment = formatNumberTwoDecimals(
          monthlyRepayment + extraPayment
        );
        const formattedInterestSaved = formatNumberTwoDecimals(interestSaved);

        let yearsSaved = 0;
        let remainingMonthsSaved = monthsSaved;
        if (monthsSaved > 0) {
          yearsSaved = Math.floor(monthsSaved / 12);
          remainingMonthsSaved = monthsSaved % 12;
        }

        const timeSavedParts = [];
        if (yearsSaved > 0) {
          timeSavedParts.push(yearsSaved + " year" + (yearsSaved > 1 ? "s" : ""));
        }
        if (remainingMonthsSaved > 0) {
          timeSavedParts.push(
            remainingMonthsSaved + " month" + (remainingMonthsSaved > 1 ? "s" : "")
          );
        }
        const timeSavedText =
          timeSavedParts.length > 0 ? timeSavedParts.join(" and ") : "less than one month";

        extraSection =
          "<h4>With your extra monthly payment</h4>" +
          "<ul>" +
          "<li>New estimated monthly payment: " +
          formattedExtraPayment +
          "</li>" +
          "<li>Estimated payoff time: about " +
          accelerated.monthsUsed +
          " months</li>" +
          "<li>Time saved: about " +
          timeSavedText +
          "</li>" +
          "<li>Estimated interest saved: " +
          formattedInterestSaved +
          "</li>" +
          "</ul>";
      }
    }

    const baseHtml =
      "<ul>" +
      "<li>Estimated monthly repayment: " +
      formattedMonthly +
      "</li>" +
      "<li>Total paid over full term: " +
      formattedTotalPaid +
      "</li>" +
      "<li>Total interest over full term: " +
      formattedInterest +
      "</li>" +
      "</ul>";

    setSuccess(baseHtml + extraSection);
  }

  function simulateWithExtraPayment(
    loanAmount,
    monthlyRate,
    normalPayment,
    extraPayment,
    originalMonths
  ) {
    if (monthlyRate === 0) {
      const extraTotalPayment = normalPayment + extraPayment;
      if (extraTotalPayment <= 0) {
        return null;
      }
      const monthsNeeded = Math.ceil(loanAmount / extraTotalPayment);
      const totalPaid = monthsNeeded * extraTotalPayment;
      const totalInterest = totalPaid - loanAmount;
      return {
        monthsUsed: monthsNeeded,
        totalInterest: totalInterest
      };
    }

    let balance = loanAmount;
    const payment = normalPayment + extraPayment;
    if (payment <= 0) {
      return null;
    }

    let monthsUsed = 0;
    let totalInterest = 0;

    const maxIterations = originalMonths * 2;

    while (balance > 0 && monthsUsed < maxIterations) {
      const interestForMonth = balance * monthlyRate;
      let principalPayment = payment - interestForMonth;

      if (principalPayment <= 0) {
        break;
      }

      if (principalPayment > balance) {
        principalPayment = balance;
      }

      balance -= principalPayment;
      totalInterest += interestForMonth;
      monthsUsed++;
    }

    if (balance > 0) {
      return null;
    }

    return {
      monthsUsed: monthsUsed,
      totalInterest: totalInterest
    };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", calculateMortgage);
  }

  const shareButton = document.getElementById("shareWhatsAppButton");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = calculatorName + ": check this calculator " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
