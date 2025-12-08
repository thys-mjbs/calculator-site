/* Split Bill Calculator — Logic with formatting */

document.addEventListener("DOMContentLoaded", function () {
  const billInput = document.getElementById("billAmount");
  const tipInput = document.getElementById("tipPercentage");
  const peopleInput = document.getElementById("numberOfPeople");
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
  attachLiveFormatting(peopleInput);

  button.addEventListener("click", function () {
    const bill = toNumber(billInput.value);
    const tipPercent = toNumber(tipInput.value || "0");
    const people = toNumber(peopleInput.value);

    if (bill <= 0 || people <= 0 || tipPercent < 0) {
      resultDiv.textContent = "Enter valid numbers for bill, people, and tip.";
      return;
    }

    const tipAmount = bill * (tipPercent / 100);
    const totalWithTip = bill + tipAmount;
    const perPerson = totalWithTip / people;

    const billText = formatNumberTwoDecimals(bill);
    const tipText = formatNumberTwoDecimals(tipAmount);
    const totalText = formatNumberTwoDecimals(totalWithTip);
    const perPersonText = formatNumberTwoDecimals(perPerson);

    resultDiv.innerHTML =
      "<p>Total bill (before tip): " + billText + "</p>" +
      "<p>Tip amount: " + tipText + "</p>" +
      "<p>Total with tip: " + totalText + "</p>" +
      "<p>Amount per person: " + perPersonText + "</p>";
  });
});
