document.addEventListener("DOMContentLoaded", function () {
  const initialAmountInput = document.getElementById("initialAmountInput");
  const monthlyContributionInput = document.getElementById("monthlyContributionInput");
  const annualRateInput = document.getElementById("annualRateInput");
  const yearsInput = document.getElementById("yearsInput");
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  // Attach formatting where it makes sense (money and percentage fields)
  attachLiveFormatting(initialAmountInput);
  attachLiveFormatting(monthlyContributionInput);
  attachLiveFormatting(annualRateInput);

  function showError(message) {
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function showResult(contentHtml) {
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = contentHtml;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const initialAmount = toNumber(initialAmountInput.value);
      const monthlyContribution = toNumber(monthlyContributionInput.value);
      const annualRate = toNumber(annualRateInput.value);
      const years = toNumber(yearsInput.value);

      if (isNaN(initialAmount) || initialAmount < 0) {
        showError("Please enter a valid starting amount (zero or more).");
        return;
      }

      if (isNaN(monthlyContribution) || monthlyContribution < 0) {
        showError("Please enter a valid monthly contribution (zero or more).");
        return;
      }

      if (isNaN(annualRate) || annualRate < 0) {
        showError("Please enter a valid annual interest rate (zero or more).");
        return;
      }

      if (isNaN(years) || years <= 0) {
        showError("Please enter a valid number of years greater than zero.");
        return;
      }

      const months = years * 12;
      const monthlyRate = annualRate / 100 / 12;

      let futureValueStart = 0;
      let futureValueContrib = 0;

      if (monthlyRate === 0) {
        futureValueStart = initialAmount;
        futureValueContrib = monthlyContribution * months;
      } else {
        futureValueStart = initialAmount * Math.pow(1 + monthlyRate, months);
        futureValueContrib =
          monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      }

      const finalBalance = futureValueStart + futureValueContrib;
      const totalContributions = initialAmount + monthlyContribution * months;
      const totalInterest = finalBalance - totalContributions;

      const finalBalanceStr = formatNumberTwoDecimals(finalBalance);
      const contributionsStr = formatNumberTwoDecimals(totalContributions);
      const interestStr = formatNumberTwoDecimals(totalInterest);

      const resultHtml = `
        <ul>
          <li><strong>Future balance after ${years} year(s):</strong> ${finalBalanceStr}</li>
          <li><strong>Total money you contributed:</strong> ${contributionsStr}</li>
          <li><strong>Total interest earned:</strong> ${interestStr}</li>
        </ul>
      `;

      showResult(resultHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Compound Interest Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
