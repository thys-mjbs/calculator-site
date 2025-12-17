document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const totalLength = document.getElementById("totalLength");
  const lengthUnit = document.getElementById("lengthUnit");
  const coverMm = document.getElementById("coverMm");
  const targetSpacingMm = document.getElementById("targetSpacingMm");
  const barCount = document.getElementById("barCount");

  const modeBlockFromSpacing = document.getElementById("modeBlockFromSpacing");
  const modeBlockFromBars = document.getElementById("modeBlockFromBars");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(totalLength);
  attachLiveFormatting(coverMm);
  attachLiveFormatting(targetSpacingMm);
  attachLiveFormatting(barCount);

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
    if (modeBlockFromSpacing) modeBlockFromSpacing.classList.add("hidden");
    if (modeBlockFromBars) modeBlockFromBars.classList.add("hidden");

    if (mode === "fromBars") {
      if (modeBlockFromBars) modeBlockFromBars.classList.remove("hidden");
    } else {
      if (modeBlockFromSpacing) modeBlockFromSpacing.classList.remove("hidden");
    }

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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "fromSpacing";

      if (!totalLength || !lengthUnit || !coverMm) return;

      const totalLenRaw = toNumber(totalLength.value);
      const coverRaw = toNumber(coverMm.value);

      const unit = (lengthUnit && lengthUnit.value) ? String(lengthUnit.value) : "m";

      let totalLenMm = totalLenRaw;
      if (unit === "m") totalLenMm = totalLenRaw * 1000;

      const coverUsedMm = Number.isFinite(coverRaw) && coverRaw > 0 ? coverRaw : 40;

      if (!validatePositive(totalLenMm, "total length")) return;
      if (!validateNonNegative(coverUsedMm, "cover")) return;

      const effectiveLenMm = totalLenMm - 2 * coverUsedMm;
      if (!Number.isFinite(effectiveLenMm) || effectiveLenMm <= 0) {
        setResultError("Cover is too large for the given length. Reduce cover or increase the length.");
        return;
      }

      let computedBars = null;
      let computedSpaces = null;
      let computedSpacingMm = null;
      let notes = [];

      if (mode === "fromBars") {
        if (!barCount) return;

        const barsRaw = toNumber(barCount.value);

        if (!Number.isFinite(barsRaw) || barsRaw < 2) {
          setResultError("Enter a valid number of bars (minimum 2).");
          return;
        }

        computedBars = Math.round(barsRaw);
        if (computedBars < 2) computedBars = 2;

        computedSpaces = computedBars - 1;
        computedSpacingMm = effectiveLenMm / computedSpaces;

        notes.push("Exact spacing is calculated to fit the bars evenly across the effective length.");
      } else {
        if (!targetSpacingMm) return;

        const targetRaw = toNumber(targetSpacingMm.value);

        if (!validatePositive(targetRaw, "target spacing")) return;

        // Aim for actual spacing <= target by using ceiling spaces.
        computedSpaces = Math.ceil(effectiveLenMm / targetRaw);
        if (computedSpaces < 1) computedSpaces = 1;

        computedBars = computedSpaces + 1;
        computedSpacingMm = effectiveLenMm / computedSpaces;

        if (computedSpacingMm > targetRaw) {
          notes.push("Actual spacing is slightly above the target due to rounding, but still evenly spaced.");
        } else {
          notes.push("Actual spacing is at or below the target so the layout fits evenly.");
        }
      }

      const totalLenMeters = totalLenMm / 1000;

      const spacingText = formatNumberTwoDecimals(computedSpacingMm) + " mm";
      const effectiveText = formatNumberTwoDecimals(effectiveLenMm) + " mm";
      const coverText = formatNumberTwoDecimals(coverUsedMm) + " mm";

      const resultHtml = `
        <p><strong>Bars needed:</strong> ${computedBars}</p>
        <p><strong>Spaces between bars:</strong> ${computedSpaces}</p>
        <p><strong>Actual center-to-center spacing:</strong> ${spacingText}</p>
        <p><strong>Effective length (after cover):</strong> ${effectiveText}</p>
        <p><strong>Cover used (each end):</strong> ${coverText}</p>
        <p><strong>Total length:</strong> ${formatNumberTwoDecimals(totalLenMeters)} m (${formatNumberTwoDecimals(totalLenMm)} mm)</p>
        <p><strong>Practical note:</strong> ${notes.join(" ")}</p>
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
      const message = "Rebar Spacing Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
