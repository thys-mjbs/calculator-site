document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const fuelValue = document.getElementById("fuelValue");
  const fromUnit = document.getElementById("fromUnit");
  const mpgType = document.getElementById("mpgType");
  const mpgTypeRow = document.getElementById("mpgTypeRow");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = fromUnit;

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
  attachLiveFormatting(fuelValue);

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
    if (mpgTypeRow) mpgTypeRow.classList.add("hidden");
    if (mode === "mpg" && mpgTypeRow) mpgTypeRow.classList.remove("hidden");
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
      const mode = modeSelect ? modeSelect.value : "l100";

      if (!fuelValue || !fromUnit) return;

      const valueRaw = toNumber(fuelValue.value);

      if (!validatePositive(valueRaw, "fuel consumption value")) return;

      // Constants
      const MPG_US_PER_KML = 2.35214583;
      const MPG_IMP_PER_KML = 2.82480936;
      const L100_PER_MPG_US = 235.214583;
      const L100_PER_MPG_IMP = 282.480936;

      let l100 = 0;
      let kml = 0;
      let mpgUs = 0;
      let mpgImp = 0;

      if (mode === "l100") {
        l100 = valueRaw;
        kml = 100 / l100;
        mpgUs = L100_PER_MPG_US / l100;
        mpgImp = L100_PER_MPG_IMP / l100;
      } else if (mode === "kml") {
        kml = valueRaw;
        l100 = 100 / kml;
        mpgUs = kml * MPG_US_PER_KML;
        mpgImp = kml * MPG_IMP_PER_KML;
      } else if (mode === "mpg") {
        const mpgTypeValue = mpgType ? mpgType.value : "us";
        const mpgIn = valueRaw;

        if (mpgTypeValue === "imp") {
          mpgImp = mpgIn;
          l100 = L100_PER_MPG_IMP / mpgImp;
          kml = 100 / l100;
          mpgUs = kml * MPG_US_PER_KML;
        } else {
          mpgUs = mpgIn;
          l100 = L100_PER_MPG_US / mpgUs;
          kml = 100 / l100;
          mpgImp = kml * MPG_IMP_PER_KML;
        }
      } else {
        setResultError("Choose a valid input unit.");
        return;
      }

      if (!Number.isFinite(l100) || !Number.isFinite(kml) || !Number.isFinite(mpgUs) || !Number.isFinite(mpgImp)) {
        setResultError("Something went wrong. Check your input and try again.");
        return;
      }

      const l100Str = formatNumberTwoDecimals(l100);
      const kmlStr = formatNumberTwoDecimals(kml);
      const mpgUsStr = formatNumberTwoDecimals(mpgUs);
      const mpgImpStr = formatNumberTwoDecimals(mpgImp);

      const directionNote =
        "<p><strong>How to read these:</strong> Lower L/100km is better. Higher km/L and MPG are better.</p>";

      const resultHtml =
        "<p><strong>L/100km:</strong> " + l100Str + "</p>" +
        "<p><strong>km/L:</strong> " + kmlStr + "</p>" +
        "<p><strong>MPG (US):</strong> " + mpgUsStr + "</p>" +
        "<p><strong>MPG (Imperial):</strong> " + mpgImpStr + "</p>" +
        directionNote;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Fuel Consumption Converter (L/100km, km/L, MPG) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
