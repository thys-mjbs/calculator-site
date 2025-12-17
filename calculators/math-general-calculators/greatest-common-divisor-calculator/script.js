document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const numberA = document.getElementById("numberA");
  const numberB = document.getElementById("numberB");
  const extraNumbers = document.getElementById("extraNumbers");
  const showSteps = document.getElementById("showSteps");
  const alsoLcm = document.getElementById("alsoLcm");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(numberA);
  attachLiveFormatting(numberB);

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
  function validateIntegerLike(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    if (!Number.isInteger(value)) {
      setResultError(fieldLabel + " must be a whole number (no decimals).");
      return false;
    }
    return true;
  }

  function parseExtraIntegers(raw) {
    const s = (raw || "").trim();
    if (!s) return [];
    const parts = s.split(/[\s,]+/).filter(Boolean);

    const nums = [];
    for (let i = 0; i < parts.length; i++) {
      const v = toNumber(parts[i]);
      if (!Number.isFinite(v) || !Number.isInteger(v)) return null;
      nums.push(v);
    }
    return nums;
  }

  function gcd2(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  }

  function gcdMany(values) {
    let g = 0;
    for (let i = 0; i < values.length; i++) {
      g = gcd2(g, values[i]);
      if (g === 1) return 1;
    }
    return g;
  }

  function buildEuclidSteps(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);

    const lines = [];
    if (x === 0 && y === 0) return lines;

    while (y !== 0) {
      const q = Math.floor(x / y);
      const r = x % y;
      lines.push(`${x} = ${y} × ${q} + ${r}`);
      x = y;
      y = r;
    }
    lines.push(`GCD = ${x}`);
    return lines;
  }

  function safeAbsProduct(a, b) {
    return Math.abs(a) * Math.abs(b);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!numberA || !numberB) return;

      const a = toNumber(numberA.value);
      const b = toNumber(numberB.value);

      if (!validateIntegerLike(a, "A (first number)")) return;
      if (!validateIntegerLike(b, "B (second number)")) return;

      const extras = parseExtraIntegers(extraNumbers ? extraNumbers.value : "");
      if (extras === null) {
        setResultError("Optional extra numbers must be whole numbers separated by commas or spaces.");
        return;
      }

      const all = [a, b].concat(extras);
      const allNonZero = all.some((v) => v !== 0);
      if (!allNonZero) {
        setResultError("Enter at least one non-zero number. The GCD of all zeros is not meaningful.");
        return;
      }

      const gcdAB = gcd2(a, b);
      const gcdAll = extras.length > 0 ? gcdMany(all) : gcdAB;

      // Simplified ratio for A:B using gcdAB
      let ratioA = 0;
      let ratioB = 0;
      if (gcdAB !== 0) {
        ratioA = a / gcdAB;
        ratioB = b / gcdAB;
      }

      const wantSteps = !!(showSteps && showSteps.checked);
      const wantLcm = !!(alsoLcm && alsoLcm.checked);

      let lcmText = "";
      if (wantLcm) {
        // Common convention: if either is 0, LCM is 0
        let lcm = 0;
        if (a !== 0 && b !== 0) {
          const prod = safeAbsProduct(a, b);
          lcm = prod / gcdAB;
        }
        lcmText = `<p><strong>LCM (A and B):</strong> ${formatInputWithCommas(String(lcm))}</p>`;
      }

      let stepsHtml = "";
      if (wantSteps) {
        const lines = buildEuclidSteps(a, b);
        if (lines.length > 0) {
          const items = lines.map((t) => `<li>${t}</li>`).join("");
          stepsHtml = `
            <div style="margin-top:10px;">
              <p><strong>Euclidean algorithm steps (A and B):</strong></p>
              <ul>${items}</ul>
            </div>
          `;
        }
      }

      const extrasNote =
        extras.length > 0
          ? `<p><strong>GCD (A, B, and extra numbers):</strong> ${formatInputWithCommas(String(gcdAll))}</p>`
          : "";

      const resultHtml = `
        <p><strong>GCD (A and B):</strong> ${formatInputWithCommas(String(gcdAB))}</p>
        ${extrasNote}
        <p><strong>Simplified ratio (A:B):</strong> ${formatInputWithCommas(String(ratioA))} : ${formatInputWithCommas(String(ratioB))}</p>
        ${lcmText}
        <p style="margin-top:10px;">Practical use: divide A and B by the GCD to reduce a fraction, simplify a ratio, or find the largest equal group size that fits both numbers.</p>
        ${stepsHtml}
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
      const message = "Greatest Common Divisor Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
