document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const payMode = document.getElementById("payMode");
  const payFrequency = document.getElementById("payFrequency");

  const netPayAmount = document.getElementById("netPayAmount");
  const grossPayAmount = document.getElementById("grossPayAmount");
  const taxRatePercent = document.getElementById("taxRatePercent");

  const paidHoursPerWeek = document.getElementById("paidHoursPerWeek");
  const unpaidOvertimeHoursPerWeek = document.getElementById("unpaidOvertimeHoursPerWeek");
  const commuteHoursPerDay = document.getElementById("commuteHoursPerDay");
  const workDaysPerWeek = document.getElementById("workDaysPerWeek");
  const unpaidBreakMinutesPerDay = document.getElementById("unpaidBreakMinutesPerDay");
  const workExpensesPerMonth = document.getElementById("workExpensesPerMonth");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = payMode;
  const modeBlockA = document.getElementById("modeNetBlock");
  const modeBlockB = document.getElementById("modeGrossBlock");

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
  attachLiveFormatting(netPayAmount);
  attachLiveFormatting(grossPayAmount);
  attachLiveFormatting(taxRatePercent);
  attachLiveFormatting(paidHoursPerWeek);
  attachLiveFormatting(unpaidOvertimeHoursPerWeek);
  attachLiveFormatting(commuteHoursPerDay);
  attachLiveFormatting(workDaysPerWeek);
  attachLiveFormatting(unpaidBreakMinutesPerDay);
  attachLiveFormatting(workExpensesPerMonth);

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
    if (modeBlockA) modeBlockA.classList.add("hidden");
    if (modeBlockB) modeBlockB.classList.add("hidden");

    if (mode === "net") {
      if (modeBlockA) modeBlockA.classList.remove("hidden");
    } else if (mode === "gross") {
      if (modeBlockB) modeBlockB.classList.remove("hidden");
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

  function weeklyFromAmount(amount, frequency) {
    const weeksPerYear = 52;
    const weeksPerMonth = 52 / 12; // 4.333...
    if (!Number.isFinite(amount)) return NaN;

    if (frequency === "hourly") return amount * 40; // placeholder, must be overridden with paidHoursPerWeek
    if (frequency === "weekly") return amount;
    if (frequency === "biweekly") return amount / 2;
    if (frequency === "monthly") return amount / weeksPerMonth;
    if (frequency === "annual") return amount / weeksPerYear;

    return NaN;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "net";
      const frequency = payFrequency ? payFrequency.value : "monthly";

      const paidHrs = toNumber(paidHoursPerWeek ? paidHoursPerWeek.value : "");
      const overtimeHrs = toNumber(unpaidOvertimeHoursPerWeek ? unpaidOvertimeHoursPerWeek.value : "");
      const commuteHrsPerDay = toNumber(commuteHoursPerDay ? commuteHoursPerDay.value : "");
      const daysPerWeek = toNumber(workDaysPerWeek ? workDaysPerWeek.value : "");
      const breakMinsPerDay = toNumber(unpaidBreakMinutesPerDay ? unpaidBreakMinutesPerDay.value : "");
      const expensesPerMonth = toNumber(workExpensesPerMonth ? workExpensesPerMonth.value : "");

      if (!validatePositive(paidHrs, "paid work hours per week")) return;

      const safeOvertime = Number.isFinite(overtimeHrs) ? overtimeHrs : 0;
      const safeCommute = Number.isFinite(commuteHrsPerDay) ? commuteHrsPerDay : 0;
      const safeDays = Number.isFinite(daysPerWeek) && daysPerWeek > 0 ? daysPerWeek : 5;
      const safeBreakMins = Number.isFinite(breakMinsPerDay) ? breakMinsPerDay : 0;
      const safeExpensesMonthly = Number.isFinite(expensesPerMonth) ? expensesPerMonth : 0;

      if (!validateNonNegative(safeOvertime, "unpaid overtime hours per week")) return;
      if (!validateNonNegative(safeCommute, "commute hours per workday")) return;
      if (!validatePositive(safeDays, "workdays per week")) return;
      if (!validateNonNegative(safeBreakMins, "unpaid break minutes per workday")) return;
      if (!validateNonNegative(safeExpensesMonthly, "work-related costs per month")) return;

      let netAmount = NaN;

      if (mode === "net") {
        const netPay = toNumber(netPayAmount ? netPayAmount.value : "");
        if (!validatePositive(netPay, "net pay amount")) return;
        netAmount = netPay;
      } else {
        const grossPay = toNumber(grossPayAmount ? grossPayAmount.value : "");
        const taxPct = toNumber(taxRatePercent ? taxRatePercent.value : "");

        if (!validatePositive(grossPay, "gross pay amount")) return;

        const safeTaxPct = Number.isFinite(taxPct) ? taxPct : 25;
        if (!validateNonNegative(safeTaxPct, "tax rate")) return;
        if (safeTaxPct >= 100) {
          setResultError("Tax rate must be less than 100%.");
          return;
        }

        const taxRate = safeTaxPct / 100;
        netAmount = grossPay * (1 - taxRate);
      }

      // Convert to weekly net pay.
      let netWeekly = weeklyFromAmount(netAmount, frequency);

      // If hourly, use paid hours per week for conversion.
      if (frequency === "hourly") {
        netWeekly = netAmount * paidHrs;
      }

      if (!Number.isFinite(netWeekly) || netWeekly <= 0) {
        setResultError("Enter valid pay details to calculate a weekly amount.");
        return;
      }

      const weeksPerMonth = 52 / 12;
      const weeklyExpenses = safeExpensesMonthly / weeksPerMonth;

      const breakHoursPerWeek = (safeBreakMins / 60) * safeDays;
      const commuteHoursPerWeek = safeCommute * safeDays;

      const effectiveHoursPerWeek = paidHrs + safeOvertime + commuteHoursPerWeek + breakHoursPerWeek;

      if (!validatePositive(effectiveHoursPerWeek, "effective weekly hours")) return;

      const netAfterExpensesWeekly = netWeekly - weeklyExpenses;

      if (!Number.isFinite(netAfterExpensesWeekly)) {
        setResultError("Enter valid work-related costs.");
        return;
      }

      // Real hourly wage (can be negative if expenses exceed pay)
      const realHourly = netAfterExpensesWeekly / effectiveHoursPerWeek;

      // Comparison hourly (based only on paid hours, and before subtracting expenses)
      const simpleHourly = netWeekly / paidHrs;

      const delta = realHourly - simpleHourly;
      const deltaPct = simpleHourly !== 0 ? (delta / simpleHourly) * 100 : NaN;

      const realHourlyFmt = formatNumberTwoDecimals(realHourly);
      const simpleHourlyFmt = formatNumberTwoDecimals(simpleHourly);
      const netWeeklyFmt = formatNumberTwoDecimals(netWeekly);
      const expensesWeeklyFmt = formatNumberTwoDecimals(weeklyExpenses);
      const netAfterExpensesWeeklyFmt = formatNumberTwoDecimals(netAfterExpensesWeekly);
      const effectiveHoursFmt = formatNumberTwoDecimals(effectiveHoursPerWeek);
      const commuteWeeklyFmt = formatNumberTwoDecimals(commuteHoursPerWeek);
      const breakWeeklyFmt = formatNumberTwoDecimals(breakHoursPerWeek);
      const overtimeFmt = formatNumberTwoDecimals(safeOvertime);

      const deltaFmt = formatNumberTwoDecimals(delta);
      const deltaPctFmt = Number.isFinite(deltaPct) ? formatNumberTwoDecimals(deltaPct) : "0.00";

      const notes = [];
      if (mode === "gross") {
        const taxPct = toNumber(taxRatePercent ? taxRatePercent.value : "");
        const safeTaxPct = Number.isFinite(taxPct) ? taxPct : 25;
        notes.push("Using estimated tax rate: " + formatNumberTwoDecimals(safeTaxPct) + "%");
      } else {
        notes.push("Using net (take-home) pay as entered");
      }
      notes.push("Workdays per week assumed: " + formatNumberTwoDecimals(safeDays));

      const resultHtml = `
        <p><strong>Real hourly wage:</strong> ${realHourlyFmt} per hour</p>
        <p><strong>Simple hourly (paid hours only):</strong> ${simpleHourlyFmt} per hour</p>
        <p><strong>Difference:</strong> ${deltaFmt} per hour (${deltaPctFmt}%)</p>
        <hr>
        <p><strong>Net pay (weekly equivalent):</strong> ${netWeeklyFmt}</p>
        <p><strong>Work-related costs (weekly equivalent):</strong> ${expensesWeeklyFmt}</p>
        <p><strong>Net after costs (weekly):</strong> ${netAfterExpensesWeeklyFmt}</p>
        <hr>
        <p><strong>Effective weekly hours:</strong> ${effectiveHoursFmt} hours</p>
        <p>Includes paid hours (${formatNumberTwoDecimals(paidHrs)}), unpaid overtime (${overtimeFmt}), commute (${commuteWeeklyFmt}), unpaid breaks (${breakWeeklyFmt}).</p>
        <p><strong>Assumptions used:</strong> ${notes.join(" | ")}</p>
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
      const message = "Real Hourly Wage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
