document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const partAInput = document.getElementById("partA");
  const partBInput = document.getElementById("partB");

  const modeSelect = document.getElementById("modeSelect");

  const knownAInput = document.getElementById("knownA");
  const knownBInput = document.getElementById("knownB");
  const knownTotalInput = document.getElementById("knownTotal");

  const modeBlockKnownA = document.getElementById("modeBlockKnownA");
  const modeBlockKnownB = document.getElementById("modeBlockKnownB");
  const modeBlockKnownTotal = document.getElementById("modeBlockKnownTotal");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Apply comma formatting to real-world value inputs (not the ratio parts)
  attachLiveFormatting(knownAInput);
  attachLiveFormatting(knownBInput);
  attachLiveFormatting(knownTotalInput);

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
    if (modeBlockKnownA) modeBlockKnownA.classList.add("hidden");
    if (modeBlockKnownB) modeBlockKnownB.classList.add("hidden");
    if (modeBlockKnownTotal) modeBlockKnownTotal.classList.add("hidden");

    if (mode === "knownA" && modeBlockKnownA) modeBlockKnownA.classList.remove("hidden");
    if (mode === "knownB" && modeBlockKnownB) modeBlockKnownB.classList.remove("hidden");
    if (mode === "knownTotal" && modeBlockKnownTotal) modeBlockKnownTotal.classList.remove("hidden");

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  // GCD for integer simplification
  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  function isSafeIntegerLike(n) {
    return Number.isFinite(n) && Number.isInteger(n) && Math.abs(n) <= 9007199254740991;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "simplify";

      if (!partAInput || !partBInput) return;

      const a = toNumber(partAInput.value);
      const b = toNumber(partBInput.value);

      if (!validatePositive(a, "ratio part A")) return;
      if (!validatePositive(b, "ratio part B")) return;

      const sum = a + b;
      if (!validatePositive(sum, "ratio total")) return;

      // Core insights
      const pctA = (a / sum) * 100;
      const pctB = (b / sum) * 100;

      const minPart = Math.min(a, b);
      const normA = a / minPart;
      const normB = b / minPart;

      // Integer simplification if possible
      let simplifiedText = null;
      if (isSafeIntegerLike(a) && isSafeIntegerLike(b)) {
        const g = gcd(a, b);
        const sa = a / g;
        const sb = b / g;
        simplifiedText = sa + ":" + sb;
      }

      // Scaling outputs (optional)
      let scaledSectionHtml = "";
      if (mode === "knownA") {
        const knownA = toNumber(knownAInput ? knownAInput.value : "");
        if (!validatePositive(knownA, "known value for A")) return;

        const scale = knownA / a;
        const outB = b * scale;

        scaledSectionHtml = `
          <p><strong>Scaled values (based on A):</strong></p>
          <ul>
            <li>A = ${formatNumberTwoDecimals(knownA)}</li>
            <li>B = ${formatNumberTwoDecimals(outB)}</li>
            <li>Scale factor = ${formatNumberTwoDecimals(scale)}</li>
          </ul>
        `;
      } else if (mode === "knownB") {
        const knownB = toNumber(knownBInput ? knownBInput.value : "");
        if (!validatePositive(knownB, "known value for B")) return;

        const scale = knownB / b;
        const outA = a * scale;

        scaledSectionHtml = `
          <p><strong>Scaled values (based on B):</strong></p>
          <ul>
            <li>A = ${formatNumberTwoDecimals(outA)}</li>
            <li>B = ${formatNumberTwoDecimals(knownB)}</li>
            <li>Scale factor = ${formatNumberTwoDecimals(scale)}</li>
          </ul>
        `;
      } else if (mode === "knownTotal") {
        const knownTotal = toNumber(knownTotalInput ? knownTotalInput.value : "");
        if (!validatePositive(knownTotal, "known total")) return;

        const outA = knownTotal * (a / sum);
        const outB = knownTotal * (b / sum);

        scaledSectionHtml = `
          <p><strong>Split of total:</strong></p>
          <ul>
            <li>Total = ${formatNumberTwoDecimals(knownTotal)}</li>
            <li>A = ${formatNumberTwoDecimals(outA)}</li>
            <li>B = ${formatNumberTwoDecimals(outB)}</li>
          </ul>
        `;
      }

      const ratioLine = simplifiedText
        ? `<p><strong>Simplified ratio:</strong> ${simplifiedText}</p>`
        : `<p><strong>Normalized ratio:</strong> ${formatNumberTwoDecimals(normA)}:${formatNumberTwoDecimals(normB)} (smallest side = 1)</p>`;

      const resultHtml = `
        ${ratioLine}
        <p><strong>Percentage split:</strong></p>
        <ul>
          <li>A = ${formatNumberTwoDecimals(pctA)}%</li>
          <li>B = ${formatNumberTwoDecimals(pctB)}%</li>
        </ul>
        ${scaledSectionHtml}
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
      const message = "Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
