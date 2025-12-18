document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const period = document.getElementById("period");
  const budgetAmount = document.getElementById("budgetAmount");
  const householdSize = document.getElementById("householdSize");
  const shoppingTrips = document.getElementById("shoppingTrips");
  const bufferPercent = document.getElementById("bufferPercent");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)

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
  attachLiveFormatting(budgetAmount);
  attachLiveFormatting(householdSize);
  attachLiveFormatting(shoppingTrips);
  attachLiveFormatting(bufferPercent);

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

  function validatePercentRange(value, fieldLabel, maxValue) {
    if (!Number.isFinite(value) || value < 0 || value > maxValue) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and " + maxValue + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const selectedPeriod = period ? period.value : "weekly";

      const budget = toNumber(budgetAmount ? budgetAmount.value : "");
      const householdRaw = toNumber(householdSize ? householdSize.value : "");
      const tripsRaw = toNumber(shoppingTrips ? shoppingTrips.value : "");
      const bufferRaw = toNumber(bufferPercent ? bufferPercent.value : "");

      if (!validatePositive(budget, "grocery budget")) return;

      const household = Number.isFinite(householdRaw) && householdRaw > 0 ? householdRaw : 1;

      let defaultTrips = selectedPeriod === "monthly" ? 4 : 1;
      let trips = Number.isFinite(tripsRaw) && tripsRaw > 0 ? tripsRaw : defaultTrips;

      const buffer = Number.isFinite(bufferRaw) && bufferRaw >= 0 ? bufferRaw : 10;

      if (!validatePositive(household, "household size")) return;
      if (!validatePositive(trips, "number of shopping trips")) return;
      if (!validatePercentRange(buffer, "buffer percent", 50)) return;

      const daysInPeriod = selectedPeriod === "monthly" ? 30.4 : 7;

      const bufferAmount = budget * (buffer / 100);
      const effectiveBudget = budget - bufferAmount;

      const perTrip = effectiveBudget / trips;
      const perDay = effectiveBudget / daysInPeriod;
      const perPerson = effectiveBudget / household;

      const perPersonPerDay = perPerson / daysInPeriod;

      const suggested = [
        { name: "Produce and fruit", pct: 25 },
        { name: "Protein (meat, fish, beans)", pct: 25 },
        { name: "Pantry and staples", pct: 20 },
        { name: "Dairy and eggs", pct: 10 },
        { name: "Snacks and extras", pct: 20 }
      ];

      const periodLabel = selectedPeriod === "monthly" ? "month" : "week";

      const lines = suggested
        .map(function (c) {
          const amount = perTrip * (c.pct / 100);
          return `<li><strong>${c.name} (${c.pct}%):</strong> ${formatNumberTwoDecimals(amount)} per trip</li>`;
        })
        .join("");

      const resultHtml = `
        <p><strong>Budget plan for this ${periodLabel}:</strong></p>
        <ul>
          <li><strong>Total budget:</strong> ${formatNumberTwoDecimals(budget)}</li>
          <li><strong>Buffer (${formatNumberTwoDecimals(buffer)}%):</strong> ${formatNumberTwoDecimals(bufferAmount)}</li>
          <li><strong>Spendable budget after buffer:</strong> ${formatNumberTwoDecimals(effectiveBudget)}</li>
          <li><strong>Target per shopping trip (${formatNumberTwoDecimals(trips)} trips):</strong> ${formatNumberTwoDecimals(perTrip)}</li>
          <li><strong>Target per day:</strong> ${formatNumberTwoDecimals(perDay)}</li>
          <li><strong>Target per person (household ${formatNumberTwoDecimals(household)}):</strong> ${formatNumberTwoDecimals(perPerson)} per ${periodLabel}</li>
          <li><strong>Target per person per day:</strong> ${formatNumberTwoDecimals(perPersonPerDay)}</li>
        </ul>
        <p><strong>Suggested per trip category split (quick sanity check):</strong></p>
        <ul>
          ${lines}
        </ul>
        <p>Tip: If you usually do one big shop and a few small top-ups, set trips to your realistic number and use the per trip target as your ceiling.</p>
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
      const message = "Grocery Budget Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
