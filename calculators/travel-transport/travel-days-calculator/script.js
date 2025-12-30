document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const countMethodSelect = document.getElementById("countMethod");
  const showBreakdownInput = document.getElementById("showBreakdown");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma-formatting needed for date/select/checkbox inputs.

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
  function parseDateFromInput(value) {
    if (!value || typeof value !== "string") return null;
    const d = new Date(value + "T00:00:00");
    if (!Number.isFinite(d.getTime())) return null;
    return d;
  }

  function daysBetweenExclusive(startDate, endDate) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / msPerDay);
  }

  function countWeekdayWeekend(startDate, endDate, inclusiveEnd) {
    // Counts days from startDate up to endDate, inclusiveEnd decides whether endDate is included.
    let weekdays = 0;
    let weekends = 0;

    const totalExclusive = daysBetweenExclusive(startDate, endDate);
    const spanDays = inclusiveEnd ? totalExclusive + 1 : totalExclusive;

    for (let i = 0; i < spanDays; i++) {
      const d = new Date(startDate.getTime());
      d.setDate(d.getDate() + i);
      const day = d.getDay(); // 0 Sun ... 6 Sat
      if (day === 0 || day === 6) weekends++;
      else weekdays++;
    }

    return { weekdays, weekends };
  }

  function weeksAndDays(totalDays) {
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    return { weeks, days };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!startDateInput || !endDateInput || !countMethodSelect) return;

      const startDate = parseDateFromInput(startDateInput.value);
      const endDate = parseDateFromInput(endDateInput.value);

      if (!startDate) {
        setResultError("Select a valid start date.");
        return;
      }

      if (!endDate) {
        setResultError("Select a valid end date.");
        return;
      }

      const exclusiveDays = daysBetweenExclusive(startDate, endDate);

      if (!Number.isFinite(exclusiveDays)) {
        setResultError("Enter valid dates.");
        return;
      }

      if (exclusiveDays < 0) {
        setResultError("End date must be the same as or after the start date.");
        return;
      }

      const method = countMethodSelect.value || "inclusive";

      let primaryLabel = "";
      let primaryValue = 0;

      if (method === "inclusive") {
        primaryLabel = "Travel days (inclusive)";
        primaryValue = exclusiveDays + 1;
      } else if (method === "exclusive") {
        primaryLabel = "Travel days (exclusive)";
        primaryValue = exclusiveDays;
      } else {
        primaryLabel = "Nights away";
        primaryValue = exclusiveDays;
      }

      const nights = exclusiveDays;
      const w = weeksAndDays(primaryValue);

      let breakdownHtml = "";
      const showBreakdown = !!(showBreakdownInput && showBreakdownInput.checked);

      if (showBreakdown) {
        const inclusiveEnd = method === "inclusive";
        const breakdown = countWeekdayWeekend(startDate, endDate, inclusiveEnd);
        breakdownHtml = `
          <p><strong>Weekdays:</strong> ${breakdown.weekdays} &nbsp; <strong>Weekend days:</strong> ${breakdown.weekends}</p>
        `;
      }

      const resultHtml = `
        <p><strong>${primaryLabel}:</strong> ${primaryValue}</p>
        <p><strong>Weeks + days:</strong> ${w.weeks} week(s) and ${w.days} day(s)</p>
        <p><strong>Nights (midnights between dates):</strong> ${nights}</p>
        ${breakdownHtml}
        <p><strong>Interpretation:</strong> Use inclusive for “days away” policies, exclusive for “days between dates,” and nights for accommodation planning.</p>
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
      const message = "Travel Days Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
