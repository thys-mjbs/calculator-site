document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const apEnding = document.getElementById("apEnding");
  const basisAmount = document.getElementById("basisAmount");
  const basisType = document.getElementById("basisType");
  const periodDays = document.getElementById("periodDays");
  const apBeginning = document.getElementById("apBeginning");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(apEnding);
  attachLiveFormatting(basisAmount);
  attachLiveFormatting(periodDays);
  attachLiveFormatting(apBeginning);

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

  function isProvided(inputEl) {
    if (!inputEl) return false;
    const raw = (inputEl.value || "").trim();
    return raw.length > 0;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const apEndingVal = toNumber(apEnding ? apEnding.value : "");
      const basisAmountVal = toNumber(basisAmount ? basisAmount.value : "");
      const periodDaysValRaw = toNumber(periodDays ? periodDays.value : "");
      const apBeginningVal = toNumber(apBeginning ? apBeginning.value : "");

      // Basic existence guard
      if (!apEnding || !basisAmount || !basisType || !periodDays || !apBeginning) return;

      // Required validations
      if (!validatePositive(apEndingVal, "accounts payable (ending)")) return;
      if (!validatePositive(basisAmountVal, "annual amount")) return;

      // Optional period days (default 365)
      let daysInPeriod = 365;
      if (isProvided(periodDays)) {
        if (!validatePositive(periodDaysValRaw, "period length (days)")) return;
        daysInPeriod = periodDaysValRaw;
      }

      // Optional beginning AP
      let avgAp = apEndingVal;
      let usedAverage = false;
      if (isProvided(apBeginning)) {
        if (!validateNonNegative(apBeginningVal, "accounts payable (beginning)")) return;
        avgAp = (apBeginningVal + apEndingVal) / 2;
        usedAverage = true;
      }

      // Prevent divide-by-zero via validations, but guard anyway
      const dailyCost = basisAmountVal / daysInPeriod;
      if (!Number.isFinite(dailyCost) || dailyCost <= 0) {
        setResultError("Enter values that produce a valid daily cost (annual amount and period days).");
        return;
      }

      // Accounts payable days (DPO estimate)
      const apDays = avgAp / dailyCost;

      // Payables turnover (times per period)
      const turnover = basisAmountVal / (avgAp > 0 ? avgAp : 1);

      const basisLabel = basisType.value === "purchases" ? "Purchases" : "COGS";

      // Practical interpretation banding (lightweight, non-prescriptive)
      let interpretation = "";
      if (apDays < 15) {
        interpretation = "This suggests you pay suppliers relatively quickly. If supplier terms are longer, you may be paying early (sometimes intentional).";
      } else if (apDays <= 45) {
        interpretation = "This is a common range for many businesses, but the right number depends on your supplier terms and industry.";
      } else {
        interpretation = "This suggests you take longer to pay suppliers. That can support cash flow, but it can also increase supplier risk if it is caused by payment delays.";
      }

      const apDaysRounded = formatNumberTwoDecimals(apDays);
      const turnoverRounded = formatNumberTwoDecimals(turnover);
      const avgApFormatted = formatNumberTwoDecimals(avgAp);
      const dailyCostFormatted = formatNumberTwoDecimals(dailyCost);

      const assumptionLine = usedAverage
        ? "Using average payables based on beginning and ending balances."
        : "Using ending payables as an estimate (no beginning balance provided).";

      const resultHtml = `
        <p><strong>Accounts payable days (DPO):</strong> ${apDaysRounded} days</p>
        <p><strong>Payables turnover:</strong> ${turnoverRounded} times per period</p>
        <p><strong>Daily ${basisLabel}:</strong> ${dailyCostFormatted} per day (based on ${formatNumberTwoDecimals(daysInPeriod)} days)</p>
        <p><strong>Payables used:</strong> ${avgApFormatted} (${assumptionLine})</p>
        <p><strong>What this means:</strong> ${interpretation}</p>
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
      const message = "Accounts Payable Days Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
