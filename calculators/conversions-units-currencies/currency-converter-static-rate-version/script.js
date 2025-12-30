document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const fromCurrencyInput = document.getElementById("fromCurrencyInput");
  const toCurrencyInput = document.getElementById("toCurrencyInput");
  const amountInput = document.getElementById("amountInput");
  const rateInput = document.getElementById("rateInput");
  const feePercentInput = document.getElementById("feePercentInput");
  const feeFixedInput = document.getElementById("feeFixedInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)

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
  attachLiveFormatting(feeFixedInput);

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

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeLabel(str) {
    const s = String(str || "").trim();
    if (!s) return "";
    return s.length > 12 ? s.slice(0, 12) : s;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // (no modes)
      const fromLabelRaw = normalizeLabel(fromCurrencyInput ? fromCurrencyInput.value : "");
      const toLabelRaw = normalizeLabel(toCurrencyInput ? toCurrencyInput.value : "");

      // Parse inputs using toNumber() (from /scripts/main.js)
      const amount = toNumber(amountInput ? amountInput.value : "");
      const rate = toNumber(rateInput ? rateInput.value : "");
      const feePercent = toNumber(feePercentInput ? feePercentInput.value : "");
      const feeFixed = toNumber(feeFixedInput ? feeFixedInput.value : "");

      // Basic existence guard
      if (!amountInput || !rateInput || !fromCurrencyInput || !toCurrencyInput) return;

      // Validation
      if (!fromLabelRaw) {
        setResultError("Enter a from currency label (for example, USD).");
        return;
      }
      if (!toLabelRaw) {
        setResultError("Enter a to currency label (for example, EUR).");
        return;
      }
      if (!validatePositive(amount, "amount")) return;
      if (!validatePositive(rate, "exchange rate")) return;

      const feePercentSafe = Number.isFinite(feePercent) ? feePercent : 0;
      const feeFixedSafe = Number.isFinite(feeFixed) ? feeFixed : 0;

      if (!validateNonNegative(feePercentSafe, "percentage fee")) return;
      if (!validateNonNegative(feeFixedSafe, "fixed fee")) return;

      if (feePercentSafe > 100) {
        setResultError("Enter a percentage fee between 0 and 100.");
        return;
      }

      // Calculation logic (fees assumed in the “to” currency)
      const grossTo = amount * rate;
      const percentFeeAmount = grossTo * (feePercentSafe / 100);
      const totalFee = percentFeeAmount + feeFixedSafe;
      const netTo = grossTo - totalFee;
      const effectiveRate = netTo / amount;

      // Build output HTML
      const fromLabel = escapeHtml(fromLabelRaw);
      const toLabel = escapeHtml(toLabelRaw);

      const grossText = formatNumberTwoDecimals(grossTo);
      const netText = formatNumberTwoDecimals(netTo);
      const feeText = formatNumberTwoDecimals(totalFee);
      const rateText = formatNumberTwoDecimals(rate);
      const effRateText = formatNumberTwoDecimals(effectiveRate);

      const hasFees = totalFee > 0.0000001;

      let resultHtml = "";
      resultHtml += `<p><strong>Gross conversion:</strong> ${grossText} ${toLabel}</p>`;
      resultHtml += `<p><strong>Rate used:</strong> 1 ${fromLabel} = ${rateText} ${toLabel}</p>`;

      if (hasFees) {
        resultHtml += `<p><strong>Total fees:</strong> ${feeText} ${toLabel}</p>`;
        resultHtml += `<p><strong>Net amount after fees:</strong> ${netText} ${toLabel}</p>`;
        resultHtml += `<p><strong>Effective rate after fees:</strong> 1 ${fromLabel} = ${effRateText} ${toLabel}</p>`;
      } else {
        resultHtml += `<p><strong>Net amount:</strong> ${grossText} ${toLabel} (no fees applied)</p>`;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Currency Converter (Static Rate Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
