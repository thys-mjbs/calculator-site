document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const income = document.getElementById("income");
  const housing = document.getElementById("housing");
  const utilities = document.getElementById("utilities");
  const food = document.getElementById("food");
  const transport = document.getElementById("transport");
  const debtMin = document.getElementById("debtMin");
  const insuranceMedical = document.getElementById("insuranceMedical");
  const dependents = document.getElementById("dependents");
  const otherEssentials = document.getElementById("otherEssentials");
  const irregularAvg = document.getElementById("irregularAvg");
  const bufferPct = document.getElementById("bufferPct");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  [OPTIONAL_MODE_BINDINGS_BLOCK]

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  function formatInputWithCommas(raw) {
    if (typeof raw !== "string") return "";
    const cleaned = raw.replace(/,/g, "").trim();
    if (cleaned === "") return "";
    if (cleaned === "-" || cleaned === "." || cleaned === "-.") return raw;
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return raw.replace(/[^\d,.-]/g, "");
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  attachLiveFormatting(income);
  attachLiveFormatting(housing);
  attachLiveFormatting(utilities);
  attachLiveFormatting(food);
  attachLiveFormatting(transport);
  attachLiveFormatting(debtMin);
  attachLiveFormatting(insuranceMedical);
  attachLiveFormatting(dependents);
  attachLiveFormatting(otherEssentials);
  attachLiveFormatting(irregularAvg);
  attachLiveFormatting(bufferPct);

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
    [SHOW_MODE_BLOCK]

    clearResult();
  }

  [MODE_INIT_BLOCK]

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

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      [READ_MODE_BLOCK]

      const incomeVal = toNumber(income ? income.value : "");
      const housingVal = toNumber(housing ? housing.value : "");
      const utilitiesVal = toNumber(utilities ? utilities.value : "");
      const foodVal = toNumber(food ? food.value : "");
      const transportVal = toNumber(transport ? transport.value : "");
      const debtMinVal = toNumber(debtMin ? debtMin.value : "");
      const insuranceMedicalVal = toNumber(insuranceMedical ? insuranceMedical.value : "");
      const dependentsVal = toNumber(dependents ? dependents.value : "");
      const otherEssentialsVal = toNumber(otherEssentials ? otherEssentials.value : "");
      const irregularAvgVal = toNumber(irregularAvg ? irregularAvg.value : "");
      const bufferPctValRaw = toNumber(bufferPct ? bufferPct.value : "");

      if (!income || !housing || !utilities || !food || !transport || !debtMin || !insuranceMedical || !dependents || !otherEssentials || !irregularAvg || !bufferPct) return;

      if (!validateNonNegative(incomeVal, "monthly take-home income")) return;
      if (!validateNonNegative(housingVal, "housing")) return;
      if (!validateNonNegative(utilitiesVal, "utilities")) return;
      if (!validateNonNegative(foodVal, "food and basic household")) return;
      if (!validateNonNegative(transportVal, "transport")) return;
      if (!validateNonNegative(debtMinVal, "minimum debt payments")) return;
      if (!validateNonNegative(insuranceMedicalVal, "insurance and medical basics")) return;
      if (!validateNonNegative(dependentsVal, "dependents essentials")) return;
      if (!validateNonNegative(otherEssentialsVal, "other essentials")) return;
      if (!validateNonNegative(irregularAvgVal, "non-monthly essentials averaged monthly")) return;

      if (!Number.isFinite(bufferPctValRaw) || bufferPctValRaw < 0 || bufferPctValRaw > 50) {
        setResultError("Enter a valid buffer target percent between 0 and 50.");
        return;
      }

      const bufferPctVal = clamp(bufferPctValRaw, 0, 50);
      const bufferMultiplier = 1 + bufferPctVal / 100;

      const essentialsTotal =
        housingVal +
        utilitiesVal +
        foodVal +
        transportVal +
        debtMinVal +
        insuranceMedicalVal +
        dependentsVal +
        otherEssentialsVal +
        irregularAvgVal;

      if (!validatePositive(essentialsTotal, "essentials total")) return;

      const requiredIncome = essentialsTotal * bufferMultiplier;
      const coverageRatio = incomeVal / requiredIncome;

      if (!Number.isFinite(coverageRatio)) {
        setResultError("Unable to calculate a valid coverage ratio. Check inputs.");
        return;
      }

      const borderlineThreshold = 1.0;
      const stableThreshold = 1.15;

      let status = "";
      let oneLine = "";

      if (coverageRatio < borderlineThreshold) {
        status = "Underprepared";
        oneLine = "Income does not cover essentials plus the chosen buffer. The baseline is structurally short.";
      } else if (coverageRatio < stableThreshold) {
        status = "Borderline";
        oneLine = "Income covers essentials, but the margin is thin. Normal variance can break stability.";
      } else {
        status = "Stable";
        oneLine = "Income covers essentials plus a meaningful buffer. The baseline is resilient to normal variance.";
      }

      const margin = incomeVal - requiredIncome;
      const gapToBorderline = Math.max(0, requiredIncome - incomeVal);
      const requiredForStable = requiredIncome * stableThreshold;
      const gapToStable = Math.max(0, requiredForStable - incomeVal);

      const drivers = [
        { k: "Housing", v: housingVal },
        { k: "Utilities", v: utilitiesVal },
        { k: "Food and basic household", v: foodVal },
        { k: "Transport", v: transportVal },
        { k: "Minimum debt payments", v: debtMinVal },
        { k: "Insurance and medical basics", v: insuranceMedicalVal },
        { k: "Dependents essentials", v: dependentsVal },
        { k: "Other essentials", v: otherEssentialsVal },
        { k: "Irregular essentials (monthly avg)", v: irregularAvgVal }
      ].sort(function (a, b) { return b.v - a.v; });

      const top1 = drivers[0];
      const top2 = drivers[1];
      const top3 = drivers[2];

      const top1Pct = (top1.v / essentialsTotal) * 100;
      const top2Pct = (top2.v / essentialsTotal) * 100;
      const top3Pct = (top3.v / essentialsTotal) * 100;

      const marginPctOfEssentials = (margin / essentialsTotal) * 100;

      const constraintNotes = [];
      if (debtMinVal > 0 && debtMinVal / essentialsTotal >= 0.18) {
        constraintNotes.push("Debt minimums are consuming a large share of essentials, which can trap the system by reducing flexibility.");
      }
      if (housingVal > 0 && housingVal / essentialsTotal >= 0.35) {
        constraintNotes.push("Housing is dominant in the essentials mix, meaning stability depends heavily on one line item staying controlled.");
      }
      if (incomeVal > 0 && coverageRatio < 1.05) {
        constraintNotes.push("The coverage ratio is close to the failure line, which makes normal month-to-month variance the main threat, not rare emergencies.");
      }
      if (irregularAvgVal > 0 && irregularAvgVal / essentialsTotal >= 0.12) {
        constraintNotes.push("Irregular essentials are material, so stability requires deliberate smoothing or sinking-fund behavior.");
      }
      if (constraintNotes.length === 0) {
        constraintNotes.push("No single structural trap dominates, which means the fastest improvement is usually a targeted change to the biggest driver and a protected margin rule.");
      }

      const prioritisedActions = [];
      if (status === "Underprepared") {
        prioritisedActions.push("First target: close the baseline gap. Either increase reliable monthly income by " + formatWithCommas(gapToBorderline) + " or reduce essentials by the same order of magnitude.");
        prioritisedActions.push("Second target: create a protected margin rule so the first improvement is not immediately absorbed by drift in essentials.");
        prioritisedActions.push("Third target: focus on the biggest driver (" + top1.k + ") because moving the largest line item changes the whole ratio faster than many small cuts.");
      } else if (status === "Borderline") {
        prioritisedActions.push("First target: build a small protected margin. Treat " + formatWithCommas(Math.max(0, Math.round(requiredIncome * 0.05))) + " as a minimum monthly breathing-room goal.");
        prioritisedActions.push("Second target: reduce volatility. Add controls to the top driver (" + top1.k + ") and the second driver (" + top2.k + ") because they determine how often the margin is breached.");
        prioritisedActions.push("Third target: reduce constraint pressure from fixed obligations, especially if debt or housing dominates the essentials mix.");
      } else {
        prioritisedActions.push("First target: protect the margin. Do not let essentials drift upward as income changes, or stability will quietly revert to borderline.");
        prioritisedActions.push("Second target: allocate margin intentionally. Use a fixed rule to split margin into buffer building, debt acceleration, and capability improvement.");
        prioritisedActions.push("Third target: validate stability conditions by testing what happens if income drops or a major essential increases, then set limits that keep the ratio above the stability line.");
      }

      const stabilityConditions = [];
      const maxEssentialsForBorderline = incomeVal / bufferMultiplier;
      const maxEssentialsForStable = incomeVal / (bufferMultiplier * stableThreshold);

      stabilityConditions.push("Baseline holds when essentials (including irregular average) stay at or below " + formatWithCommas(Math.max(0, maxEssentialsForBorderline)) + " with the current buffer target.");
      stabilityConditions.push("Stable holds when essentials stay at or below " + formatWithCommas(Math.max(0, maxEssentialsForStable)) + " with the current buffer target and the stability threshold applied.");
      stabilityConditions.push("If essentials rise, the required income rises one-for-one. If income falls, the required essentials ceiling falls one-for-one. Stability is symmetric and mechanical.");
      stabilityConditions.push("The buffer target is a stability tax. Increasing the buffer raises the required income even if essentials do not change, which is correct when the system has high variance.");

      const decisionFrames = [];
      decisionFrames.push("If the gap is small, prioritise controllability. A small controllable cut to a big driver can outperform a risky attempt to raise income quickly.");
      decisionFrames.push("If the gap is large, prioritise reliability. A stable income improvement plus a fixed obligations reduction is usually the only durable path.");
      decisionFrames.push("If stable, prioritise protection. The main enemy becomes drift, not shortage. Stability is lost through slow expansion of essentials, not one-time events.");

      const reportHtml =
        '<div class="di-report">' +
          '<div class="di-summary">' +
            '<p class="di-p"><strong>Readiness:</strong> ' + status + ' (coverage ratio ' + formatTwoDecimals(coverageRatio) + ')</p>' +
            '<p class="di-p">' + oneLine + '</p>' +
            '<div class="di-pill-row">' +
              '<span class="di-pill">Essentials total: ' + formatWithCommas(essentialsTotal) + '</span>' +
              '<span class="di-pill">Required income: ' + formatWithCommas(requiredIncome) + '</span>' +
              '<span class="di-pill">Margin: ' + formatWithCommas(margin) + '</span>' +
              '<span class="di-pill">Buffer: ' + formatTwoDecimals(bufferPctVal) + '%</span>' +
            '</div>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">1) Results summary</div>' +
            '<p class="di-p">This result is about structural readiness, not optimism. The tool compares take-home income to the full essentials base, then applies a buffer target that represents normal variance and unavoidable friction. When the coverage ratio is below the baseline line, stability is mathematically impossible without either income rising or essentials falling. When the ratio is near the line, stability becomes a timing and variance problem even if the month can be paid.</p>' +
            '<p class="di-p">Your essentials base is the sum of housing, utilities, food, transport, minimum debt, insurance and medical basics, dependents essentials, other essentials, and an averaged monthly allowance for irregular essentials. This definition is deliberately strict because a system only becomes stable when the costs that must be paid are clearly separated from costs that can be delayed. If the essentials base is understated, the ratio will overstate readiness and you will feel the difference later.</p>' +
            '<p class="di-p">With the current buffer target, the required income is the essentials base multiplied by the buffer factor. That required income is the threshold you have to clear to call the baseline stable. The margin value is the immediate breathing room after essentials and buffer are accounted for. If that margin is small or negative, the system is either in failure or one variance event away from it.</p>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">2) Metric-by-metric interpretation</div>' +
            '<p class="di-p">Coverage ratio is the master metric. It answers one question: how many times income covers the buffered essentials requirement. A ratio of 1.00 means the baseline is exactly met, which is not comfort, it is a knife-edge. A ratio above the stable threshold means the baseline can absorb normal swings without constant corrective behaviour. A ratio below 1.00 means the month is structurally short and the gap will be paid for by debt, missed payments, or erosion of future months.</p>' +
            '<p class="di-p">Essentials total is the load your income must carry before any discretionary choices exist. The most important part of essentials is not the number itself, but how concentrated it is. Concentration creates fragility because one cost dominates outcomes. The top drivers here are ' + top1.k + ', ' + top2.k + ', and ' + top3.k + '. Together they represent a large share of the essentials load and will determine whether any plan works in practice.</p>' +
            '<p class="di-p">Buffer target percent is the realism lever. It is not an emergency fund, it is the monthly variability allowance. Raising the buffer increases required income even if essentials stay constant. That is correct when income is irregular or expenses are volatile. Lowering the buffer reduces required income, but it does not remove variance. If the system is borderline, a low buffer can produce false stability that collapses as soon as a normal month is slightly worse than average.</p>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">3) Causality analysis</div>' +
            '<p class="di-p">The biggest cause of readiness outcomes is the gap between fixed obligations and reliable income, not the presence of discretionary spending. This is why breaking essentials into drivers matters. In your mix, ' + top1.k + ' is the leading driver at about ' + formatTwoDecimals(top1Pct) + ' percent of essentials, followed by ' + top2.k + ' at about ' + formatTwoDecimals(top2Pct) + ' percent, then ' + top3.k + ' at about ' + formatTwoDecimals(top3Pct) + ' percent. If you change the largest driver, the ratio shifts faster than trying to micro-optimise small categories.</p>' +
            '<p class="di-p">A second causal factor is obligation rigidity. Some categories can be adjusted within 30 days, others cannot. Housing and debt minimums are often sticky, which means they function as constraints rather than choices. When a sticky category is large, it sets the floor of the system. That floor determines how much income is required before any stability is possible. If the floor is too high relative to income, the system forces coping mechanisms such as payment delays, borrowing, or cutting essentials, none of which are stable states.</p>' +
            '<p class="di-p">A third causal factor is the interaction between irregular essentials and buffer. Irregular essentials are real costs that arrive on uneven schedules. Averaging them monthly is a corrective against false stability. If irregular essentials are material, the system needs either dedicated sinking behaviour or a higher buffer. Without one of those, the month can look fine on paper and still collapse when the irregular cost arrives.</p>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">4) Constraint diagnosis</div>' +
            '<p class="di-p">Constraints are the elements that make improvement hard even when intent is strong. The most common constraints are fixed obligations, income variability, and concentration in one or two dominant categories. When constraints dominate, the correct strategy is not motivation or tracking, it is structural change to the constraint itself. This is why the best first move is usually the one that changes the biggest fixed driver or increases reliable income without adding fragility.</p>' +
            '<p class="di-p">' + constraintNotes[0] + '</p>' +
            '<p class="di-p">' + (constraintNotes[1] ? constraintNotes[1] : "A practical way to identify a constraint is to ask what costs cannot be reduced quickly, and what income cannot be relied on. Those two answers are the limiting factors. Improvements that do not touch the limit often feel busy but do not shift the outcome.") + '</p>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">5) Action prioritisation</div>' +
            '<p class="di-p">The goal is a sequence that changes outcomes without creating new instability. Priority one is always moving the system away from the failure line. Priority two is protecting the improvement so it does not get absorbed by drift. Priority three is reducing the sensitivity of the system to variance. This is why “cut everything a little” often fails, while “change one major driver and lock the gain” works.</p>' +
            '<p class="di-p">' + prioritisedActions[0] + '</p>' +
            '<p class="di-p">' + prioritisedActions[1] + ' ' + prioritisedActions[2] + '</p>' +
            '<ul class="di-list">' +
              '<li>Largest driver to target first: ' + top1.k + ' (' + formatWithCommas(top1.v) + ')</li>' +
              '<li>Second driver to stabilise: ' + top2.k + ' (' + formatWithCommas(top2.v) + ')</li>' +
              '<li>Third driver to watch: ' + top3.k + ' (' + formatWithCommas(top3.v) + ')</li>' +
            '</ul>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">6) Stability conditions</div>' +
            '<p class="di-p">Stability is a set of conditions, not a feeling. The condition is that income must stay above the buffered essentials requirement, and the resulting margin must be large enough to absorb normal variance. When the margin is small, the system demands constant intervention. When the margin is protected, the system becomes predictable and planning becomes possible. These conditions are mechanical and can be monitored over time.</p>' +
            '<p class="di-p">' + stabilityConditions[0] + '</p>' +
            '<p class="di-p">' + stabilityConditions[1] + ' ' + stabilityConditions[2] + ' ' + stabilityConditions[3] + '</p>' +
            '<div class="di-kv">' +
              '<div class="di-k">Income</div><div class="di-v">' + formatWithCommas(incomeVal) + '</div>' +
              '<div class="di-k">Essentials total</div><div class="di-v">' + formatWithCommas(essentialsTotal) + '</div>' +
              '<div class="di-k">Required income (buffered)</div><div class="di-v">' + formatWithCommas(requiredIncome) + '</div>' +
              '<div class="di-k">Margin percent of essentials</div><div class="di-v">' + formatTwoDecimals(marginPctOfEssentials) + '%</div>' +
              '<div class="di-k">Gap to baseline</div><div class="di-v">' + formatWithCommas(gapToBorderline) + '</div>' +
              '<div class="di-k">Gap to stable</div><div class="di-v">' + formatWithCommas(gapToStable) + '</div>' +
            '</div>' +
          '</div>' +

          '<div class="di-section">' +
            '<div class="di-h3">7) Decision framing</div>' +
            '<p class="di-p">This diagnostic is designed to force a decision structure. The wrong decision is the one that makes you feel temporarily better without changing the mechanics. The right decision is the one that shifts the ratio or reduces the system’s sensitivity to variance. You should choose changes that are controllable, repeatable, and do not create new hidden obligations.</p>' +
            '<p class="di-p">' + decisionFrames[0] + '</p>' +
            '<p class="di-p">' + decisionFrames[1] + ' ' + decisionFrames[2] + '</p>' +
          '</div>' +
        '</div>';

      setResultSuccess(reportHtml);
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
