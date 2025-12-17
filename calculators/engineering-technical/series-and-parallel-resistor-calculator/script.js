document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const connectionType = document.getElementById("connectionType");
  const unitSelect = document.getElementById("unitSelect");
  const resistorsList = document.getElementById("resistorsList");
  const tolerancePercent = document.getElementById("tolerancePercent");

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
  attachLiveFormatting(tolerancePercent);

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
  // Helpers for this calculator
  // ------------------------------------------------------------
  function unitMultiplier(unit) {
    if (unit === "kohm") return 1000;
    if (unit === "mohm") return 1000000;
    return 1; // ohm
  }

  function formatOhmsSmart(ohms) {
    if (!Number.isFinite(ohms)) return "—";
    const abs = Math.abs(ohms);

    if (abs >= 1000000) {
      const v = ohms / 1000000;
      return `${formatNumberTwoDecimals(v)} MΩ`;
    }
    if (abs >= 1000) {
      const v = ohms / 1000;
      return `${formatNumberTwoDecimals(v)} kΩ`;
    }
    return `${formatNumberTwoDecimals(ohms)} Ω`;
  }

  function normalizeToken(token) {
    return String(token || "").trim();
  }

  function parseResistorTokenToOhms(token, defaultUnit) {
    const t = normalizeToken(token);
    if (!t) return null;

    const lower = t.toLowerCase().replace(/\s+/g, "");

    // Allow symbols and common suffixes:
    // 330, 330r, 330ohm, 330Ω
    // 4.7k, 4k7, 1m, 2.2m
    // 0.47
    // If no suffix, default unit applies.
    const cleaned = lower
      .replace(/ohms?$/g, "")
      .replace(/ohm$/g, "")
      .replace(/Ω$/g, "");

    // Handle 4k7 and 2m2 patterns (European style)
    const kmMatch = cleaned.match(/^(\d+)([km])(\d+)$/i);
    if (kmMatch) {
      const a = kmMatch[1];
      const suffix = kmMatch[2].toLowerCase();
      const b = kmMatch[3];
      const num = Number(`${a}.${b}`);
      if (!Number.isFinite(num)) return null;
      const mult = suffix === "k" ? 1000 : 1000000;
      return num * mult;
    }

    // Handle explicit suffix: k, m, r
    const suffixMatch = cleaned.match(/^([+-]?\d*\.?\d+)([kmr])$/i);
    if (suffixMatch) {
      const num = Number(suffixMatch[1]);
      const suffix = suffixMatch[2].toLowerCase();
      if (!Number.isFinite(num)) return null;
      if (suffix === "r") return num;
      if (suffix === "k") return num * 1000;
      if (suffix === "m") return num * 1000000;
    }

    // Handle explicit omega sign or r inside like 10r0, 2r2
    const rInside = cleaned.match(/^(\d+)r(\d+)$/i);
    if (rInside) {
      const num = Number(`${rInside[1]}.${rInside[2]}`);
      if (!Number.isFinite(num)) return null;
      return num;
    }

    // Fallback numeric only, use default unit multiplier
    const numOnly = Number(cleaned);
    if (!Number.isFinite(numOnly)) return null;

    const mult = unitMultiplier(defaultUnit);
    return numOnly * mult;
  }

  function parseResistorsToOhms(listStr, defaultUnit) {
    const raw = String(listStr || "").trim();
    if (!raw) return [];

    const tokens = raw
      .split(/[\n,;\t ]+/g)
      .map((x) => normalizeToken(x))
      .filter((x) => x.length > 0);

    const values = [];
    for (const tok of tokens) {
      const ohms = parseResistorTokenToOhms(tok, defaultUnit);
      if (ohms === null) continue;
      values.push(ohms);
    }
    return values;
  }

  function computeSeries(valuesOhms) {
    let sum = 0;
    for (const v of valuesOhms) sum += v;
    return sum;
  }

  function computeParallel(valuesOhms) {
    let invSum = 0;
    for (const v of valuesOhms) invSum += 1 / v;
    return 1 / invSum;
  }

  function computeToleranceRange(valuesOhms, mode, tolFraction) {
    // Worst-case stacking using same tolerance for each resistor.
    // Series: min = sum(ri*(1-t)), max = sum(ri*(1+t))
    // Parallel: evaluate by pushing all resistors low or high, which moves total in opposite direction:
    // Smaller resistors -> smaller equivalent, larger resistors -> larger equivalent (for positive resistances)
    const lo = valuesOhms.map((r) => r * (1 - tolFraction));
    const hi = valuesOhms.map((r) => r * (1 + tolFraction));

    if (mode === "series") {
      return { min: computeSeries(lo), max: computeSeries(hi) };
    }
    // parallel
    return { min: computeParallel(lo), max: computeParallel(hi) };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const mode = connectionType ? connectionType.value : "series";
      const defaultUnit = unitSelect ? unitSelect.value : "ohm";

      const tol = toNumber(tolerancePercent ? tolerancePercent.value : "");

      const valuesOhms = parseResistorsToOhms(resistorsList ? resistorsList.value : "", defaultUnit);

      // Basic existence guard
      if (!connectionType || !unitSelect || !resistorsList || !tolerancePercent) return;

      // Validation
      if (!valuesOhms || valuesOhms.length === 0) {
        setResultError("Enter at least one valid resistor value.");
        return;
      }

      if (valuesOhms.length === 1 && mode === "parallel") {
        // Parallel with a single resistor is still valid: total equals that resistor.
        // No error needed.
      }

      for (const r of valuesOhms) {
        if (!Number.isFinite(r) || r <= 0) {
          setResultError("All resistor values must be valid numbers greater than 0.");
          return;
        }
      }

      if (Number.isFinite(tol) && (tol < 0 || tol > 50)) {
        setResultError("Tolerance should be between 0 and 50 percent.");
        return;
      }

      // Calculation logic
      let equivalentOhms = 0;
      if (mode === "series") {
        equivalentOhms = computeSeries(valuesOhms);
      } else {
        if (valuesOhms.some((v) => v === 0)) {
          setResultError("Parallel resistance cannot include a value of 0.");
          return;
        }
        equivalentOhms = computeParallel(valuesOhms);
      }

      if (!Number.isFinite(equivalentOhms) || equivalentOhms <= 0) {
        setResultError("Could not calculate a valid equivalent resistance from the values provided.");
        return;
      }

      // Build output HTML
      const count = valuesOhms.length;

      const partsPreview = valuesOhms
        .slice(0, 8)
        .map((v) => formatOhmsSmart(v))
        .join(", ");
      const truncated = count > 8 ? `, +${count - 8} more` : "";

      let stepsHtml = "";
      if (mode === "series") {
        const sumExpr = valuesOhms
          .slice(0, 6)
          .map((v) => formatNumberTwoDecimals(v))
          .join(" + ");
        const sumMore = count > 6 ? " + …" : "";
        stepsHtml =
          `<div class="result-row"><span><strong>Series method</strong></span><span class="mono">Rtotal = R1 + R2 + …</span></div>` +
          `<div class="result-row"><span>In ohms</span><span class="mono">${sumExpr}${sumMore}</span></div>`;
      } else {
        const invExpr = valuesOhms
          .slice(0, 5)
          .map((v) => `1/${formatNumberTwoDecimals(v)}`)
          .join(" + ");
        const invMore = count > 5 ? " + …" : "";
        stepsHtml =
          `<div class="result-row"><span><strong>Parallel method</strong></span><span class="mono">1/Rtotal = 1/R1 + 1/R2 + …</span></div>` +
          `<div class="result-row"><span>In ohms</span><span class="mono">${invExpr}${invMore}</span></div>`;
      }

      let tolHtml = "";
      if (Number.isFinite(tol) && tol > 0) {
        const frac = tol / 100;
        const range = computeToleranceRange(valuesOhms, mode, frac);
        tolHtml =
          `<div class="result-row"><span><strong>Estimated tolerance range</strong></span><span>${tol}%</span></div>` +
          `<div class="result-row"><span>Minimum</span><span>${formatOhmsSmart(range.min)}</span></div>` +
          `<div class="result-row"><span>Maximum</span><span>${formatOhmsSmart(range.max)}</span></div>`;
      } else {
        tolHtml =
          `<div class="result-row"><span><strong>Tolerance</strong></span><span>Not applied</span></div>`;
      }

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row"><span><strong>Equivalent resistance</strong></span><span>${formatOhmsSmart(equivalentOhms)}</span></div>
          <div class="result-row"><span>Connection</span><span>${mode === "series" ? "Series" : "Parallel"}</span></div>
          <div class="result-row"><span>Resistors counted</span><span>${count}</span></div>
          <div class="result-row"><span>Values used</span><span>${partsPreview}${truncated}</span></div>
          ${tolHtml}
          <div style="height:8px"></div>
          ${stepsHtml}
        </div>
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
      const message = "Series & Parallel Resistor Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
