document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const cogsInput = document.getElementById("cogsInput");
  const beginningInventoryInput = document.getElementById("beginningInventoryInput");
  const endingInventoryInput = document.getElementById("endingInventoryInput");
  const daysInput = document.getElementById("daysInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used)
  

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
  attachLiveFormatting(cogsInput);
  attachLiveFormatting(beginningInventoryInput);
  attachLiveFormatting(endingInventoryInput);
  attachLiveFormatting(daysInput);

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
      // (No modes)
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      const cogs = toNumber(cogsInput ? cogsInput.value : "");
      const beginningInventory = toNumber(beginningInventoryInput ? beginningInventoryInput.value : "");
      const endingInventory = toNumber(endingInventoryInput ? endingInventoryInput.value : "");
      const daysInPeriod = toNumber(daysInput ? daysInput.value : "");

      // Basic existence guard (optional but recommended)
      if (!cogsInput || !beginningInventoryInput || !endingInventoryInput || !daysInput) return;

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validateNonNegative(cogs, "COGS")) return;
      if (!validateNonNegative(beginningInventory, "beginning inventory")) return;
      if (!validateNonNegative(endingInventory, "ending inventory")) return;
      if (!validatePositive(daysInPeriod, "days in the period")) return;

      const avgInventory = (beginningInventory + endingInventory) / 2;
      if (!validatePositive(avgInventory, "average inventory")) return;

      // Calculation logic
      const turnover = cogs / avgInventory;

      if (!Number.isFinite(turnover) || turnover < 0) {
        setResultError("Enter valid inputs to calculate inventory turnover.");
        return;
      }

      if (turnover === 0) {
        const resultHtmlZero = `
          <p><strong>Average inventory:</strong> ${formatNumberTwoDecimals(avgInventory)}</p>
          <p><strong>Inventory turnover:</strong> 0.00</p>
          <p><strong>Days of inventory on hand:</strong> Not available (turnover is 0)</p>
        `;
        setResultSuccess(resultHtmlZero);
        return;
      }

      const daysOnHand = daysInPeriod / turnover;

      // Build output HTML
      const resultHtml = `
        <p><strong>Average inventory:</strong> ${formatNumberTwoDecimals(avgInventory)}</p>
        <p><strong>Inventory turnover:</strong> ${formatNumberTwoDecimals(turnover)}</p>
        <p><strong>Days of inventory on hand:</strong> ${formatNumberTwoDecimals(daysOnHand)} days</p>
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
      const message = "Inventory Turnover Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
