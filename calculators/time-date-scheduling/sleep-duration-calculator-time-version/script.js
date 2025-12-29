document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const bedTimeInput = document.getElementById("bedTime");
  const wakeTimeInput = document.getElementById("wakeTime");
  const sleepLatencyMinsInput = document.getElementById("sleepLatencyMins");
  const nightAwakeMinsInput = document.getElementById("nightAwakeMins");
  const targetSleepHoursInput = document.getElementById("targetSleepHours");

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
  attachLiveFormatting(sleepLatencyMinsInput);
  attachLiveFormatting(nightAwakeMinsInput);
  attachLiveFormatting(targetSleepHoursInput);

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
  // 4) TIME PARSING HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function parseTimeToMinutes(timeStr, fieldLabel) {
    const raw = (timeStr || "").trim();
    if (!raw) {
      setResultError("Enter a valid " + fieldLabel + " in 24-hour time (HH:MM).");
      return null;
    }

    const match = raw.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
    if (!match) {
      setResultError("Enter a valid " + fieldLabel + " in 24-hour time (HH:MM). Example: 23:15.");
      return null;
    }

    const hh = Number(match[1]);
    const mm = Number(match[2]);

    if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      setResultError("Enter a valid " + fieldLabel + " between 00:00 and 23:59.");
      return null;
    }

    return hh * 60 + mm;
  }

  function minutesToHHMM(totalMinutes) {
    const mins = ((totalMinutes % 1440) + 1440) % 1440;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const hhStr = String(hh).padStart(2, "0");
    const mmStr = String(mm).padStart(2, "0");
    return hhStr + ":" + mmStr;
  }

  function formatHoursMinutes(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h + "h " + String(m).padStart(2, "0") + "m";
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!bedTimeInput || !wakeTimeInput) return;

      const bedMins = parseTimeToMinutes(bedTimeInput.value, "bedtime");
      if (bedMins === null) return;

      const wakeMins = parseTimeToMinutes(wakeTimeInput.value, "wake time");
      if (wakeMins === null) return;

      // Optional inputs
      let latencyMins = toNumber(sleepLatencyMinsInput ? sleepLatencyMinsInput.value : "");
      let awakeMins = toNumber(nightAwakeMinsInput ? nightAwakeMinsInput.value : "");
      let targetHours = toNumber(targetSleepHoursInput ? targetSleepHoursInput.value : "");

      if (!Number.isFinite(latencyMins) || latencyMins < 0) latencyMins = 0;
      if (!Number.isFinite(awakeMins) || awakeMins < 0) awakeMins = 0;
      if (!Number.isFinite(targetHours) || targetHours <= 0) targetHours = 8;

      // Duration across midnight
      let durationMins = wakeMins - bedMins;
      let crossesMidnight = false;
      if (durationMins <= 0) {
        durationMins += 1440;
        crossesMidnight = true;
      }

      // Sanity guard: 0 or implausibly large (should not happen with above)
      if (!Number.isFinite(durationMins) || durationMins <= 0 || durationMins > 1440) {
        setResultError("Enter a valid bedtime and wake time. Check that both are in HH:MM format.");
        return;
      }

      const adjustedSleepMins = Math.max(0, durationMins - latencyMins - awakeMins);

      // Benchmark comparison (uses targetHours, default 8)
      const targetMins = targetHours * 60;
      const diffMins = adjustedSleepMins - targetMins;
      const diffAbs = Math.abs(diffMins);
      const diffLabel = diffMins === 0
        ? "Exactly on target"
        : (diffMins > 0 ? ("Above target by " + formatHoursMinutes(diffAbs)) : ("Below target by " + formatHoursMinutes(diffAbs)));

      // Recommended bedtime for target (include adjustments)
      const requiredInBedMins = targetMins + latencyMins + awakeMins;
      const recommendedBedTotal = wakeMins - requiredInBedMins;
      const recommendedBedTime = minutesToHHMM(recommendedBedTotal);
      const recommendedNote = recommendedBedTotal < 0 ? " (previous day)" : "";

      const overnightNote = crossesMidnight ? "Yes" : "No";

      const resultHtml = `
        <p><strong>Time in bed:</strong> ${formatHoursMinutes(durationMins)}</p>
        <p><strong>Estimated sleep (after adjustments):</strong> ${formatHoursMinutes(adjustedSleepMins)}</p>
        <p><strong>Crosses midnight:</strong> ${overnightNote}</p>
        <p><strong>Compared to target (${targetHours} hours):</strong> ${diffLabel}</p>
        <p><strong>Recommended bedtime for this wake time:</strong> ${recommendedBedTime}${recommendedNote}</p>
        <p class="result-note"><em>Notes:</em> Adjustments are optional. Leave them at 0 if you only want time in bed.</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Sleep Duration Calculator (Time Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
