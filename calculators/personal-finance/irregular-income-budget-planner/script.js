document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const incomeLowInput = document.getElementById("incomeLow");
  const incomeAvgInput = document.getElementById("incomeAvg");
  const incomeHighInput = document.getElementById("incomeHigh");
  const fixedCostsInput = document.getElementById("fixedCosts");
  const debtMinInput = document.getElementById("debtMin");
  const bufferPctInput = document.getElementById("bufferPct");
  const savingsPctInput = document.getElementById("savingsPct");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
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
  attachLiveFormatting(incomeLowInput);
  attachLiveFormatting(incomeAvgInput);
  attachLiveFormatting(incomeHighInput);
  attachLiveFormatting(fixedCostsInput);
  attachLiveFormatting(debtMinInput);

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

  function clampPercent(pct) {
    if (!Number.isFinite(pct)) return null;
    return Math.max(0, Math.min(100, pct));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const incomeLow = toNumber(incomeLowInput ? incomeLowInput.value : "");
      const incomeAvg = toNumber(incomeAvgInput ? incomeAvgInput.value : "");
      const incomeHigh = toNumber(incomeHighInput ? incomeHighInput.value : "");
      const fixedCosts = toNumber(fixedCostsInput ? fixedCostsInput.value : "");
      const debtMin = toNumber(debtMinInput ? debtMinInput.value : "");
      const bufferPctRaw = toNumber(bufferPctInput ? bufferPctInput.value : "");
      const savingsPctRaw = toNumber(savingsPctInput ? savingsPctInput.value : "");

      // Basic existence guard
      if (
        !incomeLowInput ||
        !incomeAvgInput ||
        !incomeHighInput ||
        !fixedCostsInput ||
        !debtMinInput ||
        !bufferPctInput ||
        !savingsPctInput
      ) {
        return;
      }

      // Validation
      const hasLow = Number.isFinite(incomeLow) && incomeLow > 0;
      const hasAvg = Number.isFinite(incomeAvg) && incomeAvg > 0;

      if (!hasLow && !hasAvg) {
        setResultError("Enter at least a Low month income or a Typical month income.");
        return;
      }

      if (!validateNonNegative(fixedCosts, "Fixed essentials per month")) return;
      if (!validateNonNegative(debtMin, "Minimum debt payments per month")) return;

      if (Number.isFinite(incomeLow) && incomeLow < 0) {
        setResultError("Enter a valid Low month income (0 or higher).");
        return;
      }
      if (Number.isFinite(incomeAvg) && incomeAvg < 0) {
        setResultError("Enter a valid Typical month income (0 or higher).");
        return;
      }
      if (Number.isFinite(incomeHigh) && incomeHigh < 0) {
        setResultError("Enter a valid High month income (0 or higher).");
        return;
      }

      // Optional percent defaults
      let bufferPct = clampPercent(bufferPctRaw);
      let savingsPct = clampPercent(savingsPctRaw);

      if (!Number.isFinite(bufferPctRaw) || bufferPctRaw === 0) {
        // If user literally wants 0 they can enter 0; but blank parses to 0 too.
        // We treat blank as default 10 by checking the raw input string.
        bufferPct = bufferPctInput.value.trim() === "" ? 10 : bufferPct;
      }
      if (!Number.isFinite(savingsPctRaw) || savingsPctRaw === 0) {
        savingsPct = savingsPctInput.value.trim() === "" ? 10 : savingsPct;
      }

      if (!Number.isFinite(bufferPct) || bufferPct < 0 || bufferPct > 100) {
        setResultError("Enter a valid Buffer target (%) between 0 and 100.");
        return;
      }
      if (!Number.isFinite(savingsPct) || savingsPct < 0 || savingsPct > 100) {
        setResultError("Enter a valid Savings target (%) between 0 and 100.");
        return;
      }

      // Calculation logic
      const baseIncome = hasLow ? incomeLow : incomeAvg;
      const baseCommitments = fixedCosts + debtMin;
      const baseAfterCommitments = baseIncome - baseCommitments;

      if (!Number.isFinite(baseIncome) || baseIncome <= 0) {
        setResultError("Enter a valid monthly income greater than 0.");
        return;
      }

      if (baseAfterCommitments < 0) {
        const shortfall = Math.abs(baseAfterCommitments);
        const resultHtml = `
          <p><strong>Base plan result:</strong> Your fixed essentials (and minimum debt payments, if included) are higher than your base income.</p>
          <p><strong>Base income used:</strong> ${formatNumberTwoDecimals(baseIncome)}</p>
          <p><strong>Essentials + minimum debt:</strong> ${formatNumberTwoDecimals(baseCommitments)}</p>
          <p><strong>Monthly shortfall:</strong> ${formatNumberTwoDecimals(shortfall)}</p>
          <p>This is a structural gap. Reduce fixed costs, increase reliable income, renegotiate payments, or plan a temporary bridge while you restructure.</p>
        `;
        setResultSuccess(resultHtml);
        return;
      }

      // Allocate from money left after commitments
      const bufferAmount = (baseAfterCommitments * bufferPct) / 100;
      const savingsAmount = (baseAfterCommitments * savingsPct) / 100;
      const remainingAfterTargets = baseAfterCommitments - bufferAmount - savingsAmount;

      // If targets exceed available (possible if user sets very high %)
      if (remainingAfterTargets < 0) {
        setResultError("Your buffer and savings targets are too high for the money left after fixed costs. Reduce the percentages and try again.");
        return;
      }

      const baseDiscretionary = remainingAfterTargets;

      // Flex plan: extra money in typical/high months compared with base income
      const avgExtra = hasAvg ? Math.max(0, incomeAvg - baseIncome) : 0;
      const highExtra = Number.isFinite(incomeHigh) && incomeHigh > 0 ? Math.max(0, incomeHigh - baseIncome) : 0;

      function buildFlexSplit(extraAmount) {
        // Simple, defensible split: stability first.
        // 50% stability (buffer/emergency + overdue essentials), 30% goals (debt/savings), 20% lifestyle/sinking funds
        const stability = extraAmount * 0.5;
        const goals = extraAmount * 0.3;
        const lifestyle = extraAmount * 0.2;
        return { stability, goals, lifestyle };
      }

      const avgSplit = buildFlexSplit(avgExtra);
      const highSplit = buildFlexSplit(highExtra);

      // Build output HTML
      const resultHtml = `
        <p><strong>Base budget (built from a conservative month):</strong></p>
        <p><strong>Base income used:</strong> ${formatNumberTwoDecimals(baseIncome)}</p>

        <p><strong>Step 1: Cover commitments</strong><br>
        Fixed essentials: ${formatNumberTwoDecimals(fixedCosts)}<br>
        Minimum debt payments: ${formatNumberTwoDecimals(debtMin)}<br>
        <strong>Total commitments:</strong> ${formatNumberTwoDecimals(baseCommitments)}</p>

        <p><strong>Money left after commitments:</strong> ${formatNumberTwoDecimals(baseAfterCommitments)}</p>

        <p><strong>Step 2: Targets from what is left</strong><br>
        Buffer (${bufferPct}%): ${formatNumberTwoDecimals(bufferAmount)}<br>
        Savings (${savingsPct}%): ${formatNumberTwoDecimals(savingsAmount)}<br>
        <strong>Discretionary / variable spending cap:</strong> ${formatNumberTwoDecimals(baseDiscretionary)}</p>

        <p><strong>Flex plan (what to do in better months):</strong><br>
        Use extra income to stabilize first, then progress goals, then lifestyle. This prevents “good-month spending” from breaking your budget in low months.</p>

        ${
          hasAvg
            ? `<p><strong>If you earn your typical month income:</strong> extra available vs base = ${formatNumberTwoDecimals(avgExtra)}<br>
               Suggested split: stability ${formatNumberTwoDecimals(avgSplit.stability)}, goals ${formatNumberTwoDecimals(avgSplit.goals)}, lifestyle/sinking funds ${formatNumberTwoDecimals(avgSplit.lifestyle)}.</p>`
            : `<p><strong>Tip:</strong> Add a Typical month income to get a clear flex plan for average months.</p>`
        }

        ${
          highExtra > 0
            ? `<p><strong>If you earn your high month income:</strong> extra available vs base = ${formatNumberTwoDecimals(highExtra)}<br>
               Suggested split: stability ${formatNumberTwoDecimals(highSplit.stability)}, goals ${formatNumberTwoDecimals(highSplit.goals)}, lifestyle/sinking funds ${formatNumberTwoDecimals(highSplit.lifestyle)}.</p>`
            : `<p><strong>Tip:</strong> Add a High month income to plan how to use peak months without lifestyle creep.</p>`
        }
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
      const message = "Irregular Income Budget Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
