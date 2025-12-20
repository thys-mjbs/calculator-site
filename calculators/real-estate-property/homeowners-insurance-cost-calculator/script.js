document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const dwellingCoverageInput = document.getElementById("dwellingCoverage");
  const locationRiskSelect = document.getElementById("locationRisk");
  const homeAgeYearsInput = document.getElementById("homeAgeYears");
  const roofAgeYearsInput = document.getElementById("roofAgeYears");
  const deductibleAmountInput = document.getElementById("deductibleAmount");
  const claimsCountSelect = document.getElementById("claimsCount");
  const securityLevelSelect = document.getElementById("securityLevel");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(dwellingCoverageInput);
  attachLiveFormatting(homeAgeYearsInput);
  attachLiveFormatting(roofAgeYearsInput);
  attachLiveFormatting(deductibleAmountInput);

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
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!dwellingCoverageInput || !locationRiskSelect) return;

      const dwellingCoverage = toNumber(dwellingCoverageInput.value);
      const homeAgeYearsRaw = toNumber(homeAgeYearsInput ? homeAgeYearsInput.value : "");
      const roofAgeYearsRaw = toNumber(roofAgeYearsInput ? roofAgeYearsInput.value : "");
      const deductibleAmountRaw = toNumber(deductibleAmountInput ? deductibleAmountInput.value : "");

      const locationRisk = locationRiskSelect ? locationRiskSelect.value : "average";
      const claimsCountValue = claimsCountSelect ? claimsCountSelect.value : "0";
      const securityLevel = securityLevelSelect ? securityLevelSelect.value : "basic";

      if (!validatePositive(dwellingCoverage, "dwelling coverage amount")) return;

      const homeAgeYears = Number.isFinite(homeAgeYearsRaw) && homeAgeYearsInput && homeAgeYearsInput.value.trim() !== ""
        ? homeAgeYearsRaw
        : 20;

      const roofAgeYears = Number.isFinite(roofAgeYearsRaw) && roofAgeYearsInput && roofAgeYearsInput.value.trim() !== ""
        ? roofAgeYearsRaw
        : 10;

      const deductibleAmount = Number.isFinite(deductibleAmountRaw) && deductibleAmountInput && deductibleAmountInput.value.trim() !== ""
        ? deductibleAmountRaw
        : 1000;

      if (!validateNonNegative(homeAgeYears, "home age")) return;
      if (!validateNonNegative(roofAgeYears, "roof age")) return;
      if (!validateNonNegative(deductibleAmount, "deductible")) return;

      // Guardrails for unrealistic entries (still allow, but clamp internally)
      const homeAgeClamped = clamp(homeAgeYears, 0, 150);
      const roofAgeClamped = clamp(roofAgeYears, 0, 80);

      // Base rate: per $1 of coverage (typical mid-range planning estimate)
      // Interpretable as: premium = coverage * baseRate * multipliers
      const baseRate = 0.0045; // 0.45% of dwelling coverage per year (planning baseline)

      // Location risk multipliers
      const locationMultipliers = {
        "low": 0.85,
        "average": 1.0,
        "high": 1.25,
        "very-high": 1.55
      };
      const locationMult = locationMultipliers[locationRisk] || 1.0;

      // Home age multiplier (older homes typically higher due to systems, wiring, plumbing)
      let homeAgeMult = 1.0;
      if (homeAgeClamped <= 10) homeAgeMult = 0.95;
      else if (homeAgeClamped <= 30) homeAgeMult = 1.0;
      else if (homeAgeClamped <= 60) homeAgeMult = 1.12;
      else homeAgeMult = 1.22;

      // Roof age multiplier
      let roofAgeMult = 1.0;
      if (roofAgeClamped <= 5) roofAgeMult = 0.92;
      else if (roofAgeClamped <= 15) roofAgeMult = 1.0;
      else if (roofAgeClamped <= 25) roofAgeMult = 1.12;
      else roofAgeMult = 1.25;

      // Deductible multiplier (higher deductible usually lowers premium)
      let deductibleMult = 1.0;
      if (deductibleAmount >= 5000) deductibleMult = 0.88;
      else if (deductibleAmount >= 2500) deductibleMult = 0.93;
      else if (deductibleAmount >= 1000) deductibleMult = 1.0;
      else if (deductibleAmount >= 500) deductibleMult = 1.06;
      else deductibleMult = 1.12;

      // Claims multiplier
      let claimsMult = 1.0;
      if (claimsCountValue === "1") claimsMult = 1.18;
      else if (claimsCountValue === "2") claimsMult = 1.35;
      else if (claimsCountValue === "3") claimsMult = 1.55;

      // Security multiplier
      let securityMult = 1.0;
      if (securityLevel === "none") securityMult = 1.06;
      else if (securityLevel === "basic") securityMult = 1.0;
      else if (securityLevel === "monitored") securityMult = 0.95;

      const combinedMult = locationMult * homeAgeMult * roofAgeMult * deductibleMult * claimsMult * securityMult;

      const estimatedAnnual = dwellingCoverage * baseRate * combinedMult;
      const estimatedMonthly = estimatedAnnual / 12;

      // Practical range: planning variance band
      const lowAnnual = estimatedAnnual * 0.85;
      const highAnnual = estimatedAnnual * 1.15;

      const ratePer1000 = (estimatedAnnual / dwellingCoverage) * 1000;

      const assumptionsUsed = [];
      assumptionsUsed.push("Base planning rate: " + (baseRate * 100).toFixed(2) + "% of dwelling coverage per year.");
      assumptionsUsed.push("Dwelling coverage is the main driver; this is not a formal insurer quote.");
      assumptionsUsed.push("Defaults applied when left blank: home age 20 years, roof age 10 years, deductible 1,000.");
      assumptionsUsed.push("Range reflects normal insurer variation for the same inputs.");
      assumptionsUsed.push("Contents, liability, endorsements, and peril-specific pricing are not separated.");

      const biggestDrivers = [];
      biggestDrivers.push("Location risk: " + locationRisk.replace("-", " "));
      biggestDrivers.push("Home age used: " + Math.round(homeAgeClamped) + " years");
      biggestDrivers.push("Roof age used: " + Math.round(roofAgeClamped) + " years");
      biggestDrivers.push("Deductible used: " + formatNumberTwoDecimals(deductibleAmount));
      biggestDrivers.push("Claims (5 years): " + (claimsCountValue === "3" ? "3 or more" : claimsCountValue));

      const resultHtml =
        `<p><strong>Estimated annual premium:</strong> ${formatNumberTwoDecimals(estimatedAnnual)}</p>` +
        `<p><strong>Estimated monthly premium:</strong> ${formatNumberTwoDecimals(estimatedMonthly)}</p>` +
        `<p><strong>Practical range (annual):</strong> ${formatNumberTwoDecimals(lowAnnual)} to ${formatNumberTwoDecimals(highAnnual)}</p>` +
        `<p><strong>Cost per 1,000 of coverage:</strong> ${formatNumberTwoDecimals(ratePer1000)}</p>` +
        `<p><strong>What this means:</strong> This is a planning estimate based on your coverage amount and the risk signals selected. Use it to budget and to compare how changes like deductible, roof age, or location risk shift expected cost.</p>` +
        `<p><strong>Inputs and defaults used:</strong></p>` +
        `<ul>` +
          `<li>${biggestDrivers[0]}</li>` +
          `<li>${biggestDrivers[1]}</li>` +
          `<li>${biggestDrivers[2]}</li>` +
          `<li>${biggestDrivers[3]}</li>` +
          `<li>${biggestDrivers[4]}</li>` +
        `</ul>` +
        `<p><strong>Assumptions:</strong></p>` +
        `<ul>` +
          `<li>${assumptionsUsed[0]}</li>` +
          `<li>${assumptionsUsed[1]}</li>` +
          `<li>${assumptionsUsed[2]}</li>` +
          `<li>${assumptionsUsed[3]}</li>` +
          `<li>${assumptionsUsed[4]}</li>` +
        `</ul>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Homeowners Insurance Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
