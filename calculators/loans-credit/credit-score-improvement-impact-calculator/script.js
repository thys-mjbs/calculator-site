document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loanAmount = document.getElementById("loanAmount");
  const termMonths = document.getElementById("termMonths");
  const currentApr = document.getElementById("currentApr");

  const modeSelect = document.getElementById("modeSelect");
  const modeKnownBlock = document.getElementById("modeKnownBlock");
  const modeEstimateBlock = document.getElementById("modeEstimateBlock");

  const improvedApr = document.getElementById("improvedApr");
  const scoreIncrease = document.getElementById("scoreIncrease");
  const rateDropPoints = document.getElementById("rateDropPoints");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(loanAmount);
  attachLiveFormatting(termMonths);
  attachLiveFormatting(currentApr);
  attachLiveFormatting(improvedApr);
  attachLiveFormatting(scoreIncrease);
  attachLiveFormatting(rateDropPoints);

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
    if (modeKnownBlock) modeKnownBlock.classList.add("hidden");
    if (modeEstimateBlock) modeEstimateBlock.classList.add("hidden");

    if (mode === "known") {
      if (modeKnownBlock) modeKnownBlock.classList.remove("hidden");
    } else if (mode === "estimate") {
      if (modeEstimateBlock) modeEstimateBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function monthlyPayment(principal, annualRatePct, months) {
    const r = (annualRatePct / 100) / 12;
    if (r === 0) return principal / months;
    const pow = Math.pow(1 + r, months);
    return principal * (r * pow) / (pow - 1);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "known";

      const P = toNumber(loanAmount ? loanAmount.value : "");
      const n = toNumber(termMonths ? termMonths.value : "");
      const aprCurrent = toNumber(currentApr ? currentApr.value : "");

      if (!loanAmount || !termMonths || !currentApr) return;

      if (!validatePositive(P, "loan amount")) return;
      if (!validatePositive(n, "loan term (months)")) return;
      if (!validateNonNegative(aprCurrent, "current APR")) return;

      let aprImproved = NaN;

      if (mode === "known") {
        const aprImp = toNumber(improvedApr ? improvedApr.value : "");
        if (!improvedApr) return;
        if (!validateNonNegative(aprImp, "improved APR")) return;
        aprImproved = aprImp;
      } else {
        const drop = toNumber(rateDropPoints ? rateDropPoints.value : "");
        if (!rateDropPoints) return;
        if (!validateNonNegative(drop, "estimated rate drop")) return;
        aprImproved = Math.max(0, aprCurrent - drop);
      }

      const payCurrent = monthlyPayment(P, aprCurrent, n);
      const payImproved = monthlyPayment(P, aprImproved, n);

      const totalPaidCurrent = payCurrent * n;
      const totalPaidImproved = payImproved * n;

      const interestCurrent = totalPaidCurrent - P;
      const interestImproved = totalPaidImproved - P;

      const monthlyDiff = payCurrent - payImproved;
      const totalInterestSaved = interestCurrent - interestImproved;

      const noteParts = [];
      if (mode === "estimate") {
        const scoreInc = toNumber(scoreIncrease ? scoreIncrease.value : "");
        if (Number.isFinite(scoreInc) && scoreInc > 0) {
          noteParts.push("You noted an expected score increase of " + Math.round(scoreInc) + " points.");
        }
        noteParts.push("Improved APR was estimated using your rate drop input.");
      } else {
        noteParts.push("Improved APR was taken directly from your input.");
      }

      if (aprImproved > aprCurrent) {
        noteParts.push("Your improved APR is higher than your current APR, so the result shows higher costs instead of savings.");
      }

      const resultHtml =
        `<p><strong>Current monthly payment:</strong> ${formatNumberTwoDecimals(payCurrent)}</p>` +
        `<p><strong>Improved monthly payment:</strong> ${formatNumberTwoDecimals(payImproved)}</p>` +
        `<p><strong>Monthly difference:</strong> ${formatNumberTwoDecimals(monthlyDiff)}</p>` +
        `<hr>` +
        `<p><strong>Total interest (current):</strong> ${formatNumberTwoDecimals(interestCurrent)}</p>` +
        `<p><strong>Total interest (improved):</strong> ${formatNumberTwoDecimals(interestImproved)}</p>` +
        `<p><strong>Total interest saved:</strong> ${formatNumberTwoDecimals(totalInterestSaved)}</p>` +
        `<hr>` +
        `<p><strong>Rates used:</strong> ${formatNumberTwoDecimals(aprCurrent)}% APR → ${formatNumberTwoDecimals(aprImproved)}% APR</p>` +
        `<p><strong>Assumptions used:</strong> ${noteParts.join(" ")}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Credit Score Improvement Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
