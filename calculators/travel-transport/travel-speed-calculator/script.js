document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");
  const distanceInput = document.getElementById("distanceInput");
  const hoursInput = document.getElementById("hoursInput");
  const minutesInput = document.getElementById("minutesInput");
  const secondsInput = document.getElementById("secondsInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(distanceInput);
  attachLiveFormatting(hoursInput);
  attachLiveFormatting(minutesInput);
  attachLiveFormatting(secondsInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
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

  function clampInt(value, min, max) {
    if (!Number.isFinite(value)) return NaN;
    const v = Math.floor(value);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function formatPaceMinutes(minutesPerUnit) {
    if (!Number.isFinite(minutesPerUnit) || minutesPerUnit <= 0) return "—";
    const totalSeconds = Math.round(minutesPerUnit * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const secStr = secs < 10 ? "0" + secs : String(secs);
    return mins + ":" + secStr;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!distanceInput || !hoursInput || !minutesInput || !secondsInput || !unitSelect) return;

      const unit = unitSelect.value === "mi" ? "mi" : "km";
      const speedUnit = unit === "mi" ? "mph" : "km/h";
      const paceUnit = unit === "mi" ? "min/mi" : "min/km";

      const distance = toNumber(distanceInput.value);
      const hoursRaw = toNumber(hoursInput.value);
      const minutesRaw = toNumber(minutesInput.value);
      const secondsRaw = secondsInput.value.trim() === "" ? 0 : toNumber(secondsInput.value);

      if (!validatePositive(distance, "distance")) return;
      if (!validateNonNegative(hoursRaw, "hours")) return;
      if (!validateNonNegative(minutesRaw, "minutes")) return;
      if (!validateNonNegative(secondsRaw, "seconds")) return;

      const hours = clampInt(hoursRaw, 0, 9999);
      const minutes = clampInt(minutesRaw, 0, 59);
      const seconds = clampInt(secondsRaw, 0, 59);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
        setResultError("Enter whole numbers for hours, minutes, and seconds.");
        return;
      }

      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      if (!validatePositive(totalSeconds, "total time")) {
        setResultError("Enter a total time greater than 0 (hours, minutes, or seconds).");
        return;
      }

      const totalHours = totalSeconds / 3600;
      const totalMinutes = totalSeconds / 60;

      const avgSpeed = distance / totalHours;
      const paceMinutesPerUnit = totalMinutes / distance;

      const avgSpeedFmt = formatNumberTwoDecimals(avgSpeed);
      const distanceFmt = formatNumberTwoDecimals(distance);
      const paceFmt = formatPaceMinutes(paceMinutesPerUnit);

      const per100Distance = 100;
      const timeFor100Minutes = paceMinutesPerUnit * per100Distance;
      const timeFor100Pace = formatPaceMinutes(timeFor100Minutes);

      const timeParts = [];
      if (hours > 0) timeParts.push(hours + "h");
      timeParts.push(minutes + "m");
      timeParts.push(seconds + "s");
      const timeLabel = timeParts.join(" ");

      const resultHtml =
        `<p><strong>Average speed:</strong> ${avgSpeedFmt} ${speedUnit}</p>` +
        `<p><strong>Pace:</strong> ${paceFmt} ${paceUnit}</p>` +
        `<p><strong>Based on:</strong> ${distanceFmt} ${unit} in ${timeLabel}</p>` +
        `<p><strong>At this pace:</strong> about ${timeFor100Pace} per 100 ${unit}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Travel Speed Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
