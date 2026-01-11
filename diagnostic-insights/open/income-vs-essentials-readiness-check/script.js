document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const incomeMonthly = document.getElementById("incomeMonthly");
  const incomeMonthlyRange = document.getElementById("incomeMonthlyRange");

  const essentialsMonthly = document.getElementById("essentialsMonthly");
  const essentialsMonthlyRange = document.getElementById("essentialsMonthlyRange");

  const essentialDebt = document.getElementById("essentialDebt");
  const essentialDebtRange = document.getElementById("essentialDebtRange");

  const irregularEssentials = document.getElementById("irregularEssentials");
  const irregularEssentialsRange = document.getElementById("irregularEssentialsRange");

  const incomeVariabilityPct = document.getElementById("incomeVariabilityPct");
  const incomeVariabilityPctRange = document.getElementById("incomeVariabilityPctRange");

  const expenseBufferPct = document.getElementById("expenseBufferPct");
  const expenseBufferPctRange = document.getElementById("expenseBufferPctRange");

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) {
      const stripped = String(raw || "").replace(/[^\d.,-]/g, "");
      return stripped;
    }
    return formatWithCommas(n);
  }

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

  function bindRangeAndNumber(numberEl, rangeEl, opts) {
    if (!numberEl || !rangeEl) return;

    const min = typeof opts.min === "number" ? opts.min : Number(rangeEl.min);
    const max = typeof opts.max === "number" ? opts.max : Number(rangeEl.max);
    const allowDecimals = !!opts.allowDecimals;

    function normalizeAndSyncFromNumber() {
      const n = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(n)) return;

      const bounded = clamp(n, min, max);
      const finalVal = allowDecimals ? bounded : Math.round(bounded);

      numberEl.value = allowDecimals ? String(finalVal) : formatWithCommas(finalVal);
      rangeEl.value = String(finalVal);
    }

    function syncFromRange() {
      const n = Number(rangeEl.value);
      if (!Number.isFinite(n)) return;
      numberEl.value = allowDecimals ? String(n) : formatWithCommas(n);
    }

    numberEl.addEventListener("input", function () {
      numberEl.value = formatInputWithCommas(numberEl.value);
    });

    numberEl.addEventListener("blur", function () {
      normalizeAndSyncFromNumber();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        normalizeAndSyncFromNumber();
        numberEl.blur();
      }
    });

    rangeEl.addEventListener("input", function () {
      syncFromRange();
      clearResult();
    });

    if (opts.defaultValue !== undefined) {
      const d = Number(opts.defaultValue);
      if (Number.isFinite(d)) {
        const bounded = clamp(d, min, max);
        rangeEl.value = String(bounded);
        numberEl.value = allowDecimals ? String(bounded) : formatWithCommas(bounded);
      }
    }
  }

  bindRangeAndNumber(incomeMonthly, incomeMonthlyRange, { min: 0, max: 500000, defaultValue: 30000 });
  bindRangeAndNumber(essentialsMonthly, essentialsMonthlyRange, { min: 0, max: 500000, defaultValue: 18000 });
  bindRangeAndNumber(essentialDebt, essentialDebtRange, { min: 0, max: 200000, defaultValue: 2000 });
  bindRangeAndNumber(irregularEssentials, irregularEssentialsRange, { min: 0, max: 200000, defaultValue: 1500 });
  bindRangeAndNumber(incomeVariabilityPct, incomeVariabilityPctRange, { min: 0, max: 40, defaultValue: 10 });
  bindRangeAndNumber(expenseBufferPct, expenseBufferPctRange, { min: 0, max: 30, defaultValue: 10 });

  function validateNonNegativeFinite(n, label) {
    if (!Number.isFinite(n) || n < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositiveFinite(n, label) {
    if (!Number.isFinite(n) || n <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeMonthly ? incomeMonthly.value : "");
      const essentials = parseLooseNumber(essentialsMonthly ? essentialsMonthly.value : "");
      const debtMin = parseLooseNumber(essentialDebt ? essentialDebt.value : "");
      const irregular = parseLooseNumber(irregularEssentials ? irregularEssentials.value : "");
      const incomeVarPct = parseLooseNumber(incomeVariabilityPct ? incomeVariabilityPct.value : "");
      const bufferPct = parseLooseNumber(expenseBufferPct ? expenseBufferPct.value : "");

      if (!incomeMonthly || !essentialsMonthly || !essentialDebt || !irregularEssentials || !incomeVariabilityPct || !expenseBufferPct) return;

      if (!validatePositiveFinite(income, "monthly income")) return;
      if (!validatePositiveFinite(essentials, "monthly essential expenses")) return;
      if (!validateNonNegativeFinite(debtMin, "minimum debt payments")) return;
      if (!validateNonNegativeFinite(irregular, "irregular essentials")) return;

      if (!Number.isFinite(incomeVarPct) || incomeVarPct < 0 || incomeVarPct > 40) {
        setResultError("Enter a valid income variability between 0 and 40.");
        return;
      }

      if (!Number.isFinite(bufferPct) || bufferPct < 0 || bufferPct > 30) {
        setResultError("Enter a valid expense buffer between 0 and 30.");
        return;
      }

      const essentialsBase = essentials + debtMin + irregular;
      if (!Number.isFinite(essentialsBase) || essentialsBase <= 0) {
        setResultError("Your essential expenses total must be greater than 0.");
        return;
      }

      const reliableIncome = income * (1 - incomeVarPct / 100);
      const bufferedEssentials = essentialsBase * (1 + bufferPct / 100);

      if (!Number.isFinite(reliableIncome) || !Number.isFinite(bufferedEssentials) || bufferedEssentials <= 0) {
        setResultError("Inputs produced an invalid result. Re-check your numbers.");
        return;
      }

      const ratio = reliableIncome / bufferedEssentials;

      let classification = "";
      let interpretation = "";
      let action1 = "";
      let action2 = "";

      if (ratio < 1.0) {
        classification = "Underprepared";
        interpretation = "Your reliable income does not cover your buffered essentials, so the baseline structure is failing.";
        action1 = "Reduce non-essential outflows until baseline coverage reaches at least 1.00.";
        action2 = "Stabilise income or lower fixed obligations to stop recurring shortfalls.";
      } else if (ratio < 1.15) {
        classification = "Borderline";
        interpretation = "You cover essentials, but the margin is thin and small disruptions can push you into a shortfall.";
        action1 = "Increase margin by tightening essentials leakage and reducing minimum obligations where possible.";
        action2 = "Build a small monthly gap buffer before adding new commitments.";
      } else {
        classification = "Stable";
        interpretation = "You cover essentials with a margin that can absorb ordinary variability in income and expenses.";
        action1 = "Preserve margin by avoiding fixed-commitment creep as income changes.";
        action2 = "Direct surplus toward resilience: smoothing irregular essentials and reducing high-friction obligations.";
      }

      const shortfall = Math.max(0, bufferedEssentials - reliableIncome);
      const surplus = Math.max(0, reliableIncome - bufferedEssentials);

      const ratioDisplay = (Math.round(ratio * 100) / 100).toFixed(2);

      const html = `
        <div class="di-result-primary">
          <div class="di-section-title">${classification}</div>
          <p>${interpretation}</p>
          <div class="di-actions">
            <div class="di-section-title">Two immediate actions</div>
            <ul>
              <li>${action1}</li>
              <li>${action2}</li>
            </ul>
          </div>
        </div>

        <div class="di-result-secondary" aria-label="Secondary results panel">
          <div class="di-result-section-title>Secondary results</div>
          <div class="di-result-section-title">Key metric</div>
          <ul class="di-metric-list">
            <li>Coverage ratio (reliable income ÷ buffered essentials): <strong>${ratioDisplay}</strong></li>
            <li>Reliable income used: <strong>${formatWithCommas(reliableIncome)}</strong></li>
            <li>Buffered essentials used: <strong>${formatWithCommas(bufferedEssentials)}</strong></li>
          </ul>

          <div class="di-result-section-title">Inputs recap</div>
          <ul class="di-metric-list">
            <li>Income: ${formatWithCommas(income)}</li>
            <li>Essentials: ${formatWithCommas(essentials)}</li>
            <li>Minimum debt: ${formatWithCommas(debtMin)}</li>
            <li>Irregular essentials: ${formatWithCommas(irregular)}</li>
          </ul>

          <div class="di-result-section-title">Key drivers</div>
          <ul class="di-metric-list">
            <li>Income variability adjustment</li>
            <li>Expense buffer adjustment</li>
          </ul>

          <div class="di-result-section-title">Primary correction signal</div>
          <p class="di-mini">${shortfall > 0 ? "Gap to close (buffered essentials minus reliable income): " + formatWithCommas(shortfall) : "Surplus margin (reliable income minus buffered essentials): " + formatWithCommas(surplus)}</p>
        </div>
      `;

      setResultSuccess(html);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Check - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
