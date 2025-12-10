document.addEventListener("DOMContentLoaded", function () {
  const fixedCostsInput = document.getElementById("fixedCosts");
  const sellingPriceInput = document.getElementById("sellingPrice");
  const variableCostInput = document.getElementById("variableCost");
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

  attachLiveFormatting(fixedCostsInput);
  attachLiveFormatting(sellingPriceInput);
  attachLiveFormatting(variableCostInput);

  function showError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function showResult(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const fixedCosts = toNumber(fixedCostsInput ? fixedCostsInput.value : "");
      const sellingPrice = toNumber(sellingPriceInput ? sellingPriceInput.value : "");
      const variableCost = toNumber(variableCostInput ? variableCostInput.value : "");

      if (!fixedCostsInput || !sellingPriceInput || !variableCostInput) {
        return;
      }

      if (isNaN(fixedCosts) || fixedCosts <= 0) {
        showError("Please enter a valid fixed cost greater than zero.");
        return;
      }

      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        showError("Please enter a valid selling price per unit greater than zero.");
        return;
      }

      if (isNaN(variableCost) || variableCost < 0) {
        showError("Please enter a valid variable cost per unit (zero or higher).");
        return;
      }

      const contributionMargin = sellingPrice - variableCost;

      if (contributionMargin <= 0) {
        showError("The margin per unit must be positive. Increase the selling price or reduce the variable cost.");
        return;
      }

      const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
      const breakEvenRevenue = breakEvenUnits * sellingPrice;

      const contributionMarginFormatted = formatNumberTwoDecimals(contributionMargin);
      const breakEvenRevenueFormatted = formatNumberTwoDecimals(breakEvenRevenue);
      const breakEvenUnitsFormatted = breakEvenUnits.toLocaleString("en-US");

      const resultHtml = `
        <p>You need to sell approximately <strong>${breakEvenUnitsFormatted} units</strong> to break even.</p>
        <p>Contribution margin per unit: <strong>${contributionMarginFormatted}</strong></p>
        <p>Break-even revenue: <strong>${breakEvenRevenueFormatted}</strong></p>
      `;

      showResult(resultHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Break-Even Point Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
