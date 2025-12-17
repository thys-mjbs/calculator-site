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

  const slabLength = document.getElementById("slabLength");
  const slabWidth = document.getElementById("slabWidth");
  const slabOpenings = document.getElementById("slabOpenings");

  const wallLength = document.getElementById("wallLength");
  const wallHeight = document.getElementById("wallHeight");
  const wallOpenings = document.getElementById("wallOpenings");

  const colPerimeter = document.getElementById("colPerimeter");
  const colHeight = document.getElementById("colHeight");
  const colQty = document.getElementById("colQty");

  const wastePercent = document.getElementById("wastePercent");
  const sheetArea = document.getElementById("sheetArea");

  // Optional: mode selector + grouped input blocks
  const modeBlockSlab = document.getElementById("modeBlockSlab");
  const modeBlockWall = document.getElementById("modeBlockWall");
  const modeBlockColumn = document.getElementById("modeBlockColumn");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(slabLength);
  attachLiveFormatting(slabWidth);
  attachLiveFormatting(slabOpenings);

  attachLiveFormatting(wallLength);
  attachLiveFormatting(wallHeight);
  attachLiveFormatting(wallOpenings);

  attachLiveFormatting(colPerimeter);
  attachLiveFormatting(colHeight);
  attachLiveFormatting(colQty);

  attachLiveFormatting(wastePercent);
  attachLiveFormatting(sheetArea);

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
    if (modeBlockSlab) modeBlockSlab.classList.add("hidden");
    if (modeBlockWall) modeBlockWall.classList.add("hidden");
    if (modeBlockColumn) modeBlockColumn.classList.add("hidden");

    if (mode === "slab" && modeBlockSlab) modeBlockSlab.classList.remove("hidden");
    if (mode === "wall" && modeBlockWall) modeBlockWall.classList.remove("hidden");
    if (mode === "column" && modeBlockColumn) modeBlockColumn.classList.remove("hidden");

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
      const mode = modeSelect ? modeSelect.value : "slab";

      const wastePct = toNumber(wastePercent ? wastePercent.value : "");
      const wastePctUsed = Number.isFinite(wastePct) && wastePct >= 0 ? wastePct : 5;

      const sheetAreaVal = toNumber(sheetArea ? sheetArea.value : "");
      const sheetAreaUsed = Number.isFinite(sheetAreaVal) && sheetAreaVal > 0 ? sheetAreaVal : 2.9768;

      let grossArea = 0;
      let openingsArea = 0;

      if (mode === "slab") {
        const L = toNumber(slabLength ? slabLength.value : "");
        const W = toNumber(slabWidth ? slabWidth.value : "");
        const O = toNumber(slabOpenings ? slabOpenings.value : "");

        if (!validatePositive(L, "slab length (m)")) return;
        if (!validatePositive(W, "slab width (m)")) return;

        openingsArea = Number.isFinite(O) ? O : 0;
        if (!validateNonNegative(openingsArea, "openings area (m²)")) return;

        grossArea = L * W;

        if (openingsArea > grossArea) {
          setResultError("Openings area cannot be greater than the slab area.");
          return;
        }
      } else if (mode === "wall") {
        const L = toNumber(wallLength ? wallLength.value : "");
        const H = toNumber(wallHeight ? wallHeight.value : "");
        const O = toNumber(wallOpenings ? wallOpenings.value : "");

        if (!validatePositive(L, "wall length (m)")) return;
        if (!validatePositive(H, "wall height (m)")) return;

        openingsArea = Number.isFinite(O) ? O : 0;
        if (!validateNonNegative(openingsArea, "openings area (m²)")) return;

        grossArea = 2 * L * H;

        if (openingsArea > grossArea) {
          setResultError("Openings area cannot be greater than the total wall formwork area.");
          return;
        }
      } else if (mode === "column") {
        const P = toNumber(colPerimeter ? colPerimeter.value : "");
        const H = toNumber(colHeight ? colHeight.value : "");
        const Q = toNumber(colQty ? colQty.value : "");

        if (!validatePositive(P, "column perimeter (m)")) return;
        if (!validatePositive(H, "column height (m)")) return;

        const qtyUsed = Number.isFinite(Q) && Q > 0 ? Q : 1;

        grossArea = P * H * qtyUsed;
        openingsArea = 0;
      }

      if (!validateNonNegative(wastePctUsed, "waste/allowance (%)")) return;

      const netArea = grossArea - openingsArea;
      const adjustedArea = netArea * (1 + wastePctUsed / 100);

      const estimatedSheets = sheetAreaUsed > 0 ? Math.ceil(adjustedArea / sheetAreaUsed) : 0;

      const grossStr = formatNumberTwoDecimals(grossArea);
      const openingsStr = formatNumberTwoDecimals(openingsArea);
      const netStr = formatNumberTwoDecimals(netArea);
      const wasteStr = formatNumberTwoDecimals(wastePctUsed);
      const adjustedStr = formatNumberTwoDecimals(adjustedArea);
      const sheetAreaStr = formatNumberTwoDecimals(sheetAreaUsed);

      const resultHtml = `
        <p><strong>Gross formwork area:</strong> ${grossStr} m²</p>
        <p><strong>Openings deducted:</strong> ${openingsStr} m²</p>
        <p><strong>Net formwork area:</strong> ${netStr} m²</p>
        <p><strong>Waste/allowance applied:</strong> ${wasteStr}%</p>
        <p><strong>Adjusted formwork area:</strong> ${adjustedStr} m²</p>
        <p><strong>Rough sheet count:</strong> ${estimatedSheets.toLocaleString()} sheets (using ${sheetAreaStr} m² per sheet)</p>
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
      const message = "Formwork Area Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
