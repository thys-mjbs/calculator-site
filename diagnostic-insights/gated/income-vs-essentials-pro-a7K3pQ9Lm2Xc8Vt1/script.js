document.addEventListener("DOMContentLoaded", function () {
  // ---------------
  // ELEMENT BINDINGS
  // ---------------
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

  const medicalNumber = document.getElementById("medicalNumber");
  const medicalRange = document.getElementById("medicalRange");

  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");

  const variabilityNumber = document.getElementById("variabilityNumber");
  const variabilityRange = document.getElementById("variabilityRange");

  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");

  const confidenceNumber = document.getElementById("confidenceNumber");
  const confidenceRange = document.getElementById("confidenceRange");

  const calculateButton = document.getElementById("calculateButton");
  const result = document.getElementById("result");
  const shareWhatsAppButton = document.getElementById("shareWhatsAppButton");

  // Slot 8 (must update by ID)
  const proHeadline = document.getElementById("proHeadline");
  const proEssentials = document.getElementById("proEssentials");
  const proConservativeIncome = document.getElementById("proConservativeIncome");
  const proRatio = document.getElementById("proRatio");
  const proMargin = document.getElementById("proMargin");
  const proTargets = document.getElementById("proTargets");
  const proBuffer = document.getElementById("proBuffer");
  const proLevers = document.getElementById("proLevers");
  const proSensitivity = document.getElementById("proSensitivity");
  const proCombined = document.getElementById("proCombined");
  const proPlan = document.getElementById("proPlan");

  // -------
  // HELPERS
  // -------
  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(value, decimals) {
    if (!Number.isFinite(value)) return "";
    const d = Number.isFinite(decimals) ? decimals : 0;
    const fixed = value.toFixed(d);
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length === 2 ? parts[0] + "." + parts[1] : parts[0];
  }

  function formatTwoDecimals(value) {
    return formatWithCommas(value, 2);
  }

  function formatInputWithCommas(inputEl, decimals) {
    const num = parseLooseNumber(inputEl.value);
    if (!Number.isFinite(num)) return;
    inputEl.value = formatWithCommas(num, decimals);
  }

  function bindRangeAndNumber(rangeEl, numberEl, options) {
    const min = options.min;
    const max = options.max;
    const step = options.step;
    const decimals = options.decimals;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    function syncFromRange() {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      numberEl.value = formatWithCommas(v, decimals);
    }

    function syncFromNumber() {
      const v = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(v)) return false;
      const clamped = clamp(v, min, max);
      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped, decimals);
      return true;
    }

    rangeEl.addEventListener("input", syncFromRange);

    numberEl.addEventListener("input", function () {
      const raw = numberEl.value;
      if (raw === "") return;
      if (!/^[0-9.,\s-]+$/.test(raw)) return;
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        syncFromNumber();
      }
    });

    numberEl.addEventListener("blur", function () {
      syncFromNumber();
    });

    numberEl.addEventListener("focus", function () {
      const num = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(num)) return;
      numberEl.value = String(num);
    });

    syncFromRange();
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  // ---------------
  // INPUT BINDINGS
  // ---------------
  bindRangeAndNumber(incomeRange, incomeNumber, { min: 0, max: 300000, step: 100, decimals: 0 });
  bindRangeAndNumber(housingRange, housingNumber, { min: 0, max: 250000, step: 100, decimals: 0 });
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, { min: 0, max: 80000, step: 100, decimals: 0 });
  bindRangeAndNumber(groceriesRange, groceriesNumber, { min: 0, max: 120000, step: 100, decimals: 0 });
  bindRangeAndNumber(transportRange, transportNumber, { min: 0, max: 120000, step: 100, decimals: 0 });
  bindRangeAndNumber(medicalRange, medicalNumber, { min: 0, max: 120000, step: 100, decimals: 0 });

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, { min: 0.5, max: 1.0, step: 0.01, decimals: 2 });
  bindRangeAndNumber(variabilityRange, variabilityNumber, { min: 0, max: 40, step: 1, decimals: 0 });
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, { min: 0, max: 500000, step: 1000, decimals: 0 });
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, { min: 0, max: 12, step: 0.5, decimals: 1 });
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, { min: 0, max: 30, step: 1, decimals: 0 });
  bindRangeAndNumber(confidenceRange, confidenceNumber, { min: 50, max: 100, step: 1, decimals: 0 });

  // -----------------
  // COMPUTE FUNCTIONS
  // -----------------
  function classify(ratio, stableThreshold) {
    if (!Number.isFinite(ratio)) return "Underprepared";
    if (ratio >= stableThreshold) return "Stable";
    if (ratio >= 1.0) return "Borderline";
    return "Underprepared";
  }

  function computeCore(inputs) {
    const stableThreshold = 1.2;

    const essentialsBase =
      inputs.housing +
      inputs.utilities +
      inputs.groceries +
      inputs.transport +
      inputs.medical;

    const essentialsRaw = essentialsBase + inputs.commitments;

    const errorFactor = 1 + inputs.errorMarginPct / 100;
    const adjustedEssentials = essentialsRaw * errorFactor;

    const conservativeIncome =
      inputs.income *
      inputs.reliabilityFactor *
      (1 - inputs.variabilityPct / 100);

    const ratio = conservativeIncome / adjustedEssentials;
    const margin = conservativeIncome - adjustedEssentials;

    const targetIncomeAtStable = adjustedEssentials * stableThreshold;
    const incomeIncrease = Math.max(0, targetIncomeAtStable - conservativeIncome);

    const maxEssentialsAtStableAdjusted = conservativeIncome / stableThreshold;
    const essentialsDecreaseAdjusted = Math.max(0, adjustedEssentials - maxEssentialsAtStableAdjusted);

    const confidencePenalty = (100 - inputs.confidencePct) / 100;
    const confidenceFactor = 1 + confidencePenalty * 0.5;
    const bufferTarget = adjustedEssentials * inputs.bufferMonths * confidenceFactor;

    return {
      stableThreshold,
      essentialsBase,
      essentialsRaw,
      errorFactor,
      adjustedEssentials,
      conservativeIncome,
      ratio,
      margin,
      targetIncomeAtStable,
      incomeIncrease,
      essentialsDecreaseAdjusted,
      confidenceFactor,
      bufferTarget
    };
  }

  function leverRanking(core, inputs) {
    const levers = [
      { key: "housing", label: "Housing", amount: inputs.housing },
      { key: "utilities", label: "Utilities", amount: inputs.utilities },
      { key: "groceries", label: "Groceries and essentials", amount: inputs.groceries },
      { key: "transport", label: "Transport", amount: inputs.transport },
      { key: "medical", label: "Insurance and medical", amount: inputs.medical }
    ];

    const essentialsBase = Math.max(0.000001, core.essentialsBase);
    const deltaNeededRaw = core.essentialsDecreaseAdjusted / core.errorFactor;

    levers.sort(function (a, b) {
      return b.amount - a.amount;
    });

    const top = levers.slice(0, 5);

    const html = top.map(function (l) {
      const share = (l.amount / essentialsBase) * 100;
      const required = clamp(deltaNeededRaw, 0, l.amount);
      return (
        '<div class="di-lever-item">' +
          '<div class="di-lever-title">' + l.label + "</div>" +
          '<div class="di-lever-meta">Share of essentials: ' + formatTwoDecimals(share) + "%</div>" +
          '<div class="di-lever-meta">Required change if this lever alone: ' + formatWithCommas(required, 0) + "</div>" +
        "</div>"
      );
    }).join("");

    return { top, deltaNeededRaw, html };
  }

  function combinedOption(leverData, deltaNeededRaw) {
    const top3 = leverData.top.slice(0, 3);
    const total = top3.reduce(function (acc, l) { return acc + l.amount; }, 0);

    if (deltaNeededRaw <= 0 || total <= 0) {
      return "No combined correction is required at the current settings.";
    }

    const parts = top3.map(function (l) {
      const share = l.amount / total;
      const required = clamp(deltaNeededRaw * share, 0, l.amount);
      return l.label + ": " + formatWithCommas(required, 0);
    });

    return "Suggested split across top 3 levers: " + parts.join(" | ");
  }

  function scenario(name, baseInputs, tweaks) {
    const merged = Object.assign({}, baseInputs, tweaks);
    const core = computeCore(merged);
    return {
      name,
      classification: classify(core.ratio, core.stableThreshold),
      incomeIncrease: core.incomeIncrease,
      essentialsDecreaseAdjusted: core.essentialsDecreaseAdjusted
    };
  }

  function sensitivityPanel(baseInputs) {
    const s1 = scenario("Income stress", baseInputs, {
      reliabilityFactor: clamp(baseInputs.reliabilityFactor - 0.05, 0.5, 1.0),
      variabilityPct: clamp(baseInputs.variabilityPct + 5, 0, 40)
    });

    const s2 = scenario("Cost stress", baseInputs, {
      housing: baseInputs.housing * 1.05,
      utilities: baseInputs.utilities * 1.05,
      groceries: baseInputs.groceries * 1.05,
      transport: baseInputs.transport * 1.05,
      medical: baseInputs.medical * 1.05,
      commitments: baseInputs.commitments * 1.10
    });

    const s3 = scenario("Combined moderate stress", baseInputs, {
      income: baseInputs.income * 0.95,
      housing: baseInputs.housing * 1.03,
      groceries: baseInputs.groceries * 1.03,
      commitments: baseInputs.commitments * 1.05
    });

    const scenarios = [s1, s2, s3];

    const html = scenarios.map(function (s) {
      return (
        '<div class="di-scenario">' +
          '<div class="di-scenario-title">' + s.name + "</div>" +
          '<div class="di-scenario-meta">Classification: ' + s.classification + "</div>" +
          '<div class="di-scenario-meta">Income increase gap: ' + formatWithCommas(s.incomeIncrease, 0) + "</div>" +
          '<div class="di-scenario-meta">Essentials decrease gap: ' + formatWithCommas(s.essentialsDecreaseAdjusted, 0) + "</div>" +
        "</div>"
      );
    }).join("");

    return { scenarios, html };
  }

  function actionPlan(core, leverData, sensitivity, inputs) {
    const plan = [];
    const topLever = leverData.top[0];

    if (core.incomeIncrease > 0) {
      plan.push("Close the stable gap by increasing conservative income by " + formatWithCommas(core.incomeIncrease, 0) + " while holding essentials constant.");
    } else {
      plan.push("Maintain stability by protecting conservative income and preventing reliability or variability from worsening.");
    }

    if (core.essentialsDecreaseAdjusted > 0 && topLever) {
      const requiredTop = clamp(leverData.deltaNeededRaw, 0, topLever.amount);
      plan.push("Reduce the largest lever (" + topLever.label + ") by " + formatWithCommas(requiredTop, 0) + " in a single-lever attempt, or use the combined correction option.");
    } else {
      plan.push("No essentials reduction is required to meet the stable threshold at the current conservative baseline.");
    }

    if (inputs.commitments > 0) {
      plan.push("Audit non-negotiable commitments (" + formatWithCommas(inputs.commitments, 0) + ") for renegotiation, refinancing, or cancellation candidates because they raise targets directly.");
    }

    if (inputs.bufferMonths > 0) {
      plan.push("Build a buffer target of " + formatWithCommas(core.bufferTarget, 0) + " based on " + formatWithCommas(inputs.bufferMonths, 1) + " months, adjusted upward for confidence.");
    }

    const worst = sensitivity.scenarios.reduce(function (acc, s) {
      if (!acc) return s;
      return (s.incomeIncrease + s.essentialsDecreaseAdjusted) > (acc.incomeIncrease + s.essentialsDecreaseAdjusted) ? s : acc;
    }, null);

    if (worst) {
      plan.push("Stress test against the worst scenario (" + worst.name + "): income gap " + formatWithCommas(worst.incomeIncrease, 0) + " and essentials gap " + formatWithCommas(worst.essentialsDecreaseAdjusted, 0) + ".");
    }

    if (inputs.errorMarginPct > 0) {
      plan.push("Reduce estimation error. Your error margin (" + formatWithCommas(inputs.errorMarginPct, 0) + "%) inflates essentials and targets mechanically.");
    }

    if (inputs.confidencePct < 100) {
      plan.push("Increase estimation confidence. Lower confidence (" + formatWithCommas(inputs.confidencePct, 0) + "%) increases the buffer requirement.");
    }

    return plan.slice(0, 7);
  }

  // ----------
  // VALIDATION
  // ----------
  function getInputs() {
    return {
      income: clamp(parseLooseNumber(incomeNumber.value), 0, 300000),
      housing: clamp(parseLooseNumber(housingNumber.value), 0, 250000),
      utilities: clamp(parseLooseNumber(utilitiesNumber.value), 0, 80000),
      groceries: clamp(parseLooseNumber(groceriesNumber.value), 0, 120000),
      transport: clamp(parseLooseNumber(transportNumber.value), 0, 120000),
      medical: clamp(parseLooseNumber(medicalNumber.value), 0, 120000),
      reliabilityFactor: clamp(parseLooseNumber(reliabilityNumber.value), 0.5, 1.0),
      variabilityPct: clamp(parseLooseNumber(variabilityNumber.value), 0, 40),
      commitments: clamp(parseLooseNumber(commitmentsNumber.value), 0, 500000),
      bufferMonths: clamp(parseLooseNumber(bufferMonthsNumber.value), 0, 12),
      errorMarginPct: clamp(parseLooseNumber(errorMarginNumber.value), 0, 30),
      confidencePct: clamp(parseLooseNumber(confidenceNumber.value), 50, 100)
    };
  }

  function validate(i) {
    const keys = [
      "income", "housing", "utilities", "groceries", "transport", "medical",
      "reliabilityFactor", "variabilityPct", "commitments",
      "bufferMonths", "errorMarginPct", "confidencePct"
    ];

    for (let k = 0; k < keys.length; k++) {
      if (!Number.isFinite(i[keys[k]])) return "All inputs must be valid numbers.";
    }

    if (i.income < 0) return "Income cannot be negative.";

    if (i.reliabilityFactor < 0.5 || i.reliabilityFactor > 1.0) return "Income reliability must be between 0.50 and 1.00.";
    if (i.variabilityPct < 0 || i.variabilityPct > 40) return "Income variability must be between 0 and 40.";
    if (i.commitments < 0) return "Commitments cannot be negative.";
    if (i.bufferMonths < 0 || i.bufferMonths > 12) return "Target buffer months must be between 0 and 12.";
    if (i.errorMarginPct < 0 || i.errorMarginPct > 30) return "Estimation error margin must be between 0 and 30.";
    if (i.confidencePct < 50 || i.confidencePct > 100) return "Estimation confidence must be between 50 and 100.";

    const essentialsRaw = i.housing + i.utilities + i.groceries + i.transport + i.medical + i.commitments;
    if (essentialsRaw <= 0) return "Total essentials and commitments must be greater than zero.";

    return "";
  }

  // ----------------
  // CALCULATE HANDLER
  // ----------------
  calculateButton.addEventListener("click", function () {
    const inputs = getInputs();
    const error = validate(inputs);

    if (error) {
      result.innerHTML = "<p>" + error + "</p>";
      return;
    }

    const core = computeCore(inputs);
    const classification = classify(core.ratio, core.stableThreshold);

    const levers = leverRanking(core, inputs);
    const combined = combinedOption(levers, levers.deltaNeededRaw);
    const sensitivity = sensitivityPanel(inputs);
    const plan = actionPlan(core, levers, sensitivity, inputs);

    result.innerHTML =
      "<h3>" + classification + "</h3>" +
      "<p>Conservative coverage ratio: <strong>" + formatTwoDecimals(core.ratio) + "</strong>. Monthly margin: <strong>" + formatWithCommas(core.margin, 0) + "</strong>.</p>" +
      "<p>Income increase gap: <strong>" + formatWithCommas(core.incomeIncrease, 0) + "</strong>. Essentials decrease gap: <strong>" + formatWithCommas(core.essentialsDecreaseAdjusted, 0) + "</strong>.</p>";

    setText(proHeadline, classification + " (stable threshold " + formatTwoDecimals(core.stableThreshold) + ")");
    setText(proEssentials, formatWithCommas(core.adjustedEssentials, 0));
    setText(proConservativeIncome, formatWithCommas(core.conservativeIncome, 0));
    setText(proRatio, formatTwoDecimals(core.ratio));
    setText(proMargin, formatWithCommas(core.margin, 0));

    setHTML(proTargets,
      "<div>Required monthly income increase (essentials fixed): <strong>" + formatWithCommas(core.incomeIncrease, 0) + "</strong></div>" +
      "<div>Required monthly essentials decrease (income fixed): <strong>" + formatWithCommas(core.essentialsDecreaseAdjusted, 0) + "</strong></div>"
    );

    setHTML(proBuffer,
      "<div>Buffer months: <strong>" + formatWithCommas(inputs.bufferMonths, 1) + "</strong></div>" +
      "<div>Confidence factor: <strong>" + formatTwoDecimals(core.confidenceFactor) + "</strong></div>" +
      "<div>Buffer target: <strong>" + formatWithCommas(core.bufferTarget, 0) + "</strong></div>"
    );

    setHTML(proLevers, levers.html);
    setHTML(proSensitivity, sensitivity.html);
    setText(proCombined, combined);

    proPlan.innerHTML = "";
    plan.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      proPlan.appendChild(li);
    });
  });

  // ---------------------
  // WHATSAPP SHARE BUTTON
  // ---------------------
  shareWhatsAppButton.addEventListener("click", function () {
    const inputs = getInputs();
    const core = computeCore(inputs);
    const classification = classify(core.ratio, core.stableThreshold);

    const text =
      "SnapCalc pro result: " +
      classification +
      ". Coverage ratio: " +
      formatTwoDecimals(core.ratio) +
      ". Income gap: " +
      formatWithCommas(core.incomeIncrease, 0) +
      ". Essentials gap: " +
      formatWithCommas(core.essentialsDecreaseAdjusted, 0) +
      ". " +
      window.location.href;

    window.location.href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
  });
});
