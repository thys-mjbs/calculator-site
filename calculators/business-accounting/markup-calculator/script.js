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
  const markupInput = document.getElementById("markupInput");
  const sellingInput = document.getElementById("sellingInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = document.getElementById("modeSelect");
  const modeBlockPercent = document.getElementById("modeBlockPercent");
  const modeBlockPrice = document.getElementById("modeBlockPrice");

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
  attachLiveFormatting(costInput);
  attachLiveFormatting(markupInput);
  attachLiveFormatting(sellingInput);

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
    if (modeBlockPrice) modeBlockPrice.classList.add("hidden");

    if (mode === "percent") {
      if (modeBlockPercent) modeBlockPercent.classList.remove("hidden");
    } else if (mode === "price") {
      if (modeBlockPrice) modeBlockPrice.classList.remove("hidden");
    }

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "percent";

      const cost = toNumber(costInput ? costInput.value : "");
      const markupPercent = toNumber(markupInput ? markupInput.value : "");
      const selling = toNumber(sellingInput ? sellingInput.value : "");

      if (!costInput) return;
      if (mode === "percent" && !markupInput) return;
      if (mode === "price" && !sellingInput) return;

      if (!validatePositive(cost, "cost price")) return;

      let sellingPrice = 0;
      let profit = 0;
      let marginPercent = 0;
      let computedMarkupPercent = 0;

      if (mode === "percent") {
        if (!validateNonNegative(markupPercent, "markup percentage")) return;

        sellingPrice = cost * (1 + markupPercent / 100);
        profit = sellingPrice - cost;

        if (sellingPrice === 0) {
          setResultError("Selling price cannot be 0 with the values entered.");
          return;
        }

        marginPercent = (profit / sellingPrice) * 100;
        computedMarkupPercent = markupPercent;
      } else {
        if (!validatePositive(selling, "selling price")) return;

        sellingPrice = selling;
        profit = sellingPrice - cost;

        computedMarkupPercent = (profit / cost) * 100;

        if (sellingPrice === 0) {
          setResultError("Selling price cannot be 0 with the values entered.");
          return;
        }

        marginPercent = (profit / sellingPrice) * 100;
      }

      const sellingFormatted = formatNumberTwoDecimals(sellingPrice);
      const costFormatted = formatNumberTwoDecimals(cost);
      const profitFormatted = formatNumberTwoDecimals(profit);
      const markupFormatted = formatNumberTwoDecimals(computedMarkupPercent);
      const marginFormatted = formatNumberTwoDecimals(marginPercent);

      const resultHtml =
        `<p><strong>Selling price:</strong> ${sellingFormatted}</p>` +
        `<p><strong>Cost price:</strong> ${costFormatted}</p>` +
        `<p><strong>Profit:</strong> ${profitFormatted}</p>` +
        `<p><strong>Markup:</strong> ${markupFormatted}%</p>` +
        `<p><strong>Margin:</strong> ${marginFormatted}%</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Markup Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
