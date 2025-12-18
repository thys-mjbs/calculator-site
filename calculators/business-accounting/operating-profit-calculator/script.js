document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const revenueInput = document.getElementById("revenueInput");
  const cogsInput = document.getElementById("cogsInput");
  const opexInput = document.getElementById("opexInput");
  const otherOpIncomeInput = document.getElementById("otherOpIncomeInput");
  const otherOpExpenseInput = document.getElementById("otherOpExpenseInput");

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
  attachLiveFormatting(revenueInput);
  attachLiveFormatting(cogsInput);
  attachLiveFormatting(opexInput);
  attachLiveFormatting(otherOpIncomeInput);
  attachLiveFormatting(otherOpExpenseInput);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const revenue = toNumber(revenueInput ? revenueInput.value : "");
      const cogs = toNumber(cogsInput ? cogsInput.value : "");
      const opex = toNumber(opexInput ? opexInput.value : "");
      const otherOpIncome = toNumber(otherOpIncomeInput ? otherOpIncomeInput.value : "");
      const otherOpExpense = toNumber(otherOpExpenseInput ? otherOpExpenseInput.value : "");

      // Basic existence guard
      if (!revenueInput || !cogsInput || !opexInput) return;

      // Validation (required inputs)
      if (!validatePositive(revenue, "Revenue")) return;
      if (!validateNonNegative(cogs, "COGS")) return;
      if (!validateNonNegative(opex, "Operating expenses")) return;

      // Validation (optional inputs; blank allowed and treated as 0)
      if (!Number.isFinite(otherOpIncome) || otherOpIncome < 0) {
        setResultError("Enter a valid Other operating income (0 or higher), or leave it blank.");
        return;
      }
      if (!Number.isFinite(otherOpExpense) || otherOpExpense < 0) {
        setResultError("Enter a valid Other operating expenses (0 or higher), or leave it blank.");
        return;
      }

      // Sanity checks (non-blocking but prevents confusing outputs)
      if (cogs > revenue) {
        setResultError("COGS is greater than Revenue. Check your inputs or time period.");
        return;
      }

      // Calculation logic
      const grossProfit = revenue - cogs;
      const operatingProfit = grossProfit - opex + otherOpIncome - otherOpExpense;

      const grossMarginPct = (grossProfit / revenue) * 100;
      const operatingMarginPct = (operatingProfit / revenue) * 100;

      const opexRatioPct = (opex / revenue) * 100;

      // Build output HTML
      const resultHtml = `
        <p><strong>Operating profit:</strong> ${formatNumberTwoDecimals(operatingProfit)}</p>
        <p><strong>Operating margin:</strong> ${formatNumberTwoDecimals(operatingMarginPct)}%</p>
        <hr>
        <p><strong>Gross profit:</strong> ${formatNumberTwoDecimals(grossProfit)}</p>
        <p><strong>Gross margin:</strong> ${formatNumberTwoDecimals(grossMarginPct)}%</p>
        <p><strong>Operating expense ratio (OPEX ÷ revenue):</strong> ${formatNumberTwoDecimals(opexRatioPct)}%</p>
        <hr>
        <p style="margin:0;">
          <strong>Interpretation:</strong> Gross profit shows whether sales cover direct costs (COGS).
          Operating profit then shows what is left after running the business (OPEX), before interest and tax.
        </p>
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
      const message = "Operating Profit Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
