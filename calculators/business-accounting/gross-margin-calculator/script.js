document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  // Replace these bindings per calculator or add more as needed.
  // Example:
  // const inputA = document.getElementById("inputA");
  // const inputB = document.getElementById("inputB");
  const revenueInput = document.getElementById("revenueInput");
  const cogsInput = document.getElementById("cogsInput");

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
  // Example:
  // attachLiveFormatting(inputA);
  // attachLiveFormatting(inputB);
  attachLiveFormatting(revenueInput);
  attachLiveFormatting(cogsInput);

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
  // If your calculator has multiple modes, implement showMode() and hook it up.
  // If not used, leave the placeholders empty and do nothing.
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
      // Optional: if you have modes, read it here:

      // Parse inputs using toNumber() (from /scripts/main.js)
      const revenue = toNumber(revenueInput ? revenueInput.value : "");
      const cogs = toNumber(cogsInput ? cogsInput.value : "");

      // Basic existence guard (optional but recommended)
      if (!revenueInput || !cogsInput) return;

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validatePositive(revenue, "revenue")) return;
      if (!validateNonNegative(cogs, "COGS")) return;

      // Calculation logic
      const grossProfit = revenue - cogs;
      const grossMarginPct = (grossProfit / revenue) * 100;
      const markupPct = cogs === 0 ? (grossProfit === 0 ? 0 : Infinity) : (grossProfit / cogs) * 100;

      // Build output HTML
      const revenueFmt = formatNumberTwoDecimals(revenue);
      const cogsFmt = formatNumberTwoDecimals(cogs);
      const grossProfitFmt = formatNumberTwoDecimals(grossProfit);
      const grossMarginFmt = Number.isFinite(grossMarginPct) ? formatNumberTwoDecimals(grossMarginPct) : "0.00";

      let markupDisplay = "";
      if (markupPct === Infinity) {
        markupDisplay = "∞";
      } else {
        markupDisplay = formatNumberTwoDecimals(markupPct) + "%";
      }

      const warning =
        cogs > revenue
          ? `<p><strong>Note:</strong> Your COGS is higher than revenue, so gross profit and gross margin are negative.</p>`
          : "";

      const resultHtml = `
        <p><strong>Revenue:</strong> ${revenueFmt}</p>
        <p><strong>COGS:</strong> ${cogsFmt}</p>
        <p><strong>Gross profit:</strong> ${grossProfitFmt}</p>
        <p><strong>Gross margin:</strong> ${grossMarginFmt}%</p>
        <p><strong>Markup:</strong> ${markupDisplay}</p>
        ${warning}
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
      const message = "Gross Margin Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
