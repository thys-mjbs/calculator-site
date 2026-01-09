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

  const debtMinNumber = document.getElementById("debtMinNumber");
  const debtMinRange = document.getElementById("debtMinRange");

  // Preview bindings
  const pvIncome = document.getElementById("pvIncome");
  const pvEssentials = document.getElementById("pvEssentials");
  const pvRatio = document.getElementById("pvRatio");
  const pvClass = document.getElementById("pvClass");
  const pvDriver1 = document.getElementById("pvDriver1");
  const pvDriver2 = document.getElementById("pvDriver2");
  const pvDriver3 = document.getElementById("pvDriver3");
  const pvCorrection = document.getElementById("pvCorrection");

  // ------------------------------------------------------------
  // 2) HELPERS
  // ------------------------------------------------------------
  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "").replace(/\s+/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    return Math.min(Math.max(n, min), max);
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    return Math.round(n).toLocaleString("en-US");
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

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const n = parseLooseNumber(inputEl.value);
      if (!Number.isFinite(n)) return;
      inputEl.value = formatWithCommas(n);
    });
  }

  function bindRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    const min = parseLooseNumber(rangeEl.min);
    const max = parseLooseNumber(rangeEl.max);

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      numberEl.value = formatWithCommas(v);
    });

    function clampAndSyncFromNumber() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) return;
      const clamped = clamp(typed, min, max);
      if (!Number.isFinite(clamped)) return;
      numberEl.value = formatWithCommas(clamped);
      rangeEl.value = String(Math.round(clamped));
    }

    numberEl.addEventListener("blur", clampAndSyncFromNumber);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        clampAndSyncFromNumber();
        numberEl.blur();
      }
    });
  }

  function getBoundValue(rangeEl, numberEl) {
    const n = parseLooseNumber(numberEl ? numberEl.value : "");
    if (Number.isFinite(n)) return n;
    const r = parseLooseNumber(rangeEl ? rangeEl.value : "");
    return r;
  }

  function computeTopDrivers(items) {
    const sorted = items
      .slice()
      .sort(function (a, b) {
        return (b.value || 0) - (a.value || 0);
      });

    return [
      sorted[0] ? sorted[0].label : "N/A",
      sorted[1] ? sorted[1].label : "N/A",
      sorted[2] ? sorted[2].label : "N/A"
    ];
  }

  function setPreviewValues(payload) {
    if (!payload) return;

    if (pvIncome) pvIncome.textContent = formatWithCommas(payload.income);
    if (pvEssentials) pvEssentials.textContent = formatWithCommas(payload.essentials);
    if (pvRatio) pvRatio.textContent = payload.ratio.toFixed(2);
    if (pvClass) pvClass.textContent = payload.classification;

    if (pvDriver1) pvDriver1.textContent = payload.drivers[0] || "N/A";
    if (pvDriver2) pvDriver2.textContent = payload.drivers[1] || "N/A";
    if (pvDriver3) pvDriver3.textContent = payload.drivers[2] || "N/A";

    if (pvCorrection) pvCorrection.textContent = payload.correctionText;
  }

  // ------------------------------------------------------------
  // 3) INIT DEFAULTS + BINDINGS
  // ------------------------------------------------------------
  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(groceriesNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtMinNumber);

  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(groceriesRange, groceriesNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtMinRange, debtMinNumber);

  // Set initial synced values (from sliders)
  function syncAllFromRanges() {
    if (incomeRange && incomeNumber) incomeNumber.value = formatWithCommas(parseLooseNumber(incomeRange.value));
    if (housingRange && housingNumber) housingNumber.value = formatWithCommas(parseLooseNumber(housingRange.value));
    if (utilitiesRange && utilitiesNumber) utilitiesNumber.value = formatWithCommas(parseLooseNumber(utilitiesRange.value));
    if (groceriesRange && groceriesNumber) groceriesNumber.value = formatWithCommas(parseLooseNumber(groceriesRange.value));
    if (transportRange && transportNumber) transportNumber.value = formatWithCommas(parseLooseNumber(transportRange.value));
    if (debtMinRange && debtMinNumber) debtMinNumber.value = formatWithCommas(parseLooseNumber(debtMinRange.value));
  }
  syncAllFromRanges();

  // ------------------------------------------------------------
  // 4) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs (allow commas)
      const income = getBoundValue(incomeRange, incomeNumber);
      const housing = getBoundValue(housingRange, housingNumber);
      const utilities = getBoundValue(utilitiesRange, utilitiesNumber);
      const groceries = getBoundValue(groceriesRange, groceriesNumber);
      const transport = getBoundValue(transportRange, transportNumber);
      const debtMin = getBoundValue(debtMinRange, debtMinNumber);

      // Existence guard
      if (
        !incomeNumber || !incomeRange ||
        !housingNumber || !housingRange ||
        !utilitiesNumber || !utilitiesRange ||
        !groceriesNumber || !groceriesRange ||
        !transportNumber || !transportRange ||
        !debtMinNumber || !debtMinRange
      ) {
        return;
      }

      // Validation
      const values = [
        { label: "Monthly income", value: income, allowZero: true },
        { label: "Housing", value: housing, allowZero: true },
        { label: "Utilities", value: utilities, allowZero: true },
        { label: "Groceries and essentials", value: groceries, allowZero: true },
        { label: "Transport", value: transport, allowZero: true },
        { label: "Debt minimums", value: debtMin, allowZero: true }
      ];

      for (let i = 0; i < values.length; i++) {
        const v = values[i].value;
        if (!Number.isFinite(v)) {
          setResultError("Enter valid numbers for all fields.");
          return;
        }
        if (v < 0) {
          setResultError(values[i].label + " cannot be negative.");
          return;
        }
      }

      if (!Number.isFinite(income) || income <= 0) {
        setResultError("Enter a valid Monthly income greater than 0.");
        return;
      }

      const essentials = housing + utilities + groceries + transport + debtMin;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Total essentials must be greater than 0.");
        return;
      }

      const ratio = income / essentials;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Your inputs produced an invalid result. Check your numbers and try again.");
        return;
      }

      // Classification thresholds
      let classification = "stable";
      if (ratio < 1.0) classification = "underprepared";
      else if (ratio < 1.2) classification = "borderline";

      // Drivers (largest essentials)
      const driverLabels = computeTopDrivers([
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries and essentials", value: groceries },
        { label: "Transport", value: transport },
        { label: "Debt minimums", value: debtMin }
      ]);

      // Minimum correction target (high-level)
      // Underprepared: close the gap to zero
      // Borderline: reach a basic margin target (ratio 1.2)
      // Stable: maintain buffer, no minimum required
      let correctionText = "No minimum correction required for this baseline check.";
      let correctionAmount = 0;

      if (classification === "underprepared") {
        correctionAmount = essentials - income;
        correctionText = "Minimum correction to reach break-even: " + formatWithCommas(correctionAmount) + " per month.";
      } else if (classification === "borderline") {
        const targetIncome = 1.2 * essentials;
        correctionAmount = targetIncome - income;
        if (correctionAmount < 0) correctionAmount = 0;
        correctionText = "Minimum correction to reach a basic buffer: " + formatWithCommas(correctionAmount) + " per month.";
      } else {
        correctionText = "Baseline is stable. Focus on maintaining buffer and protecting against shocks.";
      }

      // On-page output: exactly 1 headline, 1 sentence, 2 actions
      const headline = "Readiness: " + classification + " (coverage ratio " + ratio.toFixed(2) + ")";
      let sentence = "Your income covers your essentials with room for normal variation.";
      if (classification === "underprepared") {
        sentence = "Your essentials exceed your income, so the month is structurally short before any discretionary spending.";
      } else if (classification === "borderline") {
        sentence = "Your essentials are covered, but the margin is thin, so small variations can break the month.";
      }

      let action1 = "Confirm your biggest driver (" + driverLabels[0] + ") is accurate and unavoidable.";
      let action2 = "Set a minimum correction target and apply it using one lever: raise income, lower essentials, or both.";

      if (classification === "stable") {
        action1 = "Lock a buffer for irregular costs before expanding lifestyle spending.";
        action2 = "Stress-test your essentials for a higher-cost month and keep the ratio above your comfort threshold.";
      } else if (classification === "underprepared") {
        action1 = "Close the break-even gap first (" + formatWithCommas(essentials - income) + " per month) before optimizations.";
        action2 = "Focus on the top drivers first (" + driverLabels[0] + ", " + driverLabels[1] + ") to find real leverage.";
      } else if (classification === "borderline") {
        action1 = "Build a buffer margin toward 1.2x essentials, starting with the top driver (" + driverLabels[0] + ").";
        action2 = "Reduce fragility by smoothing variable essentials (utilities, groceries, transport) month to month.";
      }

      const resultHtml =
        '<div class="di-result-headline">' + headline + "</div>" +
        '<div class="di-result-sentence">' + sentence + "</div>" +
        '<ul class="di-actions">' +
          "<li>" + action1 + "</li>" +
          "<li>" + action2 + "</li>" +
        "</ul>";

      setResultSuccess(resultHtml);

      // Preview binding rule: update preview on every successful calculation
      setPreviewValues({
        income: income,
        essentials: essentials,
        ratio: ratio,
        classification: classification,
        drivers: driverLabels,
        correctionText: correctionText
      });
    });
  }

  // ------------------------------------------------------------
  // 5) WHATSAPP SHARE
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
