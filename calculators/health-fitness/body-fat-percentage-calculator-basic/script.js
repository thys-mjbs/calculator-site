document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSystem = document.getElementById("unitSystem");
  const sex = document.getElementById("sex");

  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("weight");
  const waistInput = document.getElementById("waist");
  const neckInput = document.getElementById("neck");
  const hipInput = document.getElementById("hip");

  const femaleOnlyBlock = document.getElementById("femaleOnlyBlock");

  const heightHint = document.getElementById("heightHint");
  const weightHint = document.getElementById("weightHint");
  const waistHint = document.getElementById("waistHint");
  const neckHint = document.getElementById("neckHint");
  const hipHint = document.getElementById("hipHint");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(heightInput);
  attachLiveFormatting(weightInput);
  attachLiveFormatting(waistInput);
  attachLiveFormatting(neckInput);
  attachLiveFormatting(hipInput);

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
  function showSexFields() {
    if (!femaleOnlyBlock || !sex) return;
    const s = sex.value;
    if (s === "female") {
      femaleOnlyBlock.classList.remove("hidden");
    } else {
      femaleOnlyBlock.classList.add("hidden");
    }
    clearResult();
  }

  function showUnitHints() {
    if (!unitSystem) return;

    const isImperial = unitSystem.value === "imperial";

    if (heightHint) heightHint.textContent = isImperial ? "in" : "cm";
    if (weightHint) weightHint.textContent = isImperial ? "lb" : "kg";
    if (waistHint) waistHint.textContent = isImperial ? "in" : "cm";
    if (neckHint) neckHint.textContent = isImperial ? "in" : "cm";
    if (hipHint) hipHint.textContent = isImperial ? "in" : "cm";

    clearResult();
  }

  if (sex) {
    showSexFields();
    sex.addEventListener("change", showSexFields);
  }

  if (unitSystem) {
    showUnitHints();
    unitSystem.addEventListener("change", showUnitHints);
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

  function validateRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function cmFromInches(inches) {
    return inches * 2.54;
  }

  function kgFromLb(lb) {
    return lb * 0.45359237;
  }

  function roundOneDecimal(n) {
    return Math.round(n * 10) / 10;
  }

  function classifyBodyFat(sexValue, bf) {
    if (!Number.isFinite(bf)) return "Unknown";

    if (sexValue === "male") {
      if (bf < 6) return "Essential fat (very low)";
      if (bf < 14) return "Athletic to fitness range";
      if (bf < 18) return "Average (lean)";
      if (bf < 25) return "Average to higher";
      return "High";
    }

    // female
    if (bf < 14) return "Essential fat (very low)";
    if (bf < 21) return "Athletic to fitness range";
    if (bf < 25) return "Average (lean)";
    if (bf < 32) return "Average to higher";
    return "High";
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!heightInput || !weightInput || !waistInput || !neckInput || !sex || !unitSystem) return;

      const sexValue = sex.value;
      const unitValue = unitSystem.value;

      const heightRaw = toNumber(heightInput.value);
      const weightRaw = toNumber(weightInput.value);
      const waistRaw = toNumber(waistInput.value);
      const neckRaw = toNumber(neckInput.value);
      const hipRaw = hipInput ? toNumber(hipInput.value) : NaN;

      // Basic input validation
      if (!validatePositive(heightRaw, "height")) return;
      if (!validatePositive(weightRaw, "weight")) return;
      if (!validatePositive(waistRaw, "waist circumference")) return;
      if (!validatePositive(neckRaw, "neck circumference")) return;

      if (sexValue === "female") {
        if (!hipInput) {
          setResultError("Hip circumference input is missing.");
          return;
        }
        if (!validatePositive(hipRaw, "hip circumference")) return;
      }

      // Convert to inches for the US Navy formula
      let heightIn = heightRaw;
      let waistIn = waistRaw;
      let neckIn = neckRaw;
      let hipIn = hipRaw;
      let weightKg = weightRaw;

      if (unitValue === "metric") {
        heightIn = heightRaw / 2.54;
        waistIn = waistRaw / 2.54;
        neckIn = neckRaw / 2.54;
        hipIn = hipRaw / 2.54;
        weightKg = weightRaw;
      } else {
        // imperial inputs
        heightIn = heightRaw;
        waistIn = waistRaw;
        neckIn = neckRaw;
        hipIn = hipRaw;
        weightKg = kgFromLb(weightRaw);
      }

      // Practical guards to reduce impossible values
      if (!validateRange(heightIn, "height", 40, 100)) return;
      if (!validateRange(waistIn, "waist circumference", 15, 80)) return;
      if (!validateRange(neckIn, "neck circumference", 8, 30)) return;
      if (sexValue === "female") {
        if (!validateRange(hipIn, "hip circumference", 20, 80)) return;
      }

      // US Navy body fat formula (using log10)
      // Male: 86.010*log10(waist - neck) - 70.041*log10(height) + 36.76
      // Female: 163.205*log10(waist + hip - neck) - 97.684*log10(height) - 78.387
      let bodyFat = NaN;

      if (sexValue === "male") {
        const diff = waistIn - neckIn;
        if (!(diff > 0)) {
          setResultError("Waist must be larger than neck for this estimate.");
          return;
        }
        bodyFat = 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightIn) + 36.76;
      } else {
        const sum = waistIn + hipIn - neckIn;
        if (!(sum > 0)) {
          setResultError("Check measurements. Waist + hip must be larger than neck for this estimate.");
          return;
        }
        bodyFat = 163.205 * Math.log10(sum) - 97.684 * Math.log10(heightIn) - 78.387;
      }

      if (!Number.isFinite(bodyFat)) {
        setResultError("Could not calculate body fat. Check your inputs.");
        return;
      }

      // Clamp to plausible range for display
      if (bodyFat < 1) bodyFat = 1;
      if (bodyFat > 75) bodyFat = 75;

      const bfRounded = roundOneDecimal(bodyFat);
      const fatMassKg = (bfRounded / 100) * weightKg;
      const leanMassKg = weightKg - fatMassKg;

      const fatMassKg2 = formatNumberTwoDecimals(fatMassKg);
      const leanMassKg2 = formatNumberTwoDecimals(leanMassKg);

      const classification = classifyBodyFat(sexValue, bfRounded);

      // Helpful unit display for inputs
      const displayHeightCm = unitValue === "metric" ? heightRaw : cmFromInches(heightRaw);
      const displayWaistCm = unitValue === "metric" ? waistRaw : cmFromInches(waistRaw);
      const displayNeckCm = unitValue === "metric" ? neckRaw : cmFromInches(neckRaw);
      const displayHipCm = sexValue === "female" ? (unitValue === "metric" ? hipRaw : cmFromInches(hipRaw)) : null;

      const resultHtml =
        `<p><strong>Estimated body fat:</strong> ${bfRounded}%</p>` +
        `<p><strong>Category:</strong> ${classification}</p>` +
        `<p><strong>Estimated fat mass:</strong> ${fatMassKg2} kg</p>` +
        `<p><strong>Estimated lean mass:</strong> ${leanMassKg2} kg</p>` +
        `<div class="mini-note"><strong>Inputs used (approx):</strong> Height ${formatNumberTwoDecimals(displayHeightCm)} cm, Waist ${formatNumberTwoDecimals(displayWaistCm)} cm, Neck ${formatNumberTwoDecimals(displayNeckCm)} cm` +
        (sexValue === "female" ? `, Hip ${formatNumberTwoDecimals(displayHipCm)} cm` : ``) +
        `.</div>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Body Fat Percentage Calculator (Basic) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
