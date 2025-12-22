document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const valuesInput = document.getElementById("valuesInput");
  const minFrequencyInput = document.getElementById("minFrequencyInput");
  const roundDecimalsInput = document.getElementById("roundDecimalsInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Only attach to numeric single-value fields (NOT the list field)
  attachLiveFormatting(minFrequencyInput);
  attachLiveFormatting(roundDecimalsInput);

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
  function validatePositiveIntegerOrBlank(value, fieldLabel, maxValue) {
    if (value === "" || value === null || value === undefined) return { ok: true, parsed: null };

    const n = toNumber(value);
    if (!Number.isFinite(n) || n <= 0 || Math.floor(n) !== n) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number greater than 0.");
      return { ok: false, parsed: null };
    }

    if (Number.isFinite(maxValue) && n > maxValue) {
      setResultError("Enter a valid " + fieldLabel + " of " + maxValue + " or less.");
      return { ok: false, parsed: null };
    }

    return { ok: true, parsed: n };
  }

  function formatValueForDisplay(value, decimalsOrNull) {
    if (!Number.isFinite(value)) return "";
    if (decimalsOrNull === null) {
      // No rounding: show integers cleanly; otherwise show up to 6 decimals without trailing zeros.
      if (Math.floor(value) === value) return value.toLocaleString();
      const s = value.toFixed(6);
      return Number(s).toLocaleString();
    }
    return value.toFixed(decimalsOrNull);
  }

  function parseValuesList(raw) {
    const tokens = String(raw || "")
      .split(/[\s,]+/g)
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length > 0; });

    const nums = [];
    for (let i = 0; i < tokens.length; i++) {
      const n = toNumber(tokens[i]);
      if (Number.isFinite(n)) nums.push(n);
    }
    return nums;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const rawValues = valuesInput ? valuesInput.value : "";
      const values = parseValuesList(rawValues);

      // Basic existence guard
      if (!valuesInput || !minFrequencyInput || !roundDecimalsInput) return;

      // Validation: need at least 1 valid number
      if (!values || values.length === 0) {
        setResultError("Enter at least one valid number. You can separate values with commas, spaces, or new lines.");
        return;
      }

      // Optional: minimum frequency (default 2)
      let minFreq = 2;
      const minFreqRaw = String(minFrequencyInput.value || "").trim();
      if (minFreqRaw !== "") {
        const minCheck = validatePositiveIntegerOrBlank(minFreqRaw, "minimum frequency", 1000000);
        if (!minCheck.ok) return;
        minFreq = minCheck.parsed;
      }

      // Optional: rounding decimals (blank = none, else 0..10)
      let roundDecimals = null;
      const roundRaw = String(roundDecimalsInput.value || "").trim();
      if (roundRaw !== "") {
        const roundCheck = validatePositiveIntegerOrBlank(roundRaw, "rounding decimals", 10);
        if (!roundCheck.ok) return;
        // validatePositiveIntegerOrBlank enforces >0, but we want allow 0
        const rd = toNumber(roundRaw);
        if (!Number.isFinite(rd) || rd < 0 || rd > 10 || Math.floor(rd) !== rd) {
          setResultError("Enter a valid rounding decimals value from 0 to 10, or leave it blank.");
          return;
        }
        roundDecimals = rd;
      }

      // Apply rounding (if selected) and build frequency map
      const freq = new Map();
      const displayMap = new Map(); // key -> display string
      const roundedValues = [];

      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        let effective = v;

        if (roundDecimals !== null) {
          const factor = Math.pow(10, roundDecimals);
          effective = Math.round(v * factor) / factor;
        }

        // Normalize -0 to 0
        if (Object.is(effective, -0)) effective = 0;

        const key = roundDecimals !== null ? effective.toFixed(roundDecimals) : String(effective);
        const current = freq.get(key) || 0;
        freq.set(key, current + 1);
        roundedValues.push(key);

        if (!displayMap.has(key)) {
          const display = (roundDecimals !== null)
            ? effective.toFixed(roundDecimals)
            : formatValueForDisplay(effective, null);
          displayMap.set(key, display);
        }
      }

      // Find max frequency
      let maxCount = 0;
      freq.forEach(function (count) {
        if (count > maxCount) maxCount = count;
      });

      // Determine modes based on minFreq
      if (maxCount < minFreq) {
        const htmlNoMode = `
          <p><strong>No mode found under your settings.</strong></p>
          <p>Highest frequency in your data: <strong>${maxCount}</strong>. Minimum required: <strong>${minFreq}</strong>.</p>
          <p>Total valid values used: <strong>${values.length.toLocaleString()}</strong>. Unique values: <strong>${freq.size.toLocaleString()}</strong>.</p>
          <p>Tip: lower the minimum frequency to 2 (default), or use rounding if your values are very close but not identical.</p>
        `;
        setResultSuccess(htmlNoMode);
        return;
      }

      const modeKeys = [];
      freq.forEach(function (count, key) {
        if (count === maxCount && count >= minFreq) modeKeys.push(key);
      });

      modeKeys.sort(function (a, b) {
        const na = toNumber(a);
        const nb = toNumber(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return String(a).localeCompare(String(b));
      });

      // Build top frequency rows (up to 5)
      const entries = [];
      freq.forEach(function (count, key) {
        entries.push({ key: key, count: count });
      });

      entries.sort(function (x, y) {
        if (y.count !== x.count) return y.count - x.count;
        const nx = toNumber(x.key);
        const ny = toNumber(y.key);
        if (Number.isFinite(nx) && Number.isFinite(ny)) return nx - ny;
        return String(x.key).localeCompare(String(y.key));
      });

      const top = entries.slice(0, 5);
      const total = values.length;

      let rowsHtml = "";
      for (let i = 0; i < top.length; i++) {
        const d = displayMap.get(top[i].key) || top[i].key;
        const pct = (top[i].count / total) * 100;
        rowsHtml += `<li><strong>${d}</strong>: ${top[i].count.toLocaleString()} (${pct.toFixed(1)}%)</li>`;
      }

      const modesDisplay = modeKeys.map(function (k) {
        return displayMap.get(k) || k;
      });

      const pluralModes = modesDisplay.length > 1;
      const roundingNote = (roundDecimals !== null)
        ? `Values were grouped after rounding to <strong>${roundDecimals}</strong> decimal place${roundDecimals === 1 ? "" : "s"}.`
        : `No rounding was applied; values must match exactly to count as the same number.`;

      const resultHtml = `
        <p><strong>${pluralModes ? "Modes" : "Mode"}:</strong> ${modesDisplay.join(", ")}</p>
        <p><strong>Frequency:</strong> ${maxCount.toLocaleString()} occurrence${maxCount === 1 ? "" : "s"} (${((maxCount / total) * 100).toFixed(1)}% of your list)</p>
        <p>Total valid values used: <strong>${total.toLocaleString()}</strong>. Unique values: <strong>${freq.size.toLocaleString()}</strong>.</p>
        <p>${roundingNote}</p>
        <p><strong>Top frequencies:</strong></p>
        <ul>${rowsHtml}</ul>
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
      const message = "Mode Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
