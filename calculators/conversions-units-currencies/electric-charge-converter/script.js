document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const chargeValueInput = document.getElementById("chargeValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");
  const showAllCheckbox = document.getElementById("showAll");

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
  attachLiveFormatting(chargeValueInput);

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
  function formatCharge(value) {
    if (!Number.isFinite(value)) return "—";
    if (value === 0) return "0";
    const abs = Math.abs(value);

    // Keep small and huge values readable without fake precision
    if (abs < 0.01 || abs >= 1000000) {
      return value.toExponential(6);
    }

    return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  const UNIT_FACTORS_TO_COULOMB = {
    C: 1,
    mC: 1e-3,
    uC: 1e-6,
    nC: 1e-9,
    pC: 1e-12,
    Ah: 3600,
    mAh: 3.6,
    F: 96485.33212
  };

  const UNIT_LABELS = {
    C: "C",
    mC: "mC",
    uC: "μC",
    nC: "nC",
    pC: "pC",
    Ah: "Ah",
    mAh: "mAh",
    F: "F"
  };

  function buildQuickEquivalents(coulombsValue, excludeUnitKey) {
    const order = ["C", "mC", "uC", "nC", "pC", "Ah", "mAh", "F"];
    const rows = [];

    for (let i = 0; i < order.length; i++) {
      const k = order[i];
      if (k === excludeUnitKey) continue;

      const factor = UNIT_FACTORS_TO_COULOMB[k];
      const v = coulombsValue / factor;

      rows.push(
        `<div class="result-row"><span class="k">${UNIT_LABELS[k]}</span><span class="v">${formatCharge(v)}</span></div>`
      );
    }

    return rows.join("");
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const chargeValue = toNumber(chargeValueInput ? chargeValueInput.value : "");
      const fromUnit = fromUnitSelect ? fromUnitSelect.value : "";
      const toUnit = toUnitSelect ? toUnitSelect.value : "";
      const showAll = showAllCheckbox ? !!showAllCheckbox.checked : false;

      // Basic existence guard
      if (!chargeValueInput || !fromUnitSelect || !toUnitSelect) return;

      // Validation
      if (!validateNonNegative(chargeValue, "charge value")) return;
      if (!UNIT_FACTORS_TO_COULOMB[fromUnit] || !UNIT_FACTORS_TO_COULOMB[toUnit]) {
        setResultError("Select valid units to convert between.");
        return;
      }

      // Calculation logic (via base unit: coulombs)
      const coulombs = chargeValue * UNIT_FACTORS_TO_COULOMB[fromUnit];
      const converted = coulombs / UNIT_FACTORS_TO_COULOMB[toUnit];

      // Output
      const mainLine = `<div class="result-row"><span class="k">${formatCharge(chargeValue)} ${UNIT_LABELS[fromUnit]}</span><span class="v">${formatCharge(converted)} ${UNIT_LABELS[toUnit]}</span></div>`;

      let extrasHtml = "";
      if (showAll) {
        extrasHtml = `
          <div class="small-note">Quick equivalents for the same charge:</div>
          <div class="result-grid">
            ${buildQuickEquivalents(coulombs, toUnit)}
          </div>
        `;
      } else {
        // Always provide at least one secondary insight, even when quick list is off
        const asC = coulombs;
        const asmAh = coulombs / UNIT_FACTORS_TO_COULOMB.mAh;

        extrasHtml = `
          <div class="result-grid">
            <div class="result-row"><span class="k">Coulombs (C)</span><span class="v">${formatCharge(asC)}</span></div>
            <div class="result-row"><span class="k">Milliampere-hours (mAh)</span><span class="v">${formatCharge(asmAh)}</span></div>
          </div>
        `;
      }

      const resultHtml = `
        <div class="result-grid">
          ${mainLine}
        </div>
        ${extrasHtml}
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
      const message = "Electric Charge Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
