// script.js
document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const diSecondary = document.getElementById("diSecondary");
  const emailAddress = document.getElementById("emailAddress");
  const emailSendButton = document.getElementById("emailSendButton");
  const emailNote = document.getElementById("emailNote");

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

  function parseLooseNumber(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return NaN;
    const cleaned = raw.replace(/,/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  }

  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function formatWithCommas(n) {
    if (!Number.isFinite(n)) return "";
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatRatio(r) {
    if (!Number.isFinite(r)) return "";
    return r.toFixed(2) + "x";
  }

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const v = parseLooseNumber(inputEl.value);
      if (!Number.isFinite(v)) return;
      inputEl.value = formatWithCommas(v);
    });
  }

  function bindRangeAndNumber(rangeEl, numberEl, min, max) {
    if (!rangeEl || !numberEl) return;

    function syncFromRange() {
      const v = parseLooseNumber(rangeEl.value);
      if (!Number.isFinite(v)) return;
      numberEl.value = formatWithCommas(v);
      clearResult();
      hideSecondary();
    }

    function syncFromNumber(clampOnCommit) {
      const v = parseLooseNumber(numberEl.value);
      if (!Number.isFinite(v)) {
        if (clampOnCommit) numberEl.value = "";
        clearResult();
        hideSecondary();
        return;
      }
      let next = v;
      if (clampOnCommit) next = clamp(v, min, max);
      if (!Number.isFinite(next)) return;
      rangeEl.value = String(Math.round(next));
      numberEl.value = formatWithCommas(next);
      clearResult();
      hideSecondary();
    }

    rangeEl.addEventListener("input", syncFromRange);

    numberEl.addEventListener("blur", function () {
      syncFromNumber(true);
    });

    numberEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        syncFromNumber(true);
      }
    });

    syncFromRange();
  }

  function hideSecondary() {
    if (!diSecondary) return;
    diSecondary.innerHTML = "";
    diSecondary.classList.add("hidden");
  }

  function showSecondary(html) {
    if (!diSecondary) return;
    diSecondary.classList.remove("hidden");
    diSecondary.innerHTML = html;
  }

  attachLiveFormatting(incomeNumber);
  attachLiveFormatting(housingNumber);
  attachLiveFormatting(utilitiesNumber);
  attachLiveFormatting(foodNumber);
  attachLiveFormatting(transportNumber);
  attachLiveFormatting(debtNumber);

  bindRangeAndNumber(incomeRange, incomeNumber, 0, 300000);
  bindRangeAndNumber(housingRange, housingNumber, 0, 150000);
  bindRangeAndNumber(utilitiesRange, utilitiesNumber, 0, 40000);
  bindRangeAndNumber(foodRange, foodNumber, 0, 60000);
  bindRangeAndNumber(transportRange, transportNumber, 0, 60000);
  bindRangeAndNumber(debtRange, debtNumber, 0, 120000);

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function topDrivers(entries) {
    const sorted = entries
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      });
    return sorted.slice(0, 2).filter(function (x) { return x.value > 0; });
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();
      hideSecondary();

      if (!incomeNumber || !housingNumber || !utilitiesNumber || !foodNumber || !transportNumber || !debtNumber) return;

      const income = parseLooseNumber(incomeNumber.value);
      const housing = parseLooseNumber(housingNumber.value);
      const utilities = parseLooseNumber(utilitiesNumber.value);
      const food = parseLooseNumber(foodNumber.value);
      const transport = parseLooseNumber(transportNumber.value);
      const debt = parseLooseNumber(debtNumber.value);

      if (!validatePositive(income, "monthly income")) return;

      if (!validateNonNegative(housing, "housing")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(food, "food and basic household")) return;
      if (!validateNonNegative(transport, "transport")) return;
      if (!validateNonNegative(debt, "debt minimums")) return;

      const essentials = housing + utilities + food + transport + debt;

      if (!Number.isFinite(essentials) || essentials <= 0) {
        setResultError("Enter essentials greater than 0 (at least one essential cost must be above 0).");
        return;
      }

      const ratio = income / essentials;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setResultError("Calculation failed. Check inputs and try again.");
        return;
      }

      let status = "Stable";
      if (ratio < 1.0) status = "Underprepared";
      else if (ratio < 1.2) status = "Borderline";

      const stableTargetRatio = 1.2;
      const targetIncomeForStable = essentials * stableTargetRatio;
      const incomeIncreaseToStable = Math.max(0, targetIncomeForStable - income);

      const maxEssentialsForStableAtCurrentIncome = income / stableTargetRatio;
      const essentialsReductionToStable = Math.max(0, essentials - maxEssentialsForStableAtCurrentIncome);

      const gapToBreakEven = Math.max(0, essentials - income);

      let interpretation = "Income covers essentials with usable margin. Protect the ratio and build a buffer.";
      if (status === "Borderline") {
        interpretation = "Income covers essentials, but margin is thin. One meaningful change is needed to move into stable territory.";
      }
      if (status === "Underprepared") {
        interpretation = "Essentials exceed income. The base month is structurally short until the gap is closed.";
      }

      let action1 = "";
      let action2 = "";

      if (status === "Stable") {
        action1 = "Lock the current essentials baseline and avoid new fixed commitments that shrink margin.";
        action2 = "Build a buffer using the surplus above essentials before attempting major lifestyle upgrades.";
      } else if (status === "Borderline") {
        action1 = "Target one major essential driver and reduce it, or increase stable income, until the ratio reaches at least 1.20.";
        action2 = "Avoid adding new fixed costs until margin improves; treat any new commitment as a ratio test first.";
      } else {
        action1 = "Close the immediate monthly gap by increasing income, reducing essentials, or both, until the ratio reaches at least 1.00.";
        action2 = "Identify the largest essential driver and apply one direct change there before trying multiple small cuts.";
      }

      const headlineHtml =
        '<div><strong>Status:</strong> ' + status + '</div>' +
        '<div><strong>Coverage ratio:</strong> ' + formatRatio(ratio) + '</div>' +
        '<div style="margin-top:6px;">' + interpretation + '</div>' +
        '<ul class="di-actions"><li>' + action1 + '</li><li>' + action2 + '</li></ul>';

      setResultSuccess(headlineHtml);

      const drivers = topDrivers([
        { label: "Housing", value: housing },
        { label: "Utilities", value: utilities },
        { label: "Food and basic household", value: food },
        { label: "Transport", value: transport },
        { label: "Debt minimums", value: debt }
      ]);

      const driversText = drivers.length
        ? drivers.map(function (d) { return d.label; }).join(", ")
        : "None (all essentials are zero, which is invalid)";

      let correctionSignal = "";
      if (status === "Underprepared") {
        correctionSignal = "Minimum gap to break-even: " + formatWithCommas(gapToBreakEven);
      } else if (status === "Borderline") {
        const incomeSide = "Income increase to reach 1.20: " + formatWithCommas(incomeIncreaseToStable);
        const expenseSide = "Essentials reduction to reach 1.20: " + formatWithCommas(essentialsReductionToStable);
        correctionSignal = incomeSide + " or " + expenseSide;
      } else {
        const incomeSide = "Income increase to strengthen buffer: " + formatWithCommas(incomeIncreaseToStable);
        const expenseSide = "Essentials reduction to strengthen buffer: " + formatWithCommas(essentialsReductionToStable);
        correctionSignal = incomeSide + " or " + expenseSide;
      }

      const secondaryHtml =
        '<h3>Outcome details</h3>' +
        '<p class="di-kv"><strong>Classification</strong> ' + status + '</p>' +
        '<p class="di-kv"><strong>Coverage ratio</strong> ' + formatRatio(ratio) + '</p>' +
        '<p class="di-kv"><strong>Income</strong> ' + formatWithCommas(income) + '</p>' +
        '<p class="di-kv"><strong>Essentials total</strong> ' + formatWithCommas(essentials) + '</p>' +
        '<p class="di-kv"><strong>Key drivers (labels)</strong> ' + driversText + '</p>' +
        '<p class="di-kv"><strong>Primary correction signal</strong> ' + correctionSignal + '</p>';

      showSecondary(secondaryHtml);
    });
  }

  if (emailSendButton) {
    emailSendButton.addEventListener("click", function () {
      if (!emailNote) return;
      const v = String(emailAddress && emailAddress.value ? emailAddress.value : "").trim();
      if (!v) {
        emailNote.textContent = "Enter an email address to continue.";
        return;
      }
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!isValid) {
        emailNote.textContent = "Enter a valid email address.";
        return;
      }
      emailNote.textContent = "Email capture is not enabled on this page build.";
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Income vs Essentials Readiness Check - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }

  hideSecondary();
});
