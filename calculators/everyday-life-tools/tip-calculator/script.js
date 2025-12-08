/* Tip Calculator — Logic with formatting */

document.addEventListener("DOMContentLoaded", function () {
  const billInput = document.getElementById("billAmount");
  const tipInput = document.getElementById("tipPercentage");
  const button = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  /* Attach live formatting with commas to an input */
  function attachLiveFormatting(inputEl) {
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  attachLiveFormatting(billInput);
  attachLiveFormatting(tipInput);

  button.addEventListener("click", function () {
    const bill = toNumber(billInput.value);
    const tipPercent = toNumber(tipInput.value);

    if (bill <= 0 || tipPercent < 0) {
      resultDiv.textContent = "Enter valid numbers.";
      return;
    }

    const tipAmount = bill * (tipPercent / 100);
    const total = bill + tipAmount;

    const tipText = formatNumberTwoDecimals(tipAmount);
    const totalText = formatNumberTwoDecimals(total);

    resultDiv.textContent =
      "Tip: " + tipText + " | Total: " + totalText;
  });
});
