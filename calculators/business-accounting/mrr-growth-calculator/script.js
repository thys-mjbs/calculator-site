document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startMrrInput = document.getElementById("startMrr");
  const endMrrInput = document.getElementById("endMrr");
  const monthsInput = document.getElementById("months");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(startMrrInput);
  attachLiveFormatting(endMrrInput);
  attachLiveFormatting(monthsInput);

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
      const startMrr = toNumber(startMrrInput ? startMrrInput.value : "");
      const endMrr = toNumber(endMrrInput ? endMrrInput.value : "");
      const monthsRaw = toNumber(monthsInput ? monthsInput.value : "");

      // Basic existence guard
      if (!startMrrInput || !endMrrInput || !monthsInput) return;

      // Defaults and validation
      const months = Number.isFinite(monthsRaw) && monthsRaw > 0 ? monthsRaw : 1;

      if (!validatePositive(startMrr, "Starting MRR")) return;
      if (!validateNonNegative(endMrr, "Ending MRR")) return;

      if (!Number.isFinite(months) || months <= 0) {
        setResultError("Enter a valid period length in months (1 or higher).");
        return;
      }

      // Calculation logic
      const netChange = endMrr - startMrr;
      const growthRate = (netChange / startMrr) * 100;

      // CMGR only meaningful when months > 1 and endMrr >= 0
      let cmgr = null;
      if (months > 1) {
        if (endMrr === 0) {
          cmgr = -100;
        } else {
          cmgr = (Math.pow(endMrr / startMrr, 1 / months) - 1) * 100;
        }
      }

      const impliedArrChange = netChange * 12;

      // Output formatting
      const netChangeAbs = Math.abs(netChange);
      const netChangeLabel = netChange >= 0 ? "Increase" : "Decrease";

      const growthLabel = growthRate >= 0 ? "Growth" : "Decline";
      const growthAbs = Math.abs(growthRate);

      const arrLabel = impliedArrChange >= 0 ? "Implied ARR increase" : "Implied ARR decrease";
      const arrAbs = Math.abs(impliedArrChange);

      const startMrrFmt = formatNumberTwoDecimals(startMrr);
      const endMrrFmt = formatNumberTwoDecimals(endMrr);
      const netChangeFmt = formatNumberTwoDecimals(netChangeAbs);
      const growthFmt = formatNumberTwoDecimals(growthAbs);
      const arrFmt = formatNumberTwoDecimals(arrAbs);

      const cmgrHtml =
        months > 1
          ? `<p><strong>Compound monthly growth (CMGR):</strong> ${formatNumberTwoDecimals(Math.abs(cmgr))}% ${
              cmgr >= 0 ? "per month" : "decline per month"
            }</p>`
          : "";

      const resultHtml = `
        <p><strong>${growthLabel} rate:</strong> ${growthFmt}%</p>
        <p><strong>Starting MRR:</strong> ${startMrrFmt}</p>
        <p><strong>Ending MRR:</strong> ${endMrrFmt}</p>
        <p><strong>Net MRR change:</strong> ${netChangeLabel} of ${netChangeFmt}</p>
        ${cmgrHtml}
        <p><strong>${arrLabel} (run-rate):</strong> ${arrFmt}</p>
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
      const message = "MRR Growth Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
