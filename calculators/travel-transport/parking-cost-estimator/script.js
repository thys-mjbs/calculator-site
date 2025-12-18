document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const hourlyRateInput = document.getElementById("hourlyRate");
  const totalHoursInput = document.getElementById("totalHours");
  const hoursPerDayInput = document.getElementById("hoursPerDay");
  const daysCountInput = document.getElementById("daysCount");
  const roundToMinutesInput = document.getElementById("roundToMinutes");
  const dailyCapInput = document.getElementById("dailyCap");
  const weeklyCapInput = document.getElementById("weeklyCap");
  const monthlyCapInput = document.getElementById("monthlyCap");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money-like fields and longer numeric fields benefit from commas
  attachLiveFormatting(hourlyRateInput);
  attachLiveFormatting(totalHoursInput);
  attachLiveFormatting(hoursPerDayInput);
  attachLiveFormatting(daysCountInput);
  attachLiveFormatting(roundToMinutesInput);
  attachLiveFormatting(dailyCapInput);
  attachLiveFormatting(weeklyCapInput);
  attachLiveFormatting(monthlyCapInput);

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

  function roundUpHoursByMinutes(hours, roundToMinutes) {
    const minutes = hours * 60;
    const step = roundToMinutes;
    if (!Number.isFinite(minutes) || minutes < 0) return NaN;
    if (!Number.isFinite(step) || step <= 0) return NaN;
    const roundedMinutes = Math.ceil(minutes / step) * step;
    return roundedMinutes / 60;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !hourlyRateInput ||
        !totalHoursInput ||
        !hoursPerDayInput ||
        !daysCountInput ||
        !roundToMinutesInput ||
        !dailyCapInput ||
        !weeklyCapInput ||
        !monthlyCapInput
      ) {
        return;
      }

      const hourlyRate = toNumber(hourlyRateInput.value);
      const totalHours = toNumber(totalHoursInput.value);
      const hoursPerDay = toNumber(hoursPerDayInput.value);
      const daysCount = toNumber(daysCountInput.value);
      const roundToMinutesRaw = toNumber(roundToMinutesInput.value);

      const dailyCap = toNumber(dailyCapInput.value);
      const weeklyCap = toNumber(weeklyCapInput.value);
      const monthlyCap = toNumber(monthlyCapInput.value);

      const roundToMinutes = Number.isFinite(roundToMinutesRaw) && roundToMinutesRaw > 0 ? roundToMinutesRaw : 15;

      if (!validatePositive(hourlyRate, "hourly rate")) return;

      const hasMultiDay = Number.isFinite(hoursPerDay) && hoursPerDay > 0 && Number.isFinite(daysCount) && daysCount > 0;
      const hasSingleStay = Number.isFinite(totalHours) && totalHours > 0;

      if (!hasMultiDay && !hasSingleStay) {
        setResultError("Enter either a total duration (hours) or a multi-day pattern (hours per day and number of days).");
        return;
      }

      if (Number.isFinite(dailyCap) && dailyCap < 0) {
        setResultError("Enter a valid daily maximum cap (0 or higher), or leave it blank.");
        return;
      }
      if (Number.isFinite(weeklyCap) && weeklyCap < 0) {
        setResultError("Enter a valid weekly maximum cap (0 or higher), or leave it blank.");
        return;
      }
      if (Number.isFinite(monthlyCap) && monthlyCap < 0) {
        setResultError("Enter a valid monthly maximum cap (0 or higher), or leave it blank.");
        return;
      }

      const useDailyCap = Number.isFinite(dailyCap) && dailyCap > 0;
      const useWeeklyCap = Number.isFinite(weeklyCap) && weeklyCap > 0;
      const useMonthlyCap = Number.isFinite(monthlyCap) && monthlyCap > 0;

      let scenarioLabel = "";
      let billedHoursTotal = 0;
      let daysEstimated = 0;
      let baseCostNoCaps = 0;

      let totalAfterDaily = 0;
      let totalAfterWeekly = 0;
      let totalAfterMonthly = 0;

      if (hasMultiDay) {
        scenarioLabel = "Multi-day estimate";
        const billedHoursPerDay = roundUpHoursByMinutes(hoursPerDay, roundToMinutes);

        if (!Number.isFinite(billedHoursPerDay) || billedHoursPerDay <= 0) {
          setResultError("Enter a valid hours per day and rounding increment.");
          return;
        }

        billedHoursTotal = billedHoursPerDay * daysCount;
        daysEstimated = Math.ceil(daysCount);

        const dayBase = billedHoursPerDay * hourlyRate;
        const dayCapped = useDailyCap ? Math.min(dayBase, dailyCap) : dayBase;

        baseCostNoCaps = dayBase * daysCount;
        totalAfterDaily = dayCapped * daysCount;
      } else {
        scenarioLabel = "Single-stay estimate";
        const billedHours = roundUpHoursByMinutes(totalHours, roundToMinutes);

        if (!Number.isFinite(billedHours) || billedHours <= 0) {
          setResultError("Enter a valid total duration and rounding increment.");
          return;
        }

        billedHoursTotal = billedHours;
        daysEstimated = Math.max(1, Math.ceil(billedHours / 24));

        baseCostNoCaps = billedHours * hourlyRate;

        if (useDailyCap && daysEstimated >= 1) {
          // Split into 24h blocks and cap each block
          let remaining = billedHours;
          let dailyTotal = 0;
          for (let d = 0; d < daysEstimated; d++) {
            const hoursInThisDay = Math.min(24, remaining);
            remaining = Math.max(0, remaining - 24);
            const thisDayBase = hoursInThisDay * hourlyRate;
            dailyTotal += Math.min(thisDayBase, dailyCap);
          }
          totalAfterDaily = dailyTotal;
        } else {
          totalAfterDaily = baseCostNoCaps;
        }
      }

      // Weekly cap (simple 7-day grouping)
      if (useWeeklyCap) {
        const weeks = Math.max(1, Math.ceil(daysEstimated / 7));
        const weeklyTotalCap = weeklyCap * weeks;
        totalAfterWeekly = Math.min(totalAfterDaily, weeklyTotalCap);
      } else {
        totalAfterWeekly = totalAfterDaily;
      }

      // Monthly cap (simple 30-day grouping)
      if (useMonthlyCap) {
        const months = Math.max(1, Math.ceil(daysEstimated / 30));
        const monthlyTotalCap = monthlyCap * months;
        totalAfterMonthly = Math.min(totalAfterWeekly, monthlyTotalCap);
      } else {
        totalAfterMonthly = totalAfterWeekly;
      }

      const finalTotal = totalAfterMonthly;

      const effectivePerHour = billedHoursTotal > 0 ? (finalTotal / billedHoursTotal) : NaN;

      const capsApplied = [];
      if (useDailyCap) capsApplied.push("Daily cap considered");
      if (useWeeklyCap) capsApplied.push("Weekly cap considered");
      if (useMonthlyCap) capsApplied.push("Monthly cap considered");
      if (capsApplied.length === 0) capsApplied.push("No caps applied");

      const roundingText = "Rounded up to nearest " + formatNumberTwoDecimals(roundToMinutes) + " minutes";

      const resultHtml = `
        <p><strong>${scenarioLabel}:</strong></p>
        <p><strong>Estimated total cost:</strong> ${formatNumberTwoDecimals(finalTotal)}</p>
        <p><strong>Billed time:</strong> ${formatNumberTwoDecimals(billedHoursTotal)} hours</p>
        <p><strong>Effective cost per billed hour:</strong> ${formatNumberTwoDecimals(effectivePerHour)}</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>${roundingText}</li>
          <li>Days counted for caps: ${formatNumberTwoDecimals(daysEstimated)}</li>
          <li>${capsApplied.join(", ")}</li>
        </ul>
        <p><strong>Cost breakdown:</strong></p>
        <ul>
          <li>Base (hourly only): ${formatNumberTwoDecimals(baseCostNoCaps)}</li>
          <li>After daily cap: ${formatNumberTwoDecimals(totalAfterDaily)}</li>
          <li>After weekly cap: ${formatNumberTwoDecimals(totalAfterWeekly)}</li>
          <li>After monthly cap: ${formatNumberTwoDecimals(totalAfterMonthly)}</li>
        </ul>
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
      const message = "Parking Cost Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
