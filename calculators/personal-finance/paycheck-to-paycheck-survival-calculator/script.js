document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const daysUntilPayday = document.getElementById("daysUntilPayday");
  const currentCash = document.getElementById("currentCash");
  const essentialSpending = document.getElementById("essentialSpending");
  const discretionarySpending = document.getElementById("discretionarySpending");
  const otherIncome = document.getElementById("otherIncome");
  const safetyBuffer = document.getElementById("safetyBuffer");

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
  attachLiveFormatting(currentCash);
  attachLiveFormatting(essentialSpending);
  attachLiveFormatting(discretionarySpending);
  attachLiveFormatting(otherIncome);
  attachLiveFormatting(safetyBuffer);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const days = toNumber(daysUntilPayday ? daysUntilPayday.value : "");
      const cashNow = toNumber(currentCash ? currentCash.value : "");
      const essentials = toNumber(essentialSpending ? essentialSpending.value : "");
      const discretionaryPlanned = toNumber(discretionarySpending ? discretionarySpending.value : "");
      const incomeBeforePayday = toNumber(otherIncome ? otherIncome.value : "");
      const buffer = toNumber(safetyBuffer ? safetyBuffer.value : "");

      // Basic existence guard
      if (!daysUntilPayday || !currentCash || !essentialSpending) return;

      // Validation
      if (!validatePositive(days, "days until payday")) return;
      if (!validateNonNegative(cashNow, "cash available right now")) return;
      if (!validateNonNegative(essentials, "essential spending before payday")) return;
      if (!validateNonNegative(discretionaryPlanned, "optional spending before payday")) return;
      if (!validateNonNegative(incomeBeforePayday, "other income before payday")) return;
      if (!validateNonNegative(buffer, "safety buffer")) return;

      // Calculation logic
      const available = cashNow + incomeBeforePayday;
      const plannedTotal = essentials + discretionaryPlanned + buffer;
      const surplus = available - plannedTotal;

      const remainingAfterEssentialsAndBuffer = available - essentials - buffer;
      const maxFlexibleTotal = Math.max(0, remainingAfterEssentialsAndBuffer);
      const maxFlexiblePerDay = maxFlexibleTotal / days;

      const projectedAtPaydayIfPlanned = available - essentials - discretionaryPlanned;
      const projectedAtPaydayWithBufferKept = projectedAtPaydayIfPlanned - buffer;

      const plannedFlexibleOverBy = Math.max(0, discretionaryPlanned - maxFlexibleTotal);
      const requiredCutToSurvive = Math.max(0, -surplus);

      let statusLabel = "On track";
      if (surplus < 0) statusLabel = "At risk";
      if (surplus < -0.000001) statusLabel = "At risk";
      if (surplus >= 0 && buffer > 0 && projectedAtPaydayWithBufferKept < 0) statusLabel = "Tight";

      // Build output HTML
      const htmlParts = [];

      htmlParts.push(
        `<p><strong>Status:</strong> ${statusLabel}</p>`
      );

      htmlParts.push(
        `<p><strong>Projected balance at payday (after essentials + your planned optional spending + buffer):</strong> ${formatNumberTwoDecimals(projectedAtPaydayWithBufferKept)}</p>`
      );

      htmlParts.push(
        `<ul>
          <li><strong>Available funds before payday:</strong> ${formatNumberTwoDecimals(available)} (cash now + other income)</li>
          <li><strong>Essentials before payday:</strong> ${formatNumberTwoDecimals(essentials)}</li>
          <li><strong>Planned optional spending:</strong> ${formatNumberTwoDecimals(discretionaryPlanned)}</li>
          <li><strong>Safety buffer protected:</strong> ${formatNumberTwoDecimals(buffer)}</li>
        </ul>`
      );

      htmlParts.push(
        `<p><strong>Maximum flexible spending you can afford (total):</strong> ${formatNumberTwoDecimals(maxFlexibleTotal)}</p>`
      );

      htmlParts.push(
        `<p><strong>Maximum flexible spending per day:</strong> ${formatNumberTwoDecimals(maxFlexiblePerDay)}</p>`
      );

      if (requiredCutToSurvive > 0) {
        htmlParts.push(
          `<p><strong>Shortfall:</strong> ${formatNumberTwoDecimals(requiredCutToSurvive)}. You need to cut this amount (reduce optional spending, reduce essentials where possible, increase income before payday, or reduce buffer) to avoid running out.</p>`
        );
      } else {
        htmlParts.push(
          `<p><strong>Buffer after your plan:</strong> ${formatNumberTwoDecimals(surplus)}. This is how much margin you have after essentials, planned optional spending, and your chosen buffer.</p>`
        );
      }

      if (plannedFlexibleOverBy > 0) {
        htmlParts.push(
          `<p><strong>Your planned optional spending is above your safe limit by:</strong> ${formatNumberTwoDecimals(plannedFlexibleOverBy)}.</p>`
        );
      }

      const resultHtml = htmlParts.join("");

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
      const message = "Paycheck-to-Paycheck Survival Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
