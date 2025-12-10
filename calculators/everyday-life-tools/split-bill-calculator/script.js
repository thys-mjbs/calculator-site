document.addEventListener("DOMContentLoaded", function () {
  const billAmountInput = document.getElementById("billAmount");
  const tipPercentageInput = document.getElementById("tipPercentage");
  const numberOfPeopleInput = document.getElementById("numberOfPeople");
  const roundUpCheckbox = document.getElementById("roundUpPerPerson");
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

  // Attach formatting to money and percentage fields
  attachLiveFormatting(billAmountInput);
  attachLiveFormatting(tipPercentageInput);

  function setError(message) {
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setSuccess(html) {
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function handleCalculate() {
    const billAmount = toNumber(billAmountInput.value);
    const tipPercentageRaw = tipPercentageInput.value.trim();
    const tipPercentage = tipPercentageRaw === "" ? 0 : toNumber(tipPercentageRaw);
    const numberOfPeople = toNumber(numberOfPeopleInput.value);

    if (isNaN(billAmount) || billAmount <= 0) {
      setError("Please enter a valid total bill amount greater than zero.");
      return;
    }

    if (isNaN(numberOfPeople) || numberOfPeople < 1 || !Number.isInteger(numberOfPeople)) {
      setError("Please enter a valid whole number of people (at least 1).");
      return;
    }

    if (isNaN(tipPercentage) || tipPercentage < 0) {
      setError("Please enter a valid tip percentage, or leave it blank.");
      return;
    }

    const tipAmount = billAmount * (tipPercentage / 100);
    const totalWithTip = billAmount + tipAmount;

    let perPerson = totalWithTip / numberOfPeople;
    let perPersonRounded = perPerson;
    let roundingUsed = false;

    if (roundUpCheckbox && roundUpCheckbox.checked) {
      perPersonRounded = Math.ceil(perPerson);
      roundingUsed = true;
    }

    const billAmountFormatted = formatNumberTwoDecimals(billAmount);
    const tipAmountFormatted = formatNumberTwoDecimals(tipAmount);
    const totalWithTipFormatted = formatNumberTwoDecimals(totalWithTip);
    const perPersonFormatted = formatNumberTwoDecimals(perPersonRounded);

    let extraNote = "";
    if (roundingUsed) {
      const newTotal = perPersonRounded * numberOfPeople;
      const newTotalFormatted = formatNumberTwoDecimals(newTotal);
      extraNote =
        '<div class="result-line">Rounded total for the group: <span class="result-highlight">' +
        newTotalFormatted +
        "</span></div>" +
        '<div class="result-line">This rounded total may be slightly higher than the original bill plus tip.</div>';
    }

    const html =
      '<div class="result-line">Bill amount: <span class="result-highlight">' +
      billAmountFormatted +
      "</span></div>" +
      '<div class="result-line">Tip amount: <span class="result-highlight">' +
      tipAmountFormatted +
      "</span></div>" +
      '<div class="result-line">Total with tip: <span class="result-highlight">' +
      totalWithTipFormatted +
      "</span></div>" +
      '<div class="result-line">Number of people: <span class="result-highlight">' +
      numberOfPeople +
      "</span></div>" +
      '<div class="result-line">Amount per person: <span class="result-highlight">' +
      perPersonFormatted +
      "</span></div>" +
      extraNote;

    setSuccess(html);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", handleCalculate);
  }

  // Allow Enter key to trigger calculation from inputs
  [billAmountInput, tipPercentageInput, numberOfPeopleInput].forEach(function (el) {
    if (!el) return;
    el.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCalculate();
      }
    });
  });

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Split Bill Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
