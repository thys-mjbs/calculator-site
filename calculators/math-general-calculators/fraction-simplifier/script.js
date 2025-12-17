document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const numeratorInput = document.getElementById("numeratorInput");
  const denominatorInput = document.getElementById("denominatorInput");
  const showMixedInput = document.getElementById("showMixedInput");
  const showDecimalPercentInput = document.getElementById("showDecimalPercentInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Fractions are typically small integers, so commas are not needed.

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
  function validateInteger(value, fieldLabel) {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      setResultError("Enter a valid whole number for " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
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

  function formatSignedFraction(n, d) {
    if (d === 0) return "";
    if (n === 0) return "0/1";
    const sign = n < 0 ? "-" : "";
    return sign + Math.abs(n) + "/" + d;
  }

  function toMixedNumber(n, d) {
    const sign = n < 0 ? -1 : 1;
    const absN = Math.abs(n);

    const whole = Math.floor(absN / d);
    const remainder = absN % d;

    if (remainder === 0) {
      return (sign < 0 ? "-" : "") + String(whole);
    }

    if (whole === 0) {
      return formatSignedFraction(sign * remainder, d);
    }

    const prefix = sign < 0 ? "-" : "";
    return prefix + whole + " " + remainder + "/" + d;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const rawNum = toNumber(numeratorInput ? numeratorInput.value : "");
      const rawDen = toNumber(denominatorInput ? denominatorInput.value : "");

      // Basic existence guard
      if (!numeratorInput || !denominatorInput) return;

      // Validation
      if (!validateInteger(rawNum, "the numerator")) return;
      if (!validateInteger(rawDen, "the denominator")) return;

      const n0 = rawNum;
      const d0 = rawDen;

      if (d0 === 0) {
        setResultError("Denominator cannot be 0. Enter a non-zero denominator.");
        return;
      }

      // Normalize sign so denominator is positive
      let n = n0;
      let d = d0;
      if (d < 0) {
        n = -n;
        d = -d;
      }

      // Reduce
      if (n === 0) {
        const showDecPct = !!(showDecimalPercentInput && showDecimalPercentInput.checked);
        const htmlParts = [];
        htmlParts.push(`<p><strong>Simplified fraction:</strong> 0/1</p>`);
        if (showMixedInput && showMixedInput.checked) {
          htmlParts.push(`<p><strong>Mixed number:</strong> 0</p>`);
        }
        if (showDecPct) {
          htmlParts.push(`<p><strong>Decimal:</strong> 0</p>`);
          htmlParts.push(`<p><strong>Percent:</strong> 0%</p>`);
        }
        setResultSuccess(htmlParts.join(""));
        return;
      }

      const g = gcd(n, d);
      const rn = n / g;
      const rd = d / g;

      const simplified = formatSignedFraction(rn, rd);

      // Secondary insights
      const showMixed = !!(showMixedInput && showMixedInput.checked);
      const showDecPct = !!(showDecimalPercentInput && showDecimalPercentInput.checked);

      const value = rn / rd;
      const decimal6 = Number.isFinite(value) ? value.toFixed(6) : "";
      const percent2 = Number.isFinite(value) ? formatNumberTwoDecimals(value * 100) + "%" : "";

      const mixed = showMixed ? toMixedNumber(rn, rd) : "";

      // Build output HTML
      const resultHtmlParts = [];
      resultHtmlParts.push(`<p><strong>Simplified fraction:</strong> ${simplified}</p>`);
      resultHtmlParts.push(`<p><strong>Common factor removed:</strong> ÷ ${g}</p>`);

      if (showMixed) {
        resultHtmlParts.push(`<p><strong>Mixed number:</strong> ${mixed}</p>`);
      }

      if (showDecPct) {
        resultHtmlParts.push(`<p><strong>Decimal (approx):</strong> ${decimal6}</p>`);
        resultHtmlParts.push(`<p><strong>Percent (approx):</strong> ${percent2}</p>`);
      }

      resultHtmlParts.push(
        `<p><strong>Tip:</strong> Use the simplified fraction as the exact value. Decimals and percents are rounded.</p>`
      );

      setResultSuccess(resultHtmlParts.join(""));
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Fraction Simplifier - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
