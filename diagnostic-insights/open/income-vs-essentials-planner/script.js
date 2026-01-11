document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const detailsPanel = document.getElementById("detailsPanel");
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

  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
    if (detailsPanel) detailsPanel.innerHTML = "";
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function parseLooseNumber(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return NaN;
    const cleaned = raw.replace(/,/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return NaN;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return raw === "" ? "" : raw.replace(/[^\d,.-]/g, "");
    return formatWithCommas(n);
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const start = clamp(defaultValue, min, max);
    rangeEl.value = String(start);
    numberEl.value = formatWithCommas(start);

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      const c = clamp(v, min, max);
      numberEl.value = formatWithCommas(c);
    });

    function commitNumberToRange() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        numberEl.value = formatWithCommas(parseLooseNumber(rangeEl.value));
        return;
      }
      const c = clamp(typed, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatWithCommas(c);
    }

    numberEl.addEventListener("blur", commitNumberToRange);
    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumberToRange();
      }
    });
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtNumber);

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 100, 25000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 150000, 50, 12000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 75000, 50, 2500);
  bindRangeAndNumber(foodRange, foodNumber, 0, 75000, 50, 4500);
  bindRangeAndNumber(transportRange, transportNumber, 0, 75000, 50, 3000);
  bindRangeAndNumber(debtRange, debtNumber, 0, 150000, 50, 1500);

  function topDrivers(items) {
    const sorted = items
      .filter(function (x) { return Number.isFinite(x.value) && x.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });
    return sorted.slice(0, 2).map(function (x) { return x.label; });
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");

      if (!Number.isFinite(income) || income < 0) return setResultError("Enter a valid monthly net income (0 or higher).");
      if (!Number.isFinite(housing) || housing < 0) return setResultError("Enter a valid housing amount (0 or higher).");
      if (!Number.isFinite(utilities) || utilities < 0) return setResultError("Enter a valid utilities amount (0 or higher).");
      if (!Number.isFinite(food) || food < 0) return setResultError("Enter a valid food amount (0 or higher).");
      if (!Number.isFinite(transport) || transport < 0) return setResultError("Enter a valid transport amount (0 or higher).");
      if (!Number.isFinite(debt) || debt < 0) return setResultError("Enter a valid debt minimum amount (0 or higher).");

      const essentialsTotal = housing + utilities + food + transport + debt;

      if (!Number.isFinite(essentialsTotal) || essentialsTotal <= 0) {
        return setResultError("Essentials total must be greater than 0.");
      }

      const ratio = income / essentialsTotal;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        return setResultError("Unable to calculate a valid coverage ratio from these inputs.");
      }

      let status = "Borderline";
      if (ratio < 1.0) status = "Underprepared";
      if (ratio >= 1.25) status = "Stable";

      const gap = essentialsTotal - income;
      const margin = income - essentialsTotal;

      const ratioPct = Math.round(ratio * 100);
      const drivers = topDrivers([
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food", value: food },
        { label: "Transport", value: transport },
        { label: "Debt minimums", value: debt }
      ]);

      let interpretation = "";
      if (status === "Underprepared") {
        interpretation = "Income is not covering essentials. The baseline is mathematically unstable without a correction move.";
      } else if (status === "Borderline") {
        interpretation = "Income covers essentials but with limited buffer. Small surprises can break the month.";
      } else {
        interpretation = "Income covers essentials with buffer. The baseline is stable under normal conditions.";
      }

      let action1 = "";
      let action2 = "";

      if (status === "Underprepared") {
        action1 = "Quantify the essentials gap and pick one lever that can close it (income up or essentials down).";
        action2 = "Target the largest essentials driver first and run a 10% scenario to test whether it moves the classification.";
      } else if (status === "Borderline") {
        action1 = "Create margin by reducing the largest essentials driver or increasing income until the ratio improves.";
        action2 = "Set a hard buffer target and treat it as non-negotiable before discretionary spend.";
      } else {
        action1 = "Protect the baseline by keeping essentials growth slower than income growth.";
        action2 = "Use the buffer intentionally: accelerate high-cost debt reduction or build resilience reserves.";
      }

      const headline = "Readiness: " + status + " (" + ratioPct + "% coverage)";
      const html =
        "<p><strong>" + headline + "</strong></p>" +
        "<p>" + interpretation + "</p>" +
        "<p><strong>Immediate actions:</strong></p>" +
        "<ul>" +
          "<li>" + action1 + "</li>" +
          "<li>" + action2 + "</li>" +
        "</ul>";

      setResultSuccess(html);

      if (detailsPanel) {
        const correctionSignal =
          status === "Underprepared"
            ? ("Correction signal: Close the essentials gap of " + formatWithCommas(Math.max(0, gap)) + " per month.")
            : ("Correction signal: Create or protect monthly margin of " + formatWithCommas(Math.max(0, margin)) + ".");

        const driversText = drivers.length ? drivers.join(", ") : "No dominant driver detected (inputs are evenly distributed or zero).";

        detailsPanel.innerHTML =
          "<h3>Assessment summary</h3>" +
          "<div><strong>Outcome:</strong> " + status + "</div>" +
          "<div><strong>Core metric:</strong> Income / Essentials = " + ratio.toFixed(2) + " (" + ratioPct + "%)</div>" +
          "<div><strong>Inputs recap:</strong> Income " + formatWithCommas(income) + " | Essentials " + formatWithCommas(essentialsTotal) + "</div>" +
          "<div><strong>Key drivers:</strong> " + driversText + "</div>" +
          "<div><strong>" + correctionSignal + "</strong></div>";
      }
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
