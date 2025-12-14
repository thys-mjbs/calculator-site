document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const systemType = document.getElementById("systemType");
  const supplyVoltage = document.getElementById("supplyVoltage");
  const loadCurrent = document.getElementById("loadCurrent");
  const oneWayLength = document.getElementById("oneWayLength");
  const conductorMaterial = document.getElementById("conductorMaterial");
  const cableSize = document.getElementById("cableSize");
  const customResistanceBlock = document.getElementById("customResistanceBlock");
  const customResistance = document.getElementById("customResistance");
  const maxDropPercent = document.getElementById("maxDropPercent");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Not used (systemType is not a UI mode that changes major blocks besides custom resistance).
  

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(supplyVoltage);
  attachLiveFormatting(loadCurrent);
  attachLiveFormatting(oneWayLength);
  attachLiveFormatting(customResistance);
  attachLiveFormatting(maxDropPercent);

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
    // Not used
    
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
  // UI: custom resistance toggling
  // ------------------------------------------------------------
  function syncCustomResistanceVisibility() {
    if (!cableSize || !customResistanceBlock) return;
    const isCustom = cableSize.value === "custom";
    customResistanceBlock.classList.toggle("hidden", !isCustom);
    clearResult();
  }

  if (cableSize) {
    syncCustomResistanceVisibility();
    cableSize.addEventListener("change", syncCustomResistanceVisibility);
  }

  // ------------------------------------------------------------
  // Resistance tables (typical values, Ω/km at ~20°C)
  // ------------------------------------------------------------
  const resistanceOhmPerKm = {
    copper: {
      "1.5": 12.1,
      "2.5": 7.41,
      "4": 4.61,
      "6": 3.08,
      "10": 1.83,
      "16": 1.15,
      "25": 0.727,
      "35": 0.524,
      "50": 0.387,
      "70": 0.268,
      "95": 0.193,
      "120": 0.153,
      "150": 0.124,
      "185": 0.0991,
      "240": 0.0754
    },
    aluminum: {
      "1.5": 19.1,
      "2.5": 12.1,
      "4": 7.64,
      "6": 5.08,
      "10": 3.08,
      "16": 1.91,
      "25": 1.20,
      "35": 0.868,
      "50": 0.641,
      "70": 0.443,
      "95": 0.320,
      "120": 0.253,
      "150": 0.206,
      "185": 0.164,
      "240": 0.125
    }
  };

  function getSelectedResistanceOhmPerKm() {
    if (!conductorMaterial || !cableSize) return NaN;
    const mat = conductorMaterial.value;
    const size = cableSize.value;

    if (size === "custom") {
      const rCustom = toNumber(customResistance ? customResistance.value : "");
      return rCustom;
    }

    const table = resistanceOhmPerKm[mat];
    if (!table) return NaN;

    const r = table[size];
    return Number.isFinite(r) ? r : NaN;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read mode (system type)
      const sys = systemType ? systemType.value : "dc";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const vSupply = toNumber(supplyVoltage ? supplyVoltage.value : "");
      const iLoad = toNumber(loadCurrent ? loadCurrent.value : "");
      const lengthM = toNumber(oneWayLength ? oneWayLength.value : "");
      const maxPct = toNumber(maxDropPercent ? maxDropPercent.value : "");
      const rOhmPerKm = getSelectedResistanceOhmPerKm();

      // Input existence guard
      if (!systemType || !supplyVoltage || !loadCurrent || !oneWayLength || !conductorMaterial || !cableSize || !maxDropPercent) return;

      // Validation
      if (!validatePositive(vSupply, "supply voltage")) return;
      if (!validatePositive(iLoad, "load current")) return;
      if (!validatePositive(lengthM, "one-way cable length")) return;
      if (!validateNonNegative(maxPct, "target max voltage drop (%)")) return;
      if (!Number.isFinite(rOhmPerKm) || rOhmPerKm <= 0) {
        setResultError("Enter a valid conductor resistance (Ω/km) greater than 0.");
        return;
      }
      if (maxPct > 100) {
        setResultError("Enter a sensible target max voltage drop (%) (100 or lower).");
        return;
      }

      // Calculation logic
      const lengthKm = lengthM / 1000;

      let vDrop = 0;
      let methodLabel = "";

      if (sys === "ac3") {
        // Three-phase approximation (balanced load)
        vDrop = Math.sqrt(3) * iLoad * rOhmPerKm * lengthKm;
        methodLabel = "Three-phase (√3 × I × R × L)";
      } else {
        // DC or single-phase: round-trip length
        vDrop = 2 * iLoad * rOhmPerKm * lengthKm;
        methodLabel = (sys === "ac1") ? "Single-phase (2 × I × R × L)" : "DC (2 × I × R × L)";
      }

      const pctDrop = (vDrop / vSupply) * 100;
      const vEnd = vSupply - vDrop;

      const isOverTarget = maxPct > 0 ? pctDrop > maxPct : false;

      // Build output HTML
      const rDisplay = formatNumberTwoDecimals(rOhmPerKm);
      const vDropDisplay = formatNumberTwoDecimals(vDrop);
      const pctDisplay = formatNumberTwoDecimals(pctDrop);
      const vEndDisplay = formatNumberTwoDecimals(vEnd);
      const targetDisplay = formatNumberTwoDecimals(maxPct);

      const statusLine = (maxPct > 0)
        ? (isOverTarget
          ? `<p><strong>Status:</strong> Above your target (${targetDisplay}%). Consider a larger cable or shorter run.</p>`
          : `<p><strong>Status:</strong> Within your target (${targetDisplay}%).</p>`)
        : `<p><strong>Status:</strong> No target set. Add a target % if you want a pass/fail check.</p>`;

      const resultHtml = `
        <p><strong>Voltage drop:</strong> ${vDropDisplay} V</p>
        <p><strong>Voltage drop (%):</strong> ${pctDisplay}%</p>
        <p><strong>Estimated load voltage:</strong> ${vEndDisplay} V</p>
        ${statusLine}
        <p><strong>Details:</strong> ${methodLabel}, R = ${rDisplay} Ω/km, length = ${formatNumberTwoDecimals(lengthM)} m (one-way), current = ${formatNumberTwoDecimals(iLoad)} A.</p>
      `;

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Voltage Drop Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
