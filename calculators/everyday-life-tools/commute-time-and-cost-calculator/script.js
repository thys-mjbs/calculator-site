document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const oneWayDistanceKm = document.getElementById("oneWayDistanceKm");
  const avgSpeedKmh = document.getElementById("avgSpeedKmh");
  const trafficDelayMin = document.getElementById("trafficDelayMin");
  const commuteDaysPerWeek = document.getElementById("commuteDaysPerWeek");
  const tripsPerDay = document.getElementById("tripsPerDay");
  const weeksPerMonth = document.getElementById("weeksPerMonth");

  const costMethod = document.getElementById("costMethod");
  const perKmBlock = document.getElementById("perKmBlock");
  const fuelBlock = document.getElementById("fuelBlock");

  const costPerKm = document.getElementById("costPerKm");

  const fuelEfficiencyLPer100km = document.getElementById("fuelEfficiencyLPer100km");
  const fuelPricePerLitre = document.getElementById("fuelPricePerLitre");
  const tollsPerDay = document.getElementById("tollsPerDay");
  const parkingPerDay = document.getElementById("parkingPerDay");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(oneWayDistanceKm);
  attachLiveFormatting(avgSpeedKmh);
  attachLiveFormatting(trafficDelayMin);
  attachLiveFormatting(commuteDaysPerWeek);
  attachLiveFormatting(tripsPerDay);
  attachLiveFormatting(weeksPerMonth);

  attachLiveFormatting(costPerKm);

  attachLiveFormatting(fuelEfficiencyLPer100km);
  attachLiveFormatting(fuelPricePerLitre);
  attachLiveFormatting(tollsPerDay);
  attachLiveFormatting(parkingPerDay);

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
    if (perKmBlock) perKmBlock.classList.add("hidden");
    if (fuelBlock) fuelBlock.classList.add("hidden");

    if (mode === "fuel") {
      if (fuelBlock) fuelBlock.classList.remove("hidden");
    } else {
      if (perKmBlock) perKmBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (costMethod) {
    showMode(costMethod.value);
    costMethod.addEventListener("change", function () {
      showMode(costMethod.value);
    });
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

  function validateWholeNumberInRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value % 1 !== 0 || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = costMethod ? costMethod.value : "perKm";

      const distanceOneWayKm = toNumber(oneWayDistanceKm ? oneWayDistanceKm.value : "");
      const speedKmhRaw = toNumber(avgSpeedKmh ? avgSpeedKmh.value : "");
      const delayMinRaw = toNumber(trafficDelayMin ? trafficDelayMin.value : "");
      const daysPerWeekRaw = toNumber(commuteDaysPerWeek ? commuteDaysPerWeek.value : "");
      const tripsPerDayRaw = toNumber(tripsPerDay ? tripsPerDay.value : "");
      const weeksPerMonthRaw = toNumber(weeksPerMonth ? weeksPerMonth.value : "");

      if (
        !oneWayDistanceKm ||
        !commuteDaysPerWeek ||
        !tripsPerDay ||
        !resultDiv
      ) {
        return;
      }

      if (!validatePositive(distanceOneWayKm, "one-way distance")) return;

      const daysPerWeek = Number.isFinite(daysPerWeekRaw) && daysPerWeekRaw > 0 ? daysPerWeekRaw : 5;
      const tripsPerDayVal = Number.isFinite(tripsPerDayRaw) && tripsPerDayRaw > 0 ? tripsPerDayRaw : 2;
      const weeksPerMonthVal = Number.isFinite(weeksPerMonthRaw) && weeksPerMonthRaw > 0 ? weeksPerMonthRaw : 4.33;

      if (!validateWholeNumberInRange(daysPerWeek, "commute days per week", 1, 7)) return;
      if (!validateWholeNumberInRange(tripsPerDayVal, "trips per day", 1, 6)) return;
      if (!validatePositive(weeksPerMonthVal, "weeks per month")) return;

      const speedKmh = Number.isFinite(speedKmhRaw) && speedKmhRaw > 0 ? speedKmhRaw : 40;
      const delayMin = Number.isFinite(delayMinRaw) && delayMinRaw >= 0 ? delayMinRaw : 0;

      if (!validatePositive(speedKmh, "average speed")) return;
      if (!validateNonNegative(delayMin, "extra delay per trip")) return;

      const distanceDailyKm = distanceOneWayKm * tripsPerDayVal;
      const distanceWeeklyKm = distanceDailyKm * daysPerWeek;
      const distanceMonthlyKm = distanceWeeklyKm * weeksPerMonthVal;
      const distanceYearlyKm = distanceWeeklyKm * 52;

      const timeOneWayHoursBase = distanceOneWayKm / speedKmh;
      const timeOneWayMinutes = (timeOneWayHoursBase * 60) + delayMin;
      const timeDailyMinutes = timeOneWayMinutes * tripsPerDayVal;
      const timeWeeklyMinutes = timeDailyMinutes * daysPerWeek;
      const timeMonthlyMinutes = timeWeeklyMinutes * weeksPerMonthVal;
      const timeYearlyMinutes = timeWeeklyMinutes * 52;

      let dailyCost = 0;

      if (mode === "fuel") {
        const eff = toNumber(fuelEfficiencyLPer100km ? fuelEfficiencyLPer100km.value : "");
        const price = toNumber(fuelPricePerLitre ? fuelPricePerLitre.value : "");
        const tolls = toNumber(tollsPerDay ? tollsPerDay.value : "");
        const parking = toNumber(parkingPerDay ? parkingPerDay.value : "");

        const efficiency = Number.isFinite(eff) && eff > 0 ? eff : 8.5;
        const fuelPrice = Number.isFinite(price) && price >= 0 ? price : 0;

        if (!validatePositive(efficiency, "fuel efficiency")) return;
        if (!validateNonNegative(fuelPrice, "fuel price")) return;
        if (!validateNonNegative(tolls, "tolls per day")) return;
        if (!validateNonNegative(parking, "parking per day")) return;

        const litresPerKm = efficiency / 100;
        const fuelCostDaily = distanceDailyKm * litresPerKm * fuelPrice;
        dailyCost = fuelCostDaily + tolls + parking;
      } else {
        const cpk = toNumber(costPerKm ? costPerKm.value : "");
        const costPerKmVal = Number.isFinite(cpk) && cpk >= 0 ? cpk : 0;

        if (!validateNonNegative(costPerKmVal, "cost per km")) return;

        dailyCost = distanceDailyKm * costPerKmVal;
      }

      const weeklyCost = dailyCost * daysPerWeek;
      const monthlyCost = weeklyCost * weeksPerMonthVal;
      const yearlyCost = weeklyCost * 52;

      const costPerTrip = dailyCost / tripsPerDayVal;

      function minutesToHoursMinutes(mins) {
        const total = Math.max(0, mins);
        const hours = Math.floor(total / 60);
        const minutes = Math.round(total - hours * 60);
        return { hours, minutes };
      }

      const oneWayHM = minutesToHoursMinutes(timeOneWayMinutes);
      const dailyHM = minutesToHoursMinutes(timeDailyMinutes);
      const weeklyHM = minutesToHoursMinutes(timeWeeklyMinutes);
      const monthlyHM = minutesToHoursMinutes(timeMonthlyMinutes);

      const resultHtml = `
        <p><strong>One-way time:</strong> ${oneWayHM.hours}h ${oneWayHM.minutes}m</p>
        <p><strong>Daily commute time:</strong> ${dailyHM.hours}h ${dailyHM.minutes}m</p>
        <p><strong>Weekly commute time:</strong> ${weeklyHM.hours}h ${weeklyHM.minutes}m</p>
        <p><strong>Monthly commute time:</strong> ${monthlyHM.hours}h ${monthlyHM.minutes}m</p>

        <hr>

        <p><strong>Daily distance:</strong> ${formatNumberTwoDecimals(distanceDailyKm)} km</p>
        <p><strong>Monthly distance:</strong> ${formatNumberTwoDecimals(distanceMonthlyKm)} km</p>

        <hr>

        <p><strong>Estimated daily commute cost:</strong> ${formatNumberTwoDecimals(dailyCost)}</p>
        <p><strong>Estimated weekly commute cost:</strong> ${formatNumberTwoDecimals(weeklyCost)}</p>
        <p><strong>Estimated monthly commute cost:</strong> ${formatNumberTwoDecimals(monthlyCost)}</p>
        <p><strong>Estimated yearly commute cost:</strong> ${formatNumberTwoDecimals(yearlyCost)}</p>

        <p><strong>Cost per trip:</strong> ${formatNumberTwoDecimals(costPerTrip)}</p>

        <p style="margin-top:10px; color:#555555;">
          Practical read: this is what your typical driving commute adds up to across time (minutes/hours) and money (your entered currency).
          Use the monthly and yearly totals when comparing housing, job location, or remote/hybrid schedules.
        </p>
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
      const message = "Commute Time & Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
