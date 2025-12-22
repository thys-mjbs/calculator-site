document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const minValueInput = document.getElementById("minValue");
  const maxValueInput = document.getElementById("maxValue");
  const quantityInput = document.getElementById("quantity");
  const uniqueOnlyCheckbox = document.getElementById("uniqueOnly");
  const sortResultsCheckbox = document.getElementById("sortResults");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(minValueInput);
  attachLiveFormatting(maxValueInput);
  attachLiveFormatting(quantityInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositiveInteger(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number greater than 0.");
      return false;
    }
    return true;
  }

  function validateInteger(value, fieldLabel) {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number.");
      return false;
    }
    return true;
  }

  function randomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ------------------------------------------------------------
  // 5) MAIN GENERATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!minValueInput || !maxValueInput) return;

      const minVal = toNumber(minValueInput.value);
      const maxVal = toNumber(maxValueInput.value);

      if (!validateInteger(minVal, "minimum")) return;
      if (!validateInteger(maxVal, "maximum")) return;

      if (minVal > maxVal) {
        setResultError("Minimum must be less than or equal to maximum.");
        return;
      }

      let qtyRaw = 1;
      if (quantityInput && String(quantityInput.value || "").trim() !== "") {
        qtyRaw = toNumber(quantityInput.value);
      }

      const quantity = Number.isFinite(qtyRaw) ? Math.trunc(qtyRaw) : NaN;

      if (!validatePositiveInteger(quantity, "quantity")) return;

      const uniqueOnly = !!(uniqueOnlyCheckbox && uniqueOnlyCheckbox.checked);
      const sortResults = !!(sortResultsCheckbox && sortResultsCheckbox.checked);

      const rangeSize = maxVal - minVal + 1;

      if (uniqueOnly && quantity > rangeSize) {
        setResultError(
          "You asked for " +
            quantity +
            " unique numbers, but your range only has " +
            rangeSize +
            " possible values. Increase the range or allow repeats."
        );
        return;
      }

      const results = [];

      if (quantity === 1) {
        results.push(randomIntInclusive(minVal, maxVal));
      } else {
        if (!uniqueOnly) {
          for (let i = 0; i < quantity; i++) {
            results.push(randomIntInclusive(minVal, maxVal));
          }
        } else {
          const used = new Set();
          while (results.length < quantity) {
            const n = randomIntInclusive(minVal, maxVal);
            if (!used.has(n)) {
              used.add(n);
              results.push(n);
            }
          }
        }
      }

      if (sortResults && results.length > 1) {
        results.sort(function (a, b) {
          return a - b;
        });
      }

      const formattedMin = formatInputWithCommas(String(minVal));
      const formattedMax = formatInputWithCommas(String(maxVal));
      const formattedRangeSize = formatInputWithCommas(String(rangeSize));

      let mainOutputHtml = "";

      if (results.length === 1) {
        mainOutputHtml = `<p><strong>Random number:</strong> ${formatInputWithCommas(String(results[0]))}</p>`;
      } else {
        const items = results
          .map(function (n) {
            return `<li>${formatInputWithCommas(String(n))}</li>`;
          })
          .join("");
        mainOutputHtml = `
          <p><strong>Random numbers:</strong></p>
          <ul class="result-list">${items}</ul>
        `;
      }

      const modeText = uniqueOnly ? "Unique (no repeats)" : "Repeats allowed";
      const sortText = sortResults ? "Sorted ascending" : "Original random order";

      const expectedMidpoint = (minVal + maxVal) / 2;

      const resultHtml = `
        ${mainOutputHtml}
        <p><strong>Range:</strong> ${formattedMin} to ${formattedMax} (inclusive)</p>
        <p><strong>Possible values in range:</strong> ${formattedRangeSize}</p>
        <p><strong>Quantity:</strong> ${formatInputWithCommas(String(quantity))}</p>
        <p><strong>Selection rules:</strong> ${modeText}; ${sortText}</p>
        <p><strong>Quick check:</strong> The midpoint of your range is ${formatNumberTwoDecimals(expectedMidpoint)}. Over many runs, results tend to cluster around the middle.</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Random Number Generator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
