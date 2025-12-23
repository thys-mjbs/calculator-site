document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startDateInput = document.getElementById("startDate");
  const examDateInput = document.getElementById("examDate");
  const totalHoursInput = document.getElementById("totalHours");
  const studyDaysPerWeekInput = document.getElementById("studyDaysPerWeek");
  const bufferPercentInput = document.getElementById("bufferPercent");
  const maxHoursPerDayInput = document.getElementById("maxHoursPerDay");

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
  attachLiveFormatting(totalHoursInput);
  attachLiveFormatting(studyDaysPerWeekInput);
  attachLiveFormatting(bufferPercentInput);
  attachLiveFormatting(maxHoursPerDayInput);

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

  function parseDateYYYYMMDD(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== mo - 1 ||
      dt.getUTCDate() !== d
    ) {
      return null;
    }
    return dt;
  }

  function formatDateYYYYMMDD(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const totalHours = toNumber(totalHoursInput ? totalHoursInput.value : "");
      const studyDaysPerWeek = toNumber(studyDaysPerWeekInput ? studyDaysPerWeekInput.value : "");
      const bufferPercentRaw = toNumber(bufferPercentInput ? bufferPercentInput.value : "");
      const maxHoursPerDayRaw = toNumber(maxHoursPerDayInput ? maxHoursPerDayInput.value : "");

      const startDateStr = startDateInput ? String(startDateInput.value || "").trim() : "";
      const examDateStr = examDateInput ? String(examDateInput.value || "").trim() : "";

      // Input existence guard
      if (
        !totalHoursInput ||
        !studyDaysPerWeekInput ||
        !examDateInput
      ) {
        return;
      }

      // Validation
      if (!examDateStr) {
        setResultError("Enter an exam date in YYYY-MM-DD format.");
        return;
      }

      const examDate = parseDateYYYYMMDD(examDateStr);
      if (!examDate) {
        setResultError("Enter a valid exam date in YYYY-MM-DD format (example: 2026-03-15).");
        return;
      }

      const todayLocal = new Date();
      const startDefault = new Date(Date.UTC(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate()));

      const startDate = startDateStr ? parseDateYYYYMMDD(startDateStr) : startDefault;
      if (startDateStr && !startDate) {
        setResultError("Enter a valid start date in YYYY-MM-DD format, or leave it blank for today.");
        return;
      }

      // Study window ends the day before the exam
      const msPerDay = 24 * 60 * 60 * 1000;
      const startMs = startDate.getTime();
      const examMs = examDate.getTime();
      const diffDays = Math.floor((examMs - startMs) / msPerDay);

      if (!Number.isFinite(diffDays) || diffDays < 1) {
        setResultError("Your exam date must be at least 1 day after your start date.");
        return;
      }

      if (!validatePositive(totalHours, "total study hours needed")) return;

      if (!Number.isFinite(studyDaysPerWeek) || studyDaysPerWeek < 1 || studyDaysPerWeek > 7) {
        setResultError("Enter a valid study days per week value from 1 to 7.");
        return;
      }

      const bufferPercent = Number.isFinite(bufferPercentRaw) && bufferPercentRaw >= 0 ? bufferPercentRaw : 10;
      const maxHoursPerDay = Number.isFinite(maxHoursPerDayRaw) && maxHoursPerDayRaw > 0 ? maxHoursPerDayRaw : 4;

      // Calculation logic
      const adjustedTotalHours = totalHours * (1 + bufferPercent / 100);

      // Estimate available study sessions using an even spread across calendar days
      const estimatedStudyDaysAvailable = Math.max(
        1,
        Math.floor(diffDays * (studyDaysPerWeek / 7))
      );

      const hoursPerSession = adjustedTotalHours / estimatedStudyDaysAvailable;

      const weeksAvailable = diffDays / 7;
      const hoursPerWeek = weeksAvailable > 0 ? adjustedTotalHours / weeksAvailable : adjustedTotalHours;

      // Realism check using max hours/day
      const feasible = hoursPerSession <= maxHoursPerDay;

      // If not feasible, compute what would be required given the max hours/day
      // Required study sessions = adjustedTotalHours / maxHoursPerDay
      // Convert to required days/week across the available weeks, capped at 7
      const requiredSessionsAtMax = adjustedTotalHours / maxHoursPerDay;
      const requiredDaysPerWeekAtMax =
        weeksAvailable > 0 ? Math.min(7, Math.ceil(requiredSessionsAtMax / weeksAvailable)) : 7;

      // Build output HTML
      const startDisplay = formatDateYYYYMMDD(startDate);
      const endDisplay = formatDateYYYYMMDD(new Date(examMs - msPerDay));

      const resultHtml = `
        <p><strong>Target study time per session:</strong> ${formatNumberTwoDecimals(hoursPerSession)} hours</p>
        <p><strong>Target study time per week:</strong> ${formatNumberTwoDecimals(hoursPerWeek)} hours</p>
        <p><strong>Estimated number of study sessions available:</strong> ${estimatedStudyDaysAvailable}</p>
        <p><strong>Adjusted total hours (includes buffer):</strong> ${formatNumberTwoDecimals(adjustedTotalHours)} hours</p>
        <p><strong>Study window:</strong> ${startDisplay} to ${endDisplay} (${diffDays} days)</p>
        <p><strong>Using:</strong> ${studyDaysPerWeek} study days per week, ${formatNumberTwoDecimals(bufferPercent)}% buffer, ${formatNumberTwoDecimals(maxHoursPerDay)} max hours per session</p>
        <hr>
        ${
          feasible
            ? `<p><strong>Status:</strong> This plan is feasible under your max-hours-per-session cap.</p>
               <p>Keep sessions close to the target and use the buffer to absorb missed days without panic catch-up.</p>`
            : `<p><strong>Status:</strong> This plan is too heavy under your max-hours-per-session cap.</p>
               <p>At ${formatNumberTwoDecimals(maxHoursPerDay)} hours per session, you would need about <strong>${requiredDaysPerWeekAtMax} study days per week</strong> to finish on time.</p>
               <p>If that is not realistic, reduce scope, start earlier, or increase the max session length.</p>`
        }
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
      const message = "Study Time Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
