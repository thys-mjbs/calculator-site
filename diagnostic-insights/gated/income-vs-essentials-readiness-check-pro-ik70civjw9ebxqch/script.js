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

  const insuranceMedicalNumber = document.getElementById("insuranceMedicalNumber");
  const insuranceMedicalRange = document.getElementById("insuranceMedicalRange");

  const childcareNumber = document.getElementById("childcareNumber");
  const childcareRange = document.getElementById("childcareRange");

  const educationNumber = document.getElementById("educationNumber");
  const educationRange = document.getElementById("educationRange");

  const communicationsNumber = document.getElementById("communicationsNumber");
  const communicationsRange = document.getElementById("communicationsRange");

  const householdNumber = document.getElementById("householdNumber");
  const householdRange = document.getElementById("householdRange");

  const irregularNumber = document.getElementById("irregularNumber");
  const irregularRange = document.getElementById("irregularRange");

  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function formatWithCommas(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) {
      const stripped = String(raw || "").replace(/[^\d-]/g, "");
      return stripped;
    }
    return formatWithCommas(n);
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max) {
    if (!rangeEl || !numberEl) return;

    const setBoth = function (n) {
      const clamped = clamp(n, min, max);
      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
    };

    rangeEl.addEventListener("input", function () {
      const n = parseLooseNumber(rangeEl.value);
      setBoth(n);
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      numberEl.value = formatInputWithCommas(numberEl.value);
    });

    const commitNumber = function () {
      const n = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(n)) {
        numberEl.value = "";
        clearResult();
        return;
      }
      setBoth(n);
      clearResult();
    };

    numberEl.addEventListener("blur", commitNumber);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commitNumber();
    });

    const init = parseLooseNumber(rangeEl.value);
    setBoth(Number.isFinite(init) ? init : min);
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 500000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 250000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 75000);
  bindRangeAndNumber(foodRange, foodNumber, 0, 150000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 150000);
  bindRangeAndNumber(debtRange, debtNumber, 0, 250000);
  bindRangeAndNumber(insuranceMedicalRange, insuranceMedicalNumber, 0, 150000);
  bindRangeAndNumber(childcareRange, childcareNumber, 0, 200000);
  bindRangeAndNumber(educationRange, educationNumber, 0, 200000);
  bindRangeAndNumber(communicationsRange, communicationsNumber, 0, 50000);
  bindRangeAndNumber(householdRange, householdNumber, 0, 75000);
  bindRangeAndNumber(irregularRange, irregularNumber, 0, 200000);

  // ------------------------------------------------------------
  // OPTIONAL MODE SUPPORT (LEAVE EMPTY IF NOT USED)
  // ------------------------------------------------------------
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
  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtNumber);
  attachLiveFormatting(insuranceMedicalNumber);
  attachLiveFormatting(childcareNumber);
  attachLiveFormatting(educationNumber);
  attachLiveFormatting(communicationsNumber);
  attachLiveFormatting(householdNumber);
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
    resultDiv.classList.remove("error");
    resultDiv.classList.remove("success");
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Optional: if you have modes, read it here:
      // const mode = modeSelect ? modeSelect.value : null;

      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");
      const insuranceMedical = parseLooseNumber(insuranceMedicalNumber ? insuranceMedicalNumber.value : "");
      const childcare = parseLooseNumber(childcareNumber ? childcareNumber.value : "");
      const education = parseLooseNumber(educationNumber ? educationNumber.value : "");
      const communications = parseLooseNumber(communicationsNumber ? communicationsNumber.value : "");
      const household = parseLooseNumber(householdNumber ? householdNumber.value : "");
      const irregular = parseLooseNumber(irregularNumber ? irregularNumber.value : "");

      // Basic existence guard (optional but recommended)
      // Example:
      // if (!inputA || !inputB) return;
      if (!incomeNumber || !incomeRange || !housingNumber || !housingRange) {
        setResultError("This tool failed to load correctly. Please refresh the page.");
        return;
      }

      // Validation (use validatePositive/validateNonNegative or custom)
      if (!Number.isFinite(income) || income <= 0) {
        setResultError("Enter a valid Monthly income (net) greater than 0.");
        return;
      }

      const fields = [
        { v: housing, label: "Housing" },
        { v: utilities, label: "Utilities" },
        { v: food, label: "Food" },
        { v: transport, label: "Transport" },
        { v: debt, label: "Debt minimums" },
        { v: insuranceMedical, label: "Essential insurance and medical" },
        { v: childcare, label: "Childcare and dependents essentials" },
        { v: education, label: "Education and fees" },
        { v: communications, label: "Communications" },
        { v: household, label: "Household essentials" },
        { v: irregular, label: "Irregular essentials monthly equivalent" }
      ];

      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (!Number.isFinite(f.v) || f.v < 0) {
          setResultError("Enter a valid " + f.label + " (0 or higher).");
          return;
        }
      }

      const essentialsTotal = housing + utilities + food + transport + debt + insuranceMedical + childcare + education + communications + household + irregular;

      if (!Number.isFinite(essentialsTotal) || essentialsTotal <= 0) {
        setResultError("Essentials total must be greater than 0.");
        return;
      }

      // Calculation
      const coverageRatio = income / essentialsTotal;
      const surplus = income - essentialsTotal;

      let classification = "Stable";
      let classificationNote = "Income covers essentials with room to breathe.";
      if (coverageRatio < 1.0) {
        classification = "Underprepared";
        classificationNote = "Income does not cover essential costs. The plan must start with immediate gap closure.";
      } else if (coverageRatio < 1.2) {
        classification = "Borderline";
        classificationNote = "Income covers essentials but has limited buffer. Small shocks can break the month.";
      }

      const stabilityTargetRatio = 1.35;
      const stableIncomeTarget = essentialsTotal * stabilityTargetRatio;
      const incomeGapToTarget = Math.max(0, stableIncomeTarget - income);

      const essentialLines = [
        { key: "Housing", value: housing },
        { key: "Utilities", value: utilities },
        { key: "Food", value: food },
        { key: "Transport", value: transport },
        { key: "Debt minimums", value: debt },
        { key: "Insurance & medical", value: insuranceMedical },
        { key: "Childcare & dependents", value: childcare },
        { key: "Education & fees", value: education },
        { key: "Communications", value: communications },
        { key: "Household essentials", value: household },
        { key: "Irregular essentials", value: irregular }
      ];

      essentialLines.sort(function (a, b) {
        return b.value - a.value;
      });

      const topDrivers = essentialLines.slice(0, 3).filter(function (d) {
        return d.value > 0;
      });

      const maxDriver = topDrivers.length ? topDrivers.at(0) : null;

      const shareOfEssentials = function (v) {
        return (v / essentialsTotal) * 100;
      };

      const driverLinesHtml = topDrivers.length
        ? "<ul class=\"di-pro-list\">" + topDrivers.map(function (d) {
            return "<li><strong>" + d.key + ":</strong> " + formatWithCommas(d.value) + " (" + shareOfEssentials(d.value).toFixed(1) + "% of essentials)</li>";
          }).join("") + "</ul>"
        : "<p class=\"di-pro-muted\">No drivers detected. At least one essentials line must be above zero.</p>";

      let action1 = "Cut or restructure the top driver before touching smaller lines.";
      let action2 = "Set a stability target and treat it as the minimum operating condition.";

      if (coverageRatio < 1.0) {
        action1 = "Close the immediate gap: increase reliable income and/or reduce the largest essential line this month.";
        action2 = "Freeze non-essential spending until coverage is above 1.0 for at least two consecutive months.";
      } else if (coverageRatio < 1.2) {
        action1 = "Build buffer: reduce the top driver or add income so the ratio reaches at least 1.2.";
        action2 = "Create a stability rule: keep essentials below 80% of income until the month is consistently stable.";
      }

      const ratioPct = (coverageRatio * 100).toFixed(1);
      const stabilityBufferNeeded = Math.max(0, stableIncomeTarget - income);
      const bufferPctNeeded = ((stabilityBufferNeeded / income) * 100);

      const section = function (title, p1, p2, p3) {
        return (
          "<div class=\"di-pro-section\">" +
          "<h3 class=\"di-pro-h3\">" + title + "</h3>" +
          "<p>" + p1 + "</p>" +
          "<p>" + p2 + "</p>" +
          "<p>" + p3 + "</p>" +
          "</div>"
        );
      };

      const summary = section(
        "Results summary",
        "Classification: <strong>" + classification + "</strong>. " + classificationNote,
        "Coverage ratio: <strong>" + coverageRatio.toFixed(2) + "</strong> (" + ratioPct + "%). Essentials total: <strong>" + formatWithCommas(essentialsTotal) + "</strong>. Income: <strong>" + formatWithCommas(income) + "</strong>.",
        (surplus >= 0)
          ? "Current month surplus: <strong>" + formatWithCommas(surplus) + "</strong>. This is the gap between income and essentials before discretionary spending."
          : "Current month shortfall: <strong>" + formatWithCommas(Math.abs(surplus)) + "</strong>. This is the amount that must be bridged to avoid relying on debt, arrears, or skipped essentials."
      );

      const metrics = section(
        "Metric-by-metric interpretation",
        "The core metric is the income-to-essentials coverage ratio. Below 1.00 means the month is mathematically impossible without cutting essentials or finding more income. Between 1.00 and 1.20 is functional but fragile. Above 1.20 is workable but not automatically stable.",
        "A stability target is different from basic coverage. This planner uses a stability target ratio of <strong>" + stabilityTargetRatio.toFixed(2) + "</strong>, meaning essentials should sit at roughly 74% of income. That target builds room for irregular costs, timing mismatches, and small shocks without needing new debt.",
        "Your stability income target is <strong>" + formatWithCommas(stableIncomeTarget) + "</strong>. The gap to that target is <strong>" + formatWithCommas(incomeGapToTarget) + "</strong>. If this gap is large, solving it via tiny cuts is inefficient."
      );

      const causality = section(
        "Causality analysis",
        "This diagnostic treats the month as a system. The month fails when fixed and semi-fixed essentials consume too much of reliable income. The ratio tells you whether the system has any slack.",
        "The largest essentials lines create the constraint. Small lines matter, but they do not usually decide the outcome. If you keep the top drivers unchanged, the system tends to revert to the same result even if you optimise the edges.",
        "Key drivers (largest essentials lines): " + driverLinesHtml
      );

      const constraints = section(
        "Constraint diagnosis",
        "A constraint is the one part of the system that, if changed, meaningfully changes the outcome. In this tool the constraint is usually one of: housing, debt minimums, or transport. For many households it is housing by default.",
        maxDriver
          ? "Your biggest driver is <strong>" + maxDriver.key + "</strong>. If you want a fast change in classification, this is the first place to work. Cutting a smaller line rarely shifts the result if this remains high."
          : "No single dominant driver is visible. This can happen if essentials are spread evenly or if inputs were left at zero. In that case, treat income stability and timing as the likely constraint.",
        "If the constraint cannot move quickly, you are forced into income-side correction. That usually means adding stable income or restructuring the constraint over a longer timeline, not trying to patch the month with irregular side cash."
      );

      const prioritisation = section(
        "Action prioritisation",
        "Prioritisation means sequencing. Solve the month in the correct order: first make coverage possible, then build buffer, then decide what discretionary spending is safe.",
        "Immediate action 1: <strong>" + action1 + "</strong>",
        "Immediate action 2: <strong>" + action2 + "</strong>"
      );

      const stability = section(
        "Stability conditions",
        "Stability is the condition where a normal month does not require heroics. A stable month can absorb a late bill, an irregular repair, or a small drop in income without collapsing.",
        "This tool’s stability condition is: income must be at least <strong>" + formatWithCommas(stableIncomeTarget) + "</strong> given your current essentials. That implies a buffer need of <strong>" + formatWithCommas(stabilityBufferNeeded) + "</strong> (about " + (Number.isFinite(bufferPctNeeded) ? bufferPctNeeded.toFixed(1) : "0.0") + "% of income).",
        "If the buffer is not realistic immediately, treat it as a staged target. First get above 1.00. Then get above 1.20. Then aim for the stability ratio."
      );

      const framing = section(
        "Decision framing",
        "There are only three levers in this system: increase stable income, reduce essential cost levels, or change the timing/structure of obligations (for example refinancing, moving, or renegotiating). Everything else is a micro-optimisation.",
        "Use this output to decide which lever is dominant in your case. If the gap is small, expense control can work. If the gap is large, income-side action or structural changes are usually required. Ignoring that reality wastes months.",
        "This planner is intentionally narrow. It does not model shocks or future commitments. Treat it as a baseline structural check. Once the baseline is stable, you can safely model discretionary spend, savings goals, and longer-term commitments."
      );

      const html =
        "<div class=\"di-pro-report\">" +
        summary +
        metrics +
        causality +
        constraints +
        prioritisation +
        stability +
        framing +
        "</div>";

      setResultSuccess(html);
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
