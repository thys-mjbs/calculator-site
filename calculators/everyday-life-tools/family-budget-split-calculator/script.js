document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalExpenses = document.getElementById("totalExpenses");

  const splitMethod = document.getElementById("splitMethod");
  const modeIncome = document.getElementById("modeIncome");
  const modeEqual = document.getElementById("modeEqual");

  const person1Income = document.getElementById("person1Income");
  const person2Income = document.getElementById("person2Income");
  const person3Income = document.getElementById("person3Income");
  const person4Income = document.getElementById("person4Income");

  const peopleCount = document.getElementById("peopleCount");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(totalExpenses);
  attachLiveFormatting(person1Income);
  attachLiveFormatting(person2Income);
  attachLiveFormatting(person3Income);
  attachLiveFormatting(person4Income);
  attachLiveFormatting(peopleCount);

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
    if (modeIncome) modeIncome.classList.add("hidden");
    if (modeEqual) modeEqual.classList.add("hidden");

    if (mode === "income" && modeIncome) modeIncome.classList.remove("hidden");
    if (mode === "equal" && modeEqual) modeEqual.classList.remove("hidden");

    clearResult();
  }

  if (splitMethod) {
    showMode(splitMethod.value);
    splitMethod.addEventListener("change", function () {
      showMode(splitMethod.value);
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

  function validateWholeNumber(value, fieldLabel) {
    if (!Number.isFinite(value) || value % 1 !== 0) {
      setResultError("Enter a whole number for " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = splitMethod ? splitMethod.value : "income";

      const expenses = toNumber(totalExpenses ? totalExpenses.value : "");
      if (!validatePositive(expenses, "total shared monthly expenses")) return;

      // Helpful constants for "feel" conversions
      const weeksPerMonth = 52 / 12; // ~4.33
      const daysPerMonth = 365 / 12; // ~30.42

      if (mode === "equal") {
        const n = toNumber(peopleCount ? peopleCount.value : "");
        if (!validatePositive(n, "number of people")) return;
        if (!validateWholeNumber(n, "number of people")) return;
        if (n < 2) {
          setResultError("Enter at least 2 people for an equal split.");
          return;
        }
        if (n > 10) {
          setResultError("Enter 10 or fewer people to keep the split practical.");
          return;
        }

        const perPerson = expenses / n;

        const perWeek = perPerson / weeksPerMonth;
        const perDay = perPerson / daysPerMonth;

        const resultHtml =
          `<p><strong>Monthly amount per person:</strong> ${formatNumberTwoDecimals(perPerson)}</p>` +
          `<p><strong>Total shared monthly expenses:</strong> ${formatNumberTwoDecimals(expenses)}</p>` +
          `<p><strong>People sharing:</strong> ${n}</p>` +
          `<hr />` +
          `<p><strong>Quick equivalents (per person):</strong></p>` +
          `<ul>` +
          `<li>Per week (approx.): ${formatNumberTwoDecimals(perWeek)}</li>` +
          `<li>Per day (approx.): ${formatNumberTwoDecimals(perDay)}</li>` +
          `</ul>` +
          `<p><strong>Split logic:</strong> Equal split. Everyone pays the same amount.</p>`;

        setResultSuccess(resultHtml);
        return;
      }

      // Income-based split
      const incomesRaw = [
        { label: "Person 1", value: toNumber(person1Income ? person1Income.value : "") },
        { label: "Person 2", value: toNumber(person2Income ? person2Income.value : "") },
        { label: "Person 3", value: toNumber(person3Income ? person3Income.value : "") },
        { label: "Person 4", value: toNumber(person4Income ? person4Income.value : "") }
      ];

      // Keep only filled incomes (positive numbers)
      const incomes = incomesRaw.filter(function (p) {
        return Number.isFinite(p.value) && p.value > 0;
      });

      if (incomes.length < 2) {
        setResultError("Enter at least two monthly incomes (greater than 0) for an income-based split.");
        return;
      }

      // Validate no negative/zero entered in visible fields when present
      const allFields = [person1Income, person2Income, person3Income, person4Income];
      for (let i = 0; i < allFields.length; i++) {
        const el = allFields[i];
        if (!el) continue;
        const v = toNumber(el.value);
        if (el.value && (!Number.isFinite(v) || v < 0)) {
          setResultError("Enter valid monthly incomes (0 or higher). Leave unused people blank.");
          return;
        }
      }

      const totalIncome = incomes.reduce(function (sum, p) {
        return sum + p.value;
      }, 0);

      if (!Number.isFinite(totalIncome) || totalIncome <= 0) {
        setResultError("Total income must be greater than 0.");
        return;
      }

      // Build rows
      let rowsHtml = "";
      let anyNegativeRemainder = false;

      for (let i = 0; i < incomes.length; i++) {
        const share = incomes[i].value / totalIncome;
        const payment = expenses * share;
        const remainder = incomes[i].value - payment;

        if (remainder < 0) anyNegativeRemainder = true;

        const paymentPerWeek = payment / weeksPerMonth;

        rowsHtml +=
          `<tr>` +
          `<td>${incomes[i].label}</td>` +
          `<td>${formatNumberTwoDecimals(incomes[i].value)}</td>` +
          `<td>${(share * 100).toFixed(2)}%</td>` +
          `<td>${formatNumberTwoDecimals(payment)}</td>` +
          `<td>${formatNumberTwoDecimals(paymentPerWeek)}</td>` +
          `<td>${formatNumberTwoDecimals(remainder)}</td>` +
          `</tr>`;
      }

      const warningHtml = anyNegativeRemainder
        ? `<p><strong>Note:</strong> One or more people would have a negative remainder after paying their share. This usually means the expense total is too high for the incomes entered, or the incomes are not monthly figures.</p>`
        : "";

      const resultHtml =
        `<p><strong>Total shared monthly expenses:</strong> ${formatNumberTwoDecimals(expenses)}</p>` +
        `<p><strong>Total monthly income used:</strong> ${formatNumberTwoDecimals(totalIncome)}</p>` +
        `<hr />` +
        `<p><strong>Income-based split (proportional):</strong></p>` +
        `<div class="result-table-wrap">` +
        `<table class="result-table">` +
        `<thead>` +
        `<tr>` +
        `<th>Person</th>` +
        `<th>Monthly income</th>` +
        `<th>Share</th>` +
        `<th>Monthly payment</th>` +
        `<th>Payment per week (approx.)</th>` +
        `<th>Income left after share</th>` +
        `</tr>` +
        `</thead>` +
        `<tbody>${rowsHtml}</tbody>` +
        `</table>` +
        `</div>` +
        warningHtml +
        `<p><strong>Split logic:</strong> Each person pays the same percentage of shared expenses as their percentage of total household income.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Family Budget Split Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
