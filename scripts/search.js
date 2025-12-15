/* SnapCalc site-wide header search
   - Fetches /search-index.json (one entry per calculator)
   - Matches on title, category, aliases (substring, normalized)
   - Renders a dropdown under the input
*/

(function () {
    "use strict";
  
    // Expected elements in header:
    // <input id="siteSearchInput" ...>
    // <div id="siteSearchResults" ...></div>
  
    const INPUT_ID = "siteSearchInput";
    const RESULTS_ID = "siteSearchResults";
    const INDEX_URL = "/search-index.json";
    const MAX_RESULTS = 12;
  
    const inputEl = document.getElementById(INPUT_ID);
    const resultsEl = document.getElementById(RESULTS_ID);
  
    if (!inputEl || !resultsEl) return;
  
    let indexData = [];
    let indexLoaded = false;
    let activeIndex = -1;
    let lastQuery = "";
  
    function normalize(str) {
      if (str == null) return "";
      return String(str)
        .toLowerCase()
        .trim()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  
    async function loadIndexOnce() {
      if (indexLoaded) return;
      indexLoaded = true;
  
      try {
        const res = await fetch(INDEX_URL, { cache: "force-cache" });
        if (!res.ok) throw new Error("Index fetch failed: " + res.status);
  
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Index JSON must be an array");
  
        indexData = json
          .filter((x) => x && typeof x === "object")
          .map((x) => {
            const title = String(x.title || "").trim();
            const url = String(x.url || "").trim();
            const category = String(x.category || "").trim();
            const aliases = Array.isArray(x.aliases) ? x.aliases.slice(0, 10) : [];
  
            const aliasText = aliases
              .map((a) => normalize(a))
              .filter(Boolean)
              .join(" ");
  
            return {
              title,
              url,
              category,
              aliases: aliases.map((a) => String(a || "").trim()),
              _search: normalize(title) + " " + normalize(category) + " " + aliasText
            };
          })
          .filter((x) => x.title && x.url);
      } catch (e) {
        // Fail silently. Search just shows no results.
        indexData = [];
      }
    }
  
    function hideResults() {
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("open");
      resultsEl.setAttribute("aria-hidden", "true");
      activeIndex = -1;
    }
  
    function showResults(items, query) {
      const q = escapeHtml(query);
  
      if (!items.length) {
        resultsEl.innerHTML =
          '<div class="search-empty" role="status">No matches for "<strong>' +
          q +
          '</strong>".</div>';
        resultsEl.classList.add("open");
        resultsEl.setAttribute("aria-hidden", "false");
        activeIndex = -1;
        return;
      }
  
      const list = items
        .map((item, idx) => {
          const title = escapeHtml(item.title);
          const category = escapeHtml(item.category || "");
          const url = escapeHtml(item.url);
  
          return (
            '<a class="search-item" data-idx="' +
            idx +
            '" href="' +
            url +
            '">' +
            '<div class="search-item-title">' +
            title +
            "</div>" +
            (category ? '<div class="search-item-meta">' + category + "</div>" : "") +
            "</a>"
          );
        })
        .join("");
  
      resultsEl.innerHTML = '<div class="search-list" role="listbox">' + list + "</div>";
      resultsEl.classList.add("open");
      resultsEl.setAttribute("aria-hidden", "false");
      activeIndex = -1;
    }
  
    function setActive(items) {
      const links = resultsEl.querySelectorAll(".search-item");
      links.forEach((a) => a.classList.remove("active"));
  
      if (activeIndex >= 0 && activeIndex < links.length) {
        links[activeIndex].classList.add("active");
        // Keep it visible if scrollable
        try {
          links[activeIndex].scrollIntoView({ block: "nearest" });
        } catch (_) {}
      }
    }
  
    function getMatches(queryRaw) {
      const q = normalize(queryRaw);
      if (!q) return [];
  
      // Basic substring match on pre-normalized blob
      const hits = [];
      for (let i = 0; i < indexData.length; i++) {
        const item = indexData[i];
        if (item._search.includes(q)) hits.push(item);
        if (hits.length >= MAX_RESULTS) break;
      }
      return hits;
    }
  
    async function handleInput() {
      const raw = inputEl.value || "";
      const q = raw.trim();
  
      if (q === lastQuery) return;
      lastQuery = q;
  
      if (!q) {
        hideResults();
        return;
      }
  
      await loadIndexOnce();
  
      const matches = getMatches(q);
      showResults(matches, q);
    }
  
    function handleKeyDown(e) {
      if (!resultsEl.classList.contains("open")) return;
  
      const links = resultsEl.querySelectorAll(".search-item");
      if (!links.length) return;
  
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, links.length - 1);
        setActive();
        return;
      }
  
      if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        setActive();
        return;
      }
  
      if (e.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < links.length) {
          e.preventDefault();
          links[activeIndex].click();
        }
        return;
      }
  
      if (e.key === "Escape") {
        e.preventDefault();
        hideResults();
        return;
      }
    }
  
    function handleClickOutside(e) {
      const target = e.target;
      if (!target) return;
  
      const clickedInside =
        target === inputEl ||
        target === resultsEl ||
        resultsEl.contains(target);
  
      if (!clickedInside) hideResults();
    }
  
    // Init aria
    resultsEl.setAttribute("aria-hidden", "true");
  
    // Load on first focus to reduce initial work
    inputEl.addEventListener("focus", function () {
      loadIndexOnce();
      if ((inputEl.value || "").trim()) handleInput();
    });
  
    inputEl.addEventListener("input", function () {
      handleInput();
    });
  
    inputEl.addEventListener("keydown", function (e) {
      handleKeyDown(e);
    });
  
    // Clicking a result should close the dropdown
    resultsEl.addEventListener("click", function (e) {
      const a = e.target && e.target.closest ? e.target.closest("a.search-item") : null;
      if (a) hideResults();
    });
  
    document.addEventListener("click", handleClickOutside);
  })();
  