document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const ageYearsInput = document.getElementById("ageYears");
  const sexSelect = document.getElementById("sex");
  const weightKgInput = document.getElementById("weightKg");
  const walkTimeInput = document.getElementById("walkTime");
  const finishHrInput = document.getElementById("finishHr");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(ageYearsInput);
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(finishHrInput);

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
  // 4) VALIDATION HELPERS
  // ------------------------------------------------------------
  function validateRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    if (value < min || value > max) {
      setResultError("Enter a " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function parseTimeToMinutes(raw) {
    const s = (raw || "").trim();
    if (!s) return NaN;

    // Accept mm:ss
    if (s.includes(":")) {
      const parts = s.split(":");
      if (parts.length !== 2) return NaN;

      const mm = toNumber(parts[0]);
      const ss = toNumber(parts[1]);

      if (!Number.isFinite(mm) || !Number.isFinite(ss)) return NaN;
      if (mm < 0 || ss < 0 || ss >= 60) return NaN;

      return mm + ss / 60;
    }

    // Accept decimal minutes
    const mins = toNumber(s);
    return mins;
  }

  function getFitnessBand(vo2) {
    // Deliberately simple, adult-oriented, and clearly "rough"
    if (!Number.isFinite(vo2)) return "";
    if (vo2 < 30) return "Low (rough adult estimate)";
    if (vo2 < 40) return "Fair (rough adult estimate)";
    if (vo2 < 50) return "Good (rough adult estimate)";
    return "Excellent (rough adult estimate)";
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (!ageYearsInput || !sexSelect || !weightKgInput || !walkTimeInput || !finishHrInput) return;

      clearResult();

      const ageYears = toNumber(ageYearsInput.value);
      const sex = (sexSelect.value || "female").toLowerCase();
      const weightKg = toNumber(weightKgInput.value);
      const timeMinutes = parseTimeToMinutes(walkTimeInput.value);
      const finishHr = toNumber(finishHrInput.value);

      if (!validateRange(ageYears, "age", 13, 90)) return;
      if (!validateRange(weightKg, "weight (kg)", 30, 250)) return;

      if (!Number.isFinite(timeMinutes)) {
        setResultError("Enter a valid walk time in mm:ss (for example 14:30) or minutes (for example 14.5).");
        return;
      }
      if (timeMinutes <= 0) {
        setResultError("Enter a valid walk time greater than 0.");
        return;
      }
      if (!validateRange(timeMinutes, "walk time (minutes)", 8, 30)) return;
      if (!validateRange(finishHr, "finish heart rate (bpm)", 60, 220)) return;

      const genderCode = sex === "male" ? 1 : 0;

      // Rockport 1-mile walk test equation uses weight in pounds
      const weightLb = weightKg * 2.2046226218;

      const vo2 =
        132.853 -
        0.0769 * weightLb -
        0.3877 * ageYears +
        6.315 * genderCode -
        3.2649 * timeMinutes -
        0.1565 * finishHr;

      if (!Number.isFinite(vo2) || vo2 <= 0) {
        setResultError("Unable to compute a realistic estimate from these inputs. Recheck your time format, distance, and heart rate.");
        return;
      }

      // Supporting figures
      const mets = vo2 / 3.5;
      const paceMinPerKm = timeMinutes / 1.609344;
      const paceMinutes = Math.floor(paceMinPerKm);
      const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
      const paceSecondsPadded = String(paceSeconds === 60 ? 0 : paceSeconds).padStart(2, "0");
      const paceMinutesAdjusted = paceSeconds === 60 ? paceMinutes + 1 : paceMinutes;

      const band = getFitnessBand(vo2);

      const resultHtml =
        `<div class="result-grid">` +
          `<div class="result-row"><span class="result-label">Estimated VO2 max:</span><span class="result-value">${formatNumberTwoDecimals(vo2)} mL/kg/min</span></div>` +
          `<div class="result-row"><span>Rough fitness band:</span><span><strong>${band}</strong></span></div>` +
          `<div class="result-row"><span>Equivalent METs:</span><span><strong>${formatNumberTwoDecimals(mets)}</strong></span></div>` +
          `<div class="result-row"><span>Your test pace:</span><span><strong>${paceMinutesAdjusted}:${paceSecondsPadded} min/km</strong></span></div>` +
        `</div>` +
        `<p style="margin-top:10px;">Use this as a repeatable benchmark. Retest on the same route and conditions to track trend, not perfection.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "VO2 Max Estimate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
