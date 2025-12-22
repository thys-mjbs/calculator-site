document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalPriceInput = document.getElementById("totalPrice");
  const quantityInput = document.getElementById("quantity");
  const unitLabelInput = document.getElementById("unitLabel");
  const packCountInput = document.getElementById("packCount");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Format numeric inputs with commas
  attachLiveFormatting(totalPriceInput);
  attachLiveFormatting(quantityInput);
  attachLiveFormatting(packCountInput);

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

  function validateIntegerMin(value, fieldLabel, minValue) {
    if (!Number.isFinite(value) || value < minValue || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number of " + minValue + " or more.");
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

      if (!totalPriceInput || !quantityInput || !unitLabelInput || !packCountInput) return;

      const totalPrice = toNumber(totalPriceInput.value);
      const quantityPerItem = toNumber(quantityInput.value);

      const rawUnitLabel = (unitLabelInput.value || "").trim();
      const unitLabel = rawUnitLabel.length > 0 ? rawUnitLabel : "unit";

      const packCountRaw = toNumber(packCountInput.value);
      const packCount = Number.isFinite(packCountRaw) && packCountRaw > 0 ? Math.floor(packCountRaw) : 1;

      if (!validatePositive(totalPrice, "total price")) return;
      if (!validatePositive(quantityPerItem, "quantity per item")) return;
      if (!validateIntegerMin(packCount, "number of items in the pack", 1)) return;

      const totalQuantity = quantityPerItem * packCount;

      if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) {
        setResultError("Enter a quantity and pack count that produce a valid total quantity.");
        return;
      }

      const unitPrice = totalPrice / totalQuantity;
      const pricePer100 = unitPrice * 100;
      const pricePer1000 = unitPrice * 1000;

      const totalPriceFormatted = formatNumberTwoDecimals(totalPrice);
      const unitPriceFormatted = formatNumberTwoDecimals(unitPrice);
      const pricePer100Formatted = formatNumberTwoDecimals(pricePer100);
      const pricePer1000Formatted = formatNumberTwoDecimals(pricePer1000);
      const totalQuantityFormatted = formatNumberTwoDecimals(totalQuantity);

      let perItemLine = "";
      if (packCount > 1) {
        const perItem = totalPrice / packCount;
        const perItemFormatted = formatNumberTwoDecimals(perItem);
        perItemLine = `<p><strong>Price per item:</strong> ${perItemFormatted}</p>`;
      }

      const resultHtml = `
        <p><strong>Unit price:</strong> ${unitPriceFormatted} per ${unitLabel}</p>
        <p><strong>Total quantity:</strong> ${totalQuantityFormatted} ${unitLabel}</p>
        ${perItemLine}
        <p><strong>Price per 100 ${unitLabel}:</strong> ${pricePer100Formatted}</p>
        <p><strong>Price per 1,000 ${unitLabel}:</strong> ${pricePer1000Formatted}</p>
        <p><em>Tip:</em> Compare products using the same unit (for example, always use g or always use ml).</p>
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
      const message = "Unit Price Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
