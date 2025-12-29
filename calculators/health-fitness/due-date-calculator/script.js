document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lmpDateInput = document.getElementById("lmpDate");
  const cycleLengthDaysInput = document.getElementById("cycleLengthDays");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Cycle length is numeric and can be formatted safely
  attachLiveFormatting(cycleLengthDaysInput);

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
  function isValidCycleLength(n) {
    return Number.isFinite(n) && n >= 20 && n <= 45;
  }

  function parseISODateStrict(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;

    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const dt = new Date(year, month - 1, day);
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day
    ) {
      return null;
    }

    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  function startOfToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }

  function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatDateISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function daysBetween(startDate, endDate) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / msPerDay);
  }

  function formatWeeksDays(totalDays) {
    const safe = Math.max(0, Math.floor(totalDays));
    const w = Math.floor(safe / 7);
    const d = safe % 7;
    return { weeks: w, days: d };
  }

  function getTrimester(weeks) {
    if (weeks < 14) return "First trimester";
    if (weeks < 28) return "Second trimester";
    return "Third trimester";
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!lmpDateInput) return;

      const lmp = parseISODateStrict(lmpDateInput.value);
      if (!lmp) {
        setResultError("Enter a valid LMP date in YYYY-MM-DD format.");
        return;
      }

      const today = startOfToday();
      const rawDaysSinceLmp = daysBetween(lmp, today);

      if (!Number.isFinite(rawDaysSinceLmp)) {
        setResultError("Enter a valid LMP date in YYYY-MM-DD format.");
        return;
      }

      if (rawDaysSinceLmp < 0) {
        setResultError("Your LMP date cannot be in the future. Enter a past date.");
        return;
      }

      // Optional cycle length (default 28)
      let cycleLength = 28;
      const cycleRaw = cycleLengthDaysInput ? String(cycleLengthDaysInput.value || "").trim() : "";
      if (cycleRaw !== "") {
        const parsed = toNumber(cycleRaw);
        if (!isValidCycleLength(parsed)) {
          setResultError("Enter a realistic cycle length between 20 and 45 days, or leave it blank.");
          return;
        }
        cycleLength = parsed;
      }

      const cycleAdjustment = cycleLength - 28;

      // LMP-based EDD with simple cycle adjustment
      const edd = addDays(lmp, 280 + cycleAdjustment);

      // Adjust gestational age for cycle length so longer cycles show slightly lower GA
      const adjustedDaysSinceLmp = rawDaysSinceLmp - cycleAdjustment;
      const ga = formatWeeksDays(adjustedDaysSinceLmp);
      const trimester = getTrimester(ga.weeks);

      const daysToDueDate = daysBetween(today, edd);
      const countdown = daysToDueDate >= 0
        ? (daysToDueDate + " days remaining (estimate)")
        : (Math.abs(daysToDueDate) + " days past the estimate");

      // Simple milestone dates (shifted with the same adjustment)
      const estimatedConception = addDays(lmp, 14 + cycleAdjustment);
      const endFirstTrimester = addDays(lmp, (13 * 7 + 6) + cycleAdjustment); // 13w6d
      const startSecondTrimester = addDays(lmp, (14 * 7) + cycleAdjustment); // 14w0d
      const startThirdTrimester = addDays(lmp, (28 * 7) + cycleAdjustment); // 28w0d

      const scanWindowStart = addDays(lmp, (11 * 7) + cycleAdjustment); // 11w0d
      const scanWindowEnd = addDays(lmp, (13 * 7 + 6) + cycleAdjustment); // 13w6d

      const resultHtml =
        `<div class="result-grid">
          <div class="result-row">
            <strong>Estimated due date:</strong><br>
            ${formatDateISO(edd)}
            <div class="muted">Based on LMP and a ${cycleLength}-day cycle.</div>
          </div>

          <div class="result-row">
            <strong>Gestational age today:</strong><br>
            ${ga.weeks} weeks ${ga.days} days
            <div class="muted">${trimester}</div>
          </div>

          <div class="result-row">
            <strong>Countdown:</strong><br>
            ${countdown}
          </div>

          <div class="result-row">
            <strong>Planning milestones (estimates):</strong><br>
            Estimated conception: ${formatDateISO(estimatedConception)}<br>
            First trimester ends: ${formatDateISO(endFirstTrimester)}<br>
            Second trimester starts: ${formatDateISO(startSecondTrimester)}<br>
            Third trimester starts: ${formatDateISO(startThirdTrimester)}<br>
            12-week scan window: ${formatDateISO(scanWindowStart)} to ${formatDateISO(scanWindowEnd)}
          </div>
        </div>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Due Date Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
