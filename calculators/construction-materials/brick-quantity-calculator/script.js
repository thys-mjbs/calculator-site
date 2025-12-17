document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wallLengthM = document.getElementById("wallLengthM");
  const wallHeightM = document.getElementById("wallHeightM");
  const openingAreaM2 = document.getElementById("openingAreaM2");
  const brickLengthMM = document.getElementById("brickLengthMM");
  const brickHeightMM = document.getElementById("brickHeightMM");
  const mortarJointMM = document.getElementById("mortarJointMM");
  const wastePercent = document.getElementById("wastePercent");
  const bricksPerPack = document.getElementById("bricksPerPack");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Light formatting is helpful for these fields (users often type big numbers/decimals)
  attachLiveFormatting(wallLengthM);
  attachLiveFormatting(wallHeightM);
  attachLiveFormatting(openingAreaM2);
  attachLiveFormatting(brickLengthMM);
  attachLiveFormatting(brickHeightMM);
  attachLiveFormatting(mortarJointMM);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(bricksPerPack);

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
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const lengthM = toNumber(wallLengthM ? wallLengthM.value : "");
      const heightM = toNumber(wallHeightM ? wallHeightM.value : "");
      const openingsM2Raw = toNumber(openingAreaM2 ? openingAreaM2.value : "");
      const brickLen = toNumber(brickLengthMM ? brickLengthMM.value : "");
      const brickHt = toNumber(brickHeightMM ? brickHeightMM.value : "");
      const jointRaw = toNumber(mortarJointMM ? mortarJointMM.value : "");
      const wasteRaw = toNumber(wastePercent ? wastePercent.value : "");
      const packRaw = toNumber(bricksPerPack ? bricksPerPack.value : "");

      // Basic existence guard
      if (
        !wallLengthM ||
        !wallHeightM ||
        !openingAreaM2 ||
        !brickLengthMM ||
        !brickHeightMM ||
        !mortarJointMM ||
        !wastePercent ||
        !bricksPerPack
      ) {
        return;
      }

      // Defaults for optional fields
      const openingsM2 = Number.isFinite(openingsM2Raw) ? openingsM2Raw : 0;
      const jointMM = Number.isFinite(jointRaw) && jointRaw >= 0 ? jointRaw : 10;
      const wastePct = Number.isFinite(wasteRaw) && wasteRaw >= 0 ? wasteRaw : 5;
      const bricksPerPackValue = Number.isFinite(packRaw) && packRaw > 0 ? packRaw : 500;

      // Validation
      if (!validatePositive(lengthM, "wall length")) return;
      if (!validatePositive(heightM, "wall height")) return;

      if (!validatePositive(brickLen, "brick length")) return;
      if (!validatePositive(brickHt, "brick height")) return;

      if (!validateNonNegative(openingsM2, "openings area")) return;
      if (!validateNonNegative(jointMM, "mortar joint thickness")) return;
      if (!validateNonNegative(wastePct, "waste allowance")) return;

      if (wastePct > 50) {
        setResultError("Waste allowance above 50% is unusually high. Enter a smaller percentage or double-check your value.");
        return;
      }

      const wallArea = lengthM * heightM;

      if (openingsM2 > wallArea) {
        setResultError("Openings area cannot be larger than the total wall area. Reduce the openings value or check your wall measurements.");
        return;
      }

      // Calculation logic
      const moduleLengthM = (brickLen + jointMM) / 1000;
      const moduleHeightM = (brickHt + jointMM) / 1000;

      if (!Number.isFinite(moduleLengthM) || moduleLengthM <= 0 || !Number.isFinite(moduleHeightM) || moduleHeightM <= 0) {
        setResultError("Brick size and mortar joint must result in a positive module size. Check your inputs.");
        return;
      }

      const bricksPerM2 = 1 / (moduleLengthM * moduleHeightM);
      const netArea = Math.max(0, wallArea - openingsM2);

      const baseBricks = netArea * bricksPerM2;
      const wasteFactor = 1 + wastePct / 100;

      const bricksNoWaste = Math.ceil(baseBricks);
      const bricksWithWaste = Math.ceil(baseBricks * wasteFactor);
      const extraBricks = Math.max(0, bricksWithWaste - bricksNoWaste);

      const packsNeeded = Math.ceil(bricksWithWaste / bricksPerPackValue);

      // Build output HTML
      const resultHtml = `
        <p><strong>Total bricks (including waste):</strong> ${formatInputWithCommas(String(bricksWithWaste))}</p>
        <p><strong>Bricks (no waste):</strong> ${formatInputWithCommas(String(bricksNoWaste))} ${extraBricks > 0 ? `(plus ${formatInputWithCommas(String(extraBricks))} extra for waste)` : ""}</p>
        <p><strong>Net wall area:</strong> ${formatNumberTwoDecimals(netArea)} m² ${openingsM2 > 0 ? `(wall area ${formatNumberTwoDecimals(wallArea)} m² minus openings ${formatNumberTwoDecimals(openingsM2)} m²)` : `(wall area ${formatNumberTwoDecimals(wallArea)} m²)`}</p>
        <p><strong>Estimated bricks per m²:</strong> ${formatNumberTwoDecimals(bricksPerM2)}</p>
        <p><strong>Ordering helper:</strong> ${formatInputWithCommas(String(packsNeeded))} pack(s) of ${formatInputWithCommas(String(bricksPerPackValue))} bricks</p>
        <p><strong>What this means:</strong> Order at least ${formatInputWithCommas(String(bricksWithWaste))} bricks to cover the net wall area with a ${formatNumberTwoDecimals(wastePct)}% allowance.</p>
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
      const message = "Brick Quantity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
