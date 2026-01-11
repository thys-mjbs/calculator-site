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
  // 2) HELPERS (CONSISTENT PATTERN)
  // ------------------------------------------------------------

  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(num) {
    if (!Number.isFinite(num)) return "";
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatTwoDecimals(num) {
    if (!Number.isFinite(num)) return "";
    return num.toFixed(2);
  }

  function formatInputWithCommas(inputEl, value) {
    if (!inputEl) return;
    inputEl.value = formatWithCommas(value);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.className = "di-result-root";
    resultDiv.innerHTML =
      '<div class="di-section"><div class="di-section-title">Input issue</div><p class="di-error">' +
      escapeHtml(message) +
      "</p></div>";
  }

  function setResultHtml(html) {
    if (!resultDiv) return;
    resultDiv.className = "di-result-root";
    resultDiv.innerHTML = html;
  }

  // ------------------------------------------------------------
  // 3) BIND RANGE + NUMBER (CONSISTENT)
  // ------------------------------------------------------------

  function bindRangeAndNumber(rangeEl, numberEl, opts) {
    if (!rangeEl || !numberEl) return;

    const min = opts.min;
    const max = opts.max;
    const step = opts.step;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    function syncFromRange() {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      if (opts.format === "twoDecimals") {
        numberEl.value = formatTwoDecimals(v);
      } else {
        formatInputWithCommas(numberEl, v);
      }
    }

    function syncFromNumber(commit) {
      const vRaw = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(vRaw)) {
        if (commit) {
          numberEl.value =
            opts.format === "twoDecimals" ? formatTwoDecimals(opts.defaultValue) : formatWithCommas(opts.defaultValue);
        }
        rangeEl.value = String(opts.defaultValue);
        return;
      }
      const vClamped = clamp(vRaw, min, max);
      rangeEl.value = String(vClamped);
      if (commit) {
        if (opts.format === "twoDecimals") {
          numberEl.value = formatTwoDecimals(vClamped);
        } else {
          formatInputWithCommas(numberEl, vClamped);
        }
      }
    }

    rangeEl.addEventListener("input", syncFromRange);

    numberEl.addEventListener("input", function () {
      const v = parseLooseNumber(numberEl.value);
      if (Number.isFinite(v)) {
        rangeEl.value = String(clamp(v, min, max));
      }
    });

    numberEl.addEventListener("blur", function () {
      syncFromNumber(true);
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") syncFromNumber(true);
    });

    rangeEl.value = String(opts.defaultValue);
    if (opts.format === "twoDecimals") {
      numberEl.value = formatTwoDecimals(opts.defaultValue);
    } else {
      formatInputWithCommas(numberEl, opts.defaultValue);
    }
  }

  // ------------------------------------------------------------
  // 4) DEFAULTS + BINDINGS
  // ------------------------------------------------------------

  bindRangeAndNumber(incomeRange, incomeNumber, { min: 0, max: 500000, step: 100, defaultValue: 60000 });
  bindRangeAndNumber(housingRange, housingNumber, { min: 0, max: 250000, step: 100, defaultValue: 18000 });
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, { min: 0, max: 100000, step: 50, defaultValue: 2500 });
  bindRangeAndNumber(foodRange, foodNumber, { min: 0, max: 150000, step: 50, defaultValue: 6000 });
  bindRangeAndNumber(transportRange, transportNumber, { min: 0, max: 150000, step: 50, defaultValue: 3500 });
  bindRangeAndNumber(debtRange, debtNumber, { min: 0, max: 200000, step: 50, defaultValue: 2500 });
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, { min: 0, max: 250000, step: 50, defaultValue: 1500 });

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, {
    min: 0.5,
    max: 1.0,
    step: 0.01,
    defaultValue: 0.9,
    format: "twoDecimals",
  });
  bindRangeAndNumber(variabilityRange, variabilityNumber, { min: 0, max: 40, step: 1, defaultValue: 10 });
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, { min: 0, max: 12, step: 1, defaultValue: 2 });
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, { min: 0, max: 30, step: 1, defaultValue: 8 });
  bindRangeAndNumber(confidenceRange, confidenceNumber, { min: 0, max: 100, step: 1, defaultValue: 70 });

  // ------------------------------------------------------------
  // 5) CALCULATION + RENDER
  // ------------------------------------------------------------

  function compute() {
    const income = parseLooseNumber(incomeNumber.value);
    const housing = parseLooseNumber(housingNumber.value);
    const utilities = parseLooseNumber(utilitiesNumber.value);
    const food = parseLooseNumber(foodNumber.value);
    const transport = parseLooseNumber(transportNumber.value);
    const debt = parseLooseNumber(debtNumber.value);
    const commitments = parseLooseNumber(commitmentsNumber.value);

    const reliability = parseLooseNumber(reliabilityNumber.value);
    const variabilityPct = parseLooseNumber(variabilityNumber.value);
    const bufferMonths = parseLooseNumber(bufferMonthsNumber.value);
    const errorMarginPct = parseLooseNumber(errorMarginNumber.value);
    const confidencePct = parseLooseNumber(confidenceNumber.value);

    const fields = [
      { v: income, name: "Monthly income" },
      { v: housing, name: "Housing essentials" },
      { v: utilities, name: "Utilities" },
      { v: food, name: "Food essentials" },
      { v: transport, name: "Transport essentials" },
      { v: debt, name: "Debt minimums" },
      { v: commitments, name: "Non-negotiable commitments" },
      { v: reliability, name: "Income reliability" },
      { v: variabilityPct, name: "Income variability" },
      { v: bufferMonths, name: "Target buffer months" },
      { v: errorMarginPct, name: "Estimation error margin" },
      { v: confidencePct, name: "Estimation confidence" },
    ];

    for (let i = 0; i < fields.length; i++) {
      if (!Number.isFinite(fields[i].v)) return { error: fields[i].name + " must be a valid number." };
      if (fields[i].v < 0) return { error: fields[i].name + " cannot be negative." };
    }

    if (income === 0) return { error: "Monthly income cannot be zero." };
    if (reliability < 0.5 || reliability > 1) return { error: "Income reliability must be between 0.50 and 1.00." };
    if (variabilityPct > 40) return { error: "Income variability must be 0–40%." };
    if (confidencePct > 100) return { error: "Estimation confidence must be 0–100%." };

    const essentialsRaw = housing + utilities + food + transport + debt + commitments;
    if (essentialsRaw <= 0) return { error: "Essentials total must be greater than zero." };

    const downsideFactor = 1 - variabilityPct / 100;
    const adjustedIncome = income * reliability * downsideFactor;

    const errorFactor = 1 + errorMarginPct / 100;
    const essentialsAdjusted = essentialsRaw * errorFactor;

    let coverage = adjustedIncome / essentialsAdjusted;

    if (confidencePct < 50) coverage = coverage * 0.95;
    if (confidencePct < 25) coverage = coverage * 0.9;

    const margin = adjustedIncome - essentialsAdjusted;

    const requiredBuffer = essentialsAdjusted * bufferMonths;

    const drivers = [
      { key: "housing", value: housing },
      { key: "utilities", value: utilities },
      { key: "food", value: food },
      { key: "transport", value: transport },
      { key: "debt", value: debt },
      { key: "commitments", value: commitments },
    ].sort(function (a, b) {
      return b.value - a.value;
    });

    return {
      adjustedIncome,
      essentialsAdjusted,
      coverage,
      margin,
      requiredBuffer,
      bufferMonths,
      drivers,
    };
  }

  function classify(coverage) {
    if (!Number.isFinite(coverage)) return { label: "Invalid", tone: "di-badge-warn" };
    if (coverage < 1.0) return { label: "Underprepared", tone: "di-badge-bad" };
    if (coverage < 1.15) return { label: "Borderline", tone: "di-badge-warn" };
    return { label: "Stable", tone: "di-badge-good" };
  }

  function driverLabel(key) {
    if (key === "housing") return "Housing";
    if (key === "utilities") return "Utilities";
    if (key === "food") return "Food";
    if (key === "transport") return "Transport";
    if (key === "debt") return "Debt minimums";
    if (key === "commitments") return "Commitments";
    return key;
  }

  function buildReport(data) {
    const status = classify(data.coverage);

    const top = data.drivers.slice(0, 3);
    const topLabels = top.map(function (d) {
      return driverLabel(d.key);
    });

    const incomeAdjFmt = formatWithCommas(data.adjustedIncome);
    const essentialsFmt = formatWithCommas(data.essentialsAdjusted);
    const marginFmt = formatWithCommas(Math.abs(data.margin));
    const bufferFmt = formatWithCommas(data.requiredBuffer);

    const marginDirection = data.margin >= 0 ? "surplus" : "shortfall";
    const coveragePct = data.coverage * 100;

    const metricBlock =
      '<div class="di-kpi-row">' +
      '<div class="di-kpi"><div class="di-kpi-label">Classification</div><div class="di-kpi-value"><span class="di-badge ' +
      status.tone +
      '">' +
      status.label +
      "</span></div></div>" +
      '<div class="di-kpi"><div class="di-kpi-label">Coverage ratio</div><div class="di-kpi-value">' +
      formatTwoDecimals(data.coverage) +
      '</div><div class="di-kpi-sub">' +
      formatTwoDecimals(coveragePct) +
      "%</div></div>" +
      '<div class="di-kpi"><div class="di-kpi-label">Adjusted income</div><div class="di-kpi-value">' +
      incomeAdjFmt +
      "</div></div>" +
      '<div class="di-kpi"><div class="di-kpi-label">Adjusted essentials</div><div class="di-kpi-value">' +
      essentialsFmt +
      "</div></div>" +
      "</div>";

    const recap =
      '<div class="di-section">' +
      '<div class="di-section-title">Computed context</div>' +
      "<p><span class=\"di-muted\">Adjusted income:</span> " +
      incomeAdjFmt +
      " &nbsp; <span class=\"di-muted\">Adjusted essentials:</span> " +
      essentialsFmt +
      " &nbsp; <span class=\"di-muted\">Monthly " +
      marginDirection +
      ":</span> " +
      marginFmt +
      "</p>" +
      "<p><span class=\"di-muted\">Primary drivers:</span> " +
      escapeHtml(topLabels.join(", ")) +
      " &nbsp; <span class=\"di-muted\">Buffer target:</span> " +
      bufferFmt +
      " (" +
      formatWithCommas(data.bufferMonths) +
      " months)</p>" +
      "</div>";

    const section1 =
      '<div class="di-section"><div class="di-section-title">1) Results Summary</div>' +
      "<p>The classification is a plain-language interpretation of whether the current income structure can carry the essentials structure without relying on luck, exceptional months, or delayed bills. “" +
      escapeHtml(status.label) +
      "” is not a moral verdict. It is a signal about how fragile or robust the underlying setup is when treated as a system, not a single snapshot.</p>" +
      "<p>This result is structurally risky when the essentials base is close to (or above) the realistic income capacity. In that situation, the system has no slack. Any disturbance, even a small one, turns into cascading tradeoffs: delays, compromises, and hidden borrowing. A stable result is the opposite. It implies there is room for normal variance without a forced sequence of cuts or debt.</p>" +
      "<p>Read the numbers as constraints, not as a target to “hit once”. The point is repeatability. If the setup only works when everything goes right, it will fail. The purpose of the paid view is to show where that fragility comes from and how to frame corrections in the right order, rather than chasing the wrong lever because it feels easier.</p>" +
      "</div>";

    const section2 =
      '<div class="di-section"><div class="di-section-title">2) Metric-by-Metric Interpretation</div>' +
      "<p><strong>Coverage ratio</strong> is the central readiness metric. It compares adjusted income against adjusted essentials to reflect realistic capacity, not an optimistic best month. A healthier band is typically above 1.15, because it implies slack after accounting for reliability and variability. Below 1.00, essentials exceed realistic capacity and the system has an embedded failure mode. Between 1.00 and 1.15 is often survivable, but only if variance and estimation are controlled.</p>" +
      "<p><strong>Margin</strong> is the monthly " +
      marginDirection +
      " after adjustments. A positive margin is what funds buffers, absorbs errors, and gives options. A negative margin is not just “tight”. It means the month is mathematically incomplete without borrowing, delaying, or cutting essentials. Margin interacts with coverage: a ratio can look acceptable while margin stays thin, which still leaves little room for randomness.</p>" +
      "<p><strong>Required buffer</strong> translates the stability goal into a concrete amount (months of essentials). It matters because stability is not only about an average month. It is about surviving an abnormal month without structural collapse. Buffer interacts with margin: larger buffer targets increase the importance of a durable monthly surplus. If surplus is thin, buffer targets remain theoretical rather than reachable.</p>" +
      "</div>";

    const section3 =
      '<div class="di-section"><div class="di-section-title">3) Causality Analysis</div>' +
      "<p>This outcome occurs because the essentials base is built as a fixed load, while income behaves like a variable resource. Even if income is “high”, the system fails when the load is too close to capacity after reliability and variability are applied. That is the difference between an on-paper ratio and a readiness ratio.</p>" +
      "<p>The primary contributors are the largest essential components because they define the baseline load. In this run, the top drivers by size are: " +
      escapeHtml(topLabels.join(", ")) +
      ". When a single driver dominates, the system becomes sensitive to that line item. When several drivers are similar, the system is sensitive to cumulative drift and underestimation, which is why estimation error matters.</p>" +
      "<p>Secondary contributors are smaller items that do not look dangerous on their own but compound over time. They create hidden fragility because they reduce the slack that would otherwise fund buffers and absorb variance. In fragile systems, small secondary contributors are what turns “tight but workable” into “always behind”.</p>" +
      "</div>";

    const section4 =
      '<div class="di-section"><div class="di-section-title">4) Constraint Diagnosis</div>' +
      "<p>Some constraints cannot be solved by micro-optimising. If the core load is too high relative to realistic capacity, then small cuts, temporary frugality, or one-off savings do not change the structure. They provide relief, but not stability. Structural constraints are those where the only durable fix is to move one of the base lines: income capacity, housing load, or fixed commitments.</p>" +
      "<p>Other constraints can be improved incrementally. These are the areas where repeated small improvements compound and create slack without destabilising the household. Incremental improvements matter most when the system is already close to stable and needs slack, not a full rebuild.</p>" +
      "<p>False fixes are changes that feel productive but do not move readiness. Common examples are focusing on optional spending while ignoring a dominant essential driver, or chasing a “perfect budget” while income reliability remains weak. This report keeps focus on what actually moves the constraint, not what feels controllable in the moment.</p>" +
      "</div>";

    const section5 =
      '<div class="di-section"><div class="di-section-title">5) Action Prioritisation Logic</div>' +
      "<p>Action sequencing matters because different levers have different speed, risk, and reversibility. The first action should protect stability quickly by addressing the most immediate failure mode (coverage below 1.00 or thin margin). The second action should then build resilience so the system does not relapse when conditions shift.</p>" +
      "<p>Income-side corrections typically increase capacity, but can introduce volatility and time risk if they rely on uncertain upside. Essentials-side corrections reduce load, but can be slower when the driver is contractual or structural. This is why a good plan often uses both, but in a sequence that avoids destabilising the system while margin is still thin.</p>" +
      "<p>If only one lever is pulled, the outcome depends on where the constraint actually is. If essentials dominate, income increases may be absorbed without creating stability. If income reliability dominates, cuts may create short-term relief while volatility still breaks the month. The priority logic prevents effort being spent on the lever that produces the smallest readiness change.</p>" +
      "</div>";

    const section6 =
      '<div class="di-section"><div class="di-section-title">6) Stability Conditions</div>' +
      "<p>Stability is not a single score. It is a set of conditions that must remain true over time. At a minimum, adjusted income must remain reliably above adjusted essentials, and margin must be large enough to absorb normal variance. When those conditions hold, the system can tolerate imperfect months without collapsing into debt or delayed obligations.</p>" +
      "<p>Stability breaks when load rises faster than capacity or when reliability drops. Even if essentials stay constant, instability can return if income becomes more variable, if assumptions drift, or if estimates are optimistic. This is why the same budget can feel fine for months and then fail suddenly. The condition that changed is the underlying reliability, not the visible total.</p>" +
      "<p>Time sensitivity matters. Short-term stability is about surviving the next cycle without forced tradeoffs. Sustained stability is about keeping coverage above the healthier band while buffers are built and maintained. A system can be temporarily stable without being resilient. The goal is to prevent the common pattern where stability exists only until the next disruption.</p>" +
      "</div>";

    const section7 =
      '<div class="di-section"><div class="di-section-title">7) Decision Framing</div>' +
      "<p>Use this result to frame decisions as risk management, not as a test of discipline. If readiness is underprepared or borderline, the key question is which commitments are structurally optional and which are structurally required. This distinction separates a realistic plan from one that fails because it assumes conditions that do not hold.</p>" +
      "<p>When evaluating changes, focus on sequencing and constraints. Decisions that increase fixed load should be tested against coverage and margin, not against best-month income. Decisions that reduce load should be tested against durability: can the change persist without creating secondary costs or hidden tradeoffs that undo the benefit.</p>" +
      "<p>Treat this report as a map of the system. The value is not the numeric outputs alone. The value is understanding why the system behaves the way it does so future decisions are made with awareness of fragility and slack.</p>" +
      "</div>";

    return metricBlock + recap + section1 + section2 + section3 + section4 + section5 + section6 + section7;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const data = compute();
      if (data.error) {
        setResultError(data.error);
        return;
      }
      setResultHtml(buildReport(data));
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
