document.addEventListener("DOMContentLoaded", function () {
  const billAmountInput = document.getElementById("billAmount");
  const tipPercentageInput = document.getElementById("tipPercentage");
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(billAmountInput);
  attachLiveFormatting(tipPercentageInput);

  function setError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function calculate() {
    const billAmount = toNumber(billAmountInput ? billAmountInput.value : "");
    const tipPercentage = toNumber(tipPercentageInput ? tipPercentageInput.value : "");

    if (isNaN(billAmount) || billAmount <= 0) {
      setError("Please enter a valid bill amount greater than zero.");
      return;
    }

    if (isNaN(tipPercentage) || tipPercentage < 0) {
      setError("Please enter a valid tip percentage (zero or higher).");
      return;
    }

    const tipAmount = billAmount * (tipPercentage / 100);
    const totalWithTip = billAmount + tipAmount;

    const tipAmountFormatted = formatNumberTwoDecimals(tipAmount);
    const totalWithTipFormatted = formatNumberTwoDecimals(totalWithTip);

    const html =
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
      "</div>";

    setSuccess(html);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", calculate);
  }

  if (tipPercentageInput) {
    tipPercentageInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") calculate();
    });
  }

  if (billAmountInput) {
    billAmountInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") calculate();
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
