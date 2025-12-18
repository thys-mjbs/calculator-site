document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  const distanceOneWay = document.getElementById("distanceOneWay");
  const distanceUnit = document.getElementById("distanceUnit");
  const oneWayTripsPerWeek = document.getElementById("oneWayTripsPerWeek");

  const driveBlock = document.getElementById("driveBlock");
  const fuelEfficiencyValue = document.getElementById("fuelEfficiencyValue");
  const fuelEfficiencyUnit = document.getElementById("fuelEfficiencyUnit");
  const fuelPricePerUnit = document.getElementById("fuelPricePerUnit");
  const fuelPriceUnit = document.getElementById("fuelPriceUnit");
  const tollsPerRoundTrip = document.getElementById("tollsPerRoundTrip");
  const parkingPerDay = document.getElementById("parkingPerDay");

  const transitBlock = document.getElementById("transitBlock");
  const farePerOneWay = document.getElementById("farePerOneWay");
  const weeklyPassCost = document.getElementById("weeklyPassCost");

  const rideshareBlock = document.getElementById("rideshareBlock");
  const rideshareCostPerOneWay = document.getElementById("rideshareCostPerOneWay");
  const surgePercent = document.getElementById("surgePercent");
  const tipPercent = document.getElementById("tipPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceOneWay);
  attachLiveFormatting(oneWayTripsPerWeek);

  attachLiveFormatting(fuelEfficiencyValue);
  attachLiveFormatting(fuelPricePerUnit);
  attachLiveFormatting(tollsPerRoundTrip);
  attachLiveFormatting(parkingPerDay);

  attachLiveFormatting(farePerOneWay);
  attachLiveFormatting(weeklyPassCost);

  attachLiveFormatting(rideshareCostPerOneWay);
  attachLiveFormatting(surgePercent);
  attachLiveFormatting(tipPercent);

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
    if (driveBlock) driveBlock.classList.add("hidden");
    if (transitBlock) transitBlock.classList.add("hidden");
    if (rideshareBlock) rideshareBlock.classList.add("hidden");

    if (mode === "drive" && driveBlock) driveBlock.classList.remove("hidden");
    if (mode === "transit" && transitBlock) transitBlock.classList.remove("hidden");
    if (mode === "rideshare" && rideshareBlock) rideshareBlock.classList.remove("hidden");

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
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

  function safeDefault(value, fallback) {
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return value;
  }

  function milesToKm(mi) {
    return mi * 1.60934;
  }

  function lPer100kmFromMpg(mpg, which) {
    if (!Number.isFinite(mpg) || mpg <= 0) return NaN;
    if (which === "mpg_us") return 235.214583 / mpg;
    if (which === "mpg_uk") return 282.480936 / mpg;
    return NaN;
  }

  function perLitrePrice(pricePerUnit, unit) {
    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) return NaN;
    if (unit === "litre") return pricePerUnit;
    if (unit === "gallon_us") return pricePerUnit / 3.78541;
    if (unit === "gallon_uk") return pricePerUnit / 4.54609;
    return NaN;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "drive";

      const distanceRaw = toNumber(distanceOneWay ? distanceOneWay.value : "");
      const unit = distanceUnit ? distanceUnit.value : "km";
      const tripsRaw = toNumber(oneWayTripsPerWeek ? oneWayTripsPerWeek.value : "");

      if (!validatePositive(distanceRaw, "one-way distance")) return;
      if (!validatePositive(tripsRaw, "one-way trips per week")) return;

      const distanceKm = unit === "mi" ? milesToKm(distanceRaw) : distanceRaw;
      const weeklyOneWayTrips = tripsRaw;

      const estimatedDays = Math.max(1, weeklyOneWayTrips / 2);
      const weeklyDistanceKm = distanceKm * weeklyOneWayTrips;

      const weeksPerMonth = 52 / 12;
      const weeksPerYear = 52;

      let weeklyCost = 0;
      let detailsHtml = "";
      let insightHtml = "";

      if (mode === "drive") {
        const effValueRaw = toNumber(fuelEfficiencyValue ? fuelEfficiencyValue.value : "");
        const effUnit = fuelEfficiencyUnit ? fuelEfficiencyUnit.value : "l_per_100km";

        const priceRaw = toNumber(fuelPricePerUnit ? fuelPricePerUnit.value : "");
        const priceUnit = fuelPriceUnit ? fuelPriceUnit.value : "litre";

        const tollRaw = toNumber(tollsPerRoundTrip ? tollsPerRoundTrip.value : "");
        const parkingRaw = toNumber(parkingPerDay ? parkingPerDay.value : "");

        const effValue = safeDefault(effValueRaw, 8);
        const pricePerUnitValue = safeDefault(priceRaw, 1.6);

        const lPer100 = effUnit === "l_per_100km" ? effValue : lPer100kmFromMpg(effValue, effUnit);
        const pricePerLitre = perLitrePrice(pricePerUnitValue, priceUnit);

        if (!Number.isFinite(lPer100) || lPer100 <= 0) {
          setResultError("Enter a valid fuel efficiency greater than 0.");
          return;
        }
        if (!Number.isFinite(pricePerLitre) || pricePerLitre <= 0) {
          setResultError("Enter a valid fuel price greater than 0.");
          return;
        }
        if (!validateNonNegative(tollRaw, "tolls per round trip")) return;
        if (!validateNonNegative(parkingRaw, "parking per day")) return;

        const litresUsedWeekly = (weeklyDistanceKm / 100) * lPer100;
        const fuelCostWeekly = litresUsedWeekly * pricePerLitre;

        const weeklyRoundTrips = estimatedDays;
        const tollsWeekly = tollRaw * weeklyRoundTrips;
        const parkingWeekly = parkingRaw * weeklyRoundTrips;

        weeklyCost = fuelCostWeekly + tollsWeekly + parkingWeekly;

        const costPerKm = weeklyDistanceKm > 0 ? (weeklyCost / weeklyDistanceKm) : 0;
        const costPerMile = costPerKm * 1.60934;

        detailsHtml =
          `<ul>
            <li><strong>Weekly distance:</strong> ${formatNumberTwoDecimals(weeklyDistanceKm)} km</li>
            <li><strong>Estimated fuel used (weekly):</strong> ${formatNumberTwoDecimals(litresUsedWeekly)} litres</li>
            <li><strong>Fuel cost (weekly):</strong> ${formatNumberTwoDecimals(fuelCostWeekly)}</li>
            <li><strong>Tolls (weekly):</strong> ${formatNumberTwoDecimals(tollsWeekly)}</li>
            <li><strong>Parking (weekly):</strong> ${formatNumberTwoDecimals(parkingWeekly)}</li>
          </ul>`;

        insightHtml =
          `<p><strong>Cost per distance:</strong> ${formatNumberTwoDecimals(costPerKm)} per km` +
          (unit === "mi" ? ` (about ${formatNumberTwoDecimals(costPerMile)} per mile)` : "") +
          `</p>`;

      } else if (mode === "transit") {
        const fareRaw = toNumber(farePerOneWay ? farePerOneWay.value : "");
        const passRaw = toNumber(weeklyPassCost ? weeklyPassCost.value : "");

        const fare = safeDefault(fareRaw, 2.5);
        const pass = safeDefault(passRaw, 0);

        if (!validateNonNegative(fare, "fare per one-way trip")) return;
        if (!validateNonNegative(pass, "weekly pass cost")) return;

        const paygWeekly = fare * weeklyOneWayTrips;
        weeklyCost = pass > 0 ? Math.min(paygWeekly, pass) : paygWeekly;

        const usedPass = pass > 0 && weeklyCost === pass;
        const weeklySavings = pass > 0 ? (paygWeekly - weeklyCost) : 0;

        detailsHtml =
          `<ul>
            <li><strong>Pay-as-you-go (weekly):</strong> ${formatNumberTwoDecimals(paygWeekly)}</li>
            <li><strong>Weekly pass entered:</strong> ${pass > 0 ? formatNumberTwoDecimals(pass) : "Not provided"}</li>
            <li><strong>Weekly cost used:</strong> ${formatNumberTwoDecimals(weeklyCost)}${usedPass ? " (weekly pass)" : (pass > 0 ? " (pay-as-you-go is cheaper)" : "")}</li>
          </ul>`;

        if (pass > 0) {
          insightHtml =
            `<p><strong>Weekly savings vs pay-as-you-go:</strong> ${formatNumberTwoDecimals(weeklySavings)}</p>`;
        } else {
          insightHtml =
            `<p><strong>Tip:</strong> If you have a weekly pass, enter it to compare the cheaper option.</p>`;
        }

      } else if (mode === "rideshare") {
        const costRaw = toNumber(rideshareCostPerOneWay ? rideshareCostPerOneWay.value : "");
        const surgeRaw = toNumber(surgePercent ? surgePercent.value : "");
        const tipRaw = toNumber(tipPercent ? tipPercent.value : "");

        const costPerTrip = safeDefault(costRaw, 10);
        const surge = safeDefault(surgeRaw, 0);
        const tip = safeDefault(tipRaw, 0);

        if (!validatePositive(costPerTrip, "cost per one-way trip")) return;
        if (!validateNonNegative(surge, "surge percent")) return;
        if (!validateNonNegative(tip, "tip percent")) return;

        const baseWeekly = costPerTrip * weeklyOneWayTrips;
        const withSurge = baseWeekly * (1 + surge / 100);
        weeklyCost = withSurge * (1 + tip / 100);

        const uplift = weeklyCost - baseWeekly;

        detailsHtml =
          `<ul>
            <li><strong>Base weekly cost:</strong> ${formatNumberTwoDecimals(baseWeekly)}</li>
            <li><strong>After surge:</strong> ${formatNumberTwoDecimals(withSurge)}</li>
            <li><strong>After tip:</strong> ${formatNumberTwoDecimals(weeklyCost)}</li>
          </ul>`;

        insightHtml =
          `<p><strong>Extra cost from surge and tip (weekly):</strong> ${formatNumberTwoDecimals(uplift)}</p>`;
      }

      const dailyCost = weeklyCost / estimatedDays;
      const monthlyCost = weeklyCost * weeksPerMonth;
      const yearlyCost = weeklyCost * weeksPerYear;

      const resultHtml =
        `<p><strong>Estimated cost:</strong></p>
         <ul>
           <li><strong>Daily:</strong> ${formatNumberTwoDecimals(dailyCost)}</li>
           <li><strong>Weekly:</strong> ${formatNumberTwoDecimals(weeklyCost)}</li>
           <li><strong>Monthly:</strong> ${formatNumberTwoDecimals(monthlyCost)}</li>
           <li><strong>Yearly:</strong> ${formatNumberTwoDecimals(yearlyCost)}</li>
         </ul>
         ${insightHtml}
         <p><strong>Breakdown:</strong></p>
         ${detailsHtml}
         <p><em>Note:</em> Values are estimates. Monthly uses 4.33 weeks.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Commute Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
