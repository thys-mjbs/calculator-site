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

  const healthNumber = document.getElementById("healthNumber");
  const healthRange = document.getElementById("healthRange");

  const otherNumber = document.getElementById("otherNumber");
  const otherRange = document.getElementById("otherRange");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return String(raw || "").trim();
    return formatWithCommas(n, 0);
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtNumber);
  attachLiveFormatting(healthNumber);
  attachLiveFormatting(otherNumber);

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
    clearResult();
  }

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
  // 6) DI HELPERS (parse, clamp, format, binding)
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
      if (!Number.isFinite(n)) return;
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

    if (!numberEl.value) {
      const init = clamp(parseLooseNumber(rangeEl.value), min, max);
      if (Number.isFinite(init)) numberEl.value = formatWithCommas(init, 0);
      else setBoth(min);
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
  bindRangeAndNumber(healthRange, healthNumber, 0, 60000, 200);
  bindRangeAndNumber(otherRange, otherNumber, 0, 60000, 200);

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs
      const incomeRaw = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housingRaw = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilitiesRaw = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const foodRaw = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transportRaw = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debtRaw = parseLooseNumber(debtNumber ? debtNumber.value : "");
      const healthRaw = parseLooseNumber(healthNumber ? healthNumber.value : "");
      const otherRaw = parseLooseNumber(otherNumber ? otherNumber.value : "");

      // Existence guard
      if (
        !incomeNumber || !incomeRange ||
        !housingNumber || !housingRange ||
        !utilitiesNumber || !utilitiesRange ||
        !foodNumber || !foodRange ||
        !transportNumber || !transportRange ||
        !debtNumber || !debtRange ||
        !healthNumber || !healthRange ||
        !otherNumber || !otherRange
      ) {
        return;
      }

      // Clamp typed values into allowed ranges (on calculate)
      const income = clamp(incomeRaw, 0, 300000);
      const housing = clamp(housingRaw, 0, 120000);
      const utilities = clamp(utilitiesRaw, 0, 30000);
      const food = clamp(foodRaw, 0, 60000);
      const transport = clamp(transportRaw, 0, 50000);
      const debt = clamp(debtRaw, 0, 80000);
      const health = clamp(healthRaw, 0, 60000);
      const other = clamp(otherRaw, 0, 60000);

      // Sync controls now (keeps slider and number in sync even after typing)
      if (Number.isFinite(income)) { incomeRange.value = String(income); incomeNumber.value = formatWithCommas(income, 0); }
      if (Number.isFinite(housing)) { housingRange.value = String(housing); housingNumber.value = formatWithCommas(housing, 0); }
      if (Number.isFinite(utilities)) { utilitiesRange.value = String(utilities); utilitiesNumber.value = formatWithCommas(utilities, 0); }
      if (Number.isFinite(food)) { foodRange.value = String(food); foodNumber.value = formatWithCommas(food, 0); }
      if (Number.isFinite(transport)) { transportRange.value = String(transport); transportNumber.value = formatWithCommas(transport, 0); }
      if (Number.isFinite(debt)) { debtRange.value = String(debt); debtNumber.value = formatWithCommas(debt, 0); }
      if (Number.isFinite(health)) { healthRange.value = String(health); healthNumber.value = formatWithCommas(health, 0); }
      if (Number.isFinite(other)) { otherRange.value = String(other); otherNumber.value = formatWithCommas(other, 0); }

      // Validation
      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food and household basics")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "minimum debt payments")) return;
      if (!validateNonNegative(health, "health and insurance essentials")) return;
      if (!validateNonNegative(other, "other essentials")) return;

      const essentials = housing + utilities + food + transport + debt + health + other;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter essential expenses greater than 0.");
        return;
      }

      const ratio = income / essentials;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Inputs produced an invalid result. Check your numbers.");
        return;
      }

      const margin = income - essentials;

      // Stable threshold
      const stableThresholdRatio = 1.25;

      // Classification
      let classification = "Borderline";
      if (ratio < 1.0) classification = "Underprepared";
      if (ratio >= stableThresholdRatio) classification = "Stable";

      // Targets to reach stable
      const incomeNeededForStable = essentials * stableThresholdRatio;
      const incomeIncreaseTarget = Math.max(0, incomeNeededForStable - income);

      const essentialsAllowedForStable = income / stableThresholdRatio;
      const essentialsDecreaseTarget = Math.max(0, essentials - essentialsAllowedForStable);

      // Levers
      const levers = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food and household basics", value: food },
        { label: "Transport", value: transport },
        { label: "Minimum debt payments", value: debt },
        { label: "Health and insurance essentials", value: health },
        { label: "Other essentials", value: other }
      ].sort(function (a, b) { return b.value - a.value; });

      const top5 = levers.slice(0, 5);

      // Next actions (max 5)
      const actions = [];
      if (classification === "Underprepared") {
        actions.push("Close the break-even gap first before optimizing anything else.");
        actions.push("Target the largest lever (" + (levers[0] ? levers[0].label : "your top category") + ") for immediate reduction.");
        actions.push("If income cannot increase soon, treat essentials decrease as the primary path to stable.");
        actions.push("Stop adding new fixed obligations until stable is reached.");
      } else if (classification === "Borderline") {
        actions.push("Build margin by cutting one high-impact lever, not many small items.");
        actions.push("Set a fixed buffer allocation and keep it consistent for 8 to 12 weeks.");
        actions.push("Prevent drift by rechecking after any housing, debt, or transport change.");
      } else {
        actions.push("Lock in a baseline buffer allocation from your margin each month.");
        actions.push("Reduce fragility by prioritizing high-cost debt or unavoidable spikes.");
        actions.push("Keep essentials growth slower than income growth to preserve stability.");
      }

      // Trim to max 5
      while (actions.length > 5) actions.pop();

      // Build lever table rows
      const leverRows = top5.map(function (l) {
        const share = essentials > 0 ? (l.value / essentials) * 100 : 0;
        const requiredChange = Math.min(l.value, essentialsDecreaseTarget);
        const requiredText = formatWithCommas(requiredChange, 0);

        let note = "";
        if (essentialsDecreaseTarget > 0 && l.value < essentialsDecreaseTarget) {
          note = " (insufficient alone)";
        }

        return (
          "<tr>" +
            "<td>" + l.label + "</td>" +
            "<td>" + share.toFixed(1) + "%</td>" +
            "<td>" + requiredText + note + "</td>" +
          "</tr>"
        );
      }).join("");

      // Paid results block (mandatory sections A to E)
      const resultHtml =
        "<div class=\"di-results\">" +
          "<p class=\"di-headline\">Classification: " + classification + "</p>" +

          "<h3>Core numbers</h3>" +
          "<ul class=\"di-kv\">" +
            "<li><strong>Total essentials:</strong> " + formatWithCommas(essentials, 0) + "</li>" +
            "<li><strong>Coverage ratio:</strong> " + ratio.toFixed(2) + "</li>" +
            "<li><strong>Monthly margin:</strong> " + formatWithCommas(margin, 0) + "</li>" +
          "</ul>" +

          "<h3>Stability target</h3>" +
          "<ul class=\"di-kv\">" +
            "<li><strong>Stable threshold ratio:</strong> " + stableThresholdRatio.toFixed(2) + "</li>" +
            "<li><strong>Required monthly income increase (essentials fixed):</strong> " + formatWithCommas(incomeIncreaseTarget, 0) + "</li>" +
            "<li><strong>Required monthly essentials decrease (income fixed):</strong> " + formatWithCommas(essentialsDecreaseTarget, 0) + "</li>" +
          "</ul>" +

          "<h3>Lever impact ranking (top 5)</h3>" +
          "<table class=\"di-table\" aria-label=\"Lever impact ranking\">" +
            "<thead>" +
              "<tr>" +
                "<th>Lever</th>" +
                "<th>Share of essentials</th>" +
                "<th>Required change in this lever alone to reach stable</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" + leverRows + "</tbody>" +
          "</table>" +
          "<p class=\"di-note\">Required change is capped to the lever amount. If capped, that lever alone cannot reach stable.</p>" +

          "<h3>Next actions</h3>" +
          "<ul class=\"di-actions\">" +
            actions.map(function (a) { return "<li>" + a + "</li>"; }).join("") +
          "</ul>" +
        "</div>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Pro - check this tool: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.location.href = waUrl;
    });
  }
});
