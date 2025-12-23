document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wordsReadInput = document.getElementById("wordsRead");
  const minutesInput = document.getElementById("minutes");
  const secondsInput = document.getElementById("seconds");
  const comprehensionPercentInput = document.getElementById("comprehensionPercent");
  const targetWpmInput = document.getElementById("targetWpm");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(wordsReadInput);
  attachLiveFormatting(minutesInput);
  attachLiveFormatting(secondsInput);
  attachLiveFormatting(comprehensionPercentInput);
  attachLiveFormatting(targetWpmInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  function formatMinutesToMinSec(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "";
    const totalSeconds = Math.round(totalMinutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const padded = String(secs).padStart(2, "0");
    return mins + "m " + padded + "s";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const wordsRead = toNumber(wordsReadInput ? wordsReadInput.value : "");
      const minutes = toNumber(minutesInput ? minutesInput.value : "");
      const secondsRaw = toNumber(secondsInput ? secondsInput.value : "");

      const comprehensionRaw = toNumber(
        comprehensionPercentInput ? comprehensionPercentInput.value : ""
      );
      const targetRaw = toNumber(targetWpmInput ? targetWpmInput.value : "");

      // Guards
      if (!wordsReadInput || !minutesInput || !secondsInput) return;

      // Required validation
      if (!validatePositive(wordsRead, "word count")) return;
      if (!validateNonNegative(minutes, "minutes")) return;
      if (!validateNonNegative(secondsRaw, "seconds")) return;

      // Normalize time
      const seconds = Math.floor(secondsRaw);
      const totalSeconds = Math.round(minutes * 60 + seconds);

      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        setResultError("Enter a time greater than 0 minutes.");
        return;
      }

      // Optional: comprehension and target with defaults
      let comprehension = Number.isFinite(comprehensionRaw) ? comprehensionRaw : 100;
      comprehension = clamp(comprehension, 0, 100);

      let targetWpm = Number.isFinite(targetRaw) && targetRaw > 0 ? targetRaw : 200;

      const totalMinutes = totalSeconds / 60;

      // Calculation logic
      const rawWpm = wordsRead / totalMinutes;
      const effectiveWpm = rawWpm * (comprehension / 100);

      if (!Number.isFinite(rawWpm) || rawWpm <= 0) {
        setResultError("Enter realistic values. Your time and word count must be greater than 0.");
        return;
      }

      // Practical estimates (use effective WPM for planning)
      const planningWpm = Number.isFinite(effectiveWpm) && effectiveWpm > 0 ? effectiveWpm : rawWpm;

      const minutesPer1000 = 1000 / planningWpm;
      const minutesPer250 = 250 / planningWpm;
      const minutesPer2500 = 2500 / planningWpm; // ~10 pages at 250 words/page

      const deltaPercent = ((planningWpm - targetWpm) / targetWpm) * 100;

      // Build output HTML
      const rawWpmText = formatNumberTwoDecimals(rawWpm);
      const effectiveWpmText = formatNumberTwoDecimals(effectiveWpm);
      const planningWpmText = formatNumberTwoDecimals(planningWpm);
      const targetWpmText = formatNumberTwoDecimals(targetWpm);

      const comparisonLabel =
        deltaPercent >= 0
          ? formatNumberTwoDecimals(deltaPercent) + "% above your target"
          : formatNumberTwoDecimals(Math.abs(deltaPercent)) + "% below your target";

      const resultHtml = `
        <p><strong>Raw reading speed:</strong> ${rawWpmText} WPM</p>
        <p><strong>Effective reading speed:</strong> ${effectiveWpmText} WPM <span style="color:#555555">(using ${formatNumberTwoDecimals(comprehension)}% comprehension)</span></p>
        <hr style="border:none;border-top:1px solid #e6e6e6;margin:10px 0;">
        <p><strong>Planning speed used:</strong> ${planningWpmText} WPM</p>
        <p><strong>Time per 1,000 words:</strong> ${formatMinutesToMinSec(minutesPer1000)}</p>
        <p><strong>Estimated time per page (250 words):</strong> ${formatMinutesToMinSec(minutesPer250)}</p>
        <p><strong>Estimated time for ~10 pages (2,500 words):</strong> ${formatMinutesToMinSec(minutesPer2500)}</p>
        <hr style="border:none;border-top:1px solid #e6e6e6;margin:10px 0;">
        <p><strong>Target comparison:</strong> Target ${targetWpmText} WPM, you are ${comparisonLabel}.</p>
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
      const message =
        "Words-Per-Minute Reading Speed Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
