document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const fromOffsetInput = document.getElementById("fromOffset");
  const toOffsetInput = document.getElementById("toOffset");
  const localDateInput = document.getElementById("localDate");
  const localTimeInput = document.getElementById("localTime");
  const swapButton = document.getElementById("swapButton");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma formatting needed for this calculator.

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

  function parseUtcOffsetHours(raw, label) {
    const cleaned = String(raw || "").trim().replace(",", ".");
    if (!cleaned) return { ok: false, minutes: 0, message: "Enter a " + label + " (for example +2, -5, or +5.5)." };

    const val = Number(cleaned);
    if (!Number.isFinite(val)) {
      return { ok: false, minutes: 0, message: "Enter a valid " + label + " (for example +2, -5, or +5.5)." };
    }

    // Practical bounds for UTC offsets
    if (val < -12 || val > 14) {
      return { ok: false, minutes: 0, message: label + " looks unrealistic. Use a value between -12 and +14." };
    }

    // Convert hours to minutes (support decimals like 5.5 => 330)
    const minutes = Math.round(val * 60);
    return { ok: true, minutes: minutes, hours: val };
  }

  function parseDateYMD(raw) {
    const s = String(raw || "").trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return { ok: false, y: 0, mo: 0, d: 0 };

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return { ok: false, y: 0, mo: 0, d: 0 };
    if (mo < 1 || mo > 12) return { ok: false, y: 0, mo: 0, d: 0 };
    if (d < 1 || d > 31) return { ok: false, y: 0, mo: 0, d: 0 };

    // Basic validity check using UTC date rollover
    const test = new Date(Date.UTC(y, mo - 1, d));
    if (test.getUTCFullYear() !== y || test.getUTCMonth() !== mo - 1 || test.getUTCDate() !== d) {
      return { ok: false, y: 0, mo: 0, d: 0 };
    }

    return { ok: true, y, mo, d };
  }

  function parseTimeHM(raw) {
    const s = String(raw || "").trim();
    const m = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!m) return { ok: false, hh: 0, mm: 0 };

    const hh = Number(m[1]);
    const mm = Number(m[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return { ok: false, hh: 0, mm: 0 };
    if (hh < 0 || hh > 23) return { ok: false, hh: 0, mm: 0 };
    if (mm < 0 || mm > 59) return { ok: false, hh: 0, mm: 0 };

    return { ok: true, hh, mm };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatUtcDateTime(dateObjUtcLike) {
    // dateObjUtcLike is a Date, but we always read UTC fields for consistency.
    const y = dateObjUtcLike.getUTCFullYear();
    const mo = pad2(dateObjUtcLike.getUTCMonth() + 1);
    const d = pad2(dateObjUtcLike.getUTCDate());
    const hh = pad2(dateObjUtcLike.getUTCHours());
    const mm = pad2(dateObjUtcLike.getUTCMinutes());
    return y + "-" + mo + "-" + d + " " + hh + ":" + mm;
  }

  function describeDayShift(fromY, fromMo, fromD, toDateObjUtcLike) {
    const fromMidnightUtc = Date.UTC(fromY, fromMo - 1, fromD, 0, 0, 0, 0);
    const toMidnightUtc = Date.UTC(
      toDateObjUtcLike.getUTCFullYear(),
      toDateObjUtcLike.getUTCMonth(),
      toDateObjUtcLike.getUTCDate(),
      0,
      0,
      0,
      0
    );

    const diffDays = Math.round((toMidnightUtc - fromMidnightUtc) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Same day";
    if (diffDays === 1) return "Next day";
    if (diffDays === -1) return "Previous day";
    if (diffDays > 1) return diffDays + " days later";
    return Math.abs(diffDays) + " days earlier";
  }

  function formatOffsetLabel(minutes) {
    const sign = minutes >= 0 ? "+" : "-";
    const abs = Math.abs(minutes);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    return "UTC" + sign + hh + (mm ? ":" + pad2(mm) : "");
  }

  // ------------------------------------------------------------
  // Swap button
  // ------------------------------------------------------------
  if (swapButton) {
    swapButton.addEventListener("click", function () {
      if (!fromOffsetInput || !toOffsetInput) return;
      const a = fromOffsetInput.value;
      fromOffsetInput.value = toOffsetInput.value;
      toOffsetInput.value = a;
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse offsets
      const fromOffsetParsed = parseUtcOffsetHours(fromOffsetInput ? fromOffsetInput.value : "", "From UTC offset");
      if (!fromOffsetParsed.ok) {
        setResultError(fromOffsetParsed.message);
        return;
      }

      const toOffsetParsed = parseUtcOffsetHours(toOffsetInput ? toOffsetInput.value : "", "To UTC offset");
      if (!toOffsetParsed.ok) {
        setResultError(toOffsetParsed.message);
        return;
      }

      // Parse date/time
      const dateParsed = parseDateYMD(localDateInput ? localDateInput.value : "");
      if (!dateParsed.ok) {
        setResultError("Enter a valid local date in YYYY-MM-DD format (for example 2025-12-30).");
        return;
      }

      const timeParsed = parseTimeHM(localTimeInput ? localTimeInput.value : "");
      if (!timeParsed.ok) {
        setResultError("Enter a valid local time in 24-hour HH:MM format (for example 18:45).");
        return;
      }

      // Convert: treat input date/time as local time in From offset, convert to UTC epoch.
      const fromLocalAsUtcMillis = Date.UTC(
        dateParsed.y,
        dateParsed.mo - 1,
        dateParsed.d,
        timeParsed.hh,
        timeParsed.mm,
        0,
        0
      );

      const utcMillis = fromLocalAsUtcMillis - (fromOffsetParsed.minutes * 60 * 1000);
      const toLocalMillis = utcMillis + (toOffsetParsed.minutes * 60 * 1000);

      const toLocal = new Date(toLocalMillis);

      const converted = formatUtcDateTime(toLocal);
      const dayShift = describeDayShift(dateParsed.y, dateParsed.mo, dateParsed.d, toLocal);

      const diffMinutes = toOffsetParsed.minutes - fromOffsetParsed.minutes;
      const diffHours = diffMinutes / 60;
      const diffSign = diffMinutes >= 0 ? "+" : "-";
      const diffAbs = Math.abs(diffMinutes);
      const diffH = Math.floor(diffAbs / 60);
      const diffM = diffAbs % 60;
      const diffLabel = diffSign + diffH + (diffM ? ":" + pad2(diffM) : "") + " hours";

      const fromOffsetLabel = formatOffsetLabel(fromOffsetParsed.minutes);
      const toOffsetLabel = formatOffsetLabel(toOffsetParsed.minutes);

      const fromInputDisplay =
        String(dateParsed.y) +
        "-" +
        pad2(dateParsed.mo) +
        "-" +
        pad2(dateParsed.d) +
        " " +
        pad2(timeParsed.hh) +
        ":" +
        pad2(timeParsed.mm);

      const resultHtml =
        `<p><strong>Converted time:</strong> ${converted}</p>` +
        `<p><strong>Day change:</strong> ${dayShift}</p>` +
        `<p><strong>Time difference (To minus From):</strong> ${diffLabel}</p>` +
        `<hr>` +
        `<p><strong>From:</strong> ${fromInputDisplay} (${fromOffsetLabel})</p>` +
        `<p><strong>To:</strong> ${converted} (${toOffsetLabel})</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Time Zone Converter (Travel Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
