/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Paid tool inputs
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

  // Slot 8 result targets by ID
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

  // ------------------------------------------------------------
  // 2) HELPERS (SELF-CONTAINED)
  // ------------------------------------------------------------
  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const str = String(value).trim();
    if (!str) return NaN;
    const cleaned = str.replace(/,/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    return Math.min(max, Math.max(min, n));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return raw === "" ? "" : raw.replace(/[^\d.]/g, "");
    if (Math.abs(n) < 1000) return String(n).replace(/\.0+$/, "");
    const parts = String(n).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const def = Number.isFinite(defaultValue) ? defaultValue : min;
    rangeEl.value = String(def);
    numberEl.value = formatInputWithCommas(def);

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      numberEl.value = formatInputWithCommas(v);
      clearResult();
    });

    function commitNumberValue() {
      const raw = numberEl.value;
      const parsed = parseLooseNumber(raw);

      if (!Number.isFinite(parsed)) {
        numberEl.value = formatInputWithCommas(parseLooseNumber(rangeEl.value));
        return;
      }

      const clamped = clamp(parsed, min, max);
      if (!Number.isFinite(clamped)) return;

      const stepNum = Number(step);
      let snapped = clamped;
      if (Number.isFinite(stepNum) && stepNum > 0) {
        snapped = Math.round(clamped / stepNum) * stepNum;
        snapped = clamp(snapped, min, max);
      }

      rangeEl.value = String(snapped);
      numberEl.value = formatInputWithCommas(snapped);
      clearResult();
    }

    numberEl.addEventListener("blur", commitNumberValue);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberValue();
      }
    });

    numberEl.addEventListener("input", function () {
      numberEl.value = formatInputWithCommas(numberEl.value);
    });
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function setError(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.innerHTML = html;
  }

  function setSuccess(html) {
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

  function safeText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function safeHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  function clearSlot8() {
    safeText(proHeadline, "Run the analysis to generate your results.");
    safeText(proEssentials, "");
    safeText(proConservativeIncome, "");
    safeText(proRatio, "");
    safeText(proMargin, "");
    safeHtml(proTargets, "");
    safeHtml(proBuffer, "");
    safeHtml(proLevers, "");
    safeHtml(proSensitivity, "");
    safeHtml(proCombined, "");
    if (proPlan) proPlan.innerHTML = "";
  }

  // ------------------------------------------------------------
  // 4) INPUT BINDING INIT
  // ------------------------------------------------------------
  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 100, 40000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 250000, 100, 12000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 80000, 100, 2000);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 120000, 100, 6000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 120000, 100, 4000);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 120000, 100, 2500);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.5, 1.0, 0.01, 0.9);
  bindRangeAndNumber(variabilityRange, variabilityNumber, 0, 40, 1, 10);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 500000, 1000, 0);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12, 0.5, 2);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 30, 1, 5);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 50, 100, 1, 80);

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(groceriesNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(medicalNumber);
  attachLiveFormatting(commitmentsNumber);

  attachLiveFormatting(variabilityNumber);
  attachLiveFormatting(errorMarginNumber);
  attachLiveFormatting(confidenceNumber);
  attachLiveFormatting(bufferMonthsNumber);
  attachLiveFormatting(reliabilityNumber);

  clearSlot8();

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS
  // ------------------------------------------------------------
  function validateNumber(n) {
    return Number.isFinite(n);
  }

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
      inputs.medical +
      inputs.commitments;

    const adjustedEssentials = essentialsBase * (1 + inputs.errorMarginPct / 100);

    const conservativeIncome =
      inputs.income *
      inputs.reliability *
      (1 - inputs.variabilityPct / 100);

    const ratio = adjustedEssentials > 0 ? conservativeIncome / adjustedEssentials : NaN;
    const margin = conservativeIncome - adjustedEssentials;

    const incomeIncrease = Math.max(0, adjustedEssentials * stableThreshold - conservativeIncome);
    const essentialsTarget = conservativeIncome / stableThreshold;
    const essentialsDecrease = Math.max(0, adjustedEssentials - essentialsTarget);

    const confidencePenalty = (100 - inputs.confidencePct) / 100;
    const bufferUplift = 1 + confidencePenalty * 0.5 + (inputs.variabilityPct / 100) * 0.25;
    const bufferTarget = adjustedEssentials * inputs.bufferMonths * bufferUplift;

    return {
      stableThreshold,
      essentialsBase,
      adjustedEssentials,
      conservativeIncome,
      ratio,
      margin,
      incomeIncrease,
      essentialsDecrease,
      bufferTarget
    };
  }

  function buildLevers(inputs, essentialsBase, errorMarginPct, conservativeIncome, stableThreshold) {
    const levers = [
      { key: "housing", label: "Housing", amount: inputs.housing },
      { key: "utilities", label: "Utilities", amount: inputs.utilities },
      { key: "groceries", label: "Groceries and essentials", amount: inputs.groceries },
      { key: "transport", label: "Transport", amount: inputs.transport },
      { key: "medical", label: "Insurance and medical", amount: inputs.medical },
      { key: "commitments", label: "Non-negotiable commitments", amount: inputs.commitments }
    ].filter(function (l) { return Number.isFinite(l.amount) && l.amount >= 0; });

    const deltaAdjustedNeeded = Math.max(0, (essentialsBase * (1 + errorMarginPct / 100)) - (conservativeIncome / stableThreshold));
    const deltaBaseNeeded = deltaAdjustedNeeded / (1 + errorMarginPct / 100);

    levers.forEach(function (l) {
      l.share = essentialsBase > 0 ? l.amount / essentialsBase : 0;
      l.requiredChange = clamp(deltaBaseNeeded, 0, l.amount);
    });

    levers.sort(function (a, b) {
      return b.amount - a.amount;
    });

    const top5 = levers.slice(0, 5);

    const top3 = levers.slice(0, 3);
    const top3Total = top3.reduce(function (sum, l) { return sum + l.amount; }, 0);

    const combined = top3.map(function (l) {
      const frac = top3Total > 0 ? l.amount / top3Total : 0;
      const change = clamp(deltaBaseNeeded * frac, 0, l.amount);
      return { label: l.label, change: change };
    });

    return { top5, combined, deltaBaseNeeded };
  }

  function scenarioCompute(baseInputs, scenario) {
    const i = Object.assign({}, baseInputs);

    if (scenario === "income") {
      i.income = i.income * 0.9;
      i.reliability = clamp(i.reliability - 0.05, 0.5, 1.0);
    } else if (scenario === "costs") {
      i.housing = i.housing * 1.1;
      i.utilities = i.utilities * 1.1;
      i.groceries = i.groceries * 1.1;
      i.transport = i.transport * 1.1;
      i.medical = i.medical * 1.1;
      i.commitments = i.commitments * 1.1;
    } else if (scenario === "combined") {
      i.income = i.income * 0.93;
      i.housing = i.housing * 1.07;
      i.utilities = i.utilities * 1.07;
      i.groceries = i.groceries * 1.07;
      i.transport = i.transport * 1.07;
      i.medical = i.medical * 1.07;
      i.commitments = i.commitments * 1.07;
      i.reliability = clamp(i.reliability - 0.03, 0.5, 1.0);
    }

    const core = computeCore(i);
    const cls = classify(core.ratio, core.stableThreshold);

    return {
      name:
        scenario === "income"
          ? "Scenario 1: Income stress"
          : scenario === "costs"
          ? "Scenario 2: Cost stress"
          : "Scenario 3: Combined moderate stress",
      classification: cls,
      incomeIncrease: core.incomeIncrease,
      essentialsDecrease: core.essentialsDecrease,
      ratio: core.ratio
    };
  }

  function buildActionPlan(core, levers, classification) {
    const plan = [];

    if (classification !== "Stable") {
      if (core.incomeIncrease > 0) {
        plan.push("Income path: increase monthly income by " + formatWithCommas(core.incomeIncrease) + " to reach the stable threshold.");
      }
      if (core.essentialsDecrease > 0) {
        plan.push("Essentials path: reduce adjusted essentials by " + formatWithCommas(core.essentialsDecrease) + " to reach the stable threshold.");
      }
    } else {
      plan.push("You are stable at the current assumptions. Protect margin and build buffer before adding new commitments.");
    }

    const top = levers.top5.slice(0, 3);
    top.forEach(function (l, idx) {
      if (l.requiredChange > 0) {
        plan.push("Lever " + (idx + 1) + ": reduce " + l.label + " by " + formatWithCommas(l.requiredChange) + " in a single-lever scenario.");
      } else {
        plan.push("Lever " + (idx + 1) + ": keep " + l.label + " controlled because it is a top driver.");
      }
    });

    if (core.bufferTarget > 0) {
      plan.push("Buffer target: build a buffer of " + formatWithCommas(core.bufferTarget) + " based on your buffer months, variability, and confidence inputs.");
    }

    plan.push("Sensitivity: validate the three scenarios and adjust your chosen path (income increase vs essentials decrease) to withstand stress.");

    return plan.slice(0, 7);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const inputs = {
        income: parseLooseNumber(incomeNumber ? incomeNumber.value : ""),
        housing: parseLooseNumber(housingNumber ? housingNumber.value : ""),
        utilities: parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : ""),
        groceries: parseLooseNumber(groceriesNumber ? groceriesNumber.value : ""),
        transport: parseLooseNumber(transportNumber ? transportNumber.value : ""),
        medical: parseLooseNumber(medicalNumber ? medicalNumber.value : ""),
        commitments: parseLooseNumber(commitmentsNumber ? commitmentsNumber.value : ""),
        reliability: parseLooseNumber(reliabilityNumber ? reliabilityNumber.value : ""),
        variabilityPct: parseLooseNumber(variabilityNumber ? variabilityNumber.value : ""),
        bufferMonths: parseLooseNumber(bufferMonthsNumber ? bufferMonthsNumber.value : ""),
        errorMarginPct: parseLooseNumber(errorMarginNumber ? errorMarginNumber.value : ""),
        confidencePct: parseLooseNumber(confidenceNumber ? confidenceNumber.value : "")
      };

      const required = [
        inputs.income,
        inputs.housing,
        inputs.utilities,
        inputs.groceries,
        inputs.transport,
        inputs.medical,
        inputs.commitments,
        inputs.reliability,
        inputs.variabilityPct,
        inputs.bufferMonths,
        inputs.errorMarginPct,
        inputs.confidencePct
      ];

      const allValid = required.every(function (n) { return validateNumber(n); });

      if (!allValid) {
        setError("Enter valid numbers for all inputs.");
        return;
      }

      if (inputs.income < 0 || inputs.housing < 0 || inputs.utilities < 0 || inputs.groceries < 0 || inputs.transport < 0 || inputs.medical < 0 || inputs.commitments < 0) {
        setError("Negative values are not allowed.");
        return;
      }

      if (inputs.reliability < 0.5 || inputs.reliability > 1.0) {
        setError("Income reliability must be between 0.50 and 1.00.");
        return;
      }

      if (inputs.variabilityPct < 0 || inputs.variabilityPct > 40) {
        setError("Income variability must be between 0 and 40 percent.");
        return;
      }

      if (inputs.bufferMonths < 0 || inputs.bufferMonths > 12) {
        setError("Target buffer months must be between 0 and 12.");
        return;
      }

      if (inputs.errorMarginPct < 0 || inputs.errorMarginPct > 30) {
        setError("Estimation error margin must be between 0 and 30 percent.");
        return;
      }

      if (inputs.confidencePct < 50 || inputs.confidencePct > 100) {
        setError("Estimation confidence must be between 50 and 100 percent.");
        return;
      }

      const core = computeCore(inputs);

      if (!Number.isFinite(core.adjustedEssentials) || core.adjustedEssentials <= 0) {
        setError("Adjusted essentials must be greater than zero.");
        return;
      }

      if (!Number.isFinite(core.conservativeIncome) || core.conservativeIncome < 0) {
        setError("Conservative income must be zero or greater.");
        return;
      }

      const classification = classify(core.ratio, core.stableThreshold);
      const leverData = buildLevers(inputs, core.essentialsBase, inputs.errorMarginPct, core.conservativeIncome, core.stableThreshold);

      const scenarios = [
        scenarioCompute(inputs, "income"),
        scenarioCompute(inputs, "costs"),
        scenarioCompute(inputs, "combined")
      ];

      const plan = buildActionPlan(core, leverData, classification);

      setSuccess(
        "<strong>" + classification + "</strong><br>" +
        "Coverage ratio: " + formatTwoDecimals(core.ratio) + "<br>" +
        "Monthly margin: " + formatWithCommas(core.margin)
      );

      safeText(proHeadline, classification + " based on your conservative income and adjusted essentials.");
      safeText(proEssentials, formatWithCommas(core.adjustedEssentials));
      safeText(proConservativeIncome, formatWithCommas(core.conservativeIncome));
      safeText(proRatio, formatTwoDecimals(core.ratio));
      safeText(proMargin, formatWithCommas(core.margin));

      safeHtml(
        proTargets,
        "<div>Stable threshold ratio: <strong>" + formatTwoDecimals(core.stableThreshold) + "</strong></div>" +
        "<div>Income increase needed (essentials fixed): <strong>" + formatWithCommas(core.incomeIncrease) + "</strong></div>" +
        "<div>Essentials decrease needed (income fixed): <strong>" + formatWithCommas(core.essentialsDecrease) + "</strong></div>"
      );

      safeHtml(
        proBuffer,
        "<div>Target buffer months: <strong>" + formatTwoDecimals(inputs.bufferMonths) + "</strong></div>" +
        "<div>Buffer target (confidence and variability adjusted): <strong>" + formatWithCommas(core.bufferTarget) + "</strong></div>"
      );

      const leverHtml = leverData.top5.map(function (l) {
        const sharePct = l.share * 100;
        return (
          '<div class="di-lever">' +
            '<div class="di-lever-top">' +
              '<span>' + l.label + '</span>' +
              '<span>' + formatTwoDecimals(sharePct) + '%</span>' +
            '</div>' +
            '<div class="di-lever-sub">' +
              'Required change (single-lever): <strong>' + formatWithCommas(l.requiredChange) + '</strong>' +
            '</div>' +
          '</div>'
        );
      }).join("");

      safeHtml(proLevers, leverHtml);

      const sensHtml = scenarios.map(function (s) {
        return (
          '<div class="di-scenario">' +
            '<div class="di-scenario-title">' + s.name + '</div>' +
            '<div>Classification: <strong>' + s.classification + '</strong></div>' +
            '<div>Income increase: <strong>' + formatWithCommas(s.incomeIncrease) + '</strong></div>' +
            '<div>Essentials decrease: <strong>' + formatWithCommas(s.essentialsDecrease) + '</strong></div>' +
          '</div>'
        );
      }).join("");

      safeHtml(proSensitivity, sensHtml);

      const combinedLines = leverData.combined.map(function (c) {
        return "<div>" + c.label + ": <strong>" + formatWithCommas(c.change) + "</strong></div>";
      }).join("");

      safeHtml(
        proCombined,
        "<div>Suggested split across top 3 levers (proportional):</div>" + combinedLines
      );

      if (proPlan) {
        proPlan.innerHTML = "";
        plan.forEach(function (line) {
          const li = document.createElement("li");
          li.textContent = line;
          proPlan.appendChild(li);
        });
      }
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
      window.location.href = waUrl;
    });
  }
});
