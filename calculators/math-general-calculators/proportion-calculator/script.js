document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const inputA = document.getElementById("inputA");
  const inputB = document.getElementById("inputB");
  const inputC = document.getElementById("inputC");
  const inputD = document.getElementById("inputD");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(inputA);
  attachLiveFormatting(inputB);
  attachLiveFormatting(inputC);
  attachLiveFormatting(inputD);

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
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!inputA || !inputB || !inputC || !inputD) return;

      const rawA = (inputA.value || "").trim();
      const rawB = (inputB.value || "").trim();
      const rawC = (inputC.value || "").trim();
      const rawD = (inputD.value || "").trim();

      const isBlankA = rawA === "";
      const isBlankB = rawB === "";
      const isBlankC = rawC === "";
      const isBlankD = rawD === "";

      const blankCount =
        (isBlankA ? 1 : 0) + (isBlankB ? 1 : 0) + (isBlankC ? 1 : 0) + (isBlankD ? 1 : 0);

      if (blankCount > 1) {
        setResultError("Leave exactly one field blank so the calculator can solve the proportion.");
        return;
      }

      const a = toNumber(rawA);
      const b = toNumber(rawB);
      const c = toNumber(rawC);
      const d = toNumber(rawD);

      // If one is blank, validate the other three. If none are blank, validate all four.
      if (blankCount === 1) {
        if (!isBlankA && !validatePositive(a, "A")) return;
        if (!isBlankB && !validatePositive(b, "B")) return;
        if (!isBlankC && !validatePositive(c, "C")) return;
        if (!isBlankD && !validatePositive(d, "D")) return;
      } else {
        if (!validatePositive(a, "A")) return;
        if (!validatePositive(b, "B")) return;
        if (!validatePositive(c, "C")) return;
        if (!validatePositive(d, "D")) return;
      }

      let missingLabel = "";
      let missingValue = null;

      // Solve A/B = C/D using cross multiplication:
      // A*D = B*C
      if (blankCount === 1) {
        if (isBlankA) {
          // A = (B*C)/D
          missingLabel = "A";
          missingValue = (b * c) / d;
        } else if (isBlankB) {
          // B = (A*D)/C
          missingLabel = "B";
          missingValue = (a * d) / c;
        } else if (isBlankC) {
          // C = (A*D)/B
          missingLabel = "C";
          missingValue = (a * d) / b;
        } else if (isBlankD) {
          // D = (B*C)/A
          missingLabel = "D";
          missingValue = (b * c) / a;
        }

        if (!Number.isFinite(missingValue) || missingValue <= 0) {
          setResultError("The missing value could not be calculated from the numbers provided.");
          return;
        }
      }

      // Derive scale factor when possible (right side relative to left side)
      // If A and C are known, factor = C/A. Else if B and D are known, factor = D/B.
      const effectiveA = isBlankA ? missingValue : a;
      const effectiveB = isBlankB ? missingValue : b;
      const effectiveC = isBlankC ? missingValue : c;
      const effectiveD = isBlankD ? missingValue : d;

      let scaleFactor = null;
      if (Number.isFinite(effectiveA) && Number.isFinite(effectiveC) && effectiveA > 0) {
        scaleFactor = effectiveC / effectiveA;
      } else if (Number.isFinite(effectiveB) && Number.isFinite(effectiveD) && effectiveB > 0) {
        scaleFactor = effectiveD / effectiveB;
      }

      const leftCross = effectiveA * effectiveD;
      const rightCross = effectiveB * effectiveC;
      const crossDiff = Math.abs(leftCross - rightCross);

      const formattedA = formatNumberTwoDecimals(effectiveA);
      const formattedB = formatNumberTwoDecimals(effectiveB);
      const formattedC = formatNumberTwoDecimals(effectiveC);
      const formattedD = formatNumberTwoDecimals(effectiveD);

      let resultHtml = "";

      if (blankCount === 1) {
        resultHtml += `<p><strong>Missing value (${missingLabel}):</strong> ${formatNumberTwoDecimals(missingValue)}</p>`;
      } else {
        resultHtml += `<p><strong>No missing value detected.</strong> This is a proportion check using your four inputs.</p>`;
      }

      resultHtml += `<p><strong>Proportion:</strong> ${formattedA} / ${formattedB} = ${formattedC} / ${formattedD}</p>`;

      if (Number.isFinite(scaleFactor)) {
        resultHtml += `<p><strong>Scale factor (left to right):</strong> ${formatNumberTwoDecimals(scaleFactor)}×</p>`;
      }

      resultHtml += `<p><strong>Cross-product check:</strong> A × D = ${formatNumberTwoDecimals(leftCross)}, B × C = ${formatNumberTwoDecimals(rightCross)}</p>`;
      resultHtml += `<p><strong>Difference:</strong> ${formatNumberTwoDecimals(crossDiff)} (smaller is better)</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Proportion Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
