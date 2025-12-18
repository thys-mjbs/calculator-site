document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const targetGradeInput = document.getElementById("targetGrade");
  const gradeScaleSelect = document.getElementById("gradeScale");

  const name1 = document.getElementById("name1");
  const weight1 = document.getElementById("weight1");
  const score1 = document.getElementById("score1");

  const name2 = document.getElementById("name2");
  const weight2 = document.getElementById("weight2");
  const score2 = document.getElementById("score2");

  const name3 = document.getElementById("name3");
  const weight3 = document.getElementById("weight3");
  const score3 = document.getElementById("score3");

  const name4 = document.getElementById("name4");
  const weight4 = document.getElementById("weight4");
  const score4 = document.getElementById("score4");

  const name5 = document.getElementById("name5");
  const weight5 = document.getElementById("weight5");
  const score5 = document.getElementById("score5");

  const name6 = document.getElementById("name6");
  const weight6 = document.getElementById("weight6");
  const score6 = document.getElementById("score6");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach to fields where users may paste values with separators
  attachLiveFormatting(targetGradeInput);
  attachLiveFormatting(weight1);
  attachLiveFormatting(weight2);
  attachLiveFormatting(weight3);
  attachLiveFormatting(weight4);
  attachLiveFormatting(weight5);
  attachLiveFormatting(weight6);
  attachLiveFormatting(score1);
  attachLiveFormatting(score2);
  attachLiveFormatting(score3);
  attachLiveFormatting(score4);
  attachLiveFormatting(score5);
  attachLiveFormatting(score6);

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
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateScoreRange(value, min, max, fieldLabel) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function formatOnScale(value, scaleMax) {
    if (scaleMax === 4) {
      return value.toFixed(2);
    }
    return formatNumberTwoDecimals(value);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const scaleMax = toNumber(gradeScaleSelect ? gradeScaleSelect.value : "100");
      const scoreMin = 0;
      const scoreMax = scaleMax === 4 ? 4 : 100;

      const targetRaw = toNumber(targetGradeInput ? targetGradeInput.value : "");
      const hasTarget = Number.isFinite(targetRaw) && targetGradeInput && targetGradeInput.value.trim() !== "";

      if (hasTarget) {
        if (!validateScoreRange(targetRaw, scoreMin, scoreMax, "target grade")) return;
      }

      const rows = [
        { nameEl: name1, wEl: weight1, sEl: score1 },
        { nameEl: name2, wEl: weight2, sEl: score2 },
        { nameEl: name3, wEl: weight3, sEl: score3 },
        { nameEl: name4, wEl: weight4, sEl: score4 },
        { nameEl: name5, wEl: weight5, sEl: score5 },
        { nameEl: name6, wEl: weight6, sEl: score6 }
      ];

      let totalWeightPlanned = 0;
      let totalWeightGraded = 0;
      let weightedSum = 0;

      let anyGraded = false;
      let anyWeightEntered = false;

      for (let i = 0; i < rows.length; i++) {
        const wStr = rows[i].wEl ? rows[i].wEl.value : "";
        const sStr = rows[i].sEl ? rows[i].sEl.value : "";

        const w = toNumber(wStr);
        const s = toNumber(sStr);

        const hasWeight = rows[i].wEl && wStr.trim() !== "" && Number.isFinite(w);
        const hasScore = rows[i].sEl && sStr.trim() !== "" && Number.isFinite(s);

        if (hasWeight) {
          anyWeightEntered = true;
          if (!validateNonNegative(w, "weight")) return;
          totalWeightPlanned += w;
        }

        if (hasScore) {
          if (!validateScoreRange(s, scoreMin, scoreMax, "score")) return;
        }

        // Only count as graded if both weight and score exist
        if (hasWeight && hasScore) {
          anyGraded = true;
          totalWeightGraded += w;
          weightedSum += (w * s);
        }

        // If score exists but weight doesn't, ignore it, but inform later via note
      }

      if (!anyGraded) {
        setResultError("Enter at least one assignment with both a weight and a score to calculate your current weighted result.");
        return;
      }

      if (!anyWeightEntered) {
        setResultError("Enter at least one assignment weight.");
        return;
      }

      if (!Number.isFinite(totalWeightPlanned) || totalWeightPlanned <= 0) {
        setResultError("Enter at least one valid weight greater than 0.");
        return;
      }

      // Soft warnings via output notes, but block clearly broken totals
      if (totalWeightPlanned > 120) {
        setResultError("Your total planned weight looks too high. Check that weights are percentages (for example, 10, 20, 30) and not points.");
        return;
      }

      if (totalWeightGraded <= 0) {
        setResultError("Enter at least one graded item with a weight greater than 0.");
        return;
      }

      const currentWeightedAverage = weightedSum / totalWeightGraded;
      const remainingWeightWithinPlanned = Math.max(0, totalWeightPlanned - totalWeightGraded);

      // Projection: assume remaining items scored at current average
      const projectedFinalWithinPlanned = (weightedSum + (remainingWeightWithinPlanned * currentWeightedAverage)) / totalWeightPlanned;

      // If user aimed at 100% and didn't enter full weights, also show "unallocated weight" to 100
      const remainingTo100 = Math.max(0, 100 - totalWeightPlanned);

      let requiredOnRemainingText = "";
      if (hasTarget) {
        if (remainingWeightWithinPlanned <= 0) {
          requiredOnRemainingText = `<p><strong>Target check:</strong> No remaining weighted items in your planned list. Add future items (with weights) to calculate what you need next.</p>`;
        } else {
          const requiredAvg = ((targetRaw * totalWeightPlanned) - weightedSum) / remainingWeightWithinPlanned;

          if (!Number.isFinite(requiredAvg)) {
            requiredOnRemainingText = `<p><strong>Target check:</strong> Unable to calculate required score on remaining work. Check your weights and scores.</p>`;
          } else if (requiredAvg > scoreMax) {
            requiredOnRemainingText = `<p><strong>Required average on remaining work:</strong> ${formatOnScale(requiredAvg, scaleMax)} (above the maximum on this scale, so the target is not achievable with the remaining weights entered).</p>`;
          } else if (requiredAvg < scoreMin) {
            requiredOnRemainingText = `<p><strong>Required average on remaining work:</strong> ${formatOnScale(requiredAvg, scaleMax)} (at or below the minimum, meaning you have already secured the target based on the work entered).</p>`;
          } else {
            requiredOnRemainingText = `<p><strong>Required average on remaining work:</strong> ${formatOnScale(requiredAvg, scaleMax)}</p>`;
          }
        }
      }

      // Build output HTML
      const notes = [];
      if (totalWeightPlanned < 90) {
        notes.push("Your total planned weight is below 90%. If you do not know the full syllabus weights yet, treat projections as provisional.");
      }
      if (totalWeightPlanned > 100 && totalWeightPlanned <= 120) {
        notes.push("Your total planned weight is above 100%. This can happen if you include bonus items or overlapping components. If this is unintentional, recheck weights.");
      }
      if (remainingTo100 > 0) {
        notes.push("Unallocated weight to reach 100%: " + formatNumberTwoDecimals(remainingTo100) + "%. If your course totals 100%, you may be missing items or weights.");
      }

      const noteHtml = notes.length
        ? `<p><strong>Notes:</strong></p><ul>${notes.map(n => `<li>${n}</li>`).join("")}</ul>`
        : "";

      const resultHtml = `
        <p><strong>Current weighted average (graded items only):</strong> ${formatOnScale(currentWeightedAverage, scaleMax)}</p>
        <p><strong>Weight graded so far:</strong> ${formatNumberTwoDecimals(totalWeightGraded)}% (out of ${formatNumberTwoDecimals(totalWeightPlanned)}% planned)</p>
        <p><strong>Remaining weight (within planned items):</strong> ${formatNumberTwoDecimals(remainingWeightWithinPlanned)}%</p>
        <p><strong>Projected final (if remaining matches current average):</strong> ${formatOnScale(projectedFinalWithinPlanned, scaleMax)}</p>
        ${hasTarget ? requiredOnRemainingText : ""}
        ${noteHtml}
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
      const message = "Assignment Weighting Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
