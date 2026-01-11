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

  const reliabilityNumber = document.getElementById("reliabilityNumber");
  const reliabilityRange = document.getElementById("reliabilityRange");

  const variabilityNumber = document.getElementById("variabilityNumber");
  const variabilityRange = document.getElementById("variabilityRange");

  const commitmentsNumber = document.getElementById("commitmentsNumber");
  const commitmentsRange = document.getElementById("commitmentsRange");

  const bufferMonthsNumber = document.getElementById("bufferMonthsNumber");
  const bufferMonthsRange = document.getElementById("bufferMonthsRange");

  const errorMarginNumber = document.getElementById("errorMarginNumber");
  const errorMarginRange = document.getElementById("errorMarginRange");

  const confidenceNumber = document.getElementById("confidenceNumber");
  const confidenceRange = document.getElementById("confidenceRange");

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

  function formatTwoDecimals(n) {
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
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

  function attachLiveTwoDecimalFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const raw = String(inputEl.value == null ? "" : inputEl.value);
      const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
      inputEl.value = cleaned;
    });
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max, step, defaultValue, decimals) {
    if (!rangeEl || !numberEl) return;

    rangeEl.min = String(min);
    rangeEl.max = String(max);
    rangeEl.step = String(step);

    const start = clamp(defaultValue, min, max);
    rangeEl.value = String(start);

    if (decimals) {
      numberEl.value = formatTwoDecimals(start);
    } else {
      numberEl.value = formatWithCommas(start);
    }

    rangeEl.addEventListener("input", function () {
      const v = parseLooseNumber(rangeEl.value);
      const c = clamp(v, min, max);
      if (decimals) {
        numberEl.value = formatTwoDecimals(c);
      } else {
        numberEl.value = formatWithCommas(c);
      }
    });

    function commitNumberToRange() {
      const typed = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(typed)) {
        const rv = parseLooseNumber(rangeEl.value);
        numberEl.value = decimals ? formatTwoDecimals(rv) : formatWithCommas(rv);
        return;
      }
      const c = clamp(typed, min, max);
      rangeEl.value = String(c);
      numberEl.value = decimals ? formatTwoDecimals(c) : formatWithCommas(c);
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
  attachLiveFormatting(commitmentsNumber);
  attachLiveFormatting(bufferMonthsNumber);
  attachLiveFormatting(errorMarginNumber);
  attachLiveFormatting(confidenceNumber);
  attachLiveTwoDecimalFormatting(reliabilityNumber);
  attachLiveFormatting(variabilityNumber);

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000, 100, 25000, false);
  bindRangeAndNumber(housingRange, housingNumber, 0, 150000, 50, 12000, false);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 75000, 50, 2500, false);
  bindRangeAndNumber(foodRange, foodNumber, 0, 75000, 50, 4500, false);
  bindRangeAndNumber(transportRange, transportNumber, 0, 75000, 50, 3000, false);
  bindRangeAndNumber(debtRange, debtNumber, 0, 150000, 50, 1500, false);

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, 0.5, 1.0, 0.01, 0.85, true);
  bindRangeAndNumber(variabilityRange, variabilityNumber, 0, 40, 1, 10, false);
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, 0, 200000, 50, 0, false);
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, 0, 12, 1, 2, false);
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, 0, 30, 1, 10, false);
  bindRangeAndNumber(confidenceRange, confidenceNumber, 0, 100, 1, 70, false);

  function topDrivers(items) {
    const sorted = items
      .filter(function (x) { return Number.isFinite(x.value) && x.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });
    return sorted.slice(0, 3);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const income = parseLooseNumber(incomeNumber ? incomeNumber.value : "");
      const housing = parseLooseNumber(housingNumber ? housingNumber.value : "");
      const utilities = parseLooseNumber(utilitiesNumber ? utilitiesNumber.value : "");
      const food = parseLooseNumber(foodNumber ? foodNumber.value : "");
      const transport = parseLooseNumber(transportNumber ? transportNumber.value : "");
      const debt = parseLooseNumber(debtNumber ? debtNumber.value : "");

      const reliability = parseLooseNumber(reliabilityNumber ? reliabilityNumber.value : "");
      const variabilityPct = parseLooseNumber(variabilityNumber ? variabilityNumber.value : "");
      const commitments = parseLooseNumber(commitmentsNumber ? commitmentsNumber.value : "");
      const bufferMonths = parseLooseNumber(bufferMonthsNumber ? bufferMonthsNumber.value : "");
      const errorMarginPct = parseLooseNumber(errorMarginNumber ? errorMarginNumber.value : "");
      const confidencePct = parseLooseNumber(confidenceNumber ? confidenceNumber.value : "");

      if (!Number.isFinite(income) || income < 0) return setResultError("Enter a valid monthly net income (0 or higher).");
      if (!Number.isFinite(housing) || housing < 0) return setResultError("Enter a valid housing amount (0 or higher).");
      if (!Number.isFinite(utilities) || utilities < 0) return setResultError("Enter a valid utilities amount (0 or higher).");
      if (!Number.isFinite(food) || food < 0) return setResultError("Enter a valid food amount (0 or higher).");
      if (!Number.isFinite(transport) || transport < 0) return setResultError("Enter a valid transport amount (0 or higher).");
      if (!Number.isFinite(debt) || debt < 0) return setResultError("Enter a valid debt minimum amount (0 or higher).");

      if (!Number.isFinite(reliability) || reliability < 0.5 || reliability > 1.0) return setResultError("Income reliability must be between 0.50 and 1.00.");
      if (!Number.isFinite(variabilityPct) || variabilityPct < 0 || variabilityPct > 40) return setResultError("Income variability must be between 0 and 40.");
      if (!Number.isFinite(commitments) || commitments < 0) return setResultError("Non-negotiable commitments must be 0 or higher.");
      if (!Number.isFinite(bufferMonths) || bufferMonths < 0 || bufferMonths > 12) return setResultError("Target buffer months must be between 0 and 12.");
      if (!Number.isFinite(errorMarginPct) || errorMarginPct < 0 || errorMarginPct > 30) return setResultError("Estimation error margin must be between 0 and 30.");
      if (!Number.isFinite(confidencePct) || confidencePct < 0 || confidencePct > 100) return setResultError("Estimation confidence must be between 0 and 100.");

      const essentialsBase = housing + utilities + food + transport + debt + commitments;
      if (!Number.isFinite(essentialsBase) || essentialsBase <= 0) {
        return setResultError("Essentials total must be greater than 0.");
      }

      const variabilityFactor = 1 - (variabilityPct / 100);
      const effectiveIncome = income * reliability * variabilityFactor;

      const stressedEssentials = essentialsBase * (1 + (errorMarginPct / 100));

      if (!Number.isFinite(effectiveIncome) || effectiveIncome <= 0) {
        return setResultError("Effective income is not valid with these reliability/variability settings.");
      }
      if (!Number.isFinite(stressedEssentials) || stressedEssentials <= 0) {
        return setResultError("Stressed essentials are not valid with these inputs.");
      }

      const coverage = effectiveIncome / stressedEssentials;
      if (!Number.isFinite(coverage) || coverage <= 0) {
        return setResultError("Unable to calculate a valid coverage ratio from these inputs.");
      }

      let status = "Borderline";
      if (coverage < 1.0) status = "Underprepared";
      if (coverage >= 1.25) status = "Stable";

      const margin = effectiveIncome - stressedEssentials;
      const gap = stressedEssentials - effectiveIncome;

      const bufferTargetAmount = stressedEssentials * bufferMonths;
      const monthsToBuffer = margin > 0 ? (bufferTargetAmount / margin) : Infinity;

      const drivers = topDrivers([
        { label: "Housing", value: housing },
        { label: "Debt minimums", value: debt },
        { label: "Transport", value: transport },
        { label: "Food", value: food },
        { label: "Utilities", value: utilities },
        { label: "Commitments", value: commitments }
      ]);

      const coveragePct = Math.round(coverage * 100);
      const confidenceFlag = confidencePct < 60 ? " (low confidence)" : "";

      let interpretation = "";
      if (status === "Underprepared") {
        interpretation = "Effective income does not cover stressed essentials. The baseline is unstable under conservative assumptions.";
      } else if (status === "Borderline") {
        interpretation = "Effective income covers stressed essentials but margin is thin. The baseline is fragile under conservative assumptions.";
      } else {
        interpretation = "Effective income covers stressed essentials with buffer. The baseline is stable under conservative assumptions.";
      }

      let nextMoveA = "";
      let nextMoveB = "";

      if (status === "Underprepared") {
        nextMoveA = "Close the stressed essentials gap first. Small cuts that do not move the gap are noise.";
        nextMoveB = "Attack the largest driver and one reliability lever (income stability or variability control) at the same time.";
      } else if (status === "Borderline") {
        nextMoveA = "Create margin by reducing the largest driver or raising reliable income until coverage improves materially.";
        nextMoveB = "Increase estimate quality (confidence) and re-run. Fragile stability is not stability.";
      } else {
        nextMoveA = "Protect the buffer by preventing essentials creep and keeping reliability high.";
        nextMoveB = "If a buffer target exists, convert margin into buffer systematically before adding new commitments.";
      }

      const driverText = drivers.length
        ? drivers.map(function (d) { return d.label + " (" + formatWithCommas(d.value) + ")"; }).join(", ")
        : "No dominant driver detected.";

      const monthsToBufferText = Number.isFinite(monthsToBuffer)
        ? formatTwoDecimals(monthsToBuffer)
        : "Not achievable while margin is negative";

      const resultHtml =
        '<div class="paid-result">' +
          '<h3>Readiness: ' + status + ' (' + coveragePct + '% coverage)' + confidenceFlag + '</h3>' +
          '<p>' + interpretation + '</p>' +
          '<ul class="paid-metrics">' +
            '<li><strong>Effective income:</strong> ' + formatWithCommas(effectiveIncome) + ' (income × reliability × (1 - variability%))</li>' +
            '<li><strong>Stressed essentials:</strong> ' + formatWithCommas(stressedEssentials) + ' (essentials × (1 + error margin%))</li>' +
            '<li><strong>Monthly margin:</strong> ' + formatWithCommas(margin) + '</li>' +
            '<li><strong>Monthly gap:</strong> ' + formatWithCommas(Math.max(0, gap)) + '</li>' +
            '<li><strong>Buffer target amount:</strong> ' + formatWithCommas(bufferTargetAmount) + ' (' + formatWithCommas(bufferMonths) + ' months)</li>' +
            '<li><strong>Estimated months to buffer target:</strong> ' + monthsToBufferText + '</li>' +
            '<li><strong>Key drivers:</strong> ' + driverText + '</li>' +
          '</ul>' +
          '<p><strong>Immediate actions:</strong></p>' +
          '<ul class="paid-metrics">' +
            '<li>' + nextMoveA + '</li>' +
            '<li>' + nextMoveB + '</li>' +
          '</ul>' +
        '</div>';

      setResultSuccess(resultHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Planner (Pro) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
