document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalTimeMinutesInput = document.getElementById("totalTimeMinutes");
  const totalQuestionsInput = document.getElementById("totalQuestions");
  const readingMinutesInput = document.getElementById("readingMinutes");
  const bufferMinutesInput = document.getElementById("bufferMinutes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(totalTimeMinutesInput);
  attachLiveFormatting(totalQuestionsInput);
  attachLiveFormatting(readingMinutesInput);
  attachLiveFormatting(bufferMinutesInput);

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

  // Local helper (allowed): format minutes to mm:ss
  function formatMinutesToClock(minutes) {
    const totalSeconds = Math.max(0, Math.round(minutes * 60));
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    const mmStr = String(mm);
    const ssStr = ss < 10 ? "0" + String(ss) : String(ss);
    return mmStr + ":" + ssStr;
  }

  function clampNumber(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const totalTimeMinutes = toNumber(totalTimeMinutesInput ? totalTimeMinutesInput.value : "");
      const totalQuestions = toNumber(totalQuestionsInput ? totalQuestionsInput.value : "");

      // Optional with defaults if blank or invalid
      let readingMinutes = toNumber(readingMinutesInput ? readingMinutesInput.value : "");
      let bufferMinutes = toNumber(bufferMinutesInput ? bufferMinutesInput.value : "");

      if (!Number.isFinite(readingMinutes) || readingMinutes === 0) readingMinutes = 2;
      if (!Number.isFinite(bufferMinutes) || bufferMinutes === 0) bufferMinutes = 5;

      // Basic existence guard
      if (!totalTimeMinutesInput || !totalQuestionsInput) return;

      // Validation
      if (!validatePositive(totalTimeMinutes, "total exam time")) return;
      if (!validatePositive(totalQuestions, "total number of questions")) return;
      if (!validateNonNegative(readingMinutes, "reading and instructions time")) return;
      if (!validateNonNegative(bufferMinutes, "end buffer time")) return;

      const reservedMinutes = readingMinutes + bufferMinutes;
      if (reservedMinutes >= totalTimeMinutes) {
        setResultError(
          "Your reserved time (reading + buffer) must be less than the total exam time. Reduce the reserved minutes or increase the exam time."
        );
        return;
      }

      // Calculation logic
      const workingMinutes = totalTimeMinutes - reservedMinutes;
      const minutesPerQuestion = workingMinutes / totalQuestions;
      const secondsPerQuestion = minutesPerQuestion * 60;

      // Checkpoints at 25/50/75/100% of questions
      const checkpoints = [
        { pct: 0.25, label: "25%" },
        { pct: 0.5, label: "50%" },
        { pct: 0.75, label: "75%" },
        { pct: 1.0, label: "Finish" }
      ];

      const checkpointRows = checkpoints
        .map(function (cp) {
          const targetQ = clampNumber(Math.round(totalQuestions * cp.pct), 1, totalQuestions);
          const targetMinutesFromStart = readingMinutes + workingMinutes * cp.pct;
          const timeClock = formatMinutesToClock(targetMinutesFromStart);
          return (
            "<li><strong>" +
            cp.label +
            " checkpoint:</strong> reach about question <strong>" +
            targetQ +
            "</strong> by <strong>" +
            timeClock +
            "</strong> (mm:ss from start)</li>"
          );
        })
        .join("");

      // Build output HTML
      const resultHtml =
        "<p><strong>Working time available:</strong> " +
        formatNumberTwoDecimals(workingMinutes) +
        " minutes (after " +
        formatNumberTwoDecimals(readingMinutes) +
        " min reading and " +
        formatNumberTwoDecimals(bufferMinutes) +
        " min buffer)</p>" +
        "<p><strong>Target pace:</strong> " +
        formatNumberTwoDecimals(minutesPerQuestion) +
        " minutes per question (" +
        Math.round(secondsPerQuestion) +
        " seconds per question)</p>" +
        "<p><strong>Checkpoint targets:</strong></p>" +
        "<ul>" +
        checkpointRows +
        "</ul>" +
        "<p><strong>Practical rule:</strong> If you are behind at a checkpoint, stop wrestling with a single question. Make your best attempt, mark it, and move on. Protect the buffer so you can return later.</p>";

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Exam Time Allocation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
