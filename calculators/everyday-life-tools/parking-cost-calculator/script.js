document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const hoursParkedInput = document.getElementById("hoursParked");
  const minutesParkedInput = document.getElementById("minutesParked");
  const hourlyRateInput = document.getElementById("hourlyRate");

  const roundUpSelect = document.getElementById("roundUpHours");
  const graceMinutesInput = document.getElementById("graceMinutes");
  const entryFeeInput = document.getElementById("entryFee");
  const dailyMaxInput = document.getElementById("dailyMax");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(hourlyRateInput);
  attachLiveFormatting(entryFeeInput);
  attachLiveFormatting(dailyMaxInput);

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

  // ------------------------------------------------------------
  // 4) VALIDATION HELPERS
  // ------------------------------------------------------------
  function validateNonNegativeInteger(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateNonNegativeAmount(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositiveAmount(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const hours = toNumber(hoursParkedInput ? hoursParkedInput.value : "");
      const minutes = toNumber(minutesParkedInput ? minutesParkedInput.value : "");
      const hourlyRate = toNumber(hourlyRateInput ? hourlyRateInput.value : "");

      const roundUp = roundUpSelect ? roundUpSelect.value : "yes";
      const graceMinutesRaw = graceMinutesInput ? toNumber(graceMinutesInput.value) : 0;
      const entryFeeRaw = entryFeeInput ? toNumber(entryFeeInput.value) : 0;
      const dailyMaxRaw = dailyMaxInput ? toNumber(dailyMaxInput.value) : 0;

      if (!hoursParkedInput || !minutesParkedInput || !hourlyRateInput) return;

      if (!validateNonNegativeInteger(hours, "hours parked")) return;
      if (!validateNonNegativeInteger(minutes, "extra minutes parked")) return;
      if (minutes >= 60) {
        setResultError("Extra minutes parked must be between 0 and 59.");
        return;
      }
      if (!validatePositiveAmount(hourlyRate, "hourly rate")) return;

      const graceMinutes = Number.isFinite(graceMinutesRaw) ? graceMinutesRaw : 0;
      const entryFee = Number.isFinite(entryFeeRaw) ? entryFeeRaw : 0;
      const dailyMax = Number.isFinite(dailyMaxRaw) ? dailyMaxRaw : 0;

      if (!validateNonNegativeInteger(Math.floor(graceMinutes), "grace period minutes")) return;
      if (!validateNonNegativeAmount(entryFee, "entry fee")) return;
      if (!validateNonNegativeAmount(dailyMax, "daily maximum cap")) return;

      const totalMinutesRaw = hours * 60 + minutes;

      if (!Number.isFinite(totalMinutesRaw) || totalMinutesRaw <= 0) {
        setResultError("Enter a parking time greater than 0 minutes.");
        return;
      }

      const billableMinutes = Math.max(0, totalMinutesRaw - graceMinutes);

      const useRounding = roundUp === "yes";

      function billableHoursFromMinutes(mins) {
        if (mins <= 0) return 0;
        if (useRounding) return Math.ceil(mins / 60);
        return mins / 60;
      }

      const hoursBilledTotal = billableHoursFromMinutes(billableMinutes);

      const uncappedTimeCost = hoursBilledTotal * hourlyRate;
      const uncappedTotal = uncappedTimeCost + entryFee;

      let cappedTimeCost = uncappedTimeCost;

      if (dailyMax > 0) {
        const minutesPerDay = 24 * 60;

        const fullDays = Math.floor(billableMinutes / minutesPerDay);
        const remainingMinutes = billableMinutes % minutesPerDay;

        const fullDayHours = billableHoursFromMinutes(minutesPerDay);
        const fullDayCost = fullDayHours * hourlyRate;
        const fullDayCapped = Math.min(fullDayCost, dailyMax);

        const remainingHours = billableHoursFromMinutes(remainingMinutes);
        const remainingCost = remainingHours * hourlyRate;
        const remainingCapped = Math.min(remainingCost, dailyMax);

        cappedTimeCost = fullDays * fullDayCapped + remainingCapped;
      }

      const cappedTotal = cappedTimeCost + entryFee;

      const savingsFromCap = Math.max(0, uncappedTotal - cappedTotal);

      const effectiveRate = hoursBilledTotal > 0 ? (cappedTimeCost / hoursBilledTotal) : 0;

      const billableHoursDisplay = useRounding
        ? (hoursBilledTotal.toFixed(0) + " hour(s)")
        : (formatNumberTwoDecimals(hoursBilledTotal) + " hour(s)");

      const totalDurationDisplay = hours + " hour(s) " + minutes + " minute(s)";
      const afterGraceDisplay = (Math.floor(billableMinutes / 60)) + " hour(s) " + (billableMinutes % 60) + " minute(s)";

      const resultHtml = `
        <p><strong>Estimated total:</strong> ${formatNumberTwoDecimals(cappedTotal)}</p>
        <p><strong>Time entered:</strong> ${totalDurationDisplay}</p>
        <p><strong>Billable time after grace:</strong> ${afterGraceDisplay}</p>
        <p><strong>Billing method:</strong> ${useRounding ? "Rounded up to next hour" : "Charged exactly (pro-rated)"} (${billableHoursDisplay})</p>
        <p><strong>Time charges:</strong> ${formatNumberTwoDecimals(cappedTimeCost)}${dailyMax > 0 ? " (with daily cap applied)" : ""}</p>
        <p><strong>Entry fee:</strong> ${formatNumberTwoDecimals(entryFee)}</p>
        <p><strong>Effective cost per billed hour:</strong> ${formatNumberTwoDecimals(effectiveRate)}</p>
        ${dailyMax > 0 ? `<p><strong>Uncapped total (for comparison):</strong> ${formatNumberTwoDecimals(uncappedTotal)}</p>` : ""}
        ${dailyMax > 0 ? `<p><strong>Savings from daily cap:</strong> ${formatNumberTwoDecimals(savingsFromCap)}</p>` : ""}
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
      const message = "Parking Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
