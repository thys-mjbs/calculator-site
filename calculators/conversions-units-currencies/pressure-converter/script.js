document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const pressureValue = document.getElementById("pressureValue");
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

  // Add every input that should live-format with commas
  attachLiveFormatting(pressureValue);

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
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function formatPressureNumber(n) {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);

    let maxFrac = 2;
    if (abs !== 0 && abs < 1) maxFrac = 6;
    if (abs >= 1000000) maxFrac = 2;

    return n.toLocaleString(undefined, {
      maximumFractionDigits: maxFrac
    });
  }

  function unitLabel(key) {
    const map = {
      pa: "Pa",
      kpa: "kPa",
      mpa: "MPa",
      bar: "bar",
      mbar: "mbar",
      psi: "psi",
      atm: "atm",
      torr: "torr (mmHg)",
      inhg: "inHg",
      kgfcm2: "kgf/cm²"
    };
    return map[key] || key;
  }

  const toPaFactor = {
    pa: 1,
    kpa: 1000,
    mpa: 1000000,
    bar: 100000,
    mbar: 100,
    psi: 6894.757293168,
    atm: 101325,
    torr: 133.32236842105263,
    inhg: 3386.388666666667,
    kgfcm2: 98066.5
  };

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const v = toNumber(pressureValue ? pressureValue.value : "");
      const from = fromUnit ? fromUnit.value : "pa";
      const to = toUnit ? toUnit.value : "all";

      if (!pressureValue || !fromUnit || !toUnit) return;

      if (!validateFinite(v, "pressure value")) return;

      const factorFrom = toPaFactor[from];
      if (!Number.isFinite(factorFrom) || factorFrom === 0) {
        setResultError("Choose a valid 'From unit'.");
        return;
      }

      const pa = v * factorFrom;

      const orderedUnits = ["pa", "kpa", "mpa", "bar", "mbar", "psi", "atm", "torr", "inhg", "kgfcm2"];

      let primaryHtml = "";
      if (to !== "all") {
        const factorTo = toPaFactor[to];
        if (!Number.isFinite(factorTo) || factorTo === 0) {
          setResultError("Choose a valid 'To unit'.");
          return;
        }
        const converted = pa / factorTo;

        primaryHtml = `
          <p><strong>Converted:</strong> ${formatPressureNumber(converted)} ${unitLabel(to)}</p>
        `;
      }

      const rows = orderedUnits
        .map(function (u) {
          const val = pa / toPaFactor[u];
          return `<li><strong>${unitLabel(u)}:</strong> ${formatPressureNumber(val)}</li>`;
        })
        .join("");

      const atmRatio = pa / 101325;
      const barVal = pa / 100000;
      const psiVal = pa / 6894.757293168;

      let noteHtml = "";
      if (v < 0) {
        noteHtml = `<p><strong>Note:</strong> Negative pressure values are often used for vacuum or gauge readings. Make sure you know whether your source is gauge or absolute pressure.</p>`;
      }

      const resultHtml = `
        <p><strong>Input:</strong> ${formatPressureNumber(v)} ${unitLabel(from)}</p>
        ${primaryHtml}
        <p><strong>Quick context:</strong> ${formatPressureNumber(atmRatio)} atm, ${formatPressureNumber(barVal)} bar, ${formatPressureNumber(psiVal)} psi</p>
        ${noteHtml}
        <p><strong>All common equivalents:</strong></p>
        <ul>${rows}</ul>
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
      const message = "Pressure Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
