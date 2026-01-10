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

  const rpClass = document.getElementById("rpClass");
  const rpRatio = document.getElementById("rpRatio");
  const rpIncome = document.getElementById("rpIncome");
  const rpEssentials = document.getElementById("rpEssentials");
  const rpDrivers = document.getElementById("rpDrivers");
  const rpCorrection = document.getElementById("rpCorrection");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(groceriesNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(medicalNumber);

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

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).replace(/,/g, "").trim();
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    return Math.round(n).toLocaleString("en-US");
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max) {
    if (!rangeEl || !numberEl) return;

    function setBoth(next) {
      const c = clamp(next, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatWithCommas(c);
    }

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      setBoth(v);
    });

    function commitTyped() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        setBoth(parseLooseNumber(rangeEl.value));
        return;
      }
      setBoth(typed);
    }

    numberEl.addEventListener("blur", commitTyped);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commitTyped();
    });

    const initial = parseLooseNumber(rangeEl.value);
    setBoth(Number.isFinite(initial) ? initial : min);
  }

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 200000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 50000);
  bindRangeAndNumber(groceriesRange, groceriesNumber, 0, 80000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 80000);
  bindRangeAndNumber(medicalRange, medicalNumber, 0, 80000);

  function setPreview(values) {
    if (!values) return;
    if (!rpClass || !rpRatio || !rpIncome || !rpEssentials || !rpDrivers || !rpCorrection) return;

    rpClass.textContent = values.classification;
    rpRatio.textContent = values.ratioText;
    rpIncome.textContent = values.incomeText;
    rpEssentials.textContent = values.essentialsText;
    rpDrivers.textContent = values.driversText;
    rpCorrection.textContent = values.correctionText;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const groceries = parseLooseNumber(groceriesNumber ? groceriesNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const medical = parseLooseNumber(medicalNumber ? medicalNumber.value : "");

      if (!incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !medicalNumber) return;

      if (!validateNonNegative(income, "income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries and essentials")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(medical, "insurance and medical")) return;

      const essentials = housing + utilities + groceries + transport + medical;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter essential expenses greater than 0.");
        return;
      }

      if (!Number.isFinite(income) || income < 0) {
        setResultError("Enter a valid income (0 or higher).");
        return;
      }

      const ratio = income / essentials;
      if (!Number.isFinite(ratio)) {
        setResultError("Something went wrong. Check your inputs and try again.");
        return;
      }

      let classification = "Underprepared";
      if (ratio >= 1.25) classification = "Stable";
      else if (ratio >= 1.0) classification = "Borderline";

      const ratioRounded = Math.round(ratio * 100) / 100;
      const ratioText = ratioRounded.toFixed(2) + "×";

      const stableTargetRatio = 1.25;
      const incomeNeededForStable = essentials * stableTargetRatio;
      const incomeGap = incomeNeededForStable - income;

      const essentialsMaxForStable = income / stableTargetRatio;
      const essentialsCut = essentials - essentialsMaxForStable;

      const correctionText =
        incomeGap > 0 && essentialsCut > 0
          ? "Increase income by " + formatWithCommas(Math.ceil(incomeGap)) + " or reduce essentials by " + formatWithCommas(Math.ceil(essentialsCut)) + " to reach stable."
          : "You are already at or above the stable threshold for essentials coverage.";

      const drivers = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries and essentials", value: groceries },
        { label: "Transport", value: transport },
        { label: "Insurance and medical", value: medical }
      ].filter(function (d) { return Number.isFinite(d.value) && d.value > 0; });

      drivers.sort(function (a, b) { return b.value - a.value; });

      const topDrivers = drivers.slice(0, 3).map(function (d) { return d.label; });
      const driversText = topDrivers.length ? topDrivers.join(", ") : "No drivers available";

      const headline = classification + " coverage (" + ratioText + ")";
      let interpretation = "Your income does not cover your essentials on paper. This structure typically relies on debt, arrears, or support.";
      if (classification === "Borderline") {
        interpretation = "Your income covers essentials, but the margin is thin. Normal month variance can push you into debt or tradeoffs.";
      }
      if (classification === "Stable") {
        interpretation = "Your income covers essentials with meaningful margin. This reduces fragility and makes planning easier.";
      }

      let action1 = "Action 1: Reduce your largest essential driver by a fixed amount this month.";
      let action2 = "Action 2: Lock a minimum buffer by targeting stable coverage (1.25×) before adding commitments.";

      if (incomeGap > 0 || essentialsCut > 0) {
        const aIncome = incomeGap > 0 ? ("Increase income by " + formatWithCommas(Math.ceil(incomeGap)) + " to reach stable.") : "Maintain current income and protect your margin.";
        const aEss = essentialsCut > 0 ? ("Reduce essentials by " + formatWithCommas(Math.ceil(essentialsCut)) + " to reach stable.") : "Avoid increasing essentials; keep the stable margin.";
        action1 = "Action 1: " + aEss;
        action2 = "Action 2: " + aIncome;
      } else {
        action1 = "Action 1: Keep essentials stable and avoid new fixed commitments for 30 days.";
        action2 = "Action 2: Redirect the margin into one priority (buffer or debt reduction) and track it monthly.";
      }

      const resultHtml =
        "<p><strong>" + headline + "</strong></p>" +
        "<p>" + interpretation + "</p>" +
        "<p><strong>Immediate actions:</strong></p>" +
        "<p>" + action1 + "</p>" +
        "<p>" + action2 + "</p>";

      setResultSuccess(resultHtml);

      const previewPayload = {
        classification: classification,
        ratioText: ratioText,
        incomeText: formatWithCommas(Math.round(income)),
        essentialsText: formatWithCommas(Math.round(essentials)),
        driversText: driversText,
        correctionText: correctionText
      };

      setPreview(previewPayload);
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
