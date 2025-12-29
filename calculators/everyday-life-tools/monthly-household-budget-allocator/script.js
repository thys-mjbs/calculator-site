document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const netIncomeInput = document.getElementById("netIncome");
  const rentMortgageInput = document.getElementById("rentMortgage");
  const utilitiesInput = document.getElementById("utilities");
  const debtPaymentsInput = document.getElementById("debtPayments");
  const insuranceInput = document.getElementById("insurance");
  const otherFixedInput = document.getElementById("otherFixed");

  const groceryPctInput = document.getElementById("groceryPct");
  const transportPctInput = document.getElementById("transportPct");
  const householdPctInput = document.getElementById("householdPct");
  const discretionaryPctInput = document.getElementById("discretionaryPct");
  const savingsPctInput = document.getElementById("savingsPct");
  const bufferPctInput = document.getElementById("bufferPct");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Money inputs: commas help readability
  attachLiveFormatting(netIncomeInput);
  attachLiveFormatting(rentMortgageInput);
  attachLiveFormatting(utilitiesInput);
  attachLiveFormatting(debtPaymentsInput);
  attachLiveFormatting(insuranceInput);
  attachLiveFormatting(otherFixedInput);

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

  function roundToTwo(value) {
    return Math.round(value * 100) / 100;
  }

  function parsePercentInput(inputEl) {
    const raw = inputEl ? String(inputEl.value || "").trim() : "";
    if (!raw) return null;
    const val = toNumber(raw);
    if (!Number.isFinite(val)) return NaN;
    return val;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required income
      const netIncome = toNumber(netIncomeInput ? netIncomeInput.value : "");

      // Parse optional fixed costs (treat blanks as 0)
      const rentMortgage = toNumber(rentMortgageInput ? rentMortgageInput.value : "");
      const utilities = toNumber(utilitiesInput ? utilitiesInput.value : "");
      const debtPayments = toNumber(debtPaymentsInput ? debtPaymentsInput.value : "");
      const insurance = toNumber(insuranceInput ? insuranceInput.value : "");
      const otherFixed = toNumber(otherFixedInput ? otherFixedInput.value : "");

      // Validate required
      if (!validatePositive(netIncome, "monthly take-home income")) return;

      // Validate optional (allow blank -> 0, but reject negatives / NaN if user typed garbage)
      if (!validateNonNegative(rentMortgage, "rent or mortgage")) return;
      if (!validateNonNegative(utilities, "utilities")) return;
      if (!validateNonNegative(debtPayments, "debt payments")) return;
      if (!validateNonNegative(insurance, "insurance")) return;
      if (!validateNonNegative(otherFixed, "other fixed monthly costs")) return;

      const fixedTotal = rentMortgage + utilities + debtPayments + insurance + otherFixed;
      const remaining = netIncome - fixedTotal;

      if (remaining < 0) {
        setResultError(
          "Your fixed monthly costs are higher than your take-home income. Reduce fixed costs, increase income, or revise the numbers and try again."
        );
        return;
      }

      // Default split (applies to remaining money after fixed costs)
      let groceryPct = 25;
      let transportPct = 15;
      let householdPct = 10;
      let discretionaryPct = 25;
      let savingsPct = 20;
      let bufferPct = 5;

      // Advanced: if any percent field is filled, require all and enforce sum=100
      const p1 = parsePercentInput(groceryPctInput);
      const p2 = parsePercentInput(transportPctInput);
      const p3 = parsePercentInput(householdPctInput);
      const p4 = parsePercentInput(discretionaryPctInput);
      const p5 = parsePercentInput(savingsPctInput);
      const p6 = parsePercentInput(bufferPctInput);

      const anyPctEntered = [p1, p2, p3, p4, p5, p6].some(function (v) {
        return v !== null;
      });

      if (anyPctEntered) {
        // All must be present and valid
        if ([p1, p2, p3, p4, p5, p6].some(function (v) { return v === null; })) {
          setResultError("If you use Advanced percentages, fill in all six percentage fields (they must add up to 100%).");
          return;
        }

        if ([p1, p2, p3, p4, p5, p6].some(function (v) { return !Number.isFinite(v) || v < 0; })) {
          setResultError("Enter valid percentages (0 or higher) in the Advanced section.");
          return;
        }

        const pctSum = p1 + p2 + p3 + p4 + p5 + p6;
        const diff = Math.abs(pctSum - 100);

        if (diff > 0.25) {
          setResultError("Your Advanced percentages must add up to 100%. Current total: " + roundToTwo(pctSum) + "%.");
          return;
        }

        groceryPct = p1;
        transportPct = p2;
        householdPct = p3;
        discretionaryPct = p4;
        savingsPct = p5;
        bufferPct = p6;
      }

      // Allocate remaining money by the chosen split
      const groceries = remaining * (groceryPct / 100);
      const transport = remaining * (transportPct / 100);
      const household = remaining * (householdPct / 100);
      const discretionary = remaining * (discretionaryPct / 100);
      const savings = remaining * (savingsPct / 100);
      const buffer = remaining * (bufferPct / 100);

      // Weekly pacing (rough, 52 weeks / 12 months ≈ 4.333 weeks per month)
      const weeksPerMonth = 52 / 12;
      const weeklyRemaining = remaining / weeksPerMonth;

      function money(n) {
        return formatNumberTwoDecimals(n);
      }

      const fixedPctOfIncome = netIncome > 0 ? (fixedTotal / netIncome) * 100 : 0;

      const resultHtml =
        `<p><strong>Budget plan (monthly)</strong></p>` +
        `<p><strong>Take-home income:</strong> ${money(netIncome)}</p>` +
        `<p><strong>Fixed costs total:</strong> ${money(fixedTotal)} (${roundToTwo(fixedPctOfIncome)}% of income)</p>` +
        `<p><strong>Money left to allocate:</strong> ${money(remaining)} (about ${money(weeklyRemaining)} per week)</p>` +
        `<hr>` +
        `<p><strong>Suggested spending caps for the remaining money:</strong></p>` +
        `<ul>` +
        `<li><strong>Groceries:</strong> ${money(groceries)} (${roundToTwo(groceryPct)}%)</li>` +
        `<li><strong>Transport:</strong> ${money(transport)} (${roundToTwo(transportPct)}%)</li>` +
        `<li><strong>Household &amp; misc essentials:</strong> ${money(household)} (${roundToTwo(householdPct)}%)</li>` +
        `<li><strong>Discretionary spending:</strong> ${money(discretionary)} (${roundToTwo(discretionaryPct)}%)</li>` +
        `<li><strong>Savings &amp; investing:</strong> ${money(savings)} (${roundToTwo(savingsPct)}%)</li>` +
        `<li><strong>Buffer (unexpected costs):</strong> ${money(buffer)} (${roundToTwo(bufferPct)}%)</li>` +
        `</ul>` +
        `<p><strong>Practical tip:</strong> If you keep overspending, reduce the discretionary cap first. If you keep getting surprise bills, increase the buffer.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Monthly Household Budget Allocator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
