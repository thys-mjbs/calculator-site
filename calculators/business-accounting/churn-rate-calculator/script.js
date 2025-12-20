document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startCustomersInput = document.getElementById("startCustomers");
  const endCustomersInput = document.getElementById("endCustomers");
  const newCustomersInput = document.getElementById("newCustomers");
  const periodMonthsInput = document.getElementById("periodMonths");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(startCustomersInput);
  attachLiveFormatting(endCustomersInput);
  attachLiveFormatting(newCustomersInput);
  attachLiveFormatting(periodMonthsInput);

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
      const startCustomers = toNumber(startCustomersInput ? startCustomersInput.value : "");
      const endCustomers = toNumber(endCustomersInput ? endCustomersInput.value : "");
      const newCustomers = toNumber(newCustomersInput ? newCustomersInput.value : "");
      const periodMonthsRaw = toNumber(periodMonthsInput ? periodMonthsInput.value : "");

      if (!startCustomersInput || !endCustomersInput || !newCustomersInput || !periodMonthsInput) return;

      if (!validatePositive(startCustomers, "customers at start of period")) return;
      if (!validateNonNegative(endCustomers, "customers at end of period")) return;
      if (!validateNonNegative(newCustomers, "new customers acquired")) return;

      let periodMonths = periodMonthsRaw;
      if (!Number.isFinite(periodMonths) || periodMonths <= 0) periodMonths = 1;

      // Core churn math:
      // losses = start - end + new
      // churnRate = losses / start
      let estimatedLostCustomers = startCustomers - endCustomers + newCustomers;

      let noteHtml = "";
      if (estimatedLostCustomers < 0) {
        estimatedLostCustomers = 0;
        noteHtml =
          "<p><strong>Note:</strong> Your inputs imply net growth beyond new customers (for example, reactivations or counting differences). Churn is shown as 0 for this period.</p>";
      }

      const churnRate = (estimatedLostCustomers / startCustomers) * 100;
      const retentionRate = 100 - churnRate;

      const netChange = endCustomers - startCustomers;
      const netChangePct = (netChange / startCustomers) * 100;

      // Equivalent average monthly churn (only meaningful when months > 1)
      let monthlyChurnRate = null;
      if (periodMonths > 1) {
        const totalChurnFraction = churnRate / 100;
        const base = 1 - totalChurnFraction;
        const monthlyFraction = 1 - Math.pow(base < 0 ? 0 : base, 1 / periodMonths);
        monthlyChurnRate = monthlyFraction * 100;
      }

      const lostCustomersDisplay = Math.round(estimatedLostCustomers).toLocaleString();
      const netChangeDisplay = Math.round(netChange).toLocaleString();

      const churnRateDisplay = formatNumberTwoDecimals(churnRate);
      const retentionRateDisplay = formatNumberTwoDecimals(retentionRate);
      const netChangePctDisplay = formatNumberTwoDecimals(netChangePct);

      let monthlyLine = "";
      if (monthlyChurnRate !== null) {
        monthlyLine =
          "<p><strong>Avg monthly churn (equivalent):</strong> " +
          formatNumberTwoDecimals(monthlyChurnRate) +
          "% (over " +
          Math.round(periodMonths).toLocaleString() +
          " months)</p>";
      } else {
        monthlyLine =
          "<p><strong>Period length used:</strong> " +
          Math.round(periodMonths).toLocaleString() +
          " month" +
          (Math.round(periodMonths) === 1 ? "" : "s") +
          "</p>";
      }

      const directionWord = netChange >= 0 ? "growth" : "decline";
      const practicalLine =
        "<p><strong>Practical read:</strong> You had an estimated <strong>" +
        lostCustomersDisplay +
        "</strong> customers leave. Net customer " +
        directionWord +
        " was <strong>" +
        netChangeDisplay +
        "</strong> (" +
        netChangePctDisplay +
        "%) for the period.</p>";

      const resultHtml =
        "<p><strong>Churn rate:</strong> " +
        churnRateDisplay +
        "%</p>" +
        "<p><strong>Retention rate:</strong> " +
        retentionRateDisplay +
        "%</p>" +
        "<p><strong>Estimated customers lost:</strong> " +
        lostCustomersDisplay +
        "</p>" +
        "<p><strong>Net customer change:</strong> " +
        netChangeDisplay +
        "</p>" +
        monthlyLine +
        practicalLine +
        noteHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Churn Rate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});

/* :contentReference[oaicite:2]{index=2} */
