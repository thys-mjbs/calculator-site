// Break-Even Point Calculator — Logic

document.addEventListener("DOMContentLoaded", function () {
  const fixedCostsInput = document.getElementById("fixedCosts");
  const sellingPriceInput = document.getElementById("sellingPrice");
  const variableCostInput = document.getElementById("variableCost");
  const expectedUnitsInput = document.getElementById("expectedUnits");
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
  // expectedUnitsInput kept as numeric input; no comma formatting needed

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const fixedCosts = toNumber(fixedCostsInput.value);
      const sellingPrice = toNumber(sellingPriceInput.value);
      const variableCost = toNumber(variableCostInput.value);
      const expectedUnitsRaw = expectedUnitsInput.value.trim();
      const expectedUnits = expectedUnitsRaw === "" ? null : toNumber(expectedUnitsRaw);

      if (fixedCosts <= 0 || sellingPrice <= 0 || variableCost < 0) {
        resultDiv.textContent = "Enter valid numbers for all required fields.";
        return;
      }

      const contributionPerUnit = sellingPrice - variableCost;

      if (contributionPerUnit <= 0) {
        resultDiv.textContent =
          "Selling price must be higher than variable cost per unit to reach break-even.";
        return;
      }

      const breakEvenUnitsExact = fixedCosts / contributionPerUnit;
      const breakEvenUnits = Math.ceil(breakEvenUnitsExact);
      const breakEvenRevenue = breakEvenUnits * sellingPrice;

      let html = "";

      html +=
        "<p><strong>Break-even quantity:</strong> " +
        breakEvenUnits.toLocaleString() +
        " units</p>";
      html +=
        "<p><strong>Break-even sales value:</strong> " +
        formatNumberTwoDecimals(breakEvenRevenue) +
        "</p>";

      if (expectedUnits !== null && expectedUnits >= 0) {
        const profit = contributionPerUnit * expectedUnits - fixedCosts;
        const marginOfSafetyUnits = expectedUnits - breakEvenUnits;
        const hasSafety = marginOfSafetyUnits > 0;
        const marginOfSafetyPercent = hasSafety
          ? (marginOfSafetyUnits / expectedUnits) * 100
          : 0;

        const profitLabel = profit >= 0 ? "Estimated profit" : "Estimated loss";
        const profitValueText = formatNumberTwoDecimals(Math.abs(profit));

        html += "<p><strong>" + profitLabel + " at " +
          expectedUnits.toLocaleString() +
          " units:</strong> " + profitValueText + "</p>";

        if (expectedUnits === 0) {
          html += "<p>You have entered 0 units sold, so there is no margin of safety.</p>";
        } else if (hasSafety) {
          html +=
            "<p><strong>Margin of safety:</strong> " +
            marginOfSafetyUnits.toLocaleString() +
            " units (" +
            formatNumberTwoDecimals(marginOfSafetyPercent) +
            "% above break-even)</p>";
        } else if (expectedUnits < breakEvenUnits) {
          html +=
            "<p>Your expected sales are below break-even, so you are projected to make a loss at this volume.</p>";
        } else if (expectedUnits === breakEvenUnits) {
          html +=
            "<p>Your expected sales are exactly at the break-even point, so profit is approximately zero.</p>";
        }
      }

      resultDiv.innerHTML = html;
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Break-Even Point Calculator – check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
