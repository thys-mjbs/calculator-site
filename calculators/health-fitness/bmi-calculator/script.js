document.addEventListener("DOMContentLoaded", function () {
  const unitSystemSelect = document.getElementById("unitSystem");
  const metricInputs = document.getElementById("metricInputs");
  const imperialInputs = document.getElementById("imperialInputs");

  const weightKgInput = document.getElementById("weightKg");
  const heightCmInput = document.getElementById("heightCm");

  const weightLbInput = document.getElementById("weightLb");
  const heightFtInput = document.getElementById("heightFt");
  const heightInInput = document.getElementById("heightIn");

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  // Attach formatting where it makes sense (weights and height in cm)
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(heightCmInput);
  attachLiveFormatting(weightLbInput);
  attachLiveFormatting(heightFtInput);
  attachLiveFormatting(heightInInput);

  function showMetric() {
    if (metricInputs) metricInputs.style.display = "block";
    if (imperialInputs) imperialInputs.style.display = "none";
  }

  function showImperial() {
    if (metricInputs) metricInputs.style.display = "none";
    if (imperialInputs) imperialInputs.style.display = "block";
  }

  if (unitSystemSelect) {
    unitSystemSelect.addEventListener("change", function () {
      if (unitSystemSelect.value === "imperial") {
        showImperial();
      } else {
        showMetric();
      }
      // Clear previous result on system change
      if (resultDiv) {
        resultDiv.textContent = "";
        resultDiv.classList.remove("error", "success");
      }
    });
  }

  // Default to metric view
  showMetric();

  function classifyBmi(bmi) {
    if (bmi < 18.5) {
      return "Underweight";
    } else if (bmi < 25) {
      return "Normal weight";
    } else if (bmi < 30) {
      return "Overweight";
    } else {
      return "Obesity";
    }
  }

  function formatRange(minVal, maxVal) {
    const minStr = formatNumberTwoDecimals(minVal);
    const maxStr = formatNumberTwoDecimals(maxVal);
    return minStr + " - " + maxStr;
  }

  if (calculateButton && resultDiv) {
    calculateButton.addEventListener("click", function () {
      resultDiv.classList.remove("error", "success");

      const unitSystem = unitSystemSelect ? unitSystemSelect.value : "metric";

      let bmi;
      let category;
      let healthyRangeText = "";

      if (unitSystem === "imperial") {
        const weightLb = toNumber(weightLbInput ? weightLbInput.value : "");
        const heightFt = toNumber(heightFtInput ? heightFtInput.value : "");
        const heightIn = toNumber(heightInInput ? heightInInput.value : "");

        if (
          !weightLb ||
          weightLb <= 0 ||
          (!heightFt && !heightIn) ||
          heightFt < 0 ||
          heightIn < 0
        ) {
          resultDiv.textContent =
            "Please enter a valid weight and height in imperial units.";
          resultDiv.classList.add("error");
          return;
        }

        const totalInches = heightFt * 12 + heightIn;
        if (totalInches <= 0) {
          resultDiv.textContent =
            "Height must be greater than zero. Check your feet and inches.";
          resultDiv.classList.add("error");
          return;
        }

        bmi = (703 * weightLb) / (totalInches * totalInches);
        category = classifyBmi(bmi);

        // Healthy weight range for this height (in pounds)
        const minWeightLb = (18.5 * totalInches * totalInches) / 703;
        const maxWeightLb = (24.9 * totalInches * totalInches) / 703;

        const minWeightKg = minWeightLb / 2.20462;
        const maxWeightKg = maxWeightLb / 2.20462;

        const rangeLb = formatRange(minWeightLb, maxWeightLb);
        const rangeKg = formatRange(minWeightKg, maxWeightKg);

        const bmiStr = formatNumberTwoDecimals(bmi);

        healthyRangeText =
          "<p>For your height, a typical healthy weight range is:</p>" +
          "<ul>" +
          "<li>" +
          rangeKg +
          " kg</li>" +
          "<li>" +
          rangeLb +
          " lb</li>" +
          "</ul>" +
          "<p>Use this as a general guide only. Always speak to a health professional for personalised advice.</p>";

        resultDiv.innerHTML =
          "<p>Your BMI is <strong>" +
          bmiStr +
          "</strong>.</p>" +
          "<p>This falls into the category: <strong>" +
          category +
          "</strong>.</p>" +
          healthyRangeText;

        resultDiv.classList.add("success");
      } else {
        const weightKg = toNumber(weightKgInput ? weightKgInput.value : "");
        const heightCm = toNumber(heightCmInput ? heightCmInput.value : "");

        if (!weightKg || weightKg <= 0 || !heightCm || heightCm <= 0) {
          resultDiv.textContent =
            "Please enter a valid weight in kilograms and height in centimeters.";
          resultDiv.classList.add("error");
          return;
        }

        const heightM = heightCm / 100;
        bmi = weightKg / (heightM * heightM);
        category = classifyBmi(bmi);

        const minWeightKg = 18.5 * heightM * heightM;
        const maxWeightKg = 24.9 * heightM * heightM;

        const bmiStr = formatNumberTwoDecimals(bmi);
        const rangeKg = formatRange(minWeightKg, maxWeightKg);

        healthyRangeText =
          "<p>For your height, a typical healthy weight range is about:</p>" +
          "<p><strong>" +
          rangeKg +
          " kg</strong></p>" +
          "<p>Use this as a general guide only. Always speak to a health professional for personalised advice.</p>";

        resultDiv.innerHTML =
          "<p>Your BMI is <strong>" +
          bmiStr +
          "</strong>.</p>" +
          "<p>This falls into the category: <strong>" +
          category +
          "</strong>.</p>" +
          healthyRangeText;

        resultDiv.classList.add("success");
      }
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "BMI Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
