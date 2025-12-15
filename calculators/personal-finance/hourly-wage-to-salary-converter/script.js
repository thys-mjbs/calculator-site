document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const hourlyWageInput = document.getElementById("hourlyWage");
  const hoursPerWeekInput = document.getElementById("hoursPerWeek");
  const weeksPerYearInput = document.getElementById("weeksPerYear");
  const paidDaysOffInput = document.getElementById("paidDaysOff");
  const unpaidWeeksOffInput = document.getElementById("unpaidWeeksOff");
  const overtimeHoursPerWeekInput = document.getElementById("overtimeHoursPerWeek");
  const overtimeMultiplierInput = document.getElementById("overtimeMultiplier");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)

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
  attachLiveFormatting(hourlyWageInput);
  attachLiveFormatting(hoursPerWeekInput);
  attachLiveFormatting(weeksPerYearInput);
  attachLiveFormatting(paidDaysOffInput);
  attachLiveFormatting(unpaidWeeksOffInput);
  attachLiveFormatting(overtimeHoursPerWeekInput);
  attachLiveFormatting(overtimeMultiplierInput);

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
      const hourlyWage = toNumber(hourlyWageInput ? hourlyWageInput.value : "");

      const hoursPerWeekRaw = toNumber(hoursPerWeekInput ? hoursPerWeekInput.value : "");
      const weeksPerYearRaw = toNumber(weeksPerYearInput ? weeksPerYearInput.value : "");
      const paidDaysOffRaw = toNumber(paidDaysOffInput ? paidDaysOffInput.value : "");
      const unpaidWeeksOffRaw = toNumber(unpaidWeeksOffInput ? unpaidWeeksOffInput.value : "");
      const overtimeHoursPerWeekRaw = toNumber(overtimeHoursPerWeekInput ? overtimeHoursPerWeekInput.value : "");
      const overtimeMultiplierRaw = toNumber(overtimeMultiplierInput ? overtimeMultiplierInput.value : "");

      // Basic existence guard
      if (!hourlyWageInput) return;

      // Validation
      if (!validatePositive(hourlyWage, "hourly wage")) return;

      const hoursPerWeek = Number.isFinite(hoursPerWeekRaw) && hoursPerWeekRaw > 0 ? hoursPerWeekRaw : 40;
      const weeksPerYear = Number.isFinite(weeksPerYearRaw) && weeksPerYearRaw > 0 ? weeksPerYearRaw : 52;

      const paidDaysOff = Number.isFinite(paidDaysOffRaw) && paidDaysOffRaw >= 0 ? paidDaysOffRaw : 0;
      const unpaidWeeksOff = Number.isFinite(unpaidWeeksOffRaw) && unpaidWeeksOffRaw >= 0 ? unpaidWeeksOffRaw : 0;

      const overtimeHoursPerWeek = Number.isFinite(overtimeHoursPerWeekRaw) && overtimeHoursPerWeekRaw >= 0 ? overtimeHoursPerWeekRaw : 0;
      const overtimeMultiplier = Number.isFinite(overtimeMultiplierRaw) && overtimeMultiplierRaw > 0 ? overtimeMultiplierRaw : 1.5;

      if (!validatePositive(hoursPerWeek, "hours per week")) return;
      if (!validatePositive(weeksPerYear, "weeks per year")) return;
      if (!validateNonNegative(paidDaysOff, "paid days off")) return;
      if (!validateNonNegative(unpaidWeeksOff, "unpaid weeks off")) return;
      if (!validateNonNegative(overtimeHoursPerWeek, "overtime hours per week")) return;
      if (!validatePositive(overtimeMultiplier, "overtime multiplier")) return;

      if (hoursPerWeek > 168) {
        setResultError("Hours per week looks too high. Enter a value at or below 168.");
        return;
      }
      if (weeksPerYear > 54) {
        setResultError("Weeks per year looks too high. Enter a value at or below 54.");
        return;
      }
      if (paidDaysOff > 120) {
        setResultError("Paid days off looks too high. Enter a value at or below 120.");
        return;
      }

      // Calculation logic
      const effectivePaidWeeks = Math.max(0, weeksPerYear - unpaidWeeksOff);

      // Paid days off are treated as additional paid days (assumes 5 workdays per week)
      const paidWeeksFromDaysOff = paidDaysOff / 5;

      const baseAnnual = hourlyWage * hoursPerWeek * effectivePaidWeeks;
      const overtimeAnnual = hourlyWage * overtimeMultiplier * overtimeHoursPerWeek * effectivePaidWeeks;

      const annualTotal = baseAnnual + overtimeAnnual + (hourlyWage * hoursPerWeek * paidWeeksFromDaysOff);
      const monthly = annualTotal / 12;
      const weekly = weeksPerYear > 0 ? annualTotal / weeksPerYear : 0;

      const assumedWorkdaysPerWeek = 5;
      const daily = weekly > 0 ? weekly / assumedWorkdaysPerWeek : 0;

      const annualHoursWorked = hoursPerWeek * effectivePaidWeeks + (hoursPerWeek * paidWeeksFromDaysOff);
      const effectiveHourly = annualHoursWorked > 0 ? annualTotal / annualHoursWorked : 0;

      // Build output HTML
      const resultHtml =
        `<p><strong>Estimated annual salary (gross):</strong> ${formatNumberTwoDecimals(annualTotal)}</p>` +
        `<p><strong>Monthly (annual ÷ 12):</strong> ${formatNumberTwoDecimals(monthly)}</p>` +
        `<p><strong>Weekly (annual ÷ weeks):</strong> ${formatNumberTwoDecimals(weekly)}</p>` +
        `<p><strong>Daily (weekly ÷ 5 workdays):</strong> ${formatNumberTwoDecimals(daily)}</p>` +
        `<p><strong>Effective hourly rate (based on your inputs):</strong> ${formatNumberTwoDecimals(effectiveHourly)}</p>` +
        `<p><strong>Assumptions used:</strong> ${hoursPerWeek} hrs/week, ${weeksPerYear} weeks/year, ${paidDaysOff} paid days off, ${unpaidWeeksOff} unpaid weeks off, ${overtimeHoursPerWeek} overtime hrs/week at ${overtimeMultiplier}×.</p>`;

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
      const message = "Hourly Wage to Salary Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
