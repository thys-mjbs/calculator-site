document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");

  const run1 = document.getElementById("run1");
  const run2 = document.getElementById("run2");
  const run3 = document.getElementById("run3");
  const run4 = document.getElementById("run4");
  const run5 = document.getElementById("run5");
  const run6 = document.getElementById("run6");
  const run7 = document.getElementById("run7");
  const run8 = document.getElementById("run8");

  const wastePercentInput = document.getElementById("wastePercent");
  const sectionLengthInput = document.getElementById("sectionLength");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(run1);
  attachLiveFormatting(run2);
  attachLiveFormatting(run3);
  attachLiveFormatting(run4);
  attachLiveFormatting(run5);
  attachLiveFormatting(run6);
  attachLiveFormatting(run7);
  attachLiveFormatting(run8);
  attachLiveFormatting(wastePercentInput);
  attachLiveFormatting(sectionLengthInput);

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
    clearResult();
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

  function safeToNumber(inputEl) {
    if (!inputEl) return 0;
    const raw = (inputEl.value || "").trim();
    if (raw === "") return 0;
    const n = toNumber(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const unit = unitSelect ? unitSelect.value : "m";
      const unitLabel = unit === "ft" ? "ft" : "m";

      const runs = [
        safeToNumber(run1),
        safeToNumber(run2),
        safeToNumber(run3),
        safeToNumber(run4),
        safeToNumber(run5),
        safeToNumber(run6),
        safeToNumber(run7),
        safeToNumber(run8),
      ];

      // Validate run inputs: allow blanks as 0, but reject invalid or negative numbers.
      let sum = 0;
      let hasAny = false;

      for (let i = 0; i < runs.length; i++) {
        const v = runs[i];
        if (Number.isNaN(v)) {
          setResultError("Enter a valid number for gutter run " + (i + 1) + ".");
          return;
        }
        if (v < 0) {
          setResultError("Gutter run " + (i + 1) + " must be 0 or higher.");
          return;
        }
        if (v > 0) hasAny = true;
        sum += v;
      }

      if (!hasAny) {
        setResultError("Enter at least one gutter run length greater than 0.");
        return;
      }

      // Waste %: optional, default 5
      let wastePercent = 5;
      if (wastePercentInput) {
        const wpRaw = (wastePercentInput.value || "").trim();
        if (wpRaw !== "") {
          const parsed = toNumber(wpRaw);
          if (!validateNonNegative(parsed, "waste allowance (%)")) return;
          wastePercent = parsed;
        }
      }

      // Section length: optional, default 3 m or 10 ft
      const defaultSectionLength = unit === "ft" ? 10 : 3;
      let sectionLength = defaultSectionLength;

      if (sectionLengthInput) {
        const slRaw = (sectionLengthInput.value || "").trim();
        if (slRaw !== "") {
          const parsed = toNumber(slRaw);
          if (!validatePositive(parsed, "standard section length")) return;
          sectionLength = parsed;
        }
      }

      // Calculation
      const wasteMultiplier = 1 + wastePercent / 100;
      const totalWithWaste = sum * wasteMultiplier;
      const wasteAmount = totalWithWaste - sum;

      const sectionsNeeded = Math.ceil(totalWithWaste / sectionLength);
      const totalPurchased = sectionsNeeded * sectionLength;
      const extraAfterRounding = totalPurchased - totalWithWaste;

      // Cross-unit helper (secondary insight)
      const M_TO_FT = 3.28084;
      const convert = function (value, fromUnit) {
        if (!Number.isFinite(value)) return NaN;
        if (fromUnit === "m") return value * M_TO_FT;
        return value / M_TO_FT;
      };

      const otherUnitLabel = unit === "m" ? "ft" : "m";
      const totalWithWasteOther = convert(totalWithWaste, unit);
      const sectionLengthOther = convert(sectionLength, unit);

      const resultHtml = `
        <p><strong>Total gutter needed (incl. waste):</strong> ${formatNumberTwoDecimals(totalWithWaste)} ${unitLabel}</p>
        <p><strong>Estimated sections to buy:</strong> ${sectionsNeeded} × ${formatNumberTwoDecimals(sectionLength)} ${unitLabel}</p>
        <p><strong>Total length purchased (rounded up):</strong> ${formatNumberTwoDecimals(totalPurchased)} ${unitLabel}</p>
        <hr>
        <p><strong>Base total (no waste):</strong> ${formatNumberTwoDecimals(sum)} ${unitLabel}</p>
        <p><strong>Waste allowance used:</strong> ${formatNumberTwoDecimals(wasteAmount)} ${unitLabel} (${formatNumberTwoDecimals(wastePercent)}%)</p>
        <p><strong>Extra after rounding to full sections:</strong> ${formatNumberTwoDecimals(extraAfterRounding)} ${unitLabel}</p>
        <hr>
        <p><strong>Quick conversion:</strong> ${formatNumberTwoDecimals(totalWithWasteOther)} ${otherUnitLabel} total, section length ${formatNumberTwoDecimals(sectionLengthOther)} ${otherUnitLabel}</p>
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
      const message = "Gutter Length Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
