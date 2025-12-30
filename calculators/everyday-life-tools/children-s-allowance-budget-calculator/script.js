document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const childrenCount = document.getElementById("childrenCount");
  const weeklyAllowancePerChild = document.getElementById("weeklyAllowancePerChild");
  const spendPercent = document.getElementById("spendPercent");
  const savePercent = document.getElementById("savePercent");
  const givePercent = document.getElementById("givePercent");

  const showAdvanced = document.getElementById("showAdvanced");
  const advancedFields = document.getElementById("advancedFields");
  const bonusPerChildWeekly = document.getElementById("bonusPerChildWeekly");
  const weeksPerMonth = document.getElementById("weeksPerMonth");
  const extraMonthly = document.getElementById("extraMonthly");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(childrenCount);
  attachLiveFormatting(weeklyAllowancePerChild);
  attachLiveFormatting(spendPercent);
  attachLiveFormatting(savePercent);
  attachLiveFormatting(givePercent);
  attachLiveFormatting(bonusPerChildWeekly);
  attachLiveFormatting(weeksPerMonth);
  attachLiveFormatting(extraMonthly);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  function roundToTwo(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // ------------------------------------------------------------
  // Advanced toggle
  // ------------------------------------------------------------
  if (showAdvanced && advancedFields) {
    advancedFields.classList.add("hidden");
    showAdvanced.addEventListener("change", function () {
      if (showAdvanced.checked) {
        advancedFields.classList.remove("hidden");
      } else {
        advancedFields.classList.add("hidden");
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const kids = toNumber(childrenCount ? childrenCount.value : "");
      const baseWeekly = toNumber(weeklyAllowancePerChild ? weeklyAllowancePerChild.value : "");

      const spendPct = toNumber(spendPercent ? spendPercent.value : "");
      const savePct = toNumber(savePercent ? savePercent.value : "");
      const givePct = toNumber(givePercent ? givePercent.value : "");

      const bonusWeekly = toNumber(bonusPerChildWeekly ? bonusPerChildWeekly.value : "");
      const weeks = toNumber(weeksPerMonth ? weeksPerMonth.value : "");
      const extra = toNumber(extraMonthly ? extraMonthly.value : "");

      // Input existence guard
      if (!childrenCount || !weeklyAllowancePerChild || !spendPercent || !savePercent || !givePercent) return;

      // Validation
      if (!validatePositive(kids, "number of children")) return;
      if (kids > 20) {
        setResultError("Enter a realistic number of children (20 or fewer).");
        return;
      }

      if (!validatePositive(baseWeekly, "weekly allowance per child")) return;

      if (!validatePercent(spendPct, "spend percentage")) return;
      if (!validatePercent(savePct, "save percentage")) return;
      if (!validatePercent(givePct, "give percentage")) return;

      const pctTotal = roundToTwo(spendPct + savePct + givePct);
      if (pctTotal !== 100) {
        setResultError("Your spend + save + give percentages must add up to 100%. Current total: " + pctTotal + "%.");
        return;
      }

      const safeBonus = Number.isFinite(bonusWeekly) ? bonusWeekly : 0;
      const safeWeeks = Number.isFinite(weeks) && weeks > 0 ? weeks : 4.33;
      const safeExtra = Number.isFinite(extra) ? extra : 0;

      if (!validateNonNegative(safeBonus, "weekly bonus per child")) return;
      if (!validatePositive(safeWeeks, "weeks per month")) return;
      if (safeWeeks > 5) {
        setResultError("Weeks per month looks too high. Use a value between 4.0 and 4.5 for most monthly budgets.");
        return;
      }
      if (!validateNonNegative(safeExtra, "extra monthly top-up")) return;

      // Calculation logic
      const weeklyBonusTotal = safeBonus * kids;
      const weeklyBaseTotal = baseWeekly * kids;
      const weeklyTotal = weeklyBaseTotal + weeklyBonusTotal;

      const monthlyBaseTotal = weeklyTotal * safeWeeks;
      const monthlyTotalWithExtra = monthlyBaseTotal + safeExtra;

      const annualTotalWithExtra = monthlyTotalWithExtra * 12;

      const spendWeekly = weeklyBaseTotal * (spendPct / 100);
      const saveWeekly = weeklyBaseTotal * (savePct / 100);
      const giveWeekly = weeklyBaseTotal * (givePct / 100);

      const spendMonthly = spendWeekly * safeWeeks;
      const saveMonthly = saveWeekly * safeWeeks;
      const giveMonthly = giveWeekly * safeWeeks;

      const perChildWeeklyTotal = baseWeekly + safeBonus;
      const perChildMonthlyTotal = perChildWeeklyTotal * safeWeeks;

      // Build output HTML
      const resultHtml = `
        <p><strong>Weekly total (all children):</strong> ${formatNumberTwoDecimals(weeklyTotal)}</p>
        <p><strong>Estimated monthly total:</strong> ${formatNumberTwoDecimals(monthlyTotalWithExtra)}</p>
        <p><strong>Estimated annual total:</strong> ${formatNumberTwoDecimals(annualTotalWithExtra)}</p>

        <hr class="result-divider">

        <p><strong>Base allowance split (weekly, all children):</strong></p>
        <p>Spend: ${formatNumberTwoDecimals(spendWeekly)} | Save: ${formatNumberTwoDecimals(saveWeekly)} | Give: ${formatNumberTwoDecimals(giveWeekly)}</p>

        <p><strong>Base allowance split (monthly estimate):</strong></p>
        <p>Spend: ${formatNumberTwoDecimals(spendMonthly)} | Save: ${formatNumberTwoDecimals(saveMonthly)} | Give: ${formatNumberTwoDecimals(giveMonthly)}</p>

        <hr class="result-divider">

        <p><strong>Per child estimate:</strong></p>
        <p>Weekly (base + bonus): ${formatNumberTwoDecimals(perChildWeeklyTotal)}</p>
        <p>Monthly (estimated): ${formatNumberTwoDecimals(perChildMonthlyTotal)}</p>

        <p class="result-note">
          Notes: Monthly totals use ${formatNumberTwoDecimals(safeWeeks)} weeks per month. The spend/save/give split applies to the base allowance only.
        </p>
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
      const message = "Children’s Allowance Budget Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
