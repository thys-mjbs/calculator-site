document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const purchasePrice = document.getElementById("purchasePrice");
  const downPayment = document.getElementById("downPayment");

  const estimateMode = document.getElementById("estimateMode");
  const modeQuick = document.getElementById("modeQuick");
  const modeDetailed = document.getElementById("modeDetailed");

  const quickLowPercent = document.getElementById("quickLowPercent");
  const quickHighPercent = document.getElementById("quickHighPercent");

  const lenderPercent = document.getElementById("lenderPercent");
  const titlePercent = document.getElementById("titlePercent");
  const transferTaxPercent = document.getElementById("transferTaxPercent");

  const inspectionFee = document.getElementById("inspectionFee");
  const appraisalFee = document.getElementById("appraisalFee");
  const attorneyFee = document.getElementById("attorneyFee");
  const otherFees = document.getElementById("otherFees");

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
  attachLiveFormatting(purchasePrice);
  attachLiveFormatting(downPayment);
  attachLiveFormatting(inspectionFee);
  attachLiveFormatting(appraisalFee);
  attachLiveFormatting(attorneyFee);
  attachLiveFormatting(otherFees);

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
    if (modeQuick) modeQuick.classList.add("hidden");
    if (modeDetailed) modeDetailed.classList.add("hidden");

    if (mode === "detailed") {
      if (modeDetailed) modeDetailed.classList.remove("hidden");
    } else {
      if (modeQuick) modeQuick.classList.remove("hidden");
    }

    clearResult();
  }

  if (estimateMode) {
    showMode(estimateMode.value);
    estimateMode.addEventListener("change", function () {
      showMode(estimateMode.value);
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

  function clampPercent(pct) {
    if (!Number.isFinite(pct)) return 0;
    if (pct < 0) return 0;
    if (pct > 25) return 25;
    return pct;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = estimateMode ? estimateMode.value : "quick";

      const price = toNumber(purchasePrice ? purchasePrice.value : "");
      const dp = toNumber(downPayment ? downPayment.value : "");

      if (!purchasePrice) return;

      if (!validatePositive(price, "purchase price")) return;

      const downPaymentValue = Number.isFinite(dp) && dp > 0 ? dp : 0;
      if (downPaymentValue > price) {
        setResultError("Down payment cannot be greater than the purchase price.");
        return;
      }

      let resultHtml = "";

      if (mode === "detailed") {
        const lenderPct = clampPercent(toNumber(lenderPercent ? lenderPercent.value : ""));
        const titlePct = clampPercent(toNumber(titlePercent ? titlePercent.value : ""));
        const transferPct = clampPercent(toNumber(transferTaxPercent ? transferTaxPercent.value : ""));

        const inspect = toNumber(inspectionFee ? inspectionFee.value : "");
        const appraisal = toNumber(appraisalFee ? appraisalFee.value : "");
        const attorney = toNumber(attorneyFee ? attorneyFee.value : "");
        const other = toNumber(otherFees ? otherFees.value : "");

        const inspectVal = Number.isFinite(inspect) && inspect > 0 ? inspect : 0;
        const appraisalVal = Number.isFinite(appraisal) && appraisal > 0 ? appraisal : 0;
        const attorneyVal = Number.isFinite(attorney) && attorney > 0 ? attorney : 0;
        const otherVal = Number.isFinite(other) && other > 0 ? other : 0;

        if (!validateNonNegative(inspectVal, "inspection fee")) return;
        if (!validateNonNegative(appraisalVal, "appraisal/valuation fee")) return;
        if (!validateNonNegative(attorneyVal, "attorney/conveyancer fee")) return;
        if (!validateNonNegative(otherVal, "other fixed fees")) return;

        const pctTotal = lenderPct + titlePct + transferPct;
        const pctCost = (pctTotal / 100) * price;
        const fixedCost = inspectVal + appraisalVal + attorneyVal + otherVal;

        const totalClosing = pctCost + fixedCost;
        const cashToClose = downPaymentValue + totalClosing;

        const closingPctOfPrice = (totalClosing / price) * 100;

        resultHtml =
          `<p><strong>Estimated closing costs:</strong> ${formatNumberTwoDecimals(totalClosing)}</p>` +
          `<p><strong>Estimated cash to close:</strong> ${formatNumberTwoDecimals(cashToClose)}</p>` +
          `<p><strong>Closing costs as % of price:</strong> ${formatNumberTwoDecimals(closingPctOfPrice)}%</p>` +
          `<hr>` +
          `<p><strong>Breakdown (estimate):</strong></p>` +
          `<p>Lender + origination (${formatNumberTwoDecimals(lenderPct)}%): ${formatNumberTwoDecimals((lenderPct / 100) * price)}</p>` +
          `<p>Title/admin (${formatNumberTwoDecimals(titlePct)}%): ${formatNumberTwoDecimals((titlePct / 100) * price)}</p>` +
          `<p>Transfer tax/duty (${formatNumberTwoDecimals(transferPct)}%): ${formatNumberTwoDecimals((transferPct / 100) * price)}</p>` +
          `<p>Fixed fees: ${formatNumberTwoDecimals(fixedCost)}</p>` +
          `<p><em>Note:</em> Any blank optional fields were treated as 0.</p>`;
      } else {
        const lowPctRaw = toNumber(quickLowPercent ? quickLowPercent.value : "");
        const highPctRaw = toNumber(quickHighPercent ? quickHighPercent.value : "");

        const lowPct = clampPercent(Number.isFinite(lowPctRaw) && lowPctRaw > 0 ? lowPctRaw : 2);
        const highPct = clampPercent(Number.isFinite(highPctRaw) && highPctRaw > 0 ? highPctRaw : 5);

        if (highPct < lowPct) {
          setResultError("High % must be greater than or equal to Low %.");
          return;
        }

        const lowClosing = (lowPct / 100) * price;
        const highClosing = (highPct / 100) * price;

        const lowCashToClose = downPaymentValue + lowClosing;
        const highCashToClose = downPaymentValue + highClosing;

        const midPct = (lowPct + highPct) / 2;
        const midClosing = (midPct / 100) * price;

        resultHtml =
          `<p><strong>Estimated closing costs range:</strong> ${formatNumberTwoDecimals(lowClosing)} to ${formatNumberTwoDecimals(highClosing)}</p>` +
          `<p><strong>Estimated cash to close range:</strong> ${formatNumberTwoDecimals(lowCashToClose)} to ${formatNumberTwoDecimals(highCashToClose)}</p>` +
          `<p><strong>Midpoint estimate:</strong> ${formatNumberTwoDecimals(midClosing)} (${formatNumberTwoDecimals(midPct)}% of price)</p>` +
          `<p><em>Note:</em> Down payment is optional. If left blank, cash to close equals closing costs only.</p>`;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Closing Costs Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
