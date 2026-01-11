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
  const foodNumber = document.getElementById("foodNumber");
  const foodRange = document.getElementById("foodRange");
  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");
  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");
  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");
  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");
  const variabilityNumber = document.getElementById("variabilityNumber");
  const variabilityRange = document.getElementById("variabilityRange");
  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");
  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");
  const confidenceNumber = document.getElementById("confidenceNumber");
  const confidenceRange = document.getElementById("confidenceRange");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Example:
  // const modeSelect = document.getElementById("modeSelect");
  // const modeBlockA = document.getElementById("modeBlockA");
  // const modeBlockB = document.getElementById("modeBlockB");

  if (
    !calculateButton || !resultDiv || !shareButton ||
    !incomeNumber || !incomeRange ||
    !housingNumber || !housingRange ||
    !utilitiesNumber || !utilitiesRange ||
    !foodNumber || !foodRange ||
    !transportNumber || !transportRange ||
    !debtNumber || !debtRange ||
    !commitmentsNumber || !commitmentsRange ||
    !reliabilityNumber || !reliabilityRange ||
    !variabilityNumber || !variabilityRange ||
    !bufferMonthsNumber || !bufferMonthsRange ||
    !errorMarginNumber || !errorMarginRange ||
    !confidenceNumber || !confidenceRange
  ) {
    return;
  }

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
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtNumber);
  attachLiveFormatting(commitmentsNumber);
  attachLiveFormatting(reliabilityNumber);
  attachLiveFormatting(variabilityNumber);
  attachLiveFormatting(bufferMonthsNumber);
  attachLiveFormatting(errorMarginNumber);
  attachLiveFormatting(confidenceNumber);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT PATTERN)
  // ------------------------------------------------------------
  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.textContent = message;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.remove("error");
    resultDiv.textContent = "";
  }

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF MODES ARE USED)
  // ------------------------------------------------------------
  function showMode(modeValue) {
    // If modes exist, toggle sections here
    // Example:
    // if (modeBlockA) modeBlockA.style.display = modeValue === "a" ? "block" : "none";
    // if (modeBlockB) modeBlockB.style.display = modeValue === "b" ? "block" : "none";
  }

  // ------------------------------------------------------------
  // 3) DI HELPERS (LOCAL, REQUIRED)
  // ------------------------------------------------------------
  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(value) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round(value);
    return rounded.toLocaleString("en-US");
  }

  function formatTwoDecimals(value) {
    if (!Number.isFinite(value)) return "";
    return value.toFixed(2);
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return "";
    return formatWithCommas(n);
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const safeDefault = clamp(Number(defaultValue), min, max);
    rangeEl.value = String(safeDefault);
    numberEl.value = formatWithCommas(safeDefault);

    rangeEl.addEventListener("input", function () {
      const v = clamp(Number(rangeEl.value), min, max);
      numberEl.value = formatWithCommas(v);
    });

    function commitNumberToRange() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        numberEl.value = formatWithCommas(clamp(Number(rangeEl.value), min, max));
        return;
      }
      const v = clamp(typed, min, max);
      rangeEl.value = String(v);
      numberEl.value = formatWithCommas(v);
    }

    numberEl.addEventListener("blur", commitNumberToRange);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberToRange();
      }
    });
  }

  function readInputs() {
    return {
      income: parseLooseNumber(incomeNumber.value),
      housing: parseLooseNumber(housingNumber.value),
      utilities: parseLooseNumber(utilitiesNumber.value),
      food: parseLooseNumber(foodNumber.value),
      transport: parseLooseNumber(transportNumber.value),
      debt: parseLooseNumber(debtNumber.value),
      commitments: parseLooseNumber(commitmentsNumber.value),
      reliability: parseLooseNumber(reliabilityNumber.value),
      variability: parseLooseNumber(variabilityNumber.value),
      bufferMonths: parseLooseNumber(bufferMonthsNumber.value),
      errorMargin: parseLooseNumber(errorMarginNumber.value),
      confidence: parseLooseNumber(confidenceNumber.value),
    };
  }

  // ------------------------------------------------------------
  // 4) INITIALISE INPUTS (RANGE + NUMBER PAIRS)
  // ------------------------------------------------------------
  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000, 100, 60000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 250000, 100, 20000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 100000, 50, 3000);
  bindRangeAndNumber(foodRange, foodNumber, 0, 150000, 50, 6000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 150000, 50, 5000);
  bindRangeAndNumber(debtRange, debtNumber, 0, 200000, 50, 3000);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 250000, 50, 2000);
  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.5, 1, 0.01, 0.85);
  bindRangeAndNumber(variabilityRange, variabilityNumber, 0, 40, 1, 10);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12, 1, 2);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 30, 1, 8);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 0, 100, 1, 70);

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError(fieldLabel + " must be greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError(fieldLabel + " must be 0 or higher.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) CALCULATION + RENDER
  // ------------------------------------------------------------
  calculateButton.addEventListener("click", function () {
      const inputs = readInputs();

      const income = clamp(inputs.income, 0, 500000);
      const housing = clamp(inputs.housing, 0, 250000);
      const utilities = clamp(inputs.utilities, 0, 100000);
      const food = clamp(inputs.food, 0, 150000);
      const transport = clamp(inputs.transport, 0, 150000);
      const debt = clamp(inputs.debt, 0, 200000);
      const commitments = clamp(inputs.commitments, 0, 250000);

      const reliability = clamp(inputs.reliability, 0.5, 1.0);
      const variability = clamp(inputs.variability, 0, 40);
      const bufferMonths = clamp(inputs.bufferMonths, 0, 12);
      const errorMargin = clamp(inputs.errorMargin, 0, 30);
      const confidence = clamp(inputs.confidence, 0, 100);

      const bufferTarget = (housing + utilities + food + transport + debt + commitments) * (1 + (errorMargin / 100)) * bufferMonths;

      if (!Number.isFinite(income) || income < 0) {
        setResultError("Income must be 0 or higher.");
        return;
      }
      if (!Number.isFinite(reliability) || reliability < 0.5 || reliability > 1.0) {
        setResultError("Income reliability must be between 0.50 and 1.00.");
        return;
      }
      if (!Number.isFinite(variability) || variability < 0 || variability > 40) {
        setResultError("Income variability must be between 0 and 40.");
        return;
      }
      if (!Number.isFinite(bufferMonths) || bufferMonths < 0 || bufferMonths > 12) {
        setResultError("Target buffer months must be between 0 and 12.");
        return;
      }
      if (!Number.isFinite(errorMargin) || errorMargin < 0 || errorMargin > 30) {
        setResultError("Estimation error margin must be between 0 and 30.");
        return;
      }
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
        setResultError("Estimation confidence must be between 0 and 100.");
        return;
      }
      if (housing < 0 || utilities < 0 || food < 0 || transport < 0 || debt < 0 || commitments < 0) {
        setResultError("Expense inputs must be 0 or higher.");
        return;
      }
      const essentialsTotalCheck = housing + utilities + food + transport + debt + commitments;
      if (!Number.isFinite(essentialsTotalCheck) || essentialsTotalCheck <= 0) {
        setResultError("Essentials must be greater than 0.");
        return;
      }

      const essentialsTotal = housing + utilities + food + transport + debt;
      const baseEssentialsPlusCommitments = essentialsTotal + commitments;

      const variabilityFactor = clamp(1 - (variability / 100), 0, 1);
      const effectiveIncome = income * reliability * variabilityFactor;

      const cautionFactor = 1 + (errorMargin / 100);
      const stressEssentials = baseEssentialsPlusCommitments * cautionFactor;

      const coverageRatio = stressEssentials > 0 ? (effectiveIncome / stressEssentials) : NaN;
      const monthlyMargin = effectiveIncome - stressEssentials;

      const gapToBreakeven = Math.max(0, stressEssentials - effectiveIncome);
      const stableTargetRatio = 1.25;
      const targetEffectiveIncomeForStable = stressEssentials * stableTargetRatio;
      const gapToStable = Math.max(0, targetEffectiveIncomeForStable - effectiveIncome);

      let classification = "Borderline";
      if (!isFinite(coverageRatio)) {
        classification = "Invalid";
      } else if (coverageRatio < 1.0) {
        classification = "Underprepared";
      } else if (coverageRatio < stableTargetRatio) {
        classification = "Borderline";
      } else {
        classification = "Stable";
      }

      const driverCandidates = [
        { key: "Housing essentials", value: housing },
        { key: "Non-negotiable commitments", value: commitments },
        { key: "Debt minimums", value: debt },
        { key: "Food essentials", value: food },
        { key: "Transport essentials", value: transport },
        { key: "Utilities", value: utilities },
      ];

      const topDrivers = driverCandidates
        .slice()
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((d) => ({ label: d.key, value: d.value }));

      resultDiv.classList.remove("error");
      resultDiv.classList.add("success");

      const driverList = topDrivers.map((d) => `<li>${d.label}: ${formatWithCommas(d.value)}</li>`).join("");

      const html = `
        <div class="di-report">
          <div class="di-report-section">
            <h3 class="di-report-title">1) Results Summary</h3>
            <p>Your classification is <strong>${classification}</strong>. Treat this as a structural description of how the month behaves, not a judgement and not a prediction. A structure can look “fine” on paper while still being exposed to small variance, and a structure can look tight while still being fixable if the main pressure point is identified.</p>
            <p>The paid result adjusts the baseline view into a more realistic posture by applying the reliability and variability context to income, and by applying an estimation caution margin to essentials and commitments. The goal is simple: interpret whether the month holds when optimistic assumptions are removed.</p>
            <p>If the outcome is underprepared, the month is structurally short and requires gap closure before optimisation. If the outcome is borderline, the month can hold under narrow conditions but breaks under normal drift. If the outcome is stable, the base is workable, but stability still depends on protecting margin and avoiding new fixed obligations that silently compress it.</p>
          </div>

          <div class="di-report-section">
            <h3 class="di-report-title">2) Metric-by-Metric Interpretation</h3>
            <p><strong>Coverage ratio</strong> (${formatTwoDecimals(coverageRatio)}x) is the core signal: effective income divided by stress-tested essentials. Coverage below 1.00 means the structure fails before discretionary spend enters. Coverage near 1.00 means the month is highly sensitive to small errors, irregular costs, or income dips. Coverage comfortably above 1.00 is the baseline condition for stability, but it is not a guarantee of comfort.</p>
            <p><strong>Effective income</strong> (${formatWithCommas(effectiveIncome)}) is what income looks like after accounting for reliability and variability. This is not pessimism for its own sake. It is a way to interpret how much of the stated income can be treated as dependable capacity. If reliability is lower or variability is higher, the same headline income produces less stable coverage.</p>
            <p><strong>Stress-tested essentials</strong> (${formatWithCommas(stressEssentials)}) apply your estimation error margin to essentials and commitments. This matters because underestimation is normal, especially when irregular essentials are blended into “miscellaneous” or when commitments creep upward over time. Stress-testing prevents a false pass that later collapses when real costs show up.</p>
            <p><strong>Monthly margin</strong> (${formatWithCommas(monthlyMargin)}) is the practical breathing room after stress-tested essentials. A positive margin is what allows buffer building and protects against drift. A small positive margin can still be fragile if it is easily consumed by minor variance. A negative margin means stability is mathematically blocked until income rises, essentials fall, or both.</p>
            <p><strong>Gap to baseline break-even</strong> (${formatWithCommas(gapToBreakeven)}) is how far the structure is from coverage of 1.00 under the cautious assumptions used here. It is not a precise target, because input confidence affects how much weight you should place on it, but it is a useful direction signal. If this gap is large, micro-optimisation typically fails because it cannot move the dominant driver enough.</p>
            <p><strong>Buffer target</strong> (${formatWithCommas(bufferTarget)}) is the size implied by your chosen buffer months, using stress-tested essentials as the base. This is not a recommendation. It is a feasibility anchor. If monthly margin is small, the time required to build this buffer becomes long, which increases exposure to shocks in the interim.</p>
          </div>

          <div class="di-report-section">
            <h3 class="di-report-title">3) Causality Analysis</h3>
            <p>This outcome occurred because the structure is a relationship, not a number: dependable income capacity must exceed the costs that behave like essentials. When reliability and variability reduce effective income, and when estimation caution increases stress-tested essentials, thin structures tend to shift from “looks fine” into “fragile” quickly.</p>
            <p>The biggest contributors are typically the largest essentials categories, because they dominate the denominator of the coverage ratio. In your case, the top drivers are listed below. Drivers are not “bad categories.” They are leverage categories. A small percentage change in a driver category moves the whole outcome more than a large percentage change in a small category.</p>
            <p>Primary causes are the categories and assumptions that move the ratio meaningfully: high fixed essentials, high commitments, low reliability, or high variability. Secondary contributors are smaller categories that matter mainly when you are close to a threshold. If the result is underprepared, focus first on primary causes. If borderline, both primary causes and drift control matter, because small contributors can be enough to break the month.</p>
            <ul class="di-driver-list">${driverList}</ul>
          </div>

          <div class="di-report-section">
            <h3 class="di-report-title">4) Constraint Diagnosis</h3>
            <p>Some parts of the structure are constrained unless you make a structural change. Fixed commitments and large essentials like housing often cannot be adjusted quickly. When a cost is rigid, it behaves differently from a discretionary category. This is why “cut small things” can feel productive while the overall result barely moves.</p>
            <p>Incremental improvements are still useful, but they must be proportional to the gap. If the gap to break-even is meaningful, incremental trims usually cannot close it unless they are aimed at a driver category. Conversely, if the structure is close to break-even, incremental changes can be enough, but only if they are protected from drift.</p>
            <p>False fixes are changes that reduce discomfort but do not change readiness. Examples include cutting a small category while leaving the main driver untouched, or treating a temporary income boost as permanent capacity. Another false fix is relying on optimism in estimates. If confidence is low, treat results cautiously and assume underestimation risk is present.</p>
          </div>

          <div class="di-report-section">
            <h3 class="di-report-title">5) Action Prioritisation Logic</h3>
            <p>Action 1 should come before Action 2 because readiness changes in sequence. First the month must hold under realistic conditions. Only then does it make sense to allocate effort to building resilience. If you try to build buffer while the structure is still short, the buffer is usually erased by the next shortfall.</p>
            <p>Income-side corrections increase capacity, but they only help if the income is reliable enough to behave like baseline capacity. Essentials-side corrections reduce the pressure in the denominator and tend to be more dependable if they are structural. The tradeoff is that income can sometimes be improved faster, while essentials are sometimes more controllable over time.</p>
            <p>If only one lever is pulled, results depend on which lever you choose. If you only push income while essentials drift, the structure may not improve. If you only cut essentials while income remains unreliable, the structure may still be fragile. The correct sequence is to stabilize the base relationship and then protect it through constraints management and drift control.</p>
          </div>

          <div class="di-report-section">
            <h3 class="di-report-title">6) Stability Conditions</h3>
            <p>Stability holds only while key conditions remain true. The first condition is that effective income remains dependable enough to cover stress-tested essentials. If reliability drops or variability rises, effective income shrinks and the same lifestyle becomes less viable.</p>
            <p>The second condition is that essentials and commitments do not drift upward faster than income capacity. Drift is often invisible because it arrives as small monthly increases that accumulate. A stable structure can become borderline without any single “big mistake” if fixed costs quietly climb.</p>
            <p>Time sensitivity matters. Short-term stability can be supported by temporary actions, but sustained stability requires changes that persist. If the structure relies on one-off income events, it tends to revert. If the structure relies on a thin margin, it tends to break when a normal irregular cost appears.</p>
          </div>

          <div class="di-report-section">
            <h3 class="di-report-title">7) Decision Framing</h3>
            <p>Use this result to decide what kinds of commitments are safe to add, and what tradeoffs you should make when choosing between options. The question is not “can I pay this in a good month.” The question is “does this keep the month stable under normal friction.”</p>
            <p>If you are underprepared, treat new fixed costs as structurally unsafe until the gap is closed. If borderline, treat new fixed costs as risk amplifiers that can push you into shortfall. If stable, treat new fixed costs as a decision that must be re-tested, because stability is a condition, not a permanent state.</p>
            <p>This tool avoids prescriptive budgeting and investment advice on purpose. It is about interpretation, sequencing, and risk awareness. The correct next step is to align decisions with the structure: first make the base hold, then build margin, then protect stability against drift and variability.</p>
          </div>

          <div class="di-report-footnote">
            <p><strong>Snapshot:</strong> Effective income ${formatWithCommas(effectiveIncome)} vs stress-tested essentials ${formatWithCommas(stressEssentials)}. Coverage ${formatTwoDecimals(coverageRatio)}x. Margin ${formatWithCommas(monthlyMargin)}.</p>
          </div>
        </div>
      `;

      resultDiv.innerHTML = html;
  });

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT PATTERN)
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
