document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startingMrrInput = document.getElementById("startingMrr");
  const churnedMrrInput = document.getElementById("churnedMrr");
  const contractionMrrInput = document.getElementById("contractionMrr");
  const expansionMrrInput = document.getElementById("expansionMrr");
  const newMrrInput = document.getElementById("newMrr");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(startingMrrInput);
  attachLiveFormatting(churnedMrrInput);
  attachLiveFormatting(contractionMrrInput);
  attachLiveFormatting(expansionMrrInput);
  attachLiveFormatting(newMrrInput);

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
      const startingMrr = toNumber(startingMrrInput ? startingMrrInput.value : "");
      const churnedMrr = toNumber(churnedMrrInput ? churnedMrrInput.value : "");
      const contractionMrr = toNumber(contractionMrrInput ? contractionMrrInput.value : "");
      const expansionMrr = toNumber(expansionMrrInput ? expansionMrrInput.value : "");
      const newMrr = toNumber(newMrrInput ? newMrrInput.value : "");

      // Basic existence guard
      if (!startingMrrInput || !churnedMrrInput || !contractionMrrInput) return;

      // Validation
      if (!validatePositive(startingMrr, "Starting MRR")) return;
      if (!validateNonNegative(churnedMrr, "Churned MRR")) return;
      if (!validateNonNegative(contractionMrr, "Contraction MRR")) return;

      const safeExpansion = Number.isFinite(expansionMrr) ? Math.max(0, expansionMrr) : 0;
      const safeNew = Number.isFinite(newMrr) ? Math.max(0, newMrr) : 0;

      // Calculation logic
      const grossLoss = churnedMrr + contractionMrr; // existing base loss
      const netLoss = grossLoss - safeExpansion; // can be negative

      const grossChurnRate = grossLoss / startingMrr; // decimal
      const netChurnRate = netLoss / startingMrr; // decimal

      const grossRetention = 1 - grossChurnRate;
      const netRevenueRetention = 1 - netChurnRate;

      const mrrAfterGrossChurn = startingMrr - grossLoss;
      const endingMrr = startingMrr - grossLoss + safeExpansion + safeNew;

      // 12-month simple retention estimate using gross churn as the decay rate (bounded)
      const boundedGross = Math.min(Math.max(grossChurnRate, 0), 0.999999);
      const retention12 = Math.pow(1 - boundedGross, 12);

      // Formatting
      const fmtMoney = (n) => formatNumberTwoDecimals(n);
      const fmtPct = (d) => formatNumberTwoDecimals(d * 100) + "%";

      const notes = [];
      if (grossLoss > startingMrr) {
        notes.push("Your churned plus contraction MRR is higher than starting MRR. This can happen with timing or reporting mismatches, but double-check the inputs.");
      }
      if (safeExpansion === 0) {
        notes.push("Expansion MRR is treated as 0. Net churn equals gross churn unless you add expansion.");
      }
      if (safeNew === 0) {
        notes.push("New MRR is treated as 0. Ending MRR reflects only churn, contraction, and expansion.");
      }

      const notesHtml = notes.length
        ? `<p><strong>Notes:</strong></p><ul>${notes.map((n) => `<li>${n}</li>`).join("")}</ul>`
        : "";

      // Build output HTML
      const resultHtml = `
        <p><strong>Gross MRR churn rate:</strong> ${fmtPct(grossChurnRate)}</p>
        <p><strong>Net MRR churn rate:</strong> ${fmtPct(netChurnRate)}</p>
        <p><strong>Gross retention:</strong> ${fmtPct(grossRetention)}</p>
        <p><strong>Net revenue retention (NRR):</strong> ${fmtPct(netRevenueRetention)}</p>
        <hr>
        <p><strong>Gross MRR lost (churn + contraction):</strong> ${fmtMoney(grossLoss)}</p>
        <p><strong>MRR after churn (before expansion and new):</strong> ${fmtMoney(mrrAfterGrossChurn)}</p>
        <p><strong>Estimated ending MRR:</strong> ${fmtMoney(endingMrr)}</p>
        <hr>
        <p><strong>Simple 12-month retention estimate (using gross churn):</strong> ${fmtPct(retention12)}</p>
        ${notesHtml}
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
      const message = "MRR Churn Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
