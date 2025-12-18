document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const listPriceInput = document.getElementById("listPrice");
  const discountPercentInput = document.getElementById("discountPercent");
  const discountAmountInput = document.getElementById("discountAmount");
  const taxRateInput = document.getElementById("taxRate");
  const quantityInput = document.getElementById("quantity");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Apply comma formatting where it makes sense
  attachLiveFormatting(listPriceInput);
  attachLiveFormatting(discountAmountInput);
  attachLiveFormatting(quantityInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!listPriceInput || !discountPercentInput || !discountAmountInput || !taxRateInput || !quantityInput) return;

      const listPrice = toNumber(listPriceInput.value);
      const discountPercentRaw = toNumber(discountPercentInput.value);
      const discountAmountRaw = toNumber(discountAmountInput.value);
      const taxRateRaw = toNumber(taxRateInput.value);
      const quantityRaw = toNumber(quantityInput.value);

      if (!validatePositive(listPrice, "list price")) return;

      const hasDiscountPercent = Number.isFinite(discountPercentRaw) && discountPercentInput.value.trim() !== "";
      const hasDiscountAmount = Number.isFinite(discountAmountRaw) && discountAmountInput.value.trim() !== "";
      const hasTaxRate = Number.isFinite(taxRateRaw) && taxRateInput.value.trim() !== "";
      const hasQuantity = Number.isFinite(quantityRaw) && quantityInput.value.trim() !== "";

      let discountPercent = hasDiscountPercent ? discountPercentRaw : 0;
      let discountAmount = 0;

      if (hasDiscountPercent) {
        if (!validateNonNegative(discountPercent, "discount percent")) return;
        if (discountPercent > 100) {
          setResultError("Discount percent must be between 0 and 100.");
          return;
        }
        discountAmount = (listPrice * discountPercent) / 100;
      } else if (hasDiscountAmount) {
        if (!validateNonNegative(discountAmountRaw, "discount amount")) return;
        discountAmount = discountAmountRaw;
        if (discountAmount > listPrice) {
          setResultError("Discount amount cannot be more than the list price.");
          return;
        }
        discountPercent = listPrice === 0 ? 0 : (discountAmount / listPrice) * 100;
      } else {
        discountPercent = 0;
        discountAmount = 0;
      }

      let taxRate = hasTaxRate ? taxRateRaw : 0;
      if (hasTaxRate) {
        if (!validateNonNegative(taxRate, "tax rate")) return;
        if (taxRate > 100) {
          setResultError("Tax rate must be between 0 and 100.");
          return;
        }
      }

      let quantity = hasQuantity ? quantityRaw : 1;
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setResultError("Enter a valid quantity greater than 0, or leave it blank.");
        return;
      }

      // If quantity is not close to an integer, accept it but warn subtly via breakdown
      const quantityIsWhole = Math.abs(quantity - Math.round(quantity)) < 1e-9;

      const salePriceBeforeTax = Math.max(0, listPrice - discountAmount);
      const taxPerItem = (salePriceBeforeTax * taxRate) / 100;
      const finalPricePerItem = salePriceBeforeTax + taxPerItem;

      const subtotal = salePriceBeforeTax * quantity;
      const totalTax = taxPerItem * quantity;
      const totalPayable = finalPricePerItem * quantity;

      const savingsPerItem = discountAmount;
      const totalSavings = savingsPerItem * quantity;

      const resultHtml = `
        <p><strong>Final price (per item):</strong> ${formatNumberTwoDecimals(finalPricePerItem)}</p>
        <p><strong>Sale price before tax (per item):</strong> ${formatNumberTwoDecimals(salePriceBeforeTax)}</p>
        <p><strong>You save (per item):</strong> ${formatNumberTwoDecimals(savingsPerItem)} (${formatNumberTwoDecimals(discountPercent)}%)</p>
        <p><strong>Tax (per item):</strong> ${formatNumberTwoDecimals(taxPerItem)} (${formatNumberTwoDecimals(taxRate)}%)</p>
        <hr>
        <p><strong>Quantity:</strong> ${quantityIsWhole ? Math.round(quantity) : formatNumberTwoDecimals(quantity)}</p>
        <p><strong>Subtotal (before tax):</strong> ${formatNumberTwoDecimals(subtotal)}</p>
        <p><strong>Total tax:</strong> ${formatNumberTwoDecimals(totalTax)}</p>
        <p><strong>Total payable:</strong> ${formatNumberTwoDecimals(totalPayable)}</p>
        <p><strong>Total savings:</strong> ${formatNumberTwoDecimals(totalSavings)}</p>
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
      const message = "Sales Price Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
