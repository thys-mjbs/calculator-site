document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const birthDateInput = document.getElementById("birthDate");
  const asOfDateInput = document.getElementById("asOfDate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (NOT USED FOR DATES)
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
  // 4) DATE HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function parseYYYYMMDD(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return null;

    const y = toNumber(match[1]);
    const m = toNumber(match[2]);
    const d = toNumber(match[3]);

    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    if (y < 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;

    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== (m - 1) || dt.getDate() !== d) return null;

    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  function startOfDay(dateObj) {
    const d = new Date(dateObj.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isLeapYear(year) {
    if (year % 400 === 0) return true;
    if (year % 100 === 0) return false;
    return year % 4 === 0;
  }

  function formatDateHuman(dateObj) {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return monthName + " " + day + ", " + year;
  }

  function formatWeekday(dateObj) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dateObj.getDay()];
  }

  function daysBetween(a, b) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = startOfDay(b).getTime() - startOfDay(a).getTime();
    return Math.round(diff / msPerDay);
  }

  function getNextBirthday(birthDate, asOfDate) {
    const birthMonth = birthDate.getMonth(); // 0-11
    const birthDay = birthDate.getDate(); // 1-31
    const yearNow = asOfDate.getFullYear();

    // Handle Feb 29 birthdays for non-leap years: use Feb 28 for planning.
    let targetMonth = birthMonth;
    let targetDay = birthDay;

    if (birthMonth === 1 && birthDay === 29 && !isLeapYear(yearNow)) {
      targetMonth = 1;
      targetDay = 28;
    }

    let candidate = new Date(yearNow, targetMonth, targetDay);
    candidate.setHours(0, 0, 0, 0);

    if (candidate.getTime() < startOfDay(asOfDate).getTime()) {
      const nextYear = yearNow + 1;

      targetMonth = birthMonth;
      targetDay = birthDay;

      if (birthMonth === 1 && birthDay === 29 && !isLeapYear(nextYear)) {
        targetMonth = 1;
        targetDay = 28;
      }

      candidate = new Date(nextYear, targetMonth, targetDay);
      candidate.setHours(0, 0, 0, 0);
    }

    return candidate;
  }

  function getCurrentAgeInYears(birthDate, asOfDate) {
    const y = asOfDate.getFullYear() - birthDate.getFullYear();
    const thisYearsBirthday = new Date(asOfDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    thisYearsBirthday.setHours(0, 0, 0, 0);

    // Feb 29 handling for "current age": treat Feb 28 as birthday in non-leap years for consistency.
    if (birthDate.getMonth() === 1 && birthDate.getDate() === 29 && !isLeapYear(asOfDate.getFullYear())) {
      thisYearsBirthday.setMonth(1);
      thisYearsBirthday.setDate(28);
    }

    const asOfStart = startOfDay(asOfDate).getTime();
    if (asOfStart < thisYearsBirthday.getTime()) return y - 1;
    return y;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!birthDateInput) {
        setResultError("This calculator is missing the date of birth input.");
        return;
      }

      const birthDate = parseYYYYMMDD(birthDateInput.value);
      if (!birthDate) {
        setResultError("Enter a valid date of birth in YYYY-MM-DD format (example: 1995-07-18).");
        return;
      }

      let asOfDate = null;
      if (asOfDateInput && String(asOfDateInput.value || "").trim() !== "") {
        asOfDate = parseYYYYMMDD(asOfDateInput.value);
        if (!asOfDate) {
          setResultError("Enter a valid “as of” date in YYYY-MM-DD format, or leave it blank for today.");
          return;
        }
      } else {
        asOfDate = new Date();
        asOfDate.setHours(0, 0, 0, 0);
      }

      if (startOfDay(asOfDate).getTime() < startOfDay(birthDate).getTime()) {
        setResultError("Your date of birth must be on or before the “as of” date.");
        return;
      }

      const nextBirthday = getNextBirthday(birthDate, asOfDate);
      const daysLeft = daysBetween(asOfDate, nextBirthday);

      const currentAge = getCurrentAgeInYears(birthDate, asOfDate);
      const turningAge = currentAge + (daysLeft === 0 ? 0 : 1);

      const weekday = formatWeekday(nextBirthday);
      const nextBirthdayHuman = formatDateHuman(nextBirthday);

      const isToday = daysLeft === 0;

      const resultHtml =
        `<p><strong>Next birthday:</strong> ${nextBirthdayHuman} (${weekday})</p>` +
        `<p><strong>Days remaining:</strong> ${daysLeft}</p>` +
        `<p><strong>Current age (as of ${formatDateHuman(asOfDate)}):</strong> ${currentAge}</p>` +
        `<p><strong>Age on next birthday:</strong> ${isToday ? currentAge : turningAge}</p>` +
        `<p><strong>Status:</strong> ${isToday ? "It is your birthday today." : "Not your birthday yet."}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Birthday Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
