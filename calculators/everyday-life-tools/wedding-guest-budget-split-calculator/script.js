document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const groupSizeInput = document.getElementById("groupSize");
  const sharedCostsTotalInput = document.getElementById("sharedCostsTotal");
  const giftTotalInput = document.getElementById("giftTotal");
  const personalExtrasPerPersonInput = document.getElementById("personalExtrasPerPerson");
  const bufferPercentInput = document.getElementById("bufferPercent");
  const alreadyPaidPerPersonInput = document.getElementById("alreadyPaidPerPerson");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(groupSizeInput);
  attachLiveFormatting(sharedCostsTotalInput);
  attachLiveFormatting(giftTotalInput);
  attachLiveFormatting(personalExtrasPerPersonInput);
  attachLiveFormatting(bufferPercentInput);
  attachLiveFormatting(alreadyPaidPerPersonInput);

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
      const groupSizeRaw = toNumber(groupSizeInput ? groupSizeInput.value : "");
      const sharedCostsTotal = toNumber(sharedCostsTotalInput ? sharedCostsTotalInput.value : "");
      const giftTotal = toNumber(giftTotalInput ? giftTotalInput.value : "");
      const personalExtrasPerPerson = toNumber(personalExtrasPerPersonInput ? personalExtrasPerPersonInput.value : "");
      const bufferPercentRaw = toNumber(bufferPercentInput ? bufferPercentInput.value : "");
      const alreadyPaidPerPerson = toNumber(alreadyPaidPerPersonInput ? alreadyPaidPerPersonInput.value : "");

      // Existence guard
      if (!groupSizeInput || !sharedCostsTotalInput) return;

      // Validation: group size must be an integer between 1 and 50
      if (!Number.isFinite(groupSizeRaw) || groupSizeRaw <= 0) {
        setResultError("Enter a valid number of people in your group (1 or more).");
        return;
      }

      const groupSize = Math.floor(groupSizeRaw);
      if (groupSize !== groupSizeRaw) {
        setResultError("Enter a whole number for the number of people in your group.");
        return;
      }

      if (groupSize > 50) {
        setResultError("Enter a group size of 50 or less for a practical split.");
        return;
      }

      if (!validateNonNegative(sharedCostsTotal, "shared costs total")) return;
      if (!validateNonNegative(giftTotal, "gift total")) return;
      if (!validateNonNegative(personalExtrasPerPerson, "personal extras per person")) return;
      if (!validateNonNegative(alreadyPaidPerPerson, "already paid per person")) return;

      // Buffer defaults to 10% if blank / not a number
      let bufferPercent = bufferPercentRaw;
      if (!Number.isFinite(bufferPercent)) bufferPercent = 10;

      if (bufferPercent < 0 || bufferPercent > 50) {
        setResultError("Enter a buffer percentage between 0 and 50.");
        return;
      }

      // Require at least one meaningful cost to be entered
      const combinedSignal = sharedCostsTotal + giftTotal + personalExtrasPerPerson;
      if (!Number.isFinite(combinedSignal) || combinedSignal <= 0) {
        setResultError("Enter at least one cost amount (shared costs, gift, or personal extras) to calculate a budget.");
        return;
      }

      // Calculation logic
      const sharedAndGiftTotal = sharedCostsTotal + giftTotal;
      const sharedPerPerson = groupSize > 0 ? (sharedAndGiftTotal / groupSize) : 0;

      const perPersonBeforeBuffer = sharedPerPerson + personalExtrasPerPerson;
      const bufferAmount = perPersonBeforeBuffer * (bufferPercent / 100);
      const recommendedPerPerson = perPersonBeforeBuffer + bufferAmount;

      const remainingPerPerson = recommendedPerPerson - alreadyPaidPerPerson;

      // Build output HTML
      const sharedPerPersonStr = formatNumberTwoDecimals(sharedPerPerson);
      const perPersonBeforeBufferStr = formatNumberTwoDecimals(perPersonBeforeBuffer);
      const bufferAmountStr = formatNumberTwoDecimals(bufferAmount);
      const recommendedPerPersonStr = formatNumberTwoDecimals(recommendedPerPerson);

      const remainingLabel = remainingPerPerson >= 0 ? "Estimated remaining per person" : "Estimated overpaid per person";
      const remainingAbsStr = formatNumberTwoDecimals(Math.abs(remainingPerPerson));

      const resultHtml = `
        <p><strong>Recommended budget per person:</strong> ${recommendedPerPersonStr}</p>
        <p><strong>Shared split per person (shared costs + gift):</strong> ${sharedPerPersonStr}</p>
        <p><strong>Total per person before buffer:</strong> ${perPersonBeforeBufferStr}</p>
        <p><strong>Buffer (${formatNumberTwoDecimals(bufferPercent)}%):</strong> ${bufferAmountStr}</p>
        <p><strong>${remainingLabel}:</strong> ${remainingAbsStr}</p>
        <p style="margin-top:10px; color:#555555;">
          Tip: If one person paid the booking, use “Already paid per person” to estimate what each person should settle up for.
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
      const message = "Wedding Guest Budget Split Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
