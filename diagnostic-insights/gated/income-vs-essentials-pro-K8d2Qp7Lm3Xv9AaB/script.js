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

  // ------------------------------------------------------------
  // 2) SAFE HELPERS (SELF-CONTAINED)
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
    return Math.round(n).toLocaleString("en-US");
  }

  function formatTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function formatRatio(x) {
    if (!Number.isFinite(x)) return "";
    return formatTwoDecimals(x) + "x";
  }

  function formatInputWithCommas(raw) {
    // Keep digits, commas, one dot allowed (for decimals inputs like reliability/buffer)
    const s = String(raw || "").replace(/[^\d.,]/g, "");
    if (s === "") return "";

    // If it contains a dot, do not comma-format aggressively (keep user intent)
    const hasDot = s.includes(".");
    const cleaned = s.replace(/,/g, "");

    if (hasDot) {
      // Limit to one dot
      const parts = cleaned.split(".");
      const left = parts[0] || "0";
      const right = (parts[1] || "").replace(/\./g, "");
      // Add commas to left only
      const leftNum = left.replace(/^0+(?=\d)/, "");
      const leftFmt = (leftNum === "" ? "0" : leftNum).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return leftFmt + "." + right;
    }

    // Integer formatting
    const digits = cleaned.replace(/\./g, "");
    const leftNum = digits.replace(/^0+(?=\d)/, "");
    const leftFmt = (leftNum === "" ? "0" : leftNum).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return leftFmt;
  }

  // ------------------------------------------------------------
  // 3) RESULT HELPERS
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

  function clearPaidOutputsIfInvalid() {
    if (proHeadline) proHeadline.textContent = "Run the analysis to generate your results.";
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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 4) LIVE FORMATTING
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
  attachLiveFormatting(commitmentsNumber);

  // ------------------------------------------------------------
  // 5) RANGE <-> NUMBER BINDING
  // ------------------------------------------------------------
  function bindRangeAndNumber(rangeEl, numberEl, min, max, decimals) {
    if (!rangeEl || !numberEl) return;

    const d = Number.isFinite(decimals) ? decimals : 0;

    function toText(v) {
      if (!Number.isFinite(v)) return "";
      if (d > 0) return v.toFixed(d);
      return formatWithCommas(v);
    }

    function setBoth(next) {
      const c = clamp(next, min, max);
      rangeEl.value = String(c);
      numberEl.value = toText(c);
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

    const initial = parseLooseNumber(rangeEl.value);
    setBoth(Number.isFinite(initial) ? initial : min);
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 0);
  bindRangeAndNumber(housingRange, housingNumber, 0, 250000, 0);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 80000, 0);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 120000, 0);
  bindRangeAndNumber(transportRange, transportNumber, 0, 120000, 0);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 120000, 0);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.5, 1.0, 2);
  bindRangeAndNumber(variabilityRange, variabilityNumber, 0, 40, 0);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 500000, 0);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12, 1);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 30, 0);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 50, 100, 0);

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = parseLooseNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const medical = parseLooseNumber(medicalNumber ? medicalNumber.value : "");

      const reliability = parseLooseNumber(reliabilityNumber ? reliabilityNumber.value : "");
      const variabilityPct = parseLooseNumber(variabilityNumber ? variabilityNumber.value : "");
      const commitments = parseLooseNumber(commitmentsNumber ? commitmentsNumber.value : "");
      const bufferMonths = parseLooseNumber(bufferMonthsNumber ? bufferMonthsNumber.value : "");
      const errorMarginPct = parseLooseNumber(errorMarginNumber ? errorMarginNumber.value : "");
      const confidencePct = parseLooseNumber(confidenceNumber ? confidenceNumber.value : "");

      if (
        !incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !medicalNumber ||
        !reliabilityNumber || !variabilityNumber || !commitmentsNumber || !bufferMonthsNumber || !errorMarginNumber || !confidenceNumber
      ) return;

      clearResult();

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

      const summarySentence =
        classification + ". Conservative coverage ratio is " + formatRatio(coverageRatio) +
        " with a monthly margin of " + money(monthlyMargin) + ".";

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

      // Slot 8 panel
      if (proHeadline) proHeadline.textContent = classification + " (based on conservative coverage)";
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
              "<div class=\"di-lever-meta\">Share: " + formatTwoDecimals(x.sharePct) + "%</div>" +
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
      if (incomeIncreaseTarget > 0) plan.push("Close the Stable gap by increasing conservative income by " + money(incomeIncreaseTarget) + " if costs cannot move enough.");
      else plan.push("Maintain Stable by protecting conservative income against variability and reliability slippage.");

      if (essentialsDecreaseTarget > 0 && leverComputed.length > 0) {
        plan.push("Start with " + leverComputed[0].label + " because it has the largest share. Target " + money(leverComputed[0].requiredChange) + " change for a single lever route.");
      }

      if (combinedSplit.length > 0 && essentialsDecreaseTarget > 0) {
        plan.push("Use the combined split route for feasibility: " + combinedSplit.map(function (c) { return c.label + " " + money(c.requiredChange); }).join(", ") + ".");
      }

      plan.push("Do not add new fixed commitments until the Combined stress scenario remains Stable.");

      if (bufferMonths > 0) plan.push("Build the buffer target of " + money(bufferTarget) + " using your selected buffer depth of " + bufferMonths.toFixed(1) + " months.");
      else plan.push("Set a non-zero buffer depth to generate a buffer target and reduce fragility.");

      plan.push("Re-run this tool after changes to housing, transport, commitments, or reliability to confirm the Stable gap stays closed.");

      if (proPlan) {
        proPlan.innerHTML = plan.slice(0, 7).map(function (p) { return "<li>" + p + "</li>"; }).join("");
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE
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
