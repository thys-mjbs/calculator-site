document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const pricePerShareInput = document.getElementById("pricePerShare");
  const annualDividendPerShareInput = document.getElementById("annualDividendPerShare");
  const sharesOwnedInput = document.getElementById("sharesOwned");
  const targetYieldInput = document.getElementById("targetYield");

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
  attachLiveFormatting(pricePerShareInput);
  attachLiveFormatting(annualDividendPerShareInput);
  attachLiveFormatting(sharesOwnedInput);
  attachLiveFormatting(targetYieldInput);

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
    // not used
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
      const pricePerShare = toNumber(pricePerShareInput ? pricePerShareInput.value : "");
      const annualDividendPerShare = toNumber(
        annualDividendPerShareInput ? annualDividendPerShareInput.value : ""
      );

      const sharesOwnedRaw = toNumber(sharesOwnedInput ? sharesOwnedInput.value : "");
      const targetYieldRaw = toNumber(targetYieldInput ? targetYieldInput.value : "");

      const sharesOwned = Number.isFinite(sharesOwnedRaw) ? sharesOwnedRaw : 0;
      const targetYield = Number.isFinite(targetYieldRaw) ? targetYieldRaw : 0;

      // Basic existence guard
      if (!pricePerShareInput || !annualDividendPerShareInput) return;

      // Validation
      if (!validatePositive(pricePerShare, "current share price")) return;
      if (!validateNonNegative(annualDividendPerShare, "annual dividend per share")) return;
      if (!validateNonNegative(sharesOwned, "shares owned")) return;
      if (!validateNonNegative(targetYield, "target yield")) return;

      // Calculation logic
      const yieldPercent = (annualDividendPerShare / pricePerShare) * 100;

      const annualIncome = sharesOwned > 0 ? annualDividendPerShare * sharesOwned : 0;
      const monthlyEquivalent = sharesOwned > 0 ? annualIncome / 12 : 0;

      let targetPrice = 0;
      if (targetYield > 0) {
        targetPrice = annualDividendPerShare / (targetYield / 100);
      }

      // Build output HTML
      const yieldStr = formatNumberTwoDecimals(yieldPercent);
      const priceStr = formatNumberTwoDecimals(pricePerShare);
      const dividendStr = formatNumberTwoDecimals(annualDividendPerShare);

      let resultHtml = "";
      resultHtml += `<p><strong>Dividend yield:</strong> ${yieldStr}%</p>`;
      resultHtml += `<p>Based on an annual dividend of <strong>${dividendStr}</strong> per share and a current price of <strong>${priceStr}</strong> per share.</p>`;

      if (sharesOwned > 0) {
        const annualIncomeStr = formatNumberTwoDecimals(annualIncome);
        const monthlyEqStr = formatNumberTwoDecimals(monthlyEquivalent);
        resultHtml += `<p><strong>Estimated dividend income:</strong> ${annualIncomeStr} per year (about ${monthlyEqStr} per month equivalent) for <strong>${formatInputWithCommas(String(Math.round(sharesOwned)))}</strong> shares.</p>`;
      } else {
        resultHtml += `<p><strong>Income estimate:</strong> Add “Shares owned” to estimate annual and monthly dividend income.</p>`;
      }

      if (targetYield > 0) {
        const targetYieldStr = formatNumberTwoDecimals(targetYield);
        const targetPriceStr = formatNumberTwoDecimals(targetPrice);
        resultHtml += `<p><strong>Price at ${targetYieldStr}% yield:</strong> ${targetPriceStr} per share (using the same annual dividend per share).</p>`;
      }

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Dividend Yield Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
