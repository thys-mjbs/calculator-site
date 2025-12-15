document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  const targetAmount = document.getElementById("targetAmount");
  const currentBalanceRequired = document.getElementById("currentBalanceRequired");
  const yearsRequired = document.getElementById("yearsRequired");
  const annualReturnRequired = document.getElementById("annualReturnRequired");
  const contributeAtBeginningRequired = document.getElementById("contributeAtBeginningRequired");

  const monthlyContribution = document.getElementById("monthlyContribution");
  const currentBalanceProject = document.getElementById("currentBalanceProject");
  const yearsProject = document.getElementById("yearsProject");
  const annualReturnProject = document.getElementById("annualReturnProject");
  const contributeAtBeginningProject = document.getElementById("contributeAtBeginningProject");

  const modeRequiredBlock = document.getElementById("modeRequiredBlock");
  const modeProjectBlock = document.getElementById("modeProjectBlock");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(targetAmount);
  attachLiveFormatting(currentBalanceRequired);
  attachLiveFormatting(yearsRequired);
  attachLiveFormatting(annualReturnRequired);

  attachLiveFormatting(monthlyContribution);
  attachLiveFormatting(currentBalanceProject);
  attachLiveFormatting(yearsProject);
  attachLiveFormatting(annualReturnProject);

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
    if (modeRequiredBlock) modeRequiredBlock.classList.add("hidden");
    if (modeProjectBlock) modeProjectBlock.classList.add("hidden");

    if (mode === "project") {
      if (modeProjectBlock) modeProjectBlock.classList.remove("hidden");
    } else {
      if (modeRequiredBlock) modeRequiredBlock.classList.remove("hidden");
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

  function validateReturnRatePercent(value) {
    if (!Number.isFinite(value)) return false;
    if (value <= -99.0) return false;
    if (value > 200.0) return false;
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "required";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const target = toNumber(targetAmount ? targetAmount.value : "");
      const pvRequired = toNumber(currentBalanceRequired ? currentBalanceRequired.value : "");
      const yrsRequired = toNumber(yearsRequired ? yearsRequired.value : "");
      const rRequired = toNumber(annualReturnRequired ? annualReturnRequired.value : "");

      const pmt = toNumber(monthlyContribution ? monthlyContribution.value : "");
      const pvProject = toNumber(currentBalanceProject ? currentBalanceProject.value : "");
      const yrsProject = toNumber(yearsProject ? yearsProject.value : "");
      const rProject = toNumber(annualReturnProject ? annualReturnProject.value : "");

      // Defaults for optional inputs
      const DEFAULT_ANNUAL_RETURN_PCT = 7;

      // Basic guards
      if (!resultDiv) return;

      // Validation and calculation
      if (mode === "project") {
        if (!validatePositive(pmt, "monthly contribution")) return;
        if (!validatePositive(yrsProject, "time horizon (years)")) return;

        const pv = Number.isFinite(pvProject) ? Math.max(0, pvProject) : 0;
        if (!validateNonNegative(pv, "current balance")) return;

        const annualPct = Number.isFinite(rProject) && annualReturnProject && annualReturnProject.value.trim() !== ""
          ? rProject
          : DEFAULT_ANNUAL_RETURN_PCT;

        if (!validateReturnRatePercent(annualPct)) {
          setResultError("Enter a valid expected annual return % (greater than -99 and up to 200).");
          return;
        }

        const n = Math.round(yrsProject * 12);
        if (n <= 0) {
          setResultError("Enter a valid time horizon (years) greater than 0.");
          return;
        }

        const i = (annualPct / 100) / 12;
        const annuityDue = !!(contributeAtBeginningProject && contributeAtBeginningProject.checked);

        let fv = 0;
        let totalContributions = pmt * n;

        if (Math.abs(i) < 1e-12) {
          fv = pv + (pmt * n);
        } else {
          const growth = Math.pow(1 + i, n);
          const factor = (growth - 1) / i;
          fv = pv * growth + pmt * factor * (annuityDue ? (1 + i) : 1);
        }

        const growthAmount = fv - pv - totalContributions;

        const resultHtml = `
          <p><strong>Projected future value:</strong> ${formatNumberTwoDecimals(fv)}</p>
          <p><strong>Total contributed:</strong> ${formatNumberTwoDecimals(totalContributions)}</p>
          <p><strong>Estimated growth:</strong> ${formatNumberTwoDecimals(growthAmount)}</p>
          <p><strong>Assumptions used:</strong> ${annualPct}% annual return, ${n} months, contributions at ${annuityDue ? "beginning" : "end"} of month, current balance ${formatNumberTwoDecimals(pv)}.</p>
        `;

        setResultSuccess(resultHtml);
        return;
      }

      // mode === "required"
      if (!validatePositive(target, "target amount")) return;
      if (!validatePositive(yrsRequired, "time horizon (years)")) return;

      const pv = Number.isFinite(pvRequired) ? Math.max(0, pvRequired) : 0;
      if (!validateNonNegative(pv, "current balance")) return;

      const annualPct = Number.isFinite(rRequired) && annualReturnRequired && annualReturnRequired.value.trim() !== ""
        ? rRequired
        : DEFAULT_ANNUAL_RETURN_PCT;

      if (!validateReturnRatePercent(annualPct)) {
        setResultError("Enter a valid expected annual return % (greater than -99 and up to 200).");
        return;
      }

      const n = Math.round(yrsRequired * 12);
      if (n <= 0) {
        setResultError("Enter a valid time horizon (years) greater than 0.");
        return;
      }

      const i = (annualPct / 100) / 12;
      const annuityDue = !!(contributeAtBeginningRequired && contributeAtBeginningRequired.checked);

      // Solve for monthly contribution (PMT)
      let requiredPmt = 0;

      if (Math.abs(i) < 1e-12) {
        requiredPmt = (target - pv) / n;
      } else {
        const growth = Math.pow(1 + i, n);
        const denom = ((growth - 1) / i) * (annuityDue ? (1 + i) : 1);
        requiredPmt = (target - (pv * growth)) / denom;
      }

      if (!Number.isFinite(requiredPmt)) {
        setResultError("Unable to calculate a monthly contribution with these inputs. Adjust the timeline or return rate.");
        return;
      }

      if (requiredPmt < 0) requiredPmt = 0;

      // Build a projection breakdown using the required PMT
      let fvCheck = 0;
      let totalContributions = requiredPmt * n;

      if (Math.abs(i) < 1e-12) {
        fvCheck = pv + (requiredPmt * n);
      } else {
        const growth = Math.pow(1 + i, n);
        const factor = (growth - 1) / i;
        fvCheck = pv * growth + requiredPmt * factor * (annuityDue ? (1 + i) : 1);
      }

      const growthAmount = fvCheck - pv - totalContributions;

      const resultHtml = `
        <p><strong>Required monthly contribution:</strong> ${formatNumberTwoDecimals(requiredPmt)}</p>
        <p><strong>Time horizon:</strong> ${n} months (${formatNumberTwoDecimals(yrsRequired)} years)</p>
        <p><strong>Starting balance:</strong> ${formatNumberTwoDecimals(pv)}</p>
        <p><strong>Total contributed:</strong> ${formatNumberTwoDecimals(totalContributions)}</p>
        <p><strong>Estimated growth:</strong> ${formatNumberTwoDecimals(growthAmount)}</p>
        <p><strong>Target (approx.):</strong> ${formatNumberTwoDecimals(target)}</p>
        <p><strong>Assumptions used:</strong> ${annualPct}% annual return, contributions at ${annuityDue ? "beginning" : "end"} of month.</p>
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
      const message = "Monthly Investment Contribution Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
