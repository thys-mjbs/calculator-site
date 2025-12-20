document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const portfolioValue = document.getElementById("portfolioValue");
  const autoNormalize = document.getElementById("autoNormalize");
  const tradeCostPct = document.getElementById("tradeCostPct");

  const amtStocks = document.getElementById("amtStocks");
  const amtBonds = document.getElementById("amtBonds");
  const amtCash = document.getElementById("amtCash");
  const amtReits = document.getElementById("amtReits");
  const amtAlts = document.getElementById("amtAlts");

  const pctStocks = document.getElementById("pctStocks");
  const pctBonds = document.getElementById("pctBonds");
  const pctCash = document.getElementById("pctCash");
  const pctReits = document.getElementById("pctReits");
  const pctAlts = document.getElementById("pctAlts");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Amount-like inputs
  attachLiveFormatting(portfolioValue);
  attachLiveFormatting(amtStocks);
  attachLiveFormatting(amtBonds);
  attachLiveFormatting(amtCash);
  attachLiveFormatting(amtReits);
  attachLiveFormatting(amtAlts);

  // Optional: still safe to format with commas (won't add commas unless large)
  attachLiveFormatting(pctStocks);
  attachLiveFormatting(pctBonds);
  attachLiveFormatting(pctCash);
  attachLiveFormatting(pctReits);
  attachLiveFormatting(pctAlts);
  attachLiveFormatting(tradeCostPct);

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
  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validatePercentNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    if (value > 1000) {
      setResultError(fieldLabel + " looks too large. Enter a percentage like 60, not 6000.");
      return false;
    }
    return true;
  }

  function formatPctTwo(value) {
    return formatNumberTwoDecimals(value) + "%";
  }

  function formatMoneyTwo(value) {
    return formatNumberTwoDecimals(value);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const pv = toNumber(portfolioValue ? portfolioValue.value : "");
      const costPct = toNumber(tradeCostPct ? tradeCostPct.value : "");

      const aStocks = toNumber(amtStocks ? amtStocks.value : "");
      const aBonds = toNumber(amtBonds ? amtBonds.value : "");
      const aCash = toNumber(amtCash ? amtCash.value : "");
      const aReits = toNumber(amtReits ? amtReits.value : "");
      const aAlts = toNumber(amtAlts ? amtAlts.value : "");

      let pStocks = toNumber(pctStocks ? pctStocks.value : "");
      let pBonds = toNumber(pctBonds ? pctBonds.value : "");
      let pCash = toNumber(pctCash ? pctCash.value : "");
      let pReits = toNumber(pctReits ? pctReits.value : "");
      let pAlts = toNumber(pctAlts ? pctAlts.value : "");

      // Validation: amounts
      if (
        !validateNonNegative(aStocks, "Stocks amount") ||
        !validateNonNegative(aBonds, "Bonds amount") ||
        !validateNonNegative(aCash, "Cash amount") ||
        !validateNonNegative(aReits, "Real Estate / REITs amount") ||
        !validateNonNegative(aAlts, "Alternatives amount")
      ) {
        return;
      }

      if (!validateNonNegative(costPct, "Estimated transaction cost")) return;
      if (costPct > 25) {
        setResultError("Transaction cost % looks unusually high. Enter a more realistic value, or leave it at 0.");
        return;
      }

      // Determine portfolio total
      const sumAmounts = aStocks + aBonds + aCash + aReits + aAlts;
      let total = Number.isFinite(pv) && pv > 0 ? pv : sumAmounts;

      if (!Number.isFinite(total) || total <= 0) {
        setResultError("Enter at least one current amount, or provide a portfolio value greater than 0.");
        return;
      }

      // If portfolio value provided but amounts sum to 0, allocation can't be computed per bucket
      const hasAnyAmount = sumAmounts > 0;

      // Parse and validate target percentages (optional but required for rebalance plan)
      const pctInputs = [pStocks, pBonds, pCash, pReits, pAlts];
      const pctLabels = ["Stocks target %", "Bonds target %", "Cash target %", "Real Estate / REITs target %", "Alternatives target %"];

      for (let i = 0; i < pctInputs.length; i++) {
        if (!validatePercentNonNegative(pctInputs[i], pctLabels[i])) return;
      }

      const pctSum = pStocks + pBonds + pCash + pReits + pAlts;

      if (!Number.isFinite(pctSum) || pctSum <= 0) {
        setResultError("Enter at least one target percentage greater than 0.");
        return;
      }

      const doNormalize = autoNormalize ? !!autoNormalize.checked : true;

      if (!doNormalize) {
        const rounded = Math.round(pctSum * 100) / 100;
        if (rounded !== 100) {
          setResultError("Your target percentages must add up to 100%. They currently add up to " + formatNumberTwoDecimals(pctSum) + "%.");
          return;
        }
      } else {
        // Normalize to 100 while preserving ratios
        const factor = 100 / pctSum;
        pStocks = pStocks * factor;
        pBonds = pBonds * factor;
        pCash = pCash * factor;
        pReits = pReits * factor;
        pAlts = pAlts * factor;
      }

      // Build buckets
      const buckets = [
        { key: "Stocks", amount: aStocks, targetPct: pStocks },
        { key: "Bonds", amount: aBonds, targetPct: pBonds },
        { key: "Cash", amount: aCash, targetPct: pCash },
        { key: "Real Estate / REITs", amount: aReits, targetPct: pReits },
        { key: "Alternatives", amount: aAlts, targetPct: pAlts }
      ];

      // Compute current allocations (if we have any amount data)
      buckets.forEach(function (b) {
        b.currentPct = hasAnyAmount ? (b.amount / total) * 100 : NaN;
        b.targetAmount = (b.targetPct / 100) * total;
        b.delta = b.targetAmount - b.amount; // positive = buy, negative = sell
      });

      // Compute trade summary
      let totalBuys = 0;
      let totalSells = 0;
      let largestUnder = null;
      let largestOver = null;

      buckets.forEach(function (b) {
        if (b.delta > 0) totalBuys += b.delta;
        if (b.delta < 0) totalSells += Math.abs(b.delta);

        if (!largestUnder || b.delta > largestUnder.delta) largestUnder = b;
        if (!largestOver || b.delta < largestOver.delta) largestOver = b;
      });

      const tradeValueEstimate = (totalBuys + totalSells) / 2; // ideal matched trades
      const estimatedCost = (costPct / 100) * tradeValueEstimate;

      // Result HTML
      let resultHtml = "";

      resultHtml += `<p><strong>Portfolio total used:</strong> ${formatMoneyTwo(total)}</p>`;

      if (!Number.isFinite(pv) || pv <= 0) {
        resultHtml += `<p><strong>Note:</strong> Total was calculated from your amounts (you did not enter a portfolio value).</p>`;
      } else if (hasAnyAmount && Math.abs(sumAmounts - total) / total > 0.02) {
        resultHtml += `<p><strong>Note:</strong> Your entered portfolio value differs from the sum of amounts. Calculations use your entered portfolio value.</p>`;
      } else if (!hasAnyAmount) {
        resultHtml += `<p><strong>Note:</strong> You entered a portfolio value but all current amounts are 0, so current allocation percentages will show as “n/a”. Enter amounts for a true current allocation.</p>`;
      }

      resultHtml += `<table class="results-table" aria-label="Allocation and rebalance table">
        <thead>
          <tr>
            <th>Asset</th>
            <th class="num">Current</th>
            <th class="num">Current %</th>
            <th class="num">Target %</th>
            <th class="num">Target</th>
            <th class="num">Action</th>
          </tr>
        </thead>
        <tbody>
      `;

      buckets.forEach(function (b) {
        const currentPctText = hasAnyAmount ? formatPctTwo(b.currentPct) : "n/a";
        const actionText = b.delta >= 0
          ? `Buy ${formatMoneyTwo(b.delta)}`
          : `Sell ${formatMoneyTwo(Math.abs(b.delta))}`;

        resultHtml += `<tr>
          <td>${b.key}</td>
          <td class="num">${formatMoneyTwo(b.amount)}</td>
          <td class="num">${currentPctText}</td>
          <td class="num">${formatPctTwo(b.targetPct)}</td>
          <td class="num">${formatMoneyTwo(b.targetAmount)}</td>
          <td class="num">${actionText}</td>
        </tr>`;
      });

      resultHtml += `</tbody></table>`;

      // Secondary insights
      const buysText = formatMoneyTwo(totalBuys);
      const sellsText = formatMoneyTwo(totalSells);

      resultHtml += `<p><strong>Rebalance summary:</strong></p>
        <ul>
          <li><strong>Total to buy (across underweight buckets):</strong> ${buysText}</li>
          <li><strong>Total to sell (across overweight buckets):</strong> ${sellsText}</li>
          <li><strong>Most underweight bucket:</strong> ${largestUnder ? largestUnder.key : "n/a"}</li>
          <li><strong>Most overweight bucket:</strong> ${largestOver ? largestOver.key : "n/a"}</li>
        </ul>
      `;

      if (costPct > 0) {
        resultHtml += `<p><strong>Estimated transaction cost:</strong> ${formatMoneyTwo(estimatedCost)} (based on ~${formatMoneyTwo(tradeValueEstimate)} of trade value at ${formatPctTwo(costPct)}).</p>`;
      } else {
        resultHtml += `<p><strong>Transaction cost:</strong> Not included (set to 0%).</p>`;
      }

      resultHtml += `<p><strong>Practical tip:</strong> If you are adding new money, consider directing contributions to the “Buy” buckets first to reduce or avoid selling.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Portfolio Allocation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
