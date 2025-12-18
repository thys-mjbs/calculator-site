document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const amountInput = document.getElementById("amountInput");
  const taxRateInput = document.getElementById("taxRateInput");
  const quantityInput = document.getElementById("quantityInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(amountInput);
  attachLiveFormatting(taxRateInput);
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
      const mode = modeSelect ? modeSelect.value : "add";

      const amount = toNumber(amountInput ? amountInput.value : "");
      const rate = toNumber(taxRateInput ? taxRateInput.value : "");
      const qtyRaw = toNumber(quantityInput ? quantityInput.value : "");

      if (!amountInput || !taxRateInput) return;

      if (!validatePositive(amount, "amount")) return;
      if (!validateNonNegative(rate, "tax rate")) return;

      if (!Number.isFinite(rate) || rate > 100) {
        setResultError("Enter a valid tax rate between 0 and 100.");
        return;
      }

      let qty = 1;
      if (quantityInput && quantityInput.value.trim() !== "") {
        if (!validatePositive(qtyRaw, "quantity")) return;
        qty = qtyRaw;
      }

      const rateDecimal = rate / 100;
      const multiplier = 1 + rateDecimal;

      let net = 0;
      let tax = 0;
      let total = 0;

      if (mode === "remove") {
        total = amount;
        if (multiplier === 0) {
          setResultError("Enter a valid tax rate greater than -100%.");
          return;
        }
        net = total / multiplier;
        tax = total - net;
      } else {
        net = amount;
        tax = net * rateDecimal;
        total = net + tax;
      }

      const perNet = qty > 0 ? net / qty : net;
      const perTax = qty > 0 ? tax / qty : tax;
      const perTotal = qty > 0 ? total / qty : total;

      const amountLabel = mode === "remove" ? "Tax-included amount (input)" : "Pre-tax amount (input)";
      const rateLabel = "Tax rate";
      const modeLabel = mode === "remove" ? "Remove VAT / sales tax" : "Add VAT / sales tax";

      const resultHtml = `
        <div class="result-row"><strong>${modeLabel}</strong></div>
        <div class="result-row">${amountLabel}: <strong>${formatNumberTwoDecimals(amount)}</strong></div>
        <div class="result-row">${rateLabel}: <strong>${formatNumberTwoDecimals(rate)}%</strong></div>
        <hr>
        <div class="result-row">Pre-tax amount: <strong>${formatNumberTwoDecimals(net)}</strong></div>
        <div class="result-row">Tax amount: <strong>${formatNumberTwoDecimals(tax)}</strong></div>
        <div class="result-row">Total (incl. tax): <strong>${formatNumberTwoDecimals(total)}</strong></div>
        <hr>
        <div class="result-row">Quick check: total = pre-tax × <strong>${formatNumberTwoDecimals(multiplier)}</strong></div>
        <div class="result-row">Tax per 100 of pre-tax: <strong>${formatNumberTwoDecimals(100 * rateDecimal)}</strong></div>
        ${
          qty !== 1
            ? `
              <hr>
              <div class="result-row"><strong>Per-item estimate (quantity: ${formatNumberTwoDecimals(qty)})</strong></div>
              <div class="result-row">Pre-tax per item: <strong>${formatNumberTwoDecimals(perNet)}</strong></div>
              <div class="result-row">Tax per item: <strong>${formatNumberTwoDecimals(perTax)}</strong></div>
              <div class="result-row">Total per item: <strong>${formatNumberTwoDecimals(perTotal)}</strong></div>
            `
            : ""
        }
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
      const message = "VAT/Sales Tax Calculator (Everyday Use Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
