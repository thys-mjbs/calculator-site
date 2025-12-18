document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const curveType = document.getElementById("curveType");
  const rawScore = document.getElementById("rawScore");
  const maxScore = document.getElementById("maxScore");

  const modeAddPoints = document.getElementById("modeAddPoints");
  const pointsToAdd = document.getElementById("pointsToAdd");
  const capAtMaxAdd = document.getElementById("capAtMaxAdd");

  const modeMultiply = document.getElementById("modeMultiply");
  const multiplier = document.getElementById("multiplier");
  const capAtMaxMultiply = document.getElementById("capAtMaxMultiply");

  const modeNewMax = document.getElementById("modeNewMax");
  const newMaximum = document.getElementById("newMaximum");
  const roundPoints = document.getElementById("roundPoints");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(rawScore);
  attachLiveFormatting(maxScore);
  attachLiveFormatting(pointsToAdd);
  attachLiveFormatting(newMaximum);

  // (Do not comma-format multiplier)
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
    if (modeAddPoints) modeAddPoints.classList.add("hidden");
    if (modeMultiply) modeMultiply.classList.add("hidden");
    if (modeNewMax) modeNewMax.classList.add("hidden");

    if (mode === "addPoints" && modeAddPoints) modeAddPoints.classList.remove("hidden");
    if (mode === "multiply" && modeMultiply) modeMultiply.classList.remove("hidden");
    if (mode === "newMax" && modeNewMax) modeNewMax.classList.remove("hidden");

    clearResult();
  }

  if (curveType) {
    showMode(curveType.value);
    curveType.addEventListener("change", function () {
      showMode(curveType.value);
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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function roundToStep(value, step) {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return value;
    return Math.round(value / step) * step;
  }

  function fmt2(n) {
    return formatNumberTwoDecimals(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = curveType ? curveType.value : "addPoints";

      const raw = toNumber(rawScore ? rawScore.value : "");
      const max = toNumber(maxScore ? maxScore.value : "");

      if (!validateNonNegative(raw, "raw score")) return;
      if (!validatePositive(max, "maximum possible")) return;

      if (raw > max) {
        setResultError("Raw score cannot be greater than the maximum possible. If your score includes extra credit, increase the maximum or adjust the score.");
        return;
      }

      const rawPct = (raw / max) * 100;

      let curvedPoints = raw;
      let curvedMax = max;
      let noteParts = [];
      let capped = false;

      if (mode === "addPoints") {
        const add = toNumber(pointsToAdd ? pointsToAdd.value : "");
        if (!validateNonNegative(add, "points to add")) return;

        const capYes = capAtMaxAdd ? capAtMaxAdd.value === "yes" : true;
        curvedPoints = raw + add;
        curvedMax = max;

        if (capYes) {
          const before = curvedPoints;
          curvedPoints = clamp(curvedPoints, 0, max);
          capped = before !== curvedPoints;
          if (capped) noteParts.push("Capped at the original maximum.");
        } else {
          if (curvedPoints > max) noteParts.push("Not capped, so the curved score can exceed the original maximum.");
        }
      }

      if (mode === "multiply") {
        const mult = toNumber(multiplier ? multiplier.value : "");
        if (!Number.isFinite(mult) || mult <= 0) {
          setResultError("Enter a valid multiplier greater than 0 (for example, 1.05).");
          return;
        }

        const capYes = capAtMaxMultiply ? capAtMaxMultiply.value === "yes" : true;
        curvedPoints = raw * mult;
        curvedMax = max;

        if (capYes) {
          const before = curvedPoints;
          curvedPoints = clamp(curvedPoints, 0, max);
          capped = before !== curvedPoints;
          if (capped) noteParts.push("Capped at the original maximum.");
        } else {
          if (curvedPoints > max) noteParts.push("Not capped, so the curved score can exceed the original maximum.");
        }
      }

      if (mode === "newMax") {
        const newMaxVal = toNumber(newMaximum ? newMaximum.value : "");
        if (!validatePositive(newMaxVal, "new maximum")) return;

        curvedMax = newMaxVal;
        curvedPoints = (raw / max) * newMaxVal;

        const roundingMode = roundPoints ? roundPoints.value : "none";
        if (roundingMode === "nearest1") curvedPoints = roundToStep(curvedPoints, 1);
        if (roundingMode === "nearest0_5") curvedPoints = roundToStep(curvedPoints, 0.5);

        noteParts.push("This is a conversion to a new maximum. Your percentage stays the same, but the point total changes.");
      }

      const curvedPct = (curvedPoints / curvedMax) * 100;

      const deltaPoints = curvedPoints - raw;
      const deltaPct = curvedPct - rawPct;

      // Secondary insight: what raw score would be needed to hit common thresholds after the curve
      function requiredRawForTargetPct(targetPct) {
        const targetRawPct = targetPct;

        if (mode === "newMax") {
          // Conversion does not change percent. Required raw is just the same percent on the original max.
          return (targetRawPct / 100) * max;
        }

        if (mode === "addPoints") {
          const add = toNumber(pointsToAdd ? pointsToAdd.value : "");
          const capYes = capAtMaxAdd ? capAtMaxAdd.value === "yes" : true;

          // Need raw + add >= targetPct% of max
          let targetPoints = (targetRawPct / 100) * max;
          let reqRaw = targetPoints - add;

          // If capped and target is at/above 100%, reqRaw is max - add, but still capped at max
          if (capYes && targetPoints > max) targetPoints = max;

          return clamp(reqRaw, 0, max);
        }

        if (mode === "multiply") {
          const mult = toNumber(multiplier ? multiplier.value : "");
          if (!Number.isFinite(mult) || mult <= 0) return NaN;

          const capYes = capAtMaxMultiply ? capAtMaxMultiply.value === "yes" : true;
          let targetPoints = (targetRawPct / 100) * max;

          if (capYes && targetPoints > max) targetPoints = max;

          const reqRaw = targetPoints / mult;
          return clamp(reqRaw, 0, max);
        }

        return NaN;
      }

      const targets = [50, 60, 70];
      const reqRows = targets.map(function (t) {
        const req = requiredRawForTargetPct(t);
        if (!Number.isFinite(req)) return null;
        return { target: t, required: req, requiredPct: (req / max) * 100 };
      }).filter(Boolean);

      const modeLabel =
        mode === "addPoints" ? "Add points" :
        mode === "multiply" ? "Multiply score" :
        "Convert to a new maximum";

      const noteHtml = noteParts.length
        ? `<div class="result-note"><strong>Notes:</strong> ${noteParts.join(" ")}</div>`
        : "";

      const reqHtml = reqRows.length
        ? `<div class="small-table">
            <div><strong>Quick thresholds (raw score needed)</strong></div>
            ${reqRows.map(function (r) {
              return `<div class="result-row">
                        <span>${r.target}% target</span>
                        <span><strong>${fmt2(r.required)}</strong> / ${fmt2(max)} (${fmt2(r.requiredPct)}%)</span>
                      </div>`;
            }).join("")}
          </div>`
        : "";

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row"><span><strong>Method</strong></span><span>${modeLabel}</span></div>

          <div class="result-row"><span><strong>Raw score</strong></span><span>${fmt2(raw)} / ${fmt2(max)} (${fmt2(rawPct)}%)</span></div>
          <div class="result-row"><span><strong>Curved score</strong></span><span>${fmt2(curvedPoints)} / ${fmt2(curvedMax)} (${fmt2(curvedPct)}%)</span></div>

          <div class="result-row"><span><strong>Change</strong></span><span>${fmt2(deltaPoints)} points, ${fmt2(deltaPct)}%</span></div>
        </div>
        ${noteHtml}
        ${reqHtml}
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
      const message = "Grade Curve Adjuster (Simple) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
