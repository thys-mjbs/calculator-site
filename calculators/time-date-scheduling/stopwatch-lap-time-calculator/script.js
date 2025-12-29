document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalTimeInput = document.getElementById("totalTime");
  const lapCountInput = document.getElementById("lapCount");
  const targetLapsInput = document.getElementById("targetLaps");
  const lapTimesInput = document.getElementById("lapTimes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense (counts only)
  attachLiveFormatting(lapCountInput);
  attachLiveFormatting(targetLapsInput);

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
  // 4) TIME PARSING + FORMATTING (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function parseTimeToSeconds(raw) {
    const str = (raw || "").trim();
    if (!str) return NaN;

    if (str.includes(":")) {
      const parts = str.split(":").map((p) => p.trim()).filter(Boolean);
      if (parts.length < 2 || parts.length > 3) return NaN;

      const nums = parts.map((p) => Number(p));
      if (nums.some((n) => !Number.isFinite(n))) return NaN;

      if (parts.length === 2) {
        const minutes = nums[0];
        const seconds = nums[1];
        if (minutes < 0 || seconds < 0 || seconds >= 60) return NaN;
        return minutes * 60 + seconds;
      }

      const hours = nums[0];
      const minutes = nums[1];
      const seconds = nums[2];
      if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return NaN;
      return hours * 3600 + minutes * 60 + seconds;
    }

    const seconds = toNumber(str);
    if (!Number.isFinite(seconds) || seconds < 0) return NaN;
    return seconds;
  }

  function pad2(n) {
    const s = String(Math.floor(Math.abs(n)));
    return s.length >= 2 ? s : "0" + s;
  }

  function formatSecondsToClock(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "";

    const rounded = Math.round(totalSeconds * 100) / 100;
    const whole = Math.floor(rounded);
    const frac = Math.round((rounded - whole) * 100);

    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const seconds = whole % 60;

    const secBase = pad2(seconds);
    const secWithFrac = frac > 0 ? secBase + "." + pad2(frac) : secBase;

    if (hours > 0) {
      return String(hours) + ":" + pad2(minutes) + ":" + secWithFrac;
    }

    return String(minutes) + ":" + secWithFrac;
  }

  function mean(values) {
    if (!values.length) return NaN;
    let sum = 0;
    for (let i = 0; i < values.length; i++) sum += values[i];
    return sum / values.length;
  }

  function stddev(values, avg) {
    if (values.length < 2) return 0;
    let sumSq = 0;
    for (let i = 0; i < values.length; i++) {
      const d = values[i] - avg;
      sumSq += d * d;
    }
    return Math.sqrt(sumSq / (values.length - 1));
  }

  function parseLapSplits(raw) {
    const str = (raw || "").trim();
    if (!str) return [];
    const parts = str.split(",").map((p) => p.trim()).filter(Boolean);
    const secs = [];
    for (let i = 0; i < parts.length; i++) {
      const s = parseTimeToSeconds(parts[i]);
      if (!Number.isFinite(s) || s < 0) return null;
      secs.push(s);
    }
    return secs;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!totalTimeInput || !lapCountInput || !targetLapsInput || !lapTimesInput) return;

      const lapSplitsRaw = (lapTimesInput.value || "").trim();
      const splits = parseLapSplits(lapSplitsRaw);

      // If splits provided, use them as source of truth
      if (lapSplitsRaw.length > 0) {
        if (splits === null || splits.length === 0) {
          setResultError("Enter valid lap splits separated by commas (e.g., 1:32, 1:28, 92.5).");
          return;
        }

        const laps = splits.length;
        const totalSeconds = splits.reduce((a, b) => a + b, 0);
        const avg = mean(splits);
        const fastest = Math.min.apply(null, splits);
        const slowest = Math.max.apply(null, splits);
        const spread = slowest - fastest;

        const sd = stddev(splits, avg);
        const cvPct = avg > 0 ? (sd / avg) * 100 : 0;

        const targetLaps = toNumber(targetLapsInput.value || "");
        const hasTarget = Number.isFinite(targetLaps) && targetLaps > 0;

        const projected = hasTarget ? avg * targetLaps : NaN;

        const resultHtml =
          `<p><strong>Average lap time:</strong> ${formatSecondsToClock(avg)}</p>` +
          `<p><strong>Total time (from splits):</strong> ${formatSecondsToClock(totalSeconds)}</p>` +
          `<p><strong>Laps counted:</strong> ${laps}</p>` +
          `<p><strong>Fastest lap:</strong> ${formatSecondsToClock(fastest)}</p>` +
          `<p><strong>Slowest lap:</strong> ${formatSecondsToClock(slowest)}</p>` +
          `<p><strong>Spread (slowest - fastest):</strong> ${formatSecondsToClock(spread)}</p>` +
          `<p><strong>Consistency (variation):</strong> ${formatNumberTwoDecimals(cvPct)}%</p>` +
          (hasTarget
            ? `<p><strong>Projected total for ${Math.round(targetLaps)} laps:</strong> ${formatSecondsToClock(projected)}</p>`
            : "");

        setResultSuccess(resultHtml);
        return;
      }

      // Default mode: total time + lap count
      const totalSeconds = parseTimeToSeconds(totalTimeInput.value || "");
      const lapsNum = toNumber(lapCountInput.value || "");

      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        setResultError("Enter a valid total elapsed time greater than 0 (hh:mm:ss, mm:ss, or seconds).");
        return;
      }

      if (!Number.isFinite(lapsNum) || lapsNum <= 0) {
        setResultError("Enter a valid number of laps greater than 0.");
        return;
      }

      const laps = Math.round(lapsNum);
      if (laps !== lapsNum) {
        setResultError("Number of laps should be a whole number.");
        return;
      }

      const avg = totalSeconds / laps;

      const targetLaps = toNumber(targetLapsInput.value || "");
      const hasTarget = Number.isFinite(targetLaps) && targetLaps > 0;
      const projected = hasTarget ? avg * targetLaps : NaN;

      const per10 = avg * 10;

      const resultHtml =
        `<p><strong>Average lap time:</strong> ${formatSecondsToClock(avg)}</p>` +
        `<p><strong>Total time:</strong> ${formatSecondsToClock(totalSeconds)}</p>` +
        `<p><strong>Laps:</strong> ${laps}</p>` +
        `<p><strong>Time per 10 laps (at this average):</strong> ${formatSecondsToClock(per10)}</p>` +
        (hasTarget
          ? `<p><strong>Projected total for ${Math.round(targetLaps)} laps:</strong> ${formatSecondsToClock(projected)}</p>`
          : `<p><strong>Tip:</strong> Add a target lap count above to project a finish time.</p>`);

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Stopwatch Lap Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
