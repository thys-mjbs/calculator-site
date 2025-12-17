document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  const quantityInput = document.getElementById("quantityInput");
  const cutLengthInput = document.getElementById("cutLengthInput");
  const spliceLengthInput = document.getElementById("spliceLengthInput");

  const totalLengthInput = document.getElementById("totalLengthInput");

  const stockLengthInput = document.getElementById("stockLengthInput");
  const wastePercentInput = document.getElementById("wastePercentInput");

  const modeCutsBlock = document.getElementById("modeCutsBlock");
  const modeTotalBlock = document.getElementById("modeTotalBlock");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(quantityInput);
  attachLiveFormatting(cutLengthInput);
  attachLiveFormatting(spliceLengthInput);
  attachLiveFormatting(totalLengthInput);
  attachLiveFormatting(stockLengthInput);
  attachLiveFormatting(wastePercentInput);

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
    if (modeCutsBlock) modeCutsBlock.classList.add("hidden");
    if (modeTotalBlock) modeTotalBlock.classList.add("hidden");

    if (mode === "total") {
      if (modeTotalBlock) modeTotalBlock.classList.remove("hidden");
    } else {
      if (modeCutsBlock) modeCutsBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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
      const mode = modeSelect ? modeSelect.value : "cuts";

      const quantity = toNumber(quantityInput ? quantityInput.value : "");
      const cutLenM = toNumber(cutLengthInput ? cutLengthInput.value : "");
      const extraPerBarM = toNumber(spliceLengthInput ? spliceLengthInput.value : "");

      const totalRequiredM = toNumber(totalLengthInput ? totalLengthInput.value : "");

      const stockLenMRaw = toNumber(stockLengthInput ? stockLengthInput.value : "");
      const wastePctRaw = toNumber(wastePercentInput ? wastePercentInput.value : "");

      const stockLenM = Number.isFinite(stockLenMRaw) && stockLenMRaw > 0 ? stockLenMRaw : 12;
      const wastePct = Number.isFinite(wastePctRaw) && wastePctRaw >= 0 ? wastePctRaw : 5;

      if (!validatePositive(stockLenM, "stock bar length")) return;
      if (!validateNonNegative(wastePct, "waste allowance percent")) return;

      let baseLengthM = 0;

      if (mode === "total") {
        if (!validatePositive(totalRequiredM, "total required length")) return;
        baseLengthM = totalRequiredM;
      } else {
        if (!validatePositive(quantity, "number of bars")) return;
        if (!validatePositive(cutLenM, "cut length per bar")) return;
        if (!validateNonNegative(extraPerBarM, "extra length per bar")) return;

        baseLengthM = quantity * (cutLenM + extraPerBarM);
      }

      const wasteFactor = 1 + wastePct / 100;
      const lengthWithWasteM = baseLengthM * wasteFactor;

      const barsNeeded = Math.ceil(lengthWithWasteM / stockLenM);
      const purchasedLengthM = barsNeeded * stockLenM;

      const estimatedOffcutM = purchasedLengthM - lengthWithWasteM;
      const effectiveWasteAddedM = lengthWithWasteM - baseLengthM;

      function fmtM(n) {
        return formatNumberTwoDecimals(n) + " m";
      }

      const resultHtml = `
        <p><strong>Total required length (before waste):</strong> ${fmtM(baseLengthM)}</p>
        <p><strong>Waste allowance added:</strong> ${fmtM(effectiveWasteAddedM)} (${formatNumberTwoDecimals(wastePct)}%)</p>
        <p><strong>Total length to plan for (after waste):</strong> ${fmtM(lengthWithWasteM)}</p>
        <p><strong>Stock bar length:</strong> ${fmtM(stockLenM)}</p>
        <p><strong>Estimated stock bars needed:</strong> ${barsNeeded}</p>
        <p><strong>Total stock length purchased:</strong> ${fmtM(purchasedLengthM)}</p>
        <p><strong>Estimated leftover (offcut):</strong> ${fmtM(estimatedOffcutM)}</p>
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
      const message = "Rebar Length Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
