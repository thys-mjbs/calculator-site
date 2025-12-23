document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const classesAttendedInput = document.getElementById("classesAttended");
  const classesHeldInput = document.getElementById("classesHeld");
  const excusedAbsencesInput = document.getElementById("excusedAbsences");
  const requiredPercentInput = document.getElementById("requiredPercent");
  const totalTermClassesInput = document.getElementById("totalTermClasses");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(classesAttendedInput);
  attachLiveFormatting(classesHeldInput);
  attachLiveFormatting(excusedAbsencesInput);
  attachLiveFormatting(requiredPercentInput);
  attachLiveFormatting(totalTermClassesInput);

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

  function validatePositiveWhole(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegativeWhole(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number (0 or higher).");
      return false;
    }
    return true;
  }

  function clampPercent(p) {
    if (!Number.isFinite(p)) return null;
    if (p <= 0) return null;
    if (p > 100) return null;
    return p;
  }

  function ceilInt(n) {
    return Math.ceil(n);
  }

  function formatCount(n) {
    return formatInputWithCommas(String(n));
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const attended = toNumber(classesAttendedInput ? classesAttendedInput.value : "");
      const held = toNumber(classesHeldInput ? classesHeldInput.value : "");

      const excusedRaw = toNumber(excusedAbsencesInput ? excusedAbsencesInput.value : "");
      const requiredRaw = toNumber(requiredPercentInput ? requiredPercentInput.value : "");
      const totalTermRaw = toNumber(totalTermClassesInput ? totalTermClassesInput.value : "");

      if (!validateNonNegativeWhole(attended, "classes attended")) return;
      if (!validatePositiveWhole(held, "classes held")) return;

      if (attended > held) {
        setResultError("Classes attended cannot be higher than classes held. Check your numbers.");
        return;
      }

      let excused = 0;
      if (Number.isFinite(excusedRaw) && excusedRaw !== 0) {
        if (!validateNonNegativeWhole(excusedRaw, "excused absences")) return;
        excused = excusedRaw;
      }

      if (excused > held) {
        setResultError("Excused absences cannot be higher than classes held. Check your numbers.");
        return;
      }

      let requiredPercent = null;
      const requiredClamped = clampPercent(requiredRaw);
      if (requiredClamped !== null) requiredPercent = requiredClamped;

      let totalTermClasses = null;
      if (Number.isFinite(totalTermRaw) && totalTermRaw !== 0) {
        if (!validatePositiveWhole(totalTermRaw, "total classes in term")) return;
        totalTermClasses = totalTermRaw;

        if (totalTermClasses < held) {
          setResultError("Total classes in term cannot be lower than classes held so far.");
          return;
        }
      }

      const rawPercent = (attended / held) * 100;

      const adjustedDenom = held - excused;
      const hasAdjusted = excused > 0 && adjustedDenom > 0;
      const adjustedPercent = hasAdjusted ? (attended / adjustedDenom) * 100 : null;

      let statusLine = "";
      if (requiredPercent === null) {
        statusLine = "Set a required attendance % in Advanced options if you want a pass or fail check.";
      } else {
        const meets = rawPercent + 1e-9 >= requiredPercent;
        const diff = rawPercent - requiredPercent;
        const diffAbs = Math.abs(diff);
        const diffText = formatNumberTwoDecimals(diffAbs) + "%";

        if (meets) {
          statusLine = "You are currently above the required minimum by " + diffText + ".";
        } else {
          statusLine = "You are currently below the required minimum by " + diffText + ".";
        }
      }

      let planningHtml = "";
      if (requiredPercent !== null && totalTermClasses !== null) {
        const remaining = totalTermClasses - held;

        const denomForPlanning = adjustedDenom > 0 ? adjustedDenom : held;
        const totalCounted = denomForPlanning + remaining;

        const requiredAttendedByEnd = ceilInt((requiredPercent / 100) * totalCounted);

        const minFutureAttend = Math.max(0, requiredAttendedByEnd - attended);
        const minFutureAttendCapped = Math.min(minFutureAttend, remaining);

        const maxFutureMiss = Math.max(0, remaining - minFutureAttendCapped);

        let planStatus = "";
        if (minFutureAttend > remaining) {
          planStatus =
            "Even if you attend every remaining class, you will not reach " +
            formatNumberTwoDecimals(requiredPercent) +
            "% by the end of term under these assumptions.";
        } else if (remaining === 0) {
          planStatus = "There are no remaining classes in the term based on your inputs.";
        } else {
          planStatus =
            "To finish at or above " +
            formatNumberTwoDecimals(requiredPercent) +
            "%, you must attend at least " +
            formatCount(minFutureAttendCapped) +
            " of the remaining " +
            formatCount(remaining) +
            " classes.";
        }

        planningHtml =
          `<div class="result-grid">` +
          `<div class="result-row"><span class="result-label">Classes remaining:</span><span class="result-value">${formatCount(remaining)}</span></div>` +
          `<div class="result-row"><span class="result-label">Minimum future classes to attend:</span><span class="result-value">${formatCount(minFutureAttendCapped)}</span></div>` +
          `<div class="result-row"><span class="result-label">Maximum future classes you can miss:</span><span class="result-value">${formatCount(maxFutureMiss)}</span></div>` +
          `</div>` +
          `<p class="result-note">${planStatus}</p>`;
      }

      const rawPercentText = formatNumberTwoDecimals(rawPercent) + "%";
      const adjustedPercentText =
        adjustedPercent === null ? "" : formatNumberTwoDecimals(adjustedPercent) + "%";

      let adjustedLineHtml = "";
      if (hasAdjusted) {
        adjustedLineHtml =
          `<div class="result-row">` +
          `<span class="result-label">Adjusted attendance (excluding excused):</span>` +
          `<span class="result-value">${adjustedPercentText}</span>` +
          `</div>`;
      }

      const resultHtml =
        `<div class="result-grid">` +
        `<div class="result-row"><span class="result-label">Attendance (so far):</span><span class="result-value">${rawPercentText}</span></div>` +
        `<div class="result-row"><span class="result-label">Classes attended:</span><span class="result-value">${formatCount(attended)}</span></div>` +
        `<div class="result-row"><span class="result-label">Classes held:</span><span class="result-value">${formatCount(held)}</span></div>` +
        (excused > 0
          ? `<div class="result-row"><span class="result-label">Excused absences:</span><span class="result-value">${formatCount(excused)}</span></div>`
          : "") +
        adjustedLineHtml +
        `</div>` +
        `<p class="result-note">${statusLine}</p>` +
        (planningHtml ? `<hr />${planningHtml}` : "");

      setResultSuccess(resultHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message =
        "Class Attendance Percentage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
