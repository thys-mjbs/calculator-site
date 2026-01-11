// script.js
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

  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");

  const insuranceNumber = document.getElementById("insuranceNumber");
  const insuranceRange = document.getElementById("insuranceRange");

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "").replace(/\s+/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return n;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const isInt = Math.abs(n % 1) < 1e-9;
    if (!isInt) {
      const fixed = n.toFixed(2);
      const parts = fixed.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }
    const s = String(Math.round(n));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  function setSecondary(html) {
    if (!secondaryPanel) return;
    secondaryPanel.innerHTML = html;
  }

  function clearSecondary() {
    if (!secondaryPanel) return;
    secondaryPanel.textContent = "";
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const initial = clamp(defaultValue, min, max);
    rangeEl.value = String(initial);
    numberEl.value = formatWithCommas(initial);

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      const c = clamp(v, min, max);
      numberEl.value = formatWithCommas(c);
      clearResult();
      clearSecondary();
    });

    numberEl.addEventListener("input", function () {
      const raw = numberEl.value;
      const cleaned = raw.replace(/[^0-9.,-]/g, "");
      numberEl.value = cleaned;
      clearResult();
      clearSecondary();
    });

    function commitNumberToRange() {
      const v = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(v)) {
        numberEl.value = formatWithCommas(parseLooseNumber(rangeEl.value));
        return;
      }
      const c = clamp(v, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatWithCommas(c);
    }

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

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000, 100, 25000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 200000, 100, 9000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 50000, 50, 1500);
  bindRangeAndNumber(foodRange, foodNumber, 0, 100000, 50, 4000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 100000, 50, 2500);
  bindRangeAndNumber(debtRange, debtNumber, 0, 200000, 50, 2000);
  bindRangeAndNumber(insuranceRange, insuranceNumber, 0, 100000, 50, 1500);

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

  function classifyRatio(ratio) {
    if (!Number.isFinite(ratio)) return { label: "Invalid", note: "" };
    if (ratio < 1.0) return { label: "Underprepared", note: "Essentials exceed income." };
    if (ratio < 1.2) return { label: "Borderline", note: "Essentials are covered but the buffer is thin." };
    return { label: "Stable", note: "Essentials are covered with a buffer." };
  }

  function buildTwoActions(classification, gapAmount, bufferTargetAmount) {
    if (classification === "Underprepared") {
      const a1 = "Close the monthly gap of " + formatWithCommas(Math.max(0, gapAmount)) + " by targeting the largest essentials driver first.";
      const a2 = "If cutting essentials cannot close the gap fast enough, prioritize a reliable income increase until coverage reaches at least 1.00.";
      return [a1, a2];
    }
    if (classification === "Borderline") {
      const a1 = "Build buffer by creating an extra monthly margin of " + formatWithCommas(Math.max(0, bufferTargetAmount)) + " above essentials.";
      const a2 = "Lock in one structural change: reduce a fixed essential or raise reliable income, then retest until coverage reaches 1.20.";
      return [a1, a2];
    }
    const a1 = "Protect stability by keeping essential costs from rising faster than income over the next 3 months.";
    const a2 = "Allocate a fixed monthly amount from the buffer to one priority goal (debt, savings, or a specific bill) and keep it consistent.";
    return [a1, a2];
  }

  function buildSecondaryPanel(income, essentials, ratio, classification, drivers, correctionSignalText) {
    return (
      '<h3>Outcome details</h3>' +
      '<div class="di-secondary-row"><span class="di-secondary-k">Status</span><span class="di-secondary-v">' + classification + '</span></div>' +
      '<div class="di-secondary-row"><span class="di-secondary-k">Coverage ratio</span><span class="di-secondary-v">' + (Number.isFinite(ratio) ? ratio.toFixed(2) : "") + '</span></div>' +
      '<div class="di-secondary-row"><span class="di-secondary-k">Monthly income</span><span class="di-secondary-v">' + formatWithCommas(income) + '</span></div>' +
      '<div class="di-secondary-row"><span class="di-secondary-k">Monthly essentials</span><span class="di-secondary-v">' + formatWithCommas(essentials) + '</span></div>' +
      '<div class="di-secondary-row"><span class="di-secondary-k">Key drivers</span><span class="di-secondary-v">' + drivers.join(", ") + '</span></div>' +
      '<div class="di-secondary-row"><span class="di-secondary-k">Primary signal</span><span class="di-secondary-v">' + correctionSignalText + '</span></div>'
    );
  }

  function pickTopDrivers(items) {
    const sorted = items
      .filter(function (x) { return Number.isFinite(x.value) && x.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });

    const top = sorted.slice(0, 3).map(function (x) { return x.label; });
    if (top.length === 0) return ["No essentials drivers detected"];
    return top;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();
      clearSecondary();

      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");
      const insurance = parseLooseNumber(insuranceNumber ? insuranceNumber.value : "");

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "debt minimums")) return;
      if (!validateNonNegative(insurance, "essential insurance and medical")) return;

      const essentials = housing + utilities + food + transport + debt + insurance;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0 to calculate coverage.");
        return;
      }

      const ratio = income / essentials;
      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Unable to calculate. Check inputs and try again.");
        return;
      }

      const classification = classifyRatio(ratio).label;

      const gapAmount = essentials - income;
      const targetRatioForBorderline = 1.2;
      const targetIncomeForBuffer = essentials * targetRatioForBorderline;
      const bufferTargetAmount = targetIncomeForBuffer - income;

      const actions = buildTwoActions(classification, gapAmount, bufferTargetAmount);

      const interpretation =
        classification === "Underprepared"
          ? "Income does not cover core expenses, so the month is structurally short."
          : classification === "Borderline"
          ? "Income covers core expenses, but the buffer is too thin for normal volatility."
          : "Income covers core expenses with a buffer, so baseline readiness is stable.";

      const headline =
        '<div><strong>Readiness:</strong> ' + classification + " (" + ratio.toFixed(2) + " coverage)</div>";

      const resultHtml =
        headline +
        "<div>" + interpretation + "</div>" +
        "<div><strong>Immediate actions:</strong></div>" +
        "<div>1) " + actions[0] + "</div>" +
        "<div>2) " + actions[1] + "</div>";

      setResultSuccess(resultHtml);

      const drivers = pickTopDrivers([
        { label: "Housing", value: housing },
        { label: "Debt minimums", value: debt },
        { label: "Food", value: food },
        { label: "Transport", value: transport },
        { label: "Utilities", value: utilities },
        { label: "Insurance and medical", value: insurance }
      ]);

      let correctionSignalText = "";
      if (classification === "Underprepared") {
        correctionSignalText = "Minimum correction is to reduce essentials or raise income by " + formatWithCommas(Math.max(0, gapAmount)) + " per month to reach 1.00.";
      } else if (classification === "Borderline") {
        correctionSignalText = "Minimum correction is to create " + formatWithCommas(Math.max(0, bufferTargetAmount)) + " per month in margin to reach 1.20.";
      } else {
        correctionSignalText = "Maintain buffer and prevent essential costs from creeping upward.";
      }

      setSecondary(buildSecondaryPanel(income, essentials, ratio, classification, drivers, correctionSignalText));
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
