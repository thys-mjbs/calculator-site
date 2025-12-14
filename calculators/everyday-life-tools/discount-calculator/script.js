document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const originalPriceInput = document.getElementById("originalPrice");
  const discountPercentInput = document.getElementById("discountPercent");
  const discountAmountInput = document.getElementById("discountAmount");
  const taxPercentInput = document.getElementById("taxPercent");
  const quantityInput = document.getElementById("quantity");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = document.getElementById("discountMode");
  const modeBlockPercent = document.getElementById("modeBlockPercent");
  const modeBlockAmount = document.getElementById("modeBlockAmount");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(originalPriceInput);
  attachLiveFormatting(discountPercentInput);
  attachLiveFormatting(discountAmountInput);
  attachLiveFormatting(taxPercentInput);
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
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeBlockPercent) modeBlockPercent.classList.add("hidden");
    if (modeBlockAmount) modeBlockAmount.classList.add("hidden");

    if (mode === "percent" && modeBlockPercent) modeBlockPercent.classList.remove("hidden");
    if (mode === "amount" && modeBlockAmount) modeBlockAmount.classList.remove("hidden");

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  function validatePercentRange(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "percent";

      const originalPrice = toNumber(originalPriceInput ? originalPriceInput.value : "");
      const discountPercent = toNumber(discountPercentInput ? discountPercentInput.value : "");
      const discountAmount = toNumber(discountAmountInput ? discountAmountInput.value : "");
      const taxPercent = toNumber(taxPercentInput ? taxPercentInput.value : "");
      const quantityRaw = toNumber(quantityInput ? quantityInput.value : "");

      if (!originalPriceInput || !resultDiv) return;

      if (!validatePositive(originalPrice, "original price")) return;

      if (!validateNonNegative(taxPercent, "tax or VAT percent")) return;
      if (!validatePercentRange(taxPercent, "tax or VAT percent")) return;

      let quantity = 1;
      if (Number.isFinite(quantityRaw) && quantityRaw > 0) {
        quantity = Math.floor(quantityRaw);
      }

      if (quantity < 1) {
        setResultError("Enter a valid quantity (1 or higher), or leave it blank.");
        return;
      }

      let savings = 0;

      if (mode === "percent") {
        if (!validateNonNegative(discountPercent, "discount percent")) return;
        if (!validatePercentRange(discountPercent, "discount percent")) return;

        savings = (originalPrice * discountPercent) / 100;
      } else {
        if (!validateNonNegative(discountAmount, "discount amount")) return;
        savings = discountAmount;
      }

      if (!Number.isFinite(savings) || savings < 0) {
        setResultError("Enter a valid discount.");
        return;
      }

      if (savings >= originalPrice) {
        savings = originalPrice;
      }

      const discountedPrice = Math.max(0, originalPrice - savings);
      const taxAmount = (discountedPrice * taxPercent) / 100;
      const finalPriceEach = discountedPrice + taxAmount;

      const totalOriginal = originalPrice * quantity;
      const totalSavings = savings * quantity;
      const totalTax = taxAmount * quantity;
      const totalFinal = finalPriceEach * quantity;

      const resultHtml = `
        <p><strong>Original price:</strong> ${formatNumberTwoDecimals(originalPrice)}</p>
        <p><strong>You save:</strong> ${formatNumberTwoDecimals(savings)}</p>
        <p><strong>Discounted price:</strong> ${formatNumberTwoDecimals(discountedPrice)}</p>
        <p><strong>Tax/VAT amount:</strong> ${formatNumberTwoDecimals(taxAmount)}</p>
        <p><strong>Final price (each):</strong> ${formatNumberTwoDecimals(finalPriceEach)}</p>
        <hr>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total original:</strong> ${formatNumberTwoDecimals(totalOriginal)}</p>
        <p><strong>Total savings:</strong> ${formatNumberTwoDecimals(totalSavings)}</p>
        <p><strong>Total tax/VAT:</strong> ${formatNumberTwoDecimals(totalTax)}</p>
        <p><strong>Total to pay:</strong> ${formatNumberTwoDecimals(totalFinal)}</p>
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
      const message = "Discount Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
