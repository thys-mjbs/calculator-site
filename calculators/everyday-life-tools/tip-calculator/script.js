document.addEventListener("DOMContentLoaded", function () {
  const billAmountInput = document.getElementById("billAmount");
  const tipPercentageInput = document.getElementById("tipPercentage");
  const peopleCountInput = document.getElementById("peopleCount");
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

  attachLiveFormatting(billAmountInput);
  attachLiveFormatting(tipPercentageInput);
  attachLiveFormatting(peopleCountInput);

  function setError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setSuccess(contentHtml) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = contentHtml;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const billAmount = toNumber(billAmountInput.value);
      const tipPercentage = toNumber(tipPercentageInput.value);
      const rawPeople = toNumber(peopleCountInput.value);

      if (isNaN(billAmount) || billAmount <= 0) {
        setError("Please enter a valid bill amount greater than zero.");
        return;
      }

      if (isNaN(tipPercentage) || tipPercentage < 0) {
        setError("Please enter a valid tip percentage (zero or higher).");
        return;
      }

      if (isNaN(rawPeople) || rawPeople <= 0) {
        setError("Please enter the number of people as a value greater than zero.");
        return;
      }

      const peopleCount = Math.floor(rawPeople);

      if (peopleCount < 1) {
        setError("The number of people must be at least 1.");
        return;
      }

      const tipAmount = billAmount * (tipPercentage / 100);
      const totalWithTip = billAmount + tipAmount;
      const tipPerPerson = tipAmount / peopleCount;
      const totalPerPerson = totalWithTip / peopleCount;

      const tipAmountFormatted = formatNumberTwoDecimals(tipAmount);
      const totalWithTipFormatted = formatNumberTwoDecimals(totalWithTip);
      const tipPerPersonFormatted = formatNumberTwoDecimals(tipPerPerson);
      const totalPerPersonFormatted = formatNumberTwoDecimals(totalPerPerson);

      const contentHtml =
        '<div class="result-row">' +
        '<span class="result-label">Tip amount:</span>' +
        '<span class="result-value">' +
        tipAmountFormatted +
        "</span>" +
        "</div>" +
        '<div class="result-row">' +
        '<span class="result-label">Total with tip:</span>' +
        '<span class="result-value">' +
        totalWithTipFormatted +
        "</span>" +
        "</div>" +
        '<div class="result-row">' +
        '<span class="result-label">Tip per person:</span>' +
        '<span class="result-value">' +
        tipPerPersonFormatted +
        "</span>" +
        "</div>" +
        '<div class="result-row">' +
        '<span class="result-label">Total per person:</span>' +
        '<span class="result-value">' +
        totalPerPersonFormatted +
        "</span>" +
        "</div>";

      setSuccess(contentHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Tip Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
