document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const petsCount = document.getElementById("petsCount");
  const bagPrice = document.getElementById("bagPrice");
  const bagSizeKg = document.getElementById("bagSizeKg");
  const gramsPerPetPerDay = document.getElementById("gramsPerPetPerDay");

  // Optional advanced inputs
  const wetFoodCostPerDay = document.getElementById("wetFoodCostPerDay");
  const treatsCostPerWeek = document.getElementById("treatsCostPerWeek");
  const wastagePercent = document.getElementById("wastagePercent");
  const deliveryFeePerOrder = document.getElementById("deliveryFeePerOrder");
  const ordersPerMonth = document.getElementById("ordersPerMonth");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(petsCount);
  attachLiveFormatting(bagPrice);
  attachLiveFormatting(bagSizeKg);
  attachLiveFormatting(gramsPerPetPerDay);
  attachLiveFormatting(wetFoodCostPerDay);
  attachLiveFormatting(treatsCostPerWeek);
  attachLiveFormatting(wastagePercent);
  attachLiveFormatting(deliveryFeePerOrder);
  attachLiveFormatting(ordersPerMonth);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const pets = toNumber(petsCount ? petsCount.value : "");
      const pricePerBag = toNumber(bagPrice ? bagPrice.value : "");
      const sizeKg = toNumber(bagSizeKg ? bagSizeKg.value : "");
      const gramsPerPet = toNumber(gramsPerPetPerDay ? gramsPerPetPerDay.value : "");

      const wetPerDay = toNumber(wetFoodCostPerDay ? wetFoodCostPerDay.value : "");
      const treatsPerWeek = toNumber(treatsCostPerWeek ? treatsCostPerWeek.value : "");
      const wastagePct = toNumber(wastagePercent ? wastagePercent.value : "");
      const deliveryFee = toNumber(deliveryFeePerOrder ? deliveryFeePerOrder.value : "");
      const ordersMonth = toNumber(ordersPerMonth ? ordersPerMonth.value : "");

      // Basic existence guard
      if (!petsCount || !bagPrice || !bagSizeKg || !gramsPerPetPerDay) return;

      // Validation (required)
      if (!validatePositive(pets, "number of pets")) return;
      if (!validatePositive(pricePerBag, "bag price")) return;
      if (!validatePositive(sizeKg, "bag size (kg)")) return;
      if (!validatePositive(gramsPerPet, "grams per pet per day")) return;

      // Validation (optional, treat blank as 0)
      const wetPerDaySafe = Number.isFinite(wetPerDay) ? wetPerDay : 0;
      const treatsPerWeekSafe = Number.isFinite(treatsPerWeek) ? treatsPerWeek : 0;
      const wastagePctSafe = Number.isFinite(wastagePct) ? wastagePct : 0;
      const deliveryFeeSafe = Number.isFinite(deliveryFee) ? deliveryFee : 0;
      const ordersMonthSafe = Number.isFinite(ordersMonth) ? ordersMonth : 0;

      if (!validateNonNegative(wetPerDaySafe, "wet food cost per day")) return;
      if (!validateNonNegative(treatsPerWeekSafe, "treats cost per week")) return;
      if (!validateNonNegative(wastagePctSafe, "wastage percentage")) return;
      if (!validateNonNegative(deliveryFeeSafe, "delivery fee per order")) return;
      if (!validateNonNegative(ordersMonthSafe, "orders per month")) return;

      // Calculation logic
      const bagGrams = sizeKg * 1000;
      const totalGramsPerDay = gramsPerPet * pets;

      if (!Number.isFinite(bagGrams) || bagGrams <= 0) {
        setResultError("Enter a valid bag size (kg) greater than 0.");
        return;
      }
      if (!Number.isFinite(totalGramsPerDay) || totalGramsPerDay <= 0) {
        setResultError("Enter a valid daily feeding amount greater than 0.");
        return;
      }
      if (totalGramsPerDay > bagGrams) {
        setResultError("Your daily grams exceed the total bag grams. Check bag size and daily feeding amount.");
        return;
      }

      const costPerGram = pricePerBag / bagGrams;
      const dryCostPerDay = costPerGram * totalGramsPerDay;

      const treatsPerDay = treatsPerWeekSafe / 7;
      const deliveryPerDay = (deliveryFeeSafe * ordersMonthSafe) / 30;

      const foodBasePerDay = dryCostPerDay + wetPerDaySafe;
      const wastageMultiplier = 1 + (wastagePctSafe / 100);
      const foodAfterWastagePerDay = foodBasePerDay * wastageMultiplier;

      const totalPerDay = foodAfterWastagePerDay + treatsPerDay + deliveryPerDay;

      const totalPerWeek = totalPerDay * 7;
      const totalPer30Days = totalPerDay * 30;
      const totalPerYear = totalPerDay * 365;

      const daysPerBag = bagGrams / totalGramsPerDay;
      const bagsPer30Days = 30 / daysPerBag;

      // Output HTML
      const resultHtml = `
        <p><strong>Estimated total cost:</strong></p>
        <ul>
          <li><strong>Per day:</strong> ${formatNumberTwoDecimals(totalPerDay)}</li>
          <li><strong>Per week:</strong> ${formatNumberTwoDecimals(totalPerWeek)}</li>
          <li><strong>Per 30 days:</strong> ${formatNumberTwoDecimals(totalPer30Days)}</li>
          <li><strong>Per year:</strong> ${formatNumberTwoDecimals(totalPerYear)}</li>
        </ul>

        <p><strong>Dry food purchase planning:</strong></p>
        <ul>
          <li><strong>Bag lasts:</strong> ${formatNumberTwoDecimals(daysPerBag)} days</li>
          <li><strong>Bags needed per 30 days:</strong> ${formatNumberTwoDecimals(bagsPer30Days)}</li>
          <li><strong>Dry food cost per day:</strong> ${formatNumberTwoDecimals(dryCostPerDay)}</li>
        </ul>

        <p><strong>Included (optional):</strong></p>
        <ul>
          <li><strong>Wet food per day:</strong> ${formatNumberTwoDecimals(wetPerDaySafe)}</li>
          <li><strong>Treats per day (from weekly):</strong> ${formatNumberTwoDecimals(treatsPerDay)}</li>
          <li><strong>Delivery per day (spread across month):</strong> ${formatNumberTwoDecimals(deliveryPerDay)}</li>
          <li><strong>Wastage applied to food only:</strong> ${formatNumberTwoDecimals(wastagePctSafe)}%</li>
        </ul>
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
      const message = "Pet Food Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
