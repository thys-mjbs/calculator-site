document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startValueInput = document.getElementById("startValue");
  const stepValueInput = document.getElementById("stepValue");
  const countValueInput = document.getElementById("countValue");
  const endValueInput = document.getElementById("endValue");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(startValueInput);
  attachLiveFormatting(stepValueInput);
  attachLiveFormatting(countValueInput);
  attachLiveFormatting(endValueInput);

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

  function validateNonZero(value, fieldLabel) {
    if (!Number.isFinite(value) || value === 0) {
      setResultError("Enter a valid " + fieldLabel + " that is not 0.");
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
  // 5) FORMATTER FOR DISPLAY TERMS (LOCAL)
  // ------------------------------------------------------------
  function formatTerm(n) {
    if (!Number.isFinite(n)) return "";
    const abs = Math.abs(n);
    const fractionDigits = abs !== 0 && abs < 1 ? 10 : 6;
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: fractionDigits
    }).format(n);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!startValueInput || !stepValueInput || !countValueInput || !endValueInput) return;

      const start = toNumber(startValueInput.value);
      const step = toNumber(stepValueInput.value);

      const rawCount = toNumber(countValueInput.value);
      const rawEnd = toNumber(endValueInput.value);

      const hasCount = Number.isFinite(rawCount) && String(countValueInput.value || "").trim() !== "";
      const hasEnd = Number.isFinite(rawEnd) && String(endValueInput.value || "").trim() !== "";

      if (!validateFinite(start, "start value")) return;
      if (!validateNonZero(step, "step size")) return;

      if (!hasCount && !hasEnd) {
        setResultError("Enter either an end value or how many numbers to generate.");
        return;
      }

      let count = null;
      if (hasCount) {
        count = Math.round(rawCount);
        if (!validatePositiveInteger(count, "how many numbers")) return;
      }

      const MAX_TERMS = 5000;
      const terms = [];
      let current = start;

      // If end is provided, use it as the stopping rule.
      // Count becomes a safety cap if also provided.
      if (hasEnd) {
        const end = rawEnd;
        if (!validateFinite(end, "end value")) return;

        // Direction sanity check: prevent impossible progress
        if (step > 0 && end < start) {
          setResultError("With a positive step, the end value should be greater than or equal to the start value.");
          return;
        }
        if (step < 0 && end > start) {
          setResultError("With a negative step, the end value should be less than or equal to the start value.");
          return;
        }

        let safety = 0;
        while (true) {
          // Include current if it is within bounds (inclusive)
          if (step > 0) {
            if (current > end) break;
          } else {
            if (current < end) break;
          }

          terms.push(current);
          safety += 1;

          if (safety >= MAX_TERMS) break;
          if (count !== null && safety >= count) break;

          current = current + step;
        }
      } else {
        // No end value, generate by count
        if (count === null) {
          setResultError("Enter how many numbers to generate.");
          return;
        }
        if (count > MAX_TERMS) {
          setResultError("That is too many numbers to generate at once. Use a smaller count (max " + MAX_TERMS + ").");
          return;
        }

        for (let i = 0; i < count; i++) {
          terms.push(current);
          current = current + step;
        }
      }

      if (terms.length === 0) {
        setResultError("No numbers were generated. Check your start, step, and end settings.");
        return;
      }

      if (terms.length >= MAX_TERMS) {
        // Not an error, but warn via content
      }

      const first = terms[0];
      const last = terms[terms.length - 1];
      const total = terms.length;

      let sum = 0;
      for (let i = 0; i < terms.length; i++) sum += terms[i];

      const avg = sum / total;

      const commaList = terms.map(formatTerm).join(", ");
      const lineList = terms.map(formatTerm).join("\n");

      const resultHtml = `
        <p><strong>Sequence generated:</strong> ${total} number${total === 1 ? "" : "s"}</p>

        <div class="sequence-output">
          <p><strong>Comma-separated (row paste):</strong></p>
          <textarea readonly aria-label="Comma-separated number sequence">${commaList}</textarea>

          <p style="margin-top:10px;"><strong>Line-separated (column paste):</strong></p>
          <textarea readonly aria-label="Line-separated number sequence">${lineList}</textarea>
        </div>

        <div class="sequence-meta">
          <p><strong>First:</strong> ${formatTerm(first)}</p>
          <p><strong>Last:</strong> ${formatTerm(last)}</p>
          <p><strong>Step:</strong> ${formatTerm(step)}</p>
          <p><strong>Sum:</strong> ${formatNumberTwoDecimals(sum)}</p>
          <p><strong>Average:</strong> ${formatNumberTwoDecimals(avg)}</p>
          ${total >= 5000 ? `<p><strong>Note:</strong> Output capped at ${MAX_TERMS} terms for performance.</p>` : ""}
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
      const message = "Number Sequence Generator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
