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

  const medicalNumber = document.getElementById("medicalNumber");
  const medicalRange = document.getElementById("medicalRange");

  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");

  const volatilityNumber = document.getElementById("volatilityNumber");
  const volatilityRange = document.getElementById("volatilityRange");

  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");

  const confidenceNumber = document.getElementById("confidenceNumber");
  const confidenceRange = document.getElementById("confidenceRange");

  const proHeadline = document.getElementById("proHeadline");
  const proCore = document.getElementById("proCore");
  const proStability = document.getElementById("proStability");
  const proLevers = document.getElementById("proLevers");
  const proSensitivity = document.getElementById("proSensitivity");
  const proCombined = document.getElementById("proCombined");
  const proNextActions = document.getElementById("proNextActions");
  const proPlan = document.getElementById("proPlan");

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, decimals) {
    if (!rangeEl || !numberEl) return;

    const d = Number.isFinite(decimals) ? decimals : 0;

    function formatValue(v) {
      if (!Number.isFinite(v)) return "";
      if (d > 0) return v.toFixed(d);
      return formatInputWithCommas(String(Math.round(v)));
    }

    function setBoth(next) {
      const c = clamp(next, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatValue(c);
    }

    rangeEl.addEventListener("input", function () {
      const v = toNumber(rangeEl.value);
      setBoth(v);
    });

    function commitTyped() {
      const typed = toNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        setBoth(toNumber(rangeEl.value));
        return;
      }
      setBoth(typed);
    }

    numberEl.addEventListener("blur", commitTyped);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commitTyped();
    });

    setBoth(toNumber(rangeEl.value));
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 100, 0);
  bindRangeAndNumber(housingRange, housingNumber, 0, 200000, 100, 0);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 50000, 50, 0);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 80000, 50, 0);
  bindRangeAndNumber(transportRange, transportNumber, 0, 80000, 50, 0);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 80000, 50, 0);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.50, 1.00, 0.01, 2);
  bindRangeAndNumber(volatilityRange, volatilityNumber, 0, 30, 1, 0);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 200000, 50, 0);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 6, 0.1, 1);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 25, 1, 0);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 50, 100, 1, 0);

  // Optional: mode selector + groupe
  // If you don't use modes, leave blank.
  

  // ------------------------------------------------------------
  // 2) LIVE INPUT FORMATTING (CONSISTENT)
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
  attachLiveFormatting(medicalNumber);
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
  // If your calculator has multiple modes, implement showMode() and hook it up.
  // If not used, leave the placeholders empty and do nothing.
  function showMode(mode) {
    // Example pattern:
    // modeBlockA.classList.add("hidden");
    // modeBlockB.classList.add("hidden");
    // if (mode === "a") modeBlockA.classList.remove("hidden");
    // if (mode === "b") modeBlockB.classList.remove("hidden");
    

    clearResult();
  }

  // Example:
  // if (modeSelect) {
  //   modeSelect.addEventListener("change", function () {
  //     showMode(modeSelect.value);
  //   });
  // }
  

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " (greater than 0).");
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Optional: if you have modes, read it here:
      // const mode = modeSelect ? modeSelect.value : "default";
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      // Example:
      // const a = toNumber(inputA ? inputA.value : "");
      // const b = toNumber(inputB ? inputB.value : "");
      const income = toNumber(incomeNumber ? incomeNumber.value : "");
      const housing = toNumber(housingNumber ? housingNumber.value : "");
      const utilities = toNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = toNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = toNumber(transportNumber ? transportNumber.value : "");
      const medical = toNumber(medicalNumber ? medicalNumber.value : "");

      const reliability = toNumber(reliabilityNumber ? reliabilityNumber.value : "");
      const volatilityPct = toNumber(volatilityNumber ? volatilityNumber.value : "");
      const commitments = toNumber(commitmentsNumber ? commitmentsNumber.value : "");
      const bufferMonths = toNumber(bufferMonthsNumber ? bufferMonthsNumber.value : "");
      const errorMarginPct = toNumber(errorMarginNumber ? errorMarginNumber.value : "");
      const confidencePct = toNumber(confidenceNumber ? confidenceNumber.value : "");

      // Basic existence guard (optional but recommended)
      // Example:
      // if (!inputA || !inputB) return;
      if (!incomeNumber || !incomeRange) return;
      if (!housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !medicalNumber) return;
      if (!reliabilityNumber || !volatilityNumber || !commitmentsNumber || !bufferMonthsNumber || !errorMarginNumber || !confidenceNumber) return;

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validateNonNegative(income, "income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries and essentials")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(medical, "insurance and medical")) return;

      if (!Number.isFinite(reliability) || reliability < 0.5 || reliability > 1.0) {
        setResultError("Enter a valid income reliability factor between 0.50 and 1.00.");
        return;
      }

      if (!Number.isFinite(volatilityPct) || volatilityPct < 0 || volatilityPct > 30) {
        setResultError("Enter a valid income variability percent between 0 and 30.");
        return;
      }

      if (!validateNonNegative(commitments, "non-negotiable commitments")) return;

      if (!Number.isFinite(bufferMonths) || bufferMonths < 0 || bufferMonths > 6) {
        setResultError("Enter a valid buffer depth in months between 0 and 6.");
        return;
      }

      if (!Number.isFinite(errorMarginPct) || errorMarginPct < 0 || errorMarginPct > 25) {
        setResultError("Enter a valid estimation error margin percent between 0 and 25.");
        return;
      }

      if (!Number.isFinite(confidencePct) || confidencePct < 50 || confidencePct > 100) {
        setResultError("Enter a valid estimation confidence percent between 50 and 100.");
        return;
      }

      const essentials = housing + utilities + groceries + transport + medical;
      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter essential expenses greater than 0.");
        return;
      }

      // Calculation logic
      const stableRatio = 1.25;

      const baseEssentials = housing + utilities + groceries + transport + medical;
      const baseFixed = baseEssentials + commitments;

      const costSafetyFactor = 1 + (errorMarginPct / 100);
      const adjustedEssentials = baseFixed * costSafetyFactor;

      const incomeVolFactor = 1 - (volatilityPct / 100);
      const conservativeIncome = income * reliability * incomeVolFactor;

      const ratio = conservativeIncome / adjustedEssentials;
      const monthlyMargin = conservativeIncome - adjustedEssentials;

      let classification = "Underprepared";
      if (ratio >= stableRatio) classification = "Stable";
      else if (ratio >= 1.0) classification = "Borderline";

      const incomeGap = Math.max(0, (adjustedEssentials * stableRatio) - conservativeIncome);
      const essentialsCut = Math.max(0, adjustedEssentials - (conservativeIncome / stableRatio));

      const confidenceFactor = 100 / confidencePct;
      const volatilityBufferFactor = 1 + (volatilityPct / 100) * 0.5;
      const bufferTarget = adjustedEssentials * bufferMonths * confidenceFactor * volatilityBufferFactor;

      const bufferMonthlyEquivalent = bufferMonths > 0 ? (bufferTarget / Math.max(1, bufferMonths)) : 0;

      const levers = [
        { key: "Housing", amount: housing },
        { key: "Utilities", amount: utilities },
        { key: "Groceries and essentials", amount: groceries },
        { key: "Transport", amount: transport },
        { key: "Insurance and medical", amount: medical },
        { key: "Commitments", amount: commitments }
      ].filter(function (l) { return Number.isFinite(l.amount) && l.amount > 0; });

      levers.sort(function (a, b) { return b.amount - a.amount; });

      const top5 = levers.slice(0, 5);
      const essentialsShareDenom = Math.max(1, baseFixed);

      const leverRows = top5.map(function (l) {
        const share = (l.amount / essentialsShareDenom) * 100;
        const required = clamp(essentialsCut, 0, l.amount);
        return {
          label: l.key,
          sharePct: share,
          requiredChange: required,
          amount: l.amount
        };
      });

      const scenarioInputs = [
        {
          name: "Income stress",
          income: conservativeIncome * 0.90,
          essentials: adjustedEssentials
        },
        {
          name: "Cost stress",
          income: conservativeIncome,
          essentials: adjustedEssentials * 1.10
        },
        {
          name: "Combined moderate stress",
          income: conservativeIncome * 0.93,
          essentials: adjustedEssentials * 1.07
        }
      ];

      function classifyScenario(scIncome, scEssentials) {
        const scRatio = scIncome / scEssentials;
        let scClass = "Underprepared";
        if (scRatio >= stableRatio) scClass = "Stable";
        else if (scRatio >= 1.0) scClass = "Borderline";

        const scIncomeGap = Math.max(0, (scEssentials * stableRatio) - scIncome);
        const scEssCut = Math.max(0, scEssentials - (scIncome / stableRatio));

        return { ratio: scRatio, classification: scClass, incomeGap: scIncomeGap, essentialsCut: scEssCut };
      }

      const scenarioResults = scenarioInputs.map(function (s) {
        const r = classifyScenario(s.income, s.essentials);
        return {
          name: s.name,
          classification: r.classification,
          incomeGap: r.incomeGap,
          essentialsCut: r.essentialsCut
        };
      });

      const top3 = leverRows.slice(0, 3);
      const sumTop3 = top3.reduce(function (acc, r) { return acc + r.amount; }, 0);
      const combinedSplit = top3.map(function (r) {
        const portion = sumTop3 > 0 ? (r.amount / sumTop3) : 0;
        const change = essentialsCut * portion;
        return { label: r.label, requiredChange: clamp(change, 0, r.amount) };
      });

      function formatMoneyNoSymbol(n) {
        return formatNumber(Math.round(n));
      }

      function formatRatio(n) {
        return formatNumberTwoDecimals(n) + "×";
      }

      const headlineText = classification + " (conservative coverage)";
      const coreText = "Adjusted essentials: " + formatMoneyNoSymbol(adjustedEssentials) +
        " | Conservative income: " + formatMoneyNoSymbol(conservativeIncome) +
        " | Coverage ratio: " + formatRatio(ratio) +
        " | Monthly margin: " + formatMoneyNoSymbol(monthlyMargin);

      const stabilityText = "Stable threshold ratio: " + formatRatio(stableRatio) +
        " | Gap to stable: income increase " + formatMoneyNoSymbol(incomeGap) +
        " or essentials decrease " + formatMoneyNoSymbol(essentialsCut) +
        " | Buffer target: " + formatMoneyNoSymbol(bufferTarget);

      const leverTableHtml = "<table class=\"di-pro-table\"><thead><tr><th>Lever</th><th>Share</th><th>Required change</th></tr></thead><tbody>" +
        leverRows.map(function (r) {
          return "<tr><td>" + r.label + "</td><td>" + formatNumberTwoDecimals(r.sharePct) + "%</td><td>" + formatMoneyNoSymbol(r.requiredChange) + "</td></tr>";
        }).join("") +
        "</tbody></table>";

      const sensitivityHtml = "<table class=\"di-pro-table\"><thead><tr><th>Scenario</th><th>Classification</th><th>Income increase</th><th>Essentials decrease</th></tr></thead><tbody>" +
        scenarioResults.map(function (s) {
          return "<tr><td>" + s.name + "</td><td><span class=\"di-pro-pill\">" + s.classification + "</span></td><td>" + formatMoneyNoSymbol(s.incomeGap) + "</td><td>" + formatMoneyNoSymbol(s.essentialsCut) + "</td></tr>";
        }).join("") +
        "</tbody></table>";

      const combinedHtml = "<table class=\"di-pro-table\"><thead><tr><th>Lever</th><th>Suggested change</th></tr></thead><tbody>" +
        combinedSplit.map(function (c) {
          return "<tr><td>" + c.label + "</td><td>" + formatMoneyNoSymbol(c.requiredChange) + "</td></tr>";
        }).join("") +
        "</tbody></table>";

      const nextActions = [];
      if (incomeGap > 0) nextActions.push("Increase conservative income by " + formatMoneyNoSymbol(incomeGap) + " or reduce adjusted essentials by " + formatMoneyNoSymbol(essentialsCut) + " to reach stable.");
      if (leverRows.length) nextActions.push("Start with " + leverRows[0].label + ": it is the largest lever and would need " + formatMoneyNoSymbol(leverRows[0].requiredChange) + " change to reach stable alone.");
      if (scenarioResults.length) nextActions.push("Stress test: " + scenarioResults[2].name + " results in " + scenarioResults[2].classification + " with income increase " + formatMoneyNoSymbol(scenarioResults[2].incomeGap) + ".");
      nextActions.push("Buffer target based on variability and confidence: " + formatMoneyNoSymbol(bufferTarget) + ".");
      if (combinedSplit.length) nextActions.push("If you cannot move one lever fully, use the combined split across top levers.");

      const nextActionsHtml = "<ul class=\"di-actions-list\">" +
        nextActions.slice(0, 5).map(function (a) { return "<li>" + a + "</li>"; }).join("") +
        "</ul>";

      const plan = [];
      if (essentialsCut > 0 && leverRows.length) plan.push("Reduce " + leverRows[0].label + " by " + formatMoneyNoSymbol(combinedSplit[0] ? combinedSplit[0].requiredChange : leverRows[0].requiredChange) + " as the primary correction lever.");
      if (combinedSplit.length > 1) plan.push("Apply the combined correction split: " + combinedSplit.map(function (c) { return c.label + " " + formatMoneyNoSymbol(c.requiredChange); }).join(", ") + ".");
      if (incomeGap > 0) plan.push("Increase income by " + formatMoneyNoSymbol(incomeGap) + " (conservative baseline) to reach the stable threshold if costs cannot move enough.");
      plan.push("Hold new fixed commitments until the classification stays Stable under the Combined moderate stress scenario.");
      if (bufferMonths > 0) plan.push("Build the buffer target of " + formatMoneyNoSymbol(bufferTarget) + " using your selected buffer depth of " + bufferMonths.toFixed(1) + " months.");
      plan.push("Re-run this tool after any change to housing, transport, commitments, or income reliability.");
      plan.push("If Borderline or Underprepared persists, stop discretionary expansion and focus on the top two levers first.");

      const planHtml = "<ol class=\"di-actions-list\">" +
        plan.slice(0, 7).map(function (p) { return "<li>" + p + "</li>"; }).join("") +
        "</ol>";

      if (proHeadline) proHeadline.textContent = headlineText;
      if (proCore) proCore.textContent = coreText;
      if (proStability) proStability.textContent = stabilityText;
      if (proLevers) proLevers.innerHTML = leverTableHtml;
      if (proSensitivity) proSensitivity.innerHTML = sensitivityHtml;
      if (proCombined) proCombined.innerHTML = combinedHtml;
      if (proNextActions) proNextActions.innerHTML = nextActionsHtml;
      if (proPlan) proPlan.innerHTML = planHtml;

      // Build output HTML
      // Example:
      // const html = `<p><strong>Result:</strong> ${formatNumberTwoDecimals(result)}</p>`;
      const html =
        "<p><strong>" + headlineText + "</strong></p>" +
        "<p>Coverage ratio: " + formatRatio(ratio) + ". Monthly margin: " + formatMoneyNoSymbol(monthlyMargin) + ".</p>" +
        "<p><strong>Stable target:</strong> income increase " + formatMoneyNoSymbol(incomeGap) + " or essentials decrease " + formatMoneyNoSymbol(essentialsCut) + ".</p>" +
        "<p><strong>Buffer target (adjusted):</strong> " + formatMoneyNoSymbol(bufferTarget) + ".</p>";

      // Output
      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const url = window.location.href;
      const message = "Income vs Essentials Planner Pro" + "\n" + url;
      window.location.href = "https://wa.me/?text=" + encodeURIComponent(message);
    });
  }
});
