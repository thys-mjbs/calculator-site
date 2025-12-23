document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalMinutesInput = document.getElementById("totalMinutes");
  const topicCountInput = document.getElementById("topicCount");
  const breakMinutesInput = document.getElementById("breakMinutes");
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

  // Add every input that should live-format with commas
  attachLiveFormatting(totalMinutesInput);
  attachLiveFormatting(topicCountInput);
  attachLiveFormatting(breakMinutesInput);
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

  function isWholeNumber(value) {
    return Number.isFinite(value) && Math.floor(value) === value;
  }

  function minutesToHoursMinutes(totalMins) {
    const mins = Math.max(0, totalMins);
    const h = Math.floor(mins / 60);
    const m = Math.round(mins - h * 60);
    if (h <= 0) return m + " min";
    if (m <= 0) return h + " hr";
    return h + " hr " + m + " min";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const totalMinutes = toNumber(totalMinutesInput ? totalMinutesInput.value : "");
      const topicCountRaw = toNumber(topicCountInput ? topicCountInput.value : "");
      const breakMinutesRaw = toNumber(breakMinutesInput ? breakMinutesInput.value : "");
      const bufferMinutesRaw = toNumber(bufferMinutesInput ? bufferMinutesInput.value : "");

      // Basic existence guard
      if (!totalMinutesInput || !topicCountInput) return;

      // Validation: required
      if (!validatePositive(totalMinutes, "total session length (minutes)")) return;
      if (!validatePositive(topicCountRaw, "number of topics")) return;
      if (!isWholeNumber(topicCountRaw)) {
        setResultError("Enter a whole number for number of topics (for example: 3, 4, 5).");
        return;
      }

      const topicCount = topicCountRaw;

      // Defaults for optional fields
      const breakMinutes = Number.isFinite(breakMinutesRaw) ? breakMinutesRaw : 5;
      const bufferMinutes = Number.isFinite(bufferMinutesRaw) ? bufferMinutesRaw : 0;

      // Validation: optional fields
      if (!validateNonNegative(breakMinutes, "break length")) return;
      if (!validateNonNegative(bufferMinutes, "buffer time")) return;

      // Practical guardrails
      if (topicCount > 50) {
        setResultError("Keep the number of topics realistic for one session. Try 50 or fewer.");
        return;
      }

      const breaksCount = Math.max(0, topicCount - 1);
      const totalBreakTime = breaksCount * breakMinutes;
      const studyTime = totalMinutes - totalBreakTime - bufferMinutes;

      if (studyTime <= 0) {
        setResultError("Your breaks and buffer leave no time to study. Reduce break time, reduce buffer, reduce topics, or increase total session length.");
        return;
      }

      const perTopic = studyTime / topicCount;

      if (perTopic < 5) {
        setResultError("This plan leaves under 5 minutes per topic. Reduce topics, shorten breaks, or increase session length so each topic block is usable.");
        return;
      }

      // Build a simple block plan (relative timeline)
      let t = 0;
      const blocks = [];
      for (let i = 1; i <= topicCount; i++) {
        const startStudy = t;
        const endStudy = t + perTopic;
        blocks.push({
          label: "Topic " + i + " study",
          start: startStudy,
          end: endStudy
        });
        t = endStudy;

        if (i < topicCount && breakMinutes > 0) {
          const startBreak = t;
          const endBreak = t + breakMinutes;
          blocks.push({
            label: "Break",
            start: startBreak,
            end: endBreak
          });
          t = endBreak;
        }
      }

      if (bufferMinutes > 0) {
        blocks.push({
          label: "Buffer",
          start: t,
          end: t + bufferMinutes
        });
      }

      const totalMinutesDisplay = formatNumberTwoDecimals(totalMinutes);
      const studyTimeDisplay = formatNumberTwoDecimals(studyTime);
      const totalBreakDisplay = formatNumberTwoDecimals(totalBreakTime);
      const breakMinutesDisplay = formatNumberTwoDecimals(breakMinutes);
      const bufferDisplay = formatNumberTwoDecimals(bufferMinutes);
      const perTopicDisplay = formatNumberTwoDecimals(perTopic);

      const planItems = blocks
        .map(function (b) {
          const startLabel = minutesToHoursMinutes(b.start);
          const endLabel = minutesToHoursMinutes(b.end);
          return "<li><strong>" + b.label + ":</strong> " + startLabel + " to " + endLabel + "</li>";
        })
        .join("");

      const resultHtml =
        "<p><strong>Per-topic study time:</strong> " + perTopicDisplay + " min (" + minutesToHoursMinutes(perTopic) + ")</p>" +
        "<p><strong>True study time:</strong> " + studyTimeDisplay + " min</p>" +
        "<p><strong>Breaks:</strong> " + breaksCount + " break(s) × " + breakMinutesDisplay + " min = " + totalBreakDisplay + " min</p>" +
        "<p><strong>Buffer:</strong> " + bufferDisplay + " min</p>" +
        "<p><strong>Total session:</strong> " + totalMinutesDisplay + " min</p>" +
        "<hr>" +
        "<p><strong>Block plan (relative time):</strong></p>" +
        "<ul>" + planItems + "</ul>" +
        "<p>Tip: If one topic needs extra time, split it into two topics and re-run the calculator.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Study Session Breakdown Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
