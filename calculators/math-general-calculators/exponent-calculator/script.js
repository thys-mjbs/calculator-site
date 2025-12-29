document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const baseInput = document.getElementById("baseInput");
  const exponentInput = document.getElementById("exponentInput");
  const decimalsInput = document.getElementById("decimalsInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(baseInput);
  attachLiveFormatting(exponentInput);
  attachLiveFormatting(decimalsInput);

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
  function formatAutoNumber(n) {
    const abs = Math.abs(n);

    if (!Number.isFinite(n)) return String(n);

    // Keep 0 clean
    if (n === 0) return "0";

    // Scientific for very large or very small values
    if (abs >= 1e9 || abs < 1e-6) {
      return n.toExponential(6);
    }

    // Otherwise show up to 10 decimals, trimmed
    const rounded = Number(n.toFixed(10));
    return rounded.toLocaleString(undefined, { maximumFractionDigits: 10 });
  }

  function parseDecimals(raw) {
    if (!raw) return null;
    const d = toNumber(raw);
    if (!Number.isFinite(d)) return null;
    const di = Math.trunc(d);
    if (di < 0 || di > 12) return null;
    return di;
  }

  function formatWithDecimals(n, decimals) {
    if (!Number.isFinite(n)) return String(n);
    const fixed = n.toFixed(decimals);
    const asNum = Number(fixed);
    // Preserve fixed formatting for small decimals like 1.00
    const parts = fixed.split(".");
    const intPart = Number(parts[0]).toLocaleString();
    if (parts.length === 1) return intPart;
    return intPart + "." + parts[1];
  }

  function isIntegerLike(x) {
    if (!Number.isFinite(x)) return false;
    return Math.abs(x - Math.round(x)) < 1e-12;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!baseInput || !exponentInput) return;

      const a = toNumber(baseInput.value);
      const b = toNumber(exponentInput.value);
      const decimals = parseDecimals(decimalsInput ? decimalsInput.value : "");

      if (!validateFinite(a, "base")) return;
      if (!validateFinite(b, "exponent")) return;

      // Undefined cases and real-number constraints
      if (a === 0 && b === 0) {
        setResultError("0 to the power of 0 is undefined for general-purpose use.");
        return;
      }

      if (a === 0 && b < 0) {
        setResultError("0 to a negative exponent is undefined (it would require dividing by zero).");
        return;
      }

      if (a < 0 && !isIntegerLike(b)) {
        setResultError("A negative base with a non-integer exponent usually does not produce a real-number result.");
        return;
      }

      const value = Math.pow(a, b);

      if (!Number.isFinite(value)) {
        setResultError("This input combination results in an undefined or non-finite value.");
        return;
      }

      const displayValue = decimals === null ? formatAutoNumber(value) : formatWithDecimals(value, decimals);

      const baseDisplay = formatAutoNumber(a);
      const exponentDisplay = formatAutoNumber(b);

      let interpretation = "";

      if (isIntegerLike(b) && b > 1) {
        interpretation =
          "This means multiplying the base by itself " +
          Math.round(b) +
          " times.";
      } else if (b === 1) {
        interpretation = "Any number to the power of 1 equals itself.";
      } else if (b === 0 && a !== 0) {
        interpretation = "Any nonzero number to the power of 0 equals 1.";
      } else if (b < 0) {
        const positivePow = Math.pow(a, -b);
        const positiveDisplay = Number.isFinite(positivePow)
          ? (decimals === null ? formatAutoNumber(positivePow) : formatWithDecimals(positivePow, decimals))
          : "";
        interpretation =
          "A negative exponent means a reciprocal: " +
          baseDisplay +
          "^" +
          exponentDisplay +
          " = 1 / (" +
          baseDisplay +
          "^" +
          formatAutoNumber(-b) +
          ")." +
          (positiveDisplay ? " Here, " + baseDisplay + "^" + formatAutoNumber(-b) + " = " + positiveDisplay + "." : "");
      } else if (b === 0.5 && a >= 0) {
        interpretation = "An exponent of 0.5 is the square root of the base.";
      } else if (b === (1 / 3) && a >= 0) {
        interpretation = "An exponent of 1/3 is the cube root of the base.";
      } else {
        interpretation = "This is the standard power calculation a^b.";
      }

      const resultHtml = `
        <p><strong>Result:</strong> (${baseDisplay})<sup>${exponentDisplay}</sup> = <strong>${displayValue}</strong></p>
        <p><strong>What it means:</strong> ${interpretation}</p>
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
      const message = "Exponent Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
