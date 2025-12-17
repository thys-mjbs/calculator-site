document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const meetingDate = document.getElementById("meetingDate");
  const meetingTime = document.getElementById("meetingTime");
  const sourceTimeZone = document.getElementById("sourceTimeZone");
  const targetTimeZone1 = document.getElementById("targetTimeZone1");
  const targetTimeZone2 = document.getElementById("targetTimeZone2");
  const targetTimeZone3 = document.getElementById("targetTimeZone3");
  const timeFormat = document.getElementById("timeFormat");
  const includeUtc = document.getElementById("includeUtc");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No numeric inputs for this calculator.

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
  function validateRequiredText(value, fieldLabel) {
    if (typeof value !== "string" || value.trim() === "") {
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

  function parseDateParts(dateStr) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;
    return { y, mo, d };
  }

  function parseTimeParts(timeStr) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return { hh, mm };
  }

  function getTimeZoneOffsetMinutes(timeZone, date) {
    // Uses "shortOffset" when available: e.g., "GMT+2", "GMT-05:00"
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "shortOffset"
    });

    const parts = dtf.formatToParts(date);
    const tzPart = parts.find(function (p) { return p.type === "timeZoneName"; });
    const v = tzPart ? tzPart.value : "";

    const m = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(v);
    if (!m) return null;

    const sign = m[1] === "-" ? -1 : 1;
    const hours = Number(m[2]);
    const mins = m[3] ? Number(m[3]) : 0;
    if (!Number.isFinite(hours) || !Number.isFinite(mins)) return null;

    return sign * (hours * 60 + mins);
  }

  function zonedLocalToUtcMs(dateStr, timeStr, timeZone) {
    const dp = parseDateParts(dateStr);
    const tp = parseTimeParts(timeStr);
    if (!dp || !tp) return null;

    const utcGuessMs = Date.UTC(dp.y, dp.mo - 1, dp.d, tp.hh, tp.mm, 0);

    // Two-pass adjustment for DST correctness
    const off1 = getTimeZoneOffsetMinutes(timeZone, new Date(utcGuessMs));
    if (off1 === null) return null;
    const utc1 = utcGuessMs - off1 * 60000;

    const off2 = getTimeZoneOffsetMinutes(timeZone, new Date(utc1));
    if (off2 === null) return null;
    const utc2 = utcGuessMs - off2 * 60000;

    return utc2;
  }

  function formatInTimeZone(utcMs, timeZone, use12Hour) {
    const opts = {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: use12Hour
    };
    return new Intl.DateTimeFormat("en-US", opts).format(new Date(utcMs));
  }

  function buildDiffLabel(sourceOffsetMin, targetOffsetMin) {
    if (!Number.isFinite(sourceOffsetMin) || !Number.isFinite(targetOffsetMin)) return "";
    const diffMin = targetOffsetMin - sourceOffsetMin;
    if (diffMin === 0) return "Same time as organizer";
    const sign = diffMin > 0 ? "+" : "-";
    const abs = Math.abs(diffMin);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const mm = m.toString().padStart(2, "0");
    if (m === 0) return sign + h + "h vs organizer";
    return sign + h + "h " + mm + "m vs organizer";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!meetingDate || !meetingTime || !sourceTimeZone || !targetTimeZone1) return;

      const dateStr = (meetingDate.value || "").trim();
      const timeStr = (meetingTime.value || "").trim();
      const srcTz = (sourceTimeZone.value || "").trim();
      const t1 = (targetTimeZone1.value || "").trim();
      const t2 = (targetTimeZone2 && targetTimeZone2.value) ? targetTimeZone2.value.trim() : "";
      const t3 = (targetTimeZone3 && targetTimeZone3.value) ? targetTimeZone3.value.trim() : "";

      if (!validateRequiredText(dateStr, "meeting date (YYYY-MM-DD)")) return;
      if (!parseDateParts(dateStr)) {
        setResultError("Enter a valid meeting date in YYYY-MM-DD format (for example 2025-12-17).");
        return;
      }

      if (!validateRequiredText(timeStr, "meeting time (HH:MM)")) return;
      if (!parseTimeParts(timeStr)) {
        setResultError("Enter a valid meeting time in HH:MM format using 24-hour time (for example 14:30).");
        return;
      }

      if (!validateRequiredText(srcTz, "organizer time zone")) return;
      if (!isValidIanaTimeZone(srcTz)) {
        setResultError("Enter a valid organizer time zone (IANA), for example Africa/Johannesburg or Europe/London.");
        return;
      }

      if (!validateRequiredText(t1, "participant time zone 1")) return;
      if (!isValidIanaTimeZone(t1)) {
        setResultError("Enter a valid participant time zone 1 (IANA), for example America/New_York.");
        return;
      }

      if (t2 && !isValidIanaTimeZone(t2)) {
        setResultError("Participant time zone 2 is not a valid IANA time zone. Clear it or enter a valid one.");
        return;
      }

      if (t3 && !isValidIanaTimeZone(t3)) {
        setResultError("Participant time zone 3 is not a valid IANA time zone. Clear it or enter a valid one.");
        return;
      }

      const utcMs = zonedLocalToUtcMs(dateStr, timeStr, srcTz);
      if (utcMs === null) {
        setResultError("Could not convert that meeting time. Double-check the date, time, and time zone, then try again.");
        return;
      }

      const use12Hour = timeFormat && timeFormat.value === "12";

      const srcOffset = getTimeZoneOffsetMinutes(srcTz, new Date(utcMs));
      const rows = [];

      rows.push({
        label: "Organizer (" + srcTz + ")",
        value: formatInTimeZone(utcMs, srcTz, use12Hour),
        note: ""
      });

      const targets = [
        { label: "Participant 1 (" + t1 + ")", tz: t1 },
        { label: "Participant 2 (" + t2 + ")", tz: t2 },
        { label: "Participant 3 (" + t3 + ")", tz: t3 }
      ].filter(function (x) { return x.tz && x.tz.trim() !== ""; });

      targets.forEach(function (t) {
        const off = getTimeZoneOffsetMinutes(t.tz, new Date(utcMs));
        rows.push({
          label: t.label,
          value: formatInTimeZone(utcMs, t.tz, use12Hour),
          note: buildDiffLabel(srcOffset, off)
        });
      });

      const showUtc = includeUtc && includeUtc.checked;
      let utcLine = "";
      if (showUtc) {
        const utcFmt = new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: use12Hour
        }).format(new Date(utcMs));
        utcLine = "<p><strong>UTC:</strong> " + utcFmt + "</p>";
      }

      const listItems = rows.map(function (r) {
        const note = r.note ? '<div class="tz-note">' + r.note + "</div>" : "";
        return (
          '<div class="tz-row">' +
            '<div class="tz-label"><strong>' + r.label + ":</strong></div>" +
            '<div class="tz-value">' + r.value + "</div>" +
            note +
          "</div>"
        );
      }).join("");

      const resultHtml =
        "<p><strong>Converted meeting times</strong></p>" +
        "<div class=\"tz-results\">" + listItems + "</div>" +
        utcLine +
        "<p class=\"tz-tip\"><strong>Tip:</strong> If the meeting is recurring, re-check times near daylight saving changes. Offsets can shift by 1 hour depending on the date.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Meeting Time Zone Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
