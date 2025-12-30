// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalClassesInput = document.getElementById("totalClasses");
  const absencesSoFarInput = document.getElementById("absencesSoFar");
  const plannedAbsencesInput = document.getElementById("plannedAbsences");
  const requiredAttendancePercentInput = document.getElementById("requiredAttendancePercent");
  const classLengthMinutesInput = document.getElementById("classLengthMinutes");

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
  attachLiveFormatting(totalClassesInput);
  attachLiveFormatting(absencesSoFarInput);
  attachLiveFormatting(plannedAbsencesInput);
  attachLiveFormatting(requiredAttendancePercentInput);
  attachLiveFormatting(classLengthMinutesInput);

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

  function formatCount(n) {
    return formatInputWithCommas(String(n));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Basic existence guard
      if (
        !totalClassesInput ||
        !absencesSoFarInput ||
        !plannedAbsencesInput ||
        !requiredAttendancePercentInput ||
        !classLengthMinutesInput
      ) {
        return;
      }

      // Parse inputs using toNumber() (from /scripts/main.js)
      const totalClasses = toNumber(totalClassesInput.value);
      const absencesSoFar = toNumber(absencesSoFarInput.value);
      const plannedAbsencesRaw = toNumber(plannedAbsencesInput.value);
      const requiredAttendanceRaw = toNumber(requiredAttendancePercentInput.value);
      const classLengthMinutesRaw = toNumber(classLengthMinutesInput.value);

      const plannedAbsences = Number.isFinite(plannedAbsencesRaw) ? plannedAbsencesRaw : 0;
      const requiredAttendancePercent = Number.isFinite(requiredAttendanceRaw) ? requiredAttendanceRaw : 75;
      const classLengthMinutes = Number.isFinite(classLengthMinutesRaw) ? classLengthMinutesRaw : 60;

      // Validation
      if (!validatePositive(totalClasses, "total scheduled classes")) return;
      if (!validateNonNegative(absencesSoFar, "absences so far")) return;
      if (!validateNonNegative(plannedAbsences, "planned additional absences")) return;

      if (!Number.isFinite(requiredAttendancePercent) || requiredAttendancePercent <= 0 || requiredAttendancePercent > 100) {
        setResultError("Enter a valid required attendance percentage between 1 and 100 (or leave it blank).");
        return;
      }

      if (!Number.isFinite(classLengthMinutes) || classLengthMinutes <= 0 || classLengthMinutes > 600) {
        setResultError("Enter a valid class length in minutes (or leave it blank).");
        return;
      }

      if (absencesSoFar > totalClasses) {
        setResultError("Absences so far cannot be higher than total scheduled classes.");
        return;
      }

      const projectedAbsences = absencesSoFar + plannedAbsences;
      if (projectedAbsences > totalClasses) {
        setResultError("Total absences (so far plus planned) cannot be higher than total scheduled classes.");
        return;
      }

      // Calculation logic
      const attendedSoFar = totalClasses - absencesSoFar;
      const currentAttendancePercent = (attendedSoFar / totalClasses) * 100;

      const projectedAttended = totalClasses - projectedAbsences;
      const projectedAttendancePercent = (projectedAttended / totalClasses) * 100;

      const maxAbsencesAllowed = Math.floor((totalClasses * (100 - requiredAttendancePercent)) / 100);
      const remainingAbsencesAllowed = maxAbsencesAllowed - absencesSoFar;

      const currentMeets = currentAttendancePercent + 1e-12 >= requiredAttendancePercent;
      const projectedMeets = projectedAttendancePercent + 1e-12 >= requiredAttendancePercent;

      const projectedMissedHours = (projectedAbsences * classLengthMinutes) / 60;

      let thresholdLine = "";
      if (remainingAbsencesAllowed >= 0) {
        thresholdLine =
          "<p><strong>More absences you can still miss and stay at or above " +
          formatNumberTwoDecimals(requiredAttendancePercent) +
          "%:</strong> " +
          formatCount(remainingAbsencesAllowed) +
          "</p>";
      } else {
        thresholdLine =
          "<p><strong>You are already below the required threshold.</strong> You would need to reduce absences (if your policy allows make-up attendance) or confirm whether excused absences are treated differently.</p>";
      }

      // Build output HTML
      const statusCurrent = currentMeets ? "Meets requirement" : "Below requirement";
      const statusProjected = projectedMeets ? "Meets requirement" : "Below requirement";

      const resultHtml =
        "<p><strong>Current attendance:</strong> " +
        formatNumberTwoDecimals(currentAttendancePercent) +
        "% (" +
        statusCurrent +
        ")</p>" +
        "<p><strong>Projected attendance (after planned absences):</strong> " +
        formatNumberTwoDecimals(projectedAttendancePercent) +
        "% (" +
        statusProjected +
        ")</p>" +
        "<p><strong>Absences so far:</strong> " +
        formatCount(absencesSoFar) +
        " of " +
        formatCount(totalClasses) +
        " classes</p>" +
        "<p><strong>Total absences after plans:</strong> " +
        formatCount(projectedAbsences) +
        " classes</p>" +
        "<p><strong>Estimated hours missed after plans:</strong> " +
        formatNumberTwoDecimals(projectedMissedHours) +
        " hours</p>" +
        thresholdLine +
        "<p><strong>Policy threshold used:</strong> " +
        formatNumberTwoDecimals(requiredAttendancePercent) +
        "%</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Absence Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
