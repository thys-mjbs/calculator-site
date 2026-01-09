// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
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

  const foodNumber = document.getElementById("foodNumber");
  const foodRange = document.getElementById("foodRange");

  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");

  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");

  // Email preview bindings (must update after successful calculation)
  const previewIncome = document.getElementById("previewIncome");
  const previewEssentials = document.getElementById("previewEssentials");
  const previewRatio = document.getElementById("previewRatio");
  const previewClass = document.getElementById("previewClass");
  const previewDrivers = document.getElementById("previewDrivers");
  const previewTarget = document.getElementById("previewTarget");

  // ------------------------------------------------------------
  // 2) HELPERS (parse, clamp, format)
  // ------------------------------------------------------------
  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const s = String(value).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return NaN;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(value, decimals) {
    if (!Number.isFinite(value)) return "";
    const d = Number.isFinite(decimals) ? decimals : 0;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
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

  function safeText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  // ------------------------------------------------------------
  // 3) RANGE <-> NUMBER BINDING (bi-directional sync)
  // ------------------------------------------------------------
  function bindRangeAndNumber(rangeEl, numberEl, min, max, step) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    function setBoth(rawNum) {
      const clamped = clamp(rawNum, min, max);
      if (!Number.isFinite(clamped)) return;

      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped, 0);
    }

    rangeEl.addEventListener("input", function () {
      const n = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(n)) return;
      numberEl.value = formatWithCommas(n, 0);
      clearResult();
    });

    function commitNumberInput() {
      const n = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(n)) {
        // Leave as typed; do not sync on invalid typing
        return;
      }
      setBoth(n);
      clearResult();
    }

    numberEl.addEventListener("blur", commitNumberInput);

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberInput();
      }
    });

    // Initialize with mid-ish default if empty
    if (!numberEl.value) {
      const init = clamp(parseLooseNumber(rangeEl.value), min, max);
      if (Number.isFinite(init)) {
        numberEl.value = formatWithCommas(init, 0);
      } else {
        setBoth(min);
      }
    } else {
      commitNumberInput();
    }
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 500);
  bindRangeAndNumber(housingRange, housingNumber, 0, 120000, 250);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 30000, 100);
  bindRangeAndNumber(foodRange, foodNumber, 0, 60000, 200);
  bindRangeAndNumber(transportRange, transportNumber, 0, 50000, 200);
  bindRangeAndNumber(debtRange, debtNumber, 0, 80000, 200);

  // ------------------------------------------------------------
  // 4) VALIDATION
  // ------------------------------------------------------------
  function validateRequiredNonNegative(value, label) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateRequiredPositive(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");

      // Existence guard
      if (
        !incomeNumber || !incomeRange ||
        !housingNumber || !housingRange ||
        !utilitiesNumber || !utilitiesRange ||
        !foodNumber || !foodRange ||
        !transportNumber || !transportRange ||
        !debtNumber || !debtRange
      ) {
        return;
      }

      // Clamp typed values into allowed ranges (on calculate)
      const incomeC = clamp(income, 0, 300000);
      const housingC = clamp(housing, 0, 120000);
      const utilitiesC = clamp(utilities, 0, 30000);
      const foodC = clamp(food, 0, 60000);
      const transportC = clamp(transport, 0, 50000);
      const debtC = clamp(debt, 0, 80000);

      // If any typed value is numeric, sync controls now (keeps slider and number in sync)
      if (Number.isFinite(incomeC)) { incomeRange.value = String(incomeC); incomeNumber.value = formatWithCommas(incomeC, 0); }
      if (Number.isFinite(housingC)) { housingRange.value = String(housingC); housingNumber.value = formatWithCommas(housingC, 0); }
      if (Number.isFinite(utilitiesC)) { utilitiesRange.value = String(utilitiesC); utilitiesNumber.value = formatWithCommas(utilitiesC, 0); }
      if (Number.isFinite(foodC)) { foodRange.value = String(foodC); foodNumber.value = formatWithCommas(foodC, 0); }
      if (Number.isFinite(transportC)) { transportRange.value = String(transportC); transportNumber.value = formatWithCommas(transportC, 0); }
      if (Number.isFinite(debtC)) { debtRange.value = String(debtC); debtNumber.value = formatWithCommas(debtC, 0); }

      // Validation
      if (!validateRequiredPositive(incomeC, "monthly income")) return;
      if (!validateRequiredNonNegative(housingC, "housing")) return;
      if (!validateRequiredNonNegative(utilitiesC, "utilities")) return;
      if (!validateRequiredNonNegative(foodC, "food and household basics")) return;
      if (!validateRequiredNonNegative(transportC, "transport")) return;
      if (!validateRequiredNonNegative(debtC, "minimum debt payments")) return;

      const essentials = housingC + utilitiesC + foodC + transportC + debtC;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter essential expenses greater than 0.");
        return;
      }

      const ratio = incomeC / essentials;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Inputs produced an invalid result. Check your numbers.");
        return;
      }

      // Classification thresholds
      let classification = "borderline";
      if (ratio < 1.0) classification = "underprepared";
      if (ratio >= 1.25) classification = "stable";

      // Two immediate actions (exactly two)
      let action1 = "";
      let action2 = "";

      if (classification === "underprepared") {
        action1 = "Cut the single largest essential category until essentials are covered.";
        action2 = "Increase reliable income or restructure minimum payments to close the gap.";
      } else if (classification === "borderline") {
        action1 = "Target one large category for a measurable reduction to build margin.";
        action2 = "Create a small monthly buffer allocation and keep it consistent.";
      } else {
        action1 = "Lock in a baseline buffer allocation from your margin each month.";
        action2 = "Reduce fragility by prioritizing high-cost debt or unavoidable spikes.";
      }

      // Drivers (top 3 by magnitude)
      const drivers = [
        { label: "Housing", value: housingC },
        { label: "Utilities", value: utilitiesC },
        { label: "Food and household basics", value: foodC },
        { label: "Transport", value: transportC },
        { label: "Minimum debt payments", value: debtC }
      ].sort(function (a, b) { return b.value - a.value; });

      const topDrivers = drivers
        .filter(function (d) { return d.value > 0; })
        .slice(0, 3)
        .map(function (d) { return d.label; });

      // Minimum correction target (range)
      const breakEvenTarget = Math.max(0, essentials - incomeC);
      const stableTarget = Math.max(0, (essentials * 1.25) - incomeC);

      let correctionText = "";
      if (stableTarget <= 0) {
        correctionText = "You are already above the stability threshold based on your inputs.";
      } else if (breakEvenTarget <= 0) {
        correctionText =
          "To reach stable, you need roughly " + formatWithCommas(stableTarget, 0) + " more monthly margin.";
      } else {
        correctionText =
          "To reach break-even you need " + formatWithCommas(breakEvenTarget, 0) +
          ". To reach stable you need " + formatWithCommas(stableTarget, 0) + ".";
      }

      // Output (exactly: headline, one sentence interpretation, exactly two actions)
      const ratioText = ratio.toFixed(2);

      let interpretation = "";
      if (classification === "underprepared") {
        interpretation =
          "Your essentials exceed your income, which means the baseline structure is not currently self-sustaining.";
      } else if (classification === "borderline") {
        interpretation =
          "Your essentials are covered, but the margin is thin and normal variability can push you into shortfall.";
      } else {
        interpretation =
          "Your essentials are covered with a meaningful margin, which supports predictable stability at the baseline level.";
      }

      const resultHtml =
        "<p><strong>Readiness:</strong> " + classification + " (coverage ratio " + ratioText + ")</p>" +
        "<p>" + interpretation + "</p>" +
        "<p><strong>Immediate actions:</strong></p>" +
        "<ul>" +
        "<li>" + action1 + "</li>" +
        "<li>" + action2 + "</li>" +
        "</ul>";

      setResultSuccess(resultHtml);

      // ------------------------------------------------------------
      // 6) REPORT PREVIEW BINDING (MANDATORY)
      // Update preview only after successful calculation
      // ------------------------------------------------------------
      safeText(previewIncome, formatWithCommas(incomeC, 0));
      safeText(previewEssentials, formatWithCommas(essentials, 0));
      safeText(previewRatio, ratio.toFixed(2));
      safeText(previewClass, classification);

      if (topDrivers.length === 0) {
        safeText(previewDrivers, "—");
      } else {
        safeText(previewDrivers, topDrivers.join(", "));
      }

      // Keep preview high-level: numeric figure or range
      if (stableTarget <= 0) {
        safeText(previewTarget, "Stable threshold already met based on your inputs.");
      } else if (breakEvenTarget <= 0) {
        safeText(previewTarget, "Minimum extra monthly margin needed for stable: " + formatWithCommas(stableTarget, 0));
      } else {
        safeText(
          previewTarget,
          "Minimum correction range: " + formatWithCommas(breakEvenTarget, 0) + " to " + formatWithCommas(stableTarget, 0)
        );
      }
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Check - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
