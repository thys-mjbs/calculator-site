document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const diameterInput = document.getElementById("diameterInput");
  const diameterUnit = document.getElementById("diameterUnit");
  const speedInput = document.getElementById("speedInput");
  const speedUnit = document.getElementById("speedUnit");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(diameterInput);
  attachLiveFormatting(speedInput);

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
  // Calculator-specific helpers
  // ------------------------------------------------------------
  function diameterToMeters(d, unit) {
    if (!Number.isFinite(d)) return NaN;
    if (unit === "mm") return d / 1000;
    if (unit === "cm") return d / 100;
    if (unit === "m") return d;
    if (unit === "in") return d * 0.0254;
    return NaN;
  }

  function speedToMetersPerSecond(v, unit) {
    if (!Number.isFinite(v)) return NaN;
    if (unit === "m_s") return v;
    if (unit === "m_min") return v / 60;
    if (unit === "km_h") return (v * 1000) / 3600;
    if (unit === "ft_min") return (v * 0.3048) / 60;
    return NaN;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Input existence guard
      if (!diameterInput || !diameterUnit || !speedInput || !speedUnit) return;

      // Parse inputs using toNumber() (from /scripts/main.js)
      const diameterVal = toNumber(diameterInput.value);
      const speedVal = toNumber(speedInput.value);

      // Validation
      if (!validatePositive(diameterVal, "diameter")) return;
      if (!validatePositive(speedVal, "surface speed")) return;

      const dMeters = diameterToMeters(diameterVal, diameterUnit.value);
      const vMetersPerSec = speedToMetersPerSecond(speedVal, speedUnit.value);

      if (!Number.isFinite(dMeters) || dMeters <= 0) {
        setResultError("Enter a valid diameter and unit.");
        return;
      }

      if (!Number.isFinite(vMetersPerSec) || vMetersPerSec <= 0) {
        setResultError("Enter a valid surface speed and unit.");
        return;
      }

      const circumferenceMeters = Math.PI * dMeters;

      if (!Number.isFinite(circumferenceMeters) || circumferenceMeters <= 0) {
        setResultError("Diameter is too small to calculate reliably.");
        return;
      }

      // RPM = (linear speed / circumference) * 60
      const rps = vMetersPerSec / circumferenceMeters;
      const rpm = rps * 60;

      if (!Number.isFinite(rpm) || rpm <= 0) {
        setResultError("Inputs produce an invalid RPM. Check your values and units.");
        return;
      }

      const radPerSec = rpm * (2 * Math.PI) / 60;
      const secondsPerRev = 60 / rpm;

      const rpmOut = formatNumberTwoDecimals(rpm);
      const radOut = formatNumberTwoDecimals(radPerSec);
      const circOut = formatNumberTwoDecimals(circumferenceMeters);
      const secOut = formatNumberTwoDecimals(secondsPerRev);

      const resultHtml =
        `<p><strong>RPM:</strong> ${rpmOut}</p>` +
        `<p><strong>Angular speed:</strong> ${radOut} rad/s</p>` +
        `<p><strong>Circumference used:</strong> ${circOut} m</p>` +
        `<p><strong>Time per revolution:</strong> ${secOut} s/rev</p>` +
        `<p>At the entered surface speed, the part completes one full turn every <strong>${secOut}</strong> seconds.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "RPM Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
