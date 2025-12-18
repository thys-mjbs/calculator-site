document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startLatInput = document.getElementById("startLat");
  const startLonInput = document.getElementById("startLon");
  const endLatInput = document.getElementById("endLat");
  const endLonInput = document.getElementById("endLon");
  const unitSelect = document.getElementById("unitSelect");
  const detourPercentInput = document.getElementById("detourPercent");
  const avgSpeedInput = document.getElementById("avgSpeed");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Detour and speed can benefit from light formatting (commas)
  attachLiveFormatting(detourPercentInput);
  attachLiveFormatting(avgSpeedInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateLat(lat, label) {
    if (!Number.isFinite(lat)) {
      setResultError("Enter a valid " + label + " (a number).");
      return false;
    }
    if (lat < -90 || lat > 90) {
      setResultError(label + " must be between -90 and 90.");
      return false;
    }
    return true;
  }

  function validateLon(lon, label) {
    if (!Number.isFinite(lon)) {
      setResultError("Enter a valid " + label + " (a number).");
      return false;
    }
    if (lon < -180 || lon > 180) {
      setResultError(label + " must be between -180 and 180.");
      return false;
    }
    return true;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  function toRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    // Mean Earth radius in km
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function minutesToHm(totalMinutes) {
    const mins = Math.round(totalMinutes);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return m + " min";
    return h + " h " + m + " min";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const startLat = toNumber(startLatInput ? startLatInput.value : "");
      const startLon = toNumber(startLonInput ? startLonInput.value : "");
      const endLat = toNumber(endLatInput ? endLatInput.value : "");
      const endLon = toNumber(endLonInput ? endLonInput.value : "");

      const unit = unitSelect ? unitSelect.value : "km";

      // Optional inputs with defaults
      let detourPercent = toNumber(detourPercentInput ? detourPercentInput.value : "");
      if (!Number.isFinite(detourPercent)) detourPercent = 15;
      detourPercent = clamp(detourPercent, 0, 100);

      let avgSpeed = toNumber(avgSpeedInput ? avgSpeedInput.value : "");
      if (!Number.isFinite(avgSpeed) || avgSpeed <= 0) {
        avgSpeed = unit === "mi" ? 50 : 80;
      }

      // Existence guard
      if (!startLatInput || !startLonInput || !endLatInput || !endLonInput) return;

      // Validation
      if (!validateLat(startLat, "Start latitude")) return;
      if (!validateLon(startLon, "Start longitude")) return;
      if (!validateLat(endLat, "End latitude")) return;
      if (!validateLon(endLon, "End longitude")) return;

      if (!Number.isFinite(avgSpeed) || avgSpeed <= 0) {
        setResultError("Enter a valid average speed greater than 0, or leave it blank to use the default.");
        return;
      }

      // Calculation logic
      const straightKm = haversineKm(startLat, startLon, endLat, endLon);
      const detourMultiplier = 1 + detourPercent / 100;
      const roadKm = straightKm * detourMultiplier;

      // Provide a simple sensitivity range (+/- 5% of detour factor)
      const detourLow = clamp(detourPercent - 5, 0, 100);
      const detourHigh = clamp(detourPercent + 5, 0, 100);
      const roadKmLow = straightKm * (1 + detourLow / 100);
      const roadKmHigh = straightKm * (1 + detourHigh / 100);

      // Unit conversion
      const kmToMi = 0.621371;
      const straight = unit === "mi" ? straightKm * kmToMi : straightKm;
      const road = unit === "mi" ? roadKm * kmToMi : roadKm;
      const roadLow = unit === "mi" ? roadKmLow * kmToMi : roadKmLow;
      const roadHigh = unit === "mi" ? roadKmHigh * kmToMi : roadKmHigh;

      // Time
      const hours = road / avgSpeed;
      const minutes = hours * 60;

      const unitLabel = unit === "mi" ? "mi" : "km";
      const speedLabel = unit === "mi" ? "mph" : "km/h";

      // Build output HTML
      const resultHtml = `
        <p><strong>Straight-line distance:</strong> ${formatNumberTwoDecimals(straight)} ${unitLabel}</p>
        <p><strong>Estimated road distance:</strong> ${formatNumberTwoDecimals(road)} ${unitLabel}</p>
        <p><strong>Estimated travel time:</strong> ${minutesToHm(minutes)} (at ${formatNumberTwoDecimals(avgSpeed)} ${speedLabel})</p>
        <p><strong>Quick range:</strong> ${formatNumberTwoDecimals(roadLow)} to ${formatNumberTwoDecimals(roadHigh)} ${unitLabel} (using detour ${detourLow}% to ${detourHigh}%)</p>
        <p><strong>Assumptions used:</strong> Detour factor ${formatNumberTwoDecimals(detourPercent)}% and average speed ${formatNumberTwoDecimals(avgSpeed)} ${speedLabel}.</p>
      `;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Route Distance Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
