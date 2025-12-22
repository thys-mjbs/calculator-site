document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const fromTimeZone = document.getElementById("fromTimeZone");
  const toTimeZone = document.getElementById("toTimeZone");
  const fromDateTime = document.getElementById("fromDateTime");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma-formatting needed for time zones or date/time input.

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
  function validateNonEmptyString(value, fieldLabel) {
    const v = String(value || "").trim();
    if (!v) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function isValidIanaTimeZone(tz) {
    try {
      Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
      return true;
    } catch (e) {
      return false;
    }
  }

  function parseDateTimeString(value) {
    const raw = String(value || "").trim();
    if (!raw) return { ok: true, isNow: true };

    const m = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
    );
    if (!m) {
      return {
        ok: false,
        error:
          "Use the format YYYY-MM-DD HH:MM (24-hour). Example: 2025-12-22 14:30. Or leave it blank for now."
      };
    }

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const h = Number(m[4]);
    const mi = Number(m[5]);

    if (
      !Number.isInteger(y) ||
      !Number.isInteger(mo) ||
      !Number.isInteger(d) ||
      !Number.isInteger(h) ||
      !Number.isInteger(mi)
    ) {
      return { ok: false, error: "Enter a valid date and time." };
    }
    if (mo < 1 || mo > 12) return { ok: false, error: "Month must be 01 to 12." };
    if (d < 1 || d > 31) return { ok: false, error: "Day must be 01 to 31." };
    if (h < 0 || h > 23) return { ok: false, error: "Hour must be 00 to 23." };
    if (mi < 0 || mi > 59) return { ok: false, error: "Minutes must be 00 to 59." };

    return { ok: true, isNow: false, y: y, mo: mo, d: d, h: h, mi: mi };
  }

  function partsForTimeZone(dateObj, tz) {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });

    const parts = dtf.formatToParts(dateObj);
    const map = {};
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].type !== "literal") map[parts[i].type] = parts[i].value;
    }

    return {
      y: Number(map.year),
      mo: Number(map.month),
      d: Number(map.day),
      h: Number(map.hour),
      mi: Number(map.minute)
    };
  }

  function minutesSinceEpochLike(y, mo, d, h, mi) {
    // Not a true epoch conversion; it's just a sortable scalar for diff math.
    // Using a fixed formula that preserves ordering and relative differences.
    return (((y * 12 + (mo - 1)) * 31 + (d - 1)) * 24 + h) * 60 + mi;
  }

  function zonedWallTimeToUtcMillis(tz, y, mo, d, h, mi) {
    // Iterative approach:
    // 1) Start with a UTC guess of the same components.
    // 2) Format that instant in the target zone.
    // 3) Adjust by the difference between formatted wall time and intended wall time.
    // 4) Repeat a few times to converge across DST boundaries.
    let guess = Date.UTC(y, mo - 1, d, h, mi, 0);

    const intendedScalar = minutesSinceEpochLike(y, mo, d, h, mi);

    for (let i = 0; i < 4; i++) {
      const got = partsForTimeZone(new Date(guess), tz);
      const gotScalar = minutesSinceEpochLike(
        got.y,
        got.mo,
        got.d,
        got.h,
        got.mi
      );
      const diffMinutes = gotScalar - intendedScalar;

      if (diffMinutes === 0) break;
      guess -= diffMinutes * 60 * 1000;
    }

    return guess;
  }

  function formatInTimeZone(dateObj, tz) {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });

    // en-CA tends to output YYYY-MM-DD, which is good for clarity.
    // Example: 2025-12-22, 14:30
    return dtf.format(dateObj).replace(",", "");
  }

  function getUtcOffsetMinutesAt(dateObj, tz) {
    const utcParts = partsForTimeZone(dateObj, "UTC");
    const tzParts = partsForTimeZone(dateObj, tz);

    const utcScalar = minutesSinceEpochLike(
      utcParts.y,
      utcParts.mo,
      utcParts.d,
      utcParts.h,
      utcParts.mi
    );
    const tzScalar = minutesSinceEpochLike(
      tzParts.y,
      tzParts.mo,
      tzParts.d,
      tzParts.h,
      tzParts.mi
    );

    // tzScalar = utcScalar + offset
    return tzScalar - utcScalar;
  }

  function formatOffsetLabel(offsetMinutes) {
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return "UTC" + sign + hh + ":" + mm;
  }

  function formatSignedHoursMinutes(diffMinutes) {
    const sign = diffMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(diffMinutes);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;

    if (mm === 0) return sign + String(hh) + " hours";
    return sign + String(hh) + " hours " + String(mm) + " minutes";
  }

  function dayShiftLabel(fromParts, toParts) {
    const fromScalar = minutesSinceEpochLike(
      fromParts.y,
      fromParts.mo,
      fromParts.d,
      0,
      0
    );
    const toScalar = minutesSinceEpochLike(
      toParts.y,
      toParts.mo,
      toParts.d,
      0,
      0
    );
    const dayDiff = Math.round((toScalar - fromScalar) / (24 * 60));

    if (dayDiff === 0) return "Same day";
    if (dayDiff === 1) return "Next day";
    if (dayDiff === -1) return "Previous day";
    if (dayDiff > 1) return dayDiff + " days later";
    return Math.abs(dayDiff) + " days earlier";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!fromTimeZone || !toTimeZone || !fromDateTime) return;

      const fromTz = String(fromTimeZone.value || "").trim();
      const toTz = String(toTimeZone.value || "").trim();
      const dtParsed = parseDateTimeString(fromDateTime.value);

      if (!validateNonEmptyString(fromTz, "From time zone")) return;
      if (!validateNonEmptyString(toTz, "To time zone")) return;

      if (!isValidIanaTimeZone(fromTz)) {
        setResultError(
          "From time zone is not a valid IANA time zone. Example: Africa/Johannesburg."
        );
        return;
      }
      if (!isValidIanaTimeZone(toTz)) {
        setResultError(
          "To time zone is not a valid IANA time zone. Example: America/New_York."
        );
        return;
      }
      if (!dtParsed.ok) {
        setResultError(dtParsed.error);
        return;
      }

      let instantMillis;
      let referenceLabel;

      if (dtParsed.isNow) {
        instantMillis = Date.now();
        referenceLabel = "Now";
      } else {
        instantMillis = zonedWallTimeToUtcMillis(
          fromTz,
          dtParsed.y,
          dtParsed.mo,
          dtParsed.d,
          dtParsed.h,
          dtParsed.mi
        );
        referenceLabel =
          String(dtParsed.y).padStart(4, "0") +
          "-" +
          String(dtParsed.mo).padStart(2, "0") +
          "-" +
          String(dtParsed.d).padStart(2, "0") +
          " " +
          String(dtParsed.h).padStart(2, "0") +
          ":" +
          String(dtParsed.mi).padStart(2, "0");
      }

      const instant = new Date(instantMillis);

      const fromStr = formatInTimeZone(instant, fromTz);
      const toStr = formatInTimeZone(instant, toTz);

      const fromOffsetMin = getUtcOffsetMinutesAt(instant, fromTz);
      const toOffsetMin = getUtcOffsetMinutesAt(instant, toTz);

      const diffMin = toOffsetMin - fromOffsetMin;

      const fromParts = partsForTimeZone(instant, fromTz);
      const toParts = partsForTimeZone(instant, toTz);
      const dayShift = dayShiftLabel(fromParts, toParts);

      const resultHtml =
        "<p><strong>Reference (" +
        fromTz +
        "):</strong> " +
        (dtParsed.isNow ? fromStr : referenceLabel + " → " + fromStr) +
        "</p>" +
        "<p><strong>Converted (" +
        toTz +
        "):</strong> " +
        toStr +
        "</p>" +
        "<p><strong>Time difference (To − From):</strong> " +
        formatSignedHoursMinutes(diffMin) +
        "</p>" +
        "<p><strong>UTC offsets at that moment:</strong> " +
        fromTz +
        " = " +
        formatOffsetLabel(fromOffsetMin) +
        " | " +
        toTz +
        " = " +
        formatOffsetLabel(toOffsetMin) +
        "</p>" +
        "<p><strong>Day shift:</strong> " +
        dayShift +
        "</p>";

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
        "World Clock Time Difference Calculator - check this calculator: " +
        pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
