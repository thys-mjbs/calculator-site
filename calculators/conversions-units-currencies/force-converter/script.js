document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const forceValueInput = document.getElementById("forceValue");
  const fromUnitSelect = document.getElementById("fromUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(forceValueInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) CONVERSION HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  const N_PER = {
    N: 1,
    kN: 1000,
    lbf: 4.4482216152605,
    kgf: 9.80665,
    dyn: 0.00001
  };

  function toNewtons(value, unit) {
    const factor = N_PER[unit];
    return value * factor;
  }

  function fromNewtons(newtons, unit) {
    const factor = N_PER[unit];
    return newtons / factor;
  }

  function unitLabel(unit) {
    if (unit === "N") return "Newtons (N)";
    if (unit === "kN") return "Kilonewtons (kN)";
    if (unit === "lbf") return "Pounds-force (lbf)";
    if (unit === "kgf") return "Kilogram-force (kgf)";
    if (unit === "dyn") return "Dynes (dyn)";
    return unit;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Guards
      if (!forceValueInput || !fromUnitSelect) return;

      clearResult();

      const inputValue = toNumber(forceValueInput.value);
      const fromUnit = fromUnitSelect.value;

      if (!validateFinite(inputValue, "force value")) return;
      if (!N_PER[fromUnit]) {
        setResultError("Choose a valid force unit.");
        return;
      }

      const newtons = toNewtons(inputValue, fromUnit);

      const outN = fromNewtons(newtons, "N");
      const outkN = fromNewtons(newtons, "kN");
      const outlbf = fromNewtons(newtons, "lbf");
      const outkgf = fromNewtons(newtons, "kgf");
      const outdyn = fromNewtons(newtons, "dyn");

      const resultHtml = `
        <p><strong>Converted force:</strong> ${formatNumberTwoDecimals(newtons)} N</p>
        <p><strong>Your input:</strong> ${formatNumberTwoDecimals(inputValue)} (${unitLabel(fromUnit)})</p>
        <hr>
        <p><strong>Newtons (N):</strong> ${formatNumberTwoDecimals(outN)}</p>
        <p><strong>Kilonewtons (kN):</strong> ${formatNumberTwoDecimals(outkN)}</p>
        <p><strong>Pounds-force (lbf):</strong> ${formatNumberTwoDecimals(outlbf)}</p>
        <p><strong>Kilogram-force (kgf):</strong> ${formatNumberTwoDecimals(outkgf)}</p>
        <p><strong>Dynes (dyn):</strong> ${formatNumberTwoDecimals(outdyn)}</p>
        <p><em>Note:</em> Values are rounded to two decimals for readability.</p>
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
      const message = "Force Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
