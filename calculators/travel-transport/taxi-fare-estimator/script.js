document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const distanceKmInput = document.getElementById("distanceKm");
  const waitingMinutesInput = document.getElementById("waitingMinutes");

  const baseFareInput = document.getElementById("baseFare");
  const ratePerKmInput = document.getElementById("ratePerKm");
  const ratePerMinuteInput = document.getElementById("ratePerMinute");
  const bookingFeeInput = document.getElementById("bookingFee");
  const tollsInput = document.getElementById("tolls");
  const minimumFareInput = document.getElementById("minimumFare");
  const surgeMultiplierInput = document.getElementById("surgeMultiplier");
  const tipPercentInput = document.getElementById("tipPercent");

  // Set practical defaults (user can override)
  if (baseFareInput && !baseFareInput.value) baseFareInput.value = "2.50";
  if (ratePerKmInput && !ratePerKmInput.value) ratePerKmInput.value = "1.50";
  if (ratePerMinuteInput && !ratePerMinuteInput.value) ratePerMinuteInput.value = "0.30";
  if (bookingFeeInput && !bookingFeeInput.value) bookingFeeInput.value = "0";
  if (tollsInput && !tollsInput.value) tollsInput.value = "0";
  if (minimumFareInput && !minimumFareInput.value) minimumFareInput.value = "0";
  if (surgeMultiplierInput && !surgeMultiplierInput.value) surgeMultiplierInput.value = "1";
  if (tipPercentInput && !tipPercentInput.value) tipPercentInput.value = "0";

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceKmInput);
  attachLiveFormatting(waitingMinutesInput);
  attachLiveFormatting(baseFareInput);
  attachLiveFormatting(ratePerKmInput);
  attachLiveFormatting(ratePerMinuteInput);
  attachLiveFormatting(bookingFeeInput);
  attachLiveFormatting(tollsInput);
  attachLiveFormatting(minimumFareInput);
  attachLiveFormatting(surgeMultiplierInput);
  attachLiveFormatting(tipPercentInput);

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

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const waitingMinutes = toNumber(waitingMinutesInput ? waitingMinutesInput.value : "");

      const baseFare = toNumber(baseFareInput ? baseFareInput.value : "");
      const ratePerKm = toNumber(ratePerKmInput ? ratePerKmInput.value : "");
      const ratePerMinute = toNumber(ratePerMinuteInput ? ratePerMinuteInput.value : "");
      const bookingFee = toNumber(bookingFeeInput ? bookingFeeInput.value : "");
      const tolls = toNumber(tollsInput ? tollsInput.value : "");
      const minimumFare = toNumber(minimumFareInput ? minimumFareInput.value : "");
      const surgeMultiplier = toNumber(surgeMultiplierInput ? surgeMultiplierInput.value : "");
      const tipPercent = toNumber(tipPercentInput ? tipPercentInput.value : "");

      if (!validatePositive(distanceKm, "trip distance (km)")) return;

      if (!validateNonNegative(waitingMinutes, "waiting time (minutes)")) return;

      if (!validateNonNegative(baseFare, "base fare")) return;
      if (!validateNonNegative(ratePerKm, "rate per km")) return;
      if (!validateNonNegative(ratePerMinute, "rate per minute of waiting")) return;
      if (!validateNonNegative(bookingFee, "booking or service fee")) return;
      if (!validateNonNegative(tolls, "tolls and parking")) return;
      if (!validateNonNegative(minimumFare, "minimum fare")) return;
      if (!Number.isFinite(surgeMultiplier) || surgeMultiplier < 1) {
        setResultError("Enter a valid surge multiplier of 1 or higher.");
        return;
      }
      if (!Number.isFinite(tipPercent) || tipPercent < 0 || tipPercent > 100) {
        setResultError("Enter a valid tip percent from 0 to 100.");
        return;
      }

      const distanceCost = distanceKm * ratePerKm;
      const waitingCost = waitingMinutes * ratePerMinute;

      let coreFare = baseFare + distanceCost + waitingCost + bookingFee;
      if (minimumFare > 0 && coreFare < minimumFare) coreFare = minimumFare;

      const surgedCoreFare = coreFare * surgeMultiplier;
      const fareBeforeTip = surgedCoreFare + tolls;

      const tipAmount = fareBeforeTip * (tipPercent / 100);
      const totalFare = fareBeforeTip + tipAmount;

      const costPerKm = distanceKm > 0 ? totalFare / distanceKm : 0;

      const resultHtml =
        `<p><strong>Estimated total fare:</strong> ${formatNumberTwoDecimals(totalFare)}</p>` +
        `<p><strong>Fare before tip:</strong> ${formatNumberTwoDecimals(fareBeforeTip)}</p>` +
        `<p><strong>Cost per km (approx):</strong> ${formatNumberTwoDecimals(costPerKm)}</p>` +
        `<hr>` +
        `<p><strong>Breakdown:</strong></p>` +
        `<ul>` +
        `<li>Base fare: ${formatNumberTwoDecimals(baseFare)}</li>` +
        `<li>Distance cost (${distanceKm} km × ${formatNumberTwoDecimals(ratePerKm)}): ${formatNumberTwoDecimals(distanceCost)}</li>` +
        `<li>Waiting cost (${waitingMinutes} min × ${formatNumberTwoDecimals(ratePerMinute)}): ${formatNumberTwoDecimals(waitingCost)}</li>` +
        `<li>Booking/service fee: ${formatNumberTwoDecimals(bookingFee)}</li>` +
        `<li>Minimum fare applied: ${minimumFare > 0 && (baseFare + distanceCost + waitingCost + bookingFee) < minimumFare ? "Yes" : "No"}</li>` +
        `<li>Surge multiplier: ${surgeMultiplier.toFixed(2)}</li>` +
        `<li>Tolls/parking: ${formatNumberTwoDecimals(tolls)}</li>` +
        `<li>Tip (${tipPercent.toFixed(0)}%): ${formatNumberTwoDecimals(tipAmount)}</li>` +
        `</ul>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Taxi Fare Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
