document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const costInput = document.getElementById("costInput");
  const priceInput = document.getElementById("priceInput");
  const quantityInput = document.getElementById("quantityInput");
  const targetMarginInput = document.getElementById("targetMarginInput");

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

  // Attach formatting where it makes sense
  attachLiveFormatting(costInput);
  attachLiveFormatting(priceInput);
  attachLiveFormatting(quantityInput);
  attachLiveFormatting(targetMarginInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const cost = toNumber(costInput ? costInput.value : "");
      const price = toNumber(priceInput ? priceInput.value : "");
      const qtyRaw = toNumber(quantityInput ? quantityInput.value : "");
      const targetMarginRaw = toNumber(targetMarginInput ? targetMarginInput.value : "");

      // Basic existence guard
      if (!costInput || !priceInput) return;

      // Validation (required inputs)
      if (!validatePositive(cost, "cost per unit")) return;
      if (!validatePositive(price, "selling price per unit")) return;

      // Quantity (optional, default 1)
      let quantity = 1;
      if (Number.isFinite(qtyRaw) && qtyRaw > 0) {
        quantity = qtyRaw;
      } else if (quantityInput && quantityInput.value.trim() !== "") {
        setResultError("Enter a valid quantity greater than 0, or leave it blank.");
        return;
      }

      // Core calculations
      const profitPerUnit = price - cost;
      const marginPct = (profitPerUnit / price) * 100;
      const markupPct = (profitPerUnit / cost) * 100;

      const revenueTotal = price * quantity;
      const costTotal = cost * quantity;
      const profitTotal = profitPerUnit * quantity;

      // Optional target margin price
      let targetBlock = "";
      const hasTargetMargin = targetMarginInput && targetMarginInput.value.trim() !== "";
      if (hasTargetMargin) {
        if (!Number.isFinite(targetMarginRaw)) {
          setResultError("Enter a valid target margin percentage, or leave it blank.");
          return;
        }
        if (targetMarginRaw <= 0 || targetMarginRaw >= 100) {
          setResultError("Target margin % must be greater than 0 and less than 100.");
          return;
        }

        const targetMargin = targetMarginRaw / 100;
        const requiredPrice = cost / (1 - targetMargin);
        const requiredProfit = requiredPrice - cost;

        targetBlock =
          `<p><strong>Target margin price:</strong> ${formatNumberTwoDecimals(requiredPrice)} per unit</p>` +
          `<p><strong>Profit at target:</strong> ${formatNumberTwoDecimals(requiredProfit)} per unit</p>`;
      }

      // Practical status line
      let statusLine = "";
      if (profitPerUnit > 0) {
        statusLine = "Profitable per unit before overheads.";
      } else if (profitPerUnit === 0) {
        statusLine = "Break-even on direct cost per unit (overheads not included).";
      } else {
        statusLine = "Selling below cost per unit (loss before overheads).";
      }

      const resultHtml = `
        <p><strong>Profit per unit:</strong> ${formatNumberTwoDecimals(profitPerUnit)}</p>
        <p><strong>Gross margin:</strong> ${formatNumberTwoDecimals(marginPct)}%</p>
        <p><strong>Markup:</strong> ${formatNumberTwoDecimals(markupPct)}%</p>
        <p><strong>Status:</strong> ${statusLine}</p>
        <hr>
        <p><strong>Quantity:</strong> ${formatNumberTwoDecimals(quantity)}</p>
        <p><strong>Total revenue:</strong> ${formatNumberTwoDecimals(revenueTotal)}</p>
        <p><strong>Total cost:</strong> ${formatNumberTwoDecimals(costTotal)}</p>
        <p><strong>Total gross profit:</strong> ${formatNumberTwoDecimals(profitTotal)}</p>
        ${targetBlock ? "<hr>" + targetBlock : ""}
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
      const message = "Margin Calculator (General Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
