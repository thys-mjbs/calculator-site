document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaLength = document.getElementById("areaLength");
  const areaWidth = document.getElementById("areaWidth");
  const tileLength = document.getElementById("tileLength");
  const tileWidth = document.getElementById("tileWidth");

  const wastePercent = document.getElementById("wastePercent");
  const spareTiles = document.getElementById("spareTiles");
  const tilesPerBox = document.getElementById("tilesPerBox");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense (counts)
  attachLiveFormatting(spareTiles);
  attachLiveFormatting(tilesPerBox);

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
  // (not used)
  // ------------------------------------------------------------

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

  function formatInt(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const lengthM = toNumber(areaLength ? areaLength.value : "");
      const widthM = toNumber(areaWidth ? areaWidth.value : "");
      const tileLenMm = toNumber(tileLength ? tileLength.value : "");
      const tileWidMm = toNumber(tileWidth ? tileWidth.value : "");

      const wastePctRaw = toNumber(wastePercent ? wastePercent.value : "");
      const spareRaw = toNumber(spareTiles ? spareTiles.value : "");
      const perBoxRaw = toNumber(tilesPerBox ? tilesPerBox.value : "");

      // Basic existence guard
      if (!areaLength || !areaWidth || !tileLength || !tileWidth) return;

      // Validation: required
      if (!validatePositive(lengthM, "surface length")) return;
      if (!validatePositive(widthM, "surface width")) return;
      if (!validatePositive(tileLenMm, "tile length (mm)")) return;
      if (!validatePositive(tileWidMm, "tile width (mm)")) return;

      // Optional defaults
      const wastePct = Number.isFinite(wastePctRaw) && wastePctRaw !== 0 ? wastePctRaw : 10;
      const spareCount = Number.isFinite(spareRaw) ? spareRaw : 0;

      if (!validateNonNegative(wastePct, "waste allowance (%)")) return;
      if (!validateNonNegative(spareCount, "extra spare tiles")) return;

      if (wastePct > 50) {
        setResultError("Waste allowance above 50% is unusually high. Enter a smaller value unless you are certain.");
        return;
      }

      // Convert tile to meters
      const tileLenM = tileLenMm / 1000;
      const tileWidM = tileWidMm / 1000;

      if (!validatePositive(tileLenM, "tile length")) return;
      if (!validatePositive(tileWidM, "tile width")) return;

      // Calculation logic
      const areaM2 = lengthM * widthM;
      const tileAreaM2 = tileLenM * tileWidM;

      if (!Number.isFinite(areaM2) || areaM2 <= 0) {
        setResultError("Enter a valid surface size.");
        return;
      }

      if (!Number.isFinite(tileAreaM2) || tileAreaM2 <= 0) {
        setResultError("Enter a valid tile size.");
        return;
      }

      const rawTiles = areaM2 / tileAreaM2;
      const tilesWithWaste = rawTiles * (1 + wastePct / 100);
      const tilesRounded = Math.ceil(tilesWithWaste);
      const tilesFinal = Math.ceil(tilesRounded + spareCount);

      // Optional box logic
      let boxHtml = "";
      const perBox = perBoxRaw;

      if (Number.isFinite(perBox) && perBox > 0) {
        const boxesNeeded = Math.ceil(tilesFinal / perBox);
        const tilesPurchased = boxesNeeded * perBox;
        const leftoverTiles = tilesPurchased - tilesFinal;
        const coveragePerBoxM2 = perBox * tileAreaM2;

        boxHtml = `
          <hr>
          <p><strong>Boxes to buy:</strong> ${formatInt(boxesNeeded)} box(es)</p>
          <p><strong>Tiles purchased (by boxes):</strong> ${formatInt(tilesPurchased)} tile(s)</p>
          <p><strong>Leftover tiles:</strong> ${formatInt(leftoverTiles)} tile(s)</p>
          <p><strong>Coverage per box:</strong> ${formatNumberTwoDecimals(coveragePerBoxM2)} m²</p>
        `;
      } else if (tilesPerBox && tilesPerBox.value.trim() !== "") {
        setResultError("Tiles per box must be greater than 0, or leave it blank.");
        return;
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Total tiles to buy:</strong> ${formatInt(tilesFinal)} tile(s)</p>
        <p><strong>Includes waste allowance:</strong> ${wastePct}%${spareCount > 0 ? " and " + formatInt(spareCount) + " spare tile(s)" : ""}</p>
        <hr>
        <p><strong>Surface area:</strong> ${formatNumberTwoDecimals(areaM2)} m²</p>
        <p><strong>Tile coverage:</strong> ${formatNumberTwoDecimals(tileAreaM2)} m² per tile</p>
        <p><strong>Raw tiles (no waste):</strong> ${formatInt(Math.ceil(rawTiles))} tile(s)</p>
        ${boxHtml}
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
      const message = "Tile Quantity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
