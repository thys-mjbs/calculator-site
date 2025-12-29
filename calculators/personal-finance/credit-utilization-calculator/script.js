document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const creditLimitInput = document.getElementById("creditLimit");
  const currentBalanceInput = document.getElementById("currentBalance");
  const targetUtilizationInput = document.getElementById("targetUtilization");
  const plannedPaymentInput = document.getElementById("plannedPayment");

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
  attachLiveFormatting(creditLimitInput);
  attachLiveFormatting(currentBalanceInput);
  attachLiveFormatting(plannedPaymentInput);

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

  function validatePercentRange(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 1 and 100.");
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
      const creditLimit = toNumber(creditLimitInput ? creditLimitInput.value : "");
      const currentBalance = toNumber(currentBalanceInput ? currentBalanceInput.value : "");

      const rawTarget = targetUtilizationInput ? targetUtilizationInput.value : "";
      const targetUtilization = rawTarget && rawTarget.trim() !== "" ? toNumber(rawTarget) : 30;

      const rawPayment = plannedPaymentInput ? plannedPaymentInput.value : "";
      const plannedPayment = rawPayment && rawPayment.trim() !== "" ? toNumber(rawPayment) : 0;

      // Basic existence guard
      if (!creditLimitInput || !currentBalanceInput) return;

      // Validation
      if (!validatePositive(creditLimit, "total credit limit")) return;
      if (!validateNonNegative(currentBalance, "current balance")) return;
      if (!validatePercentRange(targetUtilization, "target utilization")) return;
      if (!validateNonNegative(plannedPayment, "planned payment")) return;

      // Calculation logic
      const utilizationPct = (currentBalance / creditLimit) * 100;

      const targetBalance = (creditLimit * targetUtilization) / 100;
      const payDownNeeded = Math.max(0, currentBalance - targetBalance);

      const newBalanceAfterPayment = Math.max(0, currentBalance - plannedPayment);
      const newUtilizationPct = (newBalanceAfterPayment / creditLimit) * 100;

      const utilizationText = formatNumberTwoDecimals(utilizationPct);
      const newUtilText = formatNumberTwoDecimals(newUtilizationPct);

      const targetBalanceText = formatNumberTwoDecimals(targetBalance);
      const payDownNeededText = formatNumberTwoDecimals(payDownNeeded);
      const newBalanceText = formatNumberTwoDecimals(newBalanceAfterPayment);

      let statusLine = "";
      if (utilizationPct > 100) {
        statusLine = "<p><strong>Status:</strong> Over limit (utilization above 100%).</p>";
      } else if (utilizationPct > targetUtilization) {
        statusLine = "<p><strong>Status:</strong> Above your target utilization.</p>";
      } else {
        statusLine = "<p><strong>Status:</strong> At or below your target utilization.</p>";
      }

      const resultHtml =
        "<p><strong>Current utilization:</strong> " + utilizationText + "%</p>" +
        statusLine +
        "<p><strong>Target utilization:</strong> " + formatNumberTwoDecimals(targetUtilization) + "%</p>" +
        "<p><strong>Max balance to stay at target:</strong> " + targetBalanceText + "</p>" +
        "<p><strong>Payment needed to reach target:</strong> " + payDownNeededText + "</p>" +
        "<hr>" +
        "<p><strong>Utilization after planned payment:</strong> " + newUtilText + "%</p>" +
        "<p><strong>Balance after planned payment:</strong> " + newBalanceText + "</p>" +
        "<p><small>Note: This calculator only uses balances and limits. It does not estimate your credit score or interest.</small></p>";

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
      const message = "Credit Utilization Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
