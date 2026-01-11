document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const secondaryPanel = document.getElementById("diSecondaryPanel");

  const incomeNumber = document.getElementById("incomeNumber");
  const incomeRange = document.getElementById("incomeRange");

  const housingNumber = document.getElementById("housingNumber");
  const housingRange = document.getElementById("housingRange");

  const utilitiesNumber = document.getElementById("utilitiesNumber");
  const utilitiesRange = document.getElementById("utilitiesRange");

  const foodNumber = document.getElementById("foodNumber");
  const foodRange = document.getElementById("foodRange");

  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");

  const debtMinNumber = document.getElementById("debtMinNumber");
  const debtMinRange = document.getElementById("debtMinRange");

  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
    if (secondaryPanel) secondaryPanel.innerHTML = "";
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function setSecondaryHtml(html) {
    if (!secondaryPanel) return;
    secondaryPanel.innerHTML = html;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
    if (secondaryPanel) secondaryPanel.innerHTML = "";
  }

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).trim().replace(/,/g, "");
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return raw === "" ? "" : raw.replace(/[^\d,.-]/g, "");
    return formatWithCommas(n);
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
      clearResult();
    });
  }

  function bindRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    const min = Number(rangeEl.min);
    const max = Number(rangeEl.max);

    rangeEl.addEventListener("input", function () {
      const v = clamp(Number(rangeEl.value), min, max);
      numberEl.value = formatWithCommas(v);
      clearResult();
    });

    function commitNumberToRange() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        numberEl.value = formatWithCommas(Number(rangeEl.value));
        return;
      }
      const v = clamp(typed, min, max);
      rangeEl.value = String(v);
      numberEl.value = formatWithCommas(v);
    }

    numberEl.addEventListener("blur", function () {
      commitNumberToRange();
      clearResult();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        commitNumberToRange();
        clearResult();
      }
    });

    const initial = clamp(parseLooseNumber(numberEl.value), min, max);
    if (Number.isFinite(initial)) {
      rangeEl.value = String(initial);
      numberEl.value = formatWithCommas(initial);
    } else {
      const rv = clamp(Number(rangeEl.value), min, max);
      numberEl.value = formatWithCommas(rv);
    }
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtMinNumber);

  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(foodRange, foodNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtMinRange, debtMinNumber);

  function validateNonNegative(value, label) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  function computeEssentials(parts) {
    let total = 0;
    for (let i = 0; i < parts.length; i++) total += parts[i];
    return total;
  }

  function largestDriverLabel(values) {
    const pairs = [
      { label: "Housing", value: values.housing },
      { label: "Utilities", value: values.utilities },
      { label: "Food", value: values.food },
      { label: "Transport", value: values.transport },
      { label: "Debt minimums", value: values.debtMin }
    ];

    let best = pairs[0];
    for (let i = 1; i < pairs.length; i++) {
      if (pairs[i].value > best.value) best = pairs[i];
    }
    return best.label;
  }

  function classifyRatio(ratio) {
    if (!Number.isFinite(ratio)) return { status: "Unknown", key: "unknown" };
    if (ratio < 1.0) return { status: "Underprepared", key: "underprepared" };
    if (ratio < 1.2) return { status: "Borderline", key: "borderline" };
    return { status: "Stable", key: "stable" };
  }

  function requiredIncomeForTarget(essentials, targetRatio) {
    if (!Number.isFinite(essentials) || essentials <= 0) return NaN;
    return essentials * targetRatio;
  }

  function requiredEssentialsForTarget(income, targetRatio) {
    if (!Number.isFinite(income) || income <= 0) return NaN;
    return income / targetRatio;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debtMin = parseLooseNumber(debtMinNumber ? debtMinNumber.value : "");

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing essentials")) return;
      if (!validateNonNegative(utilities, "utilities and services")) return;
      if (!validateNonNegative(food, "food essentials")) return;
      if (!validateNonNegative(transport, "transport essentials")) return;
      if (!validateNonNegative(debtMin, "minimum debt payments")) return;

      const essentials = computeEssentials([housing, utilities, food, transport, debtMin]);

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0 to compute the coverage ratio.");
        return;
      }

      const ratio = income / essentials;
      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Inputs produced an invalid result. Check values and try again.");
        return;
      }

      const classification = classifyRatio(ratio);
      const ratioText = ratio.toFixed(2);

      let interpretation = "";
      let action1 = "";
      let action2 = "";

      const biggest = largestDriverLabel({ housing, utilities, food, transport, debtMin });

      if (classification.key === "underprepared") {
        interpretation = "Income does not cover essentials. The baseline is running at a deficit, so the system is structurally fragile.";
        const incomeToBreakEven = requiredIncomeForTarget(essentials, 1.0);
        const gap = incomeToBreakEven - income;
        action1 = "Reduce the biggest essentials driver first (" + biggest + ") until essentials fit income.";
        action2 = "Increase reliable monthly income by at least " + formatWithCommas(Math.ceil(gap)) + " to reach break-even coverage.";
      } else if (classification.key === "borderline") {
        interpretation = "Income covers essentials, but margin is thin. Small variance can break the month.";
        const incomeToStable = requiredIncomeForTarget(essentials, 1.2);
        const addNeeded = incomeToStable - income;
        action1 = "Build buffer by lowering the biggest essentials driver first (" + biggest + ").";
        action2 = "Increase reliable monthly income by at least " + formatWithCommas(Math.ceil(addNeeded)) + " to reach a stable buffer target.";
      } else {
        interpretation = "Income covers essentials with a meaningful buffer. The baseline is structurally stable at this snapshot.";
        action1 = "Lock the baseline by preventing essentials creep, starting with " + biggest + ".";
        action2 = "Allocate the margin intentionally to either emergency buffer or high-cost debt reduction, not random spending.";
      }

      const surplus = income - essentials;
      const breakEvenIncome = requiredIncomeForTarget(essentials, 1.0);
      const stableIncome = requiredIncomeForTarget(essentials, 1.2);
      const maxEssentialsForStable = requiredEssentialsForTarget(income, 1.2);

      const resultHtml =
        `<p><strong>${classification.status}</strong> (Coverage ratio: <strong>${ratioText}</strong>)</p>` +
        `<p>${interpretation}</p>` +
        `<p><strong>Immediate actions:</strong></p>` +
        `<p>1) ${action1}</p>` +
        `<p>2) ${action2}</p>`;

      setResultSuccess(resultHtml);

      const secondaryHtml =
        `<h3>Assessment summary</h3>` +
        `<ul class="di-kv">` +
        `<li><strong>Outcome:</strong> ${classification.status}</li>` +
        `<li><strong>Income:</strong> ${formatWithCommas(income)}</li>` +
        `<li><strong>Essentials total:</strong> ${formatWithCommas(essentials)}</li>` +
        `<li><strong>Monthly surplus or gap:</strong> ${formatWithCommas(Math.round(surplus))}</li>` +
        `<li><strong>Biggest essentials driver:</strong> ${biggest}</li>` +
        `</ul>` +
        `<h3>Core signals</h3>` +
        `<ul class="di-kv">` +
        `<li><strong>Break-even income target (1.00):</strong> ${formatWithCommas(Math.ceil(breakEvenIncome))}</li>` +
        `<li><strong>Stable buffer income target (1.20):</strong> ${formatWithCommas(Math.ceil(stableIncome))}</li>` +
        `<li><strong>Max essentials for stable at current income (1.20):</strong> ${formatWithCommas(Math.floor(maxEssentialsForStable))}</li>` +
        `</ul>`;

      setSecondaryHtml(secondaryHtml);
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
