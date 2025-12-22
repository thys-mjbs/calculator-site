document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const dobInput = document.getElementById("dob");
  const asOfInput = document.getElementById("asOf");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma-formatting for date inputs.

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
  // 6) DATE HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatISODateUTC(d) {
    const y = d.getUTCFullYear();
    const m = pad2(d.getUTCMonth() + 1);
    const day = pad2(d.getUTCDate());
    return y + "-" + m + "-" + day;
  }

  function parseYYYYMMDDToUTCDate(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;

    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return { error: "Use YYYY-MM-DD format (example: 2004-11-03)." };

    const year = Number(m[1]);
    const month = Number(m[2]); // 1-12
    const day = Number(m[3]);   // 1-31

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return { error: "Enter a valid date in YYYY-MM-DD format." };
    }
    if (month < 1 || month > 12) {
      return { error: "Month must be between 01 and 12." };
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    // Validate round-trip (catches invalid dates like 2025-02-30)
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return { error: "That date does not exist. Check the day and month." };
    }

    return { date: date };
  }

  function todayUTCDateOnly() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  function diffCalendarYMD(startUTC, endUTC) {
    // startUTC and endUTC must be UTC "date-only" (00:00Z)
    let y = endUTC.getUTCFullYear() - startUTC.getUTCFullYear();
    let m = endUTC.getUTCMonth() - startUTC.getUTCMonth();
    let d = endUTC.getUTCDate() - startUTC.getUTCDate();

    if (d < 0) {
      // Borrow days from previous month of end date
      const endYear = endUTC.getUTCFullYear();
      const endMonth = endUTC.getUTCMonth(); // 0-11
      const lastDayPrevMonth = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate(); // day 0 => last day of prev month
      d += lastDayPrevMonth;
      m -= 1;
    }

    if (m < 0) {
      m += 12;
      y -= 1;
    }

    return { years: y, months: m, days: d };
  }

  function daysBetweenUTC(startUTC, endUTC) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = endUTC.getTime() - startUTC.getTime();
    return Math.floor(diffMs / msPerDay);
  }

  function nextBirthdayUTC(dobUTC, asOfUTC) {
    const dobMonth = dobUTC.getUTCMonth(); // 0-11
    const dobDay = dobUTC.getUTCDate();    // 1-31
    const year = asOfUTC.getUTCFullYear();

    function birthdayInYear(y) {
      if (dobMonth === 1 && dobDay === 29 && !isLeapYear(y)) {
        // Feb 29 -> Feb 28 in non-leap years (assumption)
        return new Date(Date.UTC(y, 1, 28));
      }
      return new Date(Date.UTC(y, dobMonth, dobDay));
    }

    const thisYearBirthday = birthdayInYear(year);
    if (thisYearBirthday.getTime() >= asOfUTC.getTime()) {
      return thisYearBirthday;
    }
    return birthdayInYear(year + 1);
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!dobInput) return;

      const dobParsed = parseYYYYMMDDToUTCDate(dobInput.value);
      if (!dobParsed || dobParsed.error) {
        setResultError(dobParsed && dobParsed.error ? dobParsed.error : "Enter a valid date of birth.");
        return;
      }

      const dobUTC = dobParsed.date;

      let asOfUTC = null;
      const asOfRaw = asOfInput ? String(asOfInput.value || "").trim() : "";
      if (!asOfRaw) {
        asOfUTC = todayUTCDateOnly();
      } else {
        const asOfParsed = parseYYYYMMDDToUTCDate(asOfRaw);
        if (!asOfParsed || asOfParsed.error) {
          setResultError(asOfParsed && asOfParsed.error ? asOfParsed.error : "Enter a valid as-of date.");
          return;
        }
        asOfUTC = asOfParsed.date;
      }

      if (asOfUTC.getTime() < dobUTC.getTime()) {
        setResultError("As-of date cannot be before your date of birth.");
        return;
      }

      const ymd = diffCalendarYMD(dobUTC, asOfUTC);
      const totalDays = daysBetweenUTC(dobUTC, asOfUTC);
      const totalWeeks = totalDays / 7;
      const approxTotalMonths = totalDays / 30.436875; // average month length

      const nextBday = nextBirthdayUTC(dobUTC, asOfUTC);
      const daysToNextBirthday = daysBetweenUTC(asOfUTC, nextBday);

      const asOfLabel = formatISODateUTC(asOfUTC);
      const dobLabel = formatISODateUTC(dobUTC);
      const nextBdayLabel = formatISODateUTC(nextBday);

      const resultHtml =
        `<p><strong>Exact age:</strong> ${ymd.years} years, ${ymd.months} months, ${ymd.days} days</p>` +
        `<p><strong>As of:</strong> ${asOfLabel}</p>` +
        `<p><strong>Date of birth:</strong> ${dobLabel}</p>` +
        `<p><strong>Total days:</strong> ${totalDays.toLocaleString()}</p>` +
        `<p><strong>Total weeks:</strong> ${formatNumberTwoDecimals(totalWeeks)}</p>` +
        `<p><strong>Approx. total months:</strong> ${formatNumberTwoDecimals(approxTotalMonths)}</p>` +
        `<p><strong>Next birthday:</strong> ${nextBdayLabel} (in ${daysToNextBirthday.toLocaleString()} days)</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Age Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
