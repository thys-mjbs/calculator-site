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

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  

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

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return n;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function syncRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    rangeEl.addEventListener("input", function () {
      numberEl.value = formatInputWithCommas(rangeEl.value);
      clearResult();
    });

    function commit() {
      const raw = toNumber(numberEl.value);
      if (!Number.isFinite(raw)) {
        numberEl.value = formatInputWithCommas(rangeEl.value);
        return;
      }
      const min = Number(rangeEl.min);
      const max = Number(rangeEl.max);
      const c = clamp(raw, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatInputWithCommas(String(c));
    }

    numberEl.addEventListener("blur", function () {
      commit();
      clearResult();
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
        clearResult();
      }
    });

    numberEl.value = formatInputWithCommas(rangeEl.value);
  }

  syncRangeAndNumber(incomeRange, incomeNumber);
  syncRangeAndNumber(housingRange, housingNumber);
  syncRangeAndNumber(utilitiesRange, utilitiesNumber);
  syncRangeAndNumber(foodRange, foodNumber);
  syncRangeAndNumber(transportRange, transportNumber);
  syncRangeAndNumber(debtRange, debtNumber);
  syncRangeAndNumber(insuranceMedicalRange, insuranceMedicalNumber);
  syncRangeAndNumber(childcareRange, childcareNumber);
  syncRangeAndNumber(educationRange, educationNumber);
  syncRangeAndNumber(communicationsRange, communicationsNumber);
  syncRangeAndNumber(householdRange, householdNumber);
  syncRangeAndNumber(irregularRange, irregularNumber);

  function setTextById(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }

  function formatIntWithCommas(n) {
    if (!Number.isFinite(n)) return "-";
    const rounded = Math.round(n);
    return formatInputWithCommas(String(rounded));
  }

  function classifyRatio(ratio) {
    if (!Number.isFinite(ratio)) return "Invalid";
    if (ratio < 1.0) return "Underprepared";
    if (ratio < 1.2) return "Borderline";
    return "Stable";
  }

  function topDrivers(items) {
    const sorted = items
      .filter(function (x) { return Number.isFinite(x.value) && x.value > 0; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 3)
      .map(function (x) { return x.label; });

    return sorted.length ? sorted : ["No drivers detected"];
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      

      const income = toNumber(incomeNumber ? incomeNumber.value : "");
      const housing = toNumber(housingNumber ? housingNumber.value : "");
      const utilities = toNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = toNumber(foodNumber ? foodNumber.value : "");
      const transport = toNumber(transportNumber ? transportNumber.value : "");
      const debt = toNumber(debtNumber ? debtNumber.value : "");
      const insuranceMedical = toNumber(insuranceMedicalNumber ? insuranceMedicalNumber.value : "");
      const childcare = toNumber(childcareNumber ? childcareNumber.value : "");
      const education = toNumber(educationNumber ? educationNumber.value : "");
      const communications = toNumber(communicationsNumber ? communicationsNumber.value : "");
      const household = toNumber(householdNumber ? householdNumber.value : "");
      const irregular = toNumber(irregularNumber ? irregularNumber.value : "");

      

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "debt minimums")) return;
      if (!validateNonNegative(insuranceMedical, "essential insurance and medical")) return;
      if (!validateNonNegative(childcare, "childcare and dependents essentials")) return;
      if (!validateNonNegative(education, "education and fees")) return;
      if (!validateNonNegative(communications, "communications")) return;
      if (!validateNonNegative(household, "household essentials")) return;
      if (!validateNonNegative(irregular, "irregular essentials monthly equivalent")) return;

      const essentials =
        housing +
        utilities +
        food +
        transport +
        debt +
        insuranceMedical +
        childcare +
        education +
        communications +
        household +
        irregular;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Essentials must be greater than 0 to calculate coverage.");
        return;
      }

      const ratio = income / essentials;
      if (!Number.isFinite(ratio) || Number.isNaN(ratio)) {
        setResultError("Unable to calculate. Check inputs and try again.");
        return;
      }

      const targetRatio = 1.2;
      const status = classifyRatio(ratio);

      const buffer = income - essentials;
      const deficit = Math.max(0, essentials - income);
      const requiredIncomeForBalance = essentials * 1.0;
      const requiredIncomeForStability = essentials * targetRatio;

      const toBalance = Math.max(0, requiredIncomeForBalance - income);
      const toStability = Math.max(0, requiredIncomeForStability - income);

      const drivers = topDrivers([
        { label: "Housing", value: housing },
        { label: "Debt minimums", value: debt },
        { label: "Transport", value: transport },
        { label: "Food", value: food },
        { label: "Insurance and medical", value: insuranceMedical },
        { label: "Childcare", value: childcare },
        { label: "Education", value: education },
        { label: "Utilities", value: utilities },
        { label: "Irregular essentials", value: irregular },
        { label: "Household essentials", value: household },
        { label: "Communications", value: communications }
      ]);

      let interpretation = "";
      if (status === "Underprepared") {
        interpretation = "Income does not cover essentials, so the month is structurally short.";
      } else if (status === "Borderline") {
        interpretation = "Income covers essentials, but the buffer is too thin for normal variation.";
      } else {
        interpretation = "Income covers essentials with a buffer, so baseline readiness is stable.";
      }

      let minimumCorrection = "";
      if (status === "Underprepared") {
        minimumCorrection = "Minimum correction to reach 1.00 is " + formatIntWithCommas(toBalance) + " per month (income increase or essentials reduction).";
      } else if (status === "Borderline") {
        minimumCorrection = "Minimum correction to reach " + targetRatio.toFixed(2) + " is " + formatIntWithCommas(toStability) + " per month in additional margin.";
      } else {
        minimumCorrection = "Maintain the ratio at or above " + targetRatio.toFixed(2) + " by preventing essentials from rising faster than income.";
      }

      let action1 = "";
      let action2 = "";
      let action3 = "";

      if (status === "Underprepared") {
        action1 = "Close the deficit first: target " + formatIntWithCommas(deficit) + " per month to reach balance (1.00).";
        action2 = "Attack a top driver: start with " + drivers[0] + " or " + drivers[1] + " because they dominate the ratio.";
        action3 = "If cost reduction cannot close the deficit quickly, prioritise a reliable income increase until balance is reached.";
      } else if (status === "Borderline") {
        action1 = "Build a stability buffer: target " + formatIntWithCommas(toStability) + " per month to reach " + targetRatio.toFixed(2) + ".";
        action2 = "Lock one structural change in a top driver: " + drivers[0] + " or " + drivers[1] + ".";
        action3 = "Stop essentials drift: set a hard ceiling for essentials at " + formatIntWithCommas(income / targetRatio) + " to protect stability.";
      } else {
        action1 = "Protect the base: keep essentials at or below " + formatIntWithCommas(income / targetRatio) + " to maintain the target ratio.";
        action2 = "Allocate surplus deliberately: buffer is " + formatIntWithCommas(Math.max(0, buffer)) + " per month above essentials.";
        action3 = "Choose one priority goal and fund it consistently, without increasing recurring essentials.";
      }

      const resultHtml =
        "<div><strong>Status:</strong> " + status + "</div>" +
        "<div><strong>Coverage ratio:</strong> " + ratio.toFixed(2) + "</div>" +
        "<div><strong>Essentials total:</strong> " + formatIntWithCommas(essentials) + "</div>" +
        "<div><strong>Income:</strong> " + formatIntWithCommas(income) + "</div>" +
        "<div><strong>Buffer or gap:</strong> " + (buffer >= 0 ? formatIntWithCommas(buffer) + " buffer" : formatIntWithCommas(deficit) + " gap") + "</div>" +
        "<div>" + interpretation + "</div>" +
        "<div><strong>Minimum correction:</strong> " + minimumCorrection + "</div>" +
        "<div><strong>Top drivers:</strong> " + drivers.join(", ") + "</div>" +
        "<div><strong>Action order:</strong></div>" +
        "<div>1) " + action1 + "</div>" +
        "<div>2) " + action2 + "</div>" +
        "<div>3) " + action3 + "</div>";

      setResultSuccess(resultHtml);

      setTextById("diCoverageRatio", ratio.toFixed(2));
      setTextById("diTargetRatio", targetRatio.toFixed(2));
      setTextById("diEssentialsTotal", formatIntWithCommas(essentials));
      setTextById("diBufferOrGap", buffer >= 0 ? formatIntWithCommas(buffer) + " buffer" : formatIntWithCommas(deficit) + " gap");
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
