document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const decimalInput = document.getElementById("decimalInput");
  const roundDigitsInput = document.getElementById("roundDigits");
  const maxDenominatorInput = document.getElementById("maxDenominator");
  const showMixedCheckbox = document.getElementById("showMixed");
  const showStepsCheckbox = document.getElementById("showSteps");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Decimal input often benefits from grouping commas for large values
  attachLiveFormatting(decimalInput);
  attachLiveFormatting(roundDigitsInput);
  attachLiveFormatting(maxDenominatorInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function validatePositiveInteger(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) FRACTION HELPERS (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  }

  function simplifyFraction(n, d) {
    if (d === 0) return { n: 0, d: 0 };
    const sign = (n < 0) ^ (d < 0) ? -1 : 1;
    let nn = Math.abs(n);
    let dd = Math.abs(d);
    const g = gcd(nn, dd);
    nn = nn / g;
    dd = dd / g;
    return { n: sign * nn, d: dd };
  }

  function toMixedNumber(n, d) {
    const sign = n < 0 ? -1 : 1;
    const nn = Math.abs(n);
    const whole = Math.floor(nn / d);
    const rem = nn % d;
    return { sign, whole, rem, d };
  }

  function parseRawNumberString(raw) {
    // Remove commas and trim
    const cleaned = (raw || "").toString().trim().replace(/,/g, "");
    return cleaned;
  }

  function isLikelyTerminatingDecimalString(s) {
    return s.indexOf("e") === -1 && s.indexOf("E") === -1;
  }

  function exactFractionFromDecimalString(s) {
    // Handles optional sign, integer-only, and terminating decimals
    // Returns { ok, n, d, notes[] }
    const notes = [];
    if (!s) return { ok: false, n: 0, d: 1, notes };

    // Validate characters (allow digits, one dot, leading sign)
    const trimmed = s.trim();
    const valid = /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(trimmed);
    if (!valid) return { ok: false, n: 0, d: 1, notes };

    const sign = trimmed[0] === "-" ? -1 : 1;
    const unsigned = trimmed[0] === "-" || trimmed[0] === "+" ? trimmed.slice(1) : trimmed;

    if (unsigned.indexOf(".") === -1) {
      // Whole number
      const n = sign * parseInt(unsigned, 10);
      notes.push("Interpreted as a whole number.");
      return { ok: true, n: n, d: 1, notes };
    }

    const parts = unsigned.split(".");
    const intPart = parts[0] || "0";
    let fracPart = parts[1] || "";

    // Trim trailing zeros in fractional part for exact representation
    const originalFracLen = fracPart.length;
    fracPart = fracPart.replace(/0+$/, "");

    if (fracPart.length === 0) {
      const n = sign * parseInt(intPart || "0", 10);
      notes.push("Decimal has no fractional part after trimming zeros.");
      return { ok: true, n: n, d: 1, notes };
    }

    const scale = Math.pow(10, fracPart.length);
    const numeratorAbs = parseInt(intPart, 10) * scale + parseInt(fracPart, 10);
    const numerator = sign * numeratorAbs;
    const denominator = scale;

    if (originalFracLen !== fracPart.length) {
      notes.push("Trimmed trailing zeros from the decimal for an exact fraction.");
    } else {
      notes.push("Converted the terminating decimal into an exact fraction by scaling.");
    }

    return { ok: true, n: numerator, d: denominator, notes };
  }

  function bestRationalApproximation(x, maxDen) {
    // Continued fraction approximation
    // Returns { n, d, notes[] }
    const notes = [];
    if (!Number.isFinite(x)) return { n: 0, d: 1, notes };

    const sign = x < 0 ? -1 : 1;
    let value = Math.abs(x);

    // Quick exact integer
    if (Math.abs(value - Math.round(value)) < 1e-15) {
      notes.push("Value is effectively an integer.");
      return { n: sign * Math.round(value), d: 1, notes };
    }

    let h1 = 1, h0 = 0;
    let k1 = 0, k0 = 1;

    let a = Math.floor(value);
    let frac = value;

    let h = a * h1 + h0;
    let k = a * k1 + k0;

    while (k <= maxDen) {
      h0 = h1; h1 = h;
      k0 = k1; k1 = k;

      frac = frac - a;
      if (frac === 0) break;

      frac = 1 / frac;
      a = Math.floor(frac);

      h = a * h1 + h0;
      k = a * k1 + k0;

      if (!Number.isFinite(frac)) break;
    }

    // If last step exceeded maxDen, use previous convergent
    let n = h1;
    let d = k1;

    // Safety fallback
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
      notes.push("Used a safe fallback approximation due to numeric limits.");
      const scaled = Math.round(value * maxDen);
      n = scaled;
      d = maxDen;
    }

    notes.push("Used a closest-fraction approximation with a maximum denominator of " + maxDen + ".");
    return { n: sign * n, d: d, notes };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!decimalInput) return;

      const rawDecimal = parseRawNumberString(decimalInput.value);
      const rawRoundDigits = parseRawNumberString(roundDigitsInput ? roundDigitsInput.value : "");
      const rawMaxDen = parseRawNumberString(maxDenominatorInput ? maxDenominatorInput.value : "");

      const showMixed = !!(showMixedCheckbox && showMixedCheckbox.checked);
      const showSteps = !!(showStepsCheckbox && showStepsCheckbox.checked);

      if (!rawDecimal) {
        setResultError("Enter a decimal value to convert.");
        return;
      }

      // Rounding digits (optional)
      let roundDigits = null;
      if (rawRoundDigits !== "") {
        const rd = toNumber(rawRoundDigits);
        if (!validatePositiveInteger(rd, "rounding digits")) return;
        if (rd > 12) {
          setResultError("Rounding digits above 12 is not recommended. Use 12 or less.");
          return;
        }
        roundDigits = rd;
      }

      // Max denominator (optional)
      let maxDen = 10000;
      if (rawMaxDen !== "") {
        const md = toNumber(rawMaxDen);
        if (!validatePositiveInteger(md, "maximum denominator")) return;
        if (md > 1000000) {
          setResultError("Maximum denominator above 1,000,000 is usually not practical. Use 1,000,000 or less.");
          return;
        }
        maxDen = md;
      }

      const notes = [];
      let numericValue = null;

      // Prefer exact parsing for typical terminating decimal strings
      let fraction = null;
      let usedApprox = false;

      if (isLikelyTerminatingDecimalString(rawDecimal)) {
        // Apply rounding (if any) using numeric value, then possibly convert exactly again
        if (roundDigits !== null) {
          const asNumber = toNumber(rawDecimal);
          if (!validateFinite(asNumber, "decimal value")) return;
          const factor = Math.pow(10, roundDigits);
          numericValue = Math.round(asNumber * factor) / factor;
          notes.push("Rounded input to " + roundDigits + " decimal places before converting.");
          const roundedStr = numericValue.toString();
          const exactRounded = exactFractionFromDecimalString(roundedStr);
          if (exactRounded.ok) {
            fraction = simplifyFraction(exactRounded.n, exactRounded.d);
            notes.push.apply(notes, exactRounded.notes);
          } else {
            usedApprox = true;
            const approx = bestRationalApproximation(numericValue, maxDen);
            fraction = simplifyFraction(approx.n, approx.d);
            notes.push.apply(notes, approx.notes);
          }
        } else {
          const exact = exactFractionFromDecimalString(rawDecimal);
          if (exact.ok) {
            fraction = simplifyFraction(exact.n, exact.d);
            notes.push.apply(notes, exact.notes);
            numericValue = toNumber(rawDecimal);
          } else {
            const asNumber = toNumber(rawDecimal);
            if (!validateFinite(asNumber, "decimal value")) return;
            numericValue = asNumber;
            usedApprox = true;
            const approx = bestRationalApproximation(asNumber, maxDen);
            fraction = simplifyFraction(approx.n, approx.d);
            notes.push.apply(notes, approx.notes);
          }
        }
      } else {
        // Scientific notation or unusual formatting: numeric then approximate (or exact if rounds to integer)
        const asNumber = toNumber(rawDecimal);
        if (!validateFinite(asNumber, "decimal value")) return;

        numericValue = asNumber;

        if (roundDigits !== null) {
          const factor = Math.pow(10, roundDigits);
          numericValue = Math.round(asNumber * factor) / factor;
          notes.push("Rounded input to " + roundDigits + " decimal places before converting.");
        }

        const approx = bestRationalApproximation(numericValue, maxDen);
        usedApprox = true;
        fraction = simplifyFraction(approx.n, approx.d);
        notes.push.apply(notes, approx.notes);
      }

      if (!fraction || fraction.d === 0) {
        setResultError("Could not convert this value. Please check the input format.");
        return;
      }

      const n = fraction.n;
      const d = fraction.d;

      // Build output HTML
      let resultHtml = "";
      resultHtml += `<p><strong>Simplified fraction:</strong> ${n}/${d}</p>`;

      // Decimal check-back (helpful for approximations)
      const checkValue = d !== 0 ? (n / d) : NaN;
      if (Number.isFinite(checkValue)) {
        resultHtml += `<p><strong>Decimal check:</strong> ${formatNumberTwoDecimals(checkValue)}</p>`;
      }

      if (showMixed && Math.abs(n) >= d && d !== 0) {
        const mixed = toMixedNumber(n, d);
        if (mixed.rem === 0) {
          resultHtml += `<p><strong>Mixed number:</strong> ${mixed.sign < 0 ? "-" : ""}${mixed.whole}</p>`;
        } else {
          const signPrefix = mixed.sign < 0 ? "-" : "";
          resultHtml += `<p><strong>Mixed number:</strong> ${signPrefix}${mixed.whole} ${mixed.rem}/${mixed.d}</p>`;
        }
      }

      // Secondary insight: percentage (only if within reasonable bounds)
      if (Number.isFinite(numericValue) && Math.abs(numericValue) <= 1e9) {
        const percent = numericValue * 100;
        resultHtml += `<p><strong>As a percentage:</strong> ${formatNumberTwoDecimals(percent)}%</p>`;
      }

      if (showSteps) {
        const approxNote = usedApprox ? "Yes" : "No";
        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Approximation used:</strong> ${approxNote}</p>`;
        resultHtml += `<p><strong>Maximum denominator:</strong> ${maxDen}</p>`;
        if (roundDigits !== null) {
          resultHtml += `<p><strong>Rounding applied:</strong> ${roundDigits} decimal places</p>`;
        } else {
          resultHtml += `<p><strong>Rounding applied:</strong> None</p>`;
        }

        if (notes.length) {
          resultHtml += `<p><strong>Notes:</strong></p><ul>`;
          for (let i = 0; i < notes.length; i++) {
            resultHtml += `<li>${notes[i]}</li>`;
          }
          resultHtml += `</ul>`;
        }
      }

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
      const message = "Decimal to Fraction Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
