document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monHours = document.getElementById("monHours");
  const tueHours = document.getElementById("tueHours");
  const wedHours = document.getElementById("wedHours");
  const thuHours = document.getElementById("thuHours");
  const friHours = document.getElementById("friHours");
  const satHours = document.getElementById("satHours");
  const sunHours = document.getElementById("sunHours");
  const breakMinutes = document.getElementById("breakMinutes");
  const overtimeThreshold = document.getElementById("overtimeThreshold");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

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
  // (Not used for this calculator)

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
    // Not used
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

  function validateReasonableDayHours(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    if (value > 24) {
      setResultError(fieldLabel + " looks too high. Enter 24 or less.");
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
      const mon = toNumber(monHours ? monHours.value : "");
      const tue = toNumber(tueHours ? tueHours.value : "");
      const wed = toNumber(wedHours ? wedHours.value : "");
      const thu = toNumber(thuHours ? thuHours.value : "");
      const fri = toNumber(friHours ? friHours.value : "");
      const sat = toNumber(satHours ? satHours.value : "");
      const sun = toNumber(sunHours ? sunHours.value : "");

      const breakMinRaw = toNumber(breakMinutes ? breakMinutes.value : "");
      const thresholdRaw = toNumber(overtimeThreshold ? overtimeThreshold.value : "");

      // Basic existence guard
      if (
        !monHours || !tueHours || !wedHours || !thuHours || !friHours || !satHours || !sunHours ||
        !breakMinutes || !overtimeThreshold
      ) {
        return;
      }

      // Convert NaN blanks to 0 for day values
      const dayValues = [
        { key: "Monday hours", v: Number.isFinite(mon) ? mon : 0 },
        { key: "Tuesday hours", v: Number.isFinite(tue) ? tue : 0 },
        { key: "Wednesday hours", v: Number.isFinite(wed) ? wed : 0 },
        { key: "Thursday hours", v: Number.isFinite(thu) ? thu : 0 },
        { key: "Friday hours", v: Number.isFinite(fri) ? fri : 0 },
        { key: "Saturday hours", v: Number.isFinite(sat) ? sat : 0 },
        { key: "Sunday hours", v: Number.isFinite(sun) ? sun : 0 }
      ];

      for (let i = 0; i < dayValues.length; i++) {
        if (!validateReasonableDayHours(dayValues[i].v, dayValues[i].key)) return;
      }

      const breakMin = Number.isFinite(breakMinRaw) ? breakMinRaw : 0;
      if (!validateNonNegative(breakMin, "break minutes")) return;
      if (breakMin > 600) {
        setResultError("Break minutes looks too high. Enter 600 or less.");
        return;
      }

      const threshold = Number.isFinite(thresholdRaw) && thresholdRaw > 0 ? thresholdRaw : 40;

      // Must have at least one worked day
      const daysWorked = dayValues.filter(d => d.v > 0).length;
      if (daysWorked === 0) {
        setResultError("Enter hours for at least one day to calculate your weekly total.");
        return;
      }

      // Calculation logic
      const breakHoursPerDay = breakMin / 60;
      const adjustedDays = dayValues.map(d => {
        if (d.v <= 0) return { key: d.key, original: 0, adjusted: 0 };
        const adjusted = Math.max(0, d.v - breakHoursPerDay);
        return { key: d.key, original: d.v, adjusted: adjusted };
      });

      const totalHours = adjustedDays.reduce((sum, d) => sum + d.adjusted, 0);
      const regularHours = Math.min(totalHours, threshold);
      const overtimeHours = Math.max(0, totalHours - threshold);

      const avgPerWorkedDay = totalHours / daysWorked;
      const totalMinutes = totalHours * 60;

      // Build output HTML
      const breakdownRows = adjustedDays
        .filter(d => d.original > 0)
        .map(d => {
          const name = d.key.replace(" hours", "");
          return `<li>${name}: ${formatNumberTwoDecimals(d.adjusted)} hours</li>`;
        })
        .join("");

      const breakNote =
        breakMin > 0
          ? `<p><strong>Breaks applied:</strong> Subtracted ${formatNumberTwoDecimals(breakHoursPerDay)} hours (${breakMin} minutes) from each worked day.</p>`
          : `<p><strong>Breaks applied:</strong> None.</p>`;

      const resultHtml = `
        <p><strong>Total weekly hours:</strong> ${formatNumberTwoDecimals(totalHours)} hours</p>
        <p><strong>Days worked:</strong> ${daysWorked}</p>
        <p><strong>Average per worked day:</strong> ${formatNumberTwoDecimals(avgPerWorkedDay)} hours</p>
        <p><strong>Regular hours (up to ${formatNumberTwoDecimals(threshold)}):</strong> ${formatNumberTwoDecimals(regularHours)} hours</p>
        <p><strong>Overtime hours (above ${formatNumberTwoDecimals(threshold)}):</strong> ${formatNumberTwoDecimals(overtimeHours)} hours</p>
        <p><strong>Total time:</strong> ${formatNumberTwoDecimals(totalMinutes)} minutes</p>
        ${breakNote}
        <p><strong>Breakdown (worked days):</strong></p>
        <ul>${breakdownRows}</ul>
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
      const message = "Weekly Work Hours Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
