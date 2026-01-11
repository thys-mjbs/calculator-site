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

  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");

  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");

  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");

  const variabilityNumber = document.getElementById("variabilityNumber");
  const variabilityRange = document.getElementById("variabilityRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");

  const confidenceNumber = document.getElementById("confidenceNumber");
  const confidenceRange = document.getElementById("confidenceRange");

  // ------------------------------------------------------------
  // 2) HELPERS (BASELINE PATTERN)
  // ------------------------------------------------------------
  function parseLooseNumber(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return NaN;
    const cleaned = raw.replace(/,/g, "");
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

  function formatTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  }

  function formatInputWithCommas(inputEl) {
    const v = parseLooseNumber(inputEl.value);
    if (!Number.isFinite(v)) return;
    inputEl.value = formatWithCommas(v);
  }

  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.innerHTML = '<div class="di-report"><p class="di-warn">' + escapeHtml(message) + "</p></div>";
  }

  function setResultHtml(html) {
    if (!resultDiv) return;
    resultDiv.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, opts) {
    const options = opts || {};
    const isDecimal = !!options.isDecimal;
    const decimals = Number.isFinite(options.decimals) ? options.decimals : 0;

    if (!rangeEl || !numberEl) return;

    function setNumberFromValue(v) {
      if (isDecimal) {
        numberEl.value = Number.isFinite(v) ? v.toFixed(decimals) : "";
      } else {
        numberEl.value = Number.isFinite(v) ? formatWithCommas(v) : "";
      }
    }

    function setRangeFromValue(v) {
      if (!Number.isFinite(v)) return;
      rangeEl.value = String(v);
    }

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      setNumberFromValue(v);
    });

    numberEl.addEventListener("input", function () {
      if (isDecimal) return;
      formatInputWithCommas(numberEl);
    });

    function commitNumber() {
      const v = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(v)) {
        numberEl.value = "";
        return;
      }
      const next = clamp(v, min, max);
      if (!Number.isFinite(next)) return;
      setRangeFromValue(next);
      setNumberFromValue(next);
    }

    numberEl.addEventListener("blur", commitNumber);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumber();
      }
    });

    const init = parseLooseNumber(rangeEl.value);
    setNumberFromValue(init);
  }

  // ------------------------------------------------------------
  // 3) BINDINGS
  // ------------------------------------------------------------
  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 150000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 40000);
  bindRangeAndNumber(foodRange, foodNumber, 0, 60000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 60000);
  bindRangeAndNumber(debtRange, debtNumber, 0, 120000);

  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 120000);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.5, 1, { isDecimal: true, decimals: 2 });
  bindRangeAndNumber(variabilityRange, variabilityNumber, 0, 40);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 25);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 0, 100);

  function validateNonNegative(n, label) {
    if (!Number.isFinite(n) || n < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(n, label) {
    if (!Number.isFinite(n) || n <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  function getTopDrivers(entries) {
    return entries
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      })
      .filter(function (x) {
        return Number.isFinite(x.value) && x.value > 0;
      })
      .slice(0, 3);
  }

  function classify(coverage) {
    if (coverage < 1.0) return "Underprepared";
    if (coverage < 1.25) return "Borderline";
    return "Stable";
  }

  function confidenceTone(confPct) {
    if (confPct >= 80) return "high";
    if (confPct >= 55) return "moderate";
    return "low";
  }

  // ------------------------------------------------------------
  // 4) CALCULATION + REPORT RENDER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (!resultDiv) return;

      const income = parseLooseNumber(incomeNumber && incomeNumber.value);
      const housing = parseLooseNumber(housingNumber && housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber && utilitiesNumber.value);
      const food = parseLooseNumber(foodNumber && foodNumber.value);
      const transport = parseLooseNumber(transportNumber && transportNumber.value);
      const debt = parseLooseNumber(debtNumber && debtNumber.value);
      const commitments = parseLooseNumber(commitmentsNumber && commitmentsNumber.value);

      const reliability = parseLooseNumber(reliabilityNumber && reliabilityNumber.value);
      const variabilityPct = parseLooseNumber(variabilityNumber && variabilityNumber.value);
      const bufferMonths = parseLooseNumber(bufferMonthsNumber && bufferMonthsNumber.value);
      const errorMarginPct = parseLooseNumber(errorMarginNumber && errorMarginNumber.value);
      const confidencePct = parseLooseNumber(confidenceNumber && confidenceNumber.value);

      if (!validatePositive(income, "monthly income")) return;

      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food and basic household")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "debt minimums")) return;
      if (!validateNonNegative(commitments, "non-negotiable commitments")) return;

      if (!Number.isFinite(reliability) || reliability < 0.5 || reliability > 1) {
        setResultError("Enter a valid income reliability between 0.50 and 1.00.");
        return;
      }
      if (!Number.isFinite(variabilityPct) || variabilityPct < 0 || variabilityPct > 40) {
        setResultError("Enter a valid income variability percent between 0 and 40.");
        return;
      }
      if (!Number.isFinite(bufferMonths) || bufferMonths < 0 || bufferMonths > 12) {
        setResultError("Enter a valid target buffer months between 0 and 12.");
        return;
      }
      if (!Number.isFinite(errorMarginPct) || errorMarginPct < 0 || errorMarginPct > 25) {
        setResultError("Enter a valid estimation error margin percent between 0 and 25.");
        return;
      }
      if (!Number.isFinite(confidencePct) || confidencePct < 0 || confidencePct > 100) {
        setResultError("Enter a valid estimation confidence percent between 0 and 100.");
        return;
      }

      const baseEssentials = housing + utilities + food + transport + debt;
      if (!Number.isFinite(baseEssentials) || baseEssentials <= 0) {
        setResultError("Essentials total must be greater than 0.");
        return;
      }

      const adjustedEssentials = baseEssentials + commitments;
      const uncertaintyMultiplier = 1 + errorMarginPct / 100;
      const stressedEssentials = adjustedEssentials * uncertaintyMultiplier;

      const reliabilityAdjustedIncome = income * reliability;
      const variabilityAdjustedIncome = reliabilityAdjustedIncome * (1 - variabilityPct / 100);
      const effectiveIncome = Math.max(0, variabilityAdjustedIncome);

      const coverage = effectiveIncome / stressedEssentials;
      const margin = effectiveIncome - stressedEssentials;

      if (!Number.isFinite(coverage) || !Number.isFinite(margin)) {
        setResultError("Calculation failed. Check inputs and try again.");
        return;
      }

      const status = classify(coverage);
      const tone = confidenceTone(confidencePct);

      const breakEvenIncomeNeeded = stressedEssentials;
      const breakEvenIncrease = Math.max(0, breakEvenIncomeNeeded - effectiveIncome);

      const stableTarget = 1.25;
      const stableIncomeNeeded = stressedEssentials * stableTarget;
      const stableIncrease = Math.max(0, stableIncomeNeeded - effectiveIncome);

      const maxEssentialsAtBreakEven = effectiveIncome;
      const breakEvenReduction = Math.max(0, stressedEssentials - maxEssentialsAtBreakEven);

      const maxEssentialsAtStable = effectiveIncome / stableTarget;
      const stableReduction = Math.max(0, stressedEssentials - maxEssentialsAtStable);

      const bufferTargetAmount = stressedEssentials * bufferMonths;
      const monthsToBuffer = margin > 0 ? bufferTargetAmount / margin : Infinity;

      const drivers = getTopDrivers([
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food and basic household", value: food },
        { label: "Transport", value: transport },
        { label: "Debt minimums", value: debt },
        { label: "Non-negotiable commitments", value: commitments }
      ]);

      const driverLabels = drivers.length ? drivers.map(function (d) { return d.label; }) : [];

      const headlineMeaning =
        status === "Stable"
          ? "The base structure can carry essentials even after reliability, variability, and uncertainty are applied."
          : status === "Borderline"
            ? "The base structure works, but it is sensitive. Small drift or a modest income dip can flip the month negative."
            : "The base structure is short. After realism adjustments, income does not carry essentials.";

      const riskExplanation =
        status === "Stable"
          ? "Stable here does not mean comfortable. It means the month has a buffer after stress adjustments. The risk is silent drift: fixed commitments rising while income reliability and variability stay unchanged."
          : status === "Borderline"
            ? "Borderline means the month depends on conditions staying favorable. If income reliability drops, variability increases, or essentials are underestimated, the margin disappears quickly."
            : "Underprepared means the month is structurally failing under realistic assumptions. The most dangerous pattern is trying to solve it with small cuts that do not move the dominant drivers.";

      const metricBlock =
        '<div class="di-metrics">' +
          '<p class="di-metric"><strong>Classification</strong> ' + escapeHtml(status) + '</p>' +
          '<p class="di-metric"><strong>Coverage (effective income / stressed essentials)</strong> ' + escapeHtml(formatTwoDecimals(coverage)) + '×</p>' +
          '<p class="di-metric"><strong>Effective income</strong> ' + escapeHtml(formatWithCommas(effectiveIncome)) + '</p>' +
          '<p class="di-metric"><strong>Stressed essentials</strong> ' + escapeHtml(formatWithCommas(stressedEssentials)) + '</p>' +
          '<p class="di-metric"><strong>Monthly margin</strong> ' + escapeHtml(formatWithCommas(margin)) + '</p>' +
          '<p class="di-metric"><strong>Buffer target</strong> ' + escapeHtml(formatWithCommas(bufferTargetAmount)) + '</p>' +
          '<p class="di-metric"><strong>Months to reach buffer at current margin</strong> ' + (monthsToBuffer === Infinity ? "Not achievable at current margin" : escapeHtml(formatTwoDecimals(monthsToBuffer))) + '</p>' +
        "</div>";

      const driversText =
        driverLabels.length
          ? '<ul class="di-driver-list"><li>' + driverLabels.map(escapeHtml).join("</li><li>") + "</li></ul>"
          : '<p class="di-muted">No drivers identified (all values zero, which should not happen if essentials total is valid).</p>';

      const leversText =
        status === "Underprepared"
          ? "To reach break-even under stress assumptions, either increase effective income by " + formatWithCommas(breakEvenIncrease) + " or reduce stressed essentials by " + formatWithCommas(breakEvenReduction) + "."
          : status === "Borderline"
            ? "To reach a stable threshold (1.25×) under stress assumptions, either increase effective income by " + formatWithCommas(stableIncrease) + " or reduce stressed essentials by " + formatWithCommas(stableReduction) + "."
            : "To reinforce stability (1.25×) under stress assumptions, the remaining gap is " + formatWithCommas(stableIncrease) + " of income-side change or " + formatWithCommas(stableReduction) + " of essentials-side change. If both are near zero, stability is already robust for this model.";

      const cautionByConfidence =
        tone === "high"
          ? "Confidence is high. The interpretation can be used more directly for sequencing decisions."
          : tone === "moderate"
            ? "Confidence is moderate. Treat the numbers as a directional map, and assume small underestimates exist."
            : "Confidence is low. The safest use is to treat this as a warning system. Assume stressed essentials are understated and avoid decisions that add fixed costs.";

      const reportHtml =
        '<div class="di-report">' +

          "<h3>1) Results Summary</h3>" +
          "<p>" + escapeHtml(headlineMeaning) + "</p>" +
          "<p>" + escapeHtml(riskExplanation) + "</p>" +
          "<p>" + escapeHtml(cautionByConfidence) + "</p>" +

          "<h3>2) Metric-by-Metric Interpretation</h3>" +
          "<p>Coverage is the core signal. It is not just income divided by expenses. It is effective income divided by stressed essentials. Effective income is reduced by reliability and variability. Stressed essentials are increased by the estimation error margin. This matters because many budgets only work on paper when both sides are optimistic.</p>" +
          "<p>Monthly margin is the operational buffer. A positive margin means the month can absorb small surprises. A near-zero margin means the month is technically balanced but structurally fragile. A negative margin means the month will be repaired through debt, arrears, or depletion. Margin interacts directly with buffer targets because buffer building is just margin converted into time and stored capacity.</p>" +
          "<p>The buffer target is expressed in months because months is how real life is felt. One month of buffer does not fix an underprepared structure, but it reduces how often you hit zero. More months increase resilience, but they become unrealistic if the margin is small. The months-to-buffer estimate is therefore a feasibility check, not a promise.</p>" +

          "<h3>3) Causality Analysis</h3>" +
          "<p>This outcome is driven by the relationship between stressed essentials and effective income. Stressed essentials rise when commitments are high or when estimation error is large. Effective income falls when reliability is low or variability is high. The result is a compressed margin even when raw income looks adequate.</p>" +
          "<p>The top drivers below are not moral judgments. They are simply the largest contributors to stressed essentials. These are where changes have leverage. Changes outside these drivers tend to feel productive but do not move the classification meaningfully.</p>" +
          "<p>Primary causes are the drivers that dominate the total and are hard to change quickly, such as housing, debt minimums, or non-negotiable commitments. Secondary contributors are smaller categories that matter mostly when the structure is already tight. Mixing them up leads to false progress.</p>" +

          "<h4>Largest contributors (labels only)</h4>" +
          driversText +

          "<h3>4) Constraint Diagnosis</h3>" +
          "<p>Some problems are not fixable without structural change. If housing or debt minimums dominate, the structure is constrained. You cannot optimize your way out with small cuts if the dominant driver stays intact. Structural change means changing the size of the big driver or changing income in a way that is durable.</p>" +
          "<p>Incremental improvements are still useful when the structure is near workable. If the classification is borderline, incremental improvements can push you into stable territory. If the classification is underprepared with a large gap, incremental changes may reduce damage but will not create stability alone.</p>" +
          "<p>False fixes are changes that are easy to do but do not move the ratio. Examples include aggressively trimming tiny categories while keeping the biggest driver untouched, or assuming reliability and variability will improve without evidence. This tool exists to prevent those mistakes by forcing a stress-adjusted view.</p>" +

          "<h3>5) Action Prioritisation Logic</h3>" +
          "<p>Action 1 should target the biggest lever because classification changes come from moving one large input, not ten small ones. If you try to do everything, you do nothing consistently enough to shift the structure. Start with the dominant driver or the income-side factor that is most realistic to improve.</p>" +
          "<p>Income-side corrections increase effective income. Essentials-side corrections reduce stressed essentials. Both work, but they behave differently. Income-side changes fail when reliability is low or variability is high because the nominal increase does not translate into dependable capacity. Essentials-side changes fail when the cut is not durable or when it creates second-order costs.</p>" +
          "<p>If only one lever is pulled, the tool’s lever targets show what would be required. The risk is choosing the lever that looks easier but does not survive real-world friction. Use the targets as a feasibility filter rather than a to-do list.</p>" +
          '<p class="di-muted">' + escapeHtml(leversText) + "</p>" +

          "<h3>6) Stability Conditions</h3>" +
          "<p>Stability is conditional. It holds only while effective income stays above stressed essentials with enough margin to absorb variance. That means the reliability and variability assumptions matter. If income becomes less reliable or more variable, effective income drops even if headline income does not change.</p>" +
          "<p>Stability is often broken by new fixed commitments. Commitments convert flexibility into rigidity. If a decision adds a fixed monthly cost, it should be treated as a direct hit to margin and buffer feasibility. This is why the tool separates commitments from other essentials: it is a structural rigidity indicator.</p>" +
          "<p>Time sensitivity matters. A short-term income boost is not the same as a sustained income improvement. Similarly, a temporary expense cut is not the same as a stable reduction. Stability requires sustained conditions, not a single good month.</p>" +

          "<h3>7) Decision Framing</h3>" +
          "<p>Use this result to gate decisions that add fixed costs. If the classification is underprepared or borderline, avoid commitments that assume a best-case month. If the classification is stable, treat that stability as something to protect, not something to spend immediately.</p>" +
          "<p>Use the drivers list to focus attention. Decisions are easier when you accept that only a few categories matter. The point is not detailed budgeting advice. The point is sequencing: fix the big driver first, then refine.</p>" +
          "<p>Finally, separate interpretation from identity. This is a structural snapshot under stress assumptions. The practical question is not “am I good with money.” The practical question is “what must be true for the month to be stable, and what will break it.”</p>" +

          metricBlock +

        "</div>";

      setResultHtml(reportHtml);
    });
  }

  // ------------------------------------------------------------
  // 5) WHATSAPP SHARE
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Check Pro - paid analysis: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
