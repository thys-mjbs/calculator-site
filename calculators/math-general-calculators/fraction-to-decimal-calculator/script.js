document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const inputMode = document.getElementById("inputMode");
  const modeTextBlock = document.getElementById("modeTextBlock");
  const modePartsBlock = document.getElementById("modePartsBlock");

  const fractionText = document.getElementById("fractionText");
  const wholePart = document.getElementById("wholePart");
  const numerator = document.getElementById("numerator");
  const denominator = document.getElementById("denominator");

  const decimalPlaces = document.getElementById("decimalPlaces");
  const showSteps = document.getElementById("showSteps");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(wholePart);
  attachLiveFormatting(numerator);
  attachLiveFormatting(denominator);
  attachLiveFormatting(decimalPlaces);

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
    if (modeTextBlock) modeTextBlock.classList.add("hidden");
    if (modePartsBlock) modePartsBlock.classList.add("hidden");

    if (mode === "parts") {
      if (modePartsBlock) modePartsBlock.classList.remove("hidden");
    } else {
      if (modeTextBlock) modeTextBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (inputMode) {
    showMode(inputMode.value);
    inputMode.addEventListener("change", function () {
      showMode(inputMode.value);
    });
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateInteger(value, fieldLabel) {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      setResultError("Enter a valid whole number for " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function normalizeFraction(n, d) {
    if (d === 0) return null;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function parseFractionText(raw) {
    const s = (raw || "").trim();
    if (!s) return null;

    // Support: a/b, w a/b, -w a/b, -a/b
    // Remove commas from numeric pieces to allow "1,000/8"
    const cleaned = s.replace(/,/g, " ").replace(/\s+/g, " ").trim();

    // Try mixed number: [sign]whole [numerator]/[denominator]
    const mixedMatch = cleaned.match(/^([+-]?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/);
    if (mixedMatch) {
      const sign = mixedMatch[1] === "-" ? -1 : 1;
      const w = parseInt(mixedMatch[2], 10);
      const n = parseInt(mixedMatch[3], 10);
      const d = parseInt(mixedMatch[4], 10);
      return { sign, w, n, d };
    }

    // Try simple fraction: [sign]numerator/denominator
    const fracMatch = cleaned.match(/^([+-]?)\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if (fracMatch) {
      const sign = fracMatch[1] === "-" ? -1 : 1;
      const n = parseInt(fracMatch[2], 10);
      const d = parseInt(fracMatch[3], 10);
      return { sign, w: 0, n, d };
    }

    // If user typed a decimal, allow it as a convenience, but label it clearly.
    const maybeDecimal = cleaned.replace(/\s/g, "");
    if (/^[+-]?\d+(\.\d+)?$/.test(maybeDecimal)) {
      const dec = Number(maybeDecimal);
      if (!Number.isFinite(dec)) return null;
      return { decimalOnly: true, value: dec };
    }

    return null;
  }

  function fractionToRepeatingDecimalString(n, d, maxRepeatDigits) {
    // n and d should already be normalized, d > 0
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);

    const intPart = Math.floor(n / d);
    let remainder = n % d;

    if (remainder === 0) {
      return { exactString: sign + String(intPart), terminates: true, repeat: "" };
    }

    const seen = new Map(); // remainder -> index
    let digits = "";
    let idx = 0;
    let repeatStart = -1;

    while (remainder !== 0 && !seen.has(remainder) && digits.length < maxRepeatDigits) {
      seen.set(remainder, idx);
      remainder *= 10;
      const digit = Math.floor(remainder / d);
      digits += String(digit);
      remainder = remainder % d;
      idx += 1;
    }

    if (remainder === 0) {
      return {
        exactString: sign + String(intPart) + "." + digits,
        terminates: true,
        repeat: ""
      };
    }

    if (seen.has(remainder)) {
      repeatStart = seen.get(remainder);
      const nonRepeat = digits.slice(0, repeatStart);
      const repeat = digits.slice(repeatStart);
      const exactString = sign + String(intPart) + "." + nonRepeat + "(" + repeat + ")";
      return { exactString, terminates: false, repeat };
    }

    // If we hit maxRepeatDigits, we cannot safely mark the repeat segment.
    return {
      exactString: sign + String(intPart) + "." + digits + "…",
      terminates: false,
      repeat: ""
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = inputMode ? inputMode.value : "text";

      const placesRaw = decimalPlaces ? decimalPlaces.value : "";
      let places = toNumber(placesRaw);
      if (!Number.isFinite(places) || placesRaw.trim() === "") places = 6;
      places = Math.round(places);

      if (places < 0) {
        setResultError("Decimal places must be 0 or higher.");
        return;
      }
      if (places > 18) {
        setResultError("Decimal places is too high. Use 18 or less.");
        return;
      }

      // Parse inputs into a normalized fraction n/d
      let norm = null;
      let inputSummary = "";
      let decimalOnly = false;
      let decimalOnlyValue = 0;

      if (mode === "parts") {
        const w = toNumber(wholePart ? wholePart.value : "");
        const n = toNumber(numerator ? numerator.value : "");
        const d = toNumber(denominator ? denominator.value : "");

        if (!Number.isFinite(n) || !Number.isFinite(d)) {
          setResultError("Enter a numerator and denominator.");
          return;
        }
        if (!Number.isInteger(n) || !Number.isInteger(d)) {
          setResultError("Numerator and denominator must be whole numbers.");
          return;
        }
        if (d === 0) {
          setResultError("Denominator cannot be 0.");
          return;
        }
        if (n < 0) {
          setResultError("Numerator should be 0 or higher. Use the sign on the whole number if needed.");
          return;
        }

        let whole = 0;
        if (wholePart && wholePart.value.trim() !== "") {
          if (!Number.isFinite(w) || !Number.isInteger(w)) {
            setResultError("Whole number must be a valid whole number if provided.");
            return;
          }
          whole = w;
        }

        const sign = whole < 0 ? -1 : 1;
        const absWhole = Math.abs(whole);
        const top = sign * (absWhole * Math.abs(d) + n);
        const den = Math.abs(d);

        norm = normalizeFraction(top, den);
        if (!norm) {
          setResultError("Enter a valid denominator greater than 0.");
          return;
        }

        inputSummary = (wholePart && wholePart.value.trim() !== "" ? String(whole) + " " : "") + String(n) + "/" + String(d);
      } else {
        const parsed = parseFractionText(fractionText ? fractionText.value : "");
        if (!parsed) {
          setResultError("Enter a fraction like 3/8 or a mixed number like 1 3/4.");
          return;
        }

        if (parsed.decimalOnly) {
          decimalOnly = true;
          decimalOnlyValue = parsed.value;
          inputSummary = String(parsed.value);
        } else {
          if (parsed.d === 0) {
            setResultError("Denominator cannot be 0.");
            return;
          }
          if (parsed.n < 0 || parsed.d < 0) {
            setResultError("Use positive numbers for the fraction part. Use a leading minus sign for negative values.");
            return;
          }

          const top = parsed.sign * (parsed.w * parsed.d + parsed.n);
          const den = parsed.d;

          norm = normalizeFraction(top, den);
          if (!norm) {
            setResultError("Enter a valid fraction.");
            return;
          }

          inputSummary = (parsed.sign < 0 ? "-" : "") + (parsed.w ? String(parsed.w) + " " : "") + String(parsed.n) + "/" + String(parsed.d);
        }
      }

      let value = 0;
      let reducedFractionText = "";
      let repeatingInfo = null;

      if (decimalOnly) {
        value = decimalOnlyValue;
      } else {
        value = norm.n / norm.d;
        reducedFractionText = norm.d === 1 ? String(norm.n) : String(norm.n) + "/" + String(norm.d);
        repeatingInfo = fractionToRepeatingDecimalString(norm.n, norm.d, 400);
      }

      if (!Number.isFinite(value)) {
        setResultError("That input results in an invalid value. Check your fraction.");
        return;
      }

      // Rounded decimal as string
      const rounded = value.toFixed(places);

      // Percent
      const percentValue = value * 100;
      const percentRounded = percentValue.toFixed(Math.min(Math.max(places, 0), 18));

      // Build result HTML
      let repeatLine = "";
      let exactLine = "";
      let typeLine = "";

      if (decimalOnly) {
        typeLine = `<div class="result-row"><div class="result-label">Input detected</div><div class="result-value">You entered a decimal. This tool is primarily for fractions, but the decimal is shown below for convenience.</div></div>`;
      } else if (repeatingInfo) {
        if (repeatingInfo.terminates) {
          typeLine = `<div class="result-row"><div class="result-label">Decimal type</div><div class="result-value">Terminating decimal</div></div>`;
          exactLine = `<div class="result-row"><div class="result-label">Exact decimal</div><div class="result-value">${repeatingInfo.exactString}</div></div>`;
        } else {
          typeLine = `<div class="result-row"><div class="result-label">Decimal type</div><div class="result-value">Repeating decimal</div></div>`;
          exactLine = `<div class="result-row"><div class="result-label">Repeating form</div><div class="result-value">${repeatingInfo.exactString}</div></div>`;
          if (!repeatingInfo.repeat) {
            repeatLine = `<div class="result-row"><div class="result-label">Note</div><div class="result-value muted">The repeating pattern is long, so only a shortened decimal preview is shown.</div></div>`;
          }
        }
      }

      const stepsEnabled = !!(showSteps && showSteps.checked);

      let stepsHtml = "";
      if (stepsEnabled) {
        if (decimalOnly) {
          stepsHtml = `<div class="result-row"><div class="result-label">How it works</div><div class="result-value muted">Fractions convert to decimals by division (numerator ÷ denominator). You entered a decimal directly, so no fraction division step was needed.</div></div>`;
        } else {
          const absN = Math.abs(norm.n);
          const absD = norm.d;
          const intPart = Math.floor(absN / absD);
          const rem = absN % absD;
          stepsHtml = `<div class="result-row"><div class="result-label">How it works</div><div class="result-value muted">Convert by division: ${norm.n}/${norm.d} = ${norm.n} ÷ ${norm.d}. Integer part is ${norm.n < 0 ? "-" : ""}${intPart}, remainder is ${rem}. Remainders that repeat create repeating decimals.</div></div>`;
        }
      }

      const headerLine = `<div class="result-row"><div class="result-label">You entered</div><div class="result-value">${inputSummary}</div></div>`;
      const fractionLine = decimalOnly
        ? ""
        : `<div class="result-row"><div class="result-label">Simplified fraction</div><div class="result-value">${reducedFractionText}</div></div>`;

      const decimalLine = `<div class="result-row"><div class="result-label">Decimal (rounded)</div><div class="result-value">${rounded}</div></div>`;
      const percentLine = `<div class="result-row"><div class="result-label">Percent</div><div class="result-value">${percentRounded}%</div></div>`;

      const resultHtml = `
        <div class="result-grid">
          ${headerLine}
          ${fractionLine}
          ${decimalLine}
          ${percentLine}
          ${typeLine}
          ${exactLine}
          ${repeatLine}
          ${stepsHtml}
        </div>
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
      const message = "Fraction to Decimal Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
