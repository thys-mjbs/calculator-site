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

  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");

  const medicalNumber = document.getElementById("medicalNumber");
  const medicalRange = document.getElementById("medicalRange");

  const insuranceNumber = document.getElementById("insuranceNumber");
  const insuranceRange = document.getElementById("insuranceRange");

  const childcareNumber = document.getElementById("childcareNumber");
  const childcareRange = document.getElementById("childcareRange");

  const otherEssentialsNumber = document.getElementById("otherEssentialsNumber");
  const otherEssentialsRange = document.getElementById("otherEssentialsRange");

  const incomeVarPctNumber = document.getElementById("incomeVarPctNumber");
  const incomeVarPctRange = document.getElementById("incomeVarPctRange");

  const targetMarginPctNumber = document.getElementById("targetMarginPctNumber");
  const targetMarginPctRange = document.getElementById("targetMarginPctRange");

  // ------------------------------------------------------------
  // 2) HELPERS (KEEP BASELINE NAMES)
  // ------------------------------------------------------------

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatPercent(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded) + "%";
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

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, allowZero) {
    if (!rangeEl || !numberEl) return;

    const minNum = Number(min);
    const maxNum = Number(max);

    function syncFromRange() {
      const r = parseLooseNumber(rangeEl.value);
      const clamped = clamp(r, minNum, maxNum);
      if (!Number.isFinite(clamped)) return;
      numberEl.value = formatWithCommas(clamped);
    }

    function commitNumberToRange() {
      const raw = numberEl.value;
      const n = parseLooseNumber(raw);

      if (!Number.isFinite(n)) {
        numberEl.value = "";
        rangeEl.value = String(minNum);
        return;
      }

      if (!allowZero && n === 0) {
        numberEl.value = "";
        rangeEl.value = String(minNum);
        return;
      }

      const clamped = clamp(n, minNum, maxNum);
      if (!Number.isFinite(clamped)) return;

      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
    }

    rangeEl.step = String(step);

    syncFromRange();

    rangeEl.addEventListener("input", function () {
      syncFromRange();
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      const cleaned = String(numberEl.value).replace(/[^\d,.-]/g, "");
      numberEl.value = cleaned;
      clearResult();
    });

    numberEl.addEventListener("blur", function () {
      commitNumberToRange();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberToRange();
      }
    });
  }

  function bindPercentRangeAndNumber(rangeEl, numberEl, min, max, step) {
    if (!rangeEl || !numberEl) return;

    const minNum = Number(min);
    const maxNum = Number(max);

    function syncFromRange() {
      const r = parseLooseNumber(rangeEl.value);
      const clamped = clamp(r, minNum, maxNum);
      if (!Number.isFinite(clamped)) return;
      numberEl.value = String(Math.round(clamped));
    }

    function commitNumberToRange() {
      const raw = String(numberEl.value).replace(/[^\d.-]/g, "");
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        numberEl.value = "";
        rangeEl.value = String(minNum);
        return;
      }
      const clamped = clamp(n, minNum, maxNum);
      rangeEl.value = String(clamped);
      numberEl.value = String(Math.round(clamped));
    }

    rangeEl.step = String(step);

    syncFromRange();

    rangeEl.addEventListener("input", function () {
      syncFromRange();
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      numberEl.value = String(numberEl.value).replace(/[^\d.-]/g, "");
      clearResult();
    });

    numberEl.addEventListener("blur", function () {
      commitNumberToRange();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberToRange();
      }
    });
  }

  function validateNonNegative(value, label) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  function sortDrivers(drivers) {
    return drivers
      .filter(function (d) {
        return Number.isFinite(d.value) && d.value > 0;
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });
  }

  function percentOf(part, total) {
    if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return NaN;
    return (part / total) * 100;
  }

  function money(n) {
    return formatWithCommas(n);
  }

  // ------------------------------------------------------------
  // 3) BINDINGS INIT
  // ------------------------------------------------------------

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000, 500, true);
  bindRangeAndNumber(housingRange, housingNumber, 0, 200000, 250, true);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 50000, 100, true);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 100000, 200, true);
  bindRangeAndNumber(transportRange, transportNumber, 0, 80000, 200, true);
  bindRangeAndNumber(debtRange, debtNumber, 0, 150000, 250, true);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 80000, 200, true);
  bindRangeAndNumber(insuranceRange, insuranceNumber, 0, 80000, 200, true);
  bindRangeAndNumber(childcareRange, childcareNumber, 0, 120000, 250, true);
  bindRangeAndNumber(otherEssentialsRange, otherEssentialsNumber, 0, 120000, 250, true);

  bindPercentRangeAndNumber(incomeVarPctRange, incomeVarPctNumber, 0, 60, 1);
  bindPercentRangeAndNumber(targetMarginPctRange, targetMarginPctNumber, 0, 80, 1);

  // ------------------------------------------------------------
  // 4) CALCULATION + REPORT RENDER
  // ------------------------------------------------------------

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = parseLooseNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");
      const medical = parseLooseNumber(medicalNumber ? medicalNumber.value : "");
      const insurance = parseLooseNumber(insuranceNumber ? insuranceNumber.value : "");
      const childcare = parseLooseNumber(childcareNumber ? childcareNumber.value : "");
      const otherEssentials = parseLooseNumber(otherEssentialsNumber ? otherEssentialsNumber.value : "");

      const incomeVarPct = parseLooseNumber(incomeVarPctNumber ? incomeVarPctNumber.value : "");
      const targetMarginPct = parseLooseNumber(targetMarginPctNumber ? targetMarginPctNumber.value : "");

      if (!validateNonNegative(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "minimum debt payments")) return;
      if (!validateNonNegative(medical, "medical")) return;
      if (!validateNonNegative(insurance, "insurance")) return;
      if (!validateNonNegative(childcare, "childcare and education")) return;
      if (!validateNonNegative(otherEssentials, "other fixed essentials")) return;

      if (!validateNonNegative(incomeVarPct, "income variability buffer")) return;
      if (!validateNonNegative(targetMarginPct, "stability target margin")) return;

      const essentialsTotal =
        housing +
        utilities +
        groceries +
        transport +
        debt +
        medical +
        insurance +
        childcare +
        otherEssentials;

      if (!validatePositive(essentialsTotal, "total essentials")) return;

      const coverageRatio = income / essentialsTotal;
      if (!Number.isFinite(coverageRatio)) {
        setResultError("Enter valid numbers to compute a coverage ratio.");
        return;
      }

      const effectiveMarginPct = clamp(targetMarginPct + incomeVarPct, 0, 200);
      const stableThreshold = 1 + effectiveMarginPct / 100;

      let status = "";
      let risk = "";
      if (coverageRatio < 1) {
        status = "Underprepared";
        risk = "High";
      } else if (coverageRatio < stableThreshold) {
        status = "Borderline";
        risk = "Medium";
      } else {
        status = "Stable";
        risk = "Lower";
      }

      const incomeTargetStable = essentialsTotal * stableThreshold;
      const incomeGapToStable = Math.max(0, incomeTargetStable - income);

      const essentialsCapStable = income / stableThreshold;
      const essentialsCutToStable = Math.max(0, essentialsTotal - essentialsCapStable);

      const slack = income - essentialsTotal;

      const drivers = sortDrivers([
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries", value: groceries },
        { label: "Transport", value: transport },
        { label: "Minimum debt payments", value: debt },
        { label: "Medical", value: medical },
        { label: "Insurance", value: insurance },
        { label: "Childcare and education", value: childcare },
        { label: "Other fixed essentials", value: otherEssentials }
      ]);

      const top1 = drivers.length > 0 ? drivers[0].label : "None";
      const top2 = drivers.length > 1 ? drivers[1].label : "None";
      const top3 = drivers.length > 2 ? drivers[2].label : "None";

      function driverShare(label) {
        const found = drivers.find(function (x) {
          return x.label === label;
        });
        if (!found) return NaN;
        return percentOf(found.value, essentialsTotal);
      }

      const housingPctOfIncome = percentOf(housing, income);
      const debtPctOfIncome = percentOf(debt, income);

      const decisionLever = incomeGapToStable <= essentialsCutToStable ? "Income" : "Essentials";
      const primaryCorrectionText =
        decisionLever === "Income"
          ? "Increase monthly income by about " +
            money(incomeGapToStable) +
            " to meet the stability threshold."
          : "Reduce total essentials by about " +
            money(essentialsCutToStable) +
            " to meet the stability threshold.";

      const stabilitySentence =
        "The stability threshold here is " +
        stableThreshold.toFixed(2) +
        " (base margin " +
        formatPercent(targetMarginPct) +
        " plus variability buffer " +
        formatPercent(incomeVarPct) +
        ").";

      const bullets = [
        { k: "Readiness", v: status },
        { k: "Risk level", v: risk },
        { k: "Coverage ratio", v: coverageRatio.toFixed(2) },
        { k: "Income (monthly)", v: money(income) },
        { k: "Essentials total", v: money(essentialsTotal) },
        { k: "Slack after essentials", v: money(slack) },
        { k: "Top drivers", v: top1 + ", " + top2 + ", " + top3 },
        { k: "Stability threshold", v: stableThreshold.toFixed(2) },
        { k: "Income target (stable)", v: money(incomeTargetStable) },
        { k: "Income gap to stable", v: money(incomeGapToStable) },
        { k: "Essentials cap (stable)", v: money(essentialsCapStable) },
        { k: "Essentials cut to stable", v: money(essentialsCutToStable) }
      ];

      function metricsListHtml() {
        return (
          '<ul class="di-pro-metrics">' +
          bullets
            .map(function (b) {
              return (
                '<li><span class="di-pro-k">' +
                b.k +
                '</span><span class="di-pro-v">' +
                b.v +
                "</span></li>"
              );
            })
            .join("") +
          "</ul>"
        );
      }

      function paragraphPack(p1, p2, p3) {
        return "<p>" + p1 + "</p><p>" + p2 + "</p><p>" + p3 + "</p>";
      }

      const sections = [
        {
          h: "1) Results summary",
          html: paragraphPack(
            "This outcome is classified as <strong>" +
              status +
              "</strong>. The coverage ratio is <strong>" +
              coverageRatio.toFixed(2) +
              "</strong>, which means income is " +
              (coverageRatio >= 1 ? "currently covering essentials" : "not currently covering essentials") +
              " in the typical month based on the inputs provided. This is not a comfort score. It is a baseline survivability signal.",
            stabilitySentence +
              " If the ratio is below this threshold, the system can still appear functional in calm months, but it is structurally fragile because normal variability pushes it into failure. A ratio above the threshold creates predictable room for planning instead of permanent reaction.",
            "The key decision is whether your correction should be led by income growth or essentials reduction. Based on the stability math, the cheapest lever right now is <strong>" +
              decisionLever +
              "</strong>. " +
              primaryCorrectionText +
              " If you try to solve this with small optimisations that do not move the ratio, you will stay in the same loop."
          )
        },
        {
          h: "2) Metric-by-metric interpretation",
          html: paragraphPack(
            "Income is set at " +
              money(income) +
              " per month and total essentials are " +
              money(essentialsTotal) +
              ". That leaves slack of " +
              money(slack) +
              " after essentials. Slack is the only pool that can fund savings, buffer building, discretionary spending, and faster debt reduction. When slack is small or negative, every additional goal becomes borrowed from the future.",
            "The stability target is driven by two inputs: the target margin (" +
              formatPercent(targetMarginPct) +
              ") and the income variability buffer (" +
              formatPercent(incomeVarPct) +
              "). Together they define a stability threshold of " +
              stableThreshold.toFixed(2) +
              ". This allows you to adjust the standard based on how predictable income is. If income is stable and expenses are stable, you can tolerate a lower margin. If income is lumpy, you need a higher margin because the bad month is what breaks the system.",
            "The top essentials drivers are " +
              top1 +
              ", " +
              top2 +
              ", and " +
              top3 +
              ". Driver concentration matters because it tells you where meaningful change is possible. If the biggest driver is large, a single committed change can move the ratio. If the biggest driver is small, you need multiple smaller cuts or a bigger income move."
          )
        },
        {
          h: "3) Causality analysis",
          html: paragraphPack(
            "Causality here means what is actually producing the ratio, not what feels emotionally important. The ratio is produced by fixed commitments and repeatable monthly costs. When people feel stuck, it is usually because they are trying to solve a fixed problem with variable effort, like trying to try harder at spending discipline while the fixed baseline remains too high.",
            "Your essentials stack is concentrated around the top drivers. " +
              top1 +
              " alone represents about " +
              (Number.isFinite(driverShare(top1)) ? driverShare(top1).toFixed(0) + "% of essentials." : "a material portion of essentials.") +
              " If you want the fastest path to stability, focus on changing one of the top drivers, not the small categories. Small categories can support stability, but they rarely create it.",
            "Two specific pressure checks matter. Housing is about " +
              (Number.isFinite(housingPctOfIncome) ? housingPctOfIncome.toFixed(0) + "% of income." : "a meaningful share of income.") +
              " Minimum debt payments are about " +
              (Number.isFinite(debtPctOfIncome) ? debtPctOfIncome.toFixed(0) + "% of income." : "a meaningful share of income.") +
              " If either is elevated, it reduces flexibility and makes the system brittle even if the ratio looks acceptable."
          )
        },
        {
          h: "4) Constraint diagnosis",
          html: paragraphPack(
            "Constraint diagnosis is about what stops the ratio improving. The first constraint is usually commitment lock-in. Housing, transport, debt, and insurance often feel non-negotiable because changing them has friction or social cost. If these commitments are mis-sized, they control your future choices anyway, just more painfully.",
            "The second constraint is income volatility. If income varies, the average month is not the truth. The worst normal month is the truth. That is why the variability buffer exists. If your income is variable and your buffer is set low, you are implicitly betting that bad months will not happen. That bet usually fails over time.",
            "The third constraint is undercounting. People often exclude irregular but predictable essentials, like basic maintenance, annual fees, or recurring medical needs. If your inputs are conservative and still yield a weak ratio, the real ratio is likely worse. That means stability requires a larger move than it appears."
          )
        },
        {
          h: "5) Action prioritisation",
          html: paragraphPack(
            "Action prioritisation means choosing the smallest number of actions that reliably move the ratio past the stability threshold and keep it there. The order is: stop ongoing damage, stabilise the baseline, then optimise. Underprepared means you stop compounding penalties and shortfalls. Borderline means you create margin. Stable means you protect stability and build buffers.",
            "Start with the largest driver. A practical rule is: if a driver is over one third of income, it is likely the main lever. If housing is dominant, the lever is housing. If debt minimums are dominant, the lever is restructuring or reducing commitments. If groceries or utilities are dominant, the lever is usually a cap and systems, but only if they are large enough to matter.",
            "Use the stability math to choose the lever. Right now the cheaper lever is <strong>" +
              decisionLever +
              "</strong>. " +
              primaryCorrectionText +
              " If you pick the wrong lever, you can waste months working hard without moving the system."
          )
        },
        {
          h: "6) Stability conditions",
          html: paragraphPack(
            "Stability conditions describe what must be true for the baseline to remain reliable. Condition one is ratio durability: keeping coverage consistently above 1.00, and ideally above the stability threshold. Condition two is shock tolerance: having enough margin to absorb normal variability without using debt or skipping essentials.",
            "Your stability target implies income should be at least " +
              money(incomeTargetStable) +
              " per month for the current essentials profile. If income cannot realistically move in the short term, the stability condition becomes an essentials cap: essentials need to be around " +
              money(essentialsCapStable) +
              " per month for the same stability target. These are boundary conditions, not motivation.",
            "Condition three is preventing drift. When people finally create slack, they often reallocate it into new fixed commitments. That recreates fragility. Treat new commitments as the enemy until a buffer exists."
          )
        },
        {
          h: "7) Decision framing",
          html: paragraphPack(
            "Decision framing is how you avoid the endless loop. Underprepared is not a choice between comfort and discipline. It is a choice between making a controlled change now or being forced into an uncontrolled change later. The longer the gap persists, the fewer options remain because debt and stress remove flexibility.",
            "Borderline is psychologically dangerous because it feels like almost there while still being one shock away from failure. The correct frame is: how do you buy margin. Margin is purchased by lowering fixed essentials or raising income without raising fixed costs. If you spend the margin immediately, you remain borderline.",
            "Stable is where you protect the baseline and build buffers. The goal is to turn slack into a buffer that protects you from income interruptions, medical events, or cost spikes. Once a buffer exists, you can accelerate debt reduction or savings. Without a buffer, you are stable on paper but still exposed."
          )
        }
      ];

      const reportHtml =
        '<div class="di-pro-report">' +
        '<p class="di-pro-topline"><strong>Income vs Essentials Planner Pro</strong> full diagnostic report.</p>' +
        '<div class="di-pro-badges">' +
        '<span class="di-pro-badge">Status: ' +
        status +
        "</span>" +
        '<span class="di-pro-badge">Ratio: ' +
        coverageRatio.toFixed(2) +
        "</span>" +
        '<span class="di-pro-badge">Threshold: ' +
        stableThreshold.toFixed(2) +
        "</span>" +
        '<span class="di-pro-badge">Slack: ' +
        money(slack) +
        "</span>" +
        "</div>" +
        metricsListHtml() +
        sections
          .map(function (s) {
            return '<div class="di-pro-section"><h3>' + s.h + "</h3>" + s.html + "</div>";
          })
          .join("") +
        '<div class="di-pro-section di-pro-priority">' +
        "<h4>Immediate next steps</h4>" +
        '<ol class="di-pro-steps">' +
        "<li>Pick one top driver (" +
        top1 +
        ") and implement one committed change that moves the ratio.</li>" +
        "<li>Hold essentials at or below " +
        money(essentialsCapStable) +
        " or move income toward " +
        money(incomeTargetStable) +
        " until the stability threshold is consistently met.</li>" +
        "<li>Once stable, convert slack into a buffer before adding new fixed commitments.</li>" +
        "</ol>" +
        "</div>" +
        "</div>";

      setResultSuccess(reportHtml);
    });
  }

  // ------------------------------------------------------------
  // 5) WHATSAPP SHARE (BASELINE PATTERN)
  // ------------------------------------------------------------

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Planner Pro - full diagnostic: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.location.href = waUrl;
    });
  }
});
