// script.js
document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const secondaryDiv = document.getElementById("diSecondary");

  const incomeNumber = document.getElementById("incomeNumber");
  const incomeRange = document.getElementById("incomeRange");

  const essentialsNumber = document.getElementById("essentialsNumber");
  const essentialsRange = document.getElementById("essentialsRange");

  const nonMonthlyNumber = document.getElementById("nonMonthlyNumber");
  const nonMonthlyRange = document.getElementById("nonMonthlyRange");

  const bufferNumber = document.getElementById("bufferNumber");
  const bufferRange = document.getElementById("bufferRange");

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

  function setSecondary(html) {
    if (!secondaryDiv) return;
    secondaryDiv.innerHTML = html;
  }

  function clearSecondary() {
    if (!secondaryDiv) return;
    secondaryDiv.innerHTML = "";
  }

  function parseLooseNumber(value) {
    if (typeof value !== "string") return NaN;
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatPercentTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 100) / 100).toFixed(2) + "%";
  }

  function formatRatioTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function formatInputWithCommas(raw) {
    const num = parseLooseNumber(raw);
    if (!Number.isFinite(num)) return raw.replace(/[^\d,.-]/g, "");
    return formatWithCommas(num);
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, isPercent) {
    if (!rangeEl || !numberEl) return;

    function syncNumberToRange() {
      const v = parseLooseNumber(rangeEl.value);
      const clamped = clamp(v, min, max);
      numberEl.value = isPercent ? String(Math.round(clamped)) : formatWithCommas(clamped);
    }

    function syncRangeToNumber() {
      const v = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(v)) return;
      const clamped = clamp(v, min, max);
      rangeEl.value = String(clamped);
    }

    rangeEl.addEventListener("input", function () {
      syncNumberToRange();
      clearResult();
      clearSecondary();
    });

    numberEl.addEventListener("input", function () {
      if (!isPercent) numberEl.value = formatInputWithCommas(numberEl.value);
      clearResult();
      clearSecondary();
    });

    function commitNumber() {
      const v = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(v)) {
        syncNumberToRange();
        return;
      }
      const clamped = clamp(v, min, max);
      rangeEl.value = String(clamped);
      numberEl.value = isPercent ? String(Math.round(clamped)) : formatWithCommas(clamped);
    }

    numberEl.addEventListener("blur", commitNumber);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        commitNumber();
        numberEl.blur();
      }
    });

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    syncNumberToRange();
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(essentialsNumber);
  attachLiveFormatting(nonMonthlyNumber);

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000, 500, false);
  bindRangeAndNumber(essentialsRange, essentialsNumber, 0, 400000, 500, false);
  bindRangeAndNumber(nonMonthlyRange, nonMonthlyNumber, 0, 200000, 250, false);
  bindRangeAndNumber(bufferRange, bufferNumber, 0, 50, 1, true);

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();
      clearSecondary();

      if (!incomeNumber || !essentialsNumber || !nonMonthlyNumber || !bufferNumber) return;

      const income = parseLooseNumber(incomeNumber.value);
      const essentials = parseLooseNumber(essentialsNumber.value);
      const nonMonthly = parseLooseNumber(nonMonthlyNumber.value);
      const bufferPct = parseLooseNumber(bufferNumber.value);

      if (!Number.isFinite(income) || income < 0) {
        setResultError("Enter a valid monthly take-home income (0 or higher).");
        return;
      }

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter a valid monthly essential expenses amount greater than 0.");
        return;
      }

      if (!Number.isFinite(nonMonthly) || nonMonthly < 0) {
        setResultError("Enter a valid non-monthly essentials amount (0 or higher).");
        return;
      }

      if (!Number.isFinite(bufferPct) || bufferPct < 0 || bufferPct > 50) {
        setResultError("Enter a valid buffer target between 0 and 50.");
        return;
      }

      const baseEssentials = essentials + nonMonthly;
      if (!Number.isFinite(baseEssentials) || baseEssentials <= 0) {
        setResultError("Essentials total must be greater than 0.");
        return;
      }

      const bufferMultiplier = 1 + bufferPct / 100;
      const requiredIncome = baseEssentials * bufferMultiplier;

      if (!Number.isFinite(requiredIncome) || requiredIncome <= 0) {
        setResultError("Unable to calculate a valid required income. Check inputs.");
        return;
      }

      const coverageRatio = income / requiredIncome;
      if (!Number.isFinite(coverageRatio)) {
        setResultError("Unable to calculate a valid coverage ratio. Check inputs.");
        return;
      }

      const stableThreshold = 1.15;
      const borderlineThreshold = 1.0;

      let status = "";
      let interpretation = "";

      if (coverageRatio < borderlineThreshold) {
        status = "Underprepared";
        interpretation = "Income does not cover essentials plus the chosen buffer. The baseline is structurally short.";
      } else if (coverageRatio < stableThreshold) {
        status = "Borderline";
        interpretation = "Income covers essentials, but the margin is thin. Normal variance can break the month.";
      } else {
        status = "Stable";
        interpretation = "Income covers essentials plus a meaningful buffer. The baseline is resilient to normal variance.";
      }

      const gapToBorderline = Math.max(0, requiredIncome - income);
      const requiredForStable = requiredIncome * stableThreshold;
      const gapToStable = Math.max(0, requiredForStable - income);

      let action1 = "";
      let action2 = "";

      if (status === "Stable") {
        const protectMargin = income - requiredIncome;
        action1 = "Protect the margin by keeping essentials flat as income changes.";
        action2 = "Use the margin intentionally (buffer building, debt reduction, or skill investment) instead of lifestyle creep.";
        if (protectMargin < 0) {
          action1 = "Re-check inputs. The calculation indicates no margin despite a stable classification.";
        }
      } else {
        const incomeIncreaseToBorderline = gapToBorderline;
        const essentialsCutToBorderline = Math.max(0, baseEssentials - (income / bufferMultiplier));

        action1 =
          "To reach the minimum baseline (borderline), increase reliable monthly income by " +
          formatWithCommas(incomeIncreaseToBorderline) +
          " or reduce essentials by about " +
          formatWithCommas(essentialsCutToBorderline) +
          ".";

        const incomeIncreaseToStable = gapToStable;
        const essentialsCutToStable = Math.max(0, baseEssentials - (income / (bufferMultiplier * stableThreshold)));

        action2 =
          "To reach stable, increase reliable monthly income by " +
          formatWithCommas(incomeIncreaseToStable) +
          " or reduce essentials by about " +
          formatWithCommas(essentialsCutToStable) +
          ".";
      }

      const headlineHtml =
        "<div><strong>Readiness:</strong> " +
        status +
        " (coverage ratio " +
        formatRatioTwoDecimals(coverageRatio) +
        ")</div>" +
        "<div>" +
        interpretation +
        "</div>" +
        '<div class="di-actions"><strong>Two immediate actions:</strong><ul><li>' +
        action1 +
        "</li><li>" +
        action2 +
        "</li></ul></div>";

      setResultSuccess(headlineHtml);

      const percentCovered = (coverageRatio * 100);
      const secondaryHtml =
        '<div class="di-secondary-title">Outcome details</div>' +
        '<div class="di-secondary-grid">' +
        '<div class="di-kv"><span class="k">Status</span><span class="v">' + status + "</span></div>" +
        '<div class="di-kv"><span class="k">Coverage</span><span class="v">' + formatPercentTwoDecimals(percentCovered) + "</span></div>" +
        '<div class="di-kv"><span class="k">Income</span><span class="v">' + formatWithCommas(income) + "</span></div>" +
        '<div class="di-kv"><span class="k">Essentials (monthly)</span><span class="v">' + formatWithCommas(essentials) + "</span></div>" +
        '<div class="di-kv"><span class="k">Essentials (non-monthly avg)</span><span class="v">' + formatWithCommas(nonMonthly) + "</span></div>" +
        '<div class="di-kv"><span class="k">Buffer target</span><span class="v">' + formatPercentTwoDecimals(bufferPct) + "</span></div>" +
        '<div class="di-kv"><span class="k">Required income (with buffer)</span><span class="v">' + formatWithCommas(requiredIncome) + "</span></div>" +
        '<div class="di-kv"><span class="k">Primary correction signal</span><span class="v">' +
        (gapToBorderline > 0 ? ("Gap to baseline: " + formatWithCommas(gapToBorderline)) : "Maintain margin") +
        "</span></div>" +
        "</div>";

      setSecondary(secondaryHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Check - check this diagnostic: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
