document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const inputUnit = document.getElementById("inputUnit");
  const inputValue = document.getElementById("inputValue");
  const mpgTypeGroup = document.getElementById("mpgTypeGroup");
  const mpgType = document.getElementById("mpgType");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = inputUnit;

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(inputValue);

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
    if (mpgTypeGroup) {
      if (mode === "mpg") {
        mpgTypeGroup.classList.remove("hidden");
      } else {
        mpgTypeGroup.classList.add("hidden");
      }
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "kml";

      const rawValue = inputValue ? inputValue.value : "";
      const value = toNumber(rawValue);

      if (!inputUnit || !inputValue) return;

      if (!validatePositive(value, "fuel consumption value")) return;

      // Conversion constants
      // mpgUS = kmL * (0.621371 miles/km) / (0.264172 US gal/L)
      const KM_L_TO_MPG_US = 0.621371 / 0.264172;
      // mpgUK = kmL * (0.621371 miles/km) / (0.219969 UK gal/L)
      const KM_L_TO_MPG_UK = 0.621371 / 0.219969;

      let kmL = 0;

      if (mode === "kml") {
        kmL = value;
      } else if (mode === "lper100") {
        // L/100km = 100 / (km/L)
        kmL = 100 / value;
      } else if (mode === "mpg") {
        const mpgIsUk = mpgType && mpgType.value === "uk";
        if (mpgIsUk) {
          kmL = value / KM_L_TO_MPG_UK;
        } else {
          kmL = value / KM_L_TO_MPG_US;
        }
      } else {
        setResultError("Select a valid input unit.");
        return;
      }

      if (!Number.isFinite(kmL) || kmL <= 0) {
        setResultError("Enter a valid fuel consumption value greater than 0.");
        return;
      }

      const lPer100 = 100 / kmL;
      const mpgUS = kmL * KM_L_TO_MPG_US;
      const mpgUK = kmL * KM_L_TO_MPG_UK;

      if (!Number.isFinite(lPer100) || !Number.isFinite(mpgUS) || !Number.isFinite(mpgUK)) {
        setResultError("Unable to convert this value. Check your input and try again.");
        return;
      }

      const resultHtml =
        `<p><strong>km/L:</strong> ${formatNumberTwoDecimals(kmL)}</p>` +
        `<p><strong>L/100km:</strong> ${formatNumberTwoDecimals(lPer100)}</p>` +
        `<p><strong>MPG (US):</strong> ${formatNumberTwoDecimals(mpgUS)}</p>` +
        `<p><strong>MPG (UK):</strong> ${formatNumberTwoDecimals(mpgUK)}</p>` +
        `<p style="margin-top:8px; font-size:13px; color:#555555;">Note: US MPG and UK MPG use different gallon sizes. Make sure you compare the same MPG type.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Fuel Consumption Calculator (km/L, L/100km, MPG) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
