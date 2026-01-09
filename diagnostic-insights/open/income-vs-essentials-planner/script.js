// script.js
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

  const otherNumber = document.getElementById("otherNumber");
  const otherRange = document.getElementById("otherRange");

  // Report preview bindings (must update after successful calculation)
  const previewIncome = document.getElementById("previewIncome");
  const previewEssentials = document.getElementById("previewEssentials");
  const previewRatio = document.getElementById("previewRatio");
  const previewClass = document.getElementById("previewClass");
  const previewDrivers = document.getElementById("previewDrivers");
  const previewCorrection = document.getElementById("previewCorrection");

  // ------------------------------------------------------------
  // 2) HELPERS (parse, clamp, formatting, result setters)
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
    if (!Number.isFinite(n)) return NaN;
    return Math.min(max, Math.max(min, n));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatRatioTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
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

  // ------------------------------------------------------------
  // 3) RANGE + NUMBER BINDING (bi-directional sync, clamp on blur/enter)
  // ------------------------------------------------------------
  function bindRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    const min = parseLooseNumber(rangeEl.min);
    const max = parseLooseNumber(rangeEl.max);
    const step = parseLooseNumber(rangeEl.step) || 1;

    function snapToStep(value) {
      if (!Number.isFinite(value)) return NaN;
      if (!Number.isFinite(step) || step <= 0) return value;
      const snapped = Math.round(value / step) * step;
      return snapped;
    }

    function commitValue(n) {
      const snapped = snapToStep(n);
      const clamped = clamp(snapped, min, max);
      if (!Number.isFinite(clamped)) return false;
      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
      numberEl.dataset.lastValid = String(clamped);
      return true;
    }

    // Initialize from range value
    commitValue(parseLooseNumber(rangeEl.value));

    rangeEl.addEventListener("input", function () {
      const n = parseLooseNumber(rangeEl.value);
      commitValue(n);
      clearResult();
    });

    numberEl.addEventListener("input", function () {
      const n = parseLooseNumber(numberEl.value);
      if (Number.isFinite(n)) {
        numberEl.value = formatWithCommas(n);
      }
      clearResult();
    });

    function handleCommit() {
      const n = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(n)) {
        if (numberEl.dataset.lastValid !== undefined) {
          commitValue(parseLooseNumber(numberEl.dataset.lastValid));
        } else {
          commitValue(parseLooseNumber(rangeEl.value));
        }
        return;
      }
      const ok = commitValue(n);
      if (!ok) {
        if (numberEl.dataset.lastValid !== undefined) {
          commitValue(parseLooseNumber(numberEl.dataset.lastValid));
        }
      }
    }

    numberEl.addEventListener("blur", function () {
      handleCommit();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCommit();
        numberEl.blur();
      }
    });
  }

  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(groceriesRange, groceriesNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtRange, debtNumber);
  bindRangeAndNumber(medicalRange, medicalNumber);
  bindRangeAndNumber(otherRange, otherNumber);

  // ------------------------------------------------------------
  // 4) VALIDATION
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
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse from number inputs (they are the typed source)
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = parseLooseNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");
      const medical = parseLooseNumber(medicalNumber ? medicalNumber.value : "");
      const other = parseLooseNumber(otherNumber ? otherNumber.value : "");

      // Existence guard
      if (
        !incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber ||
        !transportNumber || !debtNumber || !medicalNumber || !otherNumber
      ) {
        return;
      }

      // Validation
      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "debt minimums")) return;
      if (!validateNonNegative(medical, "insurance and medical")) return;
      if (!validateNonNegative(other, "other essentials")) return;

      const essentials = housing + utilities + groceries + transport + debt + medical + other;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Total essentials must be greater than 0.");
        return;
      }

      const ratio = income / essentials;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Unable to compute a valid coverage ratio from these inputs.");
        return;
      }

      // Classification thresholds
      let classification = "borderline";
      if (ratio < 1.0) classification = "underprepared";
      else if (ratio >= 1.25) classification = "stable";

      // Drivers by magnitude (labels only)
      const drivers = [
        { key: "Housing", value: housing },
        { key: "Utilities", value: utilities },
        { key: "Groceries", value: groceries },
        { key: "Transport", value: transport },
        { key: "Debt minimums", value: debt },
        { key: "Insurance and medical", value: medical },
        { key: "Other essentials", value: other }
      ].sort(function (a, b) {
        return b.value - a.value;
      });

      const topDrivers = drivers
        .filter(function (d) { return Number.isFinite(d.value) && d.value > 0; })
        .slice(0, 3)
        .map(function (d) { return d.key; });

      const topDriversText = topDrivers.length ? topDrivers.join(", ") : "None identified";

      // Minimum correction targets (no currency symbol)
      const breakEvenTarget = Math.max(0, essentials - income);
      const stabilityTarget = Math.max(0, (essentials * 1.25) - income);

      let correctionText = "";
      if (classification === "stable") {
        correctionText = "You are above the stable threshold for this baseline check.";
      } else if (classification === "borderline") {
        correctionText =
          "Stability target: " + formatWithCommas(stabilityTarget) + " (to reach about 1.25x coverage).";
      } else {
        correctionText =
          "Break-even target: " + formatWithCommas(breakEvenTarget) +
          ". Stability target: " + formatWithCommas(stabilityTarget) + ".";
      }

      // On-page output rules: headline, one sentence interpretation, exactly two actions
      const ratioText = formatRatioTwoDecimals(ratio) + "x";
      const headline = classification.charAt(0).toUpperCase() + classification.slice(1) + ": " + ratioText + " coverage";

      let interpretation = "";
      if (classification === "underprepared") {
        interpretation = "Your essentials exceed your income, so the baseline structure is negative before discretionary spending.";
      } else if (classification === "borderline") {
        interpretation = "You cover essentials, but the margin is thin and normal variability can still create frequent shortfalls.";
      } else {
        interpretation = "You have enough margin above essentials to absorb routine variability without immediately breaking the month.";
      }

      // Action suggestions based on largest driver and needed change
      const biggest = drivers[0] ? drivers[0].key : "a major category";
      const neededToStable = Math.max(0, stabilityTarget);

      let action1 = "Target your largest essential driver (" + biggest + ") first and reduce it meaningfully, not by small tweaks.";
      let action2 = "Increase reliable income or cut essential load by at least " + formatWithCommas(neededToStable) + " to move toward stable coverage.";

      if (classification === "stable") {
        action1 = "Lock in your baseline: keep essentials consistent and avoid adding new fixed commitments without re-checking coverage.";
        action2 = "Allocate the margin deliberately (buffer first, then debt acceleration or savings) instead of letting it disappear automatically.";
      } else if (classification === "underprepared") {
        const neededToBreakEven = Math.max(0, breakEvenTarget);
        action1 = "Stop adding commitments and focus on immediate break-even by reducing essentials or increasing income by " + formatWithCommas(neededToBreakEven) + ".";
        action2 = "Cut or restructure the largest driver (" + biggest + ") before optimizing smaller items, because it moves the ratio fastest.";
      }

      const resultHtml =
        '<div class="di-result-headline">' + headline + '</div>' +
        '<div class="di-result-interpretation">' + interpretation + '</div>' +
        '<ul class="di-actions">' +
          '<li>' + action1 + '</li>' +
          '<li>' + action2 + '</li>' +
        '</ul>';

      setResultSuccess(resultHtml);

      // ------------------------------------------------------------
      // 6) REPORT PREVIEW BINDING (MANDATORY)
      // ------------------------------------------------------------
      if (previewIncome && previewEssentials && previewRatio && previewClass && previewDrivers && previewCorrection) {
        previewIncome.textContent = formatWithCommas(income);
        previewEssentials.textContent = formatWithCommas(essentials);
        previewRatio.textContent = ratioText;
        previewClass.textContent = classification;
        previewDrivers.textContent = topDriversText;

        if (classification === "stable") {
          previewCorrection.textContent = "No minimum correction target required for stability in this baseline check.";
        } else if (classification === "borderline") {
          previewCorrection.textContent = "Minimum correction target to stable: " + formatWithCommas(stabilityTarget) + ".";
        } else {
          previewCorrection.textContent =
            "Minimum correction target to break-even: " + formatWithCommas(breakEvenTarget) +
            ". Minimum correction target to stable: " + formatWithCommas(stabilityTarget) + ".";
        }
      }

    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Diagnostic - check this diagnostic: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
