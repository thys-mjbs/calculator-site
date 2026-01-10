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

  const groceriesNumber = document.getElementById("groceriesNumber");
  const groceriesRange = document.getElementById("groceriesRange");

  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");

  const medicalNumber = document.getElementById("medicalNumber");
  const medicalRange = document.getElementById("medicalRange");

  const debtMinNumber = document.getElementById("debtMinNumber");
  const debtMinRange = document.getElementById("debtMinRange");

  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");

  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");

  const essentialsInflationNumber = document.getElementById("essentialsInflationNumber");
  const essentialsInflationRange = document.getElementById("essentialsInflationRange");

  const incomeShockNumber = document.getElementById("incomeShockNumber");
  const incomeShockRange = document.getElementById("incomeShockRange");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(groceriesNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(medicalNumber);
  attachLiveFormatting(debtMinNumber);
  attachLiveFormatting(commitmentsNumber);

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

  function validatePercent(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue, asPercent) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const init = clamp(defaultValue, min, max);
    rangeEl.value = String(init);
    numberEl.value = asPercent ? String(Math.round(init)) : formatInputWithCommas(String(init));

    rangeEl.addEventListener("input", function () {
      const v = toNumber(rangeEl.value);
      const clamped = clamp(v, min, max);
      if (asPercent) {
        numberEl.value = String(Math.round(clamped));
      } else {
        numberEl.value = formatInputWithCommas(String(Math.round(clamped)));
      }
    });

    function commit() {
      const typed = toNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        if (asPercent) {
          numberEl.value = String(Math.round(toNumber(rangeEl.value)));
        } else {
          numberEl.value = formatInputWithCommas(String(Math.round(toNumber(rangeEl.value))));
        }
        return;
      }
      const clamped = clamp(typed, min, max);
      rangeEl.value = String(clamped);
      if (asPercent) {
        numberEl.value = String(Math.round(clamped));
      } else {
        numberEl.value = formatInputWithCommas(String(Math.round(clamped)));
      }
    }

    numberEl.addEventListener("blur", commit);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commit();
    });
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 200000, 500, 30000, false);
  bindRangeAndNumber(housingRange, housingNumber, 0, 120000, 250, 12000, false);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 30000, 100, 2500, false);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 60000, 200, 5000, false);
  bindRangeAndNumber(transportRange, transportNumber, 0, 50000, 200, 3000, false);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 50000, 200, 2000, false);
  bindRangeAndNumber(debtMinRange, debtMinNumber, 0, 80000, 200, 1500, false);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 50, 100, 1, 90, true);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 80000, 200, 0, false);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12, 1, 2, true);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 30, 1, 10, true);
  bindRangeAndNumber(essentialsInflationRange, essentialsInflationNumber, 0, 25, 1, 8, true);
  bindRangeAndNumber(incomeShockRange, incomeShockNumber, 0, 25, 1, 10, true);

  function formatInt(n) {
    if (!Number.isFinite(n)) return "0";
    return formatInputWithCommas(String(Math.round(n)));
  }

  function formatPct(n) {
    if (!Number.isFinite(n)) return "0%";
    return String(Math.round(n)) + "%";
  }

  function classify(ratio, stableThreshold) {
    if (!Number.isFinite(ratio)) return "Underprepared";
    if (ratio < 1.0) return "Underprepared";
    if (ratio < stableThreshold) return "Borderline";
    return "Stable";
  }

  function computeGapTargets(incomeEffective, essentialsTotal, stableThreshold) {
    const requiredIncome = essentialsTotal * stableThreshold;
    const incomeIncrease = Math.max(0, requiredIncome - incomeEffective);

    const requiredEssentials = incomeEffective / stableThreshold;
    const essentialsDecrease = Math.max(0, essentialsTotal - requiredEssentials);

    return {
      requiredIncome: requiredIncome,
      incomeIncrease: incomeIncrease,
      requiredEssentials: requiredEssentials,
      essentialsDecrease: essentialsDecrease
    };
  }

  function topLevers(expenses) {
    const list = expenses.slice().sort(function (a, b) { return b.value - a.value; });
    return list.filter(function (x) { return x.value > 0; }).slice(0, 5);
  }

  function leverRows(expenses, essentialsTotal, essentialsDecreaseNeeded) {
    const levers = topLevers(expenses);
    const rows = levers.map(function (l) {
      const share = essentialsTotal > 0 ? (l.value / essentialsTotal) * 100 : 0;
      const requiredChange = clamp(essentialsDecreaseNeeded, 0, l.value);
      return {
        label: l.label,
        value: l.value,
        sharePct: share,
        requiredChange: requiredChange
      };
    });
    return rows;
  }

  function combinedSplit(top3, totalDecrease) {
    const sum = top3.reduce(function (acc, x) { return acc + x.value; }, 0);
    if (sum <= 0 || totalDecrease <= 0) {
      return top3.map(function (x) {
        return { label: x.label, change: 0, cap: x.value };
      });
    }
    return top3.map(function (x) {
      const portion = (x.value / sum) * totalDecrease;
      const change = clamp(portion, 0, x.value);
      return { label: x.label, change: change, cap: x.value };
    });
  }

  function scenarioRow(name, incomeEff, essentialsTot, stableThreshold) {
    const ratio = essentialsTot > 0 ? (incomeEff / essentialsTot) : 0;
    const cls = classify(ratio, stableThreshold);
    const gap = computeGapTargets(incomeEff, essentialsTot, stableThreshold);
    return {
      name: name,
      classification: cls,
      incomeIncrease: gap.incomeIncrease,
      essentialsDecrease: gap.essentialsDecrease
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const income = toNumber(incomeNumber ? incomeNumber.value : "");
      const housing = toNumber(housingNumber ? housingNumber.value : "");
      const utilities = toNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = toNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = toNumber(transportNumber ? transportNumber.value : "");
      const medical = toNumber(medicalNumber ? medicalNumber.value : "");
      const debtMin = toNumber(debtMinNumber ? debtMinNumber.value : "");

      const reliabilityPct = toNumber(reliabilityNumber ? reliabilityNumber.value : "");
      const commitments = toNumber(commitmentsNumber ? commitmentsNumber.value : "");
      const bufferMonths = toNumber(bufferMonthsNumber ? bufferMonthsNumber.value : "");
      const errorMarginPct = toNumber(errorMarginNumber ? errorMarginNumber.value : "");
      const essentialsInflationPct = toNumber(essentialsInflationNumber ? essentialsInflationNumber.value : "");
      const incomeShockPct = toNumber(incomeShockNumber ? incomeShockNumber.value : "");

      if (
        !incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !medicalNumber || !debtMinNumber ||
        !reliabilityNumber || !commitmentsNumber || !bufferMonthsNumber || !errorMarginNumber || !essentialsInflationNumber || !incomeShockNumber
      ) return;

      if (!validatePositive(income, "income")) return;

      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries and essentials")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(medical, "medical and insurance")) return;
      if (!validateNonNegative(debtMin, "debt minimums")) return;

      if (!validatePercent(reliabilityPct, "income reliability", 50, 100)) return;
      if (!validateNonNegative(commitments, "fixed commitments")) return;
      if (!validatePercent(bufferMonths, "target buffer depth (months)", 0, 12)) return;
      if (!validatePercent(errorMarginPct, "estimation error margin", 0, 30)) return;
      if (!validatePercent(essentialsInflationPct, "essentials stress increase", 0, 25)) return;
      if (!validatePercent(incomeShockPct, "income stress decrease", 0, 25)) return;

      const essentialsBase = housing + utilities + groceries + transport + medical + debtMin;
      if (!Number.isFinite(essentialsBase) || essentialsBase <= 0) {
        setResultError("Enter valid essential expenses. Total essentials must be greater than 0.");
        return;
      }

      const essentialsTotal = essentialsBase + commitments;
      if (!Number.isFinite(essentialsTotal) || essentialsTotal <= 0) {
        setResultError("Enter valid commitments. Total baseline must be greater than 0.");
        return;
      }

      const stableThreshold = 1.25;

      const reliabilityFactor = reliabilityPct / 100;
      const shockedIncome = income * (1 - (incomeShockPct / 100));
      const incomeEffective = shockedIncome * reliabilityFactor;

      if (!Number.isFinite(incomeEffective) || incomeEffective <= 0) {
        setResultError("Your effective income is not valid after reliability and stress adjustments.");
        return;
      }

      const coverageRatio = incomeEffective / essentialsTotal;
      if (!Number.isFinite(coverageRatio) || coverageRatio <= 0) {
        setResultError("Could not compute a valid coverage ratio from your inputs.");
        return;
      }

      const classification = classify(coverageRatio, stableThreshold);
      const margin = incomeEffective - essentialsTotal;

      const gap = computeGapTargets(incomeEffective, essentialsTotal, stableThreshold);

      const expenses = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries and essentials", value: groceries },
        { label: "Transport", value: transport },
        { label: "Medical and insurance", value: medical },
        { label: "Debt minimums", value: debtMin }
      ];

      const levers = leverRows(expenses, essentialsBase, gap.essentialsDecrease);
      const top3 = topLevers(expenses).slice(0, 3);
      const combined = combinedSplit(top3, gap.essentialsDecrease);

      const bufferMonthsClamped = clamp(bufferMonths, 0, 12);
      const errorFactor = 1 + (errorMarginPct / 100);
      const bufferTargetRaw = essentialsTotal * bufferMonthsClamped * errorFactor;

      const essStressFactor = 1 + (essentialsInflationPct / 100);
      const scenario1 = scenarioRow(
        "Income reliability worsens",
        income * (Math.max(0.5, (reliabilityFactor - 0.10))),
        essentialsTotal,
        stableThreshold
      );

      const scenario2 = scenarioRow(
        "Essentials increase",
        incomeEffective,
        essentialsTotal * essStressFactor,
        stableThreshold
      );

      const scenario3 = scenarioRow(
        "Combined moderate stress",
        (income * (1 - (incomeShockPct / 200))) * (Math.max(0.5, (reliabilityFactor - 0.05))),
        essentialsTotal * (1 + (essentialsInflationPct / 200)),
        stableThreshold
      );

      const actions = [];
      if (gap.incomeIncrease > 0) {
        actions.push("Close the income gap by increasing monthly income by " + formatInt(gap.incomeIncrease) + " (effective, after reliability).");
      } else {
        actions.push("Protect stability by preventing new fixed commitments while maintaining current baseline.");
      }

      if (gap.essentialsDecrease > 0 && levers.length > 0) {
        actions.push("If income stays fixed, reduce essentials by " + formatInt(gap.essentialsDecrease) + " to reach the stable ratio.");
      }

      if (levers.length > 0) {
        actions.push("Start with the biggest lever (" + levers[0].label + "). Single-lever requirement: " + formatInt(levers[0].requiredChange) + ".");
      }

      if (combined.some(function (x) { return x.change > 0; })) {
        actions.push("Use the combined option across top levers instead of forcing one category to absorb the full change.");
      }

      actions.push("Use the sensitivity panel to verify you stay stable under stress scenarios before adding any new fixed cost.");

      const actionPlan = [];
      const leverNames = levers.map(function (l) { return l.label; });

      if (gap.essentialsDecrease > 0 && combined[0] && combined[0].change > 0) {
        actionPlan.push("Apply combined reduction: " + combined.map(function (x) { return x.label + " " + formatInt(x.change); }).join(", ") + ".");
      }

      if (gap.incomeIncrease > 0) {
        actionPlan.push("Increase effective income by " + formatInt(gap.incomeIncrease) + " (targets already include reliability and stress).");
      }

      if (bufferMonthsClamped > 0) {
        actionPlan.push("Build buffer target: " + formatInt(bufferTargetRaw) + " (months " + Math.round(bufferMonthsClamped) + ", error margin " + Math.round(errorMarginPct) + "%).");
      }

      actionPlan.push("Re-check under stress: Scenario 1 (" + scenario1.classification + "), Scenario 2 (" + scenario2.classification + "), Scenario 3 (" + scenario3.classification + ").");

      if (scenario3.classification !== "Stable") {
        actionPlan.push("Do not add new fixed commitments until Scenario 3 shows Stable.");
      } else {
        actionPlan.push("If you add a commitment, re-run with commitments increased by the full amount first.");
      }

      if (commitments > 0) {
        actionPlan.push("If commitments are unavoidable, keep them flat until you clear the stable gap.");
      }

      // Build results HTML (MANDATORY sections)
      const ratioRounded = Math.round(coverageRatio * 100) / 100;

      let leverTableRows = "";
      levers.slice(0, 5).forEach(function (l) {
        leverTableRows +=
          "<tr>" +
            "<td>" + l.label + "</td>" +
            "<td>" + formatPct(l.sharePct) + "</td>" +
            "<td>" + formatInt(l.requiredChange) + "</td>" +
          "</tr>";
      });

      let sensitivityRows = "";
      [scenario1, scenario2, scenario3].forEach(function (s) {
        sensitivityRows +=
          "<tr>" +
            "<td>" + s.name + "</td>" +
            "<td>" + s.classification + "</td>" +
            "<td>" + formatInt(s.incomeIncrease) + "</td>" +
            "<td>" + formatInt(s.essentialsDecrease) + "</td>" +
          "</tr>";
      });

      let combinedRows = "";
      combined.forEach(function (x) {
        combinedRows +=
          "<tr>" +
            "<td>" + x.label + "</td>" +
            "<td>" + formatInt(x.change) + "</td>" +
          "</tr>";
      });

      let nextActionsLi = "";
      actions.slice(0, 5).forEach(function (a) {
        nextActionsLi += "<li>" + a + "</li>";
      });

      let planLi = "";
      actionPlan.slice(0, 7).forEach(function (a) {
        planLi += "<li>" + a + "</li>";
      });

      const resultHtml =
        '<div class="di-section">' +
          '<div class="di-section-title">A) Headline</div>' +
          '<ul class="di-bullets"><li><strong>Classification:</strong> ' + classification + "</li></ul>" +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">B) Core numbers</div>' +
          '<div class="di-kv">' +
            '<div class="k">Total essentials (with commitments)</div><div class="v">' + formatInt(essentialsTotal) + "</div>" +
            '<div class="k">Coverage ratio (effective income / essentials)</div><div class="v">' + ratioRounded.toFixed(2) + "</div>" +
            '<div class="k">Monthly margin (effective income - essentials)</div><div class="v">' + formatInt(margin) + "</div>" +
          "</div>" +
          '<div class="di-note">Effective income includes reliability and income stress adjustments.</div>' +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">C) Stability target</div>' +
          '<div class="di-kv">' +
            '<div class="k">Stable threshold ratio</div><div class="v">' + stableThreshold.toFixed(2) + "</div>" +
            '<div class="k">Required monthly income increase (essentials fixed)</div><div class="v">' + formatInt(gap.incomeIncrease) + "</div>" +
            '<div class="k">Required monthly essentials decrease (income fixed)</div><div class="v">' + formatInt(gap.essentialsDecrease) + "</div>" +
          "</div>" +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">D) Lever ranking (top 5)</div>' +
          '<table class="di-table">' +
            "<thead><tr><th>Lever</th><th>Share of essentials</th><th>Required change (lever alone)</th></tr></thead>" +
            "<tbody>" + leverTableRows + "</tbody>" +
          "</table>" +
          '<div class="di-note">Single-lever requirement is clamped to not exceed the lever amount.</div>' +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">E) Next actions (max 5)</div>' +
          '<ul class="di-bullets">' + nextActionsLi + "</ul>" +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">F) Sensitivity panel</div>' +
          '<table class="di-table">' +
            "<thead><tr><th>Scenario</th><th>Classification</th><th>Income increase</th><th>Essentials decrease</th></tr></thead>" +
            "<tbody>" + sensitivityRows + "</tbody>" +
          "</table>" +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">G) Combined correction option</div>' +
          '<table class="di-table">' +
            "<thead><tr><th>Lever</th><th>Suggested change</th></tr></thead>" +
            "<tbody>" + combinedRows + "</tbody>" +
          "</table>" +
          '<div class="di-note">Split is proportional across top 3 levers by size.</div>' +
        "</div>" +

        '<div class="di-section">' +
          '<div class="di-section-title">H) Ranked action plan (max 7)</div>' +
          '<ol class="di-bullets">' + planLi + "</ol>" +
          '<div class="di-note">Buffer target (confidence-adjusted): ' + formatInt(bufferTargetRaw) + ".</div>" +
        "</div>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Planner Pro - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
