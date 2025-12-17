document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wallLength = document.getElementById("wallLength");
  const wallHeight = document.getElementById("wallHeight");
  const openingsArea = document.getElementById("openingsArea");
  const blockLengthMm = document.getElementById("blockLengthMm");
  const blockHeightMm = document.getElementById("blockHeightMm");
  const mortarJointMm = document.getElementById("mortarJointMm");
  const wastePercent = document.getElementById("wastePercent");
  const blocksPerPallet = document.getElementById("blocksPerPallet");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(wallLength);
  attachLiveFormatting(wallHeight);
  attachLiveFormatting(openingsArea);
  attachLiveFormatting(blockLengthMm);
  attachLiveFormatting(blockHeightMm);
  attachLiveFormatting(mortarJointMm);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(blocksPerPallet);

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
      const wallLengthVal = toNumber(wallLength ? wallLength.value : "");
      const wallHeightVal = toNumber(wallHeight ? wallHeight.value : "");
      const openingsAreaValRaw = toNumber(openingsArea ? openingsArea.value : "");
      const blockLengthMmValRaw = toNumber(blockLengthMm ? blockLengthMm.value : "");
      const blockHeightMmValRaw = toNumber(blockHeightMm ? blockHeightMm.value : "");
      const mortarJointMmValRaw = toNumber(mortarJointMm ? mortarJointMm.value : "");
      const wastePercentValRaw = toNumber(wastePercent ? wastePercent.value : "");
      const blocksPerPalletValRaw = toNumber(blocksPerPallet ? blocksPerPallet.value : "");

      // Existence guard
      if (!wallLength || !wallHeight || !blockLengthMm || !blockHeightMm || !mortarJointMm) return;

      // Defaults for optional fields (no penalty for missing)
      const openingsAreaVal = Number.isFinite(openingsAreaValRaw) ? openingsAreaValRaw : 0;
      const wastePercentVal = Number.isFinite(wastePercentValRaw) ? wastePercentValRaw : 5;
      const blocksPerPalletVal = Number.isFinite(blocksPerPalletValRaw) && blocksPerPalletValRaw > 0 ? blocksPerPalletValRaw : 500;

      // Defaults for common block sizes if left blank
      const blockLengthMmVal = Number.isFinite(blockLengthMmValRaw) && blockLengthMmValRaw > 0 ? blockLengthMmValRaw : 390;
      const blockHeightMmVal = Number.isFinite(blockHeightMmValRaw) && blockHeightMmValRaw > 0 ? blockHeightMmValRaw : 190;
      const mortarJointMmVal = Number.isFinite(mortarJointMmValRaw) && mortarJointMmValRaw >= 0 ? mortarJointMmValRaw : 10;

      // Validation
      if (!validatePositive(wallLengthVal, "wall length (m)")) return;
      if (!validatePositive(wallHeightVal, "wall height (m)")) return;

      if (!validatePositive(blockLengthMmVal, "block length (mm)")) return;
      if (!validatePositive(blockHeightMmVal, "block height (mm)")) return;
      if (!validateNonNegative(mortarJointMmVal, "mortar joint thickness (mm)")) return;

      if (!validateNonNegative(openingsAreaVal, "openings area (m²)")) return;
      if (!validateNonNegative(wastePercentVal, "wastage (%)")) return;

      const grossArea = wallLengthVal * wallHeightVal;
      if (!Number.isFinite(grossArea) || grossArea <= 0) {
        setResultError("Enter a valid wall size to calculate area.");
        return;
      }

      if (openingsAreaVal > grossArea) {
        setResultError("Openings area cannot be greater than the wall area. Reduce openings or increase wall size.");
        return;
      }

      const netArea = Math.max(0, grossArea - openingsAreaVal);

      // Effective block module size in meters (block + joint)
      const effLengthM = (blockLengthMmVal + mortarJointMmVal) / 1000;
      const effHeightM = (blockHeightMmVal + mortarJointMmVal) / 1000;

      if (!validatePositive(effLengthM, "effective block length")) return;
      if (!validatePositive(effHeightM, "effective block height")) return;

      const moduleArea = effLengthM * effHeightM;
      if (!Number.isFinite(moduleArea) || moduleArea <= 0) {
        setResultError("Block size and mortar joint values produce an invalid module area.");
        return;
      }

      const blocksPerM2 = 1 / moduleArea;
      const blocksNeededBase = netArea * blocksPerM2;
      const blocksWithWaste = blocksNeededBase * (1 + wastePercentVal / 100);

      const blocksRounded = Math.ceil(blocksWithWaste);
      const palletsNeeded = Math.ceil(blocksRounded / blocksPerPalletVal);

      const resultHtml =
        `<p><strong>Estimated blocks needed:</strong> ${blocksRounded.toLocaleString()}</p>` +
        `<p><strong>Net wall area:</strong> ${formatNumberTwoDecimals(netArea)} m² (gross ${formatNumberTwoDecimals(grossArea)} m²)</p>` +
        `<p><strong>Blocks per m² (with joints):</strong> ${formatNumberTwoDecimals(blocksPerM2)}</p>` +
        `<p><strong>Includes wastage:</strong> ${formatNumberTwoDecimals(wastePercentVal)}%</p>` +
        `<p><strong>Optional planning:</strong> about ${palletsNeeded.toLocaleString()} pallet(s) at ${Math.round(blocksPerPalletVal).toLocaleString()} blocks per pallet</p>` +
        `<p style="margin-top:10px;"><em>Tip:</em> If you are unsure, increase wastage a little for cutting and breakage, especially for corners, piers, and returns.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Block Quantity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
