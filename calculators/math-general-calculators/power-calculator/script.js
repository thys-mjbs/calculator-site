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
  const decimalPlacesInput = document.getElementById("decimalPlacesInput");

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
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  function isIntegerLike(value) {
    return Number.isFinite(value) && Math.abs(value - Math.round(value)) < 1e-12;
  }

  function clampInteger(value, min, max) {
    if (!Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    if (rounded < min) return min;
    if (rounded > max) return max;
    return rounded;
  }

  function formatSmartNumber(n, decimals) {
    if (!Number.isFinite(n)) return String(n);

    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e9 || abs < 1e-6)) {
      return n.toExponential(Math.min(12, Math.max(0, decimals)));
    }

    const fixed = n.toFixed(Math.min(12, Math.max(0, decimals)));
    return fixed.replace(/\.?0+$/, "");
  }

  function buildExpandedForm(base, exponent) {
    const e = Math.round(exponent);
    if (e === 0) return "1";
    const count = Math.abs(e);
    const safeCount = Math.min(count, 20);
    const parts = [];
    for (let i = 0; i < safeCount; i++) parts.push(String(base));
    const core = parts.join(" × ");
    if (count > 20) {
      return core + " × … (total " + count + " factors)";
    }
    if (e < 0) {
      return "1 / (" + core + ")";
    }
    return core;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!baseInput || !exponentInput) return;

      const base = toNumber(baseInput.value);
      const exponent = toNumber(exponentInput.value);

      if (!validateFinite(base, "base (x)")) return;
      if (!validateFinite(exponent, "exponent (y)")) return;

      // Advanced: decimal places (optional)
      const dpRaw = decimalPlacesInput ? toNumber(decimalPlacesInput.value) : NaN;
      let decimals = clampInteger(dpRaw, 0, 12);
      if (decimals === null) decimals = 6;

      // Edge cases and real-number constraints
      if (base === 0 && exponent === 0) {
        setResultError("0^0 is undefined. Use a non-zero base or a non-zero exponent.");
        return;
      }

      if (base === 0 && exponent < 0) {
        setResultError("0 raised to a negative exponent would require dividing by zero. Use a base other than 0.");
        return;
      }

      if (base < 0 && !isIntegerLike(exponent)) {
        setResultError("A negative base with a non-integer exponent does not produce a real-number result. Use a whole-number exponent or a non-negative base.");
        return;
      }

      const result = Math.pow(base, exponent);

      // Magnitude guidance for overflow/underflow
      let magnitudeHtml = "";
      if (!Number.isFinite(result)) {
        const absBase = Math.abs(base);
        if (absBase === 0 || absBase === 1) {
          magnitudeHtml = "";
        } else {
          const log10Abs = exponent * (Math.log(absBase) / Math.LN10);
          const approxDigits = Math.floor(Math.abs(log10Abs)) + 1;
          const signNote =
            base < 0 && isIntegerLike(exponent) && (Math.round(exponent) % 2 !== 0)
              ? "The true value would be negative (odd exponent)."
              : "The true value would be positive.";
          magnitudeHtml =
            "<li><strong>Magnitude hint:</strong> |x^y| is about 10^" +
            formatSmartNumber(log10Abs, 2) +
            " (roughly " +
            approxDigits +
            " digits). " +
            signNote +
            "</li>";
        }
      }

      const primary =
        Number.isFinite(result)
          ? formatSmartNumber(result, decimals)
          : "Result is too large to display exactly (overflow).";

      const sci =
        Number.isFinite(result) && result !== 0
          ? result.toExponential(Math.min(12, Math.max(0, decimals)))
          : "";

      const integerExponent = isIntegerLike(exponent);
      const expanded =
        integerExponent && Math.abs(Math.round(exponent)) <= 20
          ? buildExpandedForm(base, exponent)
          : "";

      const reciprocal =
        exponent < 0 && Number.isFinite(result)
          ? formatSmartNumber(1 / Math.pow(base, Math.abs(exponent)), decimals)
          : "";

      const resultHtmlParts = [];
      resultHtmlParts.push("<p><strong>Result:</strong> " + primary + "</p>");
      resultHtmlParts.push("<ul>");

      if (Number.isFinite(result) && sci) {
        resultHtmlParts.push("<li><strong>Scientific notation:</strong> " + sci + "</li>");
      }

      if (integerExponent && expanded) {
        resultHtmlParts.push("<li><strong>Expanded form:</strong> " + expanded + "</li>");
      }

      if (exponent < 0 && Number.isFinite(result)) {
        resultHtmlParts.push("<li><strong>Reciprocal check:</strong> 1 / (x^|y|) = " + reciprocal + "</li>");
      }

      if (magnitudeHtml) {
        resultHtmlParts.push(magnitudeHtml);
      }

      resultHtmlParts.push("</ul>");

      const resultHtml = resultHtmlParts.join("");
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Power Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
