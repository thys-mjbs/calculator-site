document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const forceKnInput = document.getElementById("forceKn");
  const boreMmInput = document.getElementById("boreMm");
  const efficiencyPctInput = document.getElementById("efficiencyPct");
  const safetyFactorPctInput = document.getElementById("safetyFactorPct");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(forceKnInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const forceKn = toNumber(forceKnInput ? forceKnInput.value : "");
      const boreMm = toNumber(boreMmInput ? boreMmInput.value : "");

      const efficiencyPctRaw = toNumber(efficiencyPctInput ? efficiencyPctInput.value : "");
      const safetyFactorPctRaw = toNumber(safetyFactorPctInput ? safetyFactorPctInput.value : "");

      if (!validatePositive(forceKn, "target force (kN)")) return;
      if (!validatePositive(boreMm, "bore diameter (mm)")) return;

      let efficiencyPct = Number.isFinite(efficiencyPctRaw) && efficiencyPctRaw > 0 ? efficiencyPctRaw : 85;
      let safetyFactorPct = Number.isFinite(safetyFactorPctRaw) && safetyFactorPctRaw >= 0 ? safetyFactorPctRaw : 10;

      if (efficiencyPct <= 0 || efficiencyPct > 100) {
        setResultError("Enter a valid overall efficiency (%) between 1 and 100.");
        return;
      }

      if (safetyFactorPct < 0 || safetyFactorPct > 200) {
        setResultError("Enter a valid safety factor (%) between 0 and 200.");
        return;
      }

      const forceN = forceKn * 1000;

      const boreM = boreMm / 1000;
      const areaM2 = Math.PI * (boreM * boreM) / 4;

      if (!Number.isFinite(areaM2) || areaM2 <= 0) {
        setResultError("Enter a valid bore diameter (mm).");
        return;
      }

      const eff = efficiencyPct / 100;
      const sf = safetyFactorPct / 100;

      const pressurePaIdeal = forceN / areaM2;
      const pressurePaWithEff = pressurePaIdeal / eff;
      const pressurePaFinal = pressurePaWithEff * (1 + sf);

      const pressureBar = pressurePaFinal / 100000;
      const pressureMPa = pressurePaFinal / 1000000;
      const pressurePsi = pressurePaFinal / 6894.757293168;

      const areaCm2 = areaM2 * 10000;

      const forcePerBarN = 100000 * areaM2 * eff;
      const forcePerBarKn = forcePerBarN / 1000;

      const pressureBarNoSafety = pressurePaWithEff / 100000;
      const pressureBarIdeal = pressurePaIdeal / 100000;

      const resultHtml =
        `<p><strong>Required pressure:</strong> ${formatNumberTwoDecimals(pressureBar)} bar</p>` +
        `<p><strong>Also in:</strong> ${formatNumberTwoDecimals(pressureMPa)} MPa | ${formatNumberTwoDecimals(pressurePsi)} psi</p>` +
        `<p><strong>Piston area (from bore):</strong> ${formatNumberTwoDecimals(areaCm2)} cm²</p>` +
        `<p><strong>Force per 1 bar (at ${formatNumberTwoDecimals(efficiencyPct)}% efficiency):</strong> ${formatNumberTwoDecimals(forcePerBarKn)} kN per bar</p>` +
        `<p><strong>Pressure breakdown:</strong> Ideal (100%): ${formatNumberTwoDecimals(pressureBarIdeal)} bar · With efficiency: ${formatNumberTwoDecimals(pressureBarNoSafety)} bar · With safety factor: ${formatNumberTwoDecimals(pressureBar)} bar</p>` +
        `<p><strong>Assumptions used:</strong> Efficiency ${formatNumberTwoDecimals(efficiencyPct)}% and safety factor ${formatNumberTwoDecimals(safetyFactorPct)}% (defaults apply if left blank).</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Hydraulic Pressure Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
