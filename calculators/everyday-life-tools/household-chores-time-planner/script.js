document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const householdSize = document.getElementById("householdSize");
  const daysPerWeek = document.getElementById("daysPerWeek");
  const bufferPercent = document.getElementById("bufferPercent");

  const chore1Name = document.getElementById("chore1Name");
  const chore1Times = document.getElementById("chore1Times");
  const chore1Minutes = document.getElementById("chore1Minutes");

  const chore2Name = document.getElementById("chore2Name");
  const chore2Times = document.getElementById("chore2Times");
  const chore2Minutes = document.getElementById("chore2Minutes");

  const chore3Name = document.getElementById("chore3Name");
  const chore3Times = document.getElementById("chore3Times");
  const chore3Minutes = document.getElementById("chore3Minutes");

  const chore4Name = document.getElementById("chore4Name");
  const chore4Times = document.getElementById("chore4Times");
  const chore4Minutes = document.getElementById("chore4Minutes");

  const chore5Name = document.getElementById("chore5Name");
  const chore5Times = document.getElementById("chore5Times");
  const chore5Minutes = document.getElementById("chore5Minutes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(householdSize);
  attachLiveFormatting(daysPerWeek);
  attachLiveFormatting(bufferPercent);

  attachLiveFormatting(chore1Times);
  attachLiveFormatting(chore1Minutes);
  attachLiveFormatting(chore2Times);
  attachLiveFormatting(chore2Minutes);
  attachLiveFormatting(chore3Times);
  attachLiveFormatting(chore3Minutes);
  attachLiveFormatting(chore4Times);
  attachLiveFormatting(chore4Minutes);
  attachLiveFormatting(chore5Times);
  attachLiveFormatting(chore5Minutes);

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

  function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) return null;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function escapeHtml(str) {
    const s = String(str == null ? "" : str);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toHoursMinutes(totalMinutes) {
    const m = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h <= 0) return rem + " min";
    if (rem === 0) return h + " hr";
    return h + " hr " + rem + " min";
  }

  function getChoreRow(index, nameEl, timesEl, minutesEl) {
    const rawName = nameEl ? String(nameEl.value || "").trim() : "";
    const times = toNumber(timesEl ? timesEl.value : "");
    const minutes = toNumber(minutesEl ? minutesEl.value : "");

    const hasAny = (rawName && rawName.length > 0) || Number.isFinite(times) || Number.isFinite(minutes);
    if (!hasAny) return null;

    const safeName = rawName && rawName.length > 0 ? rawName : "Chore " + index;

    const timesClean = Number.isFinite(times) ? times : NaN;
    const minutesClean = Number.isFinite(minutes) ? minutes : NaN;

    if (!Number.isFinite(timesClean) && !Number.isFinite(minutesClean)) return null;

    return {
      name: safeName,
      times: timesClean,
      minutes: minutesClean
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const household = toNumber(householdSize ? householdSize.value : "");
      const days = toNumber(daysPerWeek ? daysPerWeek.value : "");
      const buffer = toNumber(bufferPercent ? bufferPercent.value : "");

      // Basic existence guard
      if (!householdSize || !resultDiv) return;

      // Validation: household size
      if (!validatePositive(household, "number of people sharing chores")) return;
      const householdInt = Math.round(household);
      if (!Number.isFinite(householdInt) || householdInt < 1 || householdInt > 20) {
        setResultError("Enter a household size from 1 to 20.");
        return;
      }

      // Optional: days per week (default 7)
      let daysInt = 7;
      if (Number.isFinite(days)) {
        daysInt = Math.round(days);
        daysInt = clampNumber(daysInt, 1, 7);
      }

      // Optional: buffer percent (default 10)
      let bufferClean = 10;
      if (Number.isFinite(buffer)) {
        bufferClean = clampNumber(buffer, 0, 100);
      }

      // Collect chores
      const chores = [];
      const row1 = getChoreRow(1, chore1Name, chore1Times, chore1Minutes);
      const row2 = getChoreRow(2, chore2Name, chore2Times, chore2Minutes);
      const row3 = getChoreRow(3, chore3Name, chore3Times, chore3Minutes);
      const row4 = getChoreRow(4, chore4Name, chore4Times, chore4Minutes);
      const row5 = getChoreRow(5, chore5Name, chore5Times, chore5Minutes);

      if (row1) chores.push(row1);
      if (row2) chores.push(row2);
      if (row3) chores.push(row3);
      if (row4) chores.push(row4);
      if (row5) chores.push(row5);

      if (chores.length === 0) {
        setResultError("Add at least one chore with times per week and minutes each time.");
        return;
      }

      // Validate and compute
      let weeklyMinutes = 0;
      const breakdown = [];

      for (let i = 0; i < chores.length; i++) {
        const c = chores[i];

        if (!Number.isFinite(c.times) || c.times <= 0) {
          setResultError("Enter a valid times per week greater than 0 for " + c.name + ".");
          return;
        }
        if (!Number.isFinite(c.minutes) || c.minutes <= 0) {
          setResultError("Enter a valid minutes each time greater than 0 for " + c.name + ".");
          return;
        }

        if (c.times > 100) {
          setResultError("Times per week looks too high for " + c.name + ". Enter a number up to 100.");
          return;
        }
        if (c.minutes > 600) {
          setResultError("Minutes each time looks too high for " + c.name + ". Enter a number up to 600.");
          return;
        }

        const itemWeekly = c.times * c.minutes;
        weeklyMinutes += itemWeekly;

        breakdown.push({
          name: c.name,
          weeklyMinutes: itemWeekly
        });
      }

      if (!validatePositive(weeklyMinutes, "weekly chore minutes")) return;

      const bufferFactor = 1 + bufferClean / 100;
      const plannedWeeklyMinutes = weeklyMinutes * bufferFactor;

      const perDayMinutes = plannedWeeklyMinutes / daysInt;
      const perPersonWeeklyMinutes = plannedWeeklyMinutes / householdInt;
      const perPersonPerDayMinutes = perDayMinutes / householdInt;

      // Sort breakdown by time desc
      breakdown.sort(function (a, b) {
        return b.weeklyMinutes - a.weeklyMinutes;
      });

      // Build output HTML
      let breakdownHtml = "";
      for (let j = 0; j < breakdown.length; j++) {
        const b = breakdown[j];
        const perPersonShare = b.weeklyMinutes * bufferFactor / householdInt;
        breakdownHtml +=
          "<li><strong>" +
          escapeHtml(b.name) +
          ":</strong> " +
          toHoursMinutes(b.weeklyMinutes * bufferFactor) +
          " per week total, about " +
          toHoursMinutes(perPersonShare) +
          " per person</li>";
      }

      const plannedWeekly = toHoursMinutes(plannedWeeklyMinutes);
      const plannedPerPersonWeekly = toHoursMinutes(perPersonWeeklyMinutes);
      const plannedPerDay = toHoursMinutes(perDayMinutes);
      const plannedPerPersonPerDay = toHoursMinutes(perPersonPerDayMinutes);

      const resultHtml =
        "<p><strong>Planned weekly chore time:</strong> " +
        plannedWeekly +
        "</p>" +
        "<p><strong>Fair share per person:</strong> " +
        plannedPerPersonWeekly +
        " per week</p>" +
        "<p><strong>Average per day (" +
        daysInt +
        " day plan):</strong> " +
        plannedPerDay +
        " total, about " +
        plannedPerPersonPerDay +
        " per person</p>" +
        "<p><strong>What this means:</strong> This is the time you should expect to spend on chores in a typical week, including a " +
        formatNumberTwoDecimals(bufferClean) +
        "% buffer. Use the per-person share as a baseline split, then adjust based on preferences and standards.</p>" +
        "<p><strong>Weekly breakdown:</strong></p>" +
        "<ul>" +
        breakdownHtml +
        "</ul>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Household Chores Time Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
