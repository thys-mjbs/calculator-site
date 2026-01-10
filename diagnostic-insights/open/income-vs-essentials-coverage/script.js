// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const incomeNumber = document.getElementById("incomeNumber");
  const incomeRange = document.getElementById("incomeRange");

  const housingNumber = document.getElementById("housingNumber");
  const housingRange = document.getElementById("housingRange");

  const utilitiesNumber = document.getElementById("utilitiesNumber");
  const utilitiesRange = document.getElementById("utilitiesRange");

  const groceriesNumber = document.getElementById("groceriesNumber");
  const groceriesRange = document.getElementById("groceriesRange");

  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");

  const debtMinimumsNumber = document.getElementById("debtMinimumsNumber");
  const debtMinimumsRange = document.getElementById("debtMinimumsRange");

  const emailReportPreview = document.getElementById("emailReportPreview");

  // ------------------------------------------------------------
  // 2) HELPERS (PARSING, CLAMPING, FORMATTING)
  // ------------------------------------------------------------
  function parseLooseNumber(value) {
    if (value === null || value === undefined) return NaN;
    const s = String(value).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return NaN;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function formatWithCommas(value) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round(value);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatRatio(value) {
    if (!Number.isFinite(value)) return "";
    return value.toFixed(2);
  }

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
  // 3) BIND RANGE + NUMBER (BI-DIRECTIONAL SYNC)
  // ------------------------------------------------------------
  function bindRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    const min = parseLooseNumber(rangeEl.min);
    const max = parseLooseNumber(rangeEl.max);

    function syncFromRange() {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      numberEl.value = formatWithCommas(v);
    }

    function syncFromNumber(strictCommit) {
      const raw = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(raw)) {
        if (strictCommit) {
          numberEl.value = "";
        }
        return;
      }

      const clamped = clamp(raw, min, max);
      if (!Number.isFinite(clamped)) return;

      rangeEl.value = String(clamped);
      numberEl.value = formatWithCommas(clamped);
    }

    rangeEl.addEventListener("input", function () {
      syncFromRange();
    });

    numberEl.addEventListener("input", function () {
      const raw = String(numberEl.value);
      const cleaned = raw.replace(/[^\d,]/g, "");
      if (cleaned !== raw) numberEl.value = cleaned;
    });

    numberEl.addEventListener("blur", function () {
      syncFromNumber(true);
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        syncFromNumber(true);
      }
    });

    if (rangeEl.value !== "") syncFromRange();
  }

  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(groceriesRange, groceriesNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtMinimumsRange, debtMinimumsNumber);

  // ------------------------------------------------------------
  // 4) VALIDATION
  // ------------------------------------------------------------
  function validatePositive(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, label) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function setPreviewText(text) {
    if (!emailReportPreview) return;
    emailReportPreview.textContent = text;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!incomeNumber || !housingNumber || !utilitiesNumber || !groceriesNumber || !transportNumber || !debtMinimumsNumber) {
        return;
      }

      const income = parseLooseNumber(incomeNumber.value);
      const housing = parseLooseNumber(housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber.value);
      const groceries = parseLooseNumber(groceriesNumber.value);
      const transport = parseLooseNumber(transportNumber.value);
      const debtMinimums = parseLooseNumber(debtMinimumsNumber.value);

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(groceries, "groceries")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debtMinimums, "debt minimums")) return;

      const essentialsTotal = housing + utilities + groceries + transport + debtMinimums;

      if (!Number.isFinite(essentialsTotal) || essentialsTotal <= 0) {
        setResultError("Enter essential expenses that total greater than 0.");
        return;
      }

      const ratio = income / essentialsTotal;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Inputs produced an invalid result. Check your numbers and try again.");
        return;
      }

      let classification = "Borderline";
      let interpretation = "Your income covers essentials, but the margin is thin and normal variance can create pressure.";
      let action1 = "Reduce the largest essential driver by a small fixed amount.";
      let action2 = "Increase reliable income or cut a fixed obligation to build buffer.";

      if (ratio < 1.0) {
        classification = "Underprepared";
        interpretation = "Your essentials exceed your income, so the baseline system cannot hold without a structural change.";
        action1 = "Target the biggest essential driver first and reduce it.";
        action2 = "Restructure minimum payments or raise reliable income to restore coverage.";
      } else if (ratio >= 1.2) {
        classification = "Stable";
        interpretation = "Your income comfortably covers essentials, giving you buffer for normal variability.";
        action1 = "Protect your buffer by keeping fixed costs from creeping up.";
        action2 = "Allocate the surplus deliberately so it does not disappear by default.";
      }

      const deltas = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Groceries", value: groceries },
        { label: "Transport", value: transport },
        { label: "Debt minimums", value: debtMinimums }
      ].sort(function (a, b) {
        return b.value - a.value;
      });

      const topDrivers = deltas.slice(0, 3).filter(function (d) {
        return Number.isFinite(d.value) && d.value > 0;
      });

      const topDriverLabels = topDrivers.length
        ? topDrivers.map(function (d) { return d.label; }).join(", ")
        : "None identified";

      const targetRatio = ratio < 1.0 ? 1.0 : 1.2;
      let correctionTargetText = "—";

      if (ratio < targetRatio) {
        const neededIncome = essentialsTotal * targetRatio;
        const incomeGap = neededIncome - income;
        const newEssentialsMax = income / targetRatio;
        const essentialsCut = essentialsTotal - newEssentialsMax;

        const incomeGapRounded = Math.max(0, Math.round(incomeGap));
        const essentialsCutRounded = Math.max(0, Math.round(essentialsCut));

        correctionTargetText =
          "Increase income by " + formatWithCommas(incomeGapRounded) +
          " or reduce essentials by " + formatWithCommas(essentialsCutRounded) + ".";
      } else {
        correctionTargetText = "You already meet the next band threshold.";
      }

      const resultHtml =
        '<div class="di-result">' +
          '<div class="di-result-headline"><strong>' + classification + '</strong> (coverage ratio: ' + formatRatio(ratio) + ')</div>' +
          '<div class="di-result-interpretation">' + interpretation + '</div>' +
          '<div class="di-result-actions">' +
            '<div><strong>Action 1:</strong> ' + action1 + '</div>' +
            '<div><strong>Action 2:</strong> ' + action2 + '</div>' +
          '</div>' +
        '</div>';

      setResultSuccess(resultHtml);

      // ------------------------------------------------------------
      // 6) REPORT PREVIEW BINDING (MANDATORY)
      // ------------------------------------------------------------
      const previewText =
        "Income: " + formatWithCommas(income) + "\n" +
        "Essentials total: " + formatWithCommas(essentialsTotal) + "\n" +
        "Coverage ratio: " + formatRatio(ratio) + "\n" +
        "Classification: " + classification.toLowerCase() + "\n\n" +
        "Top drivers: " + topDriverLabels + "\n" +
        "Minimum correction target: " + correctionTargetText;

      setPreviewText(previewText);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Diagnostic - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
