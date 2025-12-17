document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  // Decode elements
  const bandCount = document.getElementById("bandCount");
  const band1 = document.getElementById("band1");
  const band2 = document.getElementById("band2");
  const band3 = document.getElementById("band3");
  const multiplierBand = document.getElementById("multiplierBand");
  const toleranceBand = document.getElementById("toleranceBand");
  const tempcoBand = document.getElementById("tempcoBand");
  const band3Group = document.getElementById("band3Group");
  const tempcoGroup = document.getElementById("tempcoGroup");

  // Encode elements
  const encodeBandCount = document.getElementById("encodeBandCount");
  const targetResistance = document.getElementById("targetResistance");
  const targetUnit = document.getElementById("targetUnit");
  const encodeTolerance = document.getElementById("encodeTolerance");

  const modeBlockDecode = document.getElementById("modeBlockDecode");
  const modeBlockEncode = document.getElementById("modeBlockEncode");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(targetResistance);

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
    if (modeBlockDecode) modeBlockDecode.classList.add("hidden");
    if (modeBlockEncode) modeBlockEncode.classList.add("hidden");

    if (mode === "encode") {
      if (modeBlockEncode) modeBlockEncode.classList.remove("hidden");
    } else {
      if (modeBlockDecode) modeBlockDecode.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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
  // Data tables
  // ------------------------------------------------------------
  const digitColors = [
    { key: "black", label: "Black (0)", digit: 0 },
    { key: "brown", label: "Brown (1)", digit: 1 },
    { key: "red", label: "Red (2)", digit: 2 },
    { key: "orange", label: "Orange (3)", digit: 3 },
    { key: "yellow", label: "Yellow (4)", digit: 4 },
    { key: "green", label: "Green (5)", digit: 5 },
    { key: "blue", label: "Blue (6)", digit: 6 },
    { key: "violet", label: "Violet (7)", digit: 7 },
    { key: "gray", label: "Gray (8)", digit: 8 },
    { key: "white", label: "White (9)", digit: 9 }
  ];

  const multiplierColors = [
    { key: "silver", label: "Silver (×0.01)", factor: 0.01 },
    { key: "gold", label: "Gold (×0.1)", factor: 0.1 },
    { key: "black", label: "Black (×1)", factor: 1 },
    { key: "brown", label: "Brown (×10)", factor: 10 },
    { key: "red", label: "Red (×100)", factor: 100 },
    { key: "orange", label: "Orange (×1k)", factor: 1000 },
    { key: "yellow", label: "Yellow (×10k)", factor: 10000 },
    { key: "green", label: "Green (×100k)", factor: 100000 },
    { key: "blue", label: "Blue (×1M)", factor: 1000000 },
    { key: "violet", label: "Violet (×10M)", factor: 10000000 },
    { key: "gray", label: "Gray (×100M)", factor: 100000000 },
    { key: "white", label: "White (×1G)", factor: 1000000000 }
  ];

  const toleranceColors = [
    { key: "brown", label: "Brown (±1%)", percent: 1 },
    { key: "red", label: "Red (±2%)", percent: 2 },
    { key: "green", label: "Green (±0.5%)", percent: 0.5 },
    { key: "blue", label: "Blue (±0.25%)", percent: 0.25 },
    { key: "violet", label: "Violet (±0.1%)", percent: 0.1 },
    { key: "gray", label: "Gray (±0.05%)", percent: 0.05 },
    { key: "gold", label: "Gold (±5%)", percent: 5 },
    { key: "silver", label: "Silver (±10%)", percent: 10 }
  ];

  const tempcoColors = [
    { key: "brown", label: "Brown (100 ppm/°C)", ppm: 100 },
    { key: "red", label: "Red (50 ppm/°C)", ppm: 50 },
    { key: "orange", label: "Orange (15 ppm/°C)", ppm: 15 },
    { key: "yellow", label: "Yellow (25 ppm/°C)", ppm: 25 },
    { key: "blue", label: "Blue (10 ppm/°C)", ppm: 10 },
    { key: "violet", label: "Violet (5 ppm/°C)", ppm: 5 }
  ];

  function fillSelect(selectEl, items, valueKey, labelKey, defaultKey) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    items.forEach(function (item) {
      const opt = document.createElement("option");
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      if (defaultKey && item[valueKey] === defaultKey) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function findByKey(items, key, field) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].key === key) return items[i][field];
    }
    return null;
  }

  function findByValue(items, value, field, valueField) {
    for (let i = 0; i < items.length; i++) {
      if (items[i][valueField] === value) return items[i][field];
    }
    return null;
  }

  function ohmsToReadable(ohms) {
    const abs = Math.abs(ohms);
    if (!Number.isFinite(abs)) return "";
    if (abs >= 1000000000) return (ohms / 1000000000).toFixed(3).replace(/\.?0+$/, "") + " GΩ";
    if (abs >= 1000000) return (ohms / 1000000).toFixed(3).replace(/\.?0+$/, "") + " MΩ";
    if (abs >= 1000) return (ohms / 1000).toFixed(3).replace(/\.?0+$/, "") + " kΩ";
    return (ohms).toFixed(3).replace(/\.?0+$/, "") + " Ω";
  }

  function clampInt(n, min, max) {
    const x = Math.round(n);
    if (x < min) return min;
    if (x > max) return max;
    return x;
  }

  function updateDecodeVisibility() {
    const n = bandCount ? parseInt(bandCount.value, 10) : 4;
    if (band3Group) band3Group.classList.toggle("hidden", n === 4);
    if (tempcoGroup) tempcoGroup.classList.toggle("hidden", n !== 6);
    clearResult();
  }

  if (bandCount) {
    bandCount.addEventListener("change", updateDecodeVisibility);
  }

  // Populate dropdowns
  fillSelect(band1, digitColors.filter(c => c.key !== "black"), "key", "label", "brown");
  fillSelect(band2, digitColors, "key", "label", "black");
  fillSelect(band3, digitColors, "key", "label", "black");
  fillSelect(multiplierBand, multiplierColors, "key", "label", "red");
  fillSelect(toleranceBand, toleranceColors, "key", "label", "gold");
  fillSelect(tempcoBand, tempcoColors, "key", "label", "brown");
  fillSelect(encodeTolerance, toleranceColors, "key", "label", "gold");

  updateDecodeVisibility();

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "decode";

      if (mode === "encode") {
        const raw = targetResistance ? targetResistance.value : "";
        const base = toNumber(raw);
        if (!validatePositive(base, "target resistance")) return;

        const unit = targetUnit ? targetUnit.value : "ohm";
        let ohms = base;
        if (unit === "kohm") ohms = base * 1000;
        if (unit === "mohm") ohms = base * 1000000;

        if (!Number.isFinite(ohms) || ohms <= 0) {
          setResultError("Enter a valid target resistance.");
          return;
        }

        // Guard against absurd values for common resistor coding
        if (ohms < 0.01 || ohms > 1000000000) {
          setResultError("Enter a target resistance between 0.01 Ω and 1 GΩ for typical resistor color coding.");
          return;
        }

        const tolKey = encodeTolerance ? encodeTolerance.value : "gold";
        const tolPct = findByKey(toleranceColors, tolKey, "percent");
        const nBands = encodeBandCount ? parseInt(encodeBandCount.value, 10) : 4;

        const sigDigits = nBands === 5 ? 3 : 2;

        // Find closest representable value using available multipliers
        let best = null;

        for (let i = 0; i < multiplierColors.length; i++) {
          const mult = multiplierColors[i].factor;
          const scaled = ohms / mult;
          const minScaled = sigDigits === 2 ? 10 : 100;
          const maxScaled = sigDigits === 2 ? 99 : 999;

          if (scaled < minScaled || scaled > maxScaled) continue;

          const rounded = clampInt(scaled, minScaled, maxScaled);
          const represented = rounded * mult;
          const err = Math.abs(represented - ohms);

          if (!best || err < best.err) {
            best = { rounded, multKey: multiplierColors[i].key, multFactor: mult, represented, err };
          }
        }

        // Fallback: if nothing fit, try forcing multiplier extremes
        if (!best) {
          // Prefer a multiplier that brings it into range
          for (let i = 0; i < multiplierColors.length; i++) {
            const mult = multiplierColors[i].factor;
            let scaled = ohms / mult;

            const minScaled = sigDigits === 2 ? 10 : 100;
            const maxScaled = sigDigits === 2 ? 99 : 999;

            if (scaled < minScaled) scaled = minScaled;
            if (scaled > maxScaled) scaled = maxScaled;

            const rounded = clampInt(scaled, minScaled, maxScaled);
            const represented = rounded * mult;
            const err = Math.abs(represented - ohms);

            if (!best || err < best.err) {
              best = { rounded, multKey: multiplierColors[i].key, multFactor: mult, represented, err };
            }
          }
        }

        const roundedStr = String(best.rounded);
        const digits = roundedStr.split("").map(d => parseInt(d, 10));

        const d1 = digits[0];
        const d2 = digits[1];
        const d3 = sigDigits === 3 ? digits[2] : null;

        const color1 = findByValue(digitColors, d1, "key", "digit");
        const color2 = findByValue(digitColors, d2, "key", "digit");
        const color3 = sigDigits === 3 ? findByValue(digitColors, d3, "key", "digit") : null;

        const tolLabel = findByKey(toleranceColors, tolKey, "label");
        const multLabel = findByKey(multiplierColors, best.multKey, "label");

        const represented = best.represented;
        const minVal = represented * (1 - tolPct / 100);
        const maxVal = represented * (1 + tolPct / 100);

        const delta = Math.abs(represented - ohms);
        const deltaPct = ohms > 0 ? (delta / ohms) * 100 : 0;

        const bandText = sigDigits === 3
          ? `${color1}, ${color2}, ${color3}, ${best.multKey}, ${tolKey}`
          : `${color1}, ${color2}, ${best.multKey}, ${tolKey}`;

        const resultHtml =
          `<div class="result-grid">
            <div class="result-row"><strong>Suggested bands:</strong><span>${bandText}</span></div>
            <div class="result-row"><strong>Represents:</strong><span>${ohmsToReadable(represented)}</span></div>
            <div class="result-row"><strong>Tolerance:</strong><span>±${tolPct}% (${tolLabel})</span></div>
            <div class="result-row"><strong>Range:</strong><span>${ohmsToReadable(minVal)} to ${ohmsToReadable(maxVal)}</span></div>
            <div class="result-row"><strong>Difference vs target:</strong><span>${ohmsToReadable(delta)} (${deltaPct.toFixed(2)}%)</span></div>
          </div>`;

        setResultSuccess(resultHtml);
        return;
      }

      // Decode mode
      const n = bandCount ? parseInt(bandCount.value, 10) : 4;

      if (!band1 || !band2 || !multiplierBand || !toleranceBand) {
        setResultError("Calculator inputs are missing on this page.");
        return;
      }

      const b1Key = band1.value;
      const b2Key = band2.value;
      const b3Key = band3 ? band3.value : "black";
      const multKey = multiplierBand.value;
      const tolKey = toleranceBand.value;
      const tempKey = tempcoBand ? tempcoBand.value : "brown";

      const d1 = findByKey(digitColors, b1Key, "digit");
      const d2 = findByKey(digitColors, b2Key, "digit");
      const d3 = findByKey(digitColors, b3Key, "digit");
      const mult = findByKey(multiplierColors, multKey, "factor");
      const tolPct = findByKey(toleranceColors, tolKey, "percent");

      if (!Number.isFinite(d1) || !Number.isFinite(d2) || !Number.isFinite(mult) || !Number.isFinite(tolPct)) {
        setResultError("Select valid colors for all required bands.");
        return;
      }

      let sig = d1 * 10 + d2;
      if (n === 5 || n === 6) {
        if (!Number.isFinite(d3)) {
          setResultError("Select a valid third digit color for 5-band or 6-band resistors.");
          return;
        }
        sig = d1 * 100 + d2 * 10 + d3;
      }

      const ohms = sig * mult;

      if (!Number.isFinite(ohms) || ohms <= 0) {
        setResultError("The selected band combination does not produce a valid resistance.");
        return;
      }

      const minVal = ohms * (1 - tolPct / 100);
      const maxVal = ohms * (1 + tolPct / 100);

      let tempcoLine = "";
      if (n === 6) {
        const ppm = findByKey(tempcoColors, tempKey, "ppm");
        if (Number.isFinite(ppm)) {
          // drift per 10°C: ppm/°C * 10°C => ppm per 10°C => convert to percent
          const driftPctPer10C = (ppm * 10) / 10000; // ppm to percent: 1% = 10,000 ppm
          const driftOhmsPer10C = ohms * (driftPctPer10C / 100);
          tempcoLine = `<div class="result-row"><strong>Tempco:</strong><span>${ppm} ppm/°C (≈ ${driftPctPer10C.toFixed(3)}% per 10°C, ≈ ${ohmsToReadable(driftOhmsPer10C)} per 10°C)</span></div>`;
        }
      }

      const digitsText = n === 4
        ? `${d1}${d2}`
        : `${d1}${d2}${d3}`;

      const resultHtml =
        `<div class="result-grid">
          <div class="result-row"><strong>Nominal resistance:</strong><span>${ohmsToReadable(ohms)}</span></div>
          <div class="result-row"><strong>Digits:</strong><span>${digitsText} × ${findByKey(multiplierColors, multKey, "label")}</span></div>
          <div class="result-row"><strong>Tolerance:</strong><span>±${tolPct}%</span></div>
          <div class="result-row"><strong>Expected range:</strong><span>${ohmsToReadable(minVal)} to ${ohmsToReadable(maxVal)}</span></div>
          ${tempcoLine}
        </div>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Resistor Color Code Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
