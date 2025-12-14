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
  attachLiveFormatting(hourlyRateInput);

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
  // Time parsing helpers (calculator-specific)
  // Accepts: 08:30, 8:30, 8, 8am, 8:30pm, 17:00, 5pm
  // Returns minutes since midnight (0..1439) or NaN if invalid
  // ------------------------------------------------------------
  function parseTimeToMinutes(raw) {
    if (typeof raw !== "string") return NaN;
    const s = raw.trim().toLowerCase();
    if (!s) return NaN;

    // Detect am/pm
    const amMatch = s.endsWith("am");
    const pmMatch = s.endsWith("pm");
    let core = s;

    if (amMatch || pmMatch) {
      core = core.slice(0, -2).trim();
    }

    // core can be "8", "8:30", "08:30"
    let hoursStr = core;
    let minsStr = "0";

    if (core.includes(":")) {
      const parts = core.split(":");
      if (parts.length !== 2) return NaN;
      hoursStr = parts[0].trim();
      minsStr = parts[1].trim();
    }

    if (!hoursStr) return NaN;
    if (minsStr === "") minsStr = "0";

    // Hours and minutes must be integers
    if (!/^\d{1,2}$/.test(hoursStr)) return NaN;
    if (!/^\d{1,2}$/.test(minsStr)) return NaN;

    let h = parseInt(hoursStr, 10);
    let m = parseInt(minsStr, 10);

    if (m < 0 || m > 59) return NaN;

    if (amMatch || pmMatch) {
      // 12-hour rules
      if (h < 1 || h > 12) return NaN;
      if (h === 12) h = 0;
      if (pmMatch) h += 12;
    } else {
      // 24-hour rules
      if (h < 0 || h > 23) return NaN;
    }

    return h * 60 + m;
  }

  function minutesToHHMM(totalMinutes) {
    const mins = Math.round(totalMinutes);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const mm = String(m).padStart(2, "0");
    return String(h) + ":" + mm;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Input existence guard
      if (!startTimeInput || !endTimeInput || !breakMinutesInput || !hourlyRateInput || !overnightShiftInput) {
        return;
      }

      const startMinutes = parseTimeToMinutes(startTimeInput.value);
      const endMinutes = parseTimeToMinutes(endTimeInput.value);

      if (!Number.isFinite(startMinutes)) {
        setResultError("Enter a valid start time (for example 08:30 or 8:30am).");
        return;
      }

      if (!Number.isFinite(endMinutes)) {
        setResultError("Enter a valid end time (for example 17:00 or 5pm).");
        return;
      }

      const breakMinutes = toNumber(breakMinutesInput.value);
      if (!validateNonNegative(breakMinutes, "break minutes")) return;

      const overnight = !!overnightShiftInput.checked;

      // Calculate total shift minutes (before break)
      let totalShiftMinutes = endMinutes - startMinutes;

      if (totalShiftMinutes < 0) {
        if (overnight) {
          totalShiftMinutes = (24 * 60 - startMinutes) + endMinutes;
        } else {
          setResultError("End time is earlier than start time. If your shift crosses midnight, tick the overnight option.");
          return;
        }
      } else if (totalShiftMinutes === 0) {
        setResultError("Start time and end time are the same. Enter different times, or confirm your shift details.");
        return;
      }

      if (breakMinutes > totalShiftMinutes) {
        setResultError("Break minutes cannot be greater than the total time between start and end.");
        return;
      }

      const netMinutes = totalShiftMinutes - breakMinutes;
      const netHoursDecimal = netMinutes / 60;

      // Optional hourly rate
      const hourlyRate = toNumber(hourlyRateInput.value);
      const hasRate = Number.isFinite(hourlyRate) && hourlyRate > 0;

      let pay = null;
      if (hourlyRateInput.value.trim() !== "" && !hasRate) {
        setResultError("Enter a valid hourly rate greater than 0, or leave it blank.");
        return;
      }
      if (hasRate) {
        pay = netHoursDecimal * hourlyRate;
      }

      const netHHMM = minutesToHHMM(netMinutes);
      const decimalFormatted = formatNumberTwoDecimals(netHoursDecimal);

      let resultHtml = "";
      resultHtml += `<p><strong>Net hours worked:</strong> ${netHHMM} (${decimalFormatted} hours)</p>`;
      resultHtml += `<p><strong>Total shift time:</strong> ${minutesToHHMM(totalShiftMinutes)} (before breaks)</p>`;
      resultHtml += `<p><strong>Break time:</strong> ${Math.round(breakMinutes)} minutes</p>`;

      if (hasRate) {
        resultHtml += `<p><strong>Estimated pay:</strong> ${formatNumberTwoDecimals(pay)}</p>`;
      } else {
        resultHtml += `<p><strong>Estimated pay:</strong> Add an hourly rate to calculate pay.</p>`;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Hours Worked Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
