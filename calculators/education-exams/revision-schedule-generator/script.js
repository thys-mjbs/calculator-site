document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startDateInput = document.getElementById("startDate");
  const examDateInput = document.getElementById("examDate");
  const dailyMinutesInput = document.getElementById("dailyMinutes");
  const topicsListInput = document.getElementById("topicsList");
  const topicCountInput = document.getElementById("topicCount");

  const daysOffPerWeekInput = document.getElementById("daysOffPerWeek");
  const practiceTestsInput = document.getElementById("practiceTests");
  const finalReviewDaysInput = document.getElementById("finalReviewDays");
  const bufferPercentInput = document.getElementById("bufferPercent");

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
  attachLiveFormatting(dailyMinutesInput);
  attachLiveFormatting(topicCountInput);
  attachLiveFormatting(daysOffPerWeekInput);
  attachLiveFormatting(practiceTestsInput);
  attachLiveFormatting(finalReviewDaysInput);
  attachLiveFormatting(bufferPercentInput);

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

  function parseISODate(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDateLabel(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function splitTopicList(raw) {
    if (!raw) return [];
    return String(raw)
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function clampInt(n, min, max) {
    if (!Number.isFinite(n)) return min;
    const x = Math.round(n);
    return Math.min(max, Math.max(min, x));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const dailyMinutes = toNumber(dailyMinutesInput ? dailyMinutesInput.value : "");
      const topicCountRaw = toNumber(topicCountInput ? topicCountInput.value : "");
      const daysOffPerWeekRaw = toNumber(daysOffPerWeekInput ? daysOffPerWeekInput.value : "");
      const practiceTestsRaw = toNumber(practiceTestsInput ? practiceTestsInput.value : "");
      const finalReviewDaysRaw = toNumber(finalReviewDaysInput ? finalReviewDaysInput.value : "");
      const bufferPercentRaw = toNumber(bufferPercentInput ? bufferPercentInput.value : "");

      const startDate = parseISODate(startDateInput ? startDateInput.value : "");
      const examDate = parseISODate(examDateInput ? examDateInput.value : "");

      const topicNames = splitTopicList(topicsListInput ? topicsListInput.value : "");
      const topicCount = topicNames.length > 0 ? topicNames.length : Math.round(topicCountRaw);

      // Input existence guard
      if (!examDateInput || !dailyMinutesInput || !resultDiv) return;

      // Validation
      if (!examDate) {
        setResultError("Enter a valid exam date in YYYY-MM-DD format.");
        return;
      }

      if (!validatePositive(dailyMinutes, "daily study time (minutes)")) return;

      if (!Number.isFinite(topicCount) || topicCount <= 0) {
        setResultError("Enter a topic list (comma-separated) or a valid number of topics greater than 0.");
        return;
      }

      // Defaults for optional inputs
      const daysOffPerWeek = clampInt(
        Number.isFinite(daysOffPerWeekRaw) ? daysOffPerWeekRaw : 1,
        0,
        7
      );

      const practiceTests = clampInt(
        Number.isFinite(practiceTestsRaw) ? practiceTestsRaw : 2,
        0,
        30
      );

      const finalReviewDays = clampInt(
        Number.isFinite(finalReviewDaysRaw) ? finalReviewDaysRaw : 2,
        0,
        14
      );

      const bufferPercent = Math.min(
        60,
        Math.max(0, Number.isFinite(bufferPercentRaw) ? bufferPercentRaw : 10)
      );

      // Determine schedule window
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const planStart = startDate ? startDate : today;

      if (examDate.getTime() <= planStart.getTime()) {
        setResultError("Your exam date must be after your start date.");
        return;
      }

      // Schedule runs up to the day before exam
      const dayBeforeExam = new Date(examDate.getTime());
      dayBeforeExam.setDate(dayBeforeExam.getDate() - 1);

      const totalDays = Math.floor((dayBeforeExam.getTime() - planStart.getTime()) / 86400000) + 1;

      if (!Number.isFinite(totalDays) || totalDays <= 0) {
        setResultError("Your date range does not include any study days.");
        return;
      }

      // Build calendar days
      const allDays = [];
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(planStart.getTime());
        d.setDate(planStart.getDate() + i);
        d.setHours(0, 0, 0, 0);
        allDays.push(d);
      }

      // Choose rest days with a simple weekly spacing
      let restDaysTarget = 0;
      if (daysOffPerWeek > 0) {
        restDaysTarget = Math.round((totalDays / 7) * daysOffPerWeek);
      }

      const isRest = new Array(allDays.length).fill(false);
      if (restDaysTarget > 0) {
        const interval = Math.max(2, Math.round(allDays.length / restDaysTarget));
        for (let idx = interval - 1; idx < allDays.length; idx += interval) {
          isRest[idx] = true;
        }
        // Ensure we do not overshoot too much
        let countRest = isRest.filter(Boolean).length;
        while (countRest > restDaysTarget) {
          const lastIdx = isRest.lastIndexOf(true);
          if (lastIdx === -1) break;
          isRest[lastIdx] = false;
          countRest--;
        }
      }

      const studyDayIndexes = [];
      for (let i = 0; i < allDays.length; i++) {
        if (!isRest[i]) studyDayIndexes.push(i);
      }

      if (studyDayIndexes.length === 0) {
        setResultError("With your settings, there are no study days left. Reduce rest days per week or move your start date earlier.");
        return;
      }

      // Allocate day types
      const totalStudyDays = studyDayIndexes.length;

      const finalReviewCount = Math.min(finalReviewDays, totalStudyDays);
      let remainingAfterFinal = totalStudyDays - finalReviewCount;

      const bufferCount = Math.min(
        remainingAfterFinal,
        Math.max(0, Math.round((remainingAfterFinal * bufferPercent) / 100))
      );
      remainingAfterFinal -= bufferCount;

      const practiceCount = Math.min(practiceTests, remainingAfterFinal);
      remainingAfterFinal -= practiceCount;

      // Split remaining between coverage and review
      const coverageCount = Math.max(1, Math.round(remainingAfterFinal * 0.6));
      const reviewCount = Math.max(0, remainingAfterFinal - coverageCount);

      // Create list of study-day indexes in order
      const studyIndexesOrdered = studyDayIndexes.slice();

      // Reserve final review days at the end of study days
      const finalReviewStudySlots = studyIndexesOrdered.slice(totalStudyDays - finalReviewCount);
      const earlierStudySlots = studyIndexesOrdered.slice(0, totalStudyDays - finalReviewCount);

      // Place practice tests roughly in the later half of earlier study slots
      const dayPlan = new Array(allDays.length).fill(null);

      // Fill rest days
      for (let i = 0; i < allDays.length; i++) {
        if (isRest[i]) {
          dayPlan[i] = {
            type: "rest",
            label: "Rest day",
            detail: "No planned study. If you must do something, do a 10 minute light recall and stop."
          };
        }
      }

      // Helper: pick practice slots spaced out
      const practiceSlots = [];
      if (practiceCount > 0) {
        const startAt = Math.floor(earlierStudySlots.length * 0.55);
        const usable = earlierStudySlots.slice(startAt);
        const intervalP = Math.max(1, Math.floor(usable.length / practiceCount));
        for (let p = 0; p < practiceCount; p++) {
          const pick = usable[Math.min(usable.length - 1, p * intervalP)];
          if (typeof pick === "number" && !practiceSlots.includes(pick)) practiceSlots.push(pick);
        }
        // If duplicates reduced count, backfill from end
        let backIdx = usable.length - 1;
        while (practiceSlots.length < practiceCount && backIdx >= 0) {
          const pick = usable[backIdx];
          if (!practiceSlots.includes(pick)) practiceSlots.push(pick);
          backIdx--;
        }
        practiceSlots.sort(function (a, b) { return a - b; });
      }

      // Helper: pick buffer slots spaced early-to-mid
      const bufferSlots = [];
      if (bufferCount > 0) {
        const intervalB = Math.max(1, Math.floor(earlierStudySlots.length / bufferCount));
        for (let b = 0; b < bufferCount; b++) {
          const pick = earlierStudySlots[Math.min(earlierStudySlots.length - 1, b * intervalB)];
          if (typeof pick === "number" && !bufferSlots.includes(pick) && !practiceSlots.includes(pick)) {
            bufferSlots.push(pick);
          }
        }
        // Backfill if collisions
        let scan = 0;
        while (bufferSlots.length < bufferCount && scan < earlierStudySlots.length) {
          const pick = earlierStudySlots[scan];
          if (!bufferSlots.includes(pick) && !practiceSlots.includes(pick)) bufferSlots.push(pick);
          scan++;
        }
        bufferSlots.sort(function (a, b) { return a - b; });
      }

      // Build topic labels
      const topics = [];
      if (topicNames.length > 0) {
        for (let i = 0; i < topicNames.length; i++) topics.push(topicNames[i]);
      } else {
        for (let i = 1; i <= topicCount; i++) topics.push("Topic " + i);
      }

      // Assign coverage days: earliest available earlierStudySlots excluding practice/buffer
      const usableForCoverageAndReview = earlierStudySlots.filter(function (idx) {
        return !practiceSlots.includes(idx) && !bufferSlots.includes(idx);
      });

      // Ensure we have slots
      if (usableForCoverageAndReview.length === 0) {
        setResultError("Your settings leave no normal study days after rest, buffer, and tests. Reduce buffer percent or practice tests.");
        return;
      }

      // Coverage slots
      const coverageSlots = usableForCoverageAndReview.slice(0, Math.min(coverageCount, usableForCoverageAndReview.length));
      const remainingSlots = usableForCoverageAndReview.slice(coverageSlots.length);
      const reviewSlots = remainingSlots.slice(0, Math.min(reviewCount, remainingSlots.length));

      // Fill coverage plan
      for (let i = 0; i < coverageSlots.length; i++) {
        const idx = coverageSlots[i];
        const topicsPerDay = Math.max(1, Math.ceil(topics.length / coverageSlots.length));
        const startTopic = i * topicsPerDay;
        const endTopic = Math.min(topics.length, startTopic + topicsPerDay);
        const slice = topics.slice(startTopic, endTopic);

        dayPlan[idx] = {
          type: "coverage",
          label: "Topic coverage",
          detail: "Cover: " + slice.join(", ") + ". Take notes only for gaps. End with 10 minutes active recall."
        };
      }

      // Fill review plan
      for (let i = 0; i < reviewSlots.length; i++) {
        const idx = reviewSlots[i];
        // rotate review focus across topic list
        const chunkSize = Math.max(3, Math.round(topics.length * 0.35));
        const startAt = (i * chunkSize) % topics.length;
        const slice = topics.slice(startAt, Math.min(topics.length, startAt + chunkSize));
        const focus = slice.length > 0 ? slice.join(", ") : topics.slice(0, Math.min(5, topics.length)).join(", ");

        dayPlan[idx] = {
          type: "review",
          label: "Mixed review",
          detail: "Review and recall: " + focus + ". Use flashcards, past questions, and error-driven notes."
        };
      }

      // Fill practice test plan
      for (let i = 0; i < practiceSlots.length; i++) {
        const idx = practiceSlots[i];
        dayPlan[idx] = {
          type: "practice",
          label: "Practice test",
          detail: "Do a timed practice test. Mark it, log mistakes, and list the top 3 weak areas to fix next."
        };
      }

      // Fill buffer plan
      for (let i = 0; i < bufferSlots.length; i++) {
        const idx = bufferSlots[i];
        dayPlan[idx] = {
          type: "buffer",
          label: "Catch-up buffer",
          detail: "Use this day to catch up, extend hard topics, or re-do missed questions. If on track, do light recall."
        };
      }

      // Fill final review plan (last study days)
      for (let i = 0; i < finalReviewStudySlots.length; i++) {
        const idx = finalReviewStudySlots[i];
        const pass = i === finalReviewStudySlots.length - 1 ? "Final light pass" : "Final review";
        dayPlan[idx] = {
          type: "final",
          label: pass,
          detail: "Consolidate key notes, formulas, and common errors. Focus on weak areas, then do short recall."
        };
      }

      // Build output HTML
      const totalStudyMinutes = totalStudyDays * dailyMinutes;
      const totalStudyHours = totalStudyMinutes / 60;

      const counts = {
        coverage: coverageSlots.length,
        review: reviewSlots.length,
        practice: practiceSlots.length,
        buffer: bufferSlots.length,
        final: finalReviewStudySlots.length,
        rest: isRest.filter(Boolean).length
      };

      const summaryHtml =
        `<p><strong>Plan window:</strong> ${formatDateLabel(planStart)} to ${formatDateLabel(dayBeforeExam)} (exam: ${formatDateLabel(examDate)})</p>` +
        `<p><strong>Study days:</strong> ${totalStudyDays} &nbsp; <strong>Rest days:</strong> ${counts.rest}</p>` +
        `<p><strong>Daily target:</strong> ${Math.round(dailyMinutes)} minutes &nbsp; <strong>Total planned:</strong> ${formatNumberTwoDecimals(totalStudyHours)} hours</p>` +
        `<p><strong>Schedule mix:</strong> Coverage ${counts.coverage}, Review ${counts.review}, Practice tests ${counts.practice}, Buffer ${counts.buffer}, Final review ${counts.final}</p>`;

      // Schedule list
      let listHtml = `<ol class="schedule-list">`;
      for (let i = 0; i < allDays.length; i++) {
        const d = allDays[i];
        const item = dayPlan[i];
        if (!item) {
          // Fallback if any slot left blank: treat as review
          listHtml += `<li><strong>${formatDateLabel(d)}:</strong> Mixed review. Use recall and short practice questions.</li>`;
        } else {
          listHtml += `<li><strong>${formatDateLabel(d)}:</strong> ${item.label}. ${item.detail}</li>`;
        }
      }
      listHtml += `</ol>`;

      const noteHtml =
        `<p class="small-note"><strong>Execution tip:</strong> If you miss a day, use the next buffer day to catch up. Do not rewrite the whole plan.</p>`;

      const resultHtml = summaryHtml + listHtml + noteHtml;

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
      const message = "Revision Schedule Generator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
