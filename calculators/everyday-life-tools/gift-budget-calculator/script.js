document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalBudgetInput = document.getElementById("totalBudget");
  const recipientCountInput = document.getElementById("recipientCount");
  const bufferPercentInput = document.getElementById("bufferPercent");
  const extrasPerGiftInput = document.getElementById("extrasPerGift");
  const alreadySpentInput = document.getElementById("alreadySpent");
  const plannedPerPersonInput = document.getElementById("plannedPerPerson");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(totalBudgetInput);
  attachLiveFormatting(recipientCountInput);
  attachLiveFormatting(bufferPercentInput);
  attachLiveFormatting(extrasPerGiftInput);
  attachLiveFormatting(alreadySpentInput);
  attachLiveFormatting(plannedPerPersonInput);

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
      const totalBudget = toNumber(totalBudgetInput ? totalBudgetInput.value : "");
      const recipientCountRaw = toNumber(recipientCountInput ? recipientCountInput.value : "");
      const bufferPercentRaw = toNumber(bufferPercentInput ? bufferPercentInput.value : "");
      const extrasPerGiftRaw = toNumber(extrasPerGiftInput ? extrasPerGiftInput.value : "");
      const alreadySpentRaw = toNumber(alreadySpentInput ? alreadySpentInput.value : "");
      const plannedPerPersonRaw = toNumber(plannedPerPersonInput ? plannedPerPersonInput.value : "");

      // Existence guard
      if (!totalBudgetInput || !recipientCountInput || !bufferPercentInput) return;

      // Required validations
      if (!validatePositive(totalBudget, "total gift budget")) return;

      // Recipients: must be a whole number > 0
      const recipientCount = Math.floor(recipientCountRaw);
      if (!Number.isFinite(recipientCountRaw) || recipientCountRaw <= 0 || recipientCount !== recipientCountRaw) {
        setResultError("Enter a valid number of recipients as a whole number (1 or more).");
        return;
      }

      // Optional fields: defaults
      const bufferPercent = Number.isFinite(bufferPercentRaw) ? bufferPercentRaw : 10;
      const extrasPerGift = Number.isFinite(extrasPerGiftRaw) ? extrasPerGiftRaw : 0;
      const alreadySpent = Number.isFinite(alreadySpentRaw) ? alreadySpentRaw : 0;

      if (!validateNonNegative(bufferPercent, "buffer percentage")) return;
      if (bufferPercent > 80) {
        setResultError("Your buffer percentage looks unusually high. Enter a buffer between 0% and 80%.");
        return;
      }

      if (!validateNonNegative(extrasPerGift, "extras per gift")) return;
      if (!validateNonNegative(alreadySpent, "already spent amount")) return;

      // Calculation
      const bufferAmount = totalBudget * (bufferPercent / 100);
      const usableAfterBuffer = totalBudget - bufferAmount;

      const extrasTotal = extrasPerGift * recipientCount;
      const availableForGifts = usableAfterBuffer - extrasTotal - alreadySpent;

      if (!Number.isFinite(availableForGifts)) {
        setResultError("Something went wrong with the inputs. Please check your values and try again.");
        return;
      }

      if (availableForGifts < 0) {
        const shortBy = Math.abs(availableForGifts);
        const html = `
          <p><span class="result-highlight">You are already over budget.</span></p>
          <ul class="result-rows">
            <li><strong>Over by:</strong> ${formatNumberTwoDecimals(shortBy)}</li>
            <li><strong>Total budget:</strong> ${formatNumberTwoDecimals(totalBudget)}</li>
            <li><strong>Buffer (${bufferPercent}%):</strong> ${formatNumberTwoDecimals(bufferAmount)}</li>
            <li><strong>Extras total:</strong> ${formatNumberTwoDecimals(extrasTotal)}</li>
            <li><strong>Already spent:</strong> ${formatNumberTwoDecimals(alreadySpent)}</li>
          </ul>
          <p>Reduce extras, reduce the buffer, or increase your total budget to get back to a workable per-person limit.</p>
        `;
        setResultSuccess(html);
        return;
      }

      const perPersonCap = availableForGifts / recipientCount;

      // Optional plan check
      const plannedPerPerson = Number.isFinite(plannedPerPersonRaw) ? plannedPerPersonRaw : null;
      let planHtml = "";
      if (plannedPerPerson !== null && plannedPerPersonInput && plannedPerPersonInput.value.trim() !== "") {
        if (!validateNonNegative(plannedPerPerson, "planned spend per person")) return;

        const projectedGiftSpend = plannedPerPerson * recipientCount;
        const projectedTotal = projectedGiftSpend + extrasTotal + alreadySpent + bufferAmount;
        const delta = totalBudget - projectedTotal;

        if (delta >= 0) {
          planHtml = `
            <p><strong>Plan check:</strong> Your plan fits the budget.</p>
            <ul class="result-rows">
              <li><strong>Projected total spend:</strong> ${formatNumberTwoDecimals(projectedTotal)}</li>
              <li><strong>Budget remaining:</strong> ${formatNumberTwoDecimals(delta)}</li>
            </ul>
          `;
        } else {
          planHtml = `
            <p><strong>Plan check:</strong> Your plan exceeds the budget.</p>
            <ul class="result-rows">
              <li><strong>Projected total spend:</strong> ${formatNumberTwoDecimals(projectedTotal)}</li>
              <li><strong>Over by:</strong> ${formatNumberTwoDecimals(Math.abs(delta))}</li>
            </ul>
          `;
        }
      }

      const resultHtml = `
        <p><span class="result-highlight">Recommended max per person:</span> ${formatNumberTwoDecimals(perPersonCap)}</p>
        <ul class="result-rows">
          <li><strong>Total budget:</strong> ${formatNumberTwoDecimals(totalBudget)}</li>
          <li><strong>Buffer (${bufferPercent}%):</strong> ${formatNumberTwoDecimals(bufferAmount)}</li>
          <li><strong>Extras total (${formatNumberTwoDecimals(extrasPerGift)} × ${recipientCount}):</strong> ${formatNumberTwoDecimals(extrasTotal)}</li>
          <li><strong>Already spent:</strong> ${formatNumberTwoDecimals(alreadySpent)}</li>
          <li><strong>Available for gifts:</strong> ${formatNumberTwoDecimals(availableForGifts)}</li>
        </ul>
        <p>If you spend about ${formatNumberTwoDecimals(perPersonCap)} per person on average (before your buffer), you should stay within your total limit.</p>
        ${planHtml}
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
      const message = "Gift Budget Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
