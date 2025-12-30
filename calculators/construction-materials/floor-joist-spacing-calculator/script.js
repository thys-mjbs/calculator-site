document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const spanValueInput = document.getElementById("spanValue");
  const spanUnitSelect = document.getElementById("spanUnit");
  const joistSizeSelect = document.getElementById("joistSize");
  const woodTypeSelect = document.getElementById("woodType");
  const loadPresetSelect = document.getElementById("loadPreset");
  const customLoadGroup = document.getElementById("customLoadGroup");
  const customTotalLoadInput = document.getElementById("customTotalLoad");

  const advancedToggle = document.getElementById("advancedToggle");
  const advancedSection = document.getElementById("advancedSection");
  const deflectionRatioInput = document.getElementById("deflectionRatio");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(spanValueInput);
  attachLiveFormatting(customTotalLoadInput);
  attachLiveFormatting(deflectionRatioInput);

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
  function showMode() {
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
  // UI TOGGLES
  // ------------------------------------------------------------
  function syncCustomLoadVisibility() {
    if (!loadPresetSelect || !customLoadGroup) return;
    const isCustom = loadPresetSelect.value === "custom";
    customLoadGroup.style.display = isCustom ? "flex" : "none";
    if (!isCustom && customTotalLoadInput) customTotalLoadInput.value = "";
  }

  if (loadPresetSelect) {
    syncCustomLoadVisibility();
    loadPresetSelect.addEventListener("change", function () {
      syncCustomLoadVisibility();
      clearResult();
    });
  }

  if (advancedToggle && advancedSection) {
    advancedToggle.addEventListener("click", function () {
      const isHidden = advancedSection.classList.contains("hidden");
      if (isHidden) {
        advancedSection.classList.remove("hidden");
        advancedToggle.setAttribute("aria-expanded", "true");
      } else {
        advancedSection.classList.add("hidden");
        advancedToggle.setAttribute("aria-expanded", "false");
      }
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // CALC DATA
  // ------------------------------------------------------------
  function getJoistDims(joistSize) {
    // Typical actual sizes (inches) for 2x lumber
    const b = 1.5;
    const map = {
      "2x6": { b: b, h: 5.5 },
      "2x8": { b: b, h: 7.25 },
      "2x10": { b: b, h: 9.25 },
      "2x12": { b: b, h: 11.25 }
    };
    return map[joistSize] || map["2x8"];
  }

  function getWoodProps(woodType) {
    // Typical reference values (psi). Screening-level only.
    // E = modulus of elasticity, Fb = allowable bending stress (simplified).
    const map = {
      spf2: { label: "SPF No. 2", E: 1300000, Fb: 875 },
      dfl2: { label: "Douglas Fir-Larch No. 2", E: 1600000, Fb: 900 },
      syp2: { label: "Southern Yellow Pine No. 2", E: 1800000, Fb: 1100 }
    };
    return map[woodType] || map.spf2;
  }

  function getTotalLoadPsf(preset, customTotal) {
    if (preset === "light") return 40; // 30 live + 10 dead
    if (preset === "heavy") return 75; // 60 live + 15 dead
    if (preset === "custom") return customTotal;
    return 50; // residential typical: 40 live + 10 dead
  }

  function roundDownToStandardSpacing(maxSpacingIn) {
    const standards = [24, 19.2, 16, 12];
    for (let i = 0; i < standards.length; i++) {
      if (maxSpacingIn >= standards[i]) return standards[i];
    }
    return null;
  }

  function inchesFromSpan(spanValue, spanUnit) {
    if (spanUnit === "m") {
      // meters to inches
      return spanValue * 39.37007874;
    }
    // feet to inches
    return spanValue * 12;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const spanVal = toNumber(spanValueInput ? spanValueInput.value : "");
      const spanUnit = spanUnitSelect ? spanUnitSelect.value : "ft";
      const joistSize = joistSizeSelect ? joistSizeSelect.value : "2x8";
      const woodType = woodTypeSelect ? woodTypeSelect.value : "spf2";
      const preset = loadPresetSelect ? loadPresetSelect.value : "res";
      const customTotal = toNumber(customTotalLoadInput ? customTotalLoadInput.value : "");
      const defRatioRaw = toNumber(deflectionRatioInput ? deflectionRatioInput.value : "");

      // Existence guard
      if (!spanValueInput || !spanUnitSelect || !joistSizeSelect || !woodTypeSelect || !loadPresetSelect) return;

      // Validation
      if (!validatePositive(spanVal, "span")) return;

      if (preset === "custom") {
        if (!validatePositive(customTotal, "custom total load (psf)")) return;
        if (customTotal < 10 || customTotal > 200) {
          setResultError("Custom total load looks unusual. Enter a value between 10 and 200 psf.");
          return;
        }
      }

      let deflectionRatio = 360;
      if (Number.isFinite(defRatioRaw) && defRatioRaw > 0) deflectionRatio = defRatioRaw;

      if (deflectionRatio < 180 || deflectionRatio > 720) {
        setResultError("Deflection limit looks unusual. Use a value between L/180 and L/720.");
        return;
      }

      const L = inchesFromSpan(spanVal, spanUnit);
      if (!validatePositive(L, "span")) return;

      if (L < 24) {
        setResultError("Span is too small to be realistic. Enter a span of at least 2 feet (or 0.6 m).");
        return;
      }

      if (L > 360) {
        setResultError("Span is very large for typical joists. Consider beams, engineered framing, or an engineered design.");
        return;
      }

      const totalPsf = getTotalLoadPsf(preset, customTotal);
      const dims = getJoistDims(joistSize);
      const wood = getWoodProps(woodType);

      const b = dims.b;
      const h = dims.h;

      const I = (b * Math.pow(h, 3)) / 12; // in^4
      const S = (b * Math.pow(h, 2)) / 6;  // in^3

      const allowableDeflection = L / deflectionRatio;

      const candidateSpacings = [24, 19.2, 16, 12]; // inches on-center
      let best = null;

      for (let i = 0; i < candidateSpacings.length; i++) {
        const s = candidateSpacings[i];

        // Tributary width = spacing (in) converted to feet
        const tribFt = s / 12;

        // Line load on one joist (plf) = psf * tributary width (ft)
        const w_plf = totalPsf * tribFt;

        // Convert to lb/in
        const w = w_plf / 12;

        // Simply supported beam under uniform load
        const Mmax = (w * Math.pow(L, 2)) / 8; // lb-in
        const fb = Mmax / S; // psi

        const delta = (5 * w * Math.pow(L, 4)) / (384 * wood.E * I); // inches

        const bendingOk = fb <= wood.Fb;
        const deflectionOk = delta <= allowableDeflection;

        if (bendingOk && deflectionOk) {
          best = {
            spacing: s,
            w_plf: w_plf,
            moment: Mmax,
            fb: fb,
            delta: delta
          };
          break; // first in list is widest
        }
      }

      if (!best) {
        const html =
          "<p><strong>Result:</strong> None of the standard spacings (24, 19.2, 16, 12 inches on-center) passed with the inputs provided.</p>" +
          "<p><strong>What to do:</strong> Reduce spacing below 12 inches, choose a deeper joist (for example 2×10 or 2×12), reduce the assumed load, or confirm requirements using local code tables or an engineered design.</p>" +
          "<p><strong>Inputs used:</strong> " +
          "Span " + spanVal + " " + (spanUnit === "m" ? "m" : "ft") + ", " +
          "Joist " + joistSize + ", " +
          "Wood " + wood.label + ", " +
          "Total load " + formatNumberTwoDecimals(totalPsf) + " psf, " +
          "Deflection limit L/" + Math.round(deflectionRatio) +
          ".</p>";
        setResultSuccess(html);
        return;
      }

      const maxPassing = best.spacing;
      const standardPick = roundDownToStandardSpacing(maxPassing);

      // Extra insight: show what happens at next wider spacing if it exists (why it fails)
      function getNextWiderSpacing(s) {
        if (s === 12) return 16;
        if (s === 16) return 19.2;
        if (s === 19.2) return 24;
        return null;
      }

      function evaluateAtSpacing(s) {
        const tribFt = s / 12;
        const w_plf = totalPsf * tribFt;
        const w = w_plf / 12;
        const Mmax = (w * Math.pow(L, 2)) / 8;
        const fb = Mmax / S;
        const delta = (5 * w * Math.pow(L, 4)) / (384 * wood.E * I);
        return { spacing: s, fb: fb, delta: delta };
      }

      const nextWider = getNextWiderSpacing(maxPassing);
      let nextNote = "";
      if (nextWider) {
        const check = evaluateAtSpacing(nextWider);
        const bendFail = check.fb > wood.Fb;
        const defFail = check.delta > allowableDeflection;

        let failReason = "";
        if (bendFail && defFail) failReason = "bending and deflection";
        else if (bendFail) failReason = "bending";
        else if (defFail) failReason = "deflection";
        else failReason = "neither check (unexpected)";

        nextNote =
          "<p><strong>Why not " + nextWider + " in?</strong> At " + nextWider + " inches on-center, the limiting issue is " + failReason + ".</p>";
      }

      const html =
        "<p><strong>Recommended spacing:</strong> " + standardPick + " inches on-center</p>" +
        "<p><strong>Checks at " + standardPick + " in:</strong><br>" +
        "Estimated bending stress: " + formatNumberTwoDecimals(best.fb) + " psi (limit " + formatNumberTwoDecimals(wood.Fb) + " psi)<br>" +
        "Estimated mid-span deflection: " + formatNumberTwoDecimals(best.delta) + " in (limit " + formatNumberTwoDecimals(allowableDeflection) + " in, based on L/" + Math.round(deflectionRatio) + ")</p>" +
        "<p><strong>Inputs used:</strong> " +
        "Span " + spanVal + " " + (spanUnit === "m" ? "m" : "ft") + " (" + Math.round(L) + " in), " +
        "Joist " + joistSize + " (actual " + b + "×" + h + " in), " +
        "Wood " + wood.label + ", " +
        "Total load " + formatNumberTwoDecimals(totalPsf) + " psf.</p>" +
        nextNote +
        "<p><strong>Practical note:</strong> This is a screening estimate. If your project is permitted or inspected, confirm against local span tables and code requirements.</p>";

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Floor Joist Spacing Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }

  // Initial UI sync
  syncCustomLoadVisibility();
  showMode();
});
