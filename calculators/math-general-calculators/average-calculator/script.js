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
  const ignoreZeros = document.getElementById("ignoreZeros");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // (Not used for textarea list input)

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
  // Helpers for this calculator
  // ------------------------------------------------------------
  function splitIntoTokens(text) {
    const raw = (text || "").trim();
    if (!raw) return [];
    return raw.split(/[\s,;]+/).map(function (t) {
      return (t || "").trim();
    }).filter(function (t) {
      return t.length > 0;
    });
  }

  function formatIntegerWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!numbersInput) return;

      const tokens = splitIntoTokens(numbersInput.value);
      if (tokens.length === 0) {
        setResultError("Enter at least one number (separate values with commas, spaces, or new lines).");
        return;
      }

      const shouldIgnoreZeros = !!(ignoreZeros && ignoreZeros.checked);

      let numbers = [];
      for (let i = 0; i < tokens.length; i++) {
        const v = toNumber(tokens[i]);
        if (!Number.isFinite(v)) {
          setResultError("One or more entries are not valid numbers. Remove any text and keep only numeric values.");
          return;
        }
        if (shouldIgnoreZeros && v === 0) continue;
        numbers.push(v);
      }

      if (numbers.length === 0) {
        setResultError("After ignoring zeros, there are no numbers left to average. Turn off “Ignore zeros” or add non-zero values.");
        return;
      }

      let sum = 0;
      let min = numbers[0];
      let max = numbers[0];

      for (let j = 0; j < numbers.length; j++) {
        const n = numbers[j];
        sum += n;
        if (n < min) min = n;
        if (n > max) max = n;
      }

      const count = numbers.length;
      const average = sum / count;

      const avgStr = formatNumberTwoDecimals(average);
      const sumStr = formatNumberTwoDecimals(sum);
      const minStr = formatNumberTwoDecimals(min);
      const maxStr = formatNumberTwoDecimals(max);

      const note = shouldIgnoreZeros
        ? `<p><em>Note:</em> Zeros were excluded from the calculation.</p>`
        : "";

      const resultHtml = `
        <p><strong>Average (mean):</strong> ${avgStr}</p>
        <p><strong>Count:</strong> ${formatIntegerWithCommas(count)}</p>
        <p><strong>Sum:</strong> ${sumStr}</p>
        <p><strong>Minimum:</strong> ${minStr}</p>
        <p><strong>Maximum:</strong> ${maxStr}</p>
        ${note}
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
      const message = "Average Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
