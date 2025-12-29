document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const numberInput = document.getElementById("numberInput");
  const decimalsInput = document.getElementById("decimalsInput");
  const simplifyRadical = document.getElementById("simplifyRadical");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(numberInput);

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
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function toIntegerOrNaN(value) {
    if (!Number.isFinite(value)) return NaN;
    const n = Math.trunc(value);
    return n;
  }

  function clampDecimals(n) {
    if (!Number.isFinite(n)) return 6;
    const rounded = Math.round(n);
    if (rounded < 0) return 0;
    if (rounded > 12) return 12;
    return rounded;
  }

  function formatWithDecimals(value, decimals) {
    if (!Number.isFinite(value)) return "";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function isSafeWholeNumber(n) {
    return Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER;
  }

  function simplifyRadicalForInteger(N) {
    // Returns an object: { ok, text, note }
    if (!Number.isInteger(N) || N < 0) {
      return { ok: false, text: "", note: "" };
    }
    if (N === 0) return { ok: true, text: "0", note: "" };
    if (N === 1) return { ok: true, text: "1", note: "" };

    // Practical limit to keep UI responsive
    const LIMIT = 1000000000; // 1e9
    if (N > LIMIT) {
      return {
        ok: false,
        text: "",
        note: "Simplified radical form skipped for large whole numbers to keep the page fast."
      };
    }

    let n = N;
    let outside = 1;
    let i = 2;

    while (i * i <= n) {
      let count = 0;
      while (n % i === 0) {
        n = Math.floor(n / i);
        count += 1;
      }
      if (count > 0) {
        const pairs = Math.floor(count / 2);
        if (pairs > 0) {
          outside *= Math.pow(i, pairs);
        }
      }
      i += (i === 2 ? 1 : 2); // 2,3,5,7...
    }

    // Recompute inside based on outside factor:
    // inside = N / (outside^2)
    const inside = Math.floor(N / (outside * outside));

    if (inside === 1) {
      return { ok: true, text: String(outside), note: "" };
    }
    if (outside === 1) {
      return { ok: true, text: "√" + inside, note: "" };
    }
    return { ok: true, text: outside + "√" + inside, note: "" };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const x = toNumber(numberInput ? numberInput.value : "");

      const decimalsRaw = decimalsInput ? toNumber(decimalsInput.value) : NaN;
      const decimals = clampDecimals(decimalsRaw);

      const wantSimplify = simplifyRadical ? !!simplifyRadical.checked : false;

      // Basic existence guard
      if (!numberInput) return;

      // Validation
      if (!validateNonNegative(x, "number")) return;

      // Calculation
      const root = Math.sqrt(x);
      const rootRoundedText = formatWithDecimals(root, decimals);

      const floorRoot = Math.floor(root);
      const lowerSquare = floorRoot * floorRoot;
      const upperSquare = (floorRoot + 1) * (floorRoot + 1);

      const isWholeInput = isSafeWholeNumber(x);
      let perfectSquareText = "Not applicable (decimal input)";
      let exactRootText = "";
      let radicalLine = "";
      let simplifyNote = "";

      if (isWholeInput) {
        const nearestRoot = Math.round(root);
        const isPerfectSquare = (nearestRoot * nearestRoot === x);

        perfectSquareText = isPerfectSquare ? "Yes" : "No";
        if (isPerfectSquare) {
          exactRootText = String(nearestRoot);
        }

        if (wantSimplify) {
          const simp = simplifyRadicalForInteger(x);
          if (simp.ok) {
            radicalLine = simp.text;
          } else if (simp.note) {
            simplifyNote = simp.note;
          }
        }
      }

      const lowerDist = Math.abs(x - lowerSquare);
      const upperDist = Math.abs(upperSquare - x);

      const lowerSquareText = lowerSquare.toLocaleString();
      const upperSquareText = upperSquare.toLocaleString();

      const rootCheck = root * root;
      const rootCheckText = formatWithDecimals(rootCheck, decimals);

      // Build output HTML
      let extraPerfect = "";
      if (isWholeInput && exactRootText) {
        extraPerfect = `<p><strong>Exact result (perfect square):</strong> ${exactRootText}</p>`;
      }

      let radicalBlock = "";
      if (isWholeInput && wantSimplify) {
        if (radicalLine) {
          radicalBlock = `<p><strong>Simplified radical form:</strong> ${radicalLine}</p>`;
        } else if (simplifyNote) {
          radicalBlock = `<p><strong>Simplified radical form:</strong> ${simplifyNote}</p>`;
        }
      }

      const resultHtml = `
        <p><strong>√${formatWithDecimals(x, 0)} (square root):</strong> ${rootRoundedText}</p>
        ${extraPerfect}
        <p><strong>Perfect square (whole numbers only):</strong> ${perfectSquareText}</p>
        <p><strong>Nearest perfect squares:</strong> ${lowerSquareText} (distance ${formatWithDecimals(lowerDist, 0)}) and ${upperSquareText} (distance ${formatWithDecimals(upperDist, 0)})</p>
        ${radicalBlock}
        <p><strong>Quick check:</strong> (${rootRoundedText})² ≈ ${rootCheckText}</p>
        <p><em>Tip:</em> If your number sits between two perfect squares, the square root must sit between their square roots.</p>
      `;

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
      const message = "Square Root Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
