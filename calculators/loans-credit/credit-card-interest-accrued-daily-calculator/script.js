document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const balanceInput = document.getElementById("balance");
  const aprInput = document.getElementById("apr");
  const daysInput = document.getElementById("days");
  const dayBasisSelect = document.getElementById("dayBasis");

  const paymentAmountInput = document.getElementById("paymentAmount");
  const paymentDayInput = document.getElementById("paymentDay");

  const chargeAmountInput = document.getElementById("chargeAmount");
  const chargeDayInput = document.getElementById("chargeDay");

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
  attachLiveFormatting(balanceInput);
  attachLiveFormatting(aprInput);
  attachLiveFormatting(daysInput);
  attachLiveFormatting(paymentAmountInput);
  attachLiveFormatting(paymentDayInput);
  attachLiveFormatting(chargeAmountInput);
  attachLiveFormatting(chargeDayInput);

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

  function clampToRangeInt(value, min, max) {
    if (!Number.isFinite(value)) return null;
    const v = Math.floor(value);
    if (v < min || v > max) return null;
    return v;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const balance = toNumber(balanceInput ? balanceInput.value : "");
      const aprPercent = toNumber(aprInput ? aprInput.value : "");
      const days = toNumber(daysInput ? daysInput.value : "");

      const basis = dayBasisSelect ? toNumber(dayBasisSelect.value) : 365;

      const paymentAmountRaw = toNumber(paymentAmountInput ? paymentAmountInput.value : "");
      const paymentDayRaw = toNumber(paymentDayInput ? paymentDayInput.value : "");

      const chargeAmountRaw = toNumber(chargeAmountInput ? chargeAmountInput.value : "");
      const chargeDayRaw = toNumber(chargeDayInput ? chargeDayInput.value : "");

      // Basic existence guard
      if (!balanceInput || !aprInput || !daysInput || !dayBasisSelect) return;

      // Validation
      if (!validatePositive(balance, "current balance")) return;
      if (!validatePositive(aprPercent, "APR")) return;
      if (!validatePositive(days, "number of days")) return;

      const daysInt = clampToRangeInt(days, 1, 3650);
      if (daysInt === null) {
        setResultError("Enter a valid number of days between 1 and 3,650.");
        return;
      }

      if (!(basis === 360 || basis === 365)) {
        setResultError("Select a valid day basis (360 or 365).");
        return;
      }

      const apr = aprPercent / 100;
      const dailyRate = apr / basis;

      // Optional inputs: treat blanks as not provided
      const paymentAmount = Number.isFinite(paymentAmountRaw) ? paymentAmountRaw : NaN;
      const chargeAmount = Number.isFinite(chargeAmountRaw) ? chargeAmountRaw : NaN;

      const hasPaymentAmount = Number.isFinite(paymentAmount) && paymentAmount > 0;
      const hasChargeAmount = Number.isFinite(chargeAmount) && chargeAmount > 0;

      const paymentDay = hasPaymentAmount ? clampToRangeInt(paymentDayRaw, 1, daysInt) : null;
      const chargeDay = hasChargeAmount ? clampToRangeInt(chargeDayRaw, 1, daysInt) : null;

      if (hasPaymentAmount && paymentDay === null) {
        setResultError("If you enter a payment amount, enter a payment day between 1 and " + daysInt + ".");
        return;
      }

      if (hasChargeAmount && chargeDay === null) {
        setResultError("If you enter a charge amount, enter a charge day between 1 and " + daysInt + ".");
        return;
      }

      // Guard against unrealistic APR
      if (aprPercent > 200) {
        setResultError("APR above 200% is unusual. Enter a realistic APR for a credit card.");
        return;
      }

      // Calculation logic
      // Quick estimate (no events): daily compounding on constant balance
      const interestNoEvents = balance * (Math.pow(1 + dailyRate, daysInt) - 1);
      const endBalanceNoEvents = balance + interestNoEvents;

      // With optional one-time payment and optional one-time charge:
      // We model balance changes at the start of their day and compound daily.
      let bal = balance;
      let interestAccrued = 0;

      for (let day = 1; day <= daysInt; day++) {
        if (hasChargeAmount && chargeDay === day) {
          bal += chargeAmount;
        }

        if (hasPaymentAmount && paymentDay === day) {
          bal -= paymentAmount;
          if (bal < 0) bal = 0;
        }

        const interestForDay = bal * dailyRate;
        interestAccrued += interestForDay;
        bal += interestForDay;
      }

      const endBalanceWithEvents = bal;

      const usedEvents = (hasPaymentAmount && paymentDay !== null) || (hasChargeAmount && chargeDay !== null);
      const interestUsed = usedEvents ? interestAccrued : interestNoEvents;
      const endBalanceUsed = usedEvents ? endBalanceWithEvents : endBalanceNoEvents;

      const interestPerDayApprox = interestUsed / daysInt;
      const effectiveRateForPeriod = balance > 0 ? (interestUsed / balance) : 0;

      const deltaInterest = interestNoEvents - interestUsed;

      // Build output HTML
      const balanceFmt = formatNumberTwoDecimals(balance);
      const aprFmt = formatNumberTwoDecimals(aprPercent);
      const dailyRatePct = dailyRate * 100;

      let scenarioLine = "<p><strong>Scenario:</strong> Constant balance estimate (no payment or charge applied).</p>";
      if (usedEvents) {
        const parts = [];
        if (hasChargeAmount && chargeDay !== null) {
          parts.push("New charge of " + formatNumberTwoDecimals(chargeAmount) + " on day " + chargeDay);
        }
        if (hasPaymentAmount && paymentDay !== null) {
          parts.push("Payment of " + formatNumberTwoDecimals(paymentAmount) + " on day " + paymentDay);
        }
        scenarioLine = "<p><strong>Scenario applied:</strong> " + parts.join(". ") + ".</p>";
      }

      const savingsLine = usedEvents
        ? "<p><strong>Difference vs constant-balance estimate:</strong> " +
          (deltaInterest >= 0
            ? "Lower interest by " + formatNumberTwoDecimals(deltaInterest) + " (timing reduced interest)."
            : "Higher interest by " + formatNumberTwoDecimals(Math.abs(deltaInterest)) + " (timing increased interest).") +
          "</p>"
        : "<p><strong>Tip:</strong> Add an optional payment day or charge day to see how timing changes interest.</p>";

      const resultHtml =
        "<p><strong>Interest accrued over " + daysInt + " days:</strong> " + formatNumberTwoDecimals(interestUsed) + "</p>" +
        "<p><strong>Estimated ending balance:</strong> " + formatNumberTwoDecimals(endBalanceUsed) + "</p>" +
        "<p><strong>Daily periodic rate:</strong> " + formatNumberTwoDecimals(dailyRatePct) + "% per day (APR " + aprFmt + "%, basis " + basis + ")</p>" +
        "<p><strong>Average interest per day:</strong> " + formatNumberTwoDecimals(interestPerDayApprox) + "</p>" +
        "<p><strong>Interest as a percent of starting balance:</strong> " + formatNumberTwoDecimals(effectiveRateForPeriod * 100) + "%</p>" +
        scenarioLine +
        savingsLine +
        "<hr>" +
        "<p><strong>Constant-balance comparison:</strong> If the balance stayed at " + balanceFmt + " with no payment or new charge, interest would be about " +
        formatNumberTwoDecimals(interestNoEvents) + " and the ending balance about " + formatNumberTwoDecimals(endBalanceNoEvents) + ".</p>";

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
      const message = "Credit Card Interest Accrued Daily Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
