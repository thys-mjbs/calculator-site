// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  // Replace these bindings per calculator or add more as needed.
  // Example:
  // const inputA = document.getElementById("inputA");
  // const inputB = document.getElementById("inputB");
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

  const debtMinimumsNumber = document.getElementById("debtMinimumsNumber");
  const debtMinimumsRange = document.getElementById("debtMinimumsRange");

  const incomeReliabilityNumber = document.getElementById("incomeReliabilityNumber");
  const incomeReliabilityRange = document.getElementById("incomeReliabilityRange");

  const fixedCommitmentsNumber = document.getElementById("fixedCommitmentsNumber");
  const fixedCommitmentsRange = document.getElementById("fixedCommitmentsRange");

  const irregularEssentialsNumber = document.getElementById("irregularEssentialsNumber");
  const irregularEssentialsRange = document.getElementById("irregularEssentialsRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const estimationErrorNumber = document.getElementById("estimationErrorNumber");
  const estimationErrorRange = document.getElementById("estimationErrorRange");

  const essentialsGrowthNumber = document.getElementById("essentialsGrowthNumber");
  const essentialsGrowthRange = document.getElementById("essentialsGrowthRange");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Example:
  // const modeSelect = document.getElementById("modeSelect");
  // const modeBlockA = document.getElementById("modeBlockA");
  // const modeBlockB = document.getElementById("modeBlockB");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  // Example:
  // attachLiveFormatting(inputA);
  // attachLiveFormatting(inputB);
  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(groceriesNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtMinimumsNumber);
  attachLiveFormatting(fixedCommitmentsNumber);
  attachLiveFormatting(irregularEssentialsNumber);

  // ------------------------------------------------------------
  // 2B) RANGE + NUMBER BINDING (DI PATTERN)
  // ------------------------------------------------------------
  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return NaN;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function formatInt(value) {
    if (!Number.isFinite(value)) return "";
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatPct(value) {
    if (!Number.isFinite(value)) return "";
    return Math.round(value).toString();
  }

  function bindRangeAndNumber(rangeEl, numberEl, options) {
    if (!rangeEl || !numberEl) return;

    const min = toNumber(rangeEl.min);
    const max = toNumber(rangeEl.max);
    const isPercent = options && options.isPercent;
    const isWhole = options && options.isWhole;

    function syncFromRange() {
      const v = toNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      if (isPercent || isWhole) {
        numberEl.value = String(Math.round(v));
      } else {
        numberEl.value = formatInt(v);
      }
    }

    function commitFromNumber() {
      const raw = toNumber(numberEl.value);
      if (!Number.isFinite(raw)) {
        numberEl.value = "";
        return;
      }
      const clamped = clamp(raw, min, max);
      if (!Number.isFinite(clamped)) return;

      rangeEl.value = String(clamped);

      if (isPercent || isWhole) {
        numberEl.value = String(Math.round(clamped));
      } else {
        numberEl.value = formatInt(clamped);
      }
    }

    rangeEl.addEventListener("input", function () {
      syncFromRange();
    });

    numberEl.addEventListener("blur", function () {
      commitFromNumber();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitFromNumber();
      }
    });

    syncFromRange();
  }

  bindRangeAndNumber(incomeRange, incomeNumber, {});
  bindRangeAndNumber(housingRange, housingNumber, {});
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, {});
  bindRangeAndNumber(groceriesRange, groceriesNumber, {});
  bindRangeAndNumber(transportRange, transportNumber, {});
  bindRangeAndNumber(debtMinimumsRange, debtMinimumsNumber, {});
  bindRangeAndNumber(incomeReliabilityRange, incomeReliabilityNumber, { isPercent: true });
  bindRangeAndNumber(fixedCommitmentsRange, fixedCommitmentsNumber, {});
  bindRangeAndNumber(irregularEssentialsRange, irregularEssentialsNumber, {});
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, { isWhole: true });
  bindRangeAndNumber(estimationErrorRange, estimationErrorNumber, { isPercent: true });
  bindRangeAndNumber(essentialsGrowthRange, essentialsGrowthNumber, { isPercent: true });

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
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

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  // If your calculator has multiple modes, implement showMode() and hook it up.
  // If not used, leave the placeholders empty and do nothing.
  function showMode(mode) {
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
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

  function formatRatio(value) {
    if (!Number.isFinite(value)) return "";
    return value.toFixed(2);
  }

  function classify(ratio, stableRatio) {
    if (!Number.isFinite(ratio) || ratio <= 0) return "Underprepared";
    if (ratio < 1.0) return "Underprepared";
    if (ratio < stableRatio) return "Borderline";
    return "Stable";
  }

  function computeTargets(conservativeIncome, essentials, stableRatio) {
    const gapIncome = Math.max(0, (essentials * stableRatio) - conservativeIncome);
    const maxEssentialsForStable = conservativeIncome / stableRatio;
    const gapEssentials = Math.max(0, essentials - maxEssentialsForStable);
    return {
      incomeIncreaseNeeded: gapIncome,
      essentialsDecreaseNeeded: gapEssentials
    };
  }

  function pct(value) {
    if (!Number.isFinite(value)) return "";
    return (value * 100).toFixed(1) + "%";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const income = toNumber(incomeNumber ? incomeNumber.value : "");
      const housing = toNumber(housingNumber ? housingNumber.value : "");
      const utilities = toNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = toNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = toNumber(transportNumber ? transportNumber.value : "");
      const debtMinimums = toNumber(debtMinimumsNumber ? debtMinimumsNumber.value : "");

      const incomeReliabilityPct = toNumber(incomeReliabilityNumber ? incomeReliabilityNumber.value : "");
      const fixedCommitments = toNumber(fixedCommitmentsNumber ? fixedCommitmentsNumber.value : "");
      const irregularEssentials = toNumber(irregularEssentialsNumber ? irregularEssentialsNumber.value : "");
      const bufferMonths = toNumber(bufferMonthsNumber ? bufferMonthsNumber.value : "");
      const estimationErrorPct = toNumber(estimationErrorNumber ? estimationErrorNumber.value : "");
      const essentialsGrowthPct = toNumber(essentialsGrowthNumber ? essentialsGrowthNumber.value : "");

      // Basic existence guard (optional but recommended)
      if (
        !incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !debtMinimumsNumber ||
        !incomeReliabilityNumber || !fixedCommitmentsNumber || !irregularEssentialsNumber || !bufferMonthsNumber || !estimationErrorNumber || !essentialsGrowthNumber
      ) return;

      // Validation
      clearResult();

      if (!validatePositive(income, "monthly income")) return;

      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debtMinimums, "debt minimums")) return;

      if (!validatePositive(incomeReliabilityPct, "income reliability")) return;
      if (incomeReliabilityPct < 50 || incomeReliabilityPct > 100) {
        setResultError("Income reliability must be between 50 and 100.");
        return;
      }

      if (!validateNonNegative(fixedCommitments, "fixed commitments")) return;
      if (!validateNonNegative(irregularEssentials, "irregular essentials")) return;

      if (!validateNonNegative(bufferMonths, "target buffer depth")) return;
      if (bufferMonths > 12) {
        setResultError("Target buffer depth must be 12 or less.");
        return;
      }

      if (!validateNonNegative(estimationErrorPct, "estimation error margin")) return;
      if (estimationErrorPct > 25) {
        setResultError("Estimation error margin must be 25 or less.");
        return;
      }

      if (!validateNonNegative(essentialsGrowthPct, "near-term essentials growth")) return;
      if (essentialsGrowthPct > 20) {
        setResultError("Near-term essentials growth must be 20 or less.");
        return;
      }

      const coreEssentials = housing + utilities + groceries + transport + debtMinimums;
      const commitmentsBeyond = fixedCommitments + irregularEssentials;
      const totalEssentials = coreEssentials + commitmentsBeyond;

      if (!Number.isFinite(totalEssentials) || totalEssentials <= 0) {
        setResultError("Enter essential expenses that total greater than 0.");
        return;
      }

      // Paid-only mechanics
      const stableRatio = 1.25;

      const reliabilityFactor = incomeReliabilityPct / 100;
      const conservativeIncome = income * reliabilityFactor;

      const ratioBase = income / totalEssentials;
      const ratioConservative = conservativeIncome / totalEssentials;

      if (!Number.isFinite(ratioConservative) || ratioConservative <= 0) {
        setResultError("Inputs produced an invalid result. Check your numbers and try again.");
        return;
      }

      const classification = classify(ratioConservative, stableRatio);
      const margin = conservativeIncome - totalEssentials;

      const targets = computeTargets(conservativeIncome, totalEssentials, stableRatio);

      // Confidence-adjusted buffer
      const errorFactor = 1 + (estimationErrorPct / 100);
      const volatilityFactor = 1 + (1 - reliabilityFactor);
      const adjustedBufferTarget = totalEssentials * bufferMonths * errorFactor * volatilityFactor;

      // Lever ranking (Top 5)
      const leverList = [
        { key: "Housing", amount: housing },
        { key: "Utilities", amount: utilities },
        { key: "Groceries", amount: groceries },
        { key: "Transport", amount: transport },
        { key: "Debt minimums", amount: debtMinimums },
        { key: "Commitments beyond essentials", amount: commitmentsBeyond }
      ].filter(function (x) { return Number.isFinite(x.amount) && x.amount > 0; });

      leverList.sort(function (a, b) { return b.amount - a.amount; });

      const top5 = leverList.slice(0, 5);
      const essentialsDecreaseNeeded = targets.essentialsDecreaseNeeded;

      const leverRows = top5.map(function (l) {
        const share = l.amount / totalEssentials;
        const requiredSolo = Math.min(l.amount, essentialsDecreaseNeeded);
        return {
          label: l.key,
          share: share,
          amount: l.amount,
          requiredSolo: requiredSolo
        };
      });

      // Combined correction option (top 3 proportional split)
      const top3 = top5.slice(0, 3);
      const top3Sum = top3.reduce(function (acc, l) { return acc + l.amount; }, 0);

      const combinedSplit = top3.map(function (l) {
        const weight = top3Sum > 0 ? (l.amount / top3Sum) : 0;
        const suggested = essentialsDecreaseNeeded * weight;
        const clamped = Math.min(l.amount, suggested);
        return {
          label: l.key,
          suggested: clamped
        };
      });

      // Sensitivity scenarios (min 3)
      function scenarioResult(name, scenarioIncome, scenarioEssentials) {
        const scenarioRatio = scenarioIncome / scenarioEssentials;
        const scenarioClass = classify(scenarioRatio, stableRatio);
        const scenarioTargets = computeTargets(scenarioIncome, scenarioEssentials, stableRatio);
        return {
          name: name,
          classification: scenarioClass,
          incomeIncrease: scenarioTargets.incomeIncreaseNeeded,
          essentialsDecrease: scenarioTargets.essentialsDecreaseNeeded
        };
      }

      const growthFactor = 1 + (Math.max(0, essentialsGrowthPct) / 100);

      const s1Income = income * Math.max(0.4, reliabilityFactor - 0.10) * 0.90;
      const s1Essentials = totalEssentials;
      const s1 = scenarioResult("Income stress (drop + reliability worsening)", s1Income, s1Essentials);

      const s2Income = conservativeIncome;
      const s2Essentials = totalEssentials * Math.max(1.0, growthFactor);
      const s2 = scenarioResult("Essentials stress (near-term increase)", s2Income, s2Essentials);

      const s3Income = s1Income;
      const s3Essentials = s2Essentials;
      const s3 = scenarioResult("Combined stress (income + essentials)", s3Income, s3Essentials);

      // Next actions (max 5) and ranked action plan (max 7)
      const primaryLever = leverRows.length ? leverRows[0].label : "Top lever";
      const primarySolo = leverRows.length ? leverRows[0].requiredSolo : 0;

      const actions = [];

      if (targets.incomeIncreaseNeeded > 0) {
        actions.push("Income path: increase reliable monthly income by " + formatInt(targets.incomeIncreaseNeeded) + " to reach Stable.");
      } else {
        actions.push("Income path: no increase required to meet Stable at current conservative baseline.");
      }

      if (targets.essentialsDecreaseNeeded > 0) {
        actions.push("Essentials path: reduce monthly essentials by " + formatInt(targets.essentialsDecreaseNeeded) + " to reach Stable.");
      } else {
        actions.push("Essentials path: no reduction required to meet Stable at current conservative baseline.");
      }

      if (targets.essentialsDecreaseNeeded > 0 && primarySolo > 0) {
        actions.push("Single-lever option: if only " + primaryLever + " changes, reduce it by " + formatInt(primarySolo) + " to reach Stable.");
      }

      if (bufferMonths > 0) {
        actions.push("Buffer target: build " + formatInt(adjustedBufferTarget) + " total buffer (adjusted for reliability and estimation error).");
      }

      actions.push("Stress check: under Combined stress, the gap becomes income +" + formatInt(s3.incomeIncrease) + " or essentials -" + formatInt(s3.essentialsDecrease) + ".");

      const nextActions = actions.slice(0, 5);

      const plan = [];
      plan.push("Baseline status: " + classification + " using conservative income (" + formatInt(conservativeIncome) + ").");
      if (targets.essentialsDecreaseNeeded > 0 && combinedSplit.length === 3) {
        plan.push("Combined correction: reduce " + combinedSplit[0].label + " by " + formatInt(combinedSplit[0].suggested) + ", " + combinedSplit[1].label + " by " + formatInt(combinedSplit[1].suggested) + ", and " + combinedSplit[2].label + " by " + formatInt(combinedSplit[2].suggested) + ".");
      }
      if (targets.incomeIncreaseNeeded > 0) {
        plan.push("Income lever: close the remaining gap with a reliable income increase of " + formatInt(targets.incomeIncreaseNeeded) + " if reductions are constrained.");
      }
      if (leverRows.length >= 2 && targets.essentialsDecreaseNeeded > 0) {
        plan.push("Top lever focus: prioritize changes in " + leverRows[0].label + " then " + leverRows[1].label + " because they dominate essentials share.");
      }
      if (bufferMonths > 0) {
        plan.push("Buffer build: target " + formatInt(adjustedBufferTarget) + " total buffer; re-run after any major lever change.");
      }
      plan.push("Scenario guardrail: if essentials increase by " + formatPct(Math.max(0, essentialsGrowthPct) / 100) + ", your gap becomes income +" + formatInt(s2.incomeIncrease) + " or essentials -" + formatInt(s2.essentialsDecrease) + ".");
      plan.push("Scenario guardrail: if income weakens (drop + reliability), your gap becomes income +" + formatInt(s1.incomeIncrease) + " or essentials -" + formatInt(s1.essentialsDecrease) + ".");

      const rankedPlan = plan.slice(0, 7);

      // Build output HTML (PAID RESULTS BLOCK)
      const leverTableRowsHtml = leverRows.map(function (r) {
        return (
          "<tr>" +
            "<td>" + r.label + "</td>" +
            "<td>" + pct(r.share) + "</td>" +
            "<td>" + formatInt(r.requiredSolo) + "</td>" +
          "</tr>"
        );
      }).join("");

      const combinedRowsHtml = combinedSplit.map(function (c) {
        return "<tr><td>" + c.label + "</td><td>" + formatInt(c.suggested) + "</td></tr>";
      }).join("");

      const sensitivityRowsHtml = [s1, s2, s3].map(function (s) {
        return (
          "<tr>" +
            "<td>" + s.name + "</td>" +
            "<td>" + s.classification + "</td>" +
            "<td>+" + formatInt(s.incomeIncrease) + "</td>" +
            "<td>-" + formatInt(s.essentialsDecrease) + "</td>" +
          "</tr>"
        );
      }).join("");

      const nextActionsHtml = nextActions.map(function (a) { return "<li>" + a + "</li>"; }).join("");
      const rankedPlanHtml = rankedPlan.map(function (a) { return "<li>" + a + "</li>"; }).join("");

      const resultHtml =
        '<div class="di-results">' +
          '<div class="di-badge">' + classification + '</div>' +
          '<div class="di-muted">Stable threshold ratio: ' + formatRatio(stableRatio) + '</div>' +

          '<h3>Core numbers</h3>' +
          '<div class="di-kv">' +
            '<div><strong>Total essentials:</strong> ' + formatInt(totalEssentials) + '</div>' +
            '<div><strong>Coverage ratio (base):</strong> ' + formatRatio(ratioBase) + '</div>' +
            '<div><strong>Coverage ratio (conservative):</strong> ' + formatRatio(ratioConservative) + '</div>' +
            '<div><strong>Monthly margin (conservative):</strong> ' + formatInt(margin) + '</div>' +
          '</div>' +

          '<h3>Stability target</h3>' +
          '<div class="di-kv">' +
            '<div><strong>Gap to Stable (income increase):</strong> +' + formatInt(targets.incomeIncreaseNeeded) + '</div>' +
            '<div><strong>Gap to Stable (essentials decrease):</strong> -' + formatInt(targets.essentialsDecreaseNeeded) + '</div>' +
          '</div>' +

          '<h3>Stability buffer target (adjusted)</h3>' +
          '<div class="di-kv">' +
            '<div><strong>Target buffer depth:</strong> ' + formatPct(bufferMonths / 12).replace("%", "") + ' months</div>' +
            '<div><strong>Adjusted buffer target:</strong> ' + formatInt(adjustedBufferTarget) + '</div>' +
          '</div>' +

          '<h3>Lever impact ranking (top 5)</h3>' +
          '<table>' +
            '<thead><tr><th>Lever</th><th>Share of essentials</th><th>Required change (lever alone) to reach Stable</th></tr></thead>' +
            '<tbody>' + leverTableRowsHtml + '</tbody>' +
          '</table>' +

          '<h3>Next actions (max 5)</h3>' +
          '<ul class="di-actions">' + nextActionsHtml + '</ul>' +

          '<h3>Sensitivity panel</h3>' +
          '<table>' +
            '<thead><tr><th>Scenario</th><th>Classification</th><th>Gap (income +)</th><th>Gap (essentials -)</th></tr></thead>' +
            '<tbody>' + sensitivityRowsHtml + '</tbody>' +
          '</table>' +

          '<h3>Combined correction option (top 3 split)</h3>' +
          '<table>' +
            '<thead><tr><th>Lever</th><th>Suggested reduction</th></tr></thead>' +
            '<tbody>' + combinedRowsHtml + '</tbody>' +
          '</table>' +

          '<h3>Ranked action plan (max 7)</h3>' +
          '<ul>' + rankedPlanHtml + '</ul>' +
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
      const message = "Income vs Essentials Pro Tool - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
