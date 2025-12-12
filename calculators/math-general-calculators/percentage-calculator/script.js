document.addEventListener("DOMContentLoaded", function () {
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  const inputA = document.getElementById("inputA");
  const inputB = document.getElementById("inputB");
  const labelInputA = document.getElementById("label-input-a");
  const labelInputB = document.getElementById("label-input-b");
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  let recalcTimer = null;

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  attachLiveFormatting(inputA);
  attachLiveFormatting(inputB);

  function getSelectedMode() {
    let value = "percent-of";
    modeInputs.forEach(function (radio) {
      if (radio.checked) value = radio.value;
    });
    return value;
  }

  function clearResult() {
    resultDiv.textContent = "";
    resultDiv.className = "";
  }

  function showHint(message) {
    resultDiv.textContent = message;
    resultDiv.className = "";
  }

  function showError(message) {
    resultDiv.textContent = message;
    resultDiv.className = "error";
  }

  function showSuccess(html) {
    resultDiv.innerHTML = html;
    resultDiv.className = "success";
  }

  function updateLabelsForMode() {
    const mode = getSelectedMode();

    if (mode === "percent-of") {
      labelInputA.textContent = "Percentage (X%)";
      labelInputB.textContent = "Base value (Y)";
      inputA.placeholder = "e.g. 15";
      inputB.placeholder = "e.g. 250";
    } else if (mode === "what-percent") {
      labelInputA.textContent = "Part value (X)";
      labelInputB.textContent = "Whole value (Y)";
      inputA.placeholder = "e.g. 45";
      inputB.placeholder = "e.g. 120";
    } else if (mode === "percent-change") {
      labelInputA.textContent = "Original value (X)";
      labelInputB.textContent = "New value (Y)";
      inputA.placeholder = "e.g. 500";
      inputB.placeholder = "e.g. 650";
    }

    scheduleRecalc();
  }

  function hasAnyInput() {
    const a = (inputA.value || "").trim();
    const b = (inputB.value || "").trim();
    return a.length > 0 || b.length > 0;
  }

  function attemptCalculate(isAuto) {
    const mode = getSelectedMode();
    const rawA = (inputA.value || "").trim();
    const rawB = (inputB.value || "").trim();

    if (!rawA && !rawB) {
      clearResult();
      return;
    }

    if (!rawA || !rawB) {
      showHint("Enter values in both fields to see the result.");
      return;
    }

    const valueA = toNumber(rawA);
    const valueB = toNumber(rawB);

    if (isNaN(valueA) || isNaN(valueB)) {
      showError("Please enter valid numeric values in both fields.");
      return;
    }

    if (mode === "percent-of") {
      const result = (valueA / 100) * valueB;
      const formatted = formatNumberTwoDecimals(result);
      const percentText = formatNumberTwoDecimals(valueA);
      const baseText = formatNumberTwoDecimals(valueB);

      showSuccess(
        "<strong>" + percentText + "% of " + baseText + " = " + formatted + "</strong>"
      );
      return;
    }

    if (mode === "what-percent") {
      if (valueB === 0) {
        showError("The whole value (Y) cannot be zero for this calculation.");
        return;
      }

      const result = (valueA / valueB) * 100;
      const formatted = formatNumberTwoDecimals(result);
      const partText = formatNumberTwoDecimals(valueA);
      const wholeText = formatNumberTwoDecimals(valueB);

      showSuccess(
        "<strong>" + partText + " is " + formatted + "% of " + wholeText + "</strong>"
      );
      return;
    }

    if (mode === "percent-change") {
      if (valueA === 0) {
        showError("The original value (X) cannot be zero for percent change.");
        return;
      }

      const diff = valueB - valueA;
      const pct = (diff / valueA) * 100;

      const originalText = formatNumberTwoDecimals(valueA);
      const newText = formatNumberTwoDecimals(valueB);

      if (pct === 0) {
        showSuccess(
          "<strong>There is no percentage change between " + originalText + " and " + newText + ".</strong>"
        );
        return;
      }

      const direction = pct > 0 ? "increase" : "decrease";
      const formatted = formatNumberTwoDecimals(Math.abs(pct));

      showSuccess(
        "<strong>The change from " + originalText + " to " + newText + " is a " + formatted + "% " + direction + ".</strong>"
      );
      return;
    }

    if (!isAuto) {
      showError("Please select a calculation type.");
    }
  }

  function scheduleRecalc() {
    if (recalcTimer) {
      clearTimeout(recalcTimer);
    }
    recalcTimer = setTimeout(function () {
      attemptCalculate(true);
    }, 200);
  }

  modeInputs.forEach(function (radio) {
    radio.addEventListener("change", updateLabelsForMode);
  });

  if (inputA) {
    inputA.addEventListener("input", scheduleRecalc);
    inputA.addEventListener("blur", function () {
      attemptCalculate(true);
    });
  }

  if (inputB) {
    inputB.addEventListener("input", scheduleRecalc);
    inputB.addEventListener("blur", function () {
      attemptCalculate(true);
    });
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      attemptCalculate(false);
    });
  }

  updateLabelsForMode();

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Percentage Calculator – check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
