document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const dropLowestCountInput = document.getElementById("dropLowestCount");
  const quizRowsContainer = document.getElementById("quizRows");
  const addRowButton = document.getElementById("addRowButton");

  const targetAveragePercentInput = document.getElementById("targetAveragePercent");
  const remainingQuizCountInput = document.getElementById("remainingQuizCount");
  const pointsPerRemainingQuizInput = document.getElementById("pointsPerRemainingQuiz");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // ------------------------------------------------------------
  // 2.1) DYNAMIC ROWS
  // ------------------------------------------------------------
  const DEFAULT_ROW_COUNT = 5;

  function makeRow(index) {
    const row = document.createElement("div");
    row.className = "quiz-row";
    row.setAttribute("data-index", String(index));

    const label = document.createElement("div");
    label.className = "quiz-label";
    label.textContent = "Q" + (index + 1);

    const earned = document.createElement("input");
    earned.type = "text";
    earned.id = "earned_" + index;
    earned.inputMode = "decimal";
    earned.placeholder = "e.g., 8";

    const possible = document.createElement("input");
    possible.type = "text";
    possible.id = "possible_" + index;
    possible.inputMode = "decimal";
    possible.placeholder = "e.g., 10";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-row-button";
    removeBtn.setAttribute("aria-label", "Remove this quiz");
    removeBtn.textContent = "×";

    removeBtn.addEventListener("click", function () {
      if (!quizRowsContainer) return;
      quizRowsContainer.removeChild(row);
      renumberRows();
      clearResult();
    });

    row.appendChild(label);
    row.appendChild(earned);
    row.appendChild(possible);
    row.appendChild(removeBtn);

    attachLiveFormatting(earned);
    attachLiveFormatting(possible);

    return row;
  }

  function renumberRows() {
    if (!quizRowsContainer) return;
    const rows = Array.from(quizRowsContainer.querySelectorAll(".quiz-row"));
    rows.forEach(function (row, idx) {
      row.setAttribute("data-index", String(idx));
      const label = row.querySelector(".quiz-label");
      const earned = row.querySelector('input[id^="earned_"]');
      const possible = row.querySelector('input[id^="possible_"]');

      if (label) label.textContent = "Q" + (idx + 1);
      if (earned) earned.id = "earned_" + idx;
      if (possible) possible.id = "possible_" + idx;
    });
  }

  function initRows() {
    if (!quizRowsContainer) return;
    quizRowsContainer.innerHTML = "";
    for (let i = 0; i < DEFAULT_ROW_COUNT; i++) {
      quizRowsContainer.appendChild(makeRow(i));
    }
  }

  if (addRowButton) {
    addRowButton.addEventListener("click", function () {
      if (!quizRowsContainer) return;
      const currentCount = quizRowsContainer.querySelectorAll(".quiz-row").length;
      quizRowsContainer.appendChild(makeRow(currentCount));
      clearResult();
    });
  }

  initRows();

  // Attach live formatting for single inputs
  attachLiveFormatting(dropLowestCountInput);
  attachLiveFormatting(targetAveragePercentInput);
  attachLiveFormatting(remainingQuizCountInput);
  attachLiveFormatting(pointsPerRemainingQuizInput);

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

  // ------------------------------------------------------------
  // Helpers (calculator-specific)
  // ------------------------------------------------------------
  function clampInt(n, min, max) {
    if (!Number.isFinite(n)) return min;
    const x = Math.floor(n);
    return Math.max(min, Math.min(max, x));
  }

  function safePercent(earned, possible) {
    if (!Number.isFinite(earned) || !Number.isFinite(possible) || possible <= 0) return NaN;
    return (earned / possible) * 100;
  }

  function fmt2(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse drop lowest
      const dropLowestRaw = toNumber(dropLowestCountInput ? dropLowestCountInput.value : "");
      const dropLowest = Number.isFinite(dropLowestRaw) ? clampInt(dropLowestRaw, 0, 9999) : 0;

      if (!quizRowsContainer) {
        setResultError("Something went wrong loading the quiz rows. Refresh and try again.");
        return;
      }

      const rows = Array.from(quizRowsContainer.querySelectorAll(".quiz-row"));

      const quizzes = [];
      for (let i = 0; i < rows.length; i++) {
        const earnedInput = rows[i].querySelector('input[id^="earned_"]');
        const possibleInput = rows[i].querySelector('input[id^="possible_"]');

        const earned = toNumber(earnedInput ? earnedInput.value : "");
        const possible = toNumber(possibleInput ? possibleInput.value : "");

        const earnedHas = earnedInput && String(earnedInput.value || "").trim().length > 0;
        const possibleHas = possibleInput && String(possibleInput.value || "").trim().length > 0;

        // Skip fully blank rows
        if (!earnedHas && !possibleHas) continue;

        // If partially filled, error with guidance
        if (!earnedHas || !possibleHas) {
          setResultError("For each quiz, enter both points earned and points possible (or leave the row blank).");
          return;
        }

        if (!validateNonNegative(earned, "points earned")) return;
        if (!validatePositive(possible, "points possible")) return;

        if (earned > possible) {
          setResultError("Points earned can’t be greater than points possible for a quiz.");
          return;
        }

        const pct = safePercent(earned, possible);
        quizzes.push({ earned: earned, possible: possible, pct: pct });
      }

      if (quizzes.length === 0) {
        setResultError("Enter at least one quiz score to calculate your average.");
        return;
      }

      // Drop lowest quizzes by percentage (common “drop lowest” intent)
      const dropCount = clampInt(dropLowest, 0, quizzes.length - 1);
      let used = quizzes.slice();

      if (dropCount > 0) {
        used.sort(function (a, b) {
          return a.pct - b.pct;
        });
        used = used.slice(dropCount);
      }

      // Compute totals on used set
      let totalEarned = 0;
      let totalPossible = 0;

      used.forEach(function (q) {
        totalEarned += q.earned;
        totalPossible += q.possible;
      });

      const overallPct = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : NaN;

      // Best/worst from original entered set (not dropped), for useful summary
      let best = quizzes[0];
      let worst = quizzes[0];
      quizzes.forEach(function (q) {
        if (q.pct > best.pct) best = q;
        if (q.pct < worst.pct) worst = q;
      });
      const spread = best.pct - worst.pct;

      // Optional target estimate
      const targetPct = toNumber(targetAveragePercentInput ? targetAveragePercentInput.value : "");
      const remainingCountRaw = toNumber(remainingQuizCountInput ? remainingQuizCountInput.value : "");
      const pointsPerRemaining = toNumber(pointsPerRemainingQuizInput ? pointsPerRemainingQuizInput.value : "");

      let targetHtml = "";
      const wantsTarget =
        Number.isFinite(targetPct) &&
        Number.isFinite(remainingCountRaw) &&
        Number.isFinite(pointsPerRemaining) &&
        String(targetAveragePercentInput ? targetAveragePercentInput.value : "").trim().length > 0 &&
        String(remainingQuizCountInput ? remainingQuizCountInput.value : "").trim().length > 0 &&
        String(pointsPerRemainingQuizInput ? pointsPerRemainingQuizInput.value : "").trim().length > 0;

      if (wantsTarget) {
        const remainingCount = clampInt(remainingCountRaw, 0, 9999);

        if (!validateNonNegative(targetPct, "target average %")) return;
        if (targetPct > 100) {
          setResultError("Target average % should be 100 or less.");
          return;
        }
        if (!validateNonNegative(remainingCount, "remaining quizzes")) return;
        if (!validatePositive(pointsPerRemaining, "points per remaining quiz")) return;

        if (remainingCount === 0) {
          targetHtml =
            "<p><strong>Target planning:</strong> Remaining quizzes is 0, so your current average is your final average under this estimate.</p>";
        } else {
          // Estimate required average on remaining quizzes to reach target overall (points-based)
          const remainingTotalPossible = remainingCount * pointsPerRemaining;

          const finalTotalPossible = totalPossible + remainingTotalPossible;
          const targetFinalEarned = (targetPct / 100) * finalTotalPossible;

          const requiredRemainingEarned = targetFinalEarned - totalEarned;
          const requiredRemainingPct = (requiredRemainingEarned / remainingTotalPossible) * 100;

          // Clamp messaging
          let msg = "";
          if (requiredRemainingPct <= 0) {
            msg =
              "You’re already on track. Even scoring 0% on the remaining quizzes would keep you at or above the target under this estimate.";
          } else if (requiredRemainingPct > 100) {
            msg =
              "The target is not achievable under this estimate. Even 100% on the remaining quizzes would not reach the target average.";
          } else {
            msg =
              "You need an average of about <strong>" +
              fmt2(requiredRemainingPct) +
              "%</strong> across the remaining quizzes to reach the target under this estimate.";
          }

          targetHtml =
            "<p><strong>Target planning:</strong> " +
            msg +
            "</p>";
        }
      }

      const resultHtml =
        "<p><strong>Current quiz average:</strong> " +
        fmt2(overallPct) +
        "%</p>" +
        "<p><strong>Total points:</strong> " +
        fmt2(totalEarned) +
        " / " +
        fmt2(totalPossible) +
        "</p>" +
        (dropCount > 0
          ? "<p><strong>Dropped lowest quizzes:</strong> " + dropCount + " (average recalculated on remaining quizzes)</p>"
          : "<p><strong>Dropped lowest quizzes:</strong> 0</p>") +
        "<p><strong>Best quiz:</strong> " +
        fmt2(best.pct) +
        "% &nbsp; | &nbsp; <strong>Worst quiz:</strong> " +
        fmt2(worst.pct) +
        "% &nbsp; | &nbsp; <strong>Spread:</strong> " +
        fmt2(spread) +
        " percentage points</p>" +
        targetHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Quiz Average Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
