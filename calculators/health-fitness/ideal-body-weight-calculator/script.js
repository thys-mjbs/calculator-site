document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const sexSelect = document.getElementById("sexSelect");
  const unitSelect = document.getElementById("unitSelect");
  const heightCm = document.getElementById("heightCm");
  const heightFt = document.getElementById("heightFt");
  const heightIn = document.getElementById("heightIn");
  const formulaSelect = document.getElementById("formulaSelect");
  const showAllFormulas = document.getElementById("showAllFormulas");

  const heightBlockCm = document.getElementById("heightBlockCm");
  const heightBlockFtIn = document.getElementById("heightBlockFtIn");
  const heightUnitHint = document.getElementById("heightUnitHint");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(heightCm);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS
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
  // 4) UNIT MODE HANDLING (ROBUST)
  // ------------------------------------------------------------
  function showUnitMode(mode) {
    if (heightBlockCm) heightBlockCm.classList.add("hidden");
    if (heightBlockFtIn) heightBlockFtIn.classList.add("hidden");

    if (mode === "ftin") {
      if (heightBlockFtIn) heightBlockFtIn.classList.remove("hidden");
      if (heightUnitHint) heightUnitHint.textContent = "Enter your height in feet and inches.";
    } else {
      if (heightBlockCm) heightBlockCm.classList.remove("hidden");
      if (heightUnitHint) heightUnitHint.textContent = "Enter your height in centimeters.";
    }

    clearResult();
  }

  if (unitSelect) {
    showUnitMode(unitSelect.value);
    unitSelect.addEventListener("change", function () {
      showUnitMode(unitSelect.value);
    });
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS
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
  // 6) CALC HELPERS
  // ------------------------------------------------------------
  function inchesFromInputs(mode) {
    if (mode === "cm") {
      const cm = toNumber(heightCm ? heightCm.value : "");
      if (!validatePositive(cm, "height")) return null;

      if (cm < 120 || cm > 230) {
        setResultError("Enter a realistic height between 120 cm and 230 cm.");
        return null;
      }

      return cm / 2.54;
    }

    const ft = toNumber(heightFt ? heightFt.value : "");
    const inch = toNumber(heightIn ? heightIn.value : "");

    if (!validatePositive(ft, "height in feet")) return null;
    if (!validateNonNegative(inch, "inches")) return null;

    if (inch >= 12) {
      setResultError("Inches should be between 0 and 11.");
      return null;
    }

    const totalIn = ft * 12 + inch;

    if (totalIn < 47 || totalIn > 91) {
      setResultError("Enter a realistic height between 3 ft 11 in and 7 ft 7 in.");
      return null;
    }

    return totalIn;
  }

  function ibwKg(formula, sex, inches) {
    const over = inches - 60;

    if (formula === "devine") {
      const base = sex === "male" ? 50 : 45.5;
      return base + 2.3 * over;
    }

    if (formula === "robinson") {
      const base = sex === "male" ? 52 : 49;
      const per = sex === "male" ? 1.9 : 1.7;
      return base + per * over;
    }

    if (formula === "miller") {
      const base = sex === "male" ? 56.2 : 53.1;
      const per = sex === "male" ? 1.41 : 1.36;
      return base + per * over;
    }

    // hamwi
    {
      const base = sex === "male" ? 48 : 45.5;
      const per = sex === "male" ? 2.7 : 2.2;
      return base + per * over;
    }
  }

  function kgToLb(kg) {
    return kg * 2.2046226218;
  }

  function fmtKgLb(kg) {
    return (
      formatNumberTwoDecimals(kg) +
      " kg (" +
      formatNumberTwoDecimals(kgToLb(kg)) +
      " lb)"
    );
  }

  function bmiRangeKg(heightMeters) {
    const bmiMin = 18.5;
    const bmiMax = 24.9;
    const minKg = bmiMin * heightMeters * heightMeters;
    const maxKg = bmiMax * heightMeters * heightMeters;
    return { minKg: minKg, maxKg: maxKg };
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (!sexSelect || !unitSelect || !formulaSelect) return;

      const mode = unitSelect.value === "ftin" ? "ftin" : "cm";
      const inches = inchesFromInputs(mode);
      if (inches === null) return;

      const sex = sexSelect.value === "female" ? "female" : "male";
      const selectedFormula = formulaSelect.value;

      const cm = inches * 2.54;
      const m = cm / 100;

      const selectedKg = ibwKg(selectedFormula, sex, inches);
      if (!Number.isFinite(selectedKg) || selectedKg <= 0) {
        setResultError("That combination of inputs produced an invalid result. Double-check your height.");
        return;
      }

      const formulaNames = {
        devine: "Devine",
        robinson: "Robinson",
        miller: "Miller",
        hamwi: "Hamwi"
      };

      const bmi = bmiRangeKg(m);

      const showAll = !!(showAllFormulas && showAllFormulas.checked);
      let comparisonHtml = "";

      if (showAll) {
        const allFormulas = ["devine", "robinson", "miller", "hamwi"];
        const rows = allFormulas
          .map(function (f) {
            const kg = ibwKg(f, sex, inches);
            return (
              "<tr>" +
                "<td><strong>" + formulaNames[f] + "</strong></td>" +
                "<td>" + fmtKgLb(kg) + "</td>" +
              "</tr>"
            );
          })
          .join("");

        comparisonHtml =
          "<p><strong>Formula comparison:</strong></p>" +
          "<div style=\"overflow-x:auto;\">" +
            "<table style=\"width:100%; border-collapse:collapse;\">" +
              "<tbody>" + rows + "</tbody>" +
            "</table>" +
          "</div>";
      }

      const resultHtml =
        "<p><strong>Ideal body weight (" + formulaNames[selectedFormula] + "):</strong> " + fmtKgLb(selectedKg) + "</p>" +
        "<p><strong>Healthy BMI weight range (BMI 18.5 to 24.9):</strong> " +
          formatNumberTwoDecimals(bmi.minKg) + " kg (" + formatNumberTwoDecimals(kgToLb(bmi.minKg)) + " lb)" +
          " to " +
          formatNumberTwoDecimals(bmi.maxKg) + " kg (" + formatNumberTwoDecimals(kgToLb(bmi.maxKg)) + " lb)" +
        "</p>" +
        "<p><strong>What this means:</strong> Treat IBW as a reference estimate, not a strict goal. Use the BMI range as a practical corridor for context.</p>" +
        comparisonHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Ideal Body Weight Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
