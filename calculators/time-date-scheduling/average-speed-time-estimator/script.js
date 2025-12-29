document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSystem = document.getElementById("unitSystem");
  const distanceInput = document.getElementById("distanceInput");
  const speedInput = document.getElementById("speedInput");
  const delayMinutesInput = document.getElementById("delayMinutesInput");
  const departureTimeInput = document.getElementById("departureTimeInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceInput);
  attachLiveFormatting(speedInput);
  attachLiveFormatting(delayMinutesInput);

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

  function twoDigits(n) {
    const x = Math.floor(Math.abs(n));
    return x < 10 ? "0" + x : String(x);
  }

  function formatDuration(totalMinutes) {
    const minutesRounded = Math.round(totalMinutes);
    const hours = Math.floor(minutesRounded / 60);
    const minutes = minutesRounded % 60;
    return { hours: hours, minutes: minutes, text: hours + "h " + minutes + "m" };
  }

  function parseDepartureTime(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
    if (!m) return null;

    const hours = toNumber(m[1]);
    const minutes = toNumber(m[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  function formatArrival(dateObj) {
    const h = dateObj.getHours();
    const m = dateObj.getMinutes();
    const hhmm = twoDigits(h) + ":" + twoDigits(m);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfArrival = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const diffDays = Math.round((startOfArrival.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return hhmm + " (today)";
    if (diffDays === 1) return hhmm + " (tomorrow)";
    if (diffDays === -1) return hhmm + " (yesterday)";
    return hhmm;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Input existence guard
      if (!unitSystem || !distanceInput || !speedInput) return;

      const system = unitSystem.value === "imperial" ? "imperial" : "metric";
      const distance = toNumber(distanceInput.value);
      const speed = toNumber(speedInput.value);

      const delayMinutesRaw = delayMinutesInput ? toNumber(delayMinutesInput.value) : 0;
      const delayMinutes = Number.isFinite(delayMinutesRaw) ? delayMinutesRaw : 0;

      if (!validatePositive(distance, system === "imperial" ? "distance (miles)" : "distance (km)")) return;
      if (!validatePositive(speed, system === "imperial" ? "average speed (mph)" : "average speed (km/h)")) return;
      if (!validateNonNegative(delayMinutes, "extra delay (minutes)")) return;

      const drivingHours = distance / speed;
      const delayHours = delayMinutes / 60;
      const totalHours = drivingHours + delayHours;

      const drivingMinutes = drivingHours * 60;
      const totalMinutes = totalHours * 60;

      const totalDur = formatDuration(totalMinutes);
      const drivingDur = formatDuration(drivingMinutes);
      const delayDur = formatDuration(delayMinutes);

      const paceMinutesPerUnit = totalMinutes / distance;
      const paceMin = Math.floor(paceMinutesPerUnit);
      const paceSec = Math.round((paceMinutesPerUnit - paceMin) * 60);
      const paceSecFixed = paceSec === 60 ? 0 : paceSec;
      const paceMinFixed = paceSec === 60 ? paceMin + 1 : paceMin;

      const unitDistance = system === "imperial" ? "miles" : "km";
      const unitSpeed = system === "imperial" ? "mph" : "km/h";
      const unitPer = system === "imperial" ? "mile" : "km";

      const effectiveAvgSpeed = distance / (totalMinutes / 60);

      const departureDate = departureTimeInput ? parseDepartureTime(departureTimeInput.value) : null;
      let arrivalHtml = "";
      if (departureDate) {
        const arrival = new Date(departureDate.getTime() + Math.round(totalMinutes) * 60 * 1000);
        arrivalHtml = `<p><strong>Estimated arrival:</strong> ${formatArrival(arrival)}</p>`;
      } else if (departureTimeInput && String(departureTimeInput.value || "").trim().length > 0) {
        arrivalHtml = `<p><strong>Arrival time:</strong> Enter departure as HH:MM (24-hour), for example 08:30.</p>`;
      }

      const resultHtml = `
        <p><strong>Estimated total time:</strong> ${totalDur.text}</p>
        <p><strong>Driving time:</strong> ${drivingDur.text}</p>
        <p><strong>Added delay:</strong> ${delayDur.text}</p>
        ${arrivalHtml}
        <p><strong>Effective average speed:</strong> ${formatNumberTwoDecimals(effectiveAvgSpeed)} ${unitSpeed}</p>
        <p><strong>Pace:</strong> ${paceMinFixed}:${twoDigits(paceSecFixed)} per ${unitPer}</p>
        <p><strong>Inputs used:</strong> ${formatNumberTwoDecimals(distance)} ${unitDistance} at ${formatNumberTwoDecimals(speed)} ${unitSpeed}</p>
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
      const message = "Average Speed Time Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
