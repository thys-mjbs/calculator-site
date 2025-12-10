document.addEventListener("DOMContentLoaded", function () {
  const incomeInput = document.getElementById("income");
  const otherIncomeInput = document.getElementById("otherIncome");
  const housingInput = document.getElementById("housing");
  const utilitiesInput = document.getElementById("utilities");
  const groceriesInput = document.getElementById("groceries");
  const transportInput = document.getElementById("transport");
  const insuranceInput = document.getElementById("insurance");
  const debtInput = document.getElementById("debt");
  const savingsInput = document.getElementById("savingsInvestments");
  const entertainmentInput = document.getElementById("entertainment");
  const otherExpensesInput = document.getElementById("otherExpenses");

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

  attachLiveFormatting(incomeInput);
  attachLiveFormatting(otherIncomeInput);
  attachLiveFormatting(housingInput);
  attachLiveFormatting(utilitiesInput);
  attachLiveFormatting(groceriesInput);
  attachLiveFormatting(transportInput);
  attachLiveFormatting(insuranceInput);
  attachLiveFormatting(debtInput);
  attachLiveFormatting(savingsInput);
  attachLiveFormatting(entertainmentInput);
  attachLiveFormatting(otherExpensesInput);

  function calculateBudget() {
    const income = toNumber(incomeInput.value);
    const otherIncome = toNumber(otherIncomeInput.value);
    const housing = toNumber(housingInput.value);
    const utilities = toNumber(utilitiesInput.value);
    const groceries = toNumber(groceriesInput.value);
    const transport = toNumber(transportInput.value);
    const insurance = toNumber(insuranceInput.value);
    const debt = toNumber(debtInput.value);
    const savings = toNumber(savingsInput.value);
    const entertainment = toNumber(entertainmentInput.value);
    const otherExpenses = toNumber(otherExpensesInput.value);

    const totalIncome = income + otherIncome;

    if (!totalIncome) {
      resultDiv.innerHTML =
        "<p class=\"result-row\">Please enter at least your main monthly income so the calculator can work.</p>";
      return;
    }

    const essentials = housing + utilities + groceries + transport + insurance + debt;
    const totalExpenses =
      essentials + savings + entertainment + otherExpenses;
    const balance = totalIncome - totalExpenses;

    const essentialsShare = totalIncome > 0 ? (essentials / totalIncome) * 100 : 0;
    const savingsShare = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const expenseShare =
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    const balanceLabel = balance >= 0 ? "surplus" : "shortfall";
    const statusClass = balance >= 0 ? "result-status-good" : "result-status-bad";

    const incomeFormatted = formatNumberTwoDecimals(totalIncome);
    const expensesFormatted = formatNumberTwoDecimals(totalExpenses);
    const balanceFormatted = formatNumberTwoDecimals(Math.abs(balance));

    const essentialsShareFormatted = essentialsShare.toFixed(1);
    const savingsShareFormatted = savingsShare.toFixed(1);
    const expenseShareFormatted = expenseShare.toFixed(1);

    let statusText;
    if (balance > 0) {
      statusText =
        "Your budget shows a monthly surplus. You can increase savings, reduce debt, or allow more room for flexible spending.";
    } else if (balance < 0) {
      statusText =
        "Your budget is in deficit. Consider trimming variable spending or adjusting debt and savings contributions where possible.";
    } else {
      statusText =
        "Your income and expenses are equal. There is no buffer for unplanned costs or extra savings.";
    }

    resultDiv.innerHTML =
      "<div class=\"result-heading\">Budget summary</div>" +
      "<p class=\"result-row\"><strong>Total monthly income:</strong> " +
      incomeFormatted +
      "</p>" +
      "<p class=\"result-row\"><strong>Total monthly expenses:</strong> " +
      expensesFormatted +
      " (" +
      expenseShareFormatted +
      "% of income)</p>" +
      "<p class=\"result-row\"><strong>Monthly " +
      balanceLabel +
      ":</strong> " +
      balanceFormatted +
      "</p>" +
      "<p class=\"result-row\"><strong>Essentials share:</strong> " +
      essentialsShareFormatted +
      "% of income</p>" +
      "<p class=\"result-row\"><strong>Savings and investments share:</strong> " +
      savingsShareFormatted +
      "% of income</p>" +
      "<p class=\"" +
      statusClass +
      "\">" +
      statusText +
      "</p>";
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", calculateBudget);
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Monthly Budget Calculator – check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
