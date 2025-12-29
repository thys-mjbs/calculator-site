document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const baseFareInput = document.getElementById("baseFare");
  const riderCountInput = document.getElementById("riderCount");
  const extraFeesInput = document.getElementById("extraFees");
  const discountInput = document.getElementById("discount");
  const tipPercentInput = document.getElementById("tipPercent");
  const tipAmountInput = document.getElementById("tipAmount");
  const roundToSelect = document.getElementById("roundTo");
  const roundModeSelect = document.getElementById("roundMode");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like inputs
  attachLiveFormatting(baseFareInput);
  attachLiveFormatting(extraFeesInput);
  attachLiveFormatting(discountInput);
  attachLiveFormatting(tipPercentInput);
  attachLiveFormatting(tipAmountInput);
  attachLiveFormatting(riderCountInput);

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

  function roundValue(value, step, mode) {
    if (!Number.isFinite(value)) return value;
    if (!Number.isFinite(step) || step <= 0) return value;

    if (mode === "up") {
      return Math.ceil(value / step) * step;
    }

    return Math.round(value / step) * step;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const baseFare = toNumber(baseFareInput ? baseFareInput.value : "");
      const riderCountRaw = toNumber(riderCountInput ? riderCountInput.value : "");
      const extraFees = toNumber(extraFeesInput ? extraFeesInput.value : "");
      const discount = toNumber(discountInput ? discountInput.value : "");
      const tipPercent = toNumber(tipPercentInput ? tipPercentInput.value : "");
      const tipAmount = toNumber(tipAmountInput ? tipAmountInput.value : "");

      if (!baseFareInput || !riderCountInput) return;

      if (!validatePositive(baseFare, "base fare")) return;

      const riderCount = Math.floor(riderCountRaw);
      if (!Number.isFinite(riderCount) || riderCount <= 0) {
        setResultError("Enter a valid number of people splitting greater than 0.");
        return;
      }
      if (riderCount > 50) {
        setResultError("Enter a realistic number of people splitting (50 or fewer).");
        return;
      }

      if (!validateNonNegative(extraFees, "extra fees")) return;
      if (!validateNonNegative(discount, "discount")) return;

      if (discount > baseFare + extraFees) {
        setResultError("Discount cannot be greater than the fare plus extra fees.");
        return;
      }

      let tip = 0;
      const hasTipAmount = Number.isFinite(tipAmount) && tipAmount > 0;

      if (hasTipAmount) {
        tip = tipAmount;
      } else {
        const hasTipPercent = Number.isFinite(tipPercent) && tipPercent > 0;
        if (hasTipPercent) {
          if (tipPercent > 100) {
            setResultError("Tip percentage should be 100 or less.");
            return;
          }
          tip = ((baseFare + extraFees - discount) * tipPercent) / 100;
        }
      }

      if (!validateNonNegative(tip, "tip")) return;

      const subtotalBeforeTip = baseFare + extraFees - discount;
      const totalTripCost = subtotalBeforeTip + tip;

      if (!Number.isFinite(totalTripCost) || totalTripCost <= 0) {
        setResultError("The final total must be greater than 0. Check your inputs.");
        return;
      }

      const perPersonExact = totalTripCost / riderCount;

      // Rounding (optional)
      const roundToValue = roundToSelect ? roundToSelect.value : "none";
      const roundMode = roundModeSelect ? roundModeSelect.value : "nearest";

      let perPersonRounded = perPersonExact;
      let roundingNote = "";
      let roundingDiff = 0;

      if (roundToValue !== "none") {
        const step = toNumber(roundToValue);
        perPersonRounded = roundValue(perPersonExact, step, roundMode);
        const totalCollected = perPersonRounded * riderCount;
        roundingDiff = totalCollected - totalTripCost;

        const diffLabel =
          roundingDiff > 0
            ? "More than exact total"
            : roundingDiff < 0
              ? "Less than exact total"
              : "No difference";

        roundingNote =
          `<div class="result-row"><span class="result-label">Rounding applied:</span>` +
          `<span class="result-value">${roundMode === "up" ? "Round up" : "Nearest"} to ${step}</span></div>` +
          `<div class="result-row"><span class="result-label">${diffLabel}:</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(Math.abs(roundingDiff))}</span></div>`;
      }

      const resultHtml =
        `<div class="result-grid">` +
          `<div class="result-row"><span class="result-label">Each person pays:</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(perPersonRounded)}</span></div>` +

          `<div class="result-row"><span class="result-label">Exact per-person share:</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(perPersonExact)}</span></div>` +

          `<div class="result-row"><span class="result-label">Final trip total:</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(totalTripCost)}</span></div>` +

          `<div class="result-row"><span class="result-label">Breakdown:</span>` +
          `<span class="result-value"></span></div>` +

          `<div class="result-row"><span class="result-label">Base fare</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(baseFare)}</span></div>` +

          `<div class="result-row"><span class="result-label">Extra fees</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(extraFees)}</span></div>` +

          `<div class="result-row"><span class="result-label">Discount</span>` +
          `<span class="result-value">-${formatNumberTwoDecimals(discount)}</span></div>` +

          `<div class="result-row"><span class="result-label">Tip</span>` +
          `<span class="result-value">${formatNumberTwoDecimals(tip)}</span></div>` +

          (roundingNote ? roundingNote : "") +
        `</div>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Ride-Share Cost Split Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
