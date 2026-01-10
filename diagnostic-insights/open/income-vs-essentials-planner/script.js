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

  // Report preview bindings (MANDATORY)
  const previewInputs = document.getElementById("previewInputs");
  const previewResult = document.getElementById("previewResult");
  const previewCorrection = document.getElementById("previewCorrection");
  const previewNextSteps = document.getElementById("previewNextSteps");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const n = parseLooseNumber(inputEl.value);
      if (!Number.isFinite(n)) return;
      inputEl.value = formatWithCommas(n);
    });
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(groceriesNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(medicalNumber);
  attachLiveFormatting(debtMinNumber);

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
  // 4) RANGE + NUMBER BINDING (DI REQUIRED)
  // ------------------------------------------------------------
  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const initial = clamp(defaultValue, min, max);
    rangeEl.value = String(initial);
    numberEl.value = formatWithCommas(initial);

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      const clamped = clamp(v, min, max);
      numberEl.value = formatWithCommas(clamped);
    });

    function commitNumberToRange() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        numberEl.value = formatWithCommas(parseLooseNumber(rangeEl.value));
        return;
      }
      if (typed < 0) {
        numberEl.value = formatWithCommas(parseLooseNumber(rangeEl.value));
        return;
      }
      const clamped = clamp(typed, min, max);
      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
    }

    numberEl.addEventListener("blur", commitNumberToRange);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commitNumberToRange();
    });
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 200000, 500, 30000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 120000, 250, 12000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 30000, 100, 2500);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 60000, 200, 5000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 50000, 200, 3000);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 50000, 200, 2000);
  bindRangeAndNumber(debtMinRange, debtMinNumber, 0, 80000, 200, 1500);

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) REPORT PREVIEW BINDING (MANDATORY)
  // ------------------------------------------------------------
  function setPreview(htmlInputs, htmlResult, htmlCorrection, htmlNextSteps) {
    if (!previewInputs || !previewResult || !previewCorrection || !previewNextSteps) return;
    previewInputs.innerHTML = htmlInputs;
    previewResult.innerHTML = htmlResult;
    previewCorrection.innerHTML = htmlCorrection;
    previewNextSteps.innerHTML = htmlNextSteps;
  }

  function getTopDrivers(expenses) {
    const sorted = expenses
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      });
    const top = sorted.filter(function (x) { return x.value > 0; }).slice(0, 3);
    return top.map(function (x) { return x.label; });
  }

  function classify(ratio) {
    if (!Number.isFinite(ratio)) return { label: "", note: "" };
    if (ratio < 1.0) {
      return { label: "Underprepared", note: "Your essentials are not reliably covered by income." };
    }
    if (ratio < 1.25) {
      return { label: "Borderline", note: "Essentials are covered, but buffer is thin." };
    }
    return { label: "Stable", note: "You have meaningful headroom above essentials." };
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs (accept commas, reject non-numeric)
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = parseLooseNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const medical = parseLooseNumber(medicalNumber ? medicalNumber.value : "");
      const debtMin = parseLooseNumber(debtMinNumber ? debtMinNumber.value : "");

      // Existence guard
      if (!incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !medicalNumber || !debtMinNumber) {
        return;
      }

      // Validation (EDGE CASES)
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries and essentials")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(medical, "medical and insurance")) return;
      if (!validateNonNegative(debtMin, "debt minimums")) return;

      if (!validatePositive(income, "income")) return;

      const essentialsTotal = housing + utilities + groceries + transport + medical + debtMin;

      if (!Number.isFinite(essentialsTotal) || essentialsTotal <= 0) {
        setResultError("Enter valid essential expenses. Total essentials must be greater than 0.");
        return;
      }

      const ratio = income / essentialsTotal;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Could not compute a valid coverage ratio from your inputs.");
        return;
      }

      const classification = classify(ratio);

      const targetStableRatio = 1.25;
      let correction = 0;
      if (ratio < targetStableRatio) {
        const requiredIncome = essentialsTotal * targetStableRatio;
        correction = requiredIncome - income;
        if (!Number.isFinite(correction) || correction < 0) correction = 0;
      }

      const expenses = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries and essentials", value: groceries },
        { label: "Transport", value: transport },
        { label: "Medical and insurance", value: medical },
        { label: "Debt minimums", value: debtMin }
      ];

      const topDrivers = getTopDrivers(expenses);

      // On-page output: exactly 1 headline, 1 sentence, exactly 2 actions
      const ratioRounded = Math.round(ratio * 100) / 100;
      const headline = classification.label + " (coverage ratio " + ratioRounded.toFixed(2) + ")";
      const sentence = classification.note;

      const action1 = (correction > 0)
        ? "Move your baseline toward stable by improving monthly headroom by " + formatWithCommas(correction) + " (reduce the biggest driver or lift income)."
        : "Protect your headroom by keeping essentials stable and avoiding new fixed commitments.";

      const action2 = (ratio < 1.25)
        ? "Create a buffer before adding optional spending. Treat buffer as non-negotiable until stable."
        : "Use the surplus to build a buffer first, then direct the remainder into debt reduction or planned goals.";

      const resultHtml =
        '<p class="di-result-headline">' + headline + "</p>" +
        '<p class="di-result-sentence">' + sentence + "</p>" +
        '<ol class="di-actions">' +
          "<li>" + action1 + "</li>" +
          "<li>" + action2 + "</li>" +
        "</ol>";

      setResultSuccess(resultHtml);

      // Report preview update (MANDATORY)
      const driversText = (topDrivers.length > 0) ? topDrivers.slice(0, 3).join(", ") : "None";

      const previewInputsHtml =
        "Income: " + formatWithCommas(income) + "<br>" +
        "Essentials total: " + formatWithCommas(essentialsTotal) + "<br>" +
        "Top drivers: " + driversText;

      const previewResultHtml =
        "Coverage ratio: " + ratioRounded.toFixed(2) + "<br>" +
        "Classification: " + classification.label;

      const correctionText = (correction > 0)
        ? ("Increase monthly headroom by about " + formatWithCommas(correction) + " to reach stable.")
        : "No minimum correction required to reach stable based on this baseline.";

      const previewCorrectionHtml = "Target: " + correctionText;

      const step1 = (correction > 0)
        ? ("Reduce your biggest essential or lift income until headroom improves by " + formatWithCommas(correction) + ".")
        : "Keep essentials flat and keep surplus from leaking into new fixed costs.";

      const step2 = (ratio < 1.25)
        ? "Build a buffer before optional upgrades or new commitments."
        : "Build buffer first, then allocate remaining surplus to priorities.";

      const previewNextStepsHtml = "1) " + step1 + "<br>" + "2) " + step2;

      setPreview(previewInputsHtml, previewResultHtml, previewCorrectionHtml, previewNextStepsHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Diagnostic - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
