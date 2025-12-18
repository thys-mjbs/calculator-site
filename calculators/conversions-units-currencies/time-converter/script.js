document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const timeValue = document.getElementById("timeValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const monthDays = document.getElementById("monthDays");
  const yearDays = document.getElementById("yearDays");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  

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
  attachLiveFormatting(timeValue);
  attachLiveFormatting(monthDays);
  attachLiveFormatting(yearDays);

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
  function unitLabel(unit) {
    switch (unit) {
      case "second": return "seconds";
      case "minute": return "minutes";
      case "hour": return "hours";
      case "day": return "days";
      case "week": return "weeks";
      case "month": return "months";
      case "year": return "years";
      default: return "units";
    }
  }

  function toSeconds(value, unit, daysPerMonth, daysPerYear) {
    const secPerMinute = 60;
    const secPerHour = 60 * secPerMinute;
    const secPerDay = 24 * secPerHour;
    const secPerWeek = 7 * secPerDay;

    if (unit === "second") return value;
    if (unit === "minute") return value * secPerMinute;
    if (unit === "hour") return value * secPerHour;
    if (unit === "day") return value * secPerDay;
    if (unit === "week") return value * secPerWeek;

    if (unit === "month") return value * daysPerMonth * secPerDay;
    if (unit === "year") return value * daysPerYear * secPerDay;

    return NaN;
  }

  function fromSeconds(seconds, unit, daysPerMonth, daysPerYear) {
    const secPerMinute = 60;
    const secPerHour = 60 * secPerMinute;
    const secPerDay = 24 * secPerHour;
    const secPerWeek = 7 * secPerDay;

    if (unit === "second") return seconds;
    if (unit === "minute") return seconds / secPerMinute;
    if (unit === "hour") return seconds / secPerHour;
    if (unit === "day") return seconds / secPerDay;
    if (unit === "week") return seconds / secPerWeek;

    if (unit === "month") return seconds / (daysPerMonth * secPerDay);
    if (unit === "year") return seconds / (daysPerYear * secPerDay);

    return NaN;
  }

  function breakdownFromSeconds(totalSeconds) {
    const sec = Math.max(0, totalSeconds);
    const whole = Math.floor(sec);

    const days = Math.floor(whole / 86400);
    const remAfterDays = whole - days * 86400;

    const hours = Math.floor(remAfterDays / 3600);
    const remAfterHours = remAfterDays - hours * 3600;

    const minutes = Math.floor(remAfterHours / 60);
    const seconds = remAfterHours - minutes * 60;

    return { days, hours, minutes, seconds };
  }

  function formatSmart(value) {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs === 0) return "0";
    if (abs >= 1 && abs < 1e9) return formatNumberTwoDecimals(value);
    if (abs < 1) return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    return value.toExponential(6);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Optional: if you have modes, read it here:
      
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      const value = toNumber(timeValue ? timeValue.value : "");
      const mdRaw = toNumber(monthDays ? monthDays.value : "");
      const ydRaw = toNumber(yearDays ? yearDays.value : "");

      const daysPerMonthDefault = 30.4375;
      const daysPerYearDefault = 365.2425;

      const daysPerMonth = Number.isFinite(mdRaw) && mdRaw > 0 ? mdRaw : daysPerMonthDefault;
      const daysPerYear = Number.isFinite(ydRaw) && ydRaw > 0 ? ydRaw : daysPerYearDefault;

      // Basic existence guard (optional but recommended)
      if (!timeValue || !fromUnit || !toUnit) return;

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validateNonNegative(value, "time value")) return;

      // If user typed something invalid into advanced fields, explain but still allow defaults.
      if (monthDays && monthDays.value.trim() !== "" && (!Number.isFinite(mdRaw) || mdRaw <= 0)) {
        setResultError("Days per month must be a valid number greater than 0, or leave it as the default.");
        return;
      }
      if (yearDays && yearDays.value.trim() !== "" && (!Number.isFinite(ydRaw) || ydRaw <= 0)) {
        setResultError("Days per year must be a valid number greater than 0, or leave it as the default.");
        return;
      }

      const from = fromUnit.value;
      const to = toUnit.value;

      // Calculation logic
      const secondsTotal = toSeconds(value, from, daysPerMonth, daysPerYear);
      if (!Number.isFinite(secondsTotal)) {
        setResultError("Enter a valid conversion selection.");
        return;
      }

      const converted = fromSeconds(secondsTotal, to, daysPerMonth, daysPerYear);
      if (!Number.isFinite(converted)) {
        setResultError("Enter a valid conversion selection.");
        return;
      }

      const b = breakdownFromSeconds(secondsTotal);

      // Reference conversions (same underlying assumptions)
      const refSeconds = secondsTotal;
      const ref = {
        seconds: fromSeconds(refSeconds, "second", daysPerMonth, daysPerYear),
        minutes: fromSeconds(refSeconds, "minute", daysPerMonth, daysPerYear),
        hours: fromSeconds(refSeconds, "hour", daysPerMonth, daysPerYear),
        days: fromSeconds(refSeconds, "day", daysPerMonth, daysPerYear),
        weeks: fromSeconds(refSeconds, "week", daysPerMonth, daysPerYear),
        months: fromSeconds(refSeconds, "month", daysPerMonth, daysPerYear),
        years: fromSeconds(refSeconds, "year", daysPerMonth, daysPerYear)
      };

      const assumptionsLine =
        (from === "month" || from === "year" || to === "month" || to === "year")
          ? `<p><strong>Assumptions used:</strong> 1 month = ${formatSmart(daysPerMonth)} days, 1 year = ${formatSmart(daysPerYear)} days.</p>`
          : `<p><strong>Assumptions used:</strong> Standard time definitions (60s/min, 60min/hr, 24hr/day, 7day/week).</p>`;

      // Build output HTML
      const resultHtml = `
        <p><strong>Converted:</strong> ${formatSmart(value)} ${unitLabel(from)} = <strong>${formatSmart(converted)}</strong> ${unitLabel(to)}</p>
        <p><strong>Breakdown (from total seconds):</strong> ${b.days} days, ${b.hours} hours, ${b.minutes} minutes, ${b.seconds} seconds</p>
        ${assumptionsLine}
        <p><strong>Quick reference for this same duration:</strong></p>
        <ul>
          <li>${formatSmart(ref.seconds)} seconds</li>
          <li>${formatSmart(ref.minutes)} minutes</li>
          <li>${formatSmart(ref.hours)} hours</li>
          <li>${formatSmart(ref.days)} days</li>
          <li>${formatSmart(ref.weeks)} weeks</li>
          <li>${formatSmart(ref.months)} months</li>
          <li>${formatSmart(ref.years)} years</li>
        </ul>
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
      const message = "Time Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
