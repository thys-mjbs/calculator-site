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
  const lutealPhaseDaysInput = document.getElementById("lutealPhaseDays");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Only numeric fields should live-format
  attachLiveFormatting(cycleLengthDaysInput);
  attachLiveFormatting(lutealPhaseDaysInput);

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
  // 4) DATE HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function parseISODateStrict(value) {
    if (typeof value !== "string") return null;
    const s = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;

    const parts = s.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const d = new Date(Date.UTC(year, month - 1, day));
    // Validate round-trip (catches invalid dates like 2025-02-30)
    if (
      d.getUTCFullYear() !== year ||
      d.getUTCMonth() !== month - 1 ||
      d.getUTCDate() !== day
    ) {
      return null;
    }
    return d;
  }

  function addDaysUTC(dateUtc, days) {
    const d = new Date(dateUtc.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  function formatDateUTC(dateUtc) {
    const y = dateUtc.getUTCFullYear();
    const m = String(dateUtc.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateUtc.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!lmpDateInput || !cycleLengthDaysInput || !lutealPhaseDaysInput) return;

      const lmpRaw = (lmpDateInput.value || "").trim();
      const lmpDate = parseISODateStrict(lmpRaw);
      if (!lmpDate) {
        setResultError("Enter the first day of your last period in YYYY-MM-DD format (for example 2025-12-01).");
        return;
      }

      // Defaults (optional inputs)
      const cycleLength = toNumber(cycleLengthDaysInput.value);
      const luteal = toNumber(lutealPhaseDaysInput.value);

      const cycleLengthUsed = Number.isFinite(cycleLength) && cycleLength > 0 ? cycleLength : 28;
      const lutealUsed = Number.isFinite(luteal) && luteal > 0 ? luteal : 14;

      // Range validation (practical, not clinical)
      if (cycleLengthUsed < 20 || cycleLengthUsed > 45) {
        setResultError("Enter a realistic average cycle length between 20 and 45 days (or leave it blank for 28).");
        return;
      }

      if (lutealUsed < 10 || lutealUsed > 17) {
        setResultError("Enter a realistic luteal phase length between 10 and 17 days (or leave it blank for 14).");
        return;
      }

      if (lutealUsed >= cycleLengthUsed) {
        setResultError("Luteal phase length must be shorter than your cycle length. Use a luteal phase like 14 days.");
        return;
      }

      // Core logic:
      // Next period estimate = LMP + cycle length
      // Ovulation estimate = Next period - luteal phase
      const nextPeriodStart = addDaysUTC(lmpDate, cycleLengthUsed);
      const ovulationDate = addDaysUTC(nextPeriodStart, -lutealUsed);

      // Fertile window: ovulation - 5 days through ovulation + 1 day
      const fertileStart = addDaysUTC(ovulationDate, -5);
      const fertileEnd = addDaysUTC(ovulationDate, 1);

      // Secondary insight: next 3 predicted ovulation dates (for planning tests/travel)
      const nextOv1 = addDaysUTC(ovulationDate, cycleLengthUsed);
      const nextOv2 = addDaysUTC(ovulationDate, cycleLengthUsed * 2);
      const nextOv3 = addDaysUTC(ovulationDate, cycleLengthUsed * 3);

      const resultHtml = `
        <p><strong>Estimated ovulation date:</strong> ${formatDateUTC(ovulationDate)}</p>
        <p><strong>Estimated fertile window:</strong> ${formatDateUTC(fertileStart)} to ${formatDateUTC(fertileEnd)}</p>
        <p><strong>Estimated next period start:</strong> ${formatDateUTC(nextPeriodStart)}</p>
        <hr>
        <p><strong>Planning ahead (next estimated ovulation dates):</strong></p>
        <ul>
          <li>${formatDateUTC(nextOv1)}</li>
          <li>${formatDateUTC(nextOv2)}</li>
          <li>${formatDateUTC(nextOv3)}</li>
        </ul>
        <p><em>These are estimates based on averages. If your cycle shifts, these dates shift too.</em></p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Ovulation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
