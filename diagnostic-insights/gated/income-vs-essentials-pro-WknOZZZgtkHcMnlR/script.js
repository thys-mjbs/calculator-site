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

  const healthNumber = document.getElementById("healthNumber");
  const healthRange = document.getElementById("healthRange");

  const debtMinNumber = document.getElementById("debtMinNumber");
  const debtMinRange = document.getElementById("debtMinRange");

  const otherEssentialsNumber = document.getElementById("otherEssentialsNumber");
  const otherEssentialsRange = document.getElementById("otherEssentialsRange");

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
    if (cleaned === "-" || cleaned === "." || cleaned === "-.") return NaN;

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

  function formatRatioTwo(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  }

  function formatPercentOne(n) {
    if (!Number.isFinite(n)) return "";
    return (n * 100).toFixed(1) + "%";
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

    const start = clamp(parseLooseNumber(numberEl.value), min, max);
    const initVal = Number.isFinite(start) ? start : min;

    rangeEl.value = String(initVal);
    numberEl.value = formatWithCommas(initVal);

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      numberEl.value = formatWithCommas(v);
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      const raw = String(numberEl.value || "");
      const cleaned = raw.replace(/,/g, "");

      if (cleaned.trim() === "" || cleaned.trim() === "-" || cleaned.trim() === ".") {
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
      clearResult();
    });

    numberEl.addEventListener("blur", function () {
      const out = normalizeTypedNumberInput(numberEl, min, max);
      if (!out.ok) {
        numberEl.value = formatWithCommas(Number(rangeEl.value));
        return;
      }
      rangeEl.value = String(out.value);
      clearResult();
    });

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

  function validatePositiveFinite(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegativeFinite(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function safeShareAmount(n) {
    if (!Number.isFinite(n)) return "0";
    return formatWithCommas(Math.max(0, Math.round(n)));
  }

  // ------------------------------------------------------------
  // 3) BIND INPUTS (RANGE + NUMBER)
  // ------------------------------------------------------------
  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 300000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 100000);
  bindRangeAndNumber(foodRange, foodNumber, 0, 150000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 150000);
  bindRangeAndNumber(healthRange, healthNumber, 0, 150000);
  bindRangeAndNumber(debtMinRange, debtMinNumber, 0, 250000);
  bindRangeAndNumber(otherEssentialsRange, otherEssentialsNumber, 0, 200000);

  // Defaults (reasonable starting values)
  function setDefaults() {
    if (incomeRange && incomeNumber) { incomeRange.value = "30000"; incomeNumber.value = formatWithCommas(30000); }
    if (housingRange && housingNumber) { housingRange.value = "12000"; housingNumber.value = formatWithCommas(12000); }
    if (utilitiesRange && utilitiesNumber) { utilitiesRange.value = "2500"; utilitiesNumber.value = formatWithCommas(2500); }
    if (foodRange && foodNumber) { foodRange.value = "5000"; foodNumber.value = formatWithCommas(5000); }
    if (transportRange && transportNumber) { transportRange.value = "3000"; transportNumber.value = formatWithCommas(3000); }
    if (healthRange && healthNumber) { healthRange.value = "1200"; healthNumber.value = formatWithCommas(1200); }
    if (debtMinRange && debtMinNumber) { debtMinRange.value = "2000"; debtMinNumber.value = formatWithCommas(2000); }
    if (otherEssentialsRange && otherEssentialsNumber) { otherEssentialsRange.value = "1000"; otherEssentialsNumber.value = formatWithCommas(1000); }
  }
  setDefaults();

  // ------------------------------------------------------------
  // 4) MAIN CALCULATE HANDLER (PRO OUTPUT)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (
        !incomeNumber || !housingNumber || !utilitiesNumber || !foodNumber || !transportNumber ||
        !healthNumber || !debtMinNumber || !otherEssentialsNumber
      ) {
        setResultError("Inputs are missing on this page.");
        return;
      }

      const income = parseLooseNumber(incomeNumber.value);
      const housing = parseLooseNumber(housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber.value);
      const food = parseLooseNumber(foodNumber.value);
      const transport = parseLooseNumber(transportNumber.value);
      const health = parseLooseNumber(healthNumber.value);
      const debtMin = parseLooseNumber(debtMinNumber.value);
      const otherEssentials = parseLooseNumber(otherEssentialsNumber.value);

      if (!validatePositiveFinite(income, "monthly take-home income")) return;

      if (!validateNonNegativeFinite(housing, "housing")) return;
      if (!validateNonNegativeFinite(utilities, "utilities")) return;
      if (!validateNonNegativeFinite(food, "groceries and essential supplies")) return;
      if (!validateNonNegativeFinite(transport, "transport")) return;
      if (!validateNonNegativeFinite(health, "healthcare and essential insurance")) return;
      if (!validateNonNegativeFinite(debtMin, "minimum debt payments")) return;
      if (!validateNonNegativeFinite(otherEssentials, "other essentials")) return;

      const essentials = housing + utilities + food + transport + health + debtMin + otherEssentials;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0.");
        return;
      }

      const coverage = income / essentials;                // income-to-essentials coverage
      const essentialsShare = essentials / income;         // essentials as share of income
      const monthlyMargin = income - essentials;           // nominal monthly margin after essentials

      if (!Number.isFinite(coverage) || !Number.isFinite(essentialsShare) || !Number.isFinite(monthlyMargin)) {
        setResultError("Result could not be calculated. Check your inputs.");
        return;
      }

      // Classification thresholds
      const UNDERPREPARED_MAX = 1.0;   // below 1.00
      const STABLE_MIN = 1.25;         // stable at 1.25 or higher
      const COMFORT_MIN = 1.50;        // optional higher target band

      let classification = "";
      let interpretation = "";

      if (coverage < UNDERPREPARED_MAX) {
        classification = "Underprepared";
        interpretation = "Essentials exceed income. The baseline is structurally negative.";
      } else if (coverage < STABLE_MIN) {
        classification = "Borderline";
        interpretation = "Essentials are covered, but buffer is thin. Normal variability can push you behind.";
      } else {
        classification = "Stable";
        interpretation = "Essentials are covered with margin under normal conditions.";
      }

      // Targets (high-level mechanics)
      const targetIncomeStable = essentials * STABLE_MIN;
      const targetIncomeComfort = essentials * COMFORT_MIN;

      const incomeLiftToStable = Math.max(0, targetIncomeStable - income);
      const incomeLiftToComfort = Math.max(0, targetIncomeComfort - income);

      const essentialsCapForStable = income / STABLE_MIN;
      const essentialsCapForComfort = income / COMFORT_MIN;

      const reductionToStable = Math.max(0, essentials - essentialsCapForStable);
      const reductionToComfort = Math.max(0, essentials - essentialsCapForComfort);

      // Drivers list for lever ranking
      const drivers = [
        { key: "Income", name: "Increase reliable take-home income", value: income, kind: "income" },
        { key: "Housing", name: "Housing", value: housing, kind: "expense" },
        { key: "Utilities", name: "Utilities", value: utilities, kind: "expense" },
        { key: "Groceries", name: "Groceries and supplies", value: food, kind: "expense" },
        { key: "Transport", name: "Transport", value: transport, kind: "expense" },
        { key: "Health", name: "Healthcare and essential insurance", value: health, kind: "expense" },
        { key: "Debt", name: "Minimum debt payments", value: debtMin, kind: "expense" },
        { key: "Other", name: "Other essentials", value: otherEssentials, kind: "expense" }
      ];

      const sortedExpenses = drivers
        .filter(function (d) { return d.kind === "expense"; })
        .sort(function (a, b) { return b.value - a.value; });

      // Build lever list (max 5)
      // Rule: if not stable, include income lift first; then up to 4 expense levers.
      // If stable, show comfort lift and top expense levers that preserve buffer.
      const levers = [];

      if (classification !== "Stable") {
        levers.push({
          title: "Increase reliable take-home income",
          detail: "Target change to reach stable: " + safeShareAmount(incomeLiftToStable)
        });
      } else {
        levers.push({
          title: "Increase buffer to a higher band",
          detail: "Target change to reach comfort: " + safeShareAmount(incomeLiftToComfort)
        });
      }

      const neededReductionPrimary = (classification !== "Stable") ? reductionToStable : reductionToComfort;
      const neededReduction = Math.max(0, neededReductionPrimary);

      for (let i = 0; i < sortedExpenses.length && levers.length < 5; i++) {
        const e = sortedExpenses[i];
        const suggested = Math.max(0, Math.round(e.value * 0.10)); // 10% hint, not a plan
        const shown = (neededReduction > 0) ? Math.min(suggested, Math.round(neededReduction)) : suggested;

        levers.push({
          title: "Reduce " + e.name,
          detail: "A 10% reduction is about " + safeShareAmount(shown) + " per month"
        });
      }

      // Next actions (max 5, short)
      const nextActions = [];
      nextActions.push("Confirm income is a realistic average month, not a best month.");
      nextActions.push("Confirm essentials are truly unavoidable and not hiding discretionary spend.");
      nextActions.push("Start with the top driver: adjust the biggest essential line item before minor categories.");
      if (classification === "Underprepared") {
        nextActions.push("Stop the baseline gap first, then rebuild buffer. Do not optimize small items.");
      } else if (classification === "Borderline") {
        nextActions.push("Build a clear buffer above essentials, then add future commitments later.");
      } else {
        nextActions.push("Preserve margin and direct part of it intentionally (buffer or payment pressure).");
      }

      // Output blocks
      const headline = "Readiness: " + classification + " (" + formatRatioTwo(coverage) + "× coverage)";

      const metricsHtml =
        "<div class=\"pro-block\">" +
          "<h3>Core metrics</h3>" +
          "<div class=\"pro-metrics\">" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Income</span><span class=\"metric-value\">" + formatWithCommas(income) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Essentials</span><span class=\"metric-value\">" + formatWithCommas(essentials) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Monthly margin after essentials</span><span class=\"metric-value\">" + formatWithCommas(monthlyMargin) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Essentials share of income</span><span class=\"metric-value\">" + formatPercentOne(essentialsShare) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Coverage ratio</span><span class=\"metric-value\">" + formatRatioTwo(coverage) + "×</span></div>" +
          "</div>" +
        "</div>";

      const targetsHtml =
        "<div class=\"pro-block\">" +
          "<h3>Targets</h3>" +
          "<div class=\"pro-metrics\">" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Stable target coverage</span><span class=\"metric-value\">" + formatRatioTwo(STABLE_MIN) + "×</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Income lift to stable</span><span class=\"metric-value\">" + safeShareAmount(incomeLiftToStable) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Essential reduction to stable</span><span class=\"metric-value\">" + safeShareAmount(reductionToStable) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Comfort target coverage</span><span class=\"metric-value\">" + formatRatioTwo(COMFORT_MIN) + "×</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Income lift to comfort</span><span class=\"metric-value\">" + safeShareAmount(incomeLiftToComfort) + "</span></div>" +
            "<div class=\"metric-row\"><span class=\"metric-label\">Essential reduction to comfort</span><span class=\"metric-value\">" + safeShareAmount(reductionToComfort) + "</span></div>" +
          "</div>" +
          "<div class=\"pro-note\">Targets are high-level correction magnitudes, not a plan.</div>" +
        "</div>";

      let leversHtml = "<div class=\"pro-block\"><h3>Top levers (ranked)</h3><ul class=\"pro-list\">";
      for (let j = 0; j < levers.length; j++) {
        leversHtml += "<li><strong>" + levers[j].title + ":</strong> " + levers[j].detail + "</li>";
      }
      leversHtml += "</ul></div>";

      let actionsHtml = "<div class=\"pro-block\"><h3>Next actions (short)</h3><ul class=\"pro-list\">";
      for (let k = 0; k < nextActions.length && k < 5; k++) {
        actionsHtml += "<li>" + nextActions[k] + "</li>";
      }
      actionsHtml += "</ul></div>";

      const resultHtml =
        "<div class=\"di-result\">" +
          "<p><strong>" + headline + "</strong></p>" +
          "<p>" + interpretation + "</p>" +
          metricsHtml +
          targetsHtml +
          leversHtml +
          actionsHtml +
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
      const message = "Income vs Essentials Diagnostic Pro - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
