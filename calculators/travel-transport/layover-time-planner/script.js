document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const arrivalDateInput = document.getElementById("arrivalDate");
  const arrivalTimeInput = document.getElementById("arrivalTime");
  const departureDateInput = document.getElementById("departureDate");
  const departureTimeInput = document.getElementById("departureTime");

  const toggleAdvancedButton = document.getElementById("toggleAdvancedButton");
  const advancedSection = document.getElementById("advancedSection");

  const minConnectionMinutesInput = document.getElementById("minConnectionMinutes");
  const personalBufferMinutesInput = document.getElementById("personalBufferMinutes");
  const terminalChangeMinutesInput = document.getElementById("terminalChangeMinutes");
  const extraChecksMinutesInput = document.getElementById("extraChecksMinutes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(minConnectionMinutesInput);
  attachLiveFormatting(personalBufferMinutesInput);
  attachLiveFormatting(terminalChangeMinutesInput);
  attachLiveFormatting(extraChecksMinutesInput);

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
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateMinutesReasonable(value, fieldLabel) {
    if (!validateNonNegative(value, fieldLabel)) return false;
    if (value > 24 * 60) {
      setResultError("Enter a realistic " + fieldLabel + " (0 to 1,440 minutes).");
      return false;
    }
    return true;
  }

  function isValidDateString(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test((s || "").trim());
  }

  function isValidTimeString(s) {
    if (!/^\d{2}:\d{2}$/.test((s || "").trim())) return false;
    const parts = s.split(":");
    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    return Number.isInteger(hh) && Number.isInteger(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }

  function buildLocalDate(dateStr, timeStr) {
    // dateStr: YYYY-MM-DD, timeStr: HH:MM
    // Using local time by constructing an ISO-like string without timezone suffix
    return new Date(dateStr + "T" + timeStr + ":00");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatMinutesToHM(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h + "h " + pad2(m) + "m";
  }

  // ------------------------------------------------------------
  // ADVANCED TOGGLE
  // ------------------------------------------------------------
  function setAdvancedExpanded(expanded) {
    if (!toggleAdvancedButton || !advancedSection) return;

    toggleAdvancedButton.setAttribute("aria-expanded", expanded ? "true" : "false");
    advancedSection.setAttribute("aria-hidden", expanded ? "false" : "true");

    if (expanded) {
      advancedSection.classList.remove("hidden");
      toggleAdvancedButton.textContent = "Hide advanced options";
    } else {
      advancedSection.classList.add("hidden");
      toggleAdvancedButton.textContent = "Show advanced options";
    }
  }

  if (toggleAdvancedButton) {
    setAdvancedExpanded(false);
    toggleAdvancedButton.addEventListener("click", function () {
      const isExpanded = toggleAdvancedButton.getAttribute("aria-expanded") === "true";
      setAdvancedExpanded(!isExpanded);
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse and validate required date/time inputs
      const arrivalDateStr = arrivalDateInput ? arrivalDateInput.value.trim() : "";
      const arrivalTimeStr = arrivalTimeInput ? arrivalTimeInput.value.trim() : "";
      const departureDateStr = departureDateInput ? departureDateInput.value.trim() : "";
      const departureTimeStr = departureTimeInput ? departureTimeInput.value.trim() : "";

      if (!arrivalDateStr || !arrivalTimeStr || !departureDateStr || !departureTimeStr) {
        setResultError("Enter arrival and next departure date and time to plan your layover.");
        return;
      }

      if (!isValidDateString(arrivalDateStr)) {
        setResultError("Enter a valid arrival date in YYYY-MM-DD format.");
        return;
      }
      if (!isValidTimeString(arrivalTimeStr)) {
        setResultError("Enter a valid arrival time in 24-hour HH:MM format.");
        return;
      }
      if (!isValidDateString(departureDateStr)) {
        setResultError("Enter a valid next departure date in YYYY-MM-DD format.");
        return;
      }
      if (!isValidTimeString(departureTimeStr)) {
        setResultError("Enter a valid next departure time in 24-hour HH:MM format.");
        return;
      }

      const arrivalDt = buildLocalDate(arrivalDateStr, arrivalTimeStr);
      const departureDt = buildLocalDate(departureDateStr, departureTimeStr);

      if (!Number.isFinite(arrivalDt.getTime()) || !Number.isFinite(departureDt.getTime())) {
        setResultError("Those date and time values could not be read. Check the formats and try again.");
        return;
      }

      const diffMs = departureDt.getTime() - arrivalDt.getTime();
      if (diffMs <= 0) {
        setResultError("Your next departure must be after your arrival. If your layover is overnight, enter the next day's date.");
        return;
      }

      const layoverMinutes = diffMs / 60000;

      // Advanced inputs (optional, with defaults)
      const mct = toNumber(minConnectionMinutesInput ? minConnectionMinutesInput.value : "");
      const buffer = toNumber(personalBufferMinutesInput ? personalBufferMinutesInput.value : "");
      const terminal = toNumber(terminalChangeMinutesInput ? terminalChangeMinutesInput.value : "");
      const checks = toNumber(extraChecksMinutesInput ? extraChecksMinutesInput.value : "");

      const mctValue = Number.isFinite(mct) && mct > 0 ? mct : 90;
      const bufferValue = Number.isFinite(buffer) && buffer >= 0 ? buffer : 30;
      const terminalValue = Number.isFinite(terminal) && terminal >= 0 ? terminal : 0;
      const checksValue = Number.isFinite(checks) && checks >= 0 ? checks : 0;

      if (!validateMinutesReasonable(mctValue, "recommended minimum connection time")) return;
      if (!validateMinutesReasonable(bufferValue, "extra buffer")) return;
      if (!validateMinutesReasonable(terminalValue, "terminal or gate change time")) return;
      if (!validateMinutesReasonable(checksValue, "extra security or passport control time")) return;

      const requiredMinutes = mctValue + bufferValue + terminalValue + checksValue;
      const slackMinutes = layoverMinutes - requiredMinutes;

      let verdictTitle = "";
      let verdictLine = "";
      let practicalAdvice = "";

      if (slackMinutes >= 30) {
        verdictTitle = "Comfortable connection";
        verdictLine = "You have meaningful slack after buffers. This connection is likely manageable for most travelers.";
        practicalAdvice = "If your first flight is delayed by up to about " + Math.floor(slackMinutes) + " minutes, you still have a workable plan (assuming typical airport conditions).";
      } else if (slackMinutes >= 0) {
        verdictTitle = "Tight connection";
        verdictLine = "You have little slack after buffers. A minor delay or long queue could break this connection.";
        practicalAdvice = "If you book this, be ready to move fast and avoid adding extra steps. Consider increasing your buffer or choosing a later departure.";
      } else {
        verdictTitle = "Too short based on your buffers";
        verdictLine = "Your planned layover is shorter than the time you likely need for the connection.";
        practicalAdvice = "Treat this as high-risk. Choose a longer layover, reduce terminal changes, or increase the gap between flights.";
      }

      const resultHtml =
        "<p><strong>" + verdictTitle + "</strong></p>" +
        "<p><strong>Total layover:</strong> " + formatMinutesToHM(layoverMinutes) + " (" + Math.round(layoverMinutes) + " minutes)</p>" +
        "<p><strong>Planned time needed:</strong> " + formatMinutesToHM(requiredMinutes) + " (" + Math.round(requiredMinutes) + " minutes)</p>" +
        "<p><strong>Slack after buffers:</strong> " +
          (slackMinutes >= 0 ? formatMinutesToHM(slackMinutes) : "-" + formatMinutesToHM(Math.abs(slackMinutes))) +
          " (" + Math.round(slackMinutes) + " minutes)</p>" +
        "<p>" + verdictLine + "</p>" +
        "<p>" + practicalAdvice + "</p>" +
        "<p><strong>Buffers used:</strong> MCT " + Math.round(mctValue) +
          " + buffer " + Math.round(bufferValue) +
          " + terminal change " + Math.round(terminalValue) +
          " + extra checks " + Math.round(checksValue) + " minutes</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Layover Time Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
