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

  const debtMinNumber = document.getElementById("debtMinNumber");
  const debtMinRange = document.getElementById("debtMinRange");

  const insuranceNumber = document.getElementById("insuranceNumber");
  const insuranceRange = document.getElementById("insuranceRange");

  const medicalNumber = document.getElementById("medicalNumber");
  const medicalRange = document.getElementById("medicalRange");

  const dependentsNumber = document.getElementById("dependentsNumber");
  const dependentsRange = document.getElementById("dependentsRange");

  const subscriptionsNumber = document.getElementById("subscriptionsNumber");
  const subscriptionsRange = document.getElementById("subscriptionsRange");

  const irregularNumber = document.getElementById("irregularNumber");
  const irregularRange = document.getElementById("irregularRange");

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
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtMinNumber);
  attachLiveFormatting(insuranceNumber);
  attachLiveFormatting(medicalNumber);
  attachLiveFormatting(dependentsNumber);
  attachLiveFormatting(subscriptionsNumber);
  attachLiveFormatting(irregularNumber);

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
  // 4) MODE HANDLING (OPTIONAL)
  // ------------------------------------------------------------
  function showMode(modeValue) {
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
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ----------------------------------------------
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

  // ------------------------------------------------------------
  // 6) MAIN CALC BUTTON HANDLER (CONSISTENT)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !incomeNumber || !incomeRange ||
        !housingNumber || !housingRange ||
        !utilitiesNumber || !utilitiesRange ||
        !foodNumber || !foodRange ||
        !transportNumber || !transportRange ||
        !debtMinNumber || !debtMinRange ||
        !insuranceNumber || !insuranceRange ||
        !medicalNumber || !medicalRange ||
        !dependentsNumber || !dependentsRange ||
        !subscriptionsNumber || !subscriptionsRange ||
        !irregularNumber || !irregularRange
      ) {
        return;
      }

      function parseLooseNumber(raw) {
        if (raw === null || raw === undefined) return NaN;
        const s = String(raw).trim().replace(/,/g, "");
        if (s === "") return NaN;
        const n = Number(s);
        return Number.isFinite(n) ? n : NaN;
      }

      function clamp(value, min, max) {
        if (!Number.isFinite(value)) return min;
        if (value < min) return min;
        if (value > max) return max;
        return value;
      }

      function formatNumberWithCommas(n) {
        if (!Number.isFinite(n)) return "";
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      function bindRangeAndNumber(rangeEl, numberEl) {
        if (!rangeEl || !numberEl) return;

        const min = Number(rangeEl.min);
        const max = Number(rangeEl.max);

        rangeEl.addEventListener("input", function () {
          const v = clamp(Number(rangeEl.value), min, max);
          numberEl.value = formatNumberWithCommas(v);
          clearResult();
        });

        function commitNumberToRange() {
          const typed = parseLooseNumber(numberEl.value);
          if (!Number.isFinite(typed)) {
            numberEl.value = formatNumberWithCommas(Number(rangeEl.value));
            return;
          }
          const v = clamp(typed, min, max);
          rangeEl.value = String(v);
          numberEl.value = formatNumberWithCommas(v);
        }

        numberEl.addEventListener("blur", function () {
          commitNumberToRange();
          clearResult();
        });

        numberEl.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            commitNumberToRange();
            clearResult();
          }
        });

        const initialTyped = parseLooseNumber(numberEl.value);
        if (Number.isFinite(initialTyped)) {
          const init = clamp(initialTyped, min, max);
          rangeEl.value = String(init);
          numberEl.value = formatNumberWithCommas(init);
        } else {
          const rv = clamp(Number(rangeEl.value), min, max);
          numberEl.value = formatNumberWithCommas(rv);
        }
      }

      function classifyRatio(r) {
        if (!Number.isFinite(r)) return { status: "Unknown" };
        if (r < 1.0) return { status: "Underprepared" };
        if (r < 1.2) return { status: "Borderline" };
        if (r < 1.5) return { status: "Stable" };
        return { status: "Robust" };
      }

      bindRangeAndNumber(incomeRange, incomeNumber);
      bindRangeAndNumber(housingRange, housingNumber);
      bindRangeAndNumber(utilitiesRange, utilitiesNumber);
      bindRangeAndNumber(foodRange, foodNumber);
      bindRangeAndNumber(transportRange, transportNumber);
      bindRangeAndNumber(debtMinRange, debtMinNumber);
      bindRangeAndNumber(insuranceRange, insuranceNumber);
      bindRangeAndNumber(medicalRange, medicalNumber);
      bindRangeAndNumber(dependentsRange, dependentsNumber);
      bindRangeAndNumber(subscriptionsRange, subscriptionsNumber);
      bindRangeAndNumber(irregularRange, irregularNumber);

      const income = parseLooseNumber(incomeNumber.value);
      const housing = parseLooseNumber(housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber.value);
      const food = parseLooseNumber(foodNumber.value);
      const transport = parseLooseNumber(transportNumber.value);
      const debtMin = parseLooseNumber(debtMinNumber.value);
      const insurance = parseLooseNumber(insuranceNumber.value);
      const medical = parseLooseNumber(medicalNumber.value);
      const dependents = parseLooseNumber(dependentsNumber.value);
      const subscriptions = parseLooseNumber(subscriptionsNumber.value);
      const irregular = parseLooseNumber(irregularNumber.value);

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing essentials")) return;
      if (!validateNonNegative(utilities, "utilities and services")) return;
      if (!validateNonNegative(food, "food essentials")) return;
      if (!validateNonNegative(transport, "transport essentials")) return;
      if (!validateNonNegative(debtMin, "minimum debt payments")) return;
      if (!validateNonNegative(insurance, "insurance essentials")) return;
      if (!validateNonNegative(medical, "medical baseline costs")) return;
      if (!validateNonNegative(dependents, "dependents essentials")) return;
      if (!validateNonNegative(subscriptions, "committed services")) return;
      if (!validateNonNegative(irregular, "irregular essentials")) return;

      const essentials =
        housing +
        utilities +
        food +
        transport +
        debtMin +
        insurance +
        medical +
        dependents +
        subscriptions +
        irregular;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0 to compute the coverage ratio.");
        return;
      }

      const ratio = income / essentials;
      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Inputs produced an invalid result. Check values and try again.");
        return;
      }

      const surplus = income - essentials;

      const classification = classifyRatio(ratio);

      const breakEvenIncome = essentials * 1.0;
      const stableIncome = essentials * 1.2;
      const robustIncome = essentials * 1.5;

      const gapBreakEven = Math.max(0, breakEvenIncome - income);
      const gapStable = Math.max(0, stableIncome - income);
      const gapRobust = Math.max(0, robustIncome - income);

      const maxEssentialsStable = income / 1.2;
      const maxEssentialsRobust = income / 1.5;

      const drivers = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food", value: food },
        { label: "Transport", value: transport },
        { label: "Debt minimums", value: debtMin },
        { label: "Insurance", value: insurance },
        { label: "Medical", value: medical },
        { label: "Dependents", value: dependents },
        { label: "Committed services", value: subscriptions },
        { label: "Irregular essentials", value: irregular }
      ].sort(function (a, b) { return b.value - a.value; });

      const top3 = drivers.slice(0, 3).map(function (x) {
        const share = essentials > 0 ? (x.value / essentials) * 100 : 0;
        return { label: x.label, value: x.value, share: share };
      });

      const top3Html = top3
        .map(function (x) {
          return `<li><strong>${x.label}:</strong> ${formatNumberWithCommas(Math.round(x.value))} (${x.share.toFixed(1)}% of essentials)</li>`;
        })
        .join("");

      const essentialsPct = (essentials / income) * 100;
      const surplusPct = (surplus / income) * 100;

      const resultHtml = `
        <div class="di-report">
          <h3 class="di-section-title">1) Results summary</h3>
          <p>This planner measures baseline readiness by comparing monthly income to essential obligations. The core signal is the coverage ratio, calculated as income divided by total essentials. A ratio above 1.00 means the month is structurally coverable. A ratio below 1.00 means the baseline is structurally in deficit and will require borrowing, drawdowns, delayed payments, or recurring tradeoffs to keep operating.</p>
          <p>Your coverage ratio is <strong>${ratio.toFixed(2)}</strong>, which places you in the <strong>${classification.status}</strong> band. Income is <strong>${formatNumberWithCommas(Math.round(income))}</strong> and essentials total <strong>${formatNumberWithCommas(Math.round(essentials))}</strong>, producing a monthly surplus or gap of <strong>${formatNumberWithCommas(Math.round(surplus))}</strong>. Surplus is the system's fuel. When it is small or negative, normal variance such as timing mismatches, price increases, or irregular essentials can push the month into deficit even if the numbers look close on paper.</p>
          <p>Use this as an operating condition, not a judgement. If the baseline is heavy, discipline alone does not solve the system because there is no room for error. If the baseline is viable, a simple surplus policy can create stability quickly. The objective is reliability: obligations are met without depending on perfect months, and the baseline stays stable even when irregular essentials arrive.</p>

          <h3 class="di-section-title">2) Metric-by-metric interpretation</h3>
          <p>The coverage ratio compresses the baseline into one relationship. Under 1.00 means obligations exceed income. Between 1.00 and 1.20 means coverage exists but margin is thin. Between 1.20 and 1.50 indicates a workable buffer where moderate volatility is survivable. Above 1.50 indicates robust room to absorb clustered expenses, timing mismatches, and modest shocks without needing new debt.</p>
          <p>At your current inputs, essentials are about <strong>${essentialsPct.toFixed(1)}%</strong> of income. Your monthly surplus is about <strong>${surplusPct.toFixed(1)}%</strong> of income. These percentages matter because they show how much income is committed before any discretionary choice. A high essentials percentage increases fragility. A lower essentials percentage increases optionality and reduces forced decisions.</p>
          <p>The stability ladder uses thresholds. Break even is ratio 1.00. A stable buffer target is ratio 1.20. A robust buffer target is ratio 1.50. These are conditions that describe how often you will be forced into reactive decisions. The closer you are to 1.00, the more you rely on luck and timing. The higher you are, the more you can rely on policy and repeatable systems.</p>

          <h3 class="di-section-title">3) Causality analysis</h3>
          <p>The ratio moves for only two reasons: income changes or essentials change. The practical question is which side is movable within your real constraints. The correct plan is usually not to cut everything. It is to identify the few drivers that are large enough to matter and adjustable within a realistic window. If you cannot move a driver within 30 to 90 days, it is a restructure, not a short-term lever.</p>
          <p>Your top three essentials drivers are listed below. These are the main causes of the current ratio because they contribute most to the denominator. If the top drivers are contract-locked, the plan must shift toward income reliability, renegotiation windows, or restructuring debt so minimums stop consuming the month. If the top drivers are adjustable, one focused change can meaningfully shift the ratio.</p>
          <p>Second-order causality matters. A heavy housing line can force higher transport and services. High debt minimums reduce flexibility and increase the probability of expensive short-term borrowing during irregular months. Irregular essentials are often underestimated and become the reason a month fails even when a typical month looks fine. Causality analysis prevents painful micro-cuts that do not change the operating condition.</p>
          <ul class="di-driver-list">${top3Html}</ul>

          <h3 class="di-section-title">4) Constraint diagnosis</h3>
          <p>Constraints are the factors that prevent rapid improvement. Housing, debt minimums, and contracted services are common hard constraints because they cannot be reduced instantly without penalties or timing windows. When one line dominates the essentials stack, the baseline is structurally heavy and the system will resist improvement until that line is addressed at the contract level.</p>
          <p>Concentration is a constraint signal. If most income is pre-committed, the plan must focus on restructuring rather than tracking. Another constraint is volatility exposure. If income timing is uncertain, a borderline ratio behaves like an underprepared ratio because the month can fail even when the average looks adequate. Treat timing risk as a separate constraint when deciding how aggressive to be.</p>
          <p>Classification guides the type of fix. Underprepared means remove deficit and stop compounding damage. Borderline means build margin so normal variance stops becoming a crisis. Stable means prevent essentials creep and convert surplus into buffers. Robust means maintain discipline while using surplus strategically rather than letting the baseline expand to match income.</p>

          <h3 class="di-section-title">5) Action prioritisation</h3>
          <p>Prioritisation is sequencing. If you try to optimise everything at once, nothing moves. Start with one structural lever and one reliability lever. Structural levers reduce the largest fixed drivers. Reliability levers make income more predictable or reduce exposure to irregular costs. Combined, they change the baseline operating condition faster than saving small amounts everywhere while the big drivers stay untouched.</p>
          <p>Use the drivers list as a targeting map. Choose the largest driver that is realistically adjustable in the next 30 to 90 days. If the largest driver is not adjustable short term, choose the next driver and, in parallel, work an income reliability move. Reliability beats spikes. A small reliable increase often improves stability more than a larger but uncertain increase that arrives inconsistently.</p>
          <p>Lock in a surplus rule immediately, even if the surplus is small. When the ratio is weak, surplus must be protected because it is the buffer against timing and irregular months. If the ratio is improving, direct surplus toward reducing constraints, especially high minimum payments. Avoid adding new fixed commitments while the ratio is weak. Fixed commitments lock fragility in place and undo progress.</p>

          <h3 class="di-section-title">6) Stability conditions</h3>
          <p>Stability conditions describe what must be true for the plan to keep working without constant intervention. At break even, you need near-perfect months and you have no room for timing mismatch. At stable buffer, you can absorb moderate volatility and most irregular essentials without forced borrowing. At robust buffer, you can handle clustered expenses and modest shocks while still meeting obligations and keeping your surplus rule intact.</p>
          <p>Based on your essentials total, break even income is <strong>${formatNumberWithCommas(Math.ceil(breakEvenIncome))}</strong>. Stable buffer income (ratio 1.20) is <strong>${formatNumberWithCommas(Math.ceil(stableIncome))}</strong>. Robust buffer income (ratio 1.50) is <strong>${formatNumberWithCommas(Math.ceil(robustIncome))}</strong>. The additional monthly income required is <strong>${formatNumberWithCommas(Math.ceil(gapBreakEven))}</strong> to break even, <strong>${formatNumberWithCommas(Math.ceil(gapStable))}</strong> to reach stable buffer, and <strong>${formatNumberWithCommas(Math.ceil(gapRobust))}</strong> to reach robust buffer.</p>
          <p>If income cannot move quickly, the alternative is to cap essentials. For stable buffer at current income, maximum essentials are <strong>${formatNumberWithCommas(Math.floor(maxEssentialsStable))}</strong>. For robust buffer, maximum essentials are <strong>${formatNumberWithCommas(Math.floor(maxEssentialsRobust))}</strong>. If current essentials exceed those caps, the baseline requires cost restructuring, contract renegotiation, or an income restructure rather than incremental tightening.</p>

          <h3 class="di-section-title">7) Decision framing</h3>
          <p>This output frames one decision: is this a budgeting problem or a baseline problem. Budgeting problems are solved by consistency once the baseline is structurally viable. Baseline problems require a bigger move such as housing change, debt restructure, contract renegotiation, or a reliable income lift. The ratio tells you which class of problem you are facing and prevents effort being spent on changes that cannot move the system.</p>
          <p>Use your classification as a constraint on future choices. Underprepared means do not take on new fixed costs. Borderline means do not treat surplus as disposable because a small shock can erase it. Stable means optimise deliberately but guard against essentials creep. Robust means absorb variance but keep surplus allocation explicit to avoid drifting back into fragility through lifestyle expansion.</p>
          <p>The best long-term outcome is not a higher income number on its own. It is a baseline that remains stable as conditions change. When you improve the ratio, you gain optionality. Optionality reduces forced decisions and increases the probability that future goals are achieved without destabilising the present. Keep the baseline honest, treat irregular essentials as real, and build policies that survive imperfect months.</p>
        </div>
      `;

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
