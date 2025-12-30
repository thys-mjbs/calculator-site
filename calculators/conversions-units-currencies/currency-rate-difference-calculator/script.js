document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const baseCodeInput = document.getElementById("baseCode");
  const quoteCodeInput = document.getElementById("quoteCode");
  const amountBaseInput = document.getElementById("amountBase");
  const rateAInput = document.getElementById("rateA");
  const rateBInput = document.getElementById("rateB");

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
  attachLiveFormatting(amountBaseInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const amountBase = toNumber(amountBaseInput ? amountBaseInput.value : "");
      const rateA = toNumber(rateAInput ? rateAInput.value : "");
      const rateB = toNumber(rateBInput ? rateBInput.value : "");

      const baseCodeRaw = baseCodeInput ? String(baseCodeInput.value || "") : "";
      const quoteCodeRaw = quoteCodeInput ? String(quoteCodeInput.value || "") : "";
      const baseCode = baseCodeRaw.trim() ? baseCodeRaw.trim().toUpperCase() : "base";
      const quoteCode = quoteCodeRaw.trim() ? quoteCodeRaw.trim().toUpperCase() : "quote";

      // Basic existence guard
      if (!amountBaseInput || !rateAInput || !rateBInput) return;

      // Validation
      if (!validatePositive(amountBase, "amount")) return;
      if (!validatePositive(rateA, "Rate A")) return;
      if (!validatePositive(rateB, "Rate B")) return;

      // Calculation logic
      const betterIsA = rateA > rateB;
      const betterRate = betterIsA ? rateA : rateB;
      const worseRate = betterIsA ? rateB : rateA;

      const receivedA = amountBase * rateA;
      const receivedB = amountBase * rateB;

      const betterReceived = betterIsA ? receivedA : receivedB;
      const worseReceived = betterIsA ? receivedB : receivedA;

      const rateDiffAbs = Math.abs(rateA - rateB);
      const pctAdvantage = ((betterRate - worseRate) / worseRate) * 100;
      const bpsAdvantage = ((betterRate - worseRate) / worseRate) * 10000;

      const moneyDiff = betterReceived - worseReceived;
      const perThousandDiff = (betterRate - worseRate) * 1000;

      const rateAFmt = rateA.toFixed(6);
      const rateBFmt = rateB.toFixed(6);
      const rateDiffFmt = rateDiffAbs.toFixed(6);

      const pctFmt = pctAdvantage.toFixed(2);
      const bpsFmt = bpsAdvantage.toFixed(0);

      const receivedAFmt = formatNumberTwoDecimals(receivedA);
      const receivedBFmt = formatNumberTwoDecimals(receivedB);
      const moneyDiffFmt = formatNumberTwoDecimals(Math.abs(moneyDiff));
      const perThousandFmt = perThousandDiff.toFixed(2);

      const betterLabel = betterIsA ? "Rate A" : "Rate B";
      const worseLabel = betterIsA ? "Rate B" : "Rate A";

      const directionLine = `<p><strong>Assumed direction:</strong> ${baseCode} to ${quoteCode} (rate is ${quoteCode} per 1 ${baseCode}).</p>`;
      const betterLine = `<p><strong>Better rate:</strong> ${betterLabel} (higher is better for receiving more ${quoteCode}).</p>`;

      const receivedBlock =
        `<p><strong>${betterLabel} outcome:</strong> You receive about ${receivedAFmt} ${quoteCode} using Rate A, and ${receivedBFmt} ${quoteCode} using Rate B.</p>`;

      const impactLine =
        `<p><strong>Impact on your amount:</strong> ${betterLabel} gives you about ${moneyDiffFmt} ${quoteCode} ${moneyDiff >= 0 ? "more" : "less"} than ${worseLabel} for this conversion.</p>`;

      const comparisonBlock =
        `<p><strong>Rate difference:</strong> ${rateDiffFmt} ${quoteCode} per 1 ${baseCode}.</p>
         <p><strong>Percent advantage:</strong> ${pctFmt}% (about ${bpsFmt} basis points) better than the worse rate.</p>
         <p><strong>Quick scale:</strong> About ${perThousandFmt} ${quoteCode} difference per 1,000 ${baseCode} converted.</p>`;

      const resultHtml =
        directionLine +
        betterLine +
        receivedBlock +
        impactLine +
        comparisonBlock;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Currency Rate Difference Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
