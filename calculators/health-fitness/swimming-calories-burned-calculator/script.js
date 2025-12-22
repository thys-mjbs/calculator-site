document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const durationMinutesInput = document.getElementById("durationMinutes");
  const intensityMetSelect = document.getElementById("intensityMet");
  const bodyWeightInput = document.getElementById("bodyWeight");
  const weightUnitSelect = document.getElementById("weightUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(durationMinutesInput);
  attachLiveFormatting(bodyWeightInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const minutes = toNumber(durationMinutesInput ? durationMinutesInput.value : "");
      const met = toNumber(intensityMetSelect ? intensityMetSelect.value : "");

      const weightRaw = toNumber(bodyWeightInput ? bodyWeightInput.value : "");
      const unit = weightUnitSelect ? weightUnitSelect.value : "kg";

      if (!durationMinutesInput || !intensityMetSelect) return;

      if (!validatePositive(minutes, "swim time (minutes)")) return;

      if (!Number.isFinite(met) || met <= 0) {
        setResultError("Select an intensity to calculate calories burned.");
        return;
      }

      let weightKg = 70;
      let weightSource = "Default 70 kg";

      if (Number.isFinite(weightRaw) && weightRaw > 0) {
        if (unit === "lb") {
          weightKg = weightRaw / 2.2046226218;
          weightSource = "Your weight (" + formatNumberTwoDecimals(weightRaw) + " lb)";
        } else {
          weightKg = weightRaw;
          weightSource = "Your weight (" + formatNumberTwoDecimals(weightRaw) + " kg)";
        }
      } else if (Number.isFinite(weightRaw) && weightRaw < 0) {
        setResultError("Enter a valid body weight (leave blank to use the default).");
        return;
      }

      if (!validatePositive(weightKg, "body weight")) return;

      if (weightKg < 20 || weightKg > 300) {
        setResultError("Body weight looks unrealistic. Enter a value between 20 kg and 300 kg, or leave it blank to use the default.");
        return;
      }

      // Standard MET calorie formula:
      // kcal/min = (MET * 3.5 * weightKg) / 200
      // total kcal = kcal/min * minutes
      const kcalPerMinute = (met * 3.5 * weightKg) / 200;
      const totalKcal = kcalPerMinute * minutes;

      const per30 = kcalPerMinute * 30;
      const per60 = kcalPerMinute * 60;

      const resultHtml = `
        <p><strong>Estimated calories burned:</strong> ${formatNumberTwoDecimals(totalKcal)} kcal</p>
        <p><strong>At the same effort:</strong></p>
        <ul>
          <li><strong>Per 30 minutes:</strong> ${formatNumberTwoDecimals(per30)} kcal</li>
          <li><strong>Per hour:</strong> ${formatNumberTwoDecimals(per60)} kcal</li>
        </ul>
        <p><strong>Assumptions used:</strong> ${weightSource}, intensity level based on your selection.</p>
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
      const message = "Swimming Calories Burned Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
