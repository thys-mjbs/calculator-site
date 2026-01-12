// script.js
document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const incomeNumber = document.getElementById("incomeNumber");
  const incomeRange = document.getElementById("incomeRange");

  const housingNumber = document.getElementById("housingNumber");
  const housingRange = document.getElementById("housingRange");

  const utilitiesNumber = document.getElementById("utilitiesNumber");
  const utilitiesRange = document.getElementById("utilitiesRange");

  const groceriesNumber = document.getElementById("groceriesNumber");
  const groceriesRange = document.getElementById("groceriesRange");

  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");

  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");

  const detailsBody = document.getElementById("diOutcomeBody");

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return raw === "" ? "" : raw.replace(/[^\d,.-]/g, "");
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

  function setDetailsHtml(html) {
    if (!detailsBody) return;
    detailsBody.innerHTML = html;
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, allowZero) {
    if (!rangeEl || !numberEl) return;

    const minNum = Number(min);
    const maxNum = Number(max);

    function syncFromRange() {
      const r = parseLooseNumber(rangeEl.value);
      const clamped = clamp(r, minNum, maxNum);
      if (!Number.isFinite(clamped)) return;
      numberEl.value = formatWithCommas(clamped);
    }

    function commitNumberToRange() {
      const raw = numberEl.value;
      const n = parseLooseNumber(raw);

      if (!Number.isFinite(n)) {
        numberEl.value = "";
        rangeEl.value = String(minNum);
        return;
      }

      if (!allowZero && n === 0) {
        numberEl.value = "";
        rangeEl.value = String(minNum);
        return;
      }

      const clamped = clamp(n, minNum, maxNum);
      if (!Number.isFinite(clamped)) return;

      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
    }

    rangeEl.step = String(step);

    syncFromRange();

    rangeEl.addEventListener("input", function () {
      syncFromRange();
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      numberEl.value = formatInputWithCommas(numberEl.value);
      clearResult();
    });

    numberEl.addEventListener("blur", function () {
      commitNumberToRange();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberToRange();
      }
    });
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000, 500, true);
  bindRangeAndNumber(housingRange, housingNumber, 0, 200000, 250, true);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 50000, 100, true);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 100000, 200, true);
  bindRangeAndNumber(transportRange, transportNumber, 0, 80000, 200, true);
  bindRangeAndNumber(debtRange, debtNumber, 0, 150000, 250, true);

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function pickLargestDriver(drivers) {
    let bestKey = "";
    let bestVal = -Infinity;
    for (const d of drivers) {
      if (Number.isFinite(d.value) && d.value > bestVal) {
        bestVal = d.value;
        bestKey = d.label;
      }
    }
    return bestKey || "None";
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = parseLooseNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");

      if (!incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !debtNumber) return;

      if (!validateNonNegative(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "minimum debt payments")) return;

      const essentialsTotal = housing + utilities + groceries + transport + debt;

      if (!validatePositive(essentialsTotal, "total essentials")) {
        return;
      }

      const ratio = income / essentialsTotal;

      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Enter valid numbers to compute a coverage ratio.");
        return;
      }

      let status = "";
      let interpretation = "";
      const stableThreshold = 1.25;

      if (ratio < 1.0) {
        status = "Underprepared";
        interpretation = "Income does not cover essentials reliably. The baseline is failing and requires immediate correction.";
      } else if (ratio < stableThreshold) {
        status = "Borderline";
        interpretation = "Essentials are covered, but the margin is thin. Normal variability can break the month.";
      } else {
        status = "Stable";
        interpretation = "Essentials are covered with margin. The baseline supports basic stability and forward planning.";
      }

      const requiredIncomeForStable = essentialsTotal * stableThreshold;
      const incomeGapToStable = Math.max(0, requiredIncomeForStable - income);

      const requiredEssentialsForStable = income / stableThreshold;
      const essentialsCutToStable = Math.max(0, essentialsTotal - requiredEssentialsForStable);

      const largestDriver = pickLargestDriver([
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries", value: groceries },
        { label: "Transport", value: transport },
        { label: "Minimum debt payments", value: debt }
      ]);

      let action1 = "";
      let action2 = "";

      if (ratio < stableThreshold) {
        if (incomeGapToStable >= essentialsCutToStable) {
          action1 = "Reduce total essentials to move the ratio above the stable threshold.";
          action2 = "Audit the biggest driver (" + largestDriver + ") and make one committed change in the next 30 days.";
        } else {
          action1 = "Increase income to move the ratio above the stable threshold.";
          action2 = "Lock essentials at today’s baseline, then target income growth without increasing fixed commitments.";
        }
      } else {
        action1 = "Start building a buffer using the margin (treat it as non-negotiable).";
        action2 = "Keep essentials stable and track the largest driver (" + largestDriver + ") to prevent silent drift.";
      }

      const ratioText = ratio.toFixed(2);
      const essentialsText = formatWithCommas(essentialsTotal);
      const incomeText = formatWithCommas(income);

      const resultHtml =
        "<p><strong>Readiness:</strong> " + status + " (coverage ratio " + ratioText + ")</p>" +
        "<p>" + interpretation + "</p>" +
        "<p><strong>Immediate actions:</strong></p>" +
        "<ol>" +
        "<li>" + action1 + "</li>" +
        "<li>" + action2 + "</li>" +
        "</ol>";

      setResultSuccess(resultHtml);

      const incomeTargetText = formatWithCommas(requiredIncomeForStable);
      const incomeGapText = formatWithCommas(incomeGapToStable);
      const essentialsTargetText = formatWithCommas(requiredEssentialsForStable);
      const essentialsCutText = formatWithCommas(essentialsCutToStable);

      const detailsHtml =
        '<div class="di-kv"><div class="di-k">Status</div><div class="di-v">' + status + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Coverage ratio</div><div class="di-v">' + ratioText + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Income (monthly)</div><div class="di-v">' + incomeText + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Essentials total</div><div class="di-v">' + essentialsText + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Biggest driver</div><div class="di-v">' + largestDriver + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Stable income target (1.25×)</div><div class="di-v">' + incomeTargetText + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Income gap to stable</div><div class="di-v">' + incomeGapText + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Stable essentials cap (income ÷ 1.25)</div><div class="di-v">' + essentialsTargetText + '</div></div>' +
        '<div class="di-kv"><div class="di-k">Essentials cut to stable</div><div class="di-v">' + essentialsCutText + '</div></div>';

      setDetailsHtml(detailsHtml);
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
