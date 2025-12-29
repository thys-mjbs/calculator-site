document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const payingCustomersInput = document.getElementById("payingCustomers");
  const avgMonthlyPriceInput = document.getElementById("avgMonthlyPrice");
  const avgDiscountPercentInput = document.getElementById("avgDiscountPercent");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(payingCustomersInput);
  attachLiveFormatting(avgMonthlyPriceInput);
  attachLiveFormatting(avgDiscountPercentInput);

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
      const payingCustomers = toNumber(payingCustomersInput ? payingCustomersInput.value : "");
      const avgMonthlyPrice = toNumber(avgMonthlyPriceInput ? avgMonthlyPriceInput.value : "");
      const avgDiscountPercentRaw = toNumber(avgDiscountPercentInput ? avgDiscountPercentInput.value : "");

      // Basic existence guard
      if (!payingCustomersInput || !avgMonthlyPriceInput) return;

      // Validation
      if (!validatePositive(payingCustomers, "number of paying customers")) return;
      if (!validatePositive(avgMonthlyPrice, "average monthly subscription price")) return;

      let avgDiscountPercent = 0;
      if (Number.isFinite(avgDiscountPercentRaw) && avgDiscountPercentRaw > 0) {
        avgDiscountPercent = avgDiscountPercentRaw;
      } else if (Number.isFinite(avgDiscountPercentRaw) && avgDiscountPercentRaw === 0) {
        avgDiscountPercent = 0;
      } else if (avgDiscountPercentInput && avgDiscountPercentInput.value.trim() !== "") {
        setResultError("Enter a valid average discount percent (0 to 100), or leave it blank.");
        return;
      }

      if (!validateNonNegative(avgDiscountPercent, "average discount percent")) return;
      if (avgDiscountPercent > 100) {
        setResultError("Average discount percent cannot be greater than 100.");
        return;
      }

      // Calculation logic
      const discountFactor = 1 - avgDiscountPercent / 100;
      const effectiveArpa = avgMonthlyPrice * discountFactor;
      const mrr = payingCustomers * effectiveArpa;
      const arrRunRate = mrr * 12;

      // A simple sanity-check figure: daily equivalent using average month length (30.44 days)
      const dailyEquivalent = mrr / 30.44;

      // Build output HTML
      const discountLine =
        avgDiscountPercent > 0
          ? `<p><strong>Average discount applied:</strong> ${avgDiscountPercent.toFixed(2)}%</p>`
          : `<p><strong>Average discount applied:</strong> 0.00% (gross MRR)</p>`;

      const resultHtml = `
        <p><strong>Monthly Recurring Revenue (MRR):</strong> ${formatNumberTwoDecimals(mrr)}</p>
        <p><strong>Annual run rate (ARR):</strong> ${formatNumberTwoDecimals(arrRunRate)}</p>
        <p><strong>Effective monthly revenue per customer:</strong> ${formatNumberTwoDecimals(effectiveArpa)}</p>
        <p><strong>Daily equivalent (MRR / 30.44):</strong> ${formatNumberTwoDecimals(dailyEquivalent)}</p>
        ${discountLine}
        <p><strong>Interpretation:</strong> This is a snapshot of recurring subscription revenue for the month, excluding one-time fees and other non-recurring items.</p>
      `;

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
      const message = "Monthly Recurring Revenue (MRR) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
