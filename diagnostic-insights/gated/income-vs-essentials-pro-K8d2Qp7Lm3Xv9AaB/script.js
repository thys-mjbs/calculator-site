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
  //   showMode(modeSelect.value);
  //   modeSelect.addEventListener("change", function () {
  //     showMode(modeSelect.value);
  //   });
  // }
  

  // ------------------------------------------------------------
  // Helpers required for DI binding and parsing
  // ------------------------------------------------------------
  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const s = String(value).replace(/,/g, "").trim();
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    return formatNumber(Math.round(n));
  }

  function formatRatio(x) {
    if (!Number.isFinite(x)) return "";
    return formatNumberTwoDecimals(x) + "x";
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, decimals) {
    if (!rangeEl || !numberEl) return;

    const d = Number.isFinite(decimals) ? decimals : 0;

    function toFixedSafe(v) {
      if (!Number.isFinite(v)) return "";
      return d > 0 ? v.toFixed(d) : formatWithCommas(v);
    }

    function setBoth(next) {
      const c = clamp(next, min, max);
      rangeEl.value = String(c);
      numberEl.value = toFixedSafe(c);
    }

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      setBoth(v);
    });

    function commitTyped() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        setBoth(parseLooseNumber(rangeEl.value));
        return;
      }
      setBoth(typed);
    }

    numberEl.addEventListener("blur", commitTyped);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commitTyped();
    });

    setBoth(parseLooseNumber(rangeEl.value));
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 100, 0);
  bindRangeAndNumber(housingRange, housingNumber, 0, 250000, 100, 0);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 80000, 100, 0);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 120000, 100, 0);
  bindRangeAndNumber(transportRange, transportNumber, 0, 120000, 100, 0);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 120000, 100, 0);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.5, 1.0, 0.01, 2);
  bindRangeAndNumber(variabilityRange, variabilityNumber, 0, 40, 1, 0);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 500000, 1000, 0);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12, 0.5, 1);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 30, 1, 0);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 50, 100, 1, 0);

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

  function clearPaidOutputsIfInvalid() {
    if (proHeadline) proHeadline.textContent = "Run the analysis to generate your paid results.";
    if (proEssentials) proEssentials.textContent = "";
    if (proConservativeIncome) proConservativeIncome.textContent = "";
    if (proRatio) proRatio.textContent = "";
    if (proMargin) proMargin.textContent = "";
    if (proTargets) proTargets.textContent = "";
    if (proBuffer) proBuffer.textContent = "";
    if (proLevers) proLevers.innerHTML = "";
    if (proSensitivity) proSensitivity.innerHTML = "";
    if (proCombined) proCombined.textContent = "";
    if (proPlan) proPlan.innerHTML = "";
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

      const reliability = parseLooseNumber(reliabilityNumber ? reliabilityNumber.value : "");
      const variabilityPct = toNumber(variabilityNumber ? variabilityNumber.value : "");
      const commitments = toNumber(commitmentsNumber ? commitmentsNumber.value : "");
      const bufferMonths = parseLooseNumber(bufferMonthsNumber ? bufferMonthsNumber.value : "");
      const errorMarginPct = toNumber(errorMarginNumber ? errorMarginNumber.value : "");
      const confidencePct = toNumber(confidenceNumber ? confidenceNumber.value : "");

      // Basic existence guard (optional but recommended)
      // Example:
      // if (!inputA || !inputB) return;
      if (!incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !medicalNumber) return;
      if (!reliabilityNumber || !variabilityNumber || !commitmentsNumber || !bufferMonthsNumber || !errorMarginNumber || !confidenceNumber) return;

      clearResult();

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!validateNonNegative(income, "monthly take-home income")) { clearPaidOutputsIfInvalid(); return; }
      if (!validateNonNegative(housing, "housing")) { clearPaidOutputsIfInvalid(); return; }
      if (!validateNonNegative(utilities, "utilities")) { clearPaidOutputsIfInvalid(); return; }
      if (!validateNonNegative(groceries, "groceries and essentials")) { clearPaidOutputsIfInvalid(); return; }
      if (!validateNonNegative(transport, "transport")) { clearPaidOutputsIfInvalid(); return; }
      if (!validateNonNegative(medical, "insurance and medical")) { clearPaidOutputsIfInvalid(); return; }

      if (!Number.isFinite(reliability) || reliability < 0.5 || reliability > 1.0) {
        setResultError("Enter a valid income reliability factor between 0.50 and 1.00.");
        clearPaidOutputsIfInvalid();
        return;
      }

      if (!Number.isFinite(variabilityPct) || variabilityPct < 0 || variabilityPct > 40) {
        setResultError("Enter a valid income variability percent between 0 and 40.");
        clearPaidOutputsIfInvalid();
        return;
      }

      if (!validateNonNegative(commitments, "non-negotiable commitments")) { clearPaidOutputsIfInvalid(); return; }

      if (!Number.isFinite(bufferMonths) || bufferMonths < 0 || bufferMonths > 12) {
        setResultError("Enter a valid target buffer depth between 0 and 12 months.");
        clearPaidOutputsIfInvalid();
        return;
      }

      if (!Number.isFinite(errorMarginPct) || errorMarginPct < 0 || errorMarginPct > 30) {
        setResultError("Enter a valid estimation error margin percent between 0 and 30.");
        clearPaidOutputsIfInvalid();
        return;
      }

      if (!Number.isFinite(confidencePct) || confidencePct < 50 || confidencePct > 100) {
        setResultError("Enter a valid estimation confidence percent between 50 and 100.");
        clearPaidOutputsIfInvalid();
        return;
      }

      const essentialsBase = housing + utilities + groceries + transport + medical;
      if (!Number.isFinite(essentialsBase) || essentialsBase <= 0) {
        setResultError("Enter essential expenses greater than 0.");
        clearPaidOutputsIfInvalid();
        return;
      }

      // Calculation logic
      const stableThresholdRatio = 1.25;

      const fixedTotal = essentialsBase + commitments;
      const costSafetyFactor = 1 + (errorMarginPct / 100);
      const adjustedEssentials = fixedTotal * costSafetyFactor;

      const incomeVolFactor = 1 - (variabilityPct / 100);
      const conservativeIncome = income * reliability * incomeVolFactor;

      const coverageRatio = conservativeIncome / adjustedEssentials;
      const monthlyMargin = conservativeIncome - adjustedEssentials;

      let classification = "Underprepared";
      if (coverageRatio >= stableThresholdRatio) classification = "Stable";
      else if (coverageRatio >= 1.0) classification = "Borderline";

      const incomeIncreaseTarget = Math.max(0, (adjustedEssentials * stableThresholdRatio) - conservativeIncome);
      const essentialsDecreaseTarget = Math.max(0, adjustedEssentials - (conservativeIncome / stableThresholdRatio));

      const confidenceFactor = 100 / confidencePct;
      const variabilityBufferFactor = 1 + (variabilityPct / 100) * 0.5;
      const bufferTarget = adjustedEssentials * bufferMonths * confidenceFactor * variabilityBufferFactor;

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
      const denom = Math.max(1, fixedTotal);

      const leverComputed = top5.map(function (l) {
        const sharePct = (l.amount / denom) * 100;
        const requiredChange = clamp(essentialsDecreaseTarget, 0, l.amount);
        return { label: l.key, amount: l.amount, sharePct: sharePct, requiredChange: requiredChange };
      });

      function classifyScenario(sIncome, sEssentials) {
        const r = sIncome / sEssentials;
        let c = "Underprepared";
        if (r >= stableThresholdRatio) c = "Stable";
        else if (r >= 1.0) c = "Borderline";
        const incGap = Math.max(0, (sEssentials * stableThresholdRatio) - sIncome);
        const essCut = Math.max(0, sEssentials - (sIncome / stableThresholdRatio));
        return { ratio: r, classification: c, incomeGap: incGap, essentialsCut: essCut };
      }

      const s1 = classifyScenario(conservativeIncome * 0.90, adjustedEssentials);
      const s2 = classifyScenario(conservativeIncome, adjustedEssentials * 1.10);
      const s3 = classifyScenario(conservativeIncome * 0.93, adjustedEssentials * 1.07);

      const scenarios = [
        { name: "Income stress (10% drop)", result: s1 },
        { name: "Cost stress (10% increase)", result: s2 },
        { name: "Combined stress (7% + 7%)", result: s3 }
      ];

      const top3 = leverComputed.slice(0, 3);
      const sumTop3 = top3.reduce(function (acc, x) { return acc + x.amount; }, 0);

      const combinedSplit = top3.map(function (x) {
        const portion = sumTop3 > 0 ? (x.amount / sumTop3) : 0;
        const req = essentialsDecreaseTarget * portion;
        return { label: x.label, requiredChange: clamp(req, 0, x.amount) };
      });

      function money(n) { return formatWithCommas(n); }

      // Render Slot 2 summary result
      const summarySentence = classification + ". Conservative coverage ratio is " + formatRatio(coverageRatio) + " with a monthly margin of " + money(monthlyMargin) + ".";
      const actions = [];
      actions.push("To reach Stable: increase income by " + money(incomeIncreaseTarget) + " or reduce essentials by " + money(essentialsDecreaseTarget) + ".");
      if (leverComputed.length > 0) {
        actions.push("Largest lever is " + leverComputed[0].label + ". Single lever change to reach Stable is " + money(leverComputed[0].requiredChange) + ".");
      } else {
        actions.push("Add at least one positive lever amount to generate lever ranking.");
      }

      const resultHtml =
        "<p><strong>" + classification + "</strong></p>" +
        "<p>" + summarySentence + "</p>" +
        "<ul><li>" + actions[0] + "</li><li>" + actions[1] + "</li></ul>";

      // Render Slot 8 paid panel
      if (proHeadline) {
        proHeadline.textContent = classification + " (based on conservative coverage)";
      }
      if (proEssentials) proEssentials.textContent = money(adjustedEssentials);
      if (proConservativeIncome) proConservativeIncome.textContent = money(conservativeIncome);
      if (proRatio) proRatio.textContent = formatRatio(coverageRatio);
      if (proMargin) proMargin.textContent = money(monthlyMargin);

      if (proTargets) {
        proTargets.textContent =
          "Stable threshold is " + formatRatio(stableThresholdRatio) +
          ". Income increase target is " + money(incomeIncreaseTarget) +
          ". Essentials decrease target is " + money(essentialsDecreaseTarget) + ".";
      }

      if (proBuffer) {
        proBuffer.textContent =
          "Buffer target is " + money(bufferTarget) +
          " based on " + bufferMonths.toFixed(1) + " months, confidence " + Math.round(confidencePct) +
          "%, error margin " + Math.round(errorMarginPct) + "%, and variability " + Math.round(variabilityPct) + "%.";
      }

      if (proLevers) {
        proLevers.innerHTML = leverComputed.map(function (x) {
          return (
            "<div class=\"di-lever-item\">" +
              "<div class=\"di-lever-title\">" + x.label + "</div>" +
              "<div class=\"di-lever-meta\">Share: " + formatNumberTwoDecimals(x.sharePct) + "%</div>" +
              "<div class=\"di-lever-meta\">Required change (single lever): " + money(x.requiredChange) + "</div>" +
            "</div>"
          );
        }).join("");
      }

      if (proSensitivity) {
        proSensitivity.innerHTML = scenarios.map(function (s) {
          return (
            "<div class=\"di-scenario\">" +
              "<div class=\"di-scenario-title\">" + s.name + "</div>" +
              "<div class=\"di-scenario-meta\">Classification: " + s.result.classification + "</div>" +
              "<div class=\"di-scenario-meta\">Income increase: " + money(s.result.incomeGap) + "</div>" +
              "<div class=\"di-scenario-meta\">Essentials decrease: " + money(s.result.essentialsCut) + "</div>" +
            "</div>"
          );
        }).join("");
      }

      if (proCombined) {
        if (combinedSplit.length === 0) {
          proCombined.textContent = "Add at least one positive lever amount to generate a combined correction option.";
        } else {
          proCombined.textContent =
            "Split the essentials decrease target across top levers: " +
            combinedSplit.map(function (c) { return c.label + " " + money(c.requiredChange); }).join(", ") + ".";
        }
      }

      const plan = [];
      if (incomeIncreaseTarget > 0) {
        plan.push("Close the Stable gap by increasing conservative income by " + money(incomeIncreaseTarget) + " if costs cannot move enough.");
      } else {
        plan.push("Maintain Stable by protecting conservative income against variability and reliability slippage.");
      }

      if (essentialsDecreaseTarget > 0 && leverComputed.length > 0) {
        plan.push("Start with " + leverComputed[0].label + " because it has the largest share. Target " + money(leverComputed[0].requiredChange) + " change for a single lever route.");
      }

      if (combinedSplit.length > 0 && essentialsDecreaseTarget > 0) {
        plan.push("Use the combined split route for feasibility: " + combinedSplit.map(function (c) { return c.label + " " + money(c.requiredChange); }).join(", ") + ".");
      }

      plan.push("Do not add new fixed commitments until the Combined stress scenario remains Stable.");
      if (bufferMonths > 0) {
        plan.push("Build the buffer target of " + money(bufferTarget) + " using your selected buffer depth of " + bufferMonths.toFixed(1) + " months.");
      } else {
        plan.push("Set a non-zero buffer depth to generate a buffer target and reduce fragility.");
      }

      plan.push("Re-run this tool after changes to housing, transport, commitments, or reliability to confirm the Stable gap stays closed.");

      if (proPlan) {
        proPlan.innerHTML = plan.slice(0, 7).map(function (p) { return "<li>" + p + "</li>"; }).join("");
      }

      // Output
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
