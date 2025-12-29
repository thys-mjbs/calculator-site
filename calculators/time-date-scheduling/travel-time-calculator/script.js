// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const unitSystem = document.getElementById("unitSystem");
  const distanceInput = document.getElementById("distanceInput");
  const speedInput = document.getElementById("speedInput");

  const trafficPercent = document.getElementById("trafficPercent");
  const stopsCount = document.getElementById("stopsCount");
  const minutesPerStop = document.getElementById("minutesPerStop");
  const departureDateTime = document.getElementById("departureDateTime");

  const distanceLabel = document.getElementById("distanceLabel");
  const speedLabel = document.getElementById("speedLabel");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceInput);
  attachLiveFormatting(speedInput);
  attachLiveFormatting(trafficPercent);
  attachLiveFormatting(stopsCount);
  attachLiveFormatting(minutesPerStop);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS
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
  // 4) VALIDATION HELPERS
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

  function hoursToHhMm(totalHours) {
    if (!Number.isFinite(totalHours) || totalHours < 0) return "";
    const totalMinutes = Math.round(totalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const mm = String(m).padStart(2, "0");
    return h + "h " + mm + "m";
  }

  function safeNumberOrZero(value) {
    return Number.isFinite(value) ? value : 0;
  }

  function updateUnitLabels() {
    const mode = unitSystem ? unitSystem.value : "metric";
    const distanceUnit = mode === "imperial" ? "mi" : "km";
    const speedUnit = mode === "imperial" ? "mph" : "km/h";

    if (distanceLabel) distanceLabel.textContent = "Distance (" + distanceUnit + ")";
    if (speedLabel) speedLabel.textContent = "Average speed (" + speedUnit + ")";

    if (distanceInput) distanceInput.placeholder = mode === "imperial" ? "e.g. 260" : "e.g. 420";
    if (speedInput) speedInput.placeholder = mode === "imperial" ? "e.g. 60" : "e.g. 95";

    clearResult();
  }

  if (unitSystem) {
    updateUnitLabels();
    unitSystem.addEventListener("change", updateUnitLabels);
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required inputs using toNumber()
      const distance = toNumber(distanceInput ? distanceInput.value : "");
      const avgSpeed = toNumber(speedInput ? speedInput.value : "");

      // Optional inputs (defaults allowed)
      const trafficPct = safeNumberOrZero(toNumber(trafficPercent ? trafficPercent.value : ""));
      const stopCount = safeNumberOrZero(toNumber(stopsCount ? stopsCount.value : ""));
      const stopMinutesEach = safeNumberOrZero(toNumber(minutesPerStop ? minutesPerStop.value : ""));

      // Existence guard
      if (!distanceInput || !speedInput) return;

      // Validation
      if (!validatePositive(distance, "distance")) return;
      if (!validatePositive(avgSpeed, "average speed")) return;

      if (!validateNonNegative(trafficPct, "traffic percentage")) return;
      if (trafficPct > 300) {
        setResultError("Traffic percentage looks too high. Enter a value between 0 and 300.");
        return;
      }

      if (!validateNonNegative(stopCount, "number of stops")) return;
      if (!validateNonNegative(stopMinutesEach, "minutes per stop")) return;

      // Calculation
      const baseDriveHours = distance / avgSpeed;
      const trafficMultiplier = 1 + trafficPct / 100;
      const adjustedDriveHours = baseDriveHours * trafficMultiplier;

      const totalStopMinutes = stopCount * stopMinutesEach;
      const totalTripHours = adjustedDriveHours + totalStopMinutes / 60;

      // Secondary insight: minutes per unit (pace)
      const minutesPerUnit = (60 / avgSpeed);

      // Optional arrival time
      let arrivalHtml = "";
      if (departureDateTime && departureDateTime.value) {
        const depart = new Date(departureDateTime.value);
        if (Number.isFinite(depart.getTime())) {
          const arriveMs = depart.getTime() + totalTripHours * 60 * 60 * 1000;
          const arrive = new Date(arriveMs);

          const departText = depart.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          });

          const arriveText = arrive.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          });

          arrivalHtml =
            "<p><strong>Estimated arrival:</strong> " + arriveText + "</p>" +
            "<p><strong>Departure used:</strong> " + departText + "</p>";
        }
      }

      const unitMode = unitSystem ? unitSystem.value : "metric";
      const distanceUnit = unitMode === "imperial" ? "mi" : "km";

      // Build output HTML
      const resultHtml =
        "<p><strong>Total trip time:</strong> " + hoursToHhMm(totalTripHours) + " (" + formatNumberTwoDecimals(totalTripHours) + " hours)</p>" +
        "<p><strong>Driving time (incl. traffic):</strong> " + hoursToHhMm(adjustedDriveHours) + " (" + formatNumberTwoDecimals(adjustedDriveHours) + " hours)</p>" +
        "<p><strong>Stops time:</strong> " + Math.round(totalStopMinutes) + " minutes</p>" +
        "<p><strong>Pace:</strong> " + formatNumberTwoDecimals(minutesPerUnit) + " minutes per " + distanceUnit + "</p>" +
        arrivalHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Travel Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
