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

  // ------------------------------------------------------------
  // 2) HELPERS (MANDATORY)
  // ------------------------------------------------------------

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

  function formatTwoDecimals(value) {
    if (!Number.isFinite(value)) return "";
    return value.toFixed(2);
  }

  function formatInputWithCommas(raw) {
    const n = parseLooseNumber(raw);
    if (!Number.isFinite(n)) return String(raw || "");
    const isIntLike = Math.abs(n - Math.round(n)) < 1e-9;
    if (!isIntLike) return String(n);
    return formatWithCommas(n);
  }

  function bindRangeAndNumber(rangeEl, numberEl, options) {
    if (!rangeEl || !numberEl) return;

    const min = parseLooseNumber(rangeEl.min);
    const max = parseLooseNumber(rangeEl.max);
    const step = parseLooseNumber(rangeEl.step);

    const allowDecimals = options && options.allowDecimals === true;

    function formatForNumberInput(n) {
      if (!Number.isFinite(n)) return "";
      if (allowDecimals) {
        const decimals = Number.isFinite(step) && step > 0 ? Math.max(0, (String(step).split(".")[1] || "").length) : 2;
        return n.toFixed(decimals);
      }
      return formatWithCommas(n);
    }

    function applyToBoth(n) {
      const c = clamp(n, min, max);
      rangeEl.value = String(c);
      numberEl.value = formatForNumberInput(c);
    }

    const initial = parseLooseNumber(numberEl.value);
    if (Number.isFinite(initial)) applyToBoth(initial);
    else applyToBoth(parseLooseNumber(rangeEl.value));

    rangeEl.addEventListener("input", function () {
      applyToBoth(parseLooseNumber(rangeEl.value));
    });

    numberEl.addEventListener("input", function () {
      if (!allowDecimals) {
        numberEl.value = formatInputWithCommas(numberEl.value);
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

  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.className = "di-results di-results-error";
    resultDiv.textContent = message;
  }

  function setResultHtml(html) {
    if (!resultDiv) return;
    resultDiv.className = "di-results di-results-ok";
    resultDiv.innerHTML = html;
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // ------------------------------------------------------------
  // 3) BIND INPUTS
  // ------------------------------------------------------------

  bindRangeAndNumber(incomeRange, incomeNumber, { allowDecimals: false });
  bindRangeAndNumber(housingRange, housingNumber, { allowDecimals: false });
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, { allowDecimals: false });
  bindRangeAndNumber(foodRange, foodNumber, { allowDecimals: false });
  bindRangeAndNumber(transportRange, transportNumber, { allowDecimals: false });
  bindRangeAndNumber(debtRange, debtNumber, { allowDecimals: false });

  bindRangeAndNumber(reliabilityRange, reliabilityNumber, { allowDecimals: true });
  bindRangeAndNumber(variabilityRange, variabilityNumber, { allowDecimals: false });
  bindRangeAndNumber(commitmentsRange, commitmentsNumber, { allowDecimals: false });
  bindRangeAndNumber(bufferMonthsRange, bufferMonthsNumber, { allowDecimals: false });
  bindRangeAndNumber(errorMarginRange, errorMarginNumber, { allowDecimals: false });
  bindRangeAndNumber(confidenceRange, confidenceNumber, { allowDecimals: false });

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtNumber);
  attachLiveFormatting(commitmentsNumber);

  // ------------------------------------------------------------
  // 4) CALCULATION
  // ------------------------------------------------------------

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
    return drivers
      .slice()
      .sort(function (a, b) { return b.value - a.value; })
      .filter(function (d) { return Number.isFinite(d.value) && d.value > 0; })
      .slice(0, 3)
      .map(function (d) { return d.label; });
  }

  function computeSafetyLoading(errorMarginPct, confidencePct) {
    const em = clamp(errorMarginPct, 0, 25) / 100;
    const conf = clamp(confidencePct, 50, 100) / 100;
    const uncertaintyFactor = 1 + (1 - conf);
    const loading = em * uncertaintyFactor;
    return clamp(loading, 0, 0.50);
  }

  function computeAdjustedIncome(income, reliability, variabilityPct) {
    const rel = clamp(reliability, 0.50, 1.00);
    const varPct = clamp(variabilityPct, 0, 40) / 100;
    const volatilityPenalty = 1 - varPct;
    return income * rel * volatilityPenalty;
  }

  function classifyCoverage(ratio) {
    if (ratio < 1.05) return "Underprepared";
    if (ratio < 1.25) return "Borderline";
    return "Stable";
  }

  function correctionTargetToStable(adjustedIncome, adjustedEssentials, stableThreshold) {
    const targetIncome = adjustedEssentials * stableThreshold;
    if (adjustedIncome >= targetIncome) return 0;
    return targetIncome - adjustedIncome;
  }

  function bufferTargetAmount(adjustedEssentials, bufferMonths) {
    const m = clamp(bufferMonths, 0, 12);
    return adjustedEssentials * m;
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      if (!resultDiv) return;

      const income = parseLooseNumber(incomeNumber && incomeNumber.value);
      const housing = parseLooseNumber(housingNumber && housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber && utilitiesNumber.value);
      const food = parseLooseNumber(foodNumber && foodNumber.value);
      const transport = parseLooseNumber(transportNumber && transportNumber.value);
      const debt = parseLooseNumber(debtNumber && debtNumber.value);

      const reliability = parseLooseNumber(reliabilityNumber && reliabilityNumber.value);
      const variabilityPct = parseLooseNumber(variabilityNumber && variabilityNumber.value);
      const commitments = parseLooseNumber(commitmentsNumber && commitmentsNumber.value);
      const bufferMonths = parseLooseNumber(bufferMonthsNumber && bufferMonthsNumber.value);
      const errorMarginPct = parseLooseNumber(errorMarginNumber && errorMarginNumber.value);
      const confidencePct = parseLooseNumber(confidenceNumber && confidenceNumber.value);

      if (!validatePositive(income, "monthly income")) return;
      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "minimum debt payments")) return;

      if (!Number.isFinite(reliability) || reliability < 0.50 || reliability > 1.00) {
        setResultError("Income reliability factor must be between 0.50 and 1.00.");
        return;
      }
      if (!validateNonNegative(variabilityPct, "income variability")) return;
      if (variabilityPct > 40) {
        setResultError("Income variability must be between 0 and 40.");
        return;
      }
      if (!validateNonNegative(commitments, "non-negotiable commitments")) return;

      if (!Number.isFinite(bufferMonths) || bufferMonths < 0 || bufferMonths > 12) {
        setResultError("Target buffer months must be between 0 and 12.");
        return;
      }
      if (!validateNonNegative(errorMarginPct, "estimation error margin")) return;
      if (errorMarginPct > 25) {
        setResultError("Estimation error margin must be between 0 and 25.");
        return;
      }
      if (!Number.isFinite(confidencePct) || confidencePct < 50 || confidencePct > 100) {
        setResultError("Estimation confidence must be between 50 and 100.");
        return;
      }

      const essentialsBase = housing + utilities + food + transport + debt + commitments;
      if (!Number.isFinite(essentialsBase) || essentialsBase <= 0) {
        setResultError("Adjusted essentials must be greater than 0.");
        return;
      }

      const safetyLoading = computeSafetyLoading(errorMarginPct, confidencePct);
      const essentialsAdjusted = essentialsBase * (1 + safetyLoading);

      const incomeAdjusted = computeAdjustedIncome(income, reliability, variabilityPct);

      if (!Number.isFinite(incomeAdjusted) || incomeAdjusted <= 0) {
        setResultError("Adjusted income is not valid. Check reliability and variability inputs.");
        return;
      }

      const ratio = incomeAdjusted / essentialsAdjusted;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Unable to compute a valid coverage ratio from these values.");
        return;
      }

      const classification = classifyCoverage(ratio);

      const drivers = [
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food", value: food },
        { label: "Transport", value: transport },
        { label: "Minimum debt payments", value: debt },
        { label: "Commitments", value: commitments }
      ];
      const topDrivers = pickTopDrivers(drivers);

      const stableThreshold = 1.25;
      const correctionToStable = correctionTargetToStable(incomeAdjusted, essentialsAdjusted, stableThreshold);
      const bufferAmount = bufferTargetAmount(essentialsAdjusted, bufferMonths);

      const monthlyMargin = incomeAdjusted - essentialsAdjusted;

      let interpretation = "";
      if (classification === "Underprepared") {
        interpretation = "Your adjusted income does not cover adjusted essentials with a safe margin. The structure is fragile.";
      } else if (classification === "Borderline") {
        interpretation = "You cover adjusted essentials, but the margin is thin once uncertainty is applied.";
      } else {
        interpretation = "You cover adjusted essentials with a meaningful margin, even after uncertainty is applied.";
      }

      const driversList = topDrivers.length
        ? "<ul class=\"di-mini-list\">" + topDrivers.map(function (d) { return "<li>" + d + "</li>"; }).join("") + "</ul>"
        : "<p class=\"di-muted\">No dominant drivers detected.</p>";

      const correctionText = correctionToStable <= 0
        ? "0"
        : formatWithCommas(correctionToStable);

      const bufferText = formatWithCommas(bufferAmount);

      const html =
        "<div class=\"di-result-block\">" +
          "<p class=\"di-headline\"><strong>Readiness:</strong> " + classification + "</p>" +
          "<p class=\"di-subline\">" + interpretation + "</p>" +
          "<div class=\"di-kpis\">" +
            "<div class=\"di-kpi\"><div class=\"di-kpi-label\">Coverage ratio</div><div class=\"di-kpi-value\">" + formatTwoDecimals(ratio) + "</div></div>" +
            "<div class=\"di-kpi\"><div class=\"di-kpi-label\">Adjusted income</div><div class=\"di-kpi-value\">" + formatWithCommas(incomeAdjusted) + "</div></div>" +
            "<div class=\"di-kpi\"><div class=\"di-kpi-label\">Adjusted essentials</div><div class=\"di-kpi-value\">" + formatWithCommas(essentialsAdjusted) + "</div></div>" +
            "<div class=\"di-kpi\"><div class=\"di-kpi-label\">Monthly margin</div><div class=\"di-kpi-value\">" + formatWithCommas(monthlyMargin) + "</div></div>" +
          "</div>" +
          "<h3 class=\"di-subhead\">Top drivers</h3>" +
          driversList +
          "<h3 class=\"di-subhead\">Minimum correction target</h3>" +
          "<p class=\"di-muted\">To reach stable coverage (" + stableThreshold.toFixed(2) + "), you need about <strong>" + correctionText + "</strong> more adjusted income per month, or the same reduction in adjusted essentials.</p>" +
          "<h3 class=\"di-subhead\">Buffer target</h3>" +
          "<p class=\"di-muted\">For <strong>" + formatWithCommas(bufferMonths) + "</strong> month(s) of buffer, target about <strong>" + bufferText + "</strong> in cash reserves (based on adjusted essentials).</p>" +
        "</div>";

      setResultHtml(html);
    });
  }

  // ------------------------------------------------------------
  // 5) WHATSAPP SHARE (BASELINE PATTERN)
  // ------------------------------------------------------------

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Check this readiness diagnostic: " + pageUrl;
      const encoded = encodeURIComponent(message);
      window.location.href = "https://api.whatsapp.com/send?text=" + encoded;
    });
  }
});
