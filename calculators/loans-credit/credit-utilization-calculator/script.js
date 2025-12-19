document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalLimitInput = document.getElementById("totalLimit");
  const totalBalanceInput = document.getElementById("totalBalance");
  const targetUtilInput = document.getElementById("targetUtil");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(totalLimitInput);
  attachLiveFormatting(totalBalanceInput);
  attachLiveFormatting(targetUtilInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function utilizationLabel(utilPct) {
    if (!Number.isFinite(utilPct)) return "Unknown";
    if (utilPct < 10) return "Very low";
    if (utilPct < 30) return "Low";
    if (utilPct < 50) return "Moderate";
    if (utilPct < 75) return "High";
    return "Very high";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!totalLimitInput || !totalBalanceInput || !targetUtilInput) return;

      const totalLimit = toNumber(totalLimitInput.value);
      const totalBalance = toNumber(totalBalanceInput.value);
      let targetUtil = toNumber(targetUtilInput.value);

      if (!validatePositive(totalLimit, "total credit limit")) return;
      if (!validateNonNegative(totalBalance, "total balances")) return;

      if (!Number.isFinite(targetUtil) || targetUtil <= 0) {
        targetUtil = 30;
      }

      targetUtil = clamp(targetUtil, 1, 99.9);

      const availableCredit = totalLimit - totalBalance;
      const utilRate = (totalBalance / totalLimit) * 100;

      const targetBalance = totalLimit * (targetUtil / 100);
      const payDownNeededRaw = totalBalance - targetBalance;
      const payDownNeeded = payDownNeededRaw > 0 ? payDownNeededRaw : 0;

      const additionalSpendAllowedRaw = targetBalance - totalBalance;
      const additionalSpendAllowed = additionalSpendAllowedRaw > 0 ? additionalSpendAllowedRaw : 0;

      const utilLabel = utilizationLabel(utilRate);

      const utilRateDisplay = formatNumberTwoDecimals(utilRate);
      const availableDisplay = formatNumberTwoDecimals(availableCredit);
      const limitDisplay = formatNumberTwoDecimals(totalLimit);
      const balanceDisplay = formatNumberTwoDecimals(totalBalance);

      const targetUtilDisplay = formatNumberTwoDecimals(targetUtil);
      const targetBalanceDisplay = formatNumberTwoDecimals(targetBalance);
      const payDownDisplay = formatNumberTwoDecimals(payDownNeeded);
      const spendDisplay = formatNumberTwoDecimals(additionalSpendAllowed);

      let availabilityLine = "";
      if (availableCredit >= 0) {
        availabilityLine = `<p><strong>Available credit:</strong> ${availableDisplay}</p>`;
      } else {
        availabilityLine = `<p><strong>Available credit:</strong> ${availableDisplay} (over limit)</p>`;
      }

      const practicalNote =
        utilRate < 10
          ? "Your utilization is very low. If everything else is stable, this is usually a healthy signal."
          : utilRate < 30
          ? "Your utilization is in a commonly recommended range for routine credit health."
          : utilRate < 50
          ? "Your utilization is moderate. If you are applying for credit soon, lowering it can help."
          : utilRate < 75
          ? "Your utilization is high. Reducing balances may improve your credit profile and reduce interest costs."
          : "Your utilization is very high. This is a strong risk signal. Prioritize paying down balances and avoid adding new charges if possible.";

      const resultHtml = `
        <p><strong>Credit utilization:</strong> ${utilRateDisplay}% (${utilLabel})</p>
        <p><strong>Total limit:</strong> ${limitDisplay}</p>
        <p><strong>Total balances:</strong> ${balanceDisplay}</p>
        ${availabilityLine}
        <hr>
        <p><strong>Target utilization used:</strong> ${targetUtilDisplay}%</p>
        <p><strong>Balance that matches target:</strong> ${targetBalanceDisplay}</p>
        <p><strong>Pay down needed to reach target:</strong> ${payDownDisplay}</p>
        <p><strong>Extra spending room at target:</strong> ${spendDisplay}</p>
        <hr>
        <p>${practicalNote}</p>
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
      const message = "Credit Utilization Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
