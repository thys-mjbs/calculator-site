document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wordCountInput = document.getElementById("wordCount");
  const writingSpeedWphInput = document.getElementById("writingSpeedWph");

  const toggleAdvancedButton = document.getElementById("toggleAdvancedButton");
  const advancedSection = document.getElementById("advancedSection");

  const planningMinutesInput = document.getElementById("planningMinutes");
  const researchMinutesInput = document.getElementById("researchMinutes");
  const editingMinutesPer1000Input = document.getElementById("editingMinutesPer1000");
  const breakPercentInput = document.getElementById("breakPercent");

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
  attachLiveFormatting(wordCountInput);
  attachLiveFormatting(writingSpeedWphInput);
  attachLiveFormatting(planningMinutesInput);
  attachLiveFormatting(researchMinutesInput);
  attachLiveFormatting(editingMinutesPer1000Input);
  attachLiveFormatting(breakPercentInput);

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
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function minutesToHuman(totalMinutes) {
    const m = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(m / 60);
    const mins = m % 60;

    if (hours <= 0) return mins + " min";
    if (mins === 0) return hours + " hr";
    return hours + " hr " + mins + " min";
  }

  // ------------------------------------------------------------
  // UI: Advanced toggle
  // ------------------------------------------------------------
  if (toggleAdvancedButton && advancedSection) {
    toggleAdvancedButton.addEventListener("click", function () {
      const isHidden = advancedSection.classList.contains("hidden");
      if (isHidden) {
        advancedSection.classList.remove("hidden");
        toggleAdvancedButton.textContent = "Hide advanced options";
        toggleAdvancedButton.setAttribute("aria-expanded", "true");
      } else {
        advancedSection.classList.add("hidden");
        toggleAdvancedButton.textContent = "Show advanced options";
        toggleAdvancedButton.setAttribute("aria-expanded", "false");
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const wordCount = toNumber(wordCountInput ? wordCountInput.value : "");
      const writingSpeedWphRaw = toNumber(writingSpeedWphInput ? writingSpeedWphInput.value : "");

      // Existence guard
      if (!wordCountInput || !writingSpeedWphInput) return;

      // Required validation
      if (!validatePositive(wordCount, "target word count")) return;

      // Writing speed defaults and validation
      let writingSpeedWph = writingSpeedWphRaw;
      if (!Number.isFinite(writingSpeedWph) || writingSpeedWph <= 0) {
        writingSpeedWph = 500;
      }

      // Defensive bounds to prevent nonsense inputs
      writingSpeedWph = clamp(writingSpeedWph, 100, 2000);

      // Advanced inputs (optional)
      const planningMinutesRaw = toNumber(planningMinutesInput ? planningMinutesInput.value : "");
      const researchMinutesRaw = toNumber(researchMinutesInput ? researchMinutesInput.value : "");
      const editingPer1000Raw = toNumber(editingMinutesPer1000Input ? editingMinutesPer1000Input.value : "");
      const breakPercentRaw = toNumber(breakPercentInput ? breakPercentInput.value : "");

      const planningMinutes = Number.isFinite(planningMinutesRaw) ? clamp(planningMinutesRaw, 0, 600) : 0;
      const researchMinutes = Number.isFinite(researchMinutesRaw) ? clamp(researchMinutesRaw, 0, 600) : 0;

      // Editing defaults if advanced section is used but field is blank
      let editingMinutesPer1000 = 0;
      if (Number.isFinite(editingPer1000Raw)) {
        editingMinutesPer1000 = clamp(editingPer1000Raw, 0, 180);
      } else {
        // Default for typical proofreading + light revision
        editingMinutesPer1000 = advancedSection && !advancedSection.classList.contains("hidden") ? 25 : 0;
      }

      let breakPercent = 0;
      if (Number.isFinite(breakPercentRaw)) {
        breakPercent = clamp(breakPercentRaw, 0, 50);
      } else {
        breakPercent = 0;
      }

      // Calculation logic
      const writingMinutes = (wordCount / writingSpeedWph) * 60;

      const editingMinutes = (wordCount / 1000) * editingMinutesPer1000;

      const workMinutesNoBreaks = writingMinutes + planningMinutes + researchMinutes + editingMinutes;

      const breakMinutes = workMinutesNoBreaks * (breakPercent / 100);

      const totalMinutes = workMinutesNoBreaks + breakMinutes;

      // Range estimate (simple: vary writing speed only, keep overhead fixed)
      const slowSpeed = clamp(writingSpeedWph * 0.8, 100, 2000);
      const fastSpeed = clamp(writingSpeedWph * 1.2, 100, 2000);

      const writingMinutesSlow = (wordCount / slowSpeed) * 60;
      const writingMinutesFast = (wordCount / fastSpeed) * 60;

      const totalSlow = (writingMinutesSlow + planningMinutes + researchMinutes + editingMinutes) + breakMinutes;
      const totalFast = (writingMinutesFast + planningMinutes + researchMinutes + editingMinutes) + breakMinutes;

      // Suggest focused work blocks (45 min work + short reset)
      const blocks45 = Math.max(1, Math.ceil(totalMinutes / 45));

      const resultHtml = `
        <p><strong>Estimated total time:</strong> ${minutesToHuman(totalMinutes)}</p>
        <p><strong>Draft writing time:</strong> ${minutesToHuman(writingMinutes)}</p>
        <p><strong>Planning + research + editing:</strong> ${minutesToHuman(planningMinutes + researchMinutes + editingMinutes)}</p>
        <p><strong>Break allowance:</strong> ${minutesToHuman(breakMinutes)} (${formatNumberTwoDecimals(breakPercent)}%)</p>
        <p><strong>Quick range (writing speed variation):</strong> ${minutesToHuman(totalFast)} to ${minutesToHuman(totalSlow)}</p>
        <p><strong>Practical plan:</strong> about ${blocks45} focused 45-minute blocks</p>
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
      const message = "Essay Word Count Time Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
