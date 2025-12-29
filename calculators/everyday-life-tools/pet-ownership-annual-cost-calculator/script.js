document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const petType = document.getElementById("petType");
  const foodMonthly = document.getElementById("foodMonthly");
  const routineVetAnnual = document.getElementById("routineVetAnnual");
  const petInsuranceMonthly = document.getElementById("petInsuranceMonthly");
  const groomingMonthly = document.getElementById("groomingMonthly");
  const medsMonthly = document.getElementById("medsMonthly");
  const toysTreatsMonthly = document.getElementById("toysTreatsMonthly");
  const boardingAnnual = document.getElementById("boardingAnnual");
  const licensingAnnual = document.getElementById("licensingAnnual");
  const oneTimeThisYear = document.getElementById("oneTimeThisYear");
  const contingencyPercent = document.getElementById("contingencyPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(foodMonthly);
  attachLiveFormatting(routineVetAnnual);
  attachLiveFormatting(petInsuranceMonthly);
  attachLiveFormatting(groomingMonthly);
  attachLiveFormatting(medsMonthly);
  attachLiveFormatting(toysTreatsMonthly);
  attachLiveFormatting(boardingAnnual);
  attachLiveFormatting(licensingAnnual);
  attachLiveFormatting(oneTimeThisYear);
  attachLiveFormatting(contingencyPercent);

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
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value,n, fieldLabel) {
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
      // No modes used
      const mode = "default";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const foodM = toNumber(foodMonthly ? foodMonthly.value : "");
      const vetA = toNumber(routineVetAnnual ? routineVetAnnual.value : "");

      const insuranceM = toNumber(petInsuranceMonthly ? petInsuranceMonthly.value : "");
      const groomingM = toNumber(groomingMonthly ? groomingMonthly.value : "");
      const medsM = toNumber(medsMonthly ? medsMonthly.value : "");
      const toysM = toNumber(toysTreatsMonthly ? toysTreatsMonthly.value : "");

      const boardingA = toNumber(boardingAnnual ? boardingAnnual.value : "");
      const licensingA = toNumber(licensingAnnual ? licensingAnnual.value : "");

      const oneTimeA = toNumber(oneTimeThisYear ? oneTimeThisYear.value : "");
      const contingencyPct = toNumber(contingencyPercent ? contingencyPercent.value : "");

      // Basic existence guard
      if (!foodMonthly || !routineVetAnnual || !resultDiv) return;

      // Validation (required minimum)
      if (!validatePositive(foodM, "food per month")) return;
      if (!validatePositive(vetA, "routine vet care per year")) return;

      // Optional fields: treat blanks as 0, but still validate if negative or NaN
      const optionalNumbers = [
        { v: insuranceM, label: "pet insurance per month" },
        { v: groomingM, label: "grooming per month" },
        { v: medsM, label: "meds and supplements per month" },
        { v: toysM, label: "toys and treats per month" },
        { v: boardingA, label: "boarding or pet sitting per year" },
        { v: licensingA, label: "licensing and admin per year" },
        { v: oneTimeA, label: "one-time costs this year" },
        { v: contingencyPct, label: "contingency buffer percent" }
      ];

      for (let i = 0; i < optionalNumbers.length; i++) {
        if (!validateNonNegative(optionalNumbers[i].v, optionalNumbers[i].label)) return;
      }

      // Clamp contingency to a sensible range
      const contingency = Math.min(Math.max(contingencyPct, 0), 100);

      // Calculation logic
      const foodAnnual = foodM * 12;
      const insuranceAnnual = insuranceM * 12;
      const groomingAnnual = groomingM * 12;
      const medsAnnual = medsM * 12;
      const toysAnnual = toysM * 12;

      const baseAnnual =
        foodAnnual +
        vetA +
        insuranceAnnual +
        groomingAnnual +
        medsAnnual +
        toysAnnual +
        boardingA +
        licensingA +
        oneTimeA;

      const bufferedAnnual = baseAnnual * (1 + contingency / 100);
      const baseMonthly = baseAnnual / 12;
      const bufferedMonthly = bufferedAnnual / 12;

      // Simple secondary insight: biggest cost share
      const buckets = [
        { key: "Food", value: foodAnnual },
        { key: "Vet (routine)", value: vetA },
        { key: "Insurance", value: insuranceAnnual },
        { key: "Grooming", value: groomingAnnual },
        { key: "Meds and supplements", value: medsAnnual },
        { key: "Toys and treats", value: toysAnnual },
        { key: "Boarding or sitting", value: boardingA },
        { key: "Licensing and admin", value: licensingA },
        { key: "One-time this year", value: oneTimeA }
      ].filter(function (x) {
        return Number.isFinite(x.value) && x.value > 0;
      });

      let topLine = "";
      if (buckets.length > 0) {
        buckets.sort(function (a, b) {
          return b.value - a.value;
        });
        const top = buckets[0];
        const pct = baseAnnual > 0 ? (top.value / baseAnnual) * 100 : 0;
        topLine =
          "<p><strong>Largest cost driver:</strong> " +
          top.key +
          " (" +
          formatNumberTwoDecimals(pct) +
          "% of your base annual total).</p>";
      }

      const petLabel = petType ? petType.value : "dog";
      const petLabelNice = petLabel === "cat" ? "Cat" : petLabel === "other" ? "Other" : "Dog";

      // Build output HTML
      const resultHtml =
        "<p><strong>Base annual cost (" +
        petLabelNice +
        "):</strong> " +
        formatNumberTwoDecimals(baseAnnual) +
        "</p>" +
        "<p><strong>Base monthly equivalent:</strong> " +
        formatNumberTwoDecimals(baseMonthly) +
        "</p>" +
        "<p><strong>Buffered annual cost (" +
        formatNumberTwoDecimals(contingency) +
        "% buffer):</strong> " +
        formatNumberTwoDecimals(bufferedAnnual) +
        "</p>" +
        "<p><strong>Buffered monthly equivalent:</strong> " +
        formatNumberTwoDecimals(bufferedMonthly) +
        "</p>" +
        topLine +
        "<hr>" +
        "<p><strong>Breakdown (annual)</strong></p>" +
        "<ul>" +
        "<li>Food: " + formatNumberTwoDecimals(foodAnnual) + "</li>" +
        "<li>Routine vet care: " + formatNumberTwoDecimals(vetA) + "</li>" +
        "<li>Insurance: " + formatNumberTwoDecimals(insuranceAnnual) + "</li>" +
        "<li>Grooming: " + formatNumberTwoDecimals(groomingAnnual) + "</li>" +
        "<li>Meds and supplements: " + formatNumberTwoDecimals(medsAnnual) + "</li>" +
        "<li>Toys and treats: " + formatNumberTwoDecimals(toysAnnual) + "</li>" +
        "<li>Boarding or sitting: " + formatNumberTwoDecimals(boardingA) + "</li>" +
        "<li>Licensing and admin: " + formatNumberTwoDecimals(licensingA) + "</li>" +
        "<li>One-time costs this year: " + formatNumberTwoDecimals(oneTimeA) + "</li>" +
        "</ul>";

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Pet Ownership Annual Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
