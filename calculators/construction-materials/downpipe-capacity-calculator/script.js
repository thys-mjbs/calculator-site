document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const roofAreaInput = document.getElementById("roofArea");
  const rainfallIntensityInput = document.getElementById("rainfallIntensity");
  const downpipeDiameterInput = document.getElementById("downpipeDiameter");
  const downpipeCountInput = document.getElementById("downpipeCount");

  // Optional advanced inputs
  const designVelocityInput = document.getElementById("designVelocity");
  const safetyFactorInput = document.getElementById("safetyFactor");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(roofAreaInput);
  attachLiveFormatting(rainfallIntensityInput);
  attachLiveFormatting(downpipeDiameterInput);
  attachLiveFormatting(downpipeCountInput);
  attachLiveFormatting(designVelocityInput);
  attachLiveFormatting(safetyFactorInput);

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

  function validateWholeNumberMin(value, fieldLabel, minValue) {
    if (!Number.isFinite(value) || value < minValue || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number (" + minValue + " or more).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const roofAreaM2 = toNumber(roofAreaInput ? roofAreaInput.value : "");
      const intensityMmPerHr = toNumber(rainfallIntensityInput ? rainfallIntensityInput.value : "");
      const diameterMm = toNumber(downpipeDiameterInput ? downpipeDiameterInput.value : "");
      const downpipeCountRaw = toNumber(downpipeCountInput ? downpipeCountInput.value : "");

      // Optional advanced with defaults
      const velocityInputVal = toNumber(designVelocityInput ? designVelocityInput.value : "");
      const safetyInputVal = toNumber(safetyFactorInput ? safetyFactorInput.value : "");

      const designVelocity = Number.isFinite(velocityInputVal) && velocityInputVal > 0 ? velocityInputVal : 3.0;
      const safetyFactor = Number.isFinite(safetyInputVal) && safetyInputVal > 0 ? safetyInputVal : 1.25;

      // Guards
      if (!roofAreaInput || !rainfallIntensityInput || !downpipeDiameterInput || !downpipeCountInput) return;

      // Validation
      if (!validatePositive(roofAreaM2, "roof area")) return;
      if (!validatePositive(intensityMmPerHr, "rainfall intensity")) return;
      if (!validatePositive(diameterMm, "downpipe diameter")) return;
      if (!validateWholeNumberMin(downpipeCountRaw, "number of downpipes", 1)) return;
      if (!validatePositive(designVelocity, "design velocity")) return;
      if (!validatePositive(safetyFactor, "safety factor")) return;

      // Sanity checks (non-hostile)
      if (roofAreaM2 > 10000) {
        setResultError("That roof area looks unusually large. Check that you entered m² for the roof section drained by these downpipes.");
        return;
      }
      if (intensityMmPerHr > 500) {
        setResultError("That rainfall intensity is extremely high. Check that you entered mm/hour (not mm/day).");
        return;
      }
      if (diameterMm < 40 || diameterMm > 250) {
        setResultError("Enter a downpipe diameter between 40 mm and 250 mm.");
        return;
      }
      if (designVelocity > 10) {
        setResultError("Design velocity above 10 m/s is not realistic for most downpipe systems. Enter a lower value.");
        return;
      }
      if (safetyFactor < 1.0 || safetyFactor > 3.0) {
        setResultError("Enter a safety factor between 1.0 and 3.0.");
        return;
      }

      const downpipeCount = downpipeCountRaw;

      // ------------------------------------------------------------
      // Calculation logic
      // ------------------------------------------------------------
      // Required roof runoff flow:
      // 1 mm on 1 m² = 1 liter
      // L/s = (area * mm/hr) / 3600
      const requiredFlowTotal_Lps = (roofAreaM2 * intensityMmPerHr) / 3600;

      // Downpipe capacity:
      // Q = A * v (m³/s), then convert to L/s by * 1000
      const diameterM = diameterMm / 1000;
      const areaPipe_m2 = (Math.PI * diameterM * diameterM) / 4;
      const theoreticalCapacity_Lps = areaPipe_m2 * designVelocity * 1000;

      // Apply safety factor (reduce usable capacity)
      const effectiveCapacityPerPipe_Lps = theoreticalCapacity_Lps / safetyFactor;
      const effectiveCapacityTotal_Lps = effectiveCapacityPerPipe_Lps * downpipeCount;

      const requiredPerPipe_Lps = requiredFlowTotal_Lps / downpipeCount;
      const utilization = effectiveCapacityTotal_Lps > 0 ? (requiredFlowTotal_Lps / effectiveCapacityTotal_Lps) * 100 : 0;

      // Recommendations
      const minDownpipes = effectiveCapacityPerPipe_Lps > 0
        ? Math.max(1, Math.ceil(requiredFlowTotal_Lps / effectiveCapacityPerPipe_Lps))
        : downpipeCount;

      // Minimum diameter to meet flow with current downpipe count:
      // required_total <= (A * v * 1000 / safety) * count
      // A >= required_total * safety / (v * 1000 * count)
      // d >= sqrt(4A/pi)
      const requiredArea_m2 = (requiredFlowTotal_Lps * safetyFactor) / (designVelocity * 1000 * downpipeCount);
      const minDiameter_m = requiredArea_m2 > 0 ? Math.sqrt((4 * requiredArea_m2) / Math.PI) : 0;
      const minDiameter_mm = minDiameter_m * 1000;

      // Status label
      let statusLabel = "Likely OK";
      let statusNote = "Your effective downpipe capacity is higher than the estimated peak roof flow under the inputs provided.";
      if (utilization > 100) {
        statusLabel = "High overflow risk";
        statusNote = "Estimated peak roof flow exceeds effective downpipe capacity. Overflow during heavy rain is likely unless other factors reduce flow.";
      } else if (utilization > 85) {
        statusLabel = "Tight margin";
        statusNote = "You have limited headroom. Small restrictions (debris, bends, inlet losses) may cause overflow during intense storms.";
      }

      // Format output
      const requiredTotalStr = formatNumberTwoDecimals(requiredFlowTotal_Lps);
      const requiredPerPipeStr = formatNumberTwoDecimals(requiredPerPipe_Lps);
      const effPerPipeStr = formatNumberTwoDecimals(effectiveCapacityPerPipe_Lps);
      const effTotalStr = formatNumberTwoDecimals(effectiveCapacityTotal_Lps);
      const utilizationStr = formatNumberTwoDecimals(utilization);

      const designVelocityStr = formatNumberTwoDecimals(designVelocity);
      const safetyFactorStr = formatNumberTwoDecimals(safetyFactor);

      const minDownpipesStr = String(minDownpipes);
      const minDiameterStr = formatNumberTwoDecimals(minDiameter_mm);

      let recommendationHtml = "";
      if (utilization > 100) {
        recommendationHtml = `
          <p><strong>Recommendation:</strong> Increase capacity. With your current assumptions, you would need about <strong>${minDownpipesStr}</strong> downpipes of <strong>${formatNumberTwoDecimals(diameterMm)} mm</strong>, or keep <strong>${downpipeCount}</strong> downpipes and increase diameter to about <strong>${minDiameterStr} mm</strong> (internal).</p>
        `;
      } else if (utilization > 85) {
        recommendationHtml = `
          <p><strong>Recommendation:</strong> You are close to the limit. Consider adding a downpipe, increasing diameter, or increasing maintenance (screens, cleaning) to protect against blockages.</p>
        `;
      } else {
        recommendationHtml = `
          <p><strong>Recommendation:</strong> Your setup has headroom for the inputs provided. If you still see overflow, the bottleneck may be the gutter outlet, bends, debris, or downstream drainage.</p>
        `;
      }

      const resultHtml = `
        <p><strong>Status:</strong> ${statusLabel}</p>
        <p>${statusNote}</p>

        <hr>

        <p><strong>Estimated required roof flow:</strong> ${requiredTotalStr} L/s</p>
        <p><strong>Required per downpipe:</strong> ${requiredPerPipeStr} L/s</p>

        <p><strong>Effective capacity per downpipe:</strong> ${effPerPipeStr} L/s</p>
        <p><strong>Total effective capacity:</strong> ${effTotalStr} L/s</p>

        <p><strong>Utilisation:</strong> ${utilizationStr}%</p>

        <hr>

        <p><strong>Assumptions used:</strong></p>
        <ul>
          <li>Design velocity: ${designVelocityStr} m/s</li>
          <li>Safety factor: ${safetyFactorStr}</li>
          <li>Roof runoff treated as 100% (typical roof assumption)</li>
        </ul>

        ${recommendationHtml}
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
      const message = "Downpipe Capacity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
