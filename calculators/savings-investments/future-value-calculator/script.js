document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const initialAmount = document.getElementById("initialAmount");
  const contributionAmount = document.getElementById("contributionAmount");
  const contributionFrequency = document.getElementById("contributionFrequency");
  const contributionTiming = document.getElementById("contributionTiming");
  const annualRate = document.getElementById("annualRate");
  const years = document.getElementById("years");
  const compoundingFrequency = document.getElementById("compoundingFrequency");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(initialAmount);
  attachLiveFormatting(contributionAmount);
  attachLiveFormatting(annualRate);
  attachLiveFormatting(years);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const pv = toNumber(initialAmount ? initialAmount.value : "");
      const pmt = toNumber(contributionAmount ? contributionAmount.value : "");
      const ratePct = toNumber(annualRate ? annualRate.value : "");
      const yearsVal = toNumber(years ? years.value : "");
      const compPerYear = compoundingFrequency ? toNumber(compoundingFrequency.value) : NaN;
      const contribPerYear = contributionFrequency ? toNumber(contributionFrequency.value) : NaN;
      const timing = contributionTiming ? contributionTiming.value : "end";

      if (!validateNonNegative(pv, "initial amount")) return;
      if (!validateNonNegative(pmt, "regular contribution")) return;
      if (!validateNonNegative(ratePct, "annual interest rate")) return;
      if (!validatePositive(yearsVal, "time horizon (years)")) return;

      if (!Number.isFinite(compPerYear) || compPerYear <= 0) {
        setResultError("Select a valid compounding frequency.");
        return;
      }
      if (!Number.isFinite(contribPerYear) || contribPerYear <= 0) {
        setResultError("Select a valid contribution frequency.");
        return;
      }

      if (pv === 0 && pmt === 0) {
        setResultError("Enter an initial amount and/or a regular contribution to calculate a future value.");
        return;
      }

      const annualRateDecimal = ratePct / 100;

      // Growth for lump sum uses compounding frequency directly
      const totalCompPeriods = compPerYear * yearsVal;

      // Convert annual nominal rate compounded m times into an effective rate per contribution period (n per year)
      // i = (1 + r/m)^(m/n) - 1
      let i = 0;
      if (annualRateDecimal > 0) {
        i = Math.pow(1 + annualRateDecimal / compPerYear, compPerYear / contribPerYear) - 1;
      }

      const totalContribPeriods = Math.round(contribPerYear * yearsVal);

      // Lump sum FV
      let fvLump = pv;
      if (annualRateDecimal > 0) {
        fvLump = pv * Math.pow(1 + annualRateDecimal / compPerYear, totalCompPeriods);
      }

      // Contributions FV (ordinary annuity / annuity due)
      let fvContrib = 0;
      if (pmt > 0) {
        if (i === 0) {
          fvContrib = pmt * totalContribPeriods;
        } else {
          fvContrib = pmt * ((Math.pow(1 + i, totalContribPeriods) - 1) / i);
          if (timing === "start") {
            fvContrib = fvContrib * (1 + i);
          }
        }
      }

      const fvTotal = fvLump + fvContrib;
      const totalContributions = pv + pmt * totalContribPeriods;
      const interestEarned = fvTotal - totalContributions;

      // Helpful secondary insights
      const monthlyEquivalentContrib = (pmt > 0 && contribPerYear !== 12)
        ? (pmt * contribPerYear) / 12
        : (contribPerYear === 12 ? pmt : 0);

      const resultHtmlParts = [];

      resultHtmlParts.push(`<p><strong>Future value:</strong> ${formatNumberTwoDecimals(fvTotal)}</p>`);
      resultHtmlParts.push(`<p><strong>Total contributed:</strong> ${formatNumberTwoDecimals(totalContributions)}</p>`);
      resultHtmlParts.push(`<p><strong>Estimated growth (interest/returns):</strong> ${formatNumberTwoDecimals(interestEarned)}</p>`);

      resultHtmlParts.push(`<p><strong>Contribution periods:</strong> ${totalContribPeriods} (${contribPerYear === 12 ? "monthly" : contribPerYear === 4 ? "quarterly" : "yearly"})</p>`);

      if (monthlyEquivalentContrib > 0 && contribPerYear !== 12) {
        resultHtmlParts.push(`<p><strong>Approx. monthly equivalent contribution:</strong> ${formatNumberTwoDecimals(monthlyEquivalentContrib)}</p>`);
      }

      if (annualRateDecimal === 0) {
        resultHtmlParts.push(`<p><em>Note:</em> With a 0% rate, your future value equals your total contributions.</p>`);
      } else if (interestEarned < 0) {
        resultHtmlParts.push(`<p><em>Note:</em> The result shows negative growth. Double-check your inputs.</p>`);
      }

      const resultHtml = resultHtmlParts.join("");

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Future Value Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
