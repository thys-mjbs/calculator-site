// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

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

  // ------------------------------------------------------------
  // 2) HELPERS
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

  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const s = String(value).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
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

  function formatRatio(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  }

  function normalizeTypedNumberInput(inputEl, min, max) {
    if (!inputEl) return { ok: false, value: NaN };
    const raw = inputEl.value;
    const n = parseLooseNumber(raw);

    if (!Number.isFinite(n)) return { ok: false, value: NaN };
    const clamped = clamp(n, min, max);

    if (!Number.isFinite(clamped)) return { ok: false, value: NaN };
    inputEl.value = formatWithCommas(clamped);
    return { ok: true, value: clamped };
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);

    // Initialize
    const start = clamp(parseLooseNumber(numberEl.value), min, max);
    const initVal = Number.isFinite(start) ? start : min;
    rangeEl.value = String(initVal);
    numberEl.value = formatWithCommas(initVal);

    // Slider -> Number
    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      numberEl.value = formatWithCommas(v);
      clearResult();
    });

    // Number live formatting (commas) but do not clamp until blur/enter
    numberEl.addEventListener("input", function () {
      const cursorBefore = numberEl.selectionStart;
      const raw = numberEl.value;
      const cleaned = raw.replace(/,/g, "");
      if (cleaned === "" || cleaned === "-" || cleaned === ".") {
        clearResult();
        return;
      }
      const n = parseLooseNumber(cleaned);
      if (!Number.isFinite(n)) {
        clearResult();
        return;
      }
      const formatted = formatWithCommas(n);
      numberEl.value = formatted;
      if (typeof cursorBefore === "number") {
        numberEl.setSelectionRange(formatted.length, formatted.length);
      }
      clearResult();
    });

    // Number -> Slider (clamp on blur)
    numberEl.addEventListener("blur", function () {
      const out = normalizeTypedNumberInput(numberEl, min, max);
      if (!out.ok) {
        numberEl.value = formatWithCommas(Number(rangeEl.value));
        return;
      }
      rangeEl.value = String(out.value);
      clearResult();
    });

    // Number -> Slider (clamp on enter)
    numberEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const out = normalizeTypedNumberInput(numberEl, min, max);
      if (!out.ok) {
        numberEl.value = formatWithCommas(Number(rangeEl.value));
        return;
      }
      rangeEl.value = String(out.value);
      clearResult();
    });
  }

  function validateNonNegativeFinite(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositiveFinite(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 3) BIND INPUTS (RANGE + NUMBER)
  // ------------------------------------------------------------
  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 300000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 100000);
  bindRangeAndNumber(foodRange, foodNumber, 0, 150000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 150000);
  bindRangeAndNumber(debtMinRange, debtMinNumber, 0, 250000);

  // Sensible defaults (set after binding)
  function setDefaults() {
    if (incomeRange && incomeNumber) {
      incomeRange.value = "30000";
      incomeNumber.value = formatWithCommas(30000);
    }
    if (housingRange && housingNumber) {
      housingRange.value = "12000";
      housingNumber.value = formatWithCommas(12000);
    }
    if (utilitiesRange && utilitiesNumber) {
      utilitiesRange.value = "2500";
      utilitiesNumber.value = formatWithCommas(2500);
    }
    if (foodRange && foodNumber) {
      foodRange.value = "5000";
      foodNumber.value = formatWithCommas(5000);
    }
    if (transportRange && transportNumber) {
      transportRange.value = "3000";
      transportNumber.value = formatWithCommas(3000);
    }
    if (debtMinRange && debtMinNumber) {
      debtMinRange.value = "2000";
      debtMinNumber.value = formatWithCommas(2000);
    }
  }
  setDefaults();

  // ------------------------------------------------------------
  // 4) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debtMin = parseLooseNumber(debtMinNumber ? debtMinNumber.value : "");

      if (!incomeNumber || !housingNumber || !utilitiesNumber || !foodNumber || !transportNumber || !debtMinNumber) {
        setResultError("Inputs are missing on this page.");
        return;
      }

      // Reject non-numeric and negative values
      if (!validatePositiveFinite(income, "monthly take-home income")) return;
      if (!validateNonNegativeFinite(housing, "housing")) return;
      if (!validateNonNegativeFinite(utilities, "utilities")) return;
      if (!validateNonNegativeFinite(food, "groceries and essential supplies")) return;
      if (!validateNonNegativeFinite(transport, "transport")) return;
      if (!validateNonNegativeFinite(debtMin, "minimum debt payments")) return;

      const essentials = housing + utilities + food + transport + debtMin;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0.");
        return;
      }

      const ratio = income / essentials;

      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Result could not be calculated. Check your inputs.");
        return;
      }

      // Thresholds
      const UNDERPREPARED_MAX = 1.0;   // below 1.00
      const STABLE_MIN = 1.25;         // 1.25 or higher is stable

      let classification = "";
      let interpretation = "";
      let action1 = "";
      let action2 = "";

      if (ratio < UNDERPREPARED_MAX) {
        classification = "Underprepared";
        interpretation = "Your essential expenses exceed your income. Your baseline is structurally negative.";

        const gap = essentials - income; // positive
        const targetIncome = essentials * STABLE_MIN;
        const incomeLiftToStable = Math.max(0, targetIncome - income);

        action1 = "Increase monthly income by at least " + formatWithCommas(gap) + " to stop the shortfall.";
        action2 = "To reach stable buffer, increase income by " + formatWithCommas(incomeLiftToStable) + " or reduce essentials by the same amount.";
      } else if (ratio < STABLE_MIN) {
        classification = "Borderline";
        interpretation = "Your essentials are covered, but your buffer is thin. Normal variability can push you behind.";

        const targetIncome = essentials * STABLE_MIN;
        const incomeLift = Math.max(0, targetIncome - income);
        const reductionNeeded = Math.max(0, essentials - (income / STABLE_MIN));

        action1 = "Build buffer: increase income by " + formatWithCommas(incomeLift) + " to reach stable coverage.";
        action2 = "Or reduce essential expenses by " + formatWithCommas(reductionNeeded) + " to reach the same stability threshold.";
      } else {
        classification = "Stable";
        interpretation = "Your income covers essentials with clear margin. Your baseline is viable under normal conditions.";

        const margin = income - essentials;
        const bufferAboveStable = income - (essentials * STABLE_MIN);

        action1 = "Keep essentials steady. Preserve at least " + formatWithCommas(Math.max(0, bufferAboveStable)) + " of monthly buffer above the stability threshold.";
        action2 = "Direct at least " + formatWithCommas(Math.max(0, Math.round(margin * 0.5))) + " of your monthly margin into one goal (debt reduction or cash buffer).";
      }

      // Top 3 drivers
      const drivers = [
        { name: "Housing", value: housing },
        { name: "Utilities", value: utilities },
        { name: "Groceries and supplies", value: food },
        { name: "Transport", value: transport },
        { name: "Minimum debt payments", value: debtMin }
      ].sort(function (a, b) {
        return b.value - a.value;
      });

      const d1 = drivers[0] ? drivers[0].name : "N/A";
      const d2 = drivers[1] ? drivers[1].name : "N/A";
      const d3 = drivers[2] ? drivers[2].name : "N/A";

      const headline = "Readiness: " + classification + " (" + formatRatio(ratio) + "× coverage)";
      const resultHtml =
        "<div class=\"di-result\">" +
          "<p><strong>" + headline + "</strong></p>" +
          "<p>" + interpretation + "</p>" +
          "<p><strong>Income:</strong> " + formatWithCommas(income) + "<br>" +
          "<strong>Essentials:</strong> " + formatWithCommas(essentials) + "</p>" +
          "<ul>" +
            "<li>" + action1 + "</li>" +
            "<li>" + action2 + "</li>" +
          "</ul>" +
          "<p><strong>Top drivers:</strong> " + d1 + ", " + d2 + ", " + d3 + "</p>" +
        "</div>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 5) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Diagnostic - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
