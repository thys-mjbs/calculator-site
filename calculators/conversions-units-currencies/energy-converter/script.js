document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const energyValue = document.getElementById("energyValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

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
  attachLiveFormatting(energyValue);

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
  function getUnitMeta(unitCode) {
    const map = {
      J: { label: "Joule (J)" },
      kJ: { label: "Kilojoule (kJ)" },
      MJ: { label: "Megajoule (MJ)" },
      GJ: { label: "Gigajoule (GJ)" },
      Wh: { label: "Watt-hour (Wh)" },
      kWh: { label: "Kilowatt-hour (kWh)" },
      MWh: { label: "Megawatt-hour (MWh)" },
      cal: { label: "Calorie (cal)" },
      kcal: { label: "Kilocalorie (kcal)" },
      BTU_IT: { label: "BTU (IT)" },
      therm: { label: "Therm (US)" },
      eV: { label: "Electronvolt (eV)" }
    };
    return map[unitCode] || { label: unitCode };
  }

  // Convert to Joules (base) and from Joules using fixed factors
  // Factors are expressed as: 1 unit = factor Joules
  function unitToJoulesFactor(unitCode) {
    switch (unitCode) {
      case "J": return 1;
      case "kJ": return 1e3;
      case "MJ": return 1e6;
      case "GJ": return 1e9;
      case "Wh": return 3600; // 1 Wh = 3600 J
      case "kWh": return 3.6e6; // 1 kWh = 3,600,000 J
      case "MWh": return 3.6e9; // 1 MWh = 3,600,000,000 J
      case "cal": return 4.184; // thermochemical calorie
      case "kcal": return 4184; // 1 kcal = 4184 J
      case "BTU_IT": return 1055.05585262; // BTU (IT)
      case "therm": return 1.05505585262e8; // 1 therm (US) = 100,000 BTU (IT)
      case "eV": return 1.602176634e-19; // exact
      default: return NaN;
    }
  }

  function convertEnergy(value, fromCode, toCode) {
    const fromF = unitToJoulesFactor(fromCode);
    const toF = unitToJoulesFactor(toCode);
    if (!Number.isFinite(fromF) || !Number.isFinite(toF) || fromF <= 0 || toF <= 0) return NaN;

    const joules = value * fromF;
    return joules / toF;
  }

  function formatSmart(value) {
    if (!Number.isFinite(value)) return "—";

    const abs = Math.abs(value);

    // Use plain formatting for common ranges; scientific for extremes
    if (abs === 0) return "0";
    if (abs >= 0.001 && abs < 1e9) {
      // Use 2 decimals for scannability, but avoid trailing .00 on huge integers
      const fixed = formatNumberTwoDecimals(value);
      // If it's basically an integer, keep it clean
      const asNum = Number(fixed.replace(/,/g, ""));
      if (Number.isFinite(asNum) && Math.abs(asNum - Math.round(asNum)) < 1e-9) {
        return formatInputWithCommas(String(Math.round(asNum)));
      }
      return fixed;
    }

    // Scientific notation for very small or very large numbers
    return value.toExponential(6);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const val = toNumber(energyValue ? energyValue.value : "");

      // Basic existence guard
      if (!energyValue || !fromUnit || !toUnit) return;

      // Validation
      if (!validateNonNegative(val, "energy value")) return;

      const fromCode = fromUnit.value;
      const toCode = toUnit.value;

      const converted = convertEnergy(val, fromCode, toCode);
      if (!Number.isFinite(converted)) {
        setResultError("Enter valid units and a valid energy value.");
        return;
      }

      const fromMeta = getUnitMeta(fromCode);
      const toMeta = getUnitMeta(toCode);

      // Secondary insight: show a quick multi-unit breakdown for sanity checks
      const breakdownUnits = ["J", "kJ", "MJ", "kWh", "kcal", "BTU_IT"];
      const breakdownRows = breakdownUnits
        .filter((u) => u !== toCode)
        .map((u) => {
          const v = convertEnergy(val, fromCode, u);
          const meta = getUnitMeta(u);
          return `<li><strong>${meta.label}:</strong> ${formatSmart(v)}</li>`;
        })
        .join("");

      const resultHtml =
        `<p><strong>${formatSmart(val)} ${fromMeta.label}</strong> equals:</p>` +
        `<p style="margin-top:6px;"><strong>${toMeta.label}:</strong> ${formatSmart(converted)}</p>` +
        `<p style="margin-top:10px; margin-bottom:6px;"><strong>Quick breakdown (common units)</strong></p>` +
        `<ul style="margin-top:0; padding-left:18px;">${breakdownRows}</ul>` +
        `<p style="margin-top:10px; margin-bottom:0;"><em>Tip:</em> If the result looks off by 1,000x, double-check whether you meant J vs kJ, or cal vs kcal.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Energy Converter - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
