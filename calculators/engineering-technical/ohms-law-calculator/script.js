document.addEventListener("DOMContentLoaded", function () {
  const modeSelect = document.getElementById("modeSelect");

  const voltageInputs = document.getElementById("voltageInputs");
  const currentInputs = document.getElementById("currentInputs");
  const resistanceInputs = document.getElementById("resistanceInputs");

  const currentInputForV = document.getElementById("currentInputForV");
  const resistanceInputForV = document.getElementById("resistanceInputForV");

  const voltageInputForI = document.getElementById("voltageInputForI");
  const resistanceInputForI = document.getElementById("resistanceInputForI");

  const voltageInputForR = document.getElementById("voltageInputForR");
  const currentInputForR = document.getElementById("currentInputForR");

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(currentInputForV);
  attachLiveFormatting(resistanceInputForV);
  attachLiveFormatting(voltageInputForI);
  attachLiveFormatting(resistanceInputForI);
  attachLiveFormatting(voltageInputForR);
  attachLiveFormatting(currentInputForR);

  function setResultError(message) {
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(html) {
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function showMode(mode) {
    voltageInputs.classList.add("hidden");
    currentInputs.classList.add("hidden");
    resistanceInputs.classList.add("hidden");

    if (mode === "voltage") voltageInputs.classList.remove("hidden");
    if (mode === "current") currentInputs.classList.remove("hidden");
    if (mode === "resistance") resistanceInputs.classList.remove("hidden");

    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
  }

  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "voltage";

      if (mode === "voltage") {
        const i = toNumber(currentInputForV.value);
        const r = toNumber(resistanceInputForV.value);

        if (!validatePositive(i, "current (A)")) return;
        if (!validatePositive(r, "resistance (Ω)")) return;

        const v = i * r;

        setResultSuccess(
          "<div><strong>Voltage (V):</strong> " + formatNumberTwoDecimals(v) + " V</div>" +
          "<div>Formula: V = I × R</div>" +
          "<div>Calculation: " + formatNumberTwoDecimals(i) + " A × " + formatNumberTwoDecimals(r) + " Ω</div>"
        );
        return;
      }

      if (mode === "current") {
        const v = toNumber(voltageInputForI.value);
        const r = toNumber(resistanceInputForI.value);

        if (!validatePositive(v, "voltage (V)")) return;
        if (!validatePositive(r, "resistance (Ω)")) return;

        const i = v / r;

        setResultSuccess(
          "<div><strong>Current (I):</strong> " + formatNumberTwoDecimals(i) + " A</div>" +
          "<div>Formula: I = V ÷ R</div>" +
          "<div>Calculation: " + formatNumberTwoDecimals(v) + " V ÷ " + formatNumberTwoDecimals(r) + " Ω</div>"
        );
        return;
      }

      if (mode === "resistance") {
        const v = toNumber(voltageInputForR.value);
        const i = toNumber(currentInputForR.value);

        if (!validatePositive(v, "voltage (V)")) return;
        if (!validatePositive(i, "current (A)")) return;

        const r = v / i;

        setResultSuccess(
          "<div><strong>Resistance (R):</strong> " + formatNumberTwoDecimals(r) + " Ω</div>" +
          "<div>Formula: R = V ÷ I</div>" +
          "<div>Calculation: " + formatNumberTwoDecimals(v) + " V ÷ " + formatNumberTwoDecimals(i) + " A</div>"
        );
        return;
      }

      setResultError("Select what you want to calculate and try again.");
    });
  }

  const shareButton = document.getElementById("shareWhatsAppButton");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Ohm’s Law Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
