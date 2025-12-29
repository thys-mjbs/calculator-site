document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const radicandInput = document.getElementById("radicandInput");
  const indexInput = document.getElementById("indexInput");
  const decimalsInput = document.getElementById("decimalsInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Radicand can be large; formatting helps readability.
  attachLiveFormatting(radicandInput);
  attachLiveFormatting(indexInput);
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
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!radicandInput || !indexInput || !decimalsInput) return;

      const a = toNumber(radicandInput.value);
      const nRaw = toNumber(indexInput.value);
      const decimalsRaw = toNumber(decimalsInput.value);

      if (!Number.isFinite(a)) {
        setResultError("Enter a valid number to take the root of.");
        return;
      }

      if (!validatePositive(nRaw, "root index (n)")) return;

      const nRounded = Math.round(nRaw);
      if (Math.abs(nRaw - nRounded) > 0) {
        setResultError("Root index (n) must be a whole number (for example 2, 3, 4).");
        return;
      }

      const n = nRounded;

      if (n > 1000) {
        setResultError("Root index (n) is too large for a reliable browser calculation. Try 1000 or less.");
        return;
      }

      let decimals = 6;
      if (Number.isFinite(decimalsRaw) && decimalsInput.value.trim() !== "") {
        const dRounded = Math.round(decimalsRaw);
        if (dRounded < 0 || dRounded > 12) {
          setResultError("Decimal places must be between 0 and 12.");
          return;
        }
        decimals = dRounded;
      }

      // Real-root existence rule for even n
      if (a < 0 && n % 2 === 0) {
        setResultError("No real result: even roots of negative numbers are not real (for example, the square root of -9).");
        return;
      }

      let rootValue;
      if (a < 0) {
        // Odd n: negative real root exists
        rootValue = -Math.pow(Math.abs(a), 1 / n);
      } else {
        rootValue = Math.pow(a, 1 / n);
      }

      if (!Number.isFinite(rootValue)) {
        setResultError("Result could not be computed with a finite value. Check your inputs.");
        return;
      }

      const nfExact = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

      const nfLoose = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: Math.min(12, Math.max(decimals, 6))
      });

      const rootDisplay = nfExact.format(rootValue);

      const backCheck = Math.pow(rootValue, n);
      const diff = backCheck - a;

      const backCheckDisplay = nfLoose.format(backCheck);
      const diffDisplay = nfLoose.format(diff);

      const rootTwoDecimals = formatNumberTwoDecimals(rootValue);
      const aDisplay = nfLoose.format(a);

      const parityText = (n % 2 === 0) ? "even" : "odd";
      const powerForm = `a^(1/n) = ${aDisplay}^(1/${n})`;

      const resultHtml =
        `<p><strong>Real ${n}th root:</strong> ${rootDisplay}</p>
         <p><strong>Rounded to 2 decimals:</strong> ${rootTwoDecimals}</p>
         <p><strong>Power form:</strong> ${powerForm}</p>
         <p><strong>Verification:</strong> (${rootDisplay})^${n} ≈ ${backCheckDisplay}</p>
         <p><strong>Difference from input:</strong> ${diffDisplay}</p>
         <p><strong>Notes:</strong> n is ${parityText}. Small differences are normal due to rounding and floating-point precision.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Nth Root Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
