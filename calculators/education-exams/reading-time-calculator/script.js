document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wordCountInput = document.getElementById("wordCount");
  const readingStyleSelect = document.getElementById("readingStyle");
  const customWpmInput = document.getElementById("customWpm");
  const wordsPerPageInput = document.getElementById("wordsPerPage");
  const includeBreaksInput = document.getElementById("includeBreaks");
  const breakEveryMinutesInput = document.getElementById("breakEveryMinutes");
  const breakLengthMinutesInput = document.getElementById("breakLengthMinutes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(wordCountInput);
  attachLiveFormatting(customWpmInput);
  attachLiveFormatting(wordsPerPageInput);
  attachLiveFormatting(breakEveryMinutesInput);
  attachLiveFormatting(breakLengthMinutesInput);

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

  function formatHoursMinutes(totalMinutes) {
    const mins = Math.max(0, totalMinutes);
    const hours = Math.floor(mins / 60);
    const rem = Math.round(mins - hours * 60);
    if (hours <= 0) return rem + " min";
    const remPadded = String(rem).padStart(2, "0");
    return hours + " hr " + remPadded + " min";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const wordCount = toNumber(wordCountInput ? wordCountInput.value : "");
      const customWpm = toNumber(customWpmInput ? customWpmInput.value : "");
      const wordsPerPageRaw = toNumber(wordsPerPageInput ? wordsPerPageInput.value : "");
      const includeBreaks = !!(includeBreaksInput && includeBreaksInput.checked);
      const breakEvery = toNumber(breakEveryMinutesInput ? breakEveryMinutesInput.value : "");
      const breakLen = toNumber(breakLengthMinutesInput ? breakLengthMinutesInput.value : "");

      // Basic existence guard
      if (!wordCountInput) return;

      // Validation
      if (!validatePositive(wordCount, "word count")) return;

      // Determine WPM from reading style (default) or custom override
      let wpmFromStyle = 200;
      const style = readingStyleSelect ? readingStyleSelect.value : "normal";
      if (style === "skim") wpmFromStyle = 250;
      if (style === "thorough") wpmFromStyle = 150;

      const wpm = Number.isFinite(customWpm) && customWpm > 0 ? customWpm : wpmFromStyle;
      if (!validatePositive(wpm, "reading speed (words per minute)")) return;

      // Words per page (optional)
      const wordsPerPage = Number.isFinite(wordsPerPageRaw) && wordsPerPageRaw > 0 ? wordsPerPageRaw : 250;

      // Break defaults only when breaks are enabled
      let breakEveryFinal = 25;
      let breakLenFinal = 5;

      if (includeBreaks) {
        breakEveryFinal = Number.isFinite(breakEvery) && breakEvery > 0 ? breakEvery : 25;
        breakLenFinal = Number.isFinite(breakLen) && breakLen >= 0 ? breakLen : 5;

        if (!validatePositive(breakEveryFinal, "break interval (minutes)")) return;
        if (!validateNonNegative(breakLenFinal, "break length (minutes)")) return;
      }

      // Calculation logic
      const readingMinutes = wordCount / wpm;

      let breaksCount = 0;
      let breaksMinutes = 0;

      if (includeBreaks) {
        const epsilon = 1e-9;
        breaksCount = Math.floor((readingMinutes - epsilon) / breakEveryFinal);
        breaksMinutes = breaksCount * breakLenFinal;
      }

      const totalMinutes = readingMinutes + breaksMinutes;

      const pagesEstimate = wordCount / wordsPerPage;
      const minutesPerPage = pagesEstimate > 0 ? readingMinutes / pagesEstimate : 0;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated total time:</strong> ${formatHoursMinutes(totalMinutes)}</p>
        <p><strong>Reading time (no breaks):</strong> ${formatHoursMinutes(readingMinutes)}</p>
        <p><strong>Estimated pages:</strong> ${formatNumberTwoDecimals(pagesEstimate)} pages (using ${formatNumberTwoDecimals(wordsPerPage)} words/page)</p>
        <p><strong>Reading pace:</strong> ${formatNumberTwoDecimals(wpm)} words/min (${style === "skim" ? "Skimming" : style === "thorough" ? "Thorough" : "Normal"})</p>
        <p><strong>Breaks included:</strong> ${includeBreaks ? (breaksCount + " break(s), " + formatHoursMinutes(breaksMinutes)) : "No"}</p>
        <p><strong>Average reading time per page:</strong> ${minutesPerPage > 0 ? formatNumberTwoDecimals(minutesPerPage) + " min/page" : "N/A"}</p>
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
      const message = "Reading Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
