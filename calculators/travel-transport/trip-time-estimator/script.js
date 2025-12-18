document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const distanceValue = document.getElementById("distanceValue");
  const distanceUnit = document.getElementById("distanceUnit");
  const speedValue = document.getElementById("speedValue");
  const speedUnit = document.getElementById("speedUnit");
  const stopsCount = document.getElementById("stopsCount");
  const stopMinutes = document.getElementById("stopMinutes");
  const trafficDelayPercent = document.getElementById("trafficDelayPercent");
  const departureTime = document.getElementById("departureTime");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceValue);
  attachLiveFormatting(speedValue);
  attachLiveFormatting(stopsCount);
  attachLiveFormatting(stopMinutes);
  attachLiveFormatting(trafficDelayPercent);

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

  function minutesToReadable(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    const hLabel = h === 1 ? "hour" : "hours";
    const mLabel = m === 1 ? "min" : "min";

    if (h <= 0) return m + " " + mLabel;
    return h + " " + hLabel + " " + m + " " + mLabel;
  }

  function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  function parseDepartureTimeToMinutes(t) {
    if (!t || typeof t !== "string") return null;
    const parts = t.split(":");
    if (parts.length !== 2) return null;
    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function minutesToHHMM(mins) {
    const m = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const hhStr = String(hh).padStart(2, "0");
    const mmStr = String(mm).padStart(2, "0");
    return hhStr + ":" + mmStr;
  }

  function convertDistanceToKm(value, unit) {
    if (!Number.isFinite(value)) return value;
    if (unit === "mi") return value * 1.609344;
    return value;
  }

  function convertSpeedToKmh(value, unit) {
    if (!Number.isFinite(value)) return value;
    if (unit === "mph") return value * 1.609344;
    return value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const distanceRaw = toNumber(distanceValue ? distanceValue.value : "");
      const speedRaw = toNumber(speedValue ? speedValue.value : "");
      const stopsRaw = toNumber(stopsCount ? stopsCount.value : "");
      const stopMinsRaw = toNumber(stopMinutes ? stopMinutes.value : "");
      const trafficRaw = toNumber(trafficDelayPercent ? trafficDelayPercent.value : "");

      const dUnit = distanceUnit ? distanceUnit.value : "km";
      const sUnit = speedUnit ? speedUnit.value : "kmh";

      if (!validatePositive(distanceRaw, "distance")) return;
      if (!validatePositive(speedRaw, "average speed")) return;

      const distanceKm = convertDistanceToKm(distanceRaw, dUnit);
      const speedKmh = convertSpeedToKmh(speedRaw, sUnit);

      if (!validatePositive(distanceKm, "distance")) return;
      if (!validatePositive(speedKmh, "average speed")) return;

      let stops = Number.isFinite(stopsRaw) ? stopsRaw : 0;
      let perStopMinutes = Number.isFinite(stopMinsRaw) ? stopMinsRaw : 0;
      let trafficPct = Number.isFinite(trafficRaw) ? trafficRaw : 0;

      stops = clampNumber(stops, 0, 50);
      perStopMinutes = clampNumber(perStopMinutes, 0, 600);
      trafficPct = clampNumber(trafficPct, 0, 300);

      if (!validateNonNegative(stops, "stops")) return;
      if (!validateNonNegative(perStopMinutes, "minutes per stop")) return;
      if (!validateNonNegative(trafficPct, "traffic delay percent")) return;

      const baseHours = distanceKm / speedKmh;
      const baseMinutes = baseHours * 60;

      const trafficExtraMinutes = baseMinutes * (trafficPct / 100);
      const stopsMinutes = stops * perStopMinutes;

      const totalMinutes = baseMinutes + trafficExtraMinutes + stopsMinutes;

      const baseReadable = minutesToReadable(baseMinutes);
      const trafficReadable = minutesToReadable(trafficExtraMinutes);
      const stopsReadable = minutesToReadable(stopsMinutes);
      const totalReadable = minutesToReadable(totalMinutes);

      const paceMinutesPerKm = baseMinutes / distanceKm;
      const paceSecondsPerKm = paceMinutesPerKm * 60;

      let paceLabel = "Pace per km";
      let paceText = "";
      if (Number.isFinite(paceSecondsPerKm) && paceSecondsPerKm > 0) {
        const pMin = Math.floor(paceSecondsPerKm / 60);
        const pSec = Math.round(paceSecondsPerKm % 60);
        paceText = pMin + ":" + String(pSec).padStart(2, "0") + " per km";
      }

      if (dUnit === "mi") {
        const distanceMi = distanceRaw;
        const baseMinutesPerMi = baseMinutes / distanceMi;
        const baseSecondsPerMi = baseMinutesPerMi * 60;
        paceLabel = "Pace per mile";
        if (Number.isFinite(baseSecondsPerMi) && baseSecondsPerMi > 0) {
          const pMin = Math.floor(baseSecondsPerMi / 60);
          const pSec = Math.round(baseSecondsPerMi % 60);
          paceText = pMin + ":" + String(pSec).padStart(2, "0") + " per mile";
        }
      }

      let arrivalHtml = "";
      const depStr = departureTime ? departureTime.value : "";
      const depMinutes = parseDepartureTimeToMinutes(depStr);
      if (depMinutes !== null) {
        const arrivalMinutes = depMinutes + totalMinutes;
        arrivalHtml = `<p><strong>Estimated arrival time:</strong> ${minutesToHHMM(arrivalMinutes)}</p>`;
      }

      const totalHoursDecimal = totalMinutes / 60;
      const totalHoursDecimalText = formatNumberTwoDecimals(totalHoursDecimal);

      const resultHtml = `
        <p><strong>Total trip time:</strong> ${totalReadable}</p>
        <ul>
          <li><strong>Base driving time:</strong> ${baseReadable}</li>
          <li><strong>Traffic add-on:</strong> ${trafficReadable}</li>
          <li><strong>Stops add-on:</strong> ${stopsReadable}</li>
        </ul>
        <p><strong>Total time (hours):</strong> ${totalHoursDecimalText}</p>
        ${arrivalHtml}
        ${paceText ? `<p><strong>${paceLabel}:</strong> ${paceText}</p>` : ""}
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
      const message = "Trip Time Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
