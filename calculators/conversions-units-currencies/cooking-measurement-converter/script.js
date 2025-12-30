document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const amountInput = document.getElementById("amountInput");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

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

  // Amount can be formatted with commas (helpful for large batch scaling like 1,000 mL)
  attachLiveFormatting(amountInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const UNIT_TO_ML = {
    cup: 236.5882365,
    tbsp: 14.7867648,
    tsp: 4.92892159,
    floz: 29.5735296,
    pint: 473.176473,
    quart: 946.352946,
    gallon: 3785.411784,
    ml: 1,
    l: 1000
  };

  const UNIT_LABEL = {
    cup: "Cup (US)",
    tbsp: "Tablespoon (US)",
    tsp: "Teaspoon (US)",
    floz: "Fluid ounce (US fl oz)",
    pint: "Pint (US)",
    quart: "Quart (US)",
    gallon: "Gallon (US)",
    ml: "Milliliter (mL)",
    l: "Liter (L)"
  };

  function convertVolume(amount, fromKey, toKey) {
    const fromFactor = UNIT_TO_ML[fromKey];
    const toFactor = UNIT_TO_ML[toKey];
    if (!Number.isFinite(fromFactor) || !Number.isFinite(toFactor)) return NaN;
    const ml = amount * fromFactor;
    const out = ml / toFactor;
    return out;
  }

  function buildEquivalents(amount, fromKey) {
    const baseMl = convertVolume(amount, fromKey, "ml");
    if (!Number.isFinite(baseMl)) return null;

    const eq = {
      ml: baseMl,
      l: baseMl / UNIT_TO_ML.l,
      cup: baseMl / UNIT_TO_ML.cup,
      tbsp: baseMl / UNIT_TO_ML.tbsp,
      tsp: baseMl / UNIT_TO_ML.tsp,
      floz: baseMl / UNIT_TO_ML.floz
    };

    return eq;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (!amountInput || !fromUnit || !toUnit) return;

      const amount = toNumber(amountInput.value);
      const fromKey = fromUnit.value;
      const toKey = toUnit.value;

      if (!validatePositive(amount, "amount")) return;

      if (!UNIT_TO_ML[fromKey] || !UNIT_TO_ML[toKey]) {
        setResultError("Choose valid units to convert between.");
        return;
      }

      const converted = convertVolume(amount, fromKey, toKey);
      if (!Number.isFinite(converted)) {
        setResultError("Could not convert with the selected units. Try again.");
        return;
      }

      const equivalents = buildEquivalents(amount, fromKey);
      const fromLabel = UNIT_LABEL[fromKey] || "From unit";
      const toLabel = UNIT_LABEL[toKey] || "To unit";

      const convertedStr = formatNumberTwoDecimals(converted);

      let secondaryHtml = "";
      if (equivalents) {
        const mlStr = formatNumberTwoDecimals(equivalents.ml);
        const lStr = formatNumberTwoDecimals(equivalents.l);
        const cupStr = formatNumberTwoDecimals(equivalents.cup);
        const tbspStr = formatNumberTwoDecimals(equivalents.tbsp);
        const tspStr = formatNumberTwoDecimals(equivalents.tsp);
        const flozStr = formatNumberTwoDecimals(equivalents.floz);

        secondaryHtml = `
          <div style="margin-top:10px;">
            <p><strong>Quick equivalents for the same amount:</strong></p>
            <ul>
              <li>${mlStr} mL</li>
              <li>${lStr} L</li>
              <li>${cupStr} cups (US)</li>
              <li>${tbspStr} tbsp (US)</li>
              <li>${tspStr} tsp (US)</li>
              <li>${flozStr} US fl oz</li>
            </ul>
          </div>
        `;
      }

      const resultHtml = `
        <p><strong>Converted amount:</strong> ${convertedStr} (${toLabel})</p>
        <p><strong>What this means:</strong> ${amount} (${fromLabel}) equals ${convertedStr} (${toLabel}).</p>
        ${secondaryHtml}
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
      const message = "Cooking Measurement Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
