document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const distanceInput = document.getElementById("distance");
  const distanceUnitSelect = document.getElementById("distanceUnit");
  const hoursInput = document.getElementById("hours");
  const minutesInput = document.getElementById("minutes");
  const secondsInput = document.getElementById("seconds");
  const outputUnitSelect = document.getElementById("outputUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Distance and time fields benefit from light comma formatting for large values
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

  function pad2(n) {
    const x = Math.floor(Math.abs(n));
    return x < 10 ? "0" + x : String(x);
  }

  function formatHMS(totalSeconds) {
    const t = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h + ":" + pad2(m) + ":" + pad2(s);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!distanceInput || !hoursInput || !minutesInput || !secondsInput || !distanceUnitSelect) {
        return;
      }

      const distanceRaw = toNumber(distanceInput.value);
      const hoursRaw = toNumber(hoursInput.value);
      const minutesRaw = toNumber(minutesInput.value);
      const secondsRaw = toNumber(secondsInput.value);

      const distanceUnit = distanceUnitSelect.value || "km";
      const outputUnit = outputUnitSelect ? outputUnitSelect.value : "kmh";

      // Required: distance and some time
      if (!validatePositive(distanceRaw, "distance")) return;

      // Time fields can be blank; treat blanks as 0
      const hours = Number.isFinite(hoursRaw) ? hoursRaw : 0;
      const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 0;
      const seconds = Number.isFinite(secondsRaw) ? secondsRaw : 0;

      if (!validateNonNegative(hours, "hours")) return;
      if (!validateNonNegative(minutes, "minutes")) return;
      if (!validateNonNegative(seconds, "seconds")) return;

      if (minutes >= 60 || seconds >= 60) {
        setResultError("Minutes and seconds must be less than 60. If you have extra time, carry it into the hours or minutes fields.");
        return;
      }

      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      if (!validatePositive(totalSeconds, "total time")) {
        setResultError("Enter a valid total time greater than 0 (hours, minutes, or seconds).");
        return;
      }

      // Convert distance to the unit required for output speed
      const MI_TO_KM = 1.609344;

      let distanceKm = distanceRaw;
      let distanceMi = distanceRaw;

      if (distanceUnit === "km") {
        distanceKm = distanceRaw;
        distanceMi = distanceRaw / MI_TO_KM;
      } else {
        distanceMi = distanceRaw;
        distanceKm = distanceRaw * MI_TO_KM;
      }

      const totalHours = totalSeconds / 3600;

      let speed;
      let speedLabel;
      let paceUnitLabel;
      let paceSecondsPerUnit;

      if (outputUnit === "mph") {
        speed = distanceMi / totalHours;
        speedLabel = "mph";
        paceUnitLabel = "min/mile";
        paceSecondsPerUnit = totalSeconds / distanceMi;
      } else {
        speed = distanceKm / totalHours;
        speedLabel = "km/h";
        paceUnitLabel = "min/km";
        paceSecondsPerUnit = totalSeconds / distanceKm;
      }

      if (!Number.isFinite(speed) || speed <= 0) {
        setResultError("Your inputs do not produce a valid speed. Recheck distance and time.");
        return;
      }

      // Pace formatting: mm:ss per unit
      const paceTotalSeconds = Math.max(0, paceSecondsPerUnit);
      const paceMinutes = Math.floor(paceTotalSeconds / 60);
      const paceSeconds = Math.round(paceTotalSeconds % 60);
      const paceDisplay = paceMinutes + ":" + pad2(paceSeconds);

      // Secondary insight: at this speed, time for 10 units (km or miles)
      const tenUnitsSeconds = paceTotalSeconds * 10;
      const tenUnitsLabel = outputUnit === "mph" ? "10 miles" : "10 km";
      const tenUnitsTime = formatHMS(tenUnitsSeconds);

      const distanceDisplay = formatNumberTwoDecimals(distanceRaw) + " " + (distanceUnit === "mi" ? "mi" : "km");
      const timeDisplay = formatHMS(totalSeconds);
      const speedDisplay = formatNumberTwoDecimals(speed) + " " + speedLabel;

      const resultHtml =
        "<p><strong>Average speed:</strong> " + speedDisplay + "</p>" +
        "<p><strong>Pace:</strong> " + paceDisplay + " " + paceUnitLabel + "</p>" +
        "<p><strong>Inputs used:</strong> " + distanceDisplay + " in " + timeDisplay + "</p>" +
        "<p><strong>At this pace:</strong> " + tenUnitsLabel + " takes about " + tenUnitsTime + "</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Average Speed Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
