document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
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

  const insuranceNumber = document.getElementById("insuranceNumber");
  const insuranceRange = document.getElementById("insuranceRange");

  const medicalNumber = document.getElementById("medicalNumber");
  const medicalRange = document.getElementById("medicalRange");

  const dependentsNumber = document.getElementById("dependentsNumber");
  const dependentsRange = document.getElementById("dependentsRange");

  const subscriptionsNumber = document.getElementById("subscriptionsNumber");
  const subscriptionsRange = document.getElementById("subscriptionsRange");

  const educationNumber = document.getElementById("educationNumber");
  const educationRange = document.getElementById("educationRange");

  const irregularNumber = document.getElementById("irregularNumber");
  const irregularRange = document.getElementById("irregularRange");

  // ------------------------------------------------------------
  // 2) HELPERS (PARSING, CLAMPING, FORMATTING)
  // ------------------------------------------------------------

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
  // 3) RANGE + NUMBER BINDING (BI-DIRECTIONAL SYNC)
  // ------------------------------------------------------------

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

  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(foodRange, foodNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtMinRange, debtMinNumber);
  bindRangeAndNumber(insuranceRange, insuranceNumber);
  bindRangeAndNumber(medicalRange, medicalNumber);
  bindRangeAndNumber(dependentsRange, dependentsNumber);
  bindRangeAndNumber(subscriptionsRange, subscriptionsNumber);
  bindRangeAndNumber(educationRange, educationNumber);
  bindRangeAndNumber(irregularRange, irregularNumber);

  // ------------------------------------------------------------
  // 4) VALIDATION
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // 5) CALCULATION LOGIC (PAID)
  // ------------------------------------------------------------

  function computeEssentials(values) {
    return (
      values.housing +
      values.utilities +
      values.food +
      values.transport +
      values.debtMin +
      values.insurance +
      values.medical +
      values.dependents +
      values.subscriptions +
      values.education +
      values.irregular
    );
  }

  function topDrivers(values, essentialsTotal) {
    const list = [
      { label: "Housing", value: values.housing },
      { label: "Utilities", value: values.utilities },
      { label: "Food", value: values.food },
      { label: "Transport", value: values.transport },
      { label: "Debt minimums", value: values.debtMin },
      { label: "Insurance", value: values.insurance },
      { label: "Medical", value: values.medical },
      { label: "Dependents", value: values.dependents },
      { label: "Committed services", value: values.subscriptions },
      { label: "Education", value: values.education },
      { label: "Irregular essentials", value: values.irregular }
    ];

    list.sort(function (a, b) {
      return b.value - a.value;
    });

    const top = list.slice(0, 3).map(function (x) {
      const share = essentialsTotal > 0 ? x.value / essentialsTotal : 0;
      return { label: x.label, value: x.value, share: share };
    });

    return top;
  }

  function classifyRatio(ratio) {
    if (!Number.isFinite(ratio)) return { status: "Unknown", key: "unknown" };
    if (ratio < 1.0) return { status: "Underprepared", key: "underprepared" };
    if (ratio < 1.2) return { status: "Borderline", key: "borderline" };
    if (ratio < 1.5) return { status: "Stable", key: "stable" };
    return { status: "Robust", key: "robust" };
  }

  function requiredIncomeForRatio(essentials, targetRatio) {
    if (!Number.isFinite(essentials) || essentials <= 0) return NaN;
    return essentials * targetRatio;
  }

  function maxEssentialsForRatio(income, targetRatio) {
    if (!Number.isFinite(income) || income <= 0) return NaN;
    return income / targetRatio;
  }

  function percentOfIncome(part, income) {
    if (!Number.isFinite(part) || !Number.isFinite(income) || income <= 0) return NaN;
    return (part / income) * 100;
  }

  function clampToZero(n) {
    if (!Number.isFinite(n)) return NaN;
    return n < 0 ? 0 : n;
  }

  function buildReport(values, essentials, ratio, classification, surplus, top3) {
    const income = values.income;

    const breakEvenIncome = requiredIncomeForRatio(essentials, 1.0);
    const stableIncome = requiredIncomeForRatio(essentials, 1.2);
    const robustIncome = requiredIncomeForRatio(essentials, 1.5);

    const maxEssentialsStable = maxEssentialsForRatio(income, 1.2);
    const maxEssentialsRobust = maxEssentialsForRatio(income, 1.5);

    const gapToBreakEven = clampToZero(breakEvenIncome - income);
    const gapToStable = clampToZero(stableIncome - income);
    const gapToRobust = clampToZero(robustIncome - income);

    const essentialsPct = percentOfIncome(essentials, income);
    const housingPct = percentOfIncome(values.housing, income);
    const debtPct = percentOfIncome(values.debtMin, income);

    const topDriversHtml = top3
      .map(function (x) {
        const sharePct = x.share * 100;
        return (
          "<li><strong>" +
          x.label +
          ":</strong> " +
          formatWithCommas(x.value) +
          " (" +
          sharePct.toFixed(1) +
          "% of essentials)</li>"
        );
      })
      .join("");

    const summaryP1 =
      "This planner evaluates baseline readiness using an income to essentials coverage ratio. The ratio is income divided by the total of essential expenses. Essentials are treated as obligations that must be met to keep the current baseline operating without relying on luck or timing.";

    const summaryP2 =
      "Your calculated ratio is <strong>" +
      ratio.toFixed(2) +
      "</strong>, which falls into the <strong>" +
      classification.status +
      "</strong> band. Total essentials are <strong>" +
      formatWithCommas(essentials) +
      "</strong>, against income of <strong>" +
      formatWithCommas(income) +
      "</strong>, producing a monthly surplus or gap of <strong>" +
      formatWithCommas(Math.round(surplus)) +
      "</strong>.";

    const summaryP3 =
      "The key point is not the absolute income number. It is whether the baseline can run reliably. When essentials consume most of income, variance becomes a threat. When the ratio rises, you gain buffer, decision room, and the ability to absorb normal volatility without forced tradeoffs.";

    const metricsP1 =
      "Coverage ratio is the primary signal because it compresses the baseline into one relationship. A ratio below 1.00 means obligations exceed income and the system is structurally in deficit. A ratio between 1.00 and 1.20 is coverage but thin margin, where timing and small surprises can break the month.";

    const metricsP2 =
      "At your current inputs, essentials are about <strong>" +
      (Number.isFinite(essentialsPct) ? essentialsPct.toFixed(1) : "0.0") +
      "%</strong> of income. Housing alone is about <strong>" +
      (Number.isFinite(housingPct) ? housingPct.toFixed(1) : "0.0") +
      "%</strong> of income. Minimum debt payments are about <strong>" +
      (Number.isFinite(debtPct) ? debtPct.toFixed(1) : "0.0") +
      "%</strong> of income. These percentages help identify which constraints are structural versus incidental.";

    const metricsP3 =
      "The paid layer adds a stability ladder. Break even is ratio 1.00. Stable buffer is ratio 1.20. Robust buffer is ratio 1.50. These thresholds are not moral goals. They are operating conditions. The higher the buffer, the less your plan depends on perfect months.";

    const causalityP1 =
      "Causality here is not complex. The ratio moves for only two reasons: income changes or essentials change. The question is which levers are realistically movable in your situation. The fastest path is usually to attack the largest driver that is truly adjustable in the next 30 to 90 days.";

    const causalityP2 =
      "Your top essentials drivers are below. These are the primary causes of your current ratio, because they contribute the most to the denominator. If the top drivers are mostly fixed contracts, the short term plan must shift toward income reliability, renegotiation windows, or baseline downsizing.";

    const causalityP3 =
      "Second order effects matter. For example, high housing can drive high transport if distance forces commuting. High debt minimums can reduce flexibility, forcing expensive short term borrowing during shocks. The point of identifying drivers is to avoid random cuts that create discomfort but do not move the ratio meaningfully.";

    const constraintP1 =
      "Constraints are the non negotiables that prevent the ratio from improving quickly. The typical hard constraints are housing lock in, contract obligations, and debt minimums. If housing is above a sustainable share of income, the baseline is structurally heavy and will resist improvement until the housing situation changes.";

    const constraintP2 =
      "A practical constraint signal is when a single category dominates. Housing above roughly one third of income tends to squeeze everything else, especially when income is not perfectly stable. Debt minimums that are high relative to income reduce your ability to build buffer because surplus is pre-allocated to past commitments.";

    const constraintP3 =
      "Some constraints are hidden in irregular essentials. Annual or uneven bills often get ignored until they arrive, creating deficit months even when a typical month looks fine. Treating irregular essentials as a monthly average makes the baseline honest. If this input is large, stability requires a buffer policy, not only a budget.";

    const prioritiseP1 =
      "Action prioritisation is about sequencing. Do not chase ten small optimisations if one structural lever exists. If you are underprepared, the first objective is to eliminate deficit. If you are borderline, the objective is to create buffer so normal variance stops turning into crises.";

    const prioritiseP2 =
      "Start with the top driver that is both large and adjustable. If the biggest driver is not adjustable short term, target the next driver and simultaneously work an income reliability lever. Income reliability beats income spikes. A small reliable increase often improves stability more than a bigger but uncertain increase.";

    const prioritiseP3 =
      "This is also where tradeoffs become explicit. If the ratio is low because essentials reflect a chosen baseline, you either change the baseline or accept the fragility and pay for it in stress and constraints. The paid output is designed to force that decision into the open rather than hiding it behind tracking.";

    const stabilityP1 =
      "Stability conditions describe what must be true for the plan to keep working without constant intervention. At break even, you need perfect months. At stable buffer, you can absorb moderate variance. At robust buffer, you can handle clustered expenses, uneven cashflow timing, and minor shocks without forced borrowing.";

    const stabilityP2 =
      "Based on your essentials total, break even income is <strong>" +
      formatWithCommas(Math.ceil(breakEvenIncome)) +
      "</strong>. Stable buffer income (ratio 1.20) is <strong>" +
      formatWithCommas(Math.ceil(stableIncome)) +
      "</strong>, and robust buffer income (ratio 1.50) is <strong>" +
      formatWithCommas(Math.ceil(robustIncome)) +
      "</strong>. Your additional monthly income required is <strong>" +
      formatWithCommas(Math.ceil(gapToBreakEven)) +
      "</strong> to break even, <strong>" +
      formatWithCommas(Math.ceil(gapToStable)) +
      "</strong> to reach stable buffer, and <strong>" +
      formatWithCommas(Math.ceil(gapToRobust)) +
      "</strong> to reach robust buffer.";

    const stabilityP3 =
      "Alternatively, if income cannot move short term, you can compute the maximum essentials that preserve stability. For stable buffer at current income, max essentials are <strong>" +
      formatWithCommas(Math.floor(maxEssentialsStable)) +
      "</strong>. For robust buffer, max essentials are <strong>" +
      formatWithCommas(Math.floor(maxEssentialsRobust)) +
      "</strong>. If your essentials exceed those limits, the baseline requires either a cost restructure or an income restructure.";

    const decisionP1 =
      "Decision framing is the final step. The ratio tells you whether you are solving a budgeting problem or a baseline problem. Budgeting problems can be solved with tracking and consistency. Baseline problems require a bigger move, such as a housing change, a debt restructure, or a reliable income lift.";

    const decisionP2 =
      "Use your classification as a rule for what not to do. If underprepared, avoid adding fixed commitments, because they lock in fragility. If borderline, avoid pretending the margin is stable. The plan should prioritise reducing volatility exposure and increasing buffer before lifestyle upgrades.";

    const decisionP3 =
      "If stable or robust, the decision shifts from survival to optimisation. Your priority becomes preventing essentials creep and deliberately allocating margin into buffer and high leverage improvements. The best long term outcome is not the highest income. It is a baseline that remains stable as life changes.";

    return (
      '<div class="di-report">' +
      '<div class="di-actions">' +
      "<h4>Snapshot</h4>" +
      "<p><strong>Classification:</strong> " +
      classification.status +
      "</p>" +
      "<p><strong>Coverage ratio:</strong> " +
      ratio.toFixed(2) +
      "</p>" +
      "<p><strong>Income:</strong> " +
      formatWithCommas(income) +
      " · <strong>Essentials:</strong> " +
      formatWithCommas(essentials) +
      " · <strong>Surplus or gap:</strong> " +
      formatWithCommas(Math.round(surplus)) +
      "</p>" +
      "</div>" +
      '<h3 class="di-result-section-title">1) Results summary</h3>' +
      "<p>" +
      summaryP1 +
      "</p>" +
      "<p>" +
      summaryP2 +
      "</p>" +
      "<p>" +
      summaryP3 +
      "</p>" +
      '<h3 class="di-result-section-title">2) Metric-by-metric interpretation</h3>' +
      "<p>" +
      metricsP1 +
      "</p>" +
      "<p>" +
      metricsP2 +
      "</p>" +
      "<p>" +
      metricsP3 +
      "</p>" +
      '<h3 class="di-result-section-title">3) Causality analysis</h3>' +
      "<p>" +
      causalityP1 +
      "</p>" +
      "<p>" +
      causalityP2 +
      "</p>" +
      "<p>" +
      causalityP3 +
      "</p>" +
      '<ul class="di-metric-list">' +
      topDriversHtml +
      "</ul>" +
      '<h3 class="di-result-section-title">4) Constraint diagnosis</h3>' +
      "<p>" +
      constraintP1 +
      "</p>" +
      "<p>" +
      constraintP2 +
      "</p>" +
      "<p>" +
      constraintP3 +
      "</p>" +
      '<h3 class="di-result-section-title">5) Action prioritisation</h3>' +
      "<p>" +
      prioritiseP1 +
      "</p>" +
      "<p>" +
      prioritiseP2 +
      "</p>" +
      "<p>" +
      prioritiseP3 +
      "</p>" +
      '<h3 class="di-result-section-title">6) Stability conditions</h3>' +
      "<p>" +
      stabilityP1 +
      "</p>" +
      "<p>" +
      stabilityP2 +
      "</p>" +
      "<p>" +
      stabilityP3 +
      "</p>" +
      '<h3 class="di-result-section-title">7) Decision framing</h3>' +
      "<p>" +
      decisionP1 +
      "</p>" +
      "<p>" +
      decisionP2 +
      "</p>" +
      "<p>" +
      decisionP3 +
      "</p>" +
      "</div>"
    );
  }

  // ------------------------------------------------------------
  // 6) RUN CALCULATION ON BUTTON CLICK
  // ------------------------------------------------------------

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const values = {
        income: parseLooseNumber(incomeNumber ? incomeNumber.value : ""),
        housing: parseLooseNumber(housingNumber ? housingNumber.value : ""),
        utilities: parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : ""),
        food: parseLooseNumber(foodNumber ? foodNumber.value : ""),
        transport: parseLooseNumber(transportNumber ? transportNumber.value : ""),
        debtMin: parseLooseNumber(debtMinNumber ? debtMinNumber.value : ""),
        insurance: parseLooseNumber(insuranceNumber ? insuranceNumber.value : ""),
        medical: parseLooseNumber(medicalNumber ? medicalNumber.value : ""),
        dependents: parseLooseNumber(dependentsNumber ? dependentsNumber.value : ""),
        subscriptions: parseLooseNumber(subscriptionsNumber ? subscriptionsNumber.value : ""),
        education: parseLooseNumber(educationNumber ? educationNumber.value : ""),
        irregular: parseLooseNumber(irregularNumber ? irregularNumber.value : "")
      };

      if (!validatePositive(values.income, "monthly income")) return;
      if (!validateNonNegative(values.housing, "housing essentials")) return;
      if (!validateNonNegative(values.utilities, "utilities and services")) return;
      if (!validateNonNegative(values.food, "food essentials")) return;
      if (!validateNonNegative(values.transport, "transport essentials")) return;
      if (!validateNonNegative(values.debtMin, "minimum debt payments")) return;
      if (!validateNonNegative(values.insurance, "insurance essentials")) return;
      if (!validateNonNegative(values.medical, "medical baseline costs")) return;
      if (!validateNonNegative(values.dependents, "dependents essentials")) return;
      if (!validateNonNegative(values.subscriptions, "committed services")) return;
      if (!validateNonNegative(values.education, "education baseline")) return;
      if (!validateNonNegative(values.irregular, "irregular essentials")) return;

      const essentials = computeEssentials(values);
      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0 to compute the coverage ratio.");
        return;
      }

      const ratio = values.income / essentials;
      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Inputs produced an invalid result. Check values and try again.");
        return;
      }

      const classification = classifyRatio(ratio);
      const surplus = values.income - essentials;
      const top3 = topDrivers(values, essentials);

      const reportHtml = buildReport(values, essentials, ratio, classification, surplus, top3);
      setResultSuccess(reportHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Planner Pro - check this diagnostic: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
