document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const scaleSelect = document.getElementById("scaleSelect");
  const modeSelect = document.getElementById("modeSelect");

  const modeFromScratch = document.getElementById("modeFromScratch");
  const modeUpdateExisting = document.getElementById("modeUpdateExisting");

  const addCourseButton = document.getElementById("addCourseButton");
  const coursesContainer = document.getElementById("coursesContainer");
  const roundSelect = document.getElementById("roundSelect");

  const currentGpa = document.getElementById("currentGpa");
  const currentCredits = document.getElementById("currentCredits");
  const addCourseButton2 = document.getElementById("addCourseButton2");
  const coursesContainer2 = document.getElementById("coursesContainer2");
  const roundSelect2 = document.getElementById("roundSelect2");

  const targetGpa = document.getElementById("targetGpa");
  const plannedCredits = document.getElementById("plannedCredits");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(currentCredits);
  attachLiveFormatting(plannedCredits);

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
  // 4) MODE HANDLING
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeFromScratch) modeFromScratch.classList.add("hidden");
    if (modeUpdateExisting) modeUpdateExisting.classList.add("hidden");

    if (mode === "fromScratch") {
      if (modeFromScratch) modeFromScratch.classList.remove("hidden");
    } else if (mode === "updateExisting") {
      if (modeUpdateExisting) modeUpdateExisting.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
  }

  // ------------------------------------------------------------
  // 5) COURSE ROWS
  // ------------------------------------------------------------
  function getScaleMax() {
    const s = scaleSelect ? toNumber(scaleSelect.value) : 4;
    if (s === 5 || s === 7 || s === 10 || s === 4) return s;
    return 4;
  }

  function clampToScale(value) {
    const max = getScaleMax();
    if (!Number.isFinite(value)) return NaN;
    if (value < 0) return NaN;
    if (value > max) return NaN;
    return value;
  }

  function createCourseRow(container, index) {
    if (!container) return;

    const row = document.createElement("div");
    row.className = "course-row";
    row.setAttribute("data-row", String(index));

    const creditsWrap = document.createElement("div");
    creditsWrap.className = "input-group";

    const creditsLabel = document.createElement("label");
    creditsLabel.textContent = "Credits";

    const creditsInput = document.createElement("input");
    creditsInput.type = "text";
    creditsInput.inputMode = "decimal";
    creditsInput.placeholder = "e.g., 3";
    creditsInput.id = container.id + "_credits_" + index;

    attachLiveFormatting(creditsInput);

    creditsWrap.appendChild(creditsLabel);
    creditsWrap.appendChild(creditsInput);

    const gradeWrap = document.createElement("div");
    gradeWrap.className = "input-group";

    const gradeLabel = document.createElement("label");
    gradeLabel.textContent = "Grade points";

    const gradeInput = document.createElement("input");
    gradeInput.type = "text";
    gradeInput.inputMode = "decimal";
    gradeInput.placeholder = "e.g., 3.7";
    gradeInput.id = container.id + "_grade_" + index;

    gradeWrap.appendChild(gradeLabel);
    gradeWrap.appendChild(gradeInput);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-button";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      row.remove();
      clearResult();
    });

    row.appendChild(creditsWrap);
    row.appendChild(gradeWrap);
    row.appendChild(removeBtn);

    container.appendChild(row);
  }

  function ensureAtLeastOneRow(container) {
    if (!container) return;
    const rows = container.querySelectorAll(".course-row");
    if (rows.length === 0) {
      createCourseRow(container, 1);
    }
  }

  function addRow(container) {
    if (!container) return;
    const rows = container.querySelectorAll(".course-row");
    const nextIndex = rows.length + 1;
    createCourseRow(container, nextIndex);
    clearResult();
  }

  if (addCourseButton && coursesContainer) {
    addCourseButton.addEventListener("click", function () {
      addRow(coursesContainer);
    });
  }

  if (addCourseButton2 && coursesContainer2) {
    addCourseButton2.addEventListener("click", function () {
      addRow(coursesContainer2);
    });
  }

  // Initial rows
  ensureAtLeastOneRow(coursesContainer);
  ensureAtLeastOneRow(coursesContainer2);

  // ------------------------------------------------------------
  // 6) CALC HELPERS
  // ------------------------------------------------------------
  function readCourses(container) {
    if (!container) return { totalCredits: 0, totalQualityPoints: 0, rowsCounted: 0 };

    const rows = Array.from(container.querySelectorAll(".course-row"));
    let totalCredits = 0;
    let totalQualityPoints = 0;
    let rowsCounted = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const creditsInput = row.querySelector('input[id*="_credits_"]');
      const gradeInput = row.querySelector('input[id*="_grade_"]');

      const credits = toNumber(creditsInput ? creditsInput.value : "");
      const gradeRaw = toNumber(gradeInput ? gradeInput.value : "");
      const grade = clampToScale(gradeRaw);

      const hasAnything =
        (creditsInput && creditsInput.value.trim() !== "") ||
        (gradeInput && gradeInput.value.trim() !== "");

      if (!hasAnything) continue;

      if (!Number.isFinite(credits) || credits <= 0) {
        setResultError("Enter a valid credits value greater than 0 for each course you include.");
        return null;
      }

      if (!Number.isFinite(grade)) {
        setResultError("Enter valid grade points between 0 and the selected scale maximum.");
        return null;
      }

      totalCredits += credits;
      totalQualityPoints += credits * grade;
      rowsCounted += 1;
    }

    if (rowsCounted === 0) {
      setResultError("Add at least one course (credits and grade points) to calculate GPA.");
      return null;
    }

    return { totalCredits, totalQualityPoints, rowsCounted };
  }

  function getRoundingDigits() {
    const mode = modeSelect ? modeSelect.value : "fromScratch";
    const digits =
      mode === "updateExisting"
        ? toNumber(roundSelect2 ? roundSelect2.value : "2")
        : toNumber(roundSelect ? roundSelect.value : "2");

    if (digits === 3 || digits === 4) return digits;
    return 2;
  }

  function formatToDigits(value, digits) {
    if (!Number.isFinite(value)) return "";
    const factor = Math.pow(10, digits);
    const rounded = Math.round(value * factor) / factor;
    return rounded.toFixed(digits);
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const mode = modeSelect ? modeSelect.value : "fromScratch";
      const scaleMax = getScaleMax();
      const digits = getRoundingDigits();

      const target = toNumber(targetGpa ? targetGpa.value : "");
      const planned = toNumber(plannedCredits ? plannedCredits.value : "");

      const targetProvided = Number.isFinite(target) && target > 0;
      const plannedProvided = Number.isFinite(planned) && planned > 0;

      if (targetProvided && (target < 0 || target > scaleMax)) {
        setResultError("Target GPA must be between 0 and the selected scale maximum.");
        return;
      }

      if (plannedCredits && plannedCredits.value.trim() !== "" && (!plannedProvided || planned <= 0)) {
        setResultError("Future credits must be a valid number greater than 0 if you enter it.");
        return;
      }

      let baseCredits = 0;
      let baseQualityPoints = 0;
      let baseGpa = null;

      if (mode === "updateExisting") {
        const completedCredits = toNumber(currentCredits ? currentCredits.value : "");
        if (!Number.isFinite(completedCredits) || completedCredits <= 0) {
          setResultError("Enter your total completed credits (a number greater than 0).");
          return;
        }

        const gpaValue = toNumber(currentGpa ? currentGpa.value : "");
        const gpaProvided = Number.isFinite(gpaValue) && currentGpa && currentGpa.value.trim() !== "";

        if (gpaProvided) {
          if (gpaValue < 0 || gpaValue > scaleMax) {
            setResultError("Current cumulative GPA must be between 0 and the selected scale maximum.");
            return;
          }
          baseCredits = completedCredits;
          baseQualityPoints = completedCredits * gpaValue;
          baseGpa = gpaValue;
        } else {
          // If GPA not provided, treat base quality points as unknown and only compute term GPA
          baseCredits = completedCredits;
          baseQualityPoints = NaN;
          baseGpa = null;
        }
      }

      const coursesData =
        mode === "updateExisting" ? readCourses(coursesContainer2) : readCourses(coursesContainer);

      if (!coursesData) return;

      const newCredits = coursesData.totalCredits;
      const newQualityPoints = coursesData.totalQualityPoints;
      const newGpa = newQualityPoints / newCredits;

      let cumulativeCredits = newCredits;
      let cumulativeQualityPoints = newQualityPoints;
      let cumulativeGpa = newGpa;

      if (mode === "updateExisting" && baseGpa !== null) {
        cumulativeCredits = baseCredits + newCredits;
        cumulativeQualityPoints = baseQualityPoints + newQualityPoints;
        cumulativeGpa = cumulativeQualityPoints / cumulativeCredits;
      }

      // Planning: required average on planned future credits to hit target GPA
      let planningHtml = "";
      if (targetProvided && plannedProvided) {
        const currentCreditsForPlanning = mode === "updateExisting" && baseGpa !== null ? cumulativeCredits : newCredits;
        const currentQPForPlanning = mode === "updateExisting" && baseGpa !== null ? cumulativeQualityPoints : newQualityPoints;

        const neededTotalCredits = currentCreditsForPlanning + planned;
        const neededTotalQualityPoints = target * neededTotalCredits;
        const remainingQualityPointsNeeded = neededTotalQualityPoints - currentQPForPlanning;
        const requiredAvg = remainingQualityPointsNeeded / planned;

        if (requiredAvg <= 0) {
          planningHtml = `
            <p><strong>Target planning:</strong> Based on your inputs, your target GPA is already achievable without needing a positive average on future credits (mathematically).</p>
          `;
        } else if (requiredAvg > scaleMax) {
          planningHtml = `
            <p><strong>Target planning:</strong> To reach <strong>${formatToDigits(target, digits)}</strong> with <strong>${formatToDigits(planned, 0)}</strong> future credits, you would need an average of <strong>${formatToDigits(requiredAvg, digits)}</strong>. That exceeds the selected scale maximum of <strong>${formatToDigits(scaleMax, 1)}</strong>, so the target is not reachable under these assumptions.</p>
          `;
        } else {
          planningHtml = `
            <p><strong>Target planning:</strong> To reach <strong>${formatToDigits(target, digits)}</strong> with <strong>${formatToDigits(planned, 0)}</strong> future credits, you would need an average of <strong>${formatToDigits(requiredAvg, digits)}</strong> on those future credits (on a ${formatToDigits(scaleMax, 1)} scale).</p>
          `;
        }
      }

      // Build output HTML
      let resultHtml = "";

      if (mode === "fromScratch") {
        resultHtml = `
          <p><strong>Cumulative GPA:</strong> ${formatToDigits(cumulativeGpa, digits)} (on a ${formatToDigits(scaleMax, 1)} scale)</p>
          <p><strong>Total credits counted:</strong> ${formatToDigits(cumulativeCredits, 0)}</p>
          <p><strong>Total quality points:</strong> ${formatToDigits(cumulativeQualityPoints, digits)}</p>
          <p><strong>Courses included:</strong> ${coursesData.rowsCounted}</p>
          ${planningHtml}
        `;
      } else {
        if (baseGpa === null) {
          // Cannot compute updated cumulative GPA without current GPA
          resultHtml = `
            <p><strong>New courses GPA:</strong> ${formatToDigits(newGpa, digits)} (on a ${formatToDigits(scaleMax, 1)} scale)</p>
            <p><strong>New credits counted:</strong> ${formatToDigits(newCredits, 0)}</p>
            <p><strong>New quality points:</strong> ${formatToDigits(newQualityPoints, digits)}</p>
            <p><strong>Note:</strong> To calculate an updated cumulative GPA, enter your current cumulative GPA as well.</p>
            ${planningHtml}
          `;
        } else {
          const beforeGpaText = formatToDigits(baseGpa, digits);
          const afterGpaText = formatToDigits(cumulativeGpa, digits);
          const delta = cumulativeGpa - baseGpa;
          const deltaText = formatToDigits(delta, digits);

          resultHtml = `
            <p><strong>Updated cumulative GPA:</strong> ${afterGpaText} (was ${beforeGpaText})</p>
            <p><strong>Change:</strong> ${delta >= 0 ? "+" : ""}${deltaText}</p>
            <p><strong>Total credits (after update):</strong> ${formatToDigits(cumulativeCredits, 0)}</p>
            <p><strong>Total quality points (after update):</strong> ${formatToDigits(cumulativeQualityPoints, digits)}</p>
            <hr>
            <p><strong>New courses GPA:</strong> ${formatToDigits(newGpa, digits)}</p>
            <p><strong>New credits counted:</strong> ${formatToDigits(newCredits, 0)}</p>
            ${planningHtml}
          `;
        }
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Cumulative GPA Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
