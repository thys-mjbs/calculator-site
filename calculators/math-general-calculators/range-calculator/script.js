document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const numbersInput = document.getElementById("numbersInput");
  const ignoreNonNumeric = document.getElementById("ignoreNonNumeric");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No live-formatting attached for this calculator (freeform list input)

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
  function parseNumbersFromText(raw) {
    const text = (raw || "").trim();
    if (!text) return [];

    // Support:
    // - spaces and newlines as separators
    // - comma as a separator only when used like "1, 2, 3"
    // - keep commas inside numbers (e.g., "1,000") when there is no comma+space delimiter
    let normalized = text.replace(/[\r\n;]+/g, " ");
    if (/,(\s+)/.test(normalized)) {
      normalized = normalized.replace(/,\s+/g, " ");
    }

    const parts = normalized.split(/\s+/).map(function (s) { return s.trim(); }).filter(Boolean);

    const nums = [];
    for (let i = 0; i < parts.length; i++) {
      const n = toNumber(parts[i]);
      nums.push(n);
    }
    return nums;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const rawList = numbersInput ? numbersInput.value : "";
      const mode = ignoreNonNumeric ? ignoreNonNumeric.value : "ignore";

      if (!numbersInput) return;

      const parsed = parseNumbersFromText(rawList);

      // Filter or error on invalid items
      const invalidCount = parsed.filter(function (n) { return !Number.isFinite(n); }).length;
      let values = parsed.filter(function (n) { return Number.isFinite(n); });

      if (mode === "error" && invalidCount > 0) {
        setResultError("Remove invalid entries (non-numeric items) or switch to ignoring them.");
        return;
      }

      if (values.length < 2) {
        setResultError("Enter at least two valid numbers to calculate a range.");
        return;
      }

      // Calculation logic
      let min = values[0];
      let max = values[0];

      for (let i = 1; i < values.length; i++) {
        const v = values[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }

      const range = max - min;
      const midrange = (min + max) / 2;

      // Build output HTML
      const countLabel = values.length === 1 ? "value" : "values";

      let notes = "";
      if (mode === "ignore" && invalidCount > 0) {
        notes = `<p><strong>Note:</strong> Ignored ${invalidCount} invalid item${invalidCount === 1 ? "" : "s"}.</p>`;
      }

      const resultHtml =
        `<p><strong>Range:</strong> ${formatNumberTwoDecimals(range)}</p>` +
        `<p><strong>Minimum:</strong> ${formatNumberTwoDecimals(min)}</p>` +
        `<p><strong>Maximum:</strong> ${formatNumberTwoDecimals(max)}</p>` +
        `<p><strong>Count:</strong> ${values.length} valid ${countLabel}</p>` +
        `<p><strong>Midrange:</strong> ${formatNumberTwoDecimals(midrange)} (the midpoint between min and max)</p>` +
        notes;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Range Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
