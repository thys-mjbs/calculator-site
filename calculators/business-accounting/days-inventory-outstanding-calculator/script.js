document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const beginningInventoryInput = document.getElementById("beginningInventory");
  const endingInventoryInput = document.getElementById("endingInventory");
  const cogsInput = document.getElementById("cogs");
  const periodDaysInput = document.getElementById("periodDays");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Example:
  // const modeSelect = document.getElementById("modeSelect");
  // const modeBlockA = document.getElementById("modeBlockA");
  // const modeBlockB = document.getElementById("modeBlockB");

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
  attachLiveFormatting(beginningInventoryInput);
  attachLiveFormatting(endingInventoryInput);
  attachLiveFormatting(cogsInput);
  attachLiveFormatting(periodDaysInput);

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
      const beginningInventory = toNumber(beginningInventoryInput ? beginningInventoryInput.value : "");
      const endingInventory = toNumber(endingInventoryInput ? endingInventoryInput.value : "");
      const cogs = toNumber(cogsInput ? cogsInput.value : "");
      const periodDays = toNumber(periodDaysInput ? periodDaysInput.value : "");

      // Basic existence guard
      if (!beginningInventoryInput || !endingInventoryInput || !cogsInput || !periodDaysInput) return;

      // Validation
      if (!validateNonNegative(beginningInventory, "beginning inventory")) return;
      if (!validateNonNegative(endingInventory, "ending inventory")) return;
      if (!validatePositive(cogs, "COGS")) return;
      if (!validatePositive(periodDays, "period length (days)")) return;

      // Calculation logic
      const averageInventory = (beginningInventory + endingInventory) / 2;
      const dio = (averageInventory / cogs) * periodDays;

      // Build output HTML
      const averageInventoryFormatted = formatNumberTwoDecimals(averageInventory);
      const dioFormatted = formatNumberTwoDecimals(dio);

      const resultHtml =
        `<p><strong>Days Inventory Outstanding (DIO):</strong> ${dioFormatted} days</p>` +
        `<p><strong>Average inventory used:</strong> ${averageInventoryFormatted}</p>` +
        `<p>Formula: (Average Inventory ÷ COGS) × Period Days</p>`;

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
      const message = "Days Inventory Outstanding Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
