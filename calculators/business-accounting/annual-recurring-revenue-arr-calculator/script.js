document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const mrrInput = document.getElementById("mrr");
  const customersInput = document.getElementById("customers");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used in this calculator)

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
  attachLiveFormatting(mrrInput);
  attachLiveFormatting(customersInput);

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
      const mrr = toNumber(mrrInput ? mrrInput.value : "");
      const customers = toNumber(customersInput ? customersInput.value : "");

      // Basic existence guard
      if (!mrrInput || !customersInput || !resultDiv) return;

      // Validation
      if (!validatePositive(mrr, "Monthly Recurring Revenue (MRR)")) return;

      const customersProvided = Number.isFinite(customers) && customersInput.value.trim() !== "";
      if (customersProvided) {
        if (!validatePositive(customers, "active customers")) return;
      } else {
        // If blank, treat as not provided (do not error)
        if (!validateNonNegative(toNumber(customersInput.value || "0"), "active customers")) return;
      }

      // Calculation logic (run-rate)
      const arr = mrr * 12;
      const quarterly = mrr * 3;
      const daily = arr / 365;

      // Optional per-customer figures
      let mrrPerCustomer = null;
      let arrPerCustomer = null;
      if (customersProvided) {
        mrrPerCustomer = mrr / customers;
        arrPerCustomer = arr / customers;
      }

      // Build output HTML
      let resultHtml = "";
      resultHtml += `<p><strong>ARR (Annual Recurring Revenue):</strong> ${formatNumberTwoDecimals(arr)}</p>`;
      resultHtml += `<p><strong>Quarterly run-rate:</strong> ${formatNumberTwoDecimals(quarterly)}</p>`;
      resultHtml += `<p><strong>Daily run-rate:</strong> ${formatNumberTwoDecimals(daily)} per day</p>`;

      if (customersProvided) {
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>MRR per customer (average):</strong> ${formatNumberTwoDecimals(mrrPerCustomer)} per month</p>`;
        resultHtml += `<p><strong>ARR per customer (average):</strong> ${formatNumberTwoDecimals(arrPerCustomer)} per year</p>`;
      } else {
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Optional:</strong> Add active customers to see average revenue per customer.</p>`;
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
      const message = "Annual Recurring Revenue (ARR) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
