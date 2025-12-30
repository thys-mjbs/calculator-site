document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const amountInput = document.getElementById("amountInput");
  const fromUnitSelect = document.getElementById("fromUnitSelect");
  const toUnitSelect = document.getElementById("toUnitSelect");
  const ingredientSelect = document.getElementById("ingredientSelect");
  const gramsPerCupInput = document.getElementById("gramsPerCupInput");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Amount and custom grams per cup can benefit from comma formatting
  attachLiveFormatting(amountInput);
  attachLiveFormatting(gramsPerCupInput);

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
  // Conversion helpers
  // ------------------------------------------------------------
  const VOLUME_UNITS = {
    tsp: { label: "teaspoons", toMl: 4.92892159375 },
    tbsp: { label: "tablespoons", toMl: 14.78676478125 },
    cup: { label: "cups", toMl: 236.5882365 },
    ml: { label: "milliliters", toMl: 1 }
  };

  const WEIGHT_UNITS = {
    g: { label: "grams", toG: 1 },
    kg: { label: "kilograms", toG: 1000 },
    oz: { label: "ounces", toG: 28.349523125 },
    lb: { label: "pounds", toG: 453.59237 }
  };

  // Typical grams per US cup (approximate but common kitchen references)
  const INGREDIENTS = {
    flour_ap: { name: "All-purpose flour", gramsPerCup: 120 },
    sugar_gran: { name: "Granulated sugar", gramsPerCup: 200 },
    sugar_brown: { name: "Brown sugar (packed)", gramsPerCup: 220 },
    butter: { name: "Butter", gramsPerCup: 227 },
    cocoa: { name: "Cocoa powder", gramsPerCup: 85 },
    oats: { name: "Rolled oats", gramsPerCup: 90 },
    honey: { name: "Honey", gramsPerCup: 340 },
    water: { name: "Water", gramsPerCup: 236.5882365 },
    milk: { name: "Milk", gramsPerCup: 245 }
  };

  function isVolumeUnit(unit) {
    return Object.prototype.hasOwnProperty.call(VOLUME_UNITS, unit);
  }

  function isWeightUnit(unit) {
    return Object.prototype.hasOwnProperty.call(WEIGHT_UNITS, unit);
  }

  function toMl(amount, unit) {
    return amount * VOLUME_UNITS[unit].toMl;
  }

  function fromMl(ml, unit) {
    return ml / VOLUME_UNITS[unit].toMl;
  }

  function toG(amount, unit) {
    return amount * WEIGHT_UNITS[unit].toG;
  }

  function fromG(g, unit) {
    return g / WEIGHT_UNITS[unit].toG;
  }

  function buildSecondaryLine(label, value, unitShort) {
    return `<li><strong>${label}:</strong> ${formatNumberTwoDecimals(value)} ${unitShort}</li>`;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!amountInput || !fromUnitSelect || !toUnitSelect || !ingredientSelect) return;

      const amount = toNumber(amountInput.value);
      const fromUnit = (fromUnitSelect.value || "").trim();
      const toUnit = (toUnitSelect.value || "").trim();
      const ingredientKey = (ingredientSelect.value || "").trim();

      if (!validatePositive(amount, "amount")) return;

      if (!fromUnit || !toUnit) {
        setResultError("Choose both a from unit and a to unit.");
        return;
      }

      const fromIsVol = isVolumeUnit(fromUnit);
      const toIsVol = isVolumeUnit(toUnit);
      const fromIsWt = isWeightUnit(fromUnit);
      const toIsWt = isWeightUnit(toUnit);

      if ((!fromIsVol && !fromIsWt) || (!toIsVol && !toIsWt)) {
        setResultError("Choose valid units to convert between.");
        return;
      }

      const crossType = (fromIsVol && toIsWt) || (fromIsWt && toIsVol);

      // Resolve grams per cup if needed
      let gramsPerCup = null;
      let ingredientName = null;

      if (crossType) {
        if (!ingredientKey || !Object.prototype.hasOwnProperty.call(INGREDIENTS, ingredientKey)) {
          setResultError("Choose an ingredient for volume to weight conversions.");
          return;
        }

        ingredientName = INGREDIENTS[ingredientKey].name;
        gramsPerCup = INGREDIENTS[ingredientKey].gramsPerCup;

        const customGpc = toNumber(gramsPerCupInput ? gramsPerCupInput.value : "");
        if (Number.isFinite(customGpc) && customGpc > 0) {
          gramsPerCup = customGpc;
        }

        if (!Number.isFinite(gramsPerCup) || gramsPerCup <= 0) {
          setResultError("Enter a valid custom grams per cup value, or leave it blank.");
          return;
        }
      }

      // Perform conversion
      let converted = null;

      if (!crossType) {
        // Same type conversions
        if (fromIsVol && toIsVol) {
          const ml = toMl(amount, fromUnit);
          converted = fromMl(ml, toUnit);
        } else {
          const g = toG(amount, fromUnit);
          converted = fromG(g, toUnit);
        }
      } else {
        // Cross type conversions using ingredient density (grams per mL)
        const gramsPerMl = gramsPerCup / VOLUME_UNITS.cup.toMl;

        if (fromIsVol && toIsWt) {
          const ml = toMl(amount, fromUnit);
          const g = ml * gramsPerMl;
          converted = fromG(g, toUnit);
        } else if (fromIsWt && toIsVol) {
          const g = toG(amount, fromUnit);
          const ml = g / gramsPerMl;
          converted = fromMl(ml, toUnit);
        }
      }

      if (!Number.isFinite(converted) || converted <= 0) {
        setResultError("Could not calculate a valid conversion from the values provided.");
        return;
      }

      // Secondary insights
      const secondary = [];
      if (toIsWt || fromIsWt || crossType) {
        // Build weight equivalents (in g and oz) based on the converted value in grams
        let gramsEquivalent = null;
        if (toIsWt) {
          gramsEquivalent = toG(converted, toUnit);
        } else if (fromIsWt) {
          gramsEquivalent = toG(amount, fromUnit);
        } else if (crossType && fromIsVol) {
          const gramsPerMl = gramsPerCup / VOLUME_UNITS.cup.toMl;
          gramsEquivalent = toMl(amount, fromUnit) * gramsPerMl;
        } else if (crossType && fromIsWt) {
          gramsEquivalent = toG(amount, fromUnit);
        }

        if (Number.isFinite(gramsEquivalent) && gramsEquivalent > 0) {
          secondary.push(buildSecondaryLine("Grams", gramsEquivalent, "g"));
          secondary.push(buildSecondaryLine("Ounces", fromG(gramsEquivalent, "oz"), "oz"));
        }
      }

      if (toIsVol || fromIsVol || crossType) {
        // Build volume equivalents (in cups and mL) based on the converted value in mL
        let mlEquivalent = null;
        if (toIsVol) {
          mlEquivalent = toMl(converted, toUnit);
        } else if (fromIsVol) {
          mlEquivalent = toMl(amount, fromUnit);
        } else if (crossType && fromIsWt) {
          const gramsPerMl = gramsPerCup / VOLUME_UNITS.cup.toMl;
          mlEquivalent = toG(amount, fromUnit) / gramsPerMl;
        } else if (crossType && fromIsVol) {
          mlEquivalent = toMl(amount, fromUnit);
        }

        if (Number.isFinite(mlEquivalent) && mlEquivalent > 0) {
          secondary.push(buildSecondaryLine("Milliliters", mlEquivalent, "mL"));
          secondary.push(buildSecondaryLine("Cups", fromMl(mlEquivalent, "cup"), "cups"));
          secondary.push(buildSecondaryLine("Tablespoons", fromMl(mlEquivalent, "tbsp"), "tbsp"));
          secondary.push(buildSecondaryLine("Teaspoons", fromMl(mlEquivalent, "tsp"), "tsp"));
        }
      }

      const fromLabel = fromIsVol ? VOLUME_UNITS[fromUnit].label : WEIGHT_UNITS[fromUnit].label;
      const toLabel = toIsVol ? VOLUME_UNITS[toUnit].label : WEIGHT_UNITS[toUnit].label;

      let contextLine = "";
      if (crossType && ingredientName) {
        contextLine = `<p><strong>Ingredient:</strong> ${ingredientName} (using ${formatNumberTwoDecimals(gramsPerCup)} g per cup)</p>`;
      } else {
        contextLine = `<p><strong>Ingredient:</strong> Not required for this conversion</p>`;
      }

      const resultHtml = `
        <p><strong>Converted amount:</strong> ${formatNumberTwoDecimals(converted)} ${toLabel}</p>
        <p><strong>From:</strong> ${formatNumberTwoDecimals(amount)} ${fromLabel}</p>
        ${contextLine}
        <p><strong>Useful equivalents:</strong></p>
        <ul class="result-list">
          ${secondary.join("")}
        </ul>
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
      const message = "Baking Conversion Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
