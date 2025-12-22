document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const roomLengthM = document.getElementById("roomLengthM");
  const roomWidthM = document.getElementById("roomWidthM");
  const ceilingHeightM = document.getElementById("ceilingHeightM");
  const insulationFactor = document.getElementById("insulationFactor");
  const sunFactor = document.getElementById("sunFactor");
  const peopleCount = document.getElementById("peopleCount");
  const equipmentWatts = document.getElementById("equipmentWatts");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(peopleCount);
  attachLiveFormatting(equipmentWatts);

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

  function validateAtLeastOne(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 1) {
      setResultError("Enter a valid " + fieldLabel + " of 1 or more.");
      return false;
    }
    return true;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  function pickStandardBtu(btu) {
    const standard = [9000, 12000, 18000, 24000, 30000, 36000, 48000];
    for (let i = 0; i < standard.length; i++) {
      if (btu <= standard[i]) return standard[i];
    }
    return standard[standard.length - 1];
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const lengthM = toNumber(roomLengthM ? roomLengthM.value : "");
      const widthM = toNumber(roomWidthM ? roomWidthM.value : "");

      const heightMRaw = toNumber(ceilingHeightM ? ceilingHeightM.value : "");
      const insulationRaw = toNumber(insulationFactor ? insulationFactor.value : "");
      const sunRaw = toNumber(sunFactor ? sunFactor.value : "");
      const peopleRaw = toNumber(peopleCount ? peopleCount.value : "");
      const wattsRaw = toNumber(equipmentWatts ? equipmentWatts.value : "");

      // Input existence guard
      if (!roomLengthM || !roomWidthM) return;

      // Validation (required)
      if (!validatePositive(lengthM, "room length (m)")) return;
      if (!validatePositive(widthM, "room width (m)")) return;

      // Defaults for optional inputs
      const heightM = Number.isFinite(heightMRaw) && heightMRaw > 0 ? heightMRaw : 2.4;
      const insFactor = Number.isFinite(insulationRaw) && insulationRaw > 0 ? insulationRaw : 1.0;
      const sFactor = Number.isFinite(sunRaw) && sunRaw > 0 ? sunRaw : 1.0;
      const people = Number.isFinite(peopleRaw) && peopleRaw >= 1 ? Math.round(peopleRaw) : 1;
      const watts = Number.isFinite(wattsRaw) && wattsRaw >= 0 ? wattsRaw : 0;

      // Validate optional ranges lightly (keep usable)
      if (!validatePositive(heightM, "ceiling height (m)")) return;
      if (!validatePositive(insFactor, "insulation factor")) return;
      if (!validatePositive(sFactor, "sun exposure factor")) return;
      if (!validateAtLeastOne(people, "people normally in the room")) return;
      if (!validateNonNegative(watts, "equipment watts")) return;

      // Clamp factors to avoid absurd outputs from typos
      const heightClamped = clamp(heightM, 2.0, 5.0);
      const insClamped = clamp(insFactor, 0.7, 1.5);
      const sunClamped = clamp(sFactor, 0.7, 1.5);

      // Calculation logic (simple room sizing)
      // Base rule of thumb: 20 BTU per square foot (moderate climates)
      // Convert m² to ft², then multiply by 20, then apply height ratio and simple adjustment factors.
      const areaM2 = lengthM * widthM;
      const areaFt2 = areaM2 * 10.7639104167;
      const baseBtu = areaFt2 * 20;

      const heightRatio = heightClamped / 2.4;
      const adjustedBtuCore = baseBtu * heightRatio * insClamped * sunClamped;

      // Occupant add-on: add 600 BTU/hr per extra person beyond 1
      const extraPeople = Math.max(0, people - 1);
      const peopleBtu = extraPeople * 600;

      // Equipment watts to BTU/hr: 1 W = 3.412141633 BTU/hr
      const equipmentBtu = watts * 3.412141633;

      const totalBtu = adjustedBtuCore + peopleBtu + equipmentBtu;

      // Secondary outputs
      const kwCooling = totalBtu / 3412.141633; // kW of cooling (approx)
      const tonsCooling = totalBtu / 12000;

      const standardBtu = pickStandardBtu(totalBtu);
      const standardKw = standardBtu / 3412.141633;
      const standardTons = standardBtu / 12000;

      // Build output HTML
      const resultHtml = `
        <p><strong>Recommended cooling capacity:</strong> ${formatNumberTwoDecimals(totalBtu)} BTU/hr</p>
        <p><strong>Equivalent:</strong> ${formatNumberTwoDecimals(kwCooling)} kW cooling (about ${formatNumberTwoDecimals(tonsCooling)} tons)</p>
        <p><strong>Suggested standard unit size to buy:</strong> ${formatNumberTwoDecimals(standardBtu)} BTU/hr (about ${formatNumberTwoDecimals(standardKw)} kW, ${formatNumberTwoDecimals(standardTons)} tons)</p>
        <hr>
        <p><strong>Breakdown (for transparency):</strong></p>
        <p>Base (area): ${formatNumberTwoDecimals(baseBtu)} BTU/hr</p>
        <p>After height + factors: ${formatNumberTwoDecimals(adjustedBtuCore)} BTU/hr</p>
        <p>People add-on: ${formatNumberTwoDecimals(peopleBtu)} BTU/hr</p>
        <p>Equipment add-on: ${formatNumberTwoDecimals(equipmentBtu)} BTU/hr</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Cooling Load Calculator (Simple Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
