document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");
  const weeksBetween = document.getElementById("weeksBetween");

  const waistStart = document.getElementById("waistStart");
  const waistCurrent = document.getElementById("waistCurrent");

  const hipsStart = document.getElementById("hipsStart");
  const hipsCurrent = document.getElementById("hipsCurrent");

  const chestStart = document.getElementById("chestStart");
  const chestCurrent = document.getElementById("chestCurrent");

  const armStart = document.getElementById("armStart");
  const armCurrent = document.getElementById("armCurrent");

  const thighStart = document.getElementById("thighStart");
  const thighCurrent = document.getElementById("thighCurrent");

  const weightStart = document.getElementById("weightStart");
  const weightCurrent = document.getElementById("weightCurrent");
  const weightUnitSelect = document.getElementById("weightUnitSelect");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(weeksBetween);

  attachLiveFormatting(waistStart);
  attachLiveFormatting(waistCurrent);

  attachLiveFormatting(hipsStart);
  attachLiveFormatting(hipsCurrent);

  attachLiveFormatting(chestStart);
  attachLiveFormatting(chestCurrent);

  attachLiveFormatting(armStart);
  attachLiveFormatting(armCurrent);

  attachLiveFormatting(thighStart);
  attachLiveFormatting(thighCurrent);

  attachLiveFormatting(weightStart);
  attachLiveFormatting(weightCurrent);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function buildRow(label, startVal, currentVal, unitLabel) {
    const change = currentVal - startVal;
    const pct = (change / startVal) * 100;

    const direction = change === 0 ? "No change" : change < 0 ? "Down" : "Up";

    const startText = formatNumberTwoDecimals(startVal) + " " + unitLabel;
    const currentText = formatNumberTwoDecimals(currentVal) + " " + unitLabel;

    const changeText =
      (change >= 0 ? "+" : "") + formatNumberTwoDecimals(change) + " " + unitLabel;

    const pctText =
      (pct >= 0 ? "+" : "") + formatNumberTwoDecimals(pct) + "%";

    return (
      "<tr>" +
      "<td>" + label + "</td>" +
      "<td>" + startText + "</td>" +
      "<td>" + currentText + "</td>" +
      "<td>" + changeText + "</td>" +
      "<td>" + pctText + "</td>" +
      "<td>" + direction + "</td>" +
      "</tr>"
    );
  }

  function tryAddPair(rows, usedLabels, label, startEl, currentEl, unitLabel) {
    const startRaw = startEl ? startEl.value : "";
    const currentRaw = currentEl ? currentEl.value : "";

    const start = toNumber(startRaw);
    const current = toNumber(currentRaw);

    const hasStart = Number.isFinite(start) && start > 0;
    const hasCurrent = Number.isFinite(current) && current > 0;

    if (hasStart && hasCurrent) {
      rows.push(buildRow(label, start, current, unitLabel));
      usedLabels.push(label);
      return { included: true, start: start, current: current };
    }

    return { included: false, start: start, current: current, hasStart: hasStart, hasCurrent: hasCurrent };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const waistStartVal = toNumber(waistStart ? waistStart.value : "");
      const waistCurrentVal = toNumber(waistCurrent ? waistCurrent.value : "");

      // Validation: waist pair required
      if (!validatePositive(waistStartVal, "waist (start)")) return;
      if (!validatePositive(waistCurrentVal, "waist (current)")) return;

      const unit = unitSelect ? unitSelect.value : "cm";
      const unitLabel = unit === "in" ? "in" : "cm";

      // Weeks between (optional, default 4)
      let weeks = toNumber(weeksBetween ? weeksBetween.value : "");
      let usedDefaultWeeks = false;

      if (!Number.isFinite(weeks) || weeks <= 0) {
        weeks = 4;
        usedDefaultWeeks = true;
      }

      // Build rows
      const rows = [];
      const usedLabels = [];

      // Waist always included
      rows.push(buildRow("Waist", waistStartVal, waistCurrentVal, unitLabel));
      usedLabels.push("Waist");

      const hipsPair = tryAddPair(rows, usedLabels, "Hips", hipsStart, hipsCurrent, unitLabel);
      const chestPair = tryAddPair(rows, usedLabels, "Chest", chestStart, chestCurrent, unitLabel);
      const armPair = tryAddPair(rows, usedLabels, "Upper arm", armStart, armCurrent, unitLabel);
      const thighPair = tryAddPair(rows, usedLabels, "Thigh", thighStart, thighCurrent, unitLabel);

      // Totals for included measurements (size metrics only)
      const includedPairs = [
        { label: "Waist", start: waistStartVal, current: waistCurrentVal },
        hipsPair.included ? { label: "Hips", start: hipsPair.start, current: hipsPair.current } : null,
        chestPair.included ? { label: "Chest", start: chestPair.start, current: chestPair.current } : null,
        armPair.included ? { label: "Upper arm", start: armPair.start, current: armPair.current } : null,
        thighPair.included ? { label: "Thigh", start: thighPair.start, current: thighPair.current } : null
      ].filter(Boolean);

      let sumStart = 0;
      let sumCurrent = 0;
      for (let i = 0; i < includedPairs.length; i++) {
        sumStart += includedPairs[i].start;
        sumCurrent += includedPairs[i].current;
      }
      const sumChange = sumCurrent - sumStart;

      const waistChange = waistCurrentVal - waistStartVal;
      const waistPct = (waistChange / waistStartVal) * 100;
      const waistPerWeek = waistChange / weeks;

      const sumPerWeek = sumChange / weeks;

      // Optional weight delta (separate units)
      const wStart = toNumber(weightStart ? weightStart.value : "");
      const wCurrent = toNumber(weightCurrent ? weightCurrent.value : "");
      const weightUnit = weightUnitSelect ? weightUnitSelect.value : "kg";
      const weightUnitLabel = weightUnit === "lb" ? "lb" : "kg";

      const hasWStart = Number.isFinite(wStart) && wStart > 0;
      const hasWCurrent = Number.isFinite(wCurrent) && wCurrent > 0;

      let weightHtml = "";
      if (hasWStart && hasWCurrent) {
        const wChange = wCurrent - wStart;
        const wPct = (wChange / wStart) * 100;
        const wPerWeek = wChange / weeks;

        weightHtml =
          "<p class=\"result-kpi\"><strong>Weight change:</strong> " +
          (wChange >= 0 ? "+" : "") + formatNumberTwoDecimals(wChange) + " " + weightUnitLabel +
          " (" + (wPct >= 0 ? "+" : "") + formatNumberTwoDecimals(wPct) + "%)" +
          " • " + (wPerWeek >= 0 ? "+" : "") + formatNumberTwoDecimals(wPerWeek) + " " + weightUnitLabel + "/week</p>";
      }

      // Notes for skipped optional fields
      const skippedNotes = [];
      function addSkipNote(label, pairObj) {
        if (!pairObj || pairObj.included) return;
        if (pairObj.hasStart && !pairObj.hasCurrent) skippedNotes.push(label + " was skipped because the current value is missing.");
        if (!pairObj.hasStart && pairObj.hasCurrent) skippedNotes.push(label + " was skipped because the start value is missing.");
      }

      addSkipNote("Hips", hipsPair);
      addSkipNote("Chest", chestPair);
      addSkipNote("Upper arm", armPair);
      addSkipNote("Thigh", thighPair);

      if (weightStart && weightCurrent) {
        if (hasWStart && !hasWCurrent) skippedNotes.push("Weight was skipped because the current value is missing.");
        if (!hasWStart && hasWCurrent) skippedNotes.push("Weight was skipped because the start value is missing.");
      }

      const tableHtml =
        "<table class=\"result-table\">" +
        "<thead><tr>" +
        "<th>Area</th><th>Start</th><th>Current</th><th>Change</th><th>% change</th><th>Trend</th>" +
        "</tr></thead>" +
        "<tbody>" + rows.join("") + "</tbody>" +
        "</table>";

      const weeksNote = usedDefaultWeeks
        ? "Weeks between was not provided (or was invalid), so pace is estimated using 4 weeks."
        : "Pace is calculated using " + formatNumberTwoDecimals(weeks) + " weeks.";

      const resultHtml =
        "<p class=\"result-kpi\"><strong>Waist change:</strong> " +
        (waistChange >= 0 ? "+" : "") + formatNumberTwoDecimals(waistChange) + " " + unitLabel +
        " (" + (waistPct >= 0 ? "+" : "") + formatNumberTwoDecimals(waistPct) + "%)" +
        " • " + (waistPerWeek >= 0 ? "+" : "") + formatNumberTwoDecimals(waistPerWeek) + " " + unitLabel + "/week</p>" +

        "<p class=\"result-kpi\"><strong>Total change across included measurements:</strong> " +
        (sumChange >= 0 ? "+" : "") + formatNumberTwoDecimals(sumChange) + " " + unitLabel +
        " • " + (sumPerWeek >= 0 ? "+" : "") + formatNumberTwoDecimals(sumPerWeek) + " " + unitLabel + "/week</p>" +

        weightHtml +

        tableHtml +

        "<p class=\"result-note\"><strong>Notes:</strong> " + weeksNote + "</p>" +
        (skippedNotes.length > 0
          ? "<ul class=\"result-note\"><li>" + skippedNotes.join("</li><li>") + "</li></ul>"
          : "");

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Body Measurements Progress Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
