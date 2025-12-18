document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const credits1 = document.getElementById("credits1");
  const grade1 = document.getElementById("grade1");
  const credits2 = document.getElementById("credits2");
  const grade2 = document.getElementById("grade2");
  const credits3 = document.getElementById("credits3");
  const grade3 = document.getElementById("grade3");
  const credits4 = document.getElementById("credits4");
  const grade4 = document.getElementById("grade4");
  const credits5 = document.getElementById("credits5");
  const grade5 = document.getElementById("grade5");
  const credits6 = document.getElementById("credits6");
  const grade6 = document.getElementById("grade6");
  const credits7 = document.getElementById("credits7");
  const grade7 = document.getElementById("grade7");
  const credits8 = document.getElementById("credits8");
  const grade8 = document.getElementById("grade8");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Credits can be typed as whole numbers, but commas are harmless if someone pastes large values.
  attachLiveFormatting(credits1);
  attachLiveFormatting(credits2);
  attachLiveFormatting(credits3);
  attachLiveFormatting(credits4);
  attachLiveFormatting(credits5);
  attachLiveFormatting(credits6);
  attachLiveFormatting(credits7);
  attachLiveFormatting(credits8);

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

  // ------------------------------------------------------------
  // CALCULATOR HELPERS
  // ------------------------------------------------------------
  function normalizeGradeText(raw) {
    if (!raw) return "";
    return String(raw).trim().toUpperCase().replace(/\s+/g, "");
  }

  function gradeToPoints(gradeRaw) {
    const g = normalizeGradeText(gradeRaw);
    if (!g) return NaN;

    const numeric = toNumber(g);
    if (Number.isFinite(numeric)) return numeric;

    const map = {
      "A+": 4.0,
      "A": 4.0,
      "A-": 3.7,
      "B+": 3.3,
      "B": 3.0,
      "B-": 2.7,
      "C+": 2.3,
      "C": 2.0,
      "C-": 1.7,
      "D+": 1.3,
      "D": 1.0,
      "D-": 0.7,
      "F": 0.0,
      "E": 0.0
    };

    return Object.prototype.hasOwnProperty.call(map, g) ? map[g] : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const rows = [
        { creditsEl: credits1, gradeEl: grade1, label: "Course 1" },
        { creditsEl: credits2, gradeEl: grade2, label: "Course 2" },
        { creditsEl: credits3, gradeEl: grade3, label: "Course 3" },
        { creditsEl: credits4, gradeEl: grade4, label: "Course 4" },
        { creditsEl: credits5, gradeEl: grade5, label: "Course 5" },
        { creditsEl: credits6, gradeEl: grade6, label: "Course 6" },
        { creditsEl: credits7, gradeEl: grade7, label: "Course 7" },
        { creditsEl: credits8, gradeEl: grade8, label: "Course 8" }
      ];

      let totalCredits = 0;
      let totalQualityPoints = 0;
      let countedCourses = 0;

      let maxCreditCourse = null;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.creditsEl || !r.gradeEl) continue;

        const creditsRaw = (r.creditsEl.value || "").trim();
        const gradeRaw = (r.gradeEl.value || "").trim();

        const creditsEmpty = creditsRaw === "";
        const gradeEmpty = gradeRaw === "";

        if (creditsEmpty && gradeEmpty) continue;

        if (creditsEmpty && !gradeEmpty) {
          setResultError("For " + r.label + ", enter credits to match the grade you provided.");
          return;
        }

        if (!creditsEmpty && gradeEmpty) {
          setResultError("For " + r.label + ", enter a grade (letter like B+ or points like 3.3).");
          return;
        }

        const credits = toNumber(creditsRaw);
        if (!validatePositive(credits, r.label + " credits")) return;

        const gp = gradeToPoints(gradeRaw);
        if (!Number.isFinite(gp)) {
          setResultError("For " + r.label + ", enter a valid letter grade (A, B+, C-) or grade points (0.0 to 4.0).");
          return;
        }

        const gradePoints = clamp(gp, 0, 4);
        if (gradePoints !== gp) {
          setResultError("For " + r.label + ", grade points must be between 0.0 and 4.0.");
          return;
        }

        const qualityPoints = credits * gradePoints;

        totalCredits += credits;
        totalQualityPoints += qualityPoints;
        countedCourses += 1;

        if (!maxCreditCourse || credits > maxCreditCourse.credits) {
          maxCreditCourse = { label: r.label, credits: credits, gradePoints: gradePoints };
        }
      }

      if (countedCourses === 0 || !Number.isFinite(totalCredits) || totalCredits <= 0) {
        setResultError("Enter at least one course with both credits and a grade.");
        return;
      }

      const semesterGpa = totalQualityPoints / totalCredits;

      // Secondary insight: "small step" improvement on highest-credit course (approx +0.3 points, capped at 4.0)
      let scenarioHtml = "";
      if (maxCreditCourse && Number.isFinite(maxCreditCourse.gradePoints)) {
        const step = 0.3;
        const improved = Math.min(4.0, maxCreditCourse.gradePoints + step);
        const deltaQp = maxCreditCourse.credits * (improved - maxCreditCourse.gradePoints);
        const improvedGpa = (totalQualityPoints + deltaQp) / totalCredits;
        const gpaDelta = improvedGpa - semesterGpa;

        scenarioHtml = `
          <p><strong>Quick improvement scenario:</strong> If ${maxCreditCourse.label} improved by a small step (about +${formatNumberTwoDecimals(step)} grade points, capped at 4.0), your semester GPA would be approximately <strong>${formatNumberTwoDecimals(improvedGpa)}</strong> (change: ${formatNumberTwoDecimals(gpaDelta)}).</p>
        `;
      }

      const resultHtml = `
        <p><strong>Semester GPA:</strong> ${formatNumberTwoDecimals(semesterGpa)}</p>
        <p><strong>Total credits counted:</strong> ${formatNumberTwoDecimals(totalCredits)}</p>
        <p><strong>Total quality points:</strong> ${formatNumberTwoDecimals(totalQualityPoints)}</p>
        ${scenarioHtml}
        <p><strong>How to read this:</strong> Quality points = credits × grade points for each course. Semester GPA = total quality points ÷ total credits.</p>
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
      const message = "Semester GPA Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
