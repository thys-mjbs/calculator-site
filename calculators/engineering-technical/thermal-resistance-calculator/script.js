document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const heatLoadW = document.getElementById("heatLoadW");
  const areaCm2 = document.getElementById("areaCm2");

  const t1mm = document.getElementById("t1mm");
  const k1 = document.getElementById("k1");

  const t2mm = document.getElementById("t2mm");
  const k2 = document.getElementById("k2");

  const t3mm = document.getElementById("t3mm");
  const k3 = document.getElementById("k3");

  const extraR = document.getElementById("extraR");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(heatLoadW);
  attachLiveFormatting(areaCm2);
  attachLiveFormatting(t1mm);
  attachLiveFormatting(k1);
  attachLiveFormatting(t2mm);
  attachLiveFormatting(k2);
  attachLiveFormatting(t3mm);
  attachLiveFormatting(k3);
  attachLiveFormatting(extraR);

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

  function isFilled(value) {
    return typeof value === "number" && Number.isFinite(value) && value !== 0;
  }

  function layerIsEmpty(tVal, kVal) {
    const tEmpty = !Number.isFinite(tVal) || tVal === 0;
    const kEmpty = !Number.isFinite(kVal) || kVal === 0;
    return tEmpty && kEmpty;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const qW = toNumber(heatLoadW ? heatLoadW.value : "");
      const areaCm2Val = toNumber(areaCm2 ? areaCm2.value : "");

      const t1mmVal = toNumber(t1mm ? t1mm.value : "");
      const k1Val = toNumber(k1 ? k1.value : "");

      const t2mmVal = toNumber(t2mm ? t2mm.value : "");
      const k2Val = toNumber(k2 ? k2.value : "");

      const t3mmVal = toNumber(t3mm ? t3mm.value : "");
      const k3Val = toNumber(k3 ? k3.value : "");

      const extraRVal = toNumber(extraR ? extraR.value : "");

      // Basic existence guard
      if (!heatLoadW || !areaCm2 || !t1mm || !k1) return;

      // Validation: required fields
      if (!validatePositive(qW, "heat load (W)")) return;
      if (!validatePositive(areaCm2Val, "contact area (cm²)")) return;
      if (!validatePositive(t1mmVal, "Layer 1 thickness (mm)")) return;
      if (!validatePositive(k1Val, "Layer 1 thermal conductivity k (W/m·K)")) return;

      // Validation: optional layers must be complete if used
      const layer2Empty = layerIsEmpty(t2mmVal, k2Val);
      if (!layer2Empty) {
        if (!validatePositive(t2mmVal, "Layer 2 thickness (mm)")) return;
        if (!validatePositive(k2Val, "Layer 2 thermal conductivity k (W/m·K)")) return;
      }

      const layer3Empty = layerIsEmpty(t3mmVal, k3Val);
      if (!layer3Empty) {
        if (!validatePositive(t3mmVal, "Layer 3 thickness (mm)")) return;
        if (!validatePositive(k3Val, "Layer 3 thermal conductivity k (W/m·K)")) return;
      }

      // Extra resistance can be blank -> treat as 0
      const extraRUse = Number.isFinite(extraRVal) ? extraRVal : 0;
      if (!validateNonNegative(extraRUse, "extra thermal resistance (K/W)")) return;

      // Convert to SI
      const areaM2 = areaCm2Val / 10000;
      if (!validatePositive(areaM2, "contact area")) return;

      const t1m = t1mmVal / 1000;
      const t2m = layer2Empty ? 0 : t2mmVal / 1000;
      const t3m = layer3Empty ? 0 : t3mmVal / 1000;

      // Calculation: R = L / (k * A)
      const r1 = t1m / (k1Val * areaM2);
      const r2 = layer2Empty ? 0 : t2m / (k2Val * areaM2);
      const r3 = layer3Empty ? 0 : t3m / (k3Val * areaM2);

      const rTotal = r1 + r2 + r3 + extraRUse;

      if (!Number.isFinite(rTotal) || rTotal <= 0) {
        setResultError("Enter inputs that produce a valid total thermal resistance.");
        return;
      }

      const deltaT = qW * rTotal; // K ~= °C difference
      const conductance = 1 / rTotal; // W/K
      const heatFlux = qW / areaM2; // W/m²

      const pct1 = (r1 / rTotal) * 100;
      const pct2 = r2 > 0 ? (r2 / rTotal) * 100 : 0;
      const pct3 = r3 > 0 ? (r3 / rTotal) * 100 : 0;
      const pctExtra = extraRUse > 0 ? (extraRUse / rTotal) * 100 : 0;

      const rTotal_mK_per_W = rTotal * 1000;

      const resultHtml = `
        <p><strong>Total thermal resistance:</strong> ${formatNumberTwoDecimals(rTotal)} K/W (${formatNumberTwoDecimals(rTotal_mK_per_W)} mK/W)</p>
        <p><strong>Estimated temperature rise across the stack:</strong> ${formatNumberTwoDecimals(deltaT)} °C at ${formatNumberTwoDecimals(qW)} W</p>
        <p><strong>Thermal conductance:</strong> ${formatNumberTwoDecimals(conductance)} W/K</p>
        <p><strong>Heat flux (average):</strong> ${formatNumberTwoDecimals(heatFlux)} W/m²</p>
        <h3 style="margin:12px 0 6px; font-size:14px;">Resistance breakdown</h3>
        <ul style="margin:0; padding-left:18px;">
          <li>Layer 1: ${formatNumberTwoDecimals(r1)} K/W (${formatNumberTwoDecimals(pct1)}%)</li>
          ${r2 > 0 ? `<li>Layer 2: ${formatNumberTwoDecimals(r2)} K/W (${formatNumberTwoDecimals(pct2)}%)</li>` : ``}
          ${r3 > 0 ? `<li>Layer 3: ${formatNumberTwoDecimals(r3)} K/W (${formatNumberTwoDecimals(pct3)}%)</li>` : ``}
          ${extraRUse > 0 ? `<li>Extra (contacts/interfaces): ${formatNumberTwoDecimals(extraRUse)} K/W (${formatNumberTwoDecimals(pctExtra)}%)</li>` : ``}
        </ul>
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
      const message = "Thermal Resistance Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
