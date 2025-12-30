document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const allowanceKg = document.getElementById("allowanceKg");
  const emptyBagKg = document.getElementById("emptyBagKg");
  const bufferKg = document.getElementById("bufferKg");

  const tshirtsCount = document.getElementById("tshirtsCount");
  const pantsCount = document.getElementById("pantsCount");
  const underwearPairs = document.getElementById("underwearPairs");
  const jacketsCount = document.getElementById("jacketsCount");
  const shoesPairs = document.getElementById("shoesPairs");
  const toiletriesBags = document.getElementById("toiletriesBags");
  const laptopsCount = document.getElementById("laptopsCount");
  const chargersCount = document.getElementById("chargersCount");
  const otherKg = document.getElementById("otherKg");

  const showAdvancedWeights = document.getElementById("showAdvancedWeights");
  const advancedWeights = document.getElementById("advancedWeights");

  const wTshirt = document.getElementById("wTshirt");
  const wPants = document.getElementById("wPants");
  const wUnderwearPair = document.getElementById("wUnderwearPair");
  const wJacket = document.getElementById("wJacket");
  const wShoesPair = document.getElementById("wShoesPair");
  const wToiletriesBag = document.getElementById("wToiletriesBag");
  const wLaptop = document.getElementById("wLaptop");
  const wChargersPouch = document.getElementById("wChargersPouch");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(allowanceKg);
  attachLiveFormatting(emptyBagKg);
  attachLiveFormatting(bufferKg);
  attachLiveFormatting(otherKg);

  attachLiveFormatting(tshirtsCount);
  attachLiveFormatting(pantsCount);
  attachLiveFormatting(underwearPairs);
  attachLiveFormatting(jacketsCount);
  attachLiveFormatting(shoesPairs);
  attachLiveFormatting(toiletriesBags);
  attachLiveFormatting(laptopsCount);
  attachLiveFormatting(chargersCount);

  attachLiveFormatting(wTshirt);
  attachLiveFormatting(wPants);
  attachLiveFormatting(wUnderwearPair);
  attachLiveFormatting(wJacket);
  attachLiveFormatting(wShoesPair);
  attachLiveFormatting(wToiletriesBag);
  attachLiveFormatting(wLaptop);
  attachLiveFormatting(wChargersPouch);

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

  function validateCount(value, fieldLabel, max) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    if (value > max) {
      setResultError("That " + fieldLabel + " looks unrealistic. Enter a number up to " + max + ".");
      return false;
    }
    return true;
  }

  function clampOrDefault(value, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return value;
  }

  // ------------------------------------------------------------
  // 6) DEFAULTS (SET ONLY IF EMPTY)
  // ------------------------------------------------------------
  function setDefaultIfEmpty(inputEl, valueStr) {
    if (!inputEl) return;
    const current = (inputEl.value || "").trim();
    if (current === "") inputEl.value = valueStr;
  }

  setDefaultIfEmpty(allowanceKg, "23");
  setDefaultIfEmpty(emptyBagKg, "3");
  setDefaultIfEmpty(bufferKg, "1");
  setDefaultIfEmpty(otherKg, "0");

  setDefaultIfEmpty(wTshirt, "0.20");
  setDefaultIfEmpty(wPants, "0.60");
  setDefaultIfEmpty(wUnderwearPair, "0.10");
  setDefaultIfEmpty(wJacket, "0.80");
  setDefaultIfEmpty(wShoesPair, "1.20");
  setDefaultIfEmpty(wToiletriesBag, "1.00");
  setDefaultIfEmpty(wLaptop, "2.00");
  setDefaultIfEmpty(wChargersPouch, "0.50");

  // Advanced toggle behaviour
  if (showAdvancedWeights && advancedWeights) {
    function syncAdvancedVisibility() {
      const on = !!showAdvancedWeights.checked;
      advancedWeights.classList.toggle("hidden", !on);
      advancedWeights.setAttribute("aria-hidden", on ? "false" : "true");
      clearResult();
    }
    syncAdvancedVisibility();
    showAdvancedWeights.addEventListener("change", syncAdvancedVisibility);
  }

  // ------------------------------------------------------------
  // 7) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required core inputs
      const allowance = toNumber(allowanceKg ? allowanceKg.value : "");
      const bagEmpty = toNumber(emptyBagKg ? emptyBagKg.value : "");
      const buffer = toNumber(bufferKg ? bufferKg.value : "");

      // Parse counts (missing counts become 0)
      const nTshirts = toNumber(tshirtsCount ? tshirtsCount.value : "");
      const nPants = toNumber(pantsCount ? pantsCount.value : "");
      const nUnderwearPairs = toNumber(underwearPairs ? underwearPairs.value : "");
      const nJackets = toNumber(jacketsCount ? jacketsCount.value : "");
      const nShoesPairs = toNumber(shoesPairs ? shoesPairs.value : "");
      const nToiletries = toNumber(toiletriesBags ? toiletriesBags.value : "");
      const nLaptops = toNumber(laptopsCount ? laptopsCount.value : "");
      const nChargers = toNumber(chargersCount ? chargersCount.value : "");
      const other = toNumber(otherKg ? otherKg.value : "");

      // Parse weights (defaults if missing)
      const wtTshirt = clampOrDefault(toNumber(wTshirt ? wTshirt.value : ""), 0.2);
      const wtPants = clampOrDefault(toNumber(wPants ? wPants.value : ""), 0.6);
      const wtUnderwearPair = clampOrDefault(toNumber(wUnderwearPair ? wUnderwearPair.value : ""), 0.1);
      const wtJacket = clampOrDefault(toNumber(wJacket ? wJacket.value : ""), 0.8);
      const wtShoesPair = clampOrDefault(toNumber(wShoesPair ? wShoesPair.value : ""), 1.2);
      const wtToiletries = clampOrDefault(toNumber(wToiletriesBag ? wToiletriesBag.value : ""), 1.0);
      const wtLaptop = clampOrDefault(toNumber(wLaptop ? wLaptop.value : ""), 2.0);
      const wtChargers = clampOrDefault(toNumber(wChargersPouch ? wChargersPouch.value : ""), 0.5);

      // Validation
      if (!validatePositive(allowance, "airline baggage allowance (kg)")) return;
      if (!validateNonNegative(bagEmpty, "empty bag weight (kg)")) return;
      if (!validateNonNegative(buffer, "safety buffer (kg)")) return;

      if (!validateCount(nTshirts, "T-shirts / tops count", 60)) return;
      if (!validateCount(nPants, "pants / jeans count", 30)) return;
      if (!validateCount(nUnderwearPairs, "underwear and socks pairs", 80)) return;
      if (!validateCount(nJackets, "jackets / hoodies count", 10)) return;
      if (!validateCount(nShoesPairs, "shoes pairs", 10)) return;
      if (!validateCount(nToiletries, "toiletry bags count", 6)) return;
      if (!validateCount(nLaptops, "laptops count", 3)) return;
      if (!validateCount(nChargers, "chargers / adapters pouches count", 6)) return;

      if (!validateNonNegative(other, "other items (kg)")) return;

      // Validate advanced weights if advanced is shown (or if user changed them)
      const weightFields = [
        { v: wtTshirt, name: "T-shirt weight" },
        { v: wtPants, name: "pants weight" },
        { v: wtUnderwearPair, name: "underwear and socks weight" },
        { v: wtJacket, name: "jacket weight" },
        { v: wtShoesPair, name: "shoes weight" },
        { v: wtToiletries, name: "toiletry bag weight" },
        { v: wtLaptop, name: "laptop weight" },
        { v: wtChargers, name: "chargers pouch weight" }
      ];

      for (let i = 0; i < weightFields.length; i++) {
        if (!Number.isFinite(weightFields[i].v) || weightFields[i].v <= 0) {
          setResultError("Enter a valid " + weightFields[i].name + " greater than 0.");
          return;
        }
        if (weightFields[i].v > 10) {
          setResultError("That " + weightFields[i].name + " looks too high. Use a realistic per-item kg value.");
          return;
        }
      }

      // Calculation
      const itemsKg =
        (nTshirts * wtTshirt) +
        (nPants * wtPants) +
        (nUnderwearPairs * wtUnderwearPair) +
        (nJackets * wtJacket) +
        (nShoesPairs * wtShoesPair) +
        (nToiletries * wtToiletries) +
        (nLaptops * wtLaptop) +
        (nChargers * wtChargers) +
        other;

      const estimatedTotal = bagEmpty + itemsKg;

      const effectiveLimit = Math.max(0, allowance - buffer);
      const marginToEffective = effectiveLimit - estimatedTotal; // positive is good
      const strictMargin = allowance - estimatedTotal;

      let statusLine = "";
      let actionLine = "";

      if (marginToEffective >= 0) {
        statusLine = "<p><strong>Status:</strong> Likely under the limit (with buffer).</p>";
        actionLine =
          "<p><strong>Estimated margin (with buffer):</strong> " +
          formatNumberTwoDecimals(marginToEffective) +
          " kg</p>";
      } else {
        const overweight = Math.abs(marginToEffective);
        statusLine = "<p><strong>Status:</strong> Likely overweight (after buffer).</p>";
        actionLine =
          "<p><strong>Estimated overweight (with buffer):</strong> " +
          formatNumberTwoDecimals(overweight) +
          " kg</p>" +
          "<p><strong>Target:</strong> Remove or shift at least " +
          formatNumberTwoDecimals(overweight) +
          " kg from this bag.</p>";
      }

      const resultHtml =
        "<p><strong>Estimated total bag weight:</strong> " + formatNumberTwoDecimals(estimatedTotal) + " kg</p>" +
        "<p><strong>Airline allowance:</strong> " + formatNumberTwoDecimals(allowance) + " kg</p>" +
        "<p><strong>Safety buffer used:</strong> " + formatNumberTwoDecimals(buffer) + " kg</p>" +
        "<p><strong>Effective limit (allowance minus buffer):</strong> " + formatNumberTwoDecimals(effectiveLimit) + " kg</p>" +
        statusLine +
        actionLine +
        "<p><strong>Strict margin (no buffer):</strong> " + formatNumberTwoDecimals(strictMargin) + " kg</p>" +
        "<p><strong>What this means:</strong> This is a packing estimate. If you are close to the limit, weigh the bag at home or keep extra buffer to reduce the risk of airport surprises.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 8) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Baggage Weight Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
