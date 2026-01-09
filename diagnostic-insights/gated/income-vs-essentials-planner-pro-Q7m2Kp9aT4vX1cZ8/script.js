// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Free-core (6)
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

  // Paid-only (6)
  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");

  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");

  const driftRiskNumber = document.getElementById("driftRiskNumber");
  const driftRiskRange = document.getElementById("driftRiskRange");

  const feasibleCutNumber = document.getElementById("feasibleCutNumber");
  const feasibleCutRange = document.getElementById("feasibleCutRange");

  // ------------------------------------------------------------
  // 2) HELPERS (parse, clamp, formatting, result setters)
  // ------------------------------------------------------------
  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    return Math.min(max, Math.max(min, n));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatRatioTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  }

  function formatPercentOneDecimal(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(1) + "%";
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
  // 3) RANGE + NUMBER BINDING (bi-directional sync, clamp on blur/enter)
  // ------------------------------------------------------------
  function bindRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    const min = parseLooseNumber(rangeEl.min);
    const max = parseLooseNumber(rangeEl.max);
    const step = parseLooseNumber(rangeEl.step) || 1;

    function snapToStep(value) {
      if (!Number.isFinite(value)) return NaN;
      if (!Number.isFinite(step) || step <= 0) return value;
      return Math.round(value / step) * step;
    }

    function commitValue(n) {
      const snapped = snapToStep(n);
      const clamped = clamp(snapped, min, max);
      if (!Number.isFinite(clamped)) return false;
      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
      numberEl.dataset.lastValid = String(clamped);
      return true;
    }

    commitValue(parseLooseNumber(rangeEl.value));

    rangeEl.addEventListener("input", function () {
      commitValue(parseLooseNumber(rangeEl.value));
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      const n = parseLooseNumber(numberEl.value);
      if (Number.isFinite(n)) numberEl.value = formatWithCommas(n);
      clearResult();
    });

    function handleCommit() {
      const n = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(n)) {
        if (numberEl.dataset.lastValid !== undefined) {
          commitValue(parseLooseNumber(numberEl.dataset.lastValid));
        } else {
          commitValue(parseLooseNumber(rangeEl.value));
        }
        return;
      }
      const ok = commitValue(n);
      if (!ok && numberEl.dataset.lastValid !== undefined) {
        commitValue(parseLooseNumber(numberEl.dataset.lastValid));
      }
    }

    numberEl.addEventListener("blur", handleCommit);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCommit();
        numberEl.blur();
      }
    });
  }

  // Bind all 12 inputs
  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(groceriesRange, groceriesNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtRange, debtNumber);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber);
  bindRangeAndNumber(driftRiskRange, driftRiskNumber);
  bindRangeAndNumber(feasibleCutRange, feasibleCutNumber);

  // ------------------------------------------------------------
  // 4) VALIDATION HELPERS
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePercentRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function validateIntegerRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) CORE PAID ENGINE (cannot be approximated from free page)
  // ------------------------------------------------------------
  const STABLE_RATIO = 1.25;
  const BUFFER_BUILD_MONTHS = 12;

  function computeEngine(inputs) {
    const income = inputs.income;
    const baseEssentials = inputs.baseEssentials;
    const commitments = inputs.commitments;

    const reliability = inputs.reliability; // 0.40..1.00
    const errorFactor = inputs.errorFactor; // 1..1.30
    const driftFactor = inputs.driftFactor; // 1..1.20

    // Conservative baseline mechanics
    const conservativeIncome = income * reliability;
    const driftedEssentials = baseEssentials * driftFactor;
    const totalOutflow = driftedEssentials + commitments;

    const ratio = conservativeIncome / totalOutflow;
    const margin = conservativeIncome - totalOutflow;

    // Buffer target (confidence-adjusted): build to target buffer months within 12 months
    const targetBufferAmount = totalOutflow * inputs.bufferMonths * errorFactor;
    const requiredMonthlyBufferBuild = inputs.bufferMonths > 0 ? (targetBufferAmount / BUFFER_BUILD_MONTHS) : 0;

    // Stability target: must clear stable ratio AND still fund buffer build rate
    const requiredConservativeIncomeForStable = (STABLE_RATIO * totalOutflow) + requiredMonthlyBufferBuild;

    const gapIncomeIncreaseConservative = Math.max(0, requiredConservativeIncomeForStable - conservativeIncome);

    // Convert conservative income gap back to nominal income increase (reliability-adjusted)
    const incomeIncreaseNominal = reliability > 0 ? (gapIncomeIncreaseConservative / reliability) : NaN;

    // If income fixed, compute allowed outflow such that: conservativeIncome >= STABLE_RATIO*outflow + bufferBuild
    const allowedOutflow = Math.max(0, (conservativeIncome - requiredMonthlyBufferBuild) / STABLE_RATIO);
    const requiredOutflowDecrease = Math.max(0, totalOutflow - allowedOutflow);

    // Classification
    let classification = "Borderline";
    if (ratio < 1.0) classification = "Underprepared";
    else if (ratio >= STABLE_RATIO && margin >= requiredMonthlyBufferBuild) classification = "Stable";

    return {
      conservativeIncome,
      driftedEssentials,
      totalOutflow,
      ratio,
      margin,
      requiredMonthlyBufferBuild,
      requiredConservativeIncomeForStable,
      gapIncomeIncreaseConservative,
      incomeIncreaseNominal,
      allowedOutflow,
      requiredOutflowDecrease,
      classification
    };
  }

  function scenarioPack(baseInputs) {
    // Minimum 3 stress scenarios, each recalculates classification and targets.
    const scenarios = [];

    // 1) Modest income drop or worsening reliability
    scenarios.push({
      name: "Income reliability worsens (-10 points)",
      mutate: function (x) {
        const newRel = clamp(x.reliability * 100 - 10, 40, 100) / 100;
        x.reliability = newRel;
        return x;
      }
    });

    // 2) Essentials increase
    scenarios.push({
      name: "Essentials drift rises (+10 points)",
      mutate: function (x) {
        const newDrift = clamp(x.driftRiskPct + 10, 0, 20);
        x.driftRiskPct = newDrift;
        x.driftFactor = 1 + (newDrift / 100);
        return x;
      }
    });

    // 3) Combined moderate stress
    scenarios.push({
      name: "Combined stress (reliability -7, drift +7, commitments +5%)",
      mutate: function (x) {
        const newRel = clamp(x.reliability * 100 - 7, 40, 100) / 100;
        const newDrift = clamp(x.driftRiskPct + 7, 0, 20);
        x.reliability = newRel;
        x.driftRiskPct = newDrift;
        x.driftFactor = 1 + (newDrift / 100);
        x.commitments = x.commitments * 1.05;
        return x;
      }
    });

    const out = [];
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      const cloned = JSON.parse(JSON.stringify(baseInputs));
      const mutated = s.mutate(cloned);
      const engine = computeEngine(mutated);
      out.push({
        name: s.name,
        classification: engine.classification,
        incomeIncreaseNominal: engine.incomeIncreaseNominal,
        outflowDecrease: engine.requiredOutflowDecrease
      });
    }
    return out;
  }

  function buildLevers(baseInputs, engine, feasibilityPct) {
    const levers = [
      { key: "Housing", amount: baseInputs.housing },
      { key: "Utilities", amount: baseInputs.utilities },
      { key: "Groceries", amount: baseInputs.groceries },
      { key: "Transport", amount: baseInputs.transport },
      { key: "Debt minimums", amount: baseInputs.debt },
      { key: "Fixed commitments", amount: baseInputs.commitments }
    ];

    const totalOutflow = engine.totalOutflow;
    const requiredOutflowDecrease = engine.requiredOutflowDecrease;

    const ranked = levers
      .map(function (l) {
        const share = totalOutflow > 0 ? (l.amount / totalOutflow) : 0;
        const requiredSingle = clamp(requiredOutflowDecrease, 0, l.amount); // spec clamp
        const feasibleCap = clamp(l.amount * (feasibilityPct / 100), 0, l.amount);
        return {
          key: l.key,
          amount: l.amount,
          share: share,
          requiredSingle: requiredSingle,
          feasibleCap: feasibleCap
        };
      })
      .sort(function (a, b) {
        return b.share - a.share;
      })
      .slice(0, 5);

    return ranked;
  }

  function combinedSplitTop3(rankedLevers, requiredOutflowDecrease) {
    const top3 = rankedLevers.slice(0, 3);
    const denom = top3.reduce(function (sum, l) { return sum + l.amount; }, 0);

    const rows = top3.map(function (l) {
      const portion = denom > 0 ? (l.amount / denom) : 0;
      const raw = requiredOutflowDecrease * portion;
      const clamped = clamp(raw, 0, l.amount);
      return { key: l.key, amount: l.amount, split: clamped };
    });

    return rows;
  }

  function actionPlan(engine, rankedLevers, combinedRows, scenarios, baseInputs) {
    const actions = [];
    const needIncome = engine.incomeIncreaseNominal > 0.5 && Number.isFinite(engine.incomeIncreaseNominal);
    const needCut = engine.requiredOutflowDecrease > 0.5;

    // 1) Primary target
    if (needIncome && needCut) {
      actions.push("Primary target: either increase monthly income by " + formatWithCommas(engine.incomeIncreaseNominal) + " or reduce baseline outflow by " + formatWithCommas(engine.requiredOutflowDecrease) + " to reach Stable with buffer funding.");
    } else if (needIncome) {
      actions.push("Primary target: increase monthly income by " + formatWithCommas(engine.incomeIncreaseNominal) + " to reach Stable with buffer funding (given reliability and drift).");
    } else if (needCut) {
      actions.push("Primary target: reduce baseline outflow by " + formatWithCommas(engine.requiredOutflowDecrease) + " to reach Stable with buffer funding.");
    } else {
      actions.push("Primary target: you are meeting Stable with the current buffer funding rate. Keep the baseline consistent and re-check when commitments change.");
    }

    // 2) Buffer build action (if any)
    if (engine.requiredMonthlyBufferBuild > 0.5) {
      actions.push("Buffer target: allocate " + formatWithCommas(engine.requiredMonthlyBufferBuild) + " per month for " + baseInputs.bufferMonths + " months of buffer (confidence-adjusted).");
    }

    // 3-5) Combined split actions (computed, lever-mapped)
    if (needCut && combinedRows.length) {
      for (let i = 0; i < combinedRows.length && actions.length < 7; i++) {
        const r = combinedRows[i];
        if (r.split > 0.5) actions.push("Combined correction: reduce " + r.key + " by " + formatWithCommas(r.split) + " (proportional split).");
      }
    }

    // 6) Scenario-driven risk action: if any scenario flips to Underprepared
    const worst = scenarios.find(function (s) { return s.classification === "Underprepared"; });
    if (worst && actions.length < 7) {
      actions.push("Stress risk: under '" + worst.name + "' you fall to Underprepared. Reduce drift/commitments or increase reliability to avoid fragile months.");
    }

    // 7) Biggest lever single-lever ceiling note (computed)
    if (rankedLevers.length && actions.length < 7) {
      const top = rankedLevers[0];
      if (engine.requiredOutflowDecrease > 0.5) {
        const single = clamp(engine.requiredOutflowDecrease, 0, top.amount);
        actions.push("Single-lever check: if only '" + top.key + "' changes, it would require " + formatWithCommas(single) + " reduction (clamped to the lever size).");
      }
    }

    return actions.slice(0, 7);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Existence guard
      if (
        !incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !debtNumber ||
        !reliabilityNumber || !commitmentsNumber || !bufferMonthsNumber || !errorMarginNumber || !driftRiskNumber || !feasibleCutNumber
      ) {
        return;
      }

      // Parse inputs
      const income = parseLooseNumber(incomeNumber.value);
      const housing = parseLooseNumber(housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber.value);
      const groceries = parseLooseNumber(groceriesNumber.value);
      const transport = parseLooseNumber(transportNumber.value);
      const debt = parseLooseNumber(debtNumber.value);

      const reliabilityPct = parseLooseNumber(reliabilityNumber.value);
      const commitments = parseLooseNumber(commitmentsNumber.value);
      const bufferMonths = parseLooseNumber(bufferMonthsNumber.value);
      const errorMarginPct = parseLooseNumber(errorMarginNumber.value);
      const driftRiskPct = parseLooseNumber(driftRiskNumber.value);
      const feasibleCutPct = parseLooseNumber(feasibleCutNumber.value);

      // Validation (free-core)
      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "debt minimums")) return;

      const baseEssentials = housing + utilities + groceries + transport + debt;
      if (!Number.isFinite(baseEssentials) || baseEssentials <= 0) {
        setResultError("Total essentials must be greater than 0.");
        return;
      }

      // Validation (paid-only categories required)
      if (!validatePercentRange(reliabilityPct, "income reliability", 40, 100)) return;
      if (!validateNonNegative(commitments, "fixed commitments")) return;
      if (!validateIntegerRange(bufferMonths, "target buffer months", 0, 12)) return;
      if (!validatePercentRange(errorMarginPct, "estimation error margin", 0, 30)) return;
      if (!validatePercentRange(driftRiskPct, "essentials drift risk", 0, 20)) return;
      if (!validatePercentRange(feasibleCutPct, "max feasible cut per lever", 0, 60)) return;

      const baseInputs = {
        income: income,
        housing: housing,
        utilities: utilities,
        groceries: groceries,
        transport: transport,
        debt: debt,
        baseEssentials: baseEssentials,

        reliability: reliabilityPct / 100,
        commitments: commitments,
        bufferMonths: Math.round(bufferMonths),
        errorFactor: 1 + (errorMarginPct / 100),
        driftFactor: 1 + (driftRiskPct / 100),
        driftRiskPct: driftRiskPct
      };

      const engine = computeEngine(baseInputs);

      if (!Number.isFinite(engine.ratio) || engine.totalOutflow <= 0 || !Number.isFinite(engine.totalOutflow)) {
        setResultError("Unable to compute a valid result from these inputs.");
        return;
      }

      const rankedLevers = buildLevers(baseInputs, engine, feasibleCutPct);
      const combinedRows = combinedSplitTop3(rankedLevers, engine.requiredOutflowDecrease);
      const scenarios = scenarioPack(baseInputs);
      const plan = actionPlan(engine, rankedLevers, combinedRows, scenarios, baseInputs);

      // Paid results block (A-H)
      const ratioText = formatRatioTwoDecimals(engine.ratio) + "x";
      const marginText = formatWithCommas(engine.margin);
      const outflowText = formatWithCommas(engine.totalOutflow);
      const essentialsText = formatWithCommas(engine.driftedEssentials);

      const incomeIncreaseText = Number.isFinite(engine.incomeIncreaseNominal) ? formatWithCommas(engine.incomeIncreaseNominal) : "";
      const outflowDecreaseText = formatWithCommas(engine.requiredOutflowDecrease);

      const bufferBuildText = formatWithCommas(engine.requiredMonthlyBufferBuild);

      // Lever table rows
      const leverRowsHtml = rankedLevers.map(function (l) {
        const sharePct = formatPercentOneDecimal(l.share * 100);
        const requiredSingle = formatWithCommas(l.requiredSingle);
        const feasibleCap = formatWithCommas(l.feasibleCap);
        return (
          "<tr>" +
            "<td>" + l.key + "</td>" +
            "<td>" + sharePct + "</td>" +
            "<td>" + requiredSingle + "</td>" +
            "<td>" + feasibleCap + "</td>" +
          "</tr>"
        );
      }).join("");

      // Sensitivity rows
      const sensitivityRowsHtml = scenarios.map(function (s) {
        const inc = Number.isFinite(s.incomeIncreaseNominal) ? formatWithCommas(s.incomeIncreaseNominal) : "";
        const dec = formatWithCommas(s.outflowDecrease);
        return (
          "<tr>" +
            "<td>" + s.name + "</td>" +
            "<td>" + s.classification + "</td>" +
            "<td>" + inc + "</td>" +
            "<td>" + dec + "</td>" +
          "</tr>"
        );
      }).join("");

      // Combined correction rows
      const combinedRowsHtml = combinedRows.map(function (r) {
        return (
          "<tr>" +
            "<td>" + r.key + "</td>" +
            "<td>" + formatWithCommas(r.split) + "</td>" +
          "</tr>"
        );
      }).join("");

      // Next actions (max 5) must reference computed items
      const nextActions = [];
      if (engine.requiredOutflowDecrease > 0.5) {
        nextActions.push("Use the combined correction split across the top 3 levers to reduce baseline outflow by " + outflowDecreaseText + ".");
      } else {
        nextActions.push("Maintain Stable: keep total baseline outflow near " + outflowText + " while preserving the buffer funding rate.");
      }

      if (Number.isFinite(engine.incomeIncreaseNominal) && engine.incomeIncreaseNominal > 0.5) {
        nextActions.push("Income path: increase monthly income by " + incomeIncreaseText + " (given your reliability input) to clear Stable plus buffer funding.");
      }

      if (engine.requiredMonthlyBufferBuild > 0.5) {
        nextActions.push("Buffer funding: allocate " + bufferBuildText + " per month to build the target buffer.");
      }

      if (rankedLevers.length) {
        nextActions.push("Largest lever: '" + rankedLevers[0].key + "' drives the biggest change leverage in this model.");
      }

      const worstScenario = scenarios.find(function (x) { return x.classification !== "Stable"; });
      if (worstScenario) {
        nextActions.push("Stress check: under '" + worstScenario.name + "', targets update. Use the sensitivity panel to plan for that case.");
      }

      const nextActionsHtml = nextActions.slice(0, 5).map(function (a) { return "<li>" + a + "</li>"; }).join("");

      const planHtml = plan.map(function (a) { return "<li>" + a + "</li>"; }).join("");

      const resultHtml =
        '<div class="paid-results">' +

          // A) Headline
          '<p class="paid-headline">Classification: ' + engine.classification + '</p>' +
          '<p class="paid-subline">Conservative baseline uses reliability-adjusted income and drift-adjusted outflow.</p>' +

          // B) Core numbers
          '<div class="paid-section">' +
            '<div class="paid-section-title">Core numbers</div>' +
            '<div class="paid-kv">' +
              '<div class="kv-item"><p class="kv-label">Total essentials (drift-adjusted)</p><p class="kv-value">' + essentialsText + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Fixed commitments</p><p class="kv-value">' + formatWithCommas(baseInputs.commitments) + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Total baseline outflow</p><p class="kv-value">' + outflowText + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Conservative income</p><p class="kv-value">' + formatWithCommas(engine.conservativeIncome) + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Coverage ratio</p><p class="kv-value">' + ratioText + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Monthly margin</p><p class="kv-value">' + marginText + '</p></div>' +
            '</div>' +
            '<p class="paid-note">Buffer funding rate (per month): ' + (engine.requiredMonthlyBufferBuild > 0 ? bufferBuildText : "0") + '</p>' +
          '</div>' +

          // C) Stability target
          '<div class="paid-section">' +
            '<div class="paid-section-title">Stability target</div>' +
            '<div class="paid-kv">' +
              '<div class="kv-item"><p class="kv-label">Stable threshold ratio</p><p class="kv-value">' + STABLE_RATIO.toFixed(2) + 'x</p></div>' +
              '<div class="kv-item"><p class="kv-label">Gap to Stable via income increase</p><p class="kv-value">' + (incomeIncreaseText ? incomeIncreaseText : "0") + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Gap to Stable via outflow decrease</p><p class="kv-value">' + outflowDecreaseText + '</p></div>' +
              '<div class="kv-item"><p class="kv-label">Allowed outflow at Stable (given buffer)</p><p class="kv-value">' + formatWithCommas(engine.allowedOutflow) + '</p></div>' +
            '</div>' +
          '</div>' +

          // D) Lever ranking
          '<div class="paid-section">' +
            '<div class="paid-section-title">Lever impact ranking (top 5)</div>' +
            '<table class="paid-table">' +
              '<thead><tr><th>Lever</th><th>Share of outflow</th><th>Required change if only this lever changes</th><th>Feasible cap (your input)</th></tr></thead>' +
              '<tbody>' + leverRowsHtml + '</tbody>' +
            '</table>' +
            '<p class="paid-note">Required change is clamped to the lever size. Feasible cap is your stated ceiling used for the ranked plan.</p>' +
          '</div>' +

          // E) Next actions (max 5)
          '<div class="paid-section">' +
            '<div class="paid-section-title">Next actions (computed)</div>' +
            '<ul class="paid-bullets">' + nextActionsHtml + '</ul>' +
          '</div>' +

          // F) Sensitivity panel
          '<div class="paid-section">' +
            '<div class="paid-section-title">Sensitivity panel (stress scenarios)</div>' +
            '<table class="paid-table">' +
              '<thead><tr><th>Scenario</th><th>Classification</th><th>Income increase to Stable</th><th>Outflow decrease to Stable</th></tr></thead>' +
              '<tbody>' + sensitivityRowsHtml + '</tbody>' +
            '</table>' +
          '</div>' +

          // G) Combined correction option
          '<div class="paid-section">' +
            '<div class="paid-section-title">Combined correction option (top 3 levers)</div>' +
            '<table class="paid-table">' +
              '<thead><tr><th>Lever</th><th>Suggested reduction</th></tr></thead>' +
              '<tbody>' + combinedRowsHtml + '</tbody>' +
            '</table>' +
          '</div>' +

          // H) Ranked action plan (max 7)
          '<div class="paid-section">' +
            '<div class="paid-section-title">Ranked action plan (computed)</div>' +
            '<ul class="paid-bullets">' + planHtml + '</ul>' +
          '</div>' +

        '</div>';

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Planner Pro - check this tool: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
