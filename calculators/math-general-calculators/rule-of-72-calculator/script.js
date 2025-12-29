document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const interestRateInput = document.getElementById("interestRate");
  const compoundingSelect = document.getElementById("compounding");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Interest rate can benefit from consistent numeric formatting
  attachLiveFormatting(interestRateInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!interestRateInput || !compoundingSelect) return;

      const ratePercent = toNumber(interestRateInput.value);
      if (!validatePositive(ratePercent, "annual interest rate (percent)")) return;

      if (ratePercent > 200) {
        setResultError("Enter an annual interest rate of 200% or less for a realistic doubling-time estimate.");
        return;
      }

      const r = ratePercent / 100;

      // Rule of 72 estimate (years)
      const yearsRule72 = 72 / ratePercent;

      // Exact doubling time based on compounding frequency
      const compoundingValue = (compoundingSelect.value || "1").toLowerCase();
      let yearsExact = null;
      let exactLabel = "";

      if (compoundingValue === "continuous") {
        yearsExact = Math.log(2) / r;
        exactLabel = "Continuous compounding";
      } else {
        const n = toNumber(compoundingValue);
        if (!Number.isFinite(n) || n <= 0) {
          setResultError("Select a valid compounding frequency.");
          return;
        }
        yearsExact = Math.log(2) / (n * Math.log(1 + r / n));
        exactLabel = "Compounding " + (n === 1 ? "annually" : (n === 12 ? "monthly" : (n === 365 ? "daily" : (n + " times per year"))));
      }

      if (!Number.isFinite(yearsExact) || yearsExact <= 0) {
        setResultError("Could not compute an exact doubling time from those inputs. Check the interest rate and try again.");
        return;
      }

      const diffYears = yearsRule72 - yearsExact;
      const diffMonthsAbs = Math.abs(diffYears) * 12;

      const rule72YearsText = formatNumberTwoDecimals(yearsRule72);
      const exactYearsText = formatNumberTwoDecimals(yearsExact);
      const diffMonthsText = formatNumberTwoDecimals(diffMonthsAbs);

      let diffDirectionText = "";
      if (diffMonthsAbs < 0.01) {
        diffDirectionText = "The Rule of 72 estimate is effectively the same as the exact result.";
      } else if (diffYears > 0) {
        diffDirectionText = "The Rule of 72 estimate is slower than the exact result by about " + diffMonthsText + " months.";
      } else {
        diffDirectionText = "The Rule of 72 estimate is faster than the exact result by about " + diffMonthsText + " months.";
      }

      const resultHtml =
        `<p><strong>Estimated doubling time (Rule of 72):</strong> ${rule72YearsText} years</p>` +
        `<p><strong>Exact doubling time:</strong> ${exactYearsText} years <span style="font-size:12px;color:#555555;">(${exactLabel})</span></p>` +
        `<p><strong>What this means:</strong> At ${ratePercent}% per year, a balance that grows by compounding would be expected to reach about double after roughly ${exactYearsText} years under the selected compounding assumption.</p>` +
        `<p><strong>Quick check:</strong> ${diffDirectionText}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Rule of 72 Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
