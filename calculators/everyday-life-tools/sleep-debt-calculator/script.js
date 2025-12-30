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
  const targetHoursInput = document.getElementById("targetHours");

  const daysCountInput = document.getElementById("daysCount");
  const avgHoursInput = document.getElementById("avgHours");

  const day1 = document.getElementById("day1");
  const day2 = document.getElementById("day2");
  const day3 = document.getElementById("day3");
  const day4 = document.getElementById("day4");
  const day5 = document.getElementById("day5");
  const day6 = document.getElementById("day6");
  const day7 = document.getElementById("day7");

  const recoveryExtraInput = document.getElementById("recoveryExtra");
  const maxSleepInput = document.getElementById("maxSleep");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeBlockQuick = document.getElementById("modeQuick");
  const modeBlockDaily = document.getElementById("modeDaily");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Hours fields generally do not need commas, so we do not attach live formatting.

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
    if (modeBlockQuick) modeBlockQuick.classList.add("hidden");
    if (modeBlockDaily) modeBlockDaily.classList.add("hidden");

    if (mode === "daily") {
      if (modeBlockDaily) modeBlockDaily.classList.remove("hidden");
    } else {
      if (modeBlockQuick) modeBlockQuick.classList.remove("hidden");
    }

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

  function validateRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function hoursToHoursMinutes(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { h: h, m: m, totalMinutes: totalMinutes };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "quick";

      // Parse base inputs
      const targetHours = toNumber(targetHoursInput ? targetHoursInput.value : "");
      const recoveryExtraRaw = toNumber(recoveryExtraInput ? recoveryExtraInput.value : "");
      const maxSleepRaw = toNumber(maxSleepInput ? maxSleepInput.value : "");

      // Defaults for optional advanced inputs
      const recoveryExtra = Number.isFinite(recoveryExtraRaw) && recoveryExtraRaw > 0 ? recoveryExtraRaw : 1;
      const maxSleep = Number.isFinite(maxSleepRaw) && maxSleepRaw > 0 ? maxSleepRaw : 9;

      // Existence guard
      if (!targetHoursInput) return;

      // Validate target first (required)
      if (!validateRange(targetHours, "target sleep per night (hours)", 4, 12)) return;

      // Validate advanced (optional but must be sensible if provided)
      if (!validateRange(recoveryExtra, "extra sleep per night (hours)", 0.25, 4)) return;
      if (!validateRange(maxSleep, "maximum sleep per night (hours)", 6, 14)) return;
      if (maxSleep < targetHours) {
        setResultError("Your maximum sleep per night cannot be lower than your target sleep per night.");
        return;
      }

      let debtHours = 0;
      let periodDaysUsed = 0;

      if (mode === "daily") {
        const dayInputs = [day1, day2, day3, day4, day5, day6, day7];

        for (let i = 0; i < dayInputs.length; i++) {
          const el = dayInputs[i];
          if (!el) continue;

          const raw = (el.value || "").trim();
          if (raw === "") continue;

          const sleepHours = toNumber(raw);
          if (!Number.isFinite(sleepHours)) {
            setResultError("Enter a valid number of hours for Night " + (i + 1) + ".");
            return;
          }
          if (sleepHours < 0 || sleepHours > 24) {
            setResultError("Night " + (i + 1) + " must be between 0 and 24 hours.");
            return;
          }

          periodDaysUsed += 1;

          const shortfall = targetHours - sleepHours;
          if (shortfall > 0) debtHours += shortfall;
        }

        if (periodDaysUsed === 0) {
          setResultError("Enter at least one night in Daily entries, or switch to Quick estimate.");
          return;
        }
      } else {
        // Quick mode
        const daysCount = toNumber(daysCountInput ? daysCountInput.value : "");
        const avgHours = toNumber(avgHoursInput ? avgHoursInput.value : "");

        if (!validatePositive(daysCount, "number of days")) return;
        if (!validateRange(daysCount, "number of days", 1, 30)) return;

        if (!Number.isFinite(avgHours)) {
          setResultError("Enter a valid average sleep per night (hours).");
          return;
        }
        if (!validateRange(avgHours, "average sleep per night (hours)", 0, 24)) return;

        periodDaysUsed = Math.round(daysCount);
        const shortfallPerNight = targetHours - avgHours;
        debtHours = shortfallPerNight > 0 ? shortfallPerNight * periodDaysUsed : 0;
      }

      // Secondary computations
      const debtHM = hoursToHoursMinutes(debtHours);
      const nightsAtTargetEquivalent = targetHours > 0 ? debtHours / targetHours : 0;

      // Recovery timeline: repay debt by adding extra sleep per night, respecting maxSleep cap
      const maxExtraPossible = maxSleep - targetHours;
      const effectiveExtra = Math.min(recoveryExtra, maxExtraPossible);

      let recoveryNights = 0;
      if (debtHours <= 0.0001) {
        recoveryNights = 0;
      } else if (effectiveExtra <= 0.0001) {
        recoveryNights = Infinity;
      } else {
        recoveryNights = Math.ceil(debtHours / effectiveExtra);
      }

      // Build result HTML
      let resultHtml = "";

      if (debtHours <= 0.0001) {
        resultHtml = `
          <p><strong>Sleep debt:</strong> 0 hours</p>
          <p>You are not behind your target for the period you entered. If you still feel tired, the issue may be sleep quality, timing, stress, illness, or inconsistent schedules rather than simple shortage.</p>
        `;
        setResultSuccess(resultHtml);
        return;
      }

      const debtHoursFormatted = formatNumberTwoDecimals(debtHours);
      const nightsEqFormatted = formatNumberTwoDecimals(nightsAtTargetEquivalent);
      const debtMinutesFormatted = debtHM.totalMinutes.toString();

      let recoveryLine = "";
      if (recoveryNights === Infinity) {
        recoveryLine = `<p><strong>Recovery timeline:</strong> Not calculable with your settings (your extra sleep per night is effectively 0 after caps).</p>`;
      } else {
        const effectiveExtraFormatted = formatNumberTwoDecimals(effectiveExtra);
        recoveryLine = `<p><strong>Recovery timeline:</strong> About <strong>${recoveryNights}</strong> nights if you add <strong>${effectiveExtraFormatted}</strong> extra hours per night (capped by your maximum sleep setting).</p>`;
      }

      const modeLabel = mode === "daily" ? "Daily entries" : "Quick estimate";
      const periodLabel = mode === "daily" ? `${periodDaysUsed} nights entered` : `${periodDaysUsed} days`;

      const capNote =
        recoveryExtra > maxExtraPossible
          ? `<p><em>Note:</em> Your requested extra sleep per night was capped by your maximum sleep setting. With a target of ${formatNumberTwoDecimals(targetHours)}h and a max of ${formatNumberTwoDecimals(maxSleep)}h, your maximum extra is ${formatNumberTwoDecimals(maxExtraPossible)}h.</p>`
          : "";

      resultHtml = `
        <p><strong>Sleep debt:</strong> ${debtHM.h}h ${debtHM.m}m (${debtHoursFormatted} hours, about ${debtMinutesFormatted} minutes)</p>
        <p><strong>Based on:</strong> ${modeLabel} (${periodLabel}) with a target of ${formatNumberTwoDecimals(targetHours)} hours/night.</p>
        <p><strong>What this means:</strong> Your shortage equals about <strong>${nightsEqFormatted}</strong> full nights of sleep at your target (as a rough equivalence).</p>
        ${recoveryLine}
        ${capNote}
        <p><strong>Practical next step:</strong> Pick a recovery pace you can keep for a week. Many people do better adding 30 to 90 minutes per night consistently than trying to “fix it” in one weekend.</p>
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
      const message = "Sleep Debt Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
