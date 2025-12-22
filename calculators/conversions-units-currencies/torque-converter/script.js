document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const torqueValueInput = document.getElementById("torqueValue");
  const fromUnitSelect = document.getElementById("fromUnit");
  const toUnitSelect = document.getElementById("toUnit");
  const showAllEquivalentsCheckbox = document.getElementById("showAllEquivalents");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(torqueValueInput);

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
  const unitMeta = {
    nm: { label: "N·m", name: "newton-metre" },
    lbft: { label: "lb-ft", name: "pound-foot" },
    lbin: { label: "lb-in", name: "pound-inch" },
    kgfm: { label: "kgf·m", name: "kilogram-force metre" },
    kgfcm: { label: "kgf·cm", name: "kilogram-force centimetre" }
  };

  // Conversion factors to N·m (base unit)
  const toNm = {
    nm: 1,
    lbft: 1.3558179483314004,
    lbin: 0.1129848290276167,
    kgfm: 9.80665,
    kgfcm: 0.0980665
  };

  function formatAmount(value) {
    // Use canonical helper (2 decimals) for consistent display across the site
    return formatNumberTwoDecimals(value);
  }

  function buildEquivalentsHtml(nmValue) {
    const nm = nmValue;
    const lbft = nm / toNm.lbft;
    const lbin = nm / toNm.lbin;
    const kgfm = nm / toNm.kgfm;
    const kgfcm = nm / toNm.kgfcm;

    return `
      <p><strong>Quick equivalents:</strong></p>
      <ul>
        <li>${formatAmount(nm)} N·m</li>
        <li>${formatAmount(lbft)} lb-ft</li>
        <li>${formatAmount(lbin)} lb-in</li>
        <li>${formatAmount(kgfm)} kgf·m</li>
        <li>${formatAmount(kgfcm)} kgf·cm</li>
      </ul>
    `;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!torqueValueInput || !fromUnitSelect || !toUnitSelect) return;

      const torqueValue = toNumber(torqueValueInput.value);
      const fromUnit = fromUnitSelect.value;
      const toUnitCode = toUnitSelect.value;
      const showAll = showAllEquivalentsCheckbox ? showAllEquivalentsCheckbox.checked : false;

      if (!Number.isFinite(torqueValue)) {
        setResultError("Enter a valid torque value.");
        return;
      }
      if (!validateNonNegative(torqueValue, "torque value")) return;

      if (!toNm[fromUnit] || !toNm[toUnitCode]) {
        setResultError("Select valid units to convert between.");
        return;
      }

      const nmValue = torqueValue * toNm[fromUnit];
      const converted = nmValue / toNm[toUnitCode];

      const fromLabel = unitMeta[fromUnit] ? unitMeta[fromUnit].label : fromUnit;
      const toLabel = unitMeta[toUnitCode] ? unitMeta[toUnitCode].label : toUnitCode;

      let resultHtml = `
        <p><strong>Converted torque:</strong> ${formatAmount(converted)} ${toLabel}</p>
        <p><strong>From:</strong> ${formatAmount(torqueValue)} ${fromLabel}</p>
      `;

      // Secondary insight: always show three common equivalents for quick sanity-checking
      const commonNm = formatAmount(nmValue);
      const commonLbft = formatAmount(nmValue / toNm.lbft);
      const commonLbin = formatAmount(nmValue / toNm.lbin);

      resultHtml += `
        <p><strong>Sanity check:</strong></p>
        <ul>
          <li>${commonNm} N·m</li>
          <li>${commonLbft} lb-ft</li>
          <li>${commonLbin} lb-in</li>
        </ul>
      `;

      if (showAll) {
        resultHtml += buildEquivalentsHtml(nmValue);
      } else {
        resultHtml += `<p>Tip: tick “Show equivalents in all units” if you want every unit at once.</p>`;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Torque Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
