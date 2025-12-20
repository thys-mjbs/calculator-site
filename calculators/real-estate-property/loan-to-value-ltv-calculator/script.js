document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const propertyValueInput = document.getElementById("propertyValue");
  const loanAmountInput = document.getElementById("loanAmount");
  const purchasePriceInput = document.getElementById("purchasePrice");
  const downPaymentInput = document.getElementById("downPayment");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(propertyValueInput);
  attachLiveFormatting(loanAmountInput);
  attachLiveFormatting(purchasePriceInput);
  attachLiveFormatting(downPaymentInput);

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
      clearResult();

      const propertyValue = toNumber(propertyValueInput ? propertyValueInput.value : "");
      const loanAmountRaw = toNumber(loanAmountInput ? loanAmountInput.value : "");
      const purchasePrice = toNumber(purchasePriceInput ? purchasePriceInput.value : "");
      const downPayment = toNumber(downPaymentInput ? downPaymentInput.value : "");

      if (!validatePositive(propertyValue, "property value")) return;

      let loanAmount = loanAmountRaw;

      const hasLoan = Number.isFinite(loanAmountRaw) && loanAmountRaw > 0;
      const hasPrice = Number.isFinite(purchasePrice) && purchasePrice > 0;
      const hasDown = Number.isFinite(downPayment) && downPayment >= 0;

      if (!hasLoan) {
        if (hasPrice && hasDown) {
          if (downPayment > purchasePrice) {
            setResultError("Down payment cannot be greater than the purchase price.");
            return;
          }
          loanAmount = purchasePrice - downPayment;
          if (loanAmount <= 0) {
            setResultError("Your estimated loan amount is 0. Increase the purchase price or reduce the down payment.");
            return;
          }
        } else {
          setResultError("Enter either a loan amount, or a purchase price and down payment.");
          return;
        }
      }

      if (!validatePositive(loanAmount, "loan amount")) return;

      const ltv = (loanAmount / propertyValue) * 100;
      const equity = propertyValue - loanAmount;

      const maxLoan80 = propertyValue * 0.8;
      const maxLoan90 = propertyValue * 0.9;

      let bandLabel = "";
      if (ltv <= 80) {
        bandLabel = "Lower LTV (often considered safer)";
      } else if (ltv <= 90) {
        bandLabel = "Mid LTV (often requires stronger affordability and credit)";
      } else if (ltv <= 100) {
        bandLabel = "High LTV (higher risk, stricter approval rules are common)";
      } else {
        bandLabel = "Over 100% LTV (loan exceeds property value)";
      }

      const ltvText = formatNumberTwoDecimals(ltv);
      const loanText = formatNumberTwoDecimals(loanAmount);
      const valueText = formatNumberTwoDecimals(propertyValue);
      const equityText = formatNumberTwoDecimals(equity);

      const maxLoan80Text = formatNumberTwoDecimals(maxLoan80);
      const maxLoan90Text = formatNumberTwoDecimals(maxLoan90);

      let loanSourceNote = "";
      if (!hasLoan) {
        loanSourceNote = `<p><strong>Loan used:</strong> ${loanText} (estimated as purchase price minus down payment)</p>`;
      } else if (hasPrice && hasDown) {
        loanSourceNote = `<p><strong>Loan used:</strong> ${loanText} (your entered loan amount; purchase price and down payment were ignored)</p>`;
      } else {
        loanSourceNote = `<p><strong>Loan used:</strong> ${loanText}</p>`;
      }

      let equityLine = "";
      if (equity >= 0) {
        equityLine = `<p><strong>Estimated equity:</strong> ${equityText}</p>`;
      } else {
        equityLine = `<p><strong>Estimated equity:</strong> ${equityText} (negative equity)</p>`;
      }

      const resultHtml = `
        <p><strong>LTV:</strong> ${ltvText}%</p>
        ${loanSourceNote}
        <p><strong>Property value used:</strong> ${valueText}</p>
        ${equityLine}
        <p><strong>General LTV band:</strong> ${bandLabel}</p>
        <p><strong>Quick targets (same value):</strong><br>
          80% LTV max loan: ${maxLoan80Text}<br>
          90% LTV max loan: ${maxLoan90Text}
        </p>
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
      const message = "Loan-to-Value (LTV) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
