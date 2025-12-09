/* Monthly Budget Calculator — Logic with formatting and WhatsApp share */

document.addEventListener("DOMContentLoaded", function () {
  const incomeInput = document.getElementById("monthlyIncome");
  const housingInput = document.getElementById("housing");
  const utilitiesInput = document.getElementById("utilities");
  const groceriesInput = document.getElementById("groceries");
  const transportInput = document.getElementById("transport");
  const debtInput = document.getElementById("debt");
  const otherSpendingInput = document.getElementById("otherSpending");
  const savingsGoalInput = document.getElementById("savingsGoal");

  const button = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  /* Attach live formatting with commas to an input */
  function attachLiveFormatting(inputEl) {
    if (!inputEl) {
      return;
    }
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  attachLiveFormatting(incomeInput);
  attachLiveFormatting(housingInput);
  attachLiveFormatting(utilitiesInput);
  attachLiveFormatting(groceriesInput);
  attachLiveFormatting(transportInput);
  attachLiveFormatting(debtInput);
  attachLiveFormatting(otherSpendingInput);
  attachLiveFormatting(savingsGoalInput);

  if (button) {
    button.addEventListener("click", function () {
      const income = toNumber(incomeInput.value);
      const housing = toNumber(housingInput.value);
      const utilities = toNumber(utilitiesInput.value);
      const groceries = toNumber(groceriesInput.value);
      const transport = toNumber(transportInput.value);
      const debt = toNumber(debtInput.value);
      const otherSpending = toNumber(otherSpendingInput.value);
      const savingsGoal = toNumber(savingsGoalInput.value);

      if (!income || income <= 0) {
        resultDiv.textContent = "Enter a valid monthly income amount.";
        return;
      }

      const totalExpenses =
        housing + utilities + groceries + transport + debt + otherSpending;

      const expensePercent = income > 0 ? (totalExpenses / income) * 100 : 0;
      const leftover = income - totalExpenses;

      const expensesText = formatNumberTwoDecimals(totalExpenses);
      const incomeText = formatNumberTwoDecimals(income);
      const leftoverText = formatNumberTwoDecimals(Math.abs(leftover));
      const percentText = formatNumberTwoDecimals(expensePercent);

      let html = "";

      html +=
        "<p><strong>Total expenses:</strong> " +
        expensesText +
        " (" +
        percentText +
        "% of your income)</p>";

      if (leftover > 0) {
        html +=
          "<p><strong>Money left after expenses:</strong> " +
          formatNumberTwoDecimals(leftover) +
          "</p>";
      } else if (leftover === 0) {
        html +=
          "<p><strong>Balance:</strong> Your expenses use 100% of your income. There is no money left over.</p>";
      } else {
        html +=
          "<p><strong>Overspending:</strong> You are spending " +
          leftoverText +
          " more than your income each month.</p>";
      }

      if (savingsGoal > 0) {
        const savingsText = formatNumberTwoDecimals(savingsGoal);

        if (leftover <= 0) {
          const shortfallForSavings = savingsGoal + Math.abs(leftover);
          html +=
            "<p><strong>Savings goal:</strong> You cannot reach your savings goal of " +
            savingsText +
            ". You would need to free up " +
            formatNumberTwoDecimals(shortfallForSavings) +
            " by cutting expenses or raising income.</p>";
        } else {
          if (leftover >= savingsGoal) {
            const leftoverAfterSaving = leftover - savingsGoal;
            html +=
              "<p><strong>Savings goal:</strong> You can save " +
              savingsText +
              " and still have " +
              formatNumberTwoDecimals(leftoverAfterSaving) +
              " left over after saving.</p>";
          } else {
            const gap = savingsGoal - leftover;
            html +=
              "<p><strong>Savings goal:</strong> Your leftover money is not enough to reach your savings goal of " +
              savingsText +
              ". You are short by " +
              formatNumberTwoDecimals(gap) +
              ".</p>";
          }
        }
      }

      html +=
        "<p><strong>Reminder:</strong> This tool is a simple snapshot. It does not connect to your bank account and only works with the numbers you enter.</p>";

      resultDiv.innerHTML = html;
    });
  }

  /* WhatsApp share button */
  const shareButton = document.getElementById("shareWhatsAppButton");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Monthly Budget Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
