document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const minutesInput = document.getElementById("minutes");
  const secondsInput = document.getElementById("seconds");
  const wordsTypedInput = document.getElementById("wordsTyped");
  const charactersTypedInput = document.getElementById("charactersTyped");
  const accuracyPercentInput = document.getElementById("accuracyPercent");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(minutesInput);
  attachLiveFormatting(secondsInput);
  attachLiveFormatting(wordsTypedInput);
  attachLiveFormatting(charactersTypedInput);
  attachLiveFormatting(accuracyPercentInput);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const minutes = toNumber(minutesInput ? minutesInput.value : "");
      const seconds = toNumber(secondsInput ? secondsInput.value : "");
      const wordsTyped = toNumber(wordsTypedInput ? wordsTypedInput.value : "");
      const charactersTyped = toNumber(charactersTypedInput ? charactersTypedInput.value : "");
      const accuracyRaw = toNumber(accuracyPercentInput ? accuracyPercentInput.value : "");

      // Basic existence guard
      if (!minutesInput || !secondsInput || !wordsTypedInput || !charactersTypedInput || !accuracyPercentInput) return;

      // Validation: time
      if (!validateNonNegative(minutes, "minutes")) return;
      if (!validateNonNegative(seconds, "seconds")) return;

      const totalSeconds = (minutes * 60) + seconds;

      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        setResultError("Enter a valid time greater than 0 seconds.");
        return;
      }

      if (minutes > 9999) {
        setResultError("Minutes looks unusually large. Enter a realistic typing test duration.");
        return;
      }

      if (seconds >= 36000) {
        setResultError("Seconds looks unusually large. Enter seconds as part of the test duration.");
        return;
      }

      // Validation: at least one count
      const hasWords = Number.isFinite(wordsTyped) && wordsTyped > 0;
      const hasChars = Number.isFinite(charactersTyped) && charactersTyped > 0;

      if (!hasWords && !hasChars) {
        setResultError("Enter either words typed or characters typed (at least one).");
        return;
      }

      if (hasWords && wordsTyped > 20000) {
        setResultError("Words typed looks unusually large for a single test. Enter a realistic value.");
        return;
      }

      if (hasChars && charactersTyped > 200000) {
        setResultError("Characters typed looks unusually large for a single test. Enter a realistic value.");
        return;
      }

      // Accuracy: optional, default 100
      let accuracyPercent = 100;
      if (Number.isFinite(accuracyRaw) && accuracyRaw > 0) {
        accuracyPercent = accuracyRaw;
      } else if (accuracyPercentInput.value && accuracyPercentInput.value.trim() !== "") {
        setResultError("Enter a valid accuracy percentage (0 to 100), or leave it blank.");
        return;
      }

      if (!Number.isFinite(accuracyPercent) || accuracyPercent <= 0 || accuracyPercent > 100) {
        setResultError("Enter a valid accuracy percentage from 0.01 to 100, or leave it blank.");
        return;
      }

      const timeMinutes = totalSeconds / 60;

      // Calculation logic
      // Prefer characters if provided (standard WPM conversion uses 5 chars = 1 word).
      const wordsFromChars = hasChars ? (charactersTyped / 5) : null;
      const wordsUsed = hasChars ? wordsFromChars : wordsTyped;

      const grossWpm = wordsUsed / timeMinutes;
      const netWpm = grossWpm * (accuracyPercent / 100);
      const cpm = hasChars
        ? (charactersTyped / timeMinutes)
        : ((wordsTyped * 5) / timeMinutes);

      const wordsPerHour = grossWpm * 60;

      // Optional consistency note if both supplied
      let consistencyNote = "";
      if (hasWords && hasChars) {
        const grossFromWords = wordsTyped / timeMinutes;
        const grossFromChars = (charactersTyped / 5) / timeMinutes;

        const diff = Math.abs(grossFromWords - grossFromChars);
        const denom = Math.max(grossFromWords, grossFromChars);
        const diffPct = denom > 0 ? (diff / denom) * 100 : 0;

        if (diffPct >= 5) {
          consistencyNote =
            "<p><strong>Note:</strong> Your word count and character count produce different WPM values. Some tests count words differently (for example, how they treat spaces or punctuation). For consistency, this calculator used characters for the main WPM result.</p>";
        } else {
          consistencyNote =
            "<p><strong>Note:</strong> Your word and character inputs are consistent. This calculator used characters for the main WPM result.</p>";
        }
      } else if (hasChars) {
        consistencyNote =
          "<p><strong>Rule used:</strong> WPM from characters is calculated using 5 characters per word.</p>";
      } else {
        consistencyNote =
          "<p><strong>Rule used:</strong> WPM from words uses your word count directly.</p>";
      }

      if (!Number.isFinite(grossWpm) || grossWpm <= 0) {
        setResultError("Your inputs do not produce a valid WPM. Check the time and counts and try again.");
        return;
      }

      // Build output HTML
      const timeSummary = minutes + "m " + seconds + "s";
      const accuracySummary = formatNumberTwoDecimals(accuracyPercent) + "%";

      const resultHtml = `
        <p><strong>Gross speed (WPM):</strong> ${formatNumberTwoDecimals(grossWpm)}</p>
        <p><strong>Net speed (WPM, accuracy-adjusted):</strong> ${formatNumberTwoDecimals(netWpm)}</p>
        <p><strong>Characters per minute (CPM):</strong> ${formatNumberTwoDecimals(cpm)}</p>
        <p><strong>Estimated words per hour (gross):</strong> ${formatNumberTwoDecimals(wordsPerHour)}</p>
        <p><strong>Time used:</strong> ${timeSummary}</p>
        <p><strong>Accuracy used:</strong> ${accuracySummary}</p>
        ${consistencyNote}
      `;

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
      const message = "Typing Speed (WPM) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
