document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const mealTotalInput = document.getElementById("mealTotal");
  const peopleCountInput = document.getElementById("peopleCount");
  const taxPercentInput = document.getElementById("taxPercent");
  const tipPercentInput = document.getElementById("tipPercent");
  const extraFeesInput = document.getElementById("extraFees");
  const discountAmountInput = document.getElementById("discountAmount");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(mealTotalInput);
  attachLiveFormatting(peopleCountInput);
  attachLiveFormatting(taxPercentInput);
  attachLiveFormatting(tipPercentInput);
  attachLiveFormatting(extraFeesInput);
  attachLiveFormatting(discountAmountInput);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
  }

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateWholeNumber(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number (1 or higher).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const mealTotal = toNumber(mealTotalInput ? mealTotalInput.value : "");
      const peopleCountRaw = toNumber(peopleCountInput ? peopleCountInput.value : "");
      const taxPercent = toNumber(taxPercentInput ? taxPercentInput.value : "");
      const tipPercent = toNumber(tipPercentInput ? tipPercentInput.value : "");
      const extraFees = toNumber(extraFeesInput ? extraFeesInput.value : "");
      const discountAmount = toNumber(discountAmountInput ? discountAmountInput.value : "");

      // Basic existence guard
      if (
        !mealTotalInput ||
        !peopleCountInput ||
        !taxPercentInput ||
        !tipPercentInput ||
        !extraFeesInput ||
        !discountAmountInput
      ) {
        return;
      }

      // Validation
      if (!validatePositive(mealTotal, "meal total")) return;
      if (!validateWholeNumber(peopleCountRaw, "number of people")) return;

      if (!validateNonNegative(taxPercent, "tax percentage")) return;
      if (!validateNonNegative(tipPercent, "tip percentage")) return;
      if (!validateNonNegative(extraFees, "extra fees")) return;
      if (!validateNonNegative(discountAmount, "discount or voucher")) return;

      if (taxPercent > 1000 || tipPercent > 1000) {
        setResultError("Tax and tip percentages look unusually high. Double-check your inputs.");
        return;
      }

      const peopleCount = peopleCountRaw;

      // Calculation logic
      const taxAmount = mealTotal * (taxPercent / 100);
      const tipAmount = mealTotal * (tipPercent / 100);

      let totalPayable = mealTotal + taxAmount + tipAmount + extraFees - discountAmount;

      if (!Number.isFinite(totalPayable)) {
        setResultError("Something went wrong with the calculation. Check your inputs and try again.");
        return;
      }

      if (totalPayable < 0) {
        setResultError("Your discount is larger than the total. Reduce the discount or verify the amounts.");
        return;
      }

      const perPersonTotal = totalPayable / peopleCount;

      const perPersonBase = mealTotal / peopleCount;
      const perPersonTax = taxAmount / peopleCount;
      const perPersonTip = tipAmount / peopleCount;
      const perPersonFees = extraFees / peopleCount;
      const perPersonDiscount = discountAmount / peopleCount;

      // Build output HTML
      const resultHtml = `
        <p><strong>Cost per person:</strong> ${formatNumberTwoDecimals(perPersonTotal)}</p>
        <p><strong>Total payable:</strong> ${formatNumberTwoDecimals(totalPayable)}</p>
        <hr>
        <p><strong>Per-person breakdown:</strong></p>
        <p>Base meal: ${formatNumberTwoDecimals(perPersonBase)}</p>
        <p>Tax: ${formatNumberTwoDecimals(perPersonTax)}</p>
        <p>Tip/service: ${formatNumberTwoDecimals(perPersonTip)}</p>
        <p>Extra fees: ${formatNumberTwoDecimals(perPersonFees)}</p>
        <p>Discount/voucher: -${formatNumberTwoDecimals(perPersonDiscount)}</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Meal Cost Per Person Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
