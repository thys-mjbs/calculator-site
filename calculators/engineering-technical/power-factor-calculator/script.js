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

  const modeKwKva = document.getElementById("modeKwKva");
  const modeKwKvar = document.getElementById("modeKwKvar");
  const modeViAngle = document.getElementById("modeViAngle");

  const realPowerKw = document.getElementById("realPowerKw");
  const apparentPowerKva = document.getElementById("apparentPowerKva");
  const targetPf1 = document.getElementById("targetPf1");

  const realPowerKw2 = document.getElementById("realPowerKw2");
  const reactivePowerKvar = document.getElementById("reactivePowerKvar");
  const qTypeSelect = document.getElementById("qTypeSelect");
  const targetPf2 = document.getElementById("targetPf2");

  const systemTypeSelect = document.getElementById("systemTypeSelect");
  const voltageV = document.getElementById("voltageV");
  const currentA = document.getElementById("currentA");
  const phaseAngleDeg = document.getElementById("phaseAngleDeg");
  const angleTypeSelect = document.getElementById("angleTypeSelect");
  const targetPf3 = document.getElementById("targetPf3");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(realPowerKw);
  attachLiveFormatting(apparentPowerKva);
  attachLiveFormatting(targetPf1);

  attachLiveFormatting(realPowerKw2);
  attachLiveFormatting(reactivePowerKvar);
  attachLiveFormatting(targetPf2);

  attachLiveFormatting(voltageV);
  attachLiveFormatting(currentA);
  attachLiveFormatting(phaseAngleDeg);
  attachLiveFormatting(targetPf3);

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
  // 4) MODE HANDLING
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeKwKva) modeKwKva.classList.add("hidden");
    if (modeKwKvar) modeKwKvar.classList.add("hidden");
    if (modeViAngle) modeViAngle.classList.add("hidden");

    if (mode === "kw_kva" && modeKwKva) modeKwKva.classList.remove("hidden");
    if (mode === "kw_kvar" && modeKwKvar) modeKwKvar.classList.remove("hidden");
    if (mode === "vi_angle" && modeViAngle) modeViAngle.classList.remove("hidden");

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

  function validatePfOptional(value, fieldLabel) {
    if (!Number.isFinite(value)) return true; // optional, missing is fine
    if (value <= 0 || value > 1) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 1 (for example 0.95).");
      return false;
    }
    return true;
  }

  function pfQualityLabel(pf) {
    if (!Number.isFinite(pf)) return "Unknown";
    if (pf >= 0.98) return "Excellent";
    if (pf >= 0.90) return "Good";
    if (pf >= 0.80) return "Fair";
    return "Poor";
  }

  function formatKvaKvar(value) {
    if (!Number.isFinite(value)) return "—";
    return formatNumberTwoDecimals(value);
  }

  function degreesToRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function estimateCorrectionKvar(pKw, pfCurrent, pfTarget) {
    if (!Number.isFinite(pKw) || !Number.isFinite(pfCurrent) || !Number.isFinite(pfTarget)) return null;
    pfCurrent = clamp(pfCurrent, 0.0001, 1);
    pfTarget = clamp(pfTarget, 0.0001, 1);

    // Qc = P * (tan(arccos(pf1)) - tan(arccos(pf2)))
    const phi1 = Math.acos(pfCurrent);
    const phi2 = Math.acos(pfTarget);
    const q1 = Math.tan(phi1);
    const q2 = Math.tan(phi2);
    const qc = pKw * (q1 - q2);
    return qc;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "kw_kva";

      let pf = null;
      let pKw = null;
      let sKva = null;
      let qKvarSigned = null;
      let qType = "Unknown";
      let targetPf = null;

      if (mode === "kw_kva") {
        pKw = toNumber(realPowerKw ? realPowerKw.value : "");
        sKva = toNumber(apparentPowerKva ? apparentPowerKva.value : "");
        targetPf = toNumber(targetPf1 ? targetPf1.value : "");

        if (!validatePositive(pKw, "real power (kW)")) return;
        if (!validatePositive(sKva, "apparent power (kVA)")) return;
        if (sKva < pKw) {
          setResultError("Apparent power (kVA) must be greater than or equal to real power (kW).");
          return;
        }
        if (!validatePfOptional(targetPf, "target power factor")) return;

        pf = pKw / sKva;
        pf = clamp(pf, 0, 1);

        // Reactive magnitude (cannot know sign from kW+kVA alone)
        const qMag = Math.sqrt(Math.max(0, (sKva * sKva) - (pKw * pKw)));
        qKvarSigned = qMag;
        qType = "Unknown (usually lagging)";
      }

      if (mode === "kw_kvar") {
        pKw = toNumber(realPowerKw2 ? realPowerKw2.value : "");
        const qKvar = toNumber(reactivePowerKvar ? reactivePowerKvar.value : "");
        targetPf = toNumber(targetPf2 ? targetPf2.value : "");
        qType = qTypeSelect ? qTypeSelect.value : "lagging";

        if (!validatePositive(pKw, "real power (kW)")) return;
        if (!validatePositive(qKvar, "reactive power (kVAR)")) return;
        if (!validatePfOptional(targetPf, "target power factor")) return;

        qKvarSigned = qType === "leading" ? -qKvar : qKvar;
        sKva = Math.sqrt((pKw * pKw) + (qKvar * qKvar));
        pf = pKw / sKva;
        pf = clamp(pf, 0, 1);
      }

      if (mode === "vi_angle") {
        const systemType = systemTypeSelect ? systemTypeSelect.value : "single";
        const v = toNumber(voltageV ? voltageV.value : "");
        const i = toNumber(currentA ? currentA.value : "");
        const angleDeg = toNumber(phaseAngleDeg ? phaseAngleDeg.value : "");
        qType = angleTypeSelect ? angleTypeSelect.value : "lagging";
        targetPf = toNumber(targetPf3 ? targetPf3.value : "");

        if (!validatePositive(v, "voltage (V)")) return;
        if (!validatePositive(i, "current (A)")) return;

        if (!Number.isFinite(angleDeg) || angleDeg < 0 || angleDeg > 90) {
          setResultError("Enter a valid phase angle between 0 and 90 degrees.");
          return;
        }
        if (!validatePfOptional(targetPf, "target power factor")) return;

        const angleRad = degreesToRadians(angleDeg);
        pf = Math.cos(angleRad);
        pf = clamp(pf, 0, 1);

        // Apparent power in kVA
        const sVa = systemType === "three" ? (Math.sqrt(3) * v * i) : (v * i);
        sKva = sVa / 1000;

        // Real and reactive from S and PF
        pKw = sKva * pf;
        const qMag = Math.sqrt(Math.max(0, (sKva * sKva) - (pKw * pKw)));
        qKvarSigned = qType === "leading" ? -qMag : qMag;
      }

      if (!Number.isFinite(pf) || !Number.isFinite(pKw) || !Number.isFinite(sKva)) {
        setResultError("Enter valid inputs to calculate power factor.");
        return;
      }

      const pfLabel = pfQualityLabel(pf);
      const pfPct = formatNumberTwoDecimals(pf * 100);

      const qAbs = Math.abs(qKvarSigned);
      const qSignedText = Number.isFinite(qKvarSigned) ? formatKvaKvar(qKvarSigned) : "—";
      const qAbsText = Number.isFinite(qAbs) ? formatKvaKvar(qAbs) : "—";

      let practicalNote = "";
      if (pf >= 0.95) practicalNote = "Typically efficient current draw for the power delivered.";
      else if (pf >= 0.85) practicalNote = "Often acceptable, but some sites target higher to reduce current and losses.";
      else practicalNote = "Low power factor can increase current draw and reduce available capacity.";

      const pfTypeText =
        qType === "lagging" ? "Lagging (inductive)" :
        qType === "leading" ? "Leading (capacitive)" :
        "Unknown (not enough information)";

      let correctionHtml = "";
      if (Number.isFinite(targetPf)) {
        const pfTargetClamped = clamp(targetPf, 0.0001, 1);
        if (pfTargetClamped <= pf) {
          correctionHtml = `<p><strong>Correction estimate:</strong> Target PF is not higher than current PF, so no correction is needed for that target.</p>`;
        } else {
          const qc = estimateCorrectionKvar(pKw, pf, pfTargetClamped);
          if (Number.isFinite(qc)) {
            const qcText = formatKvaKvar(Math.abs(qc));
            const typicalDevice = qType === "leading"
              ? "inductive (reactor) correction is typically used to reduce leading PF"
              : "capacitor bank correction is typically used to improve lagging PF";

            correctionHtml =
              `<p><strong>PF correction estimate:</strong> About <strong>${qcText} kVAR</strong> of compensation to reach <strong>${formatNumberTwoDecimals(pfTargetClamped)}</strong> (planning estimate). ` +
              `In practice, ${typicalDevice}.` +
              `</p>`;
          }
        }
      }

      const resultHtml =
        `<p><strong>Power factor (PF):</strong> ${formatNumberTwoDecimals(pf)} (${pfPct}%)</p>` +
        `<p><strong>Quality:</strong> ${pfLabel}</p>` +
        `<p><strong>Type:</strong> ${pfTypeText}</p>` +
        `<p><strong>Real power (kW):</strong> ${formatKvaKvar(pKw)}</p>` +
        `<p><strong>Apparent power (kVA):</strong> ${formatKvaKvar(sKva)}</p>` +
        `<p><strong>Reactive power (kVAR):</strong> ${qSignedText} (magnitude ${qAbsText})</p>` +
        `<p><strong>Practical note:</strong> ${practicalNote}</p>` +
        correctionHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Power Factor Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
