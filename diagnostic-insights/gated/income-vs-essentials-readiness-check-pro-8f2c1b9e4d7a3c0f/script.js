document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const incomeMonthlyPro = document.getElementById("incomeMonthlyPro");
  const incomeMonthlyProRange = document.getElementById("incomeMonthlyProRange");

  const incomeVariabilityPctPro = document.getElementById("incomeVariabilityPctPro");
  const incomeVariabilityPctProRange = document.getElementById("incomeVariabilityPctProRange");

  const payCycleDaysPro = document.getElementById("payCycleDaysPro");
  const payCycleDaysProRange = document.getElementById("payCycleDaysProRange");

  const housingPro = document.getElementById("housingPro");
  const housingProRange = document.getElementById("housingProRange");

  const utilitiesPro = document.getElementById("utilitiesPro");
  const utilitiesProRange = document.getElementById("utilitiesProRange");

  const foodPro = document.getElementById("foodPro");
  const foodProRange = document.getElementById("foodProRange");

  const transportPro = document.getElementById("transportPro");
  const transportProRange = document.getElementById("transportProRange");

  const insurancePro = document.getElementById("insurancePro");
  const insuranceProRange = document.getElementById("insuranceProRange");

  const debtMinPro = document.getElementById("debtMinPro");
  const debtMinProRange = document.getElementById("debtMinProRange");

  const dependentsPro = document.getElementById("dependentsPro");
  const dependentsProRange = document.getElementById("dependentsProRange");

  const irregularEssentialsPro = document.getElementById("irregularEssentialsPro");
  const irregularEssentialsProRange = document.getElementById("irregularEssentialsProRange");

  const expenseBufferPctPro = document.getElementById("expenseBufferPctPro");
  const expenseBufferPctProRange = document.getElementById("expenseBufferPctProRange");

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) {
      const stripped = String(raw || "").replace(/[^\d.,-]/g, "");
      return stripped;
    }
    return formatWithCommas(n);
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

  function bindRangeAndNumber(numberEl, rangeEl, opts) {
    if (!numberEl || !rangeEl) return;

    const min = typeof opts.min === "number" ? opts.min : Number(rangeEl.min);
    const max = typeof opts.max === "number" ? opts.max : Number(rangeEl.max);
    const allowDecimals = !!opts.allowDecimals;

    function normalizeAndSyncFromNumber() {
      const n = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(n)) return;

      const bounded = clamp(n, min, max);
      const finalVal = allowDecimals ? bounded : Math.round(bounded);

      numberEl.value = allowDecimals ? String(finalVal) : formatWithCommas(finalVal);
      rangeEl.value = String(finalVal);
    }

    function syncFromRange() {
      const n = Number(rangeEl.value);
      if (!Number.isFinite(n)) return;
      numberEl.value = allowDecimals ? String(n) : formatWithCommas(n);
    }

    numberEl.addEventListener("input", function () {
      numberEl.value = formatInputWithCommas(numberEl.value);
    });

    numberEl.addEventListener("blur", function () {
      normalizeAndSyncFromNumber();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        normalizeAndSyncFromNumber();
        numberEl.blur();
      }
    });

    rangeEl.addEventListener("input", function () {
      syncFromRange();
      clearResult();
    });

    if (opts.defaultValue !== undefined) {
      const d = Number(opts.defaultValue);
      if (Number.isFinite(d)) {
        const bounded = clamp(d, min, max);
        rangeEl.value = String(bounded);
        numberEl.value = allowDecimals ? String(bounded) : formatWithCommas(bounded);
      }
    }
  }

  bindRangeAndNumber(incomeMonthlyPro, incomeMonthlyProRange, { min: 0, max: 500000, defaultValue: 30000 });
  bindRangeAndNumber(incomeVariabilityPctPro, incomeVariabilityPctProRange, { min: 0, max: 60, defaultValue: 15 });
  bindRangeAndNumber(payCycleDaysPro, payCycleDaysProRange, { min: 7, max: 45, defaultValue: 30 });

  bindRangeAndNumber(housingPro, housingProRange, { min: 0, max: 250000, defaultValue: 12000 });
  bindRangeAndNumber(utilitiesPro, utilitiesProRange, { min: 0, max: 100000, defaultValue: 2000 });
  bindRangeAndNumber(foodPro, foodProRange, { min: 0, max: 150000, defaultValue: 4500 });
  bindRangeAndNumber(transportPro, transportProRange, { min: 0, max: 150000, defaultValue: 2500 });
  bindRangeAndNumber(insurancePro, insuranceProRange, { min: 0, max: 150000, defaultValue: 2000 });
  bindRangeAndNumber(debtMinPro, debtMinProRange, { min: 0, max: 250000, defaultValue: 3000 });
  bindRangeAndNumber(dependentsPro, dependentsProRange, { min: 0, max: 8, defaultValue: 0 });
  bindRangeAndNumber(irregularEssentialsPro, irregularEssentialsProRange, { min: 0, max: 250000, defaultValue: 2000 });
  bindRangeAndNumber(expenseBufferPctPro, expenseBufferPctProRange, { min: 0, max: 40, defaultValue: 12 });

  function validateNonNegativeFinite(n, label) {
    if (!Number.isFinite(n) || n < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositiveFinite(n, label) {
    if (!Number.isFinite(n) || n <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateRange(n, label, min, max) {
    if (!Number.isFinite(n) || n < min || n > max) {
      setResultError("Enter a valid " + label + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeMonthlyPro ? incomeMonthlyPro.value : "");
      const incomeVarPct = parseLooseNumber(incomeVariabilityPctPro ? incomeVariabilityPctPro.value : "");
      const payCycleDays = parseLooseNumber(payCycleDaysPro ? payCycleDaysPro.value : "");

      const housing = parseLooseNumber(housingPro ? housingPro.value : "");
      const utilities = parseLooseNumber(utilitiesPro ? utilitiesPro.value : "");
      const food = parseLooseNumber(foodPro ? foodPro.value : "");
      const transport = parseLooseNumber(transportPro ? transportPro.value : "");
      const insurance = parseLooseNumber(insurancePro ? insurancePro.value : "");
      const debtMin = parseLooseNumber(debtMinPro ? debtMinPro.value : "");
      const dependents = parseLooseNumber(dependentsPro ? dependentsPro.value : "");
      const irregular = parseLooseNumber(irregularEssentialsPro ? irregularEssentialsPro.value : "");
      const bufferPct = parseLooseNumber(expenseBufferPctPro ? expenseBufferPctPro.value : "");

      if (
        !incomeMonthlyPro || !incomeVariabilityPctPro || !payCycleDaysPro ||
        !housingPro || !utilitiesPro || !foodPro || !transportPro || !insurancePro ||
        !debtMinPro || !dependentsPro || !irregularEssentialsPro || !expenseBufferPctPro
      ) return;

      if (!validatePositiveFinite(income, "monthly income")) return;
      if (!validateRange(incomeVarPct, "income variability", 0, 60)) return;
      if (!validateRange(payCycleDays, "pay cycle length", 7, 45)) return;

      if (!validateNonNegativeFinite(housing, "housing")) return;
      if (!validateNonNegativeFinite(utilities, "utilities")) return;
      if (!validateNonNegativeFinite(food, "food essentials")) return;
      if (!validateNonNegativeFinite(transport, "transport")) return;
      if (!validateNonNegativeFinite(insurance, "insurance")) return;
      if (!validateNonNegativeFinite(debtMin, "minimum debt payments")) return;
      if (!validateRange(dependents, "dependents count", 0, 8)) return;
      if (!validateNonNegativeFinite(irregular, "irregular essentials")) return;
      if (!validateRange(bufferPct, "expense buffer", 0, 40)) return;

      const essentialsDetailed = housing + utilities + food + transport + insurance + debtMin + irregular;
      if (!Number.isFinite(essentialsDetailed) || essentialsDetailed <= 0) {
        setResultError("Your essential expenses total must be greater than 0.");
        return;
      }

      const reliableIncome = income * (1 - incomeVarPct / 100);
      const bufferedEssentials = essentialsDetailed * (1 + bufferPct / 100);

      if (!Number.isFinite(reliableIncome) || !Number.isFinite(bufferedEssentials) || bufferedEssentials <= 0) {
        setResultError("Inputs produced an invalid result. Re-check your numbers.");
        return;
      }

      const ratio = reliableIncome / bufferedEssentials;
      const ratioRounded = (Math.round(ratio * 100) / 100).toFixed(2);

      const shortfall = Math.max(0, bufferedEssentials - reliableIncome);
      const surplus = Math.max(0, reliableIncome - bufferedEssentials);

      let status = "";
      if (ratio < 1.0) status = "Underprepared";
      else if (ratio < 1.15) status = "Borderline";
      else status = "Stable";

      const topCosts = [
        { k: "Housing", v: housing },
        { k: "Food essentials", v: food },
        { k: "Debt minimums", v: debtMin },
        { k: "Transport", v: transport },
        { k: "Insurance", v: insurance },
        { k: "Utilities", v: utilities },
        { k: "Irregular essentials", v: irregular }
      ].sort(function (a, b) { return b.v - a.v; });

      const top3 = topCosts.slice(0, 3);

      const costShare1 = bufferedEssentials > 0 ? (top3[0].v / essentialsDetailed) : 0;
      const costShare2 = bufferedEssentials > 0 ? (top3[1].v / essentialsDetailed) : 0;
      const costShare3 = bufferedEssentials > 0 ? (top3[2].v / essentialsDetailed) : 0;

      const volatilityPressure = incomeVarPct + bufferPct;
      let volatilityLabel = "Low";
      if (volatilityPressure >= 25 && volatilityPressure < 45) volatilityLabel = "Medium";
      if (volatilityPressure >= 45) volatilityLabel = "High";

      const levers = [];
      if (ratio < 1.0) {
        levers.push("Reduce non-essential outflows to stop structural leakage while you stabilise the core.");
        levers.push("Restructure minimum obligations where possible so the baseline becomes coverable.");
        levers.push("Increase reliable income, not best-case income, using the lowest-variance option available.");
      } else if (ratio < 1.15) {
        levers.push("Build margin first. Thin coverage fails when timing or small costs shift.");
        levers.push("Trim the single largest essential driver if it is compressible, even slightly.");
        levers.push("Reduce variability exposure by aligning bills to pay cycle timing.");
      } else {
        levers.push("Protect margin. Avoid fixed-commitment creep that converts surplus into fragility.");
        levers.push("Use surplus to reduce constraint drivers and volatility exposure.");
        levers.push("Turn irregular essentials into planned allocations so they stop being surprises.");
      }

      const stabilityTargetRatio = volatilityLabel === "Low" ? 1.15 : (volatilityLabel === "Medium" ? 1.25 : 1.35);
      const requiredReliableIncomeForTarget = bufferedEssentials * stabilityTargetRatio;
      const incomeGapToTarget = Math.max(0, requiredReliableIncomeForTarget - reliableIncome);

      const decisionHint = ratio < 1.0
        ? "Your current structure does not cover essentials. The best decision is the one that closes the gap fastest with the least long-term damage."
        : (ratio < 1.15
          ? "You have coverage, but not resilience. Decisions should prioritise margin creation before growth or new commitments."
          : "You have resilience. Decisions can shift from survival optimisation to stability maintenance and long-term improvement.");

      const reportHtml = `
        <div class="di-report">
          <p class="di-kicker">Generated from your inputs. This report measures baseline readiness only and does not assess shocks or future commitments.</p>

          <h3>1. Results summary</h3>
          <p><strong>Status:</strong> ${status}. Your coverage ratio (reliable income ÷ buffered essentials) is <strong>${ratioRounded}</strong>. This is the core signal for whether the baseline structure stands on its own.</p>
          <p>Your reliable income was calculated by applying an income variability adjustment to your monthly income. That adjustment exists because readiness depends on what you can count on, not what you sometimes receive. Your essential structure was calculated from your detailed essential categories plus irregular essentials and minimum debt payments, then increased by an expense buffer to reflect ordinary volatility and undercounting.</p>
          <p>${shortfall > 0 ? "You have a structural shortfall of " + formatWithCommas(shortfall) + " after adjustments. That shortfall must be paid for by debt, delayed payments, skipped necessities, or depleted savings, which is why it is classified as underprepared." : "You have an adjusted surplus margin of " + formatWithCommas(surplus) + " after adjustments. That margin is what determines whether disruptions become crises or inconveniences."}</p>

          <h3>2. Metric-by-metric interpretation</h3>
          <p><strong>Coverage ratio:</strong> ${ratioRounded}. Ratios below 1.00 indicate the baseline cannot be covered. Ratios slightly above 1.00 can still be fragile when timing and volatility are present. Higher ratios indicate more resilience and more choice in decision making.</p>
          <p><strong>Income reliability:</strong> Your variability setting reduces effective income because a variable income stream behaves like a smaller reliable income stream. If income variability is high, even a decent headline income can produce borderline or underprepared outcomes. Reliability matters because essentials arrive on schedule regardless of income timing.</p>
          <p><strong>Expense realism:</strong> The buffer increases essential costs because people routinely underestimate essentials, especially when irregular items exist. If the buffered essentials number surprises you, that is not a model problem. It is a signal that the baseline structure may be tighter than you think.</p>

          <h3>3. Causality analysis</h3>
          <p>Your essential structure is driven primarily by the largest essential categories. In your case, the biggest three drivers are ${top3[0].k}, ${top3[1].k}, and ${top3[2].k}. These are the categories that create the most leverage for change because small percentage shifts in large categories move the outcome more than large shifts in tiny categories.</p>
          <p>The top three categories represent roughly ${Math.round((costShare1 + costShare2 + costShare3) * 100)} percent of your detailed essentials total. That concentration means your outcome is not caused by dozens of small decisions. It is caused by a few dominant constraints. A realistic plan focuses on dominant constraints first, because spreading effort across everything usually produces no measurable result.</p>
          <p>Volatility pressure is classified as ${volatilityLabel} based on the combination of income variability and expense buffer. Higher volatility pressure increases the ratio needed for stability because it increases the odds that a normal month deviates from the average month. The more your life behaves like a series of uneven months, the more margin you need to stay stable.</p>

          <h3>4. Constraint diagnosis</h3>
          <p>Constraints are the elements of your structure that are hardest to change quickly. Housing and minimum obligations are common constraints because they are locked by contracts, location, or prior commitments. When a constraint is hard to change, the plan must either reduce pressure elsewhere or increase reliable income so the constraint becomes affordable.</p>
          <p>Timing is a hidden constraint. A pay cycle of ${formatWithCommas(payCycleDays)} days interacts with bill timing. If essentials are due before income arrives, the structure can fail even when the monthly numbers look acceptable. That is why readiness is not only about totals. It is also about cash flow timing across the month.</p>
          <p>Dependents increase baseline load by increasing the probability and frequency of irregular essentials. The diagnostic does not assume a specific dependent cost, but it treats dependents as a risk amplifier. If dependents are present, thin margins are more fragile, because unexpected needs are more likely to occur.</p>

          <h3>5. Action prioritisation</h3>
          <p>Priority should be assigned by leverage and friction. High leverage means changing it moves the outcome. Low friction means it can be changed without major collateral damage. The best near-term actions are the ones that materially move the ratio with minimal long-term cost.</p>
          <p>Recommended priority actions for your classification are:</p>
          <ul class="di-metric-list">
            <li>${levers[0]}</li>
            <li>${levers[1]}</li>
            <li>${levers[2]}</li>
          </ul>
          <p>Within essentials, target the largest category that is even slightly compressible. A small reduction in a large category can outperform a large reduction in a small category. If essentials are already tight, the next best lever is improving income reliability rather than chasing higher best-case income.</p>

          <h3>6. Stability conditions</h3>
          <p>Stability is not the same as coverage. Stability means you can absorb ordinary variability without immediately defaulting to crisis behavior. Given your volatility pressure, a conservative stability target ratio is approximately <strong>${stabilityTargetRatio.toFixed(2)}</strong>. That is the ratio at which small disruptions are less likely to push you into shortfall.</p>
          <p>To reach that target at your current buffered essential level, your reliable income would need to be approximately <strong>${formatWithCommas(requiredReliableIncomeForTarget)}</strong>. The implied gap to that stability target is <strong>${formatWithCommas(incomeGapToTarget)}</strong>. This number is not a prediction. It is a condition: if you want stability at this volatility level, this is the reliable income requirement unless expenses fall.</p>
          <p>If reducing volatility pressure is easier than increasing income, stability can be achieved by lowering variability and buffers through structural improvements: smoothing irregular essentials with planned allocations, aligning bill timing to pay timing, and reducing exposure to cost spikes. Stability is a system property, not a motivational state.</p>

          <h3>7. Decision framing</h3>
          <p>${decisionHint}</p>
          <p>When underprepared, decisions should be evaluated against a single gate: does this action reduce the gap in a durable way? When borderline, decisions should be evaluated against a margin gate: does this action increase reliable surplus or reduce volatility exposure? When stable, decisions should be evaluated against a preservation gate: does this action convert resilience into fragility through new fixed commitments?</p>
          <p>Use the ratio as a discipline mechanism. If you are considering a new commitment, re-run the inputs with that commitment included as an essential-like outflow. If the ratio falls into borderline or underprepared, the commitment is not affordable in baseline terms. This is how you prevent future instability before it becomes a problem.</p>
        </div>
      `;

      setResultSuccess(reportHtml);
    });
  }

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
