// script.js
document.addEventListener("DOMContentLoaded", function () {
  // Base elements
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Payday + lists
  const paydaySelect = document.getElementById("paydaySelect");

  const incomeLabel = document.getElementById("incomeLabel");
  const incomeAmount = document.getElementById("incomeAmount");
  const addIncomeBtn = document.getElementById("addIncomeBtn");
  const incomeList = document.getElementById("incomeList");

  const fixedLabel = document.getElementById("fixedLabel");
  const fixedAmount = document.getElementById("fixedAmount");
  const addFixedBtn = document.getElementById("addFixedBtn");
  const fixedList = document.getElementById("fixedList");

  // Summary
  const fixedTotalEl = document.getElementById("fixedTotal");
  const varPoolEl = document.getElementById("varPool");
  const baseDailyEl = document.getElementById("baseDaily");
  const todayAllowanceEl = document.getElementById("todayAllowance");

  // Calendar
  const calendarTitleEl = document.getElementById("calendarTitle");
  const calendarEl = document.getElementById("calendar");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const goTodayBtn = document.getElementById("goTodayBtn");
  const clearCycleBtn = document.getElementById("clearCycleBtn");

  // Modal
  const overlay = document.getElementById("overlay");
  const sheetTitle = document.getElementById("sheetTitle");
  const sheetMeta = document.getElementById("sheetMeta");
  const closeSheetBtn = document.getElementById("closeSheetBtn");
  const expenseCategory = document.getElementById("expenseCategory");
  const expenseAmount = document.getElementById("expenseAmount");
  const expenseNote = document.getElementById("expenseNote");
  const saveExpenseBtn = document.getElementById("saveExpenseBtn");
  const deleteDayBtn = document.getElementById("deleteDayBtn");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const dayItems = document.getElementById("dayItems");

  // ----------------------------
  // Helpers (result box)
  // ----------------------------
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

  // ----------------------------
  // Money rules (whole units, round up display)
  // ----------------------------
  function toIntMoney(raw) {
    const n = toNumber(raw || "");
    if (!Number.isFinite(n)) return NaN;
    return Math.ceil(n);
  }

  function fmtInt(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0";
    return Math.ceil(x).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function isoDate(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  }

  function monthKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return y + "-" + m;
  }

  function daysInMonth(y, mIndex) {
    return new Date(y, mIndex + 1, 0).getDate();
  }

  function clampDayOfMonth(day) {
    const n = Number(day);
    if (!Number.isFinite(n)) return 25;
    if (n < 1) return 1;
    if (n > 31) return 31;
    return Math.floor(n);
  }

  // ----------------------------
  // IndexedDB storage
  // ----------------------------
  const DB_NAME = "snapcalc_budget_tracker";
  const DB_VERSION = 1;

  const STORE_META = "meta";
  const STORE_INCOME = "income";
  const STORE_FIXED = "fixed";
  const STORE_CATEGORIES = "categories";
  const STORE_DAILY = "daily"; // key: cycleKey|dateISO

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function () {
        const db = req.result;

        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(STORE_INCOME)) {
          db.createObjectStore(STORE_INCOME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_FIXED)) {
          db.createObjectStore(STORE_FIXED, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
          db.createObjectStore(STORE_CATEGORIES, { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains(STORE_DAILY)) {
          db.createObjectStore(STORE_DAILY, { keyPath: "key" });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function tx(db, storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function getAll(db, storeName) {
    return new Promise((resolve, reject) => {
      const store = tx(db, storeName, "readonly");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function getOne(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const store = tx(db, storeName, "readonly");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function putOne(db, storeName, value) {
    return new Promise((resolve, reject) => {
      const store = tx(db, storeName, "readwrite");
      const req = store.put(value);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  function deleteOne(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const store = tx(db, storeName, "readwrite");
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  // ----------------------------
  // App state (in-memory)
  // ----------------------------
  let db = null;

  let paydayDay = 25;

  let incomeRows = [];
  let fixedRows = [];
  let categories = [];

  // Cycle anchor and month view
  let cycleStart = null; // Date
  let cycleEnd = null;   // Date (inclusive)
  let viewMonth = null;  // Date at first day of month

  // Active modal date
  let activeDateISO = null;

  // Daily cache for current cycle: map dateISO -> items[]
  let dailyMap = new Map();

  // ----------------------------
  // Cycle logic
  // ----------------------------
  function computeCycleStartForToday(payday) {
    const t = new Date();
    const y = t.getFullYear();
    const m = t.getMonth();
    const d = t.getDate();
    const paydayThisMonth = new Date(y, m, payday);
    if (d >= payday) return paydayThisMonth;

    const prev = new Date(y, m - 1, payday);
    return prev;
  }

  function addDays(d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function inCycle(dateObj) {
    const t = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    return t >= cycleStart.getTime() && t <= cycleEnd.getTime();
  }

  function cycleKeyFromStart(startDate) {
    // Stable key for the cycle based on start date
    return isoDate(startDate);
  }

  function dayIndexInCycle(dateObj) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const a = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    const b = cycleStart.getTime();
    return Math.floor((a - b) / msPerDay);
  }

  // ----------------------------
  // Budget math (31-day hard rule)
  // ----------------------------
  function incomeTotal() {
    return incomeRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }

  function fixedTotal() {
    return fixedRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }

  function baseDaily() {
    const pool = incomeTotal() - fixedTotal();
    return Math.ceil(pool / 31);
  }

  function sumDaySpend(dateIso) {
    const arr = dailyMap.get(dateIso) || [];
    return arr.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
  }

  function carryBeforeForDayIndex(dayIdx) {
    // carryBefore day 0 is 0
    // carryAfter = carryBefore + (base - spend)
    const base = baseDaily();
    let carry = 0;
    for (let i = 0; i < dayIdx; i++) {
      const d = addDays(cycleStart, i);
      const iso = isoDate(d);
      const spent = sumDaySpend(iso);
      carry = carry + (base - spent);
    }
    return carry;
  }

  function allowanceForDate(dateObj) {
    const idx = dayIndexInCycle(dateObj);
    const base = baseDaily();
    const carryBefore = carryBeforeForDayIndex(idx);
    const allow = base + carryBefore;
    const spent = sumDaySpend(isoDate(dateObj));
    const carryAfter = carryBefore + (base - spent);
    return { allowance: allow, spent: spent, carryAfter: carryAfter };
  }

  // ----------------------------
  // Rendering
  // ----------------------------
  function renderPaydayOptions() {
    paydaySelect.innerHTML = "";
    for (let i = 1; i <= 31; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i);
      paydaySelect.appendChild(opt);
    }
    paydaySelect.value = String(paydayDay);
  }

  function renderCategoriesSelect() {
    expenseCategory.innerHTML = "";
    const uniq = new Set();

    // Default categories first
    const defaults = ["Groceries", "Fuel", "Eating out", "Transport", "Shopping", "Pharmacy", "Other"];
    defaults.forEach((c) => uniq.add(c));

    // Add fixed labels as categories (your requested behavior)
    fixedRows.forEach((r) => {
      const nm = (r.label || "").trim();
      if (nm) uniq.add(nm);
    });

    // Stored categories
    categories.forEach((c) => {
      const nm = (c.name || "").trim();
      if (nm) uniq.add(nm);
    });

    Array.from(uniq).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      expenseCategory.appendChild(opt);
    });
  }

  function renderIncomeList() {
    incomeList.innerHTML = "";
    if (!incomeRows.length) return;

    incomeRows.forEach((row) => {
      const card = document.createElement("div");
      card.className = "list-item";

      const top = document.createElement("div");
      top.className = "list-top";

      const left = document.createElement("div");
      const name = document.createElement("div");
      name.className = "list-name";
      name.textContent = row.label || "Income";

      const meta = document.createElement("div");
      meta.className = "list-meta";
      meta.textContent = "Amount: " + fmtInt(row.amount);

      left.appendChild(name);
      left.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "small-btn primary";
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", async function () {
        const newLabel = prompt("Edit income label:", row.label || "");
        if (newLabel === null) return;

        const newAmtRaw = prompt("Edit income amount (whole units):", String(row.amount || ""));
        if (newAmtRaw === null) return;

        const newAmt = toIntMoney(newAmtRaw);
        if (!Number.isFinite(newAmt) || newAmt < 0) {
          alert("Enter a valid amount (0 or higher).");
          return;
        }

        row.label = (newLabel || "").trim() || "Income";
        row.amount = newAmt;

        await putOne(db, STORE_INCOME, row);
        await refreshAll();
      });

      const delBtn = document.createElement("button");
      delBtn.className = "small-btn danger";
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async function () {
        if (!confirm("Delete this income line?")) return;
        await deleteOne(db, STORE_INCOME, row.id);
        await refreshAll();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      top.appendChild(left);
      top.appendChild(actions);
      card.appendChild(top);
      incomeList.appendChild(card);
    });
  }

  function renderFixedList() {
    fixedList.innerHTML = "";
    if (!fixedRows.length) return;

    fixedRows.forEach((row) => {
      const card = document.createElement("div");
      card.className = "list-item";

      const top = document.createElement("div");
      top.className = "list-top";

      const left = document.createElement("div");
      const name = document.createElement("div");
      name.className = "list-name";
      name.textContent = row.label || "Fixed expense";

      const meta = document.createElement("div");
      meta.className = "list-meta";
      meta.textContent = "Amount: " + fmtInt(row.amount);

      left.appendChild(name);
      left.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "small-btn primary";
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", async function () {
        const newLabel = prompt("Edit fixed expense label:", row.label || "");
        if (newLabel === null) return;

        const newAmtRaw = prompt("Edit fixed expense amount (whole units):", String(row.amount || ""));
        if (newAmtRaw === null) return;

        const newAmt = toIntMoney(newAmtRaw);
        if (!Number.isFinite(newAmt) || newAmt < 0) {
          alert("Enter a valid amount (0 or higher).");
          return;
        }

        row.label = (newLabel || "").trim() || "Fixed expense";
        row.amount = newAmt;

        await putOne(db, STORE_FIXED, row);
        await refreshAll();
      });

      const delBtn = document.createElement("button");
      delBtn.className = "small-btn danger";
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async function () {
        if (!confirm("Delete this fixed expense?")) return;
        await deleteOne(db, STORE_FIXED, row.id);
        await refreshAll();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      top.appendChild(left);
      top.appendChild(actions);
      card.appendChild(top);
      fixedList.appendChild(card);
    });
  }

  function renderSummary() {
    const fixed = fixedTotal();
    const pool = incomeTotal() - fixed;
    const base = baseDaily();

    fixedTotalEl.textContent = fmtInt(fixed);
    varPoolEl.textContent = fmtInt(pool);
    baseDailyEl.textContent = fmtInt(base);

    // Today's allowance (if today is outside cycle, still compute for today by using current cycle definition)
    const t = new Date();
    const { allowance } = allowanceForDate(t);
    todayAllowanceEl.textContent = fmtInt(allowance);

    // Simple good/bad coloring
    [varPoolEl, todayAllowanceEl].forEach((el) => {
      el.classList.remove("good", "bad");
    });
    varPoolEl.classList.add(pool >= 0 ? "good" : "bad");
    todayAllowanceEl.classList.add(allowance >= 0 ? "good" : "bad");
  }

  function renderCalendar() {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();

    const title = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(viewMonth);
    calendarTitleEl.textContent = title;

    calendarEl.innerHTML = "";

    const firstDow = new Date(y, m, 1).getDay();
    const dim = daysInMonth(y, m);

    // Empty leading cells
    for (let i = 0; i < firstDow; i++) {
      const blank = document.createElement("div");
      blank.style.opacity = "0";
      blank.style.pointerEvents = "none";
      calendarEl.appendChild(blank);
    }

    const todayIso = isoDate(new Date());

    for (let d = 1; d <= dim; d++) {
      const dateObj = new Date(y, m, d);
      const dateIso = isoDate(dateObj);

      const cell = document.createElement("div");
      cell.className = "day";

      const num = document.createElement("div");
      num.className = "day-num";

      const left = document.createElement("span");
      left.textContent = String(d);

      const badge = document.createElement("span");
      badge.className = "badge";

      num.appendChild(left);
      num.appendChild(badge);

      const mini = document.createElement("div");
      mini.className = "day-mini";

      const isInCycle = inCycle(dateObj);
      if (!isInCycle) {
        cell.classList.add("disabled");
        badge.textContent = "";
        mini.innerHTML = "";
        cell.appendChild(num);
        cell.appendChild(mini);
        calendarEl.appendChild(cell);
        continue;
      }

      if (dateIso === todayIso) {
        cell.classList.add("today");
        badge.textContent = "today";
      } else {
        const items = dailyMap.get(dateIso) || [];
        badge.textContent = items.length ? (String(items.length) + " item") : "";
      }

      const calc = allowanceForDate(dateObj);
      const remaining = calc.allowance - calc.spent;

      if (calc.spent > 0) {
        if (remaining >= 0) cell.classList.add("good");
        else cell.classList.add("bad");
      }

      mini.innerHTML =
        "<div>Allow: <strong>" + fmtInt(calc.allowance) + "</strong></div>" +
        "<div>Spent: <strong>" + fmtInt(calc.spent) + "</strong></div>" +
        "<div>Carry: <strong>" + fmtInt(remaining) + "</strong></div>";

      cell.appendChild(num);
      cell.appendChild(mini);

      cell.addEventListener("click", function () {
        openSheet(dateObj);
      });

      calendarEl.appendChild(cell);
    }
  }

  // ----------------------------
  // Modal (daily entry)
  // ----------------------------
  function openSheet(dateObj) {
    activeDateISO = isoDate(dateObj);

    sheetTitle.textContent = "Add expense";
    sheetMeta.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(dateObj);

    expenseAmount.value = "";
    expenseNote.value = "";

    renderCategoriesSelect();
    renderDayItemsList();

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    setTimeout(function () {
      expenseAmount.focus();
    }, 50);
  }

  function closeSheet() {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    activeDateISO = null;
    dayItems.innerHTML = "";
  }

  function renderDayItemsList() {
    dayItems.innerHTML = "";

    if (!activeDateISO) return;

    const arr = dailyMap.get(activeDateISO) || [];
    if (!arr.length) {
      const empty = document.createElement("div");
      empty.className = "day-item-row";
      empty.textContent = "No entries for this day yet.";
      dayItems.appendChild(empty);
      return;
    }

    arr.forEach((item) => {
      const row = document.createElement("div");
      row.className = "day-item-row";

      const top = document.createElement("div");
      top.className = "day-item-top";

      const left = document.createElement("div");
      const nm = document.createElement("div");
      nm.className = "day-item-name";
      nm.textContent = (item.category || "Other") + ": " + fmtInt(item.amount);

      const meta = document.createElement("div");
      meta.className = "day-item-meta";
      meta.textContent = (item.note || "").trim();

      left.appendChild(nm);
      left.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "small-btn primary";
      editBtn.type = "button";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", async function () {
        const newCat = prompt("Edit category:", item.category || "Other");
        if (newCat === null) return;

        const newAmtRaw = prompt("Edit amount (whole units):", String(item.amount || ""));
        if (newAmtRaw === null) return;

        const newAmt = toIntMoney(newAmtRaw);
        if (!Number.isFinite(newAmt) || newAmt <= 0) {
          alert("Enter a valid amount greater than 0.");
          return;
        }

        const newNote = prompt("Edit note (optional):", item.note || "");
        if (newNote === null) return;

        item.category = (newCat || "").trim() || "Other";
        item.amount = newAmt;
        item.note = (newNote || "").trim();

        await persistDay(activeDateISO);
        await refreshAll();
        renderDayItemsList();
      });

      const delBtn = document.createElement("button");
      delBtn.className = "small-btn danger";
      delBtn.type = "button";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async function () {
        if (!confirm("Delete this entry?")) return;
        const current = dailyMap.get(activeDateISO) || [];
        const next = current.filter((x) => x.id !== item.id);
        dailyMap.set(activeDateISO, next);

        await persistDay(activeDateISO);
        await refreshAll();
        renderDayItemsList();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      top.appendChild(left);
      top.appendChild(actions);

      row.appendChild(top);
      dayItems.appendChild(row);
    });
  }

  // Persist one day's list into STORE_DAILY using cycleKey|date
  async function persistDay(dateIso) {
    const ck = cycleKeyFromStart(cycleStart);
    const key = ck + "|" + dateIso;
    const items = dailyMap.get(dateIso) || [];
    await putOne(db, STORE_DAILY, { key: key, cycleKey: ck, dateISO: dateIso, items: items });
  }

  async function loadCycleDailyIntoMap() {
    dailyMap = new Map();
    const all = await getAll(db, STORE_DAILY);
    const ck = cycleKeyFromStart(cycleStart);

    all.forEach((row) => {
      if (!row || row.cycleKey !== ck) return;
      if (!row.dateISO) return;
      const items = Array.isArray(row.items) ? row.items : [];
      dailyMap.set(row.dateISO, items);
    });

    // Ensure every cycle day has at least empty list in map (optional)
    for (let i = 0; i < 31; i++) {
      const d = addDays(cycleStart, i);
      const iso = isoDate(d);
      if (!dailyMap.has(iso)) dailyMap.set(iso, []);
    }
  }

  async function clearCurrentCycleDaily() {
    const ck = cycleKeyFromStart(cycleStart);
    const all = await getAll(db, STORE_DAILY);

    for (const row of all) {
      if (row && row.cycleKey === ck) {
        await deleteOne(db, STORE_DAILY, row.key);
      }
    }
  }

  // ----------------------------
  // Refresh orchestration
  // ----------------------------
  async function refreshAll() {
    incomeRows = await getAll(db, STORE_INCOME);
    fixedRows = await getAll(db, STORE_FIXED);

    categories = await getAll(db, STORE_CATEGORIES);

    renderCategoriesSelect();
    renderIncomeList();
    renderFixedList();

    // Recompute cycle and view month based on payday rule
    cycleStart = computeCycleStartForToday(paydayDay);
    cycleEnd = addDays(cycleStart, 30);

    // Default month view is the cycle start month, but keep current viewMonth if already set
    if (!viewMonth) {
      viewMonth = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), 1);
    }

    await loadCycleDailyIntoMap();

    renderSummary();
    renderCalendar();

    clearResult();
  }

  // ----------------------------
  // Wire events
  // ----------------------------
  paydaySelect.addEventListener("change", async function () {
    paydayDay = clampDayOfMonth(paydaySelect.value);
    await putOne(db, STORE_META, { key: "paydayDay", value: paydayDay });
    viewMonth = new Date(computeCycleStartForToday(paydayDay).getFullYear(), computeCycleStartForToday(paydayDay).getMonth(), 1);
    await refreshAll();
  });

  addIncomeBtn.addEventListener("click", async function () {
    const label = (incomeLabel.value || "").trim();
    const amt = toIntMoney(incomeAmount.value);

    if (!label) {
      setResultError("Enter an income label.");
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setResultError("Enter a valid income amount (0 or higher).");
      return;
    }

    await putOne(db, STORE_INCOME, { id: uid(), label: label, amount: amt });
    incomeLabel.value = "";
    incomeAmount.value = "";
    await refreshAll();
    setResultSuccess("<p><strong>Saved.</strong> Income line added.</p>");
  });

  addFixedBtn.addEventListener("click", async function () {
    const label = (fixedLabel.value || "").trim();
    const amt = toIntMoney(fixedAmount.value);

    if (!label) {
      setResultError("Enter a fixed expense label.");
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setResultError("Enter a valid fixed expense amount (0 or higher).");
      return;
    }

    await putOne(db, STORE_FIXED, { id: uid(), label: label, amount: amt });

    // Also store as category option (optional, but you liked this behavior)
    await putOne(db, STORE_CATEGORIES, { name: label });

    fixedLabel.value = "";
    fixedAmount.value = "";
    await refreshAll();
    setResultSuccess("<p><strong>Saved.</strong> Fixed expense added.</p>");
  });

  saveExpenseBtn.addEventListener("click", async function () {
    if (!activeDateISO) return;

    const amt = toIntMoney(expenseAmount.value);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }

    const cat = (expenseCategory.value || "Other").trim() || "Other";
    const note = (expenseNote.value || "").trim();

    const list = dailyMap.get(activeDateISO) || [];
    list.push({ id: uid(), category: cat, amount: amt, note: note, ts: Date.now() });
    dailyMap.set(activeDateISO, list);

    await persistDay(activeDateISO);
    await refreshAll();

    expenseAmount.value = "";
    expenseNote.value = "";
    renderDayItemsList();
    expenseAmount.focus();
  });

  deleteDayBtn.addEventListener("click", async function () {
    if (!activeDateISO) return;
    if (!confirm("Delete all entries for this day?")) return;

    dailyMap.set(activeDateISO, []);
    await persistDay(activeDateISO);
    await refreshAll();
    renderDayItemsList();
  });

  addCategoryBtn.addEventListener("click", async function () {
    const name = prompt("Add a new category:");
    if (name === null) return;
    const clean = (name || "").trim();
    if (!clean) return;

    await putOne(db, STORE_CATEGORIES, { name: clean });
    await refreshAll();
  });

  closeSheetBtn.addEventListener("click", closeSheet);

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeSheet();
  });

  prevMonthBtn.addEventListener("click", function () {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", function () {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  goTodayBtn.addEventListener("click", function () {
    viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    renderCalendar();
  });

  clearCycleBtn.addEventListener("click", async function () {
    if (!confirm("Clear all daily entries for this 31-day cycle? Income and fixed expenses will remain.")) return;
    await clearCurrentCycleDaily();
    await refreshAll();
    setResultSuccess("<p><strong>Cleared.</strong> Daily entries for this cycle were removed.</p>");
  });

  // Recalculate button just re-renders and shows current snapshot
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const fixed = fixedTotal();
      const pool = incomeTotal() - fixed;
      const base = baseDaily();
      const t = new Date();
      const a = allowanceForDate(t).allowance;

      const html =
        "<p><strong>Fixed monthly expenses:</strong> " + fmtInt(fixed) + "</p>" +
        "<p><strong>Available for variable spending:</strong> " + fmtInt(pool) + "</p>" +
        "<p><strong>Base daily allowance (31-day rule):</strong> " + fmtInt(base) + "</p>" +
        "<p><strong>Today’s rolling allowance:</strong> " + fmtInt(a) + "</p>";

      setResultSuccess(html);
    });
  }

  // WhatsApp share
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Mobile Budget Tracker - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }

  // ----------------------------
  // Init
  // ----------------------------
  (async function init() {
    try {
      db = await openDb();

      const savedPayday = await getOne(db, STORE_META, "paydayDay");
      if (savedPayday && Number.isFinite(Number(savedPayday.value))) {
        paydayDay = clampDayOfMonth(savedPayday.value);
      } else {
        paydayDay = 25;
        await putOne(db, STORE_META, { key: "paydayDay", value: paydayDay });
      }

      renderPaydayOptions();

      cycleStart = computeCycleStartForToday(paydayDay);
      cycleEnd = addDays(cycleStart, 30);
      viewMonth = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), 1);

      await refreshAll();
    } catch (e) {
      setResultError("Storage error: this browser may not support local storage for this tool.");
      // Fall back gracefully: no further action
    }
  })();
});
