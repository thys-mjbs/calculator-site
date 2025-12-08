/* Tip Calculator — Logic */

document.addEventListener("DOMContentLoaded", function () {
  const billInput = document.getElementById("billAmount");
  const tipInput = document.getElementById("tipPercentage");
  const button = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  button.addEventListener("click", function () {
    const bill = toNumber(billInput.value);
    const tipPercent = toNumber(tipInput.value);

    if (bill <= 0 || tipPercent < 0) {
      resultDiv.textContent = "Enter valid numbers.";
      return;
    }

    const tipAmount = bill * (tipPercent / 100);
    const total = bill + tipAmount;

    resultDiv.textContent =
      "Tip: R" + tipAmount.toFixed(2) + " | Total: R" + total.toFixed(2);
  });
});
