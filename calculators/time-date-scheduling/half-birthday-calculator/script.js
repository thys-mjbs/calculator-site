document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const dobInput = document.getElementById("dobInput");
  const referenceDateInput = document.getElementById("referenceDateInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // (not used for dates)
  

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

  // (not used)
  

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
  // CALCULATOR-SPECIFIC HELPERS
  // ------------------------------------------------------------
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatISODate(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function formatFriendlyDate(d) {
    try {
      return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return formatISODate(d);
    }
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseISODateInput(value) {
    const v = (value || "").trim();
    if (!v) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!match) return null;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return null;
    if (m < 1 || m > 12) return null;
    if (day < 1 || day > 31) return null;

    const d = new Date(y, m - 1, day);
    if (d.getFullYear() !== y || d.getMonth() !== (m - 1) || d.getDate() !== day) return null;
    return d;
  }

  function daysBetween(fromDate, toDate) {
    const a = startOfDay(fromDate).getTime();
    const b = startOfDay(toDate).getTime();
    const diff = b - a;
    return Math.round(diff / 86400000);
  }

  function getLastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function createClampedDate(year, monthIndex, day) {
    const last = getLastDayOfMonth(year, monthIndex);
    const clampedDay = Math.min(day, last);
    return new Date(year, monthIndex, clampedDay);
  }

  function addMonthsClamped(dateObj, monthsToAdd) {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();

    const targetMonthIndex = m + monthsToAdd;
    const targetYear = y + Math.floor(targetMonthIndex / 12);
    const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;

    return createClampedDate(targetYear, normalizedMonth, d);
  }

  function birthdayInYear(dob, year) {
    return createClampedDate(year, dob.getMonth(), dob.getDate());
  }

  function halfBirthdayInYear(dob, year) {
    const bday = birthdayInYear(dob, year);
    return addMonthsClamped(bday, 6);
  }

  function nextEventDateFromYearly(refDate, getEventForYearFn) {
    const ry = refDate.getFullYear();
    const candidate = getEventForYearFn(ry);

    if (startOfDay(candidate).getTime() >= startOfDay(refDate).getTime()) {
      const prev = getEventForYearFn(ry - 1);
      return { next: candidate, prev: prev };
    }

    const next = getEventForYearFn(ry + 1);
    return { next: next, prev: candidate };
  }

  // Default the optional reference date to today
  if (referenceDateInput) {
    const today = new Date();
    referenceDateInput.value = formatISODate(today);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const dob = parseISODateInput(dobInput ? dobInput.value : "");
      if (!dob) {
        setResultError("Enter a valid date of birth in YYYY-MM-DD format.");
        return;
      }

      const refRaw = referenceDateInput ? referenceDateInput.value : "";
      const refParsed = parseISODateInput(refRaw);
      const refDate = refParsed ? refParsed : new Date();

      const dobStart = startOfDay(dob);
      const refStart = startOfDay(refDate);

      if (refStart.getTime() < dobStart.getTime()) {
        setResultError("The as of date cannot be earlier than the date of birth.");
        return;
      }

      const half = nextEventDateFromYearly(refStart, function (year) {
        return halfBirthdayInYear(dobStart, year);
      });

      const bday = nextEventDateFromYearly(refStart, function (year) {
        return birthdayInYear(dobStart, year);
      });

      const daysToNextHalf = daysBetween(refStart, half.next);
      const daysToNextBday = daysBetween(refStart, bday.next);

      const resultHtml = `
        <p><strong>Next half-birthday:</strong> ${formatFriendlyDate(half.next)} <span style="white-space:nowrap;">(${formatISODate(half.next)})</span></p>
        <p><strong>Days until next half-birthday:</strong> ${daysToNextHalf}</p>
        <p><strong>Most recent half-birthday:</strong> ${formatFriendlyDate(half.prev)} <span style="white-space:nowrap;">(${formatISODate(half.prev)})</span></p>
        <hr>
        <p><strong>Next birthday:</strong> ${formatFriendlyDate(bday.next)} <span style="white-space:nowrap;">(${formatISODate(bday.next)})</span></p>
        <p><strong>Days until next birthday:</strong> ${daysToNextBday}</p>
        <p><strong>As of date used:</strong> ${formatFriendlyDate(refStart)} <span style="white-space:nowrap;">(${formatISODate(refStart)})</span></p>
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
      const message = "Half-Birthday Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
