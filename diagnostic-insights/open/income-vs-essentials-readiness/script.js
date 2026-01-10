document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const incomeNumber = document.getElementById("incomeNumber");
  const incomeRange = document.getElementById("incomeRange");

  const housingNumber = document.getElementById("housingNumber");
  const housingRange = document.getElementById("housingRange");

  const utilitiesNumber = document.getElementById("utilitiesNumber");
  const utilitiesRange = document.getElementById("utilitiesRange");

  const foodNumber = document.getElementById("foodNumber");
  const foodRange = document.getElementById("foodRange");

  const transportNumber = document.getElementById("transportNumber");
  const transportRange = document.getElementById("transportRange");

  const debtNumber = document.getElementById("debtNumber");
  const debtRange = document.getElementById("debtRange");

  const reportPreviewText = document.getElementById("reportPreviewText");

  function parseLooseNumber(raw) {
    if (raw === null || raw === undefined) return NaN;
    const s = String(raw).trim();
    if (!s) return NaN;
    const cleaned = s.replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function formatWithCommas(value) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round(value);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  function bindRangeAndNumber(rangeEl, numberEl) {
    if (!rangeEl || !numberEl) return;

    const min = parseLooseNumber(rangeEl.min);
    const max = parseLooseNumber(rangeEl.max);

    function applyToBoth(n) {
      const c = clamp(n, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatWithCommas(c);
    }

    if (!numberEl.value) {
      applyToBoth(parseLooseNumber(rangeEl.value));
    } else {
      const n0 = parseLooseNumber(numberEl.value);
      if (Number.isFinite(n0)) applyToBoth(n0);
      else applyToBoth(parseLooseNumber(rangeEl.value));
    }

    rangeEl.addEventListener("input", function () {
      const n = parseLooseNumber(rangeEl.value);
      applyToBoth(n);
    });

    numberEl.addEventListener("input", function () {
      const n = parseLooseNumber(numberEl.value);
      if (Number.isFinite(n)) {
        numberEl.value = formatWithCommas(n);
      }
    });

    function commitTyped() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        applyToBoth(parseLooseNumber(rangeEl.value));
        return;
      }
      applyToBoth(typed);
    }

    numberEl.addEventListener("blur", commitTyped);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitTyped();
      }
    });
  }

  bindRangeAndNumber(incomeRange, incomeNumber);
  bindRangeAndNumber(housingRange, housingNumber);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber);
  bindRangeAndNumber(foodRange, foodNumber);
  bindRangeAndNumber(transportRange, transportNumber);
  bindRangeAndNumber(debtRange, debtNumber);

  function validateNonNegative(n, label) {
    if (!Number.isFinite(n) || n < 0) {
      setResultError("Enter a valid " + label + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(n, label) {
    if (!Number.isFinite(n) || n <= 0) {
      setResultError("Enter a valid " + label + " greater than 0.");
      return false;
    }
    return true;
  }

  function pickTopDrivers(drivers) {
    const sorted = drivers
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      });
    return sorted.slice(0, 3).map(function (d) {
      return d.label;
    });
  }

  function updateReportPreview(income, essentialsTotal, ratio, classification, topDrivers, correctionTarget) {
    if (!reportPreviewText) return;

    const inc = formatWithCommas(income);
    const ess = formatWithCommas(essentialsTotal);
    const ratioStr = Number.isFinite(ratio) ? ratio.toFixed(2) : "—";
    const drivers = topDrivers && topDrivers.length ? topDrivers : ["—", "—", "—"];
    const d1 = drivers[0] || "—";
    const d2 = drivers[1] || "—";
    const d3 = drivers[2] || "—";
    const corr = Number.isFinite(correctionTarget) ? formatWithCommas(correctionTarget) : "—";

    reportPreviewText.textContent =
      "Summary\n" +
      "- Income: " + (inc || "—") + "\n" +
      "- Essentials total: " + (ess || "—") + "\n" +
      "- Coverage ratio: " + ratioStr + "\n" +
      "- Readiness: " + (classification || "—") + "\n\n" +
      "Top drivers\n" +
      "- " + d1 + "\n" +
      "- " + d2 + "\n" +
      "- " + d3 + "\n\n" +
      "Minimum correction target\n" +
      "- " + (corr || "—") + "\n\n" +
      "Next steps\n" +
      "- Lock in essentials total\n" +
      "- Reduce the biggest driver\n";
  }

  function computeCorrectionTarget(income, essentialsTotal, targetRatio) {
    if (!Number.isFinite(income) || !Number.isFinite(essentialsTotal) || essentialsTotal <= 0) return NaN;
    if (!Number.isFinite(targetRatio) || targetRatio <= 0) return NaN;

    const requiredIncome = essentialsTotal * targetRatio;
    if (income >= requiredIncome) return 0;

    return requiredIncome - income;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (
        !incomeNumber || !incomeRange ||
        !housingNumber || !housingRange ||
        !utilitiesNumber || !utilitiesRange ||
        !foodNumber || !foodRange ||
        !transportNumber || !transportRange ||
        !debtNumber || !debtRange
      ) {
        return;
      }

      const income = parseLooseNumber(incomeNumber.value);
      const housing = parseLooseNumber(housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber.value);
      const food = parseLooseNumber(foodNumber.value);
      const transport = parseLooseNumber(transportNumber.value);
      const debt = parseLooseNumber(debtNumber.value);

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "minimum debt payments")) return;

      const essentialsTotal = housing + utilities + food + transport + debt;
      if (!Number.isFinite(essentialsTotal) || essentialsTotal <= 0) {
        setResultError("Essentials total must be greater than 0.");
        return;
      }

      const ratio = income / essentialsTotal;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Unable to compute a valid coverage ratio from these values.");
        return;
      }

      let classification = "";
      let interpretation = "";
      let targetRatio = 1.25;

      if (ratio < 1.05) {
        classification = "Underprepared";
        interpretation = "Your essentials are crowding out your income. You have little or no margin for normal monthly variation.";
        targetRatio = 1.25;
      } else if (ratio < 1.25) {
        classification = "Borderline";
        interpretation = "You cover essentials, but the margin is thin. Normal variation can push you into catch-up mode.";
        targetRatio = 1.25;
      } else {
        classification = "Stable";
        interpretation = "Your income covers essentials with a meaningful margin. The base layer is structurally healthier.";
        targetRatio = 1.25;
      }

      const drivers = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food", value: food },
        { label: "Transport", value: transport },
        { label: "Minimum debt payments", value: debt }
      ];

      const topDrivers = pickTopDrivers(drivers);

      const correctionTarget = computeCorrectionTarget(income, essentialsTotal, targetRatio);

      let action1 = "";
      let action2 = "";

      if (classification === "Underprepared") {
        action1 = "Cut the biggest driver first: " + (topDrivers[0] || "one major essential") + ".";
        action2 = "Set a correction target and close it: increase income or reduce essentials by at least " + formatWithCommas(correctionTarget) + " per month to reach stable coverage.";
      } else if (classification === "Borderline") {
        action1 = "Protect margin: stop adding new commitments until you move into stable coverage.";
        action2 = "Improve the ratio by targeting " + (topDrivers[0] || "your biggest essential") + " and aim to free up " + formatWithCommas(correctionTarget) + " per month to reach stable coverage.";
      } else {
        action1 = "Keep essentials stable while you build reserves so variation does not break the base layer.";
        action2 = "If you take on a new commitment, recheck that your ratio remains stable after the change.";
      }

      const resultHtml =
        "<p><strong>Readiness:</strong> " + classification + "</p>" +
        "<p><strong>Coverage ratio:</strong> " + ratio.toFixed(2) + " (income ÷ essentials)</p>" +
        "<p>" + interpretation + "</p>" +
        "<p><strong>Two immediate actions:</strong></p>" +
        "<ul>" +
          "<li>" + action1 + "</li>" +
          "<li>" + action2 + "</li>" +
        "</ul>";

      setResultSuccess(resultHtml);

      updateReportPreview(income, essentialsTotal, ratio, classification.toLowerCase(), topDrivers, correctionTarget);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Check - check this diagnostic: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
