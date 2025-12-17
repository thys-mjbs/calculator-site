document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");
  const breakMinutesInput = document.getElementById("breakMinutes");
  const hourlyRateInput = document.getElementById("hourlyRate");
  const overtimeThresholdInput = document.getElementById("overtimeThreshold");
  const overtimeMultiplierInput = document.getElementById("overtimeMultiplier");
  const overnightShiftInput = document.getElementById("overnightShift");

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
  attachLiveFormatting(breakMinutesInput);
  attachLiveFormatting(hourlyRateInput);
  attachLiveFormatting(overtimeThresholdInput);

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
  // Helpers: time parsing and formatting
  // ------------------------------------------------------------
  function parseTimeToMinutes(text) {
    const raw = String(text || "").trim();
    if (!raw) return NaN;

    // Accept HH:MM (preferred). Also accept H:MM.
    const match = raw.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
    if (!match) return NaN;

    const h = Number(match[1]);
    const m = Number(match[2]);

    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    if (h < 0 || h > 23) return NaN;
    if (m < 0 || m > 59) return NaN;

    return h * 60 + m;
  }

  function minutesToHHMM(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return hh + ":" + mm;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse time inputs
      const startMinutes = parseTimeToMinutes(startTimeInput ? startTimeInput.value : "");
      const endMinutesRaw = parseTimeToMinutes(endTimeInput ? endTimeInput.value : "");

      // Parse numeric optional inputs using toNumber()
      const breakMinutes = toNumber(breakMinutesInput ? breakMinutesInput.value : "");
      const hourlyRate = toNumber(hourlyRateInput ? hourlyRateInput.value : "");
      const overtimeThresholdHours = toNumber(overtimeThresholdInput ? overtimeThresholdInput.value : "");
      const overtimeMultiplier = toNumber(overtimeMultiplierInput ? overtimeMultiplierInput.value : "");

      // Basic existence guard
      if (!startTimeInput || !endTimeInput) return;

      if (!Number.isFinite(startMinutes)) {
        setResultError("Enter a valid start time in HH:MM format (for example 08:30).");
        return;
      }
      if (!Number.isFinite(endMinutesRaw)) {
        setResultError("Enter a valid end time in HH:MM format (for example 17:00).");
        return;
      }

      const allowOvernight = overnightShiftInput ? !!overnightShiftInput.checked : false;
      let endMinutes = endMinutesRaw;

      if (endMinutes <= startMinutes) {
        if (allowOvernight) {
          endMinutes = endMinutes + 24 * 60;
        } else {
          setResultError("End time must be later than start time, or enable the overnight option for shifts that cross midnight.");
          return;
        }
      }

      const rawShiftMinutes = endMinutes - startMinutes;

      const breakMinsUsed = Number.isFinite(breakMinutes) ? breakMinutes : 0;
      if (breakMinutesInput && breakMinutesInput.value.trim() !== "") {
        if (!validateNonNegative(breakMinsUsed, "break minutes")) return;
      }
      if (breakMinsUsed >= rawShiftMinutes) {
        setResultError("Break minutes must be less than the total shift length.");
        return;
      }

      const netMinutes = rawShiftMinutes - breakMinsUsed;
      const netHours = netMinutes / 60;

      // Defaults for optional overtime inputs
      const thresholdHours = Number.isFinite(overtimeThresholdHours) && overtimeThresholdInput && overtimeThresholdInput.value.trim() !== ""
        ? overtimeThresholdHours
        : 8;

      const multiplier = Number.isFinite(overtimeMultiplier) && overtimeMultiplierInput && overtimeMultiplierInput.value.trim() !== ""
        ? overtimeMultiplier
        : 1.5;

      if (!validatePositive(thresholdHours, "overtime threshold hours")) return;
      if (!Number.isFinite(multiplier) || multiplier < 1) {
        setResultError("Enter a valid overtime multiplier (1.0 or higher).");
        return;
      }

      const regularHours = Math.min(netHours, thresholdHours);
      const overtimeHours = Math.max(0, netHours - thresholdHours);

      const hasHourlyRate = hourlyRateInput && hourlyRateInput.value.trim() !== "";
      let payTotal = NaN;
      let payRegular = NaN;
      let payOvertime = NaN;

      if (hasHourlyRate) {
        if (!validatePositive(hourlyRate, "hourly rate")) return;
        payRegular = regularHours * hourlyRate;
        payOvertime = overtimeHours * hourlyRate * multiplier;
        payTotal = payRegular + payOvertime;
      }

      const resultLines = [];

      resultLines.push(`<p><strong>Net time worked:</strong> ${minutesToHHMM(netMinutes)} (${formatNumberTwoDecimals(netHours)} hours)</p>`);
      resultLines.push(`<p><strong>Shift span:</strong> ${minutesToHHMM(rawShiftMinutes)} total, with ${Math.round(breakMinsUsed)} minutes break</p>`);

      if (overtimeHours > 0) {
        resultLines.push(
          `<p><strong>Overtime breakdown:</strong> ${formatNumberTwoDecimals(regularHours)} regular hours, ${formatNumberTwoDecimals(overtimeHours)} overtime hours</p>`
        );
      } else {
        resultLines.push(
          `<p><strong>Overtime breakdown:</strong> No overtime (threshold set to ${formatNumberTwoDecimals(thresholdHours)} hours)</p>`
        );
      }

      if (hasHourlyRate) {
        resultLines.push(`<p><strong>Estimated pay:</strong> ${formatNumberTwoDecimals(payTotal)}</p>`);
        if (overtimeHours > 0) {
          resultLines.push(
            `<p><strong>Pay split:</strong> ${formatNumberTwoDecimals(payRegular)} regular, ${formatNumberTwoDecimals(payOvertime)} overtime (multiplier ${formatNumberTwoDecimals(multiplier)})</p>`
          );
        } else {
          resultLines.push(`<p><strong>Pay split:</strong> ${formatNumberTwoDecimals(payRegular)} regular</p>`);
        }
      } else {
        resultLines.push(`<p><strong>Pay estimate:</strong> Add an hourly rate to calculate earnings for this shift.</p>`);
      }

      const resultHtml = resultLines.join("");
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Timesheet Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
