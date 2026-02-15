// budget.js
// CKP Budget tab (Excel-like) — two lists: "Transferred on 1st" and "Transferred on 15th"
// - Inline editable rows
// - Active toggle (hide from totals + visually dim OR hard hide if you want)
// - Delete (removes row entirely)
// - Add row (stays in the list it was added to)
// - Totals update instantly
//
// Data is stored in localStorage under "CKP_BUDGET_V1" by default.
// If you already have a "cloud payload" save/load in CKP Pay, you can merge this object into that payload.

const BUDGET_STORAGE_KEY = "CKP_BUDGET_V1";
// Expose totals to CKP Pay (so the CKP tab can show Extra Available)
function getBudgetTotals() {
  const data = loadBudget();
  const total1 = sumActive(data.lists.first);
  const total15 = sumActive(data.lists.fifteenth);
  return { total1, total15, grand: total1 + total15 };
}

// Make it available globally
window.CKPBUDGET = window.CKPBUDGET || {};
window.CKPBUDGET.getTotals = getBudgetTotals;
window.dispatchEvent(new Event("ckp-budget-updated"));

function parsePostDay(v) {
  if (v == null) return null;
  const s = String(v).trim();
  const m = s.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function defaultBudgetDataFromExcelCurrent2025() {
  // Seeded from your "CURRENT 2025" sheet screenshot/content:
  // Left side (Transferred on 1st): A3:D23
  // Right side (Transferred on 15th): F3:I14
  return {
    version: 1,
    lists: {
      first: [
        { id: uid(), active: true, expense: "Groceries", to: "Groc.", post: "15th", amount: 3000.0 },
        { id: uid(), active: true, expense: "Miscellaneous", to: "Misc.", post: "15th", amount: 3000.0 },
        { id: uid(), active: true, expense: "Gas", to: "Scheels", post: "1st", amount: 400.0 },
        { id: uid(), active: true, expense: "New Trailer storage", to: "Scheels", post: "1st", amount: 170.0 },
        { id: uid(), active: true, expense: "OpenPhone", to: "Scheels", post: "3rd", amount: 3.31 },
        { id: uid(), active: true, expense: "Rhythm", to: "Scheels", post: "5th", amount: 350.0 },
        { id: uid(), active: true, expense: "Experian", to: "Scheels", post: "11th", amount: 21.6 },
        { id: uid(), active: true, expense: "LifeLoc (Norton)", to: "Scheels", post: "11th", amount: 13.0 },
        { id: uid(), active: true, expense: "Atmos", to: "Scheels", post: "25th", amount: 150.0 },
        { id: uid(), active: true, expense: "Utility", to: "Scheels", post: "13th", amount: 250.0 },
        { id: uid(), active: true, expense: "iCloud", to: "Scheels", post: "14th", amount: 9.99 },
        { id: uid(), active: true, expense: "Pool", to: "Scheels", post: "20th", amount: 232.75 },
        { id: uid(), active: true, expense: "Apple Music", to: "Scheels", post: "19th", amount: 18.39 },
        { id: uid(), active: true, expense: "Dreamhost", to: "Scheels", post: "20th", amount: 13.99 },
        { id: uid(), active: true, expense: "Netflix", to: "Scheels", post: "17th", amount: 24.89 },
        { id: uid(), active: true, expense: "Tithe", to: "Scheels", post: "20th", amount: 3512.7 },
        { id: uid(), active: true, expense: "IJM Charity", to: "Scheels", post: "24th", amount: 35.97 },
        { id: uid(), active: true, expense: "Spectrum", to: "Scheels", post: "26th", amount: 70.36 },
        { id: uid(), active: true, expense: "YouTubeTV", to: "Scheels", post: "28th", amount: 89.84 },
        { id: uid(), active: true, expense: "Apple TV", to: "Scheels", post: "28th", amount: 10.81 },
        { id: uid(), active: true, expense: "AT&T", to: "Scheels", post: "30th", amount: 106.4 },
        { id: uid(), active: true, expense: "SLOP", to: "Scheels", post: "30th", amount: 40.0 },
      ],
      fifteenth: [
        { id: uid(), active: true, expense: "Auto/Home/RV", to: "Bill Pay", post: "2nd", amount: 594.65 },
        { id: uid(), active: true, expense: "Ryan's School Loan", to: "Bill Pay", post: "3rd", amount: 98.05 },
        { id: uid(), active: true, expense: "USAA Loan", to: "Bill Pay", post: "3rd", amount: 986.17 },
        { id: uid(), active: true, expense: "USAA Life Ins", to: "Bill Pay", post: "4th", amount: 24.98 },
        { id: uid(), active: true, expense: "VPP", to: "Bill Pay", post: "4th", amount: 61.08 },
        { id: uid(), active: true, expense: "Mortgage 5.75%", to: "Bill Pay", post: "5th", amount: 7473.82 },
        { id: uid(), active: true, expense: "Slice", to: "Bill Pay", post: "6th", amount: 272.47 },
        { id: uid(), active: true, expense: "House Cleaners", to: "Bill Pay", post: "7th", amount: 200.0 },
        { id: uid(), active: true, expense: "RV Loan", to: "Bill Pay", post: "15th", amount: 547.63 },
        { id: uid(), active: true, expense: "Property Taxes", to: "Prop Taxes", post: "16th", amount: 1000.0 },
        { id: uid(), active: true, expense: "Extra Misc", to: "Misc", post: "15th", amount: 1000.0 },
        { id: uid(), active: true, expense: "Faith Tuition", to: "Faith", post: "15th", amount: 2000.0 },
      ],
    },
    ui: {
      hideInactiveRows: true,   // if true, inactive rows disappear completely (what you asked for)
      sortByPostDay: true,
    },
  };
}

function loadBudget() {
  const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
  if (!raw) {
    const seeded = defaultBudgetDataFromExcelCurrent2025();
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seeded = defaultBudgetDataFromExcelCurrent2025();
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveBudget(data) {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("ckp-budget-updated"));
}

function sumActive(items) {
  return items
    .filter(x => x.active)
    .reduce((acc, x) => acc + Number(x.amount || 0), 0);
}

function renderTable(container, title, listKey, data, onChange) {
  const items = data.lists[listKey] || [];
  const hideInactive = !!data.ui?.hideInactiveRows;
  const sortByPost = !!data.ui?.sortByPostDay;

  let visible = hideInactive ? items.filter(x => x.active) : items.slice();

  if (sortByPost) {
  visible.sort((a, b) => {
    const ap = parsePostDay(a.post);
    const bp = parsePostDay(b.post);

    // Any row without a valid Post day goes to the bottom
    if (ap == null && bp == null) return (a.createdAt || 0) - (b.createdAt || 0);
    if (ap == null) return 1;
    if (bp == null) return -1;

    return ap - bp;
  });
}

  const total = sumActive(items);

  container.innerHTML = `
    <div class="budgetCard">
      <div class="budgetCardHeader">
        <div class="budgetCardTitle">${title}</div>
        <div class="budgetCardActions">
          <button class="btnSmall" data-action="add">+ Add item</button>
        </div>
      </div>

      <div class="budgetTableWrap">
        <div class="budgetRow budgetHead">
          <div>Expense</div>
          <div>To</div>
          <div>Post</div>
          <div class="right">Amount</div>
          <div class="right">On/Off</div>
          <div class="right">Delete</div>
        </div>

        ${visible.map(row => `
          <div class="budgetRow ${row.active ? "" : "inactiveRow"}" data-id="${row.id}">
            <div><input class="inText" data-field="expense" value="${escapeHtml(row.expense ?? "")}"/></div>
            <div><input class="inText" data-field="to" value="${escapeHtml(row.to ?? "")}"/></div>
            <div><input class="inText" data-field="post" value="${escapeHtml(row.post ?? "")}"/></div>
            <div class="right"><input class="inMoney" data-field="amount" value="${row.amount ?? ""}"/></div>
            <div class="right"><button class="btnToggle" data-action="toggle">${row.active ? "On" : "Off"}</button></div>
            <div class="right"><button class="btnDanger" data-action="delete">✕</button></div>
          </div>
        `).join("")}
      </div>

      <div class="budgetTotals">
        <div class="muted">Total (${title})</div>
        <div class="big">${money(total)}</div>
      </div>
    </div>
  `;

  // Events
  container.querySelector(`[data-action="add"]`)?.addEventListener("click", () => {
    const newItem = { id: uid(), active: true, expense: "", to: "", post: "", amount: 0, createdAt: Date.now() };
    data.lists[listKey].push(newItem);
    saveBudget(data);
    onChange();
  });

  container.querySelectorAll(".budgetRow[data-id]").forEach(rowEl => {
    const id = rowEl.getAttribute("data-id");
    const idx = data.lists[listKey].findIndex(x => x.id === id);
    if (idx < 0) return;

    rowEl.querySelectorAll("input[data-field]").forEach(inp => {
      inp.addEventListener("change", () => {
        const field = inp.getAttribute("data-field");
        if (!field) return;
        let val = inp.value;

        if (field === "amount") {
          // keep it numeric
          val = String(val).replace(/[^0-9.\-]/g, "");
          data.lists[listKey][idx][field] = Number(val || 0);
          inp.value = String(data.lists[listKey][idx][field] ?? 0);
        } else {
          data.lists[listKey][idx][field] = val;
        }

        saveBudget(data);
        onChange(); // rerender to update totals/sort
      });
    });

    rowEl.querySelector(`[data-action="toggle"]`)?.addEventListener("click", () => {
      data.lists[listKey][idx].active = !data.lists[listKey][idx].active;
      saveBudget(data);
      onChange();
    });

    rowEl.querySelector(`[data-action="delete"]`)?.addEventListener("click", () => {
      // Hard delete (you asked: disappears and totals change immediately)
      data.lists[listKey].splice(idx, 1);
      saveBudget(data);
      onChange();
    });
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function mountBudgetTab(rootEl) {
  // rootEl is the div where we render the budget tab
  let data = loadBudget();

  function rerender() {
    data = loadBudget();

    const total1 = sumActive(data.lists.first);
    const total15 = sumActive(data.lists.fifteenth);
    const grand = total1 + total15;

    rootEl.innerHTML = `
      <div class="budgetTop">
        <div class="budgetTopLeft">
          <div class="budgetTitle">Budget</div>
          <div class="budgetSubtitle">Excel-like editing • Live totals • Instant delete</div>
        </div>

        <div class="budgetTopRight">
          <div class="budgetGrand">
            <div class="muted">Monthly total</div>
            <div class="grandNum">${money(grand)}</div>
          </div>

          <div class="budgetToggles">
            <label class="toggleRow">
              <input type="checkbox" id="hideInactive" ${data.ui?.hideInactiveRows ? "checked" : ""}/>
              <span>Hide inactive rows</span>
            </label>
            <label class="toggleRow">
              <input type="checkbox" id="sortPost" ${data.ui?.sortByPostDay ? "checked" : ""}/>
              <span>Sort by Post day</span>
            </label>
          </div>
        </div>
      </div>

      <div class="budgetGrid">
        <div id="budgetFirst"></div>
        <div id="budgetFifteenth"></div>
      </div>
    `;

    rootEl.querySelector("#hideInactive")?.addEventListener("change", (e) => {
      data.ui.hideInactiveRows = !!e.target.checked;
      saveBudget(data);
      rerender();
    });

    rootEl.querySelector("#sortPost")?.addEventListener("change", (e) => {
      data.ui.sortByPostDay = !!e.target.checked;
      saveBudget(data);
      rerender();
    });

    renderTable(rootEl.querySelector("#budgetFirst"), "Transferred on 1st", "first", data, rerender);
    renderTable(rootEl.querySelector("#budgetFifteenth"), "Transferred on 15th", "fifteenth", data, rerender);
    
  }

  rerender();
}

// Optional helpers for your existing cloud save/load:
// Call these from your CKP cloud push/pull logic.
export function getBudgetForCloud() {
  return loadBudget();
}
export function setBudgetFromCloud(budgetObj) {
  if (!budgetObj) return;
  saveBudget(budgetObj);
}
// ==============================
// Auto-wire the CKP/Budget tabs
// ==============================
function wireBudgetTabs() {
  const tabCkp = document.getElementById("tabCkp");
  const tabBudget = document.getElementById("tabBudget");

  const ckpTopbar = document.querySelector("header.topbar");
  const ckpMain = document.querySelector("main.layout");
  const budgetRoot = document.getElementById("budgetRoot");

  if (!tabCkp || !tabBudget || !budgetRoot || !ckpTopbar || !ckpMain) return;

  function setActive(which) {
    tabCkp.classList.toggle("active", which === "ckp");
    tabBudget.classList.toggle("active", which === "budget");
  }

  tabBudget.addEventListener("click", () => {
    ckpTopbar.style.display = "none";
    ckpMain.style.display = "none";
    budgetRoot.style.display = "block";
    setActive("budget");

    // Render budget UI
    mountBudgetTab(budgetRoot);
  });

  tabCkp.addEventListener("click", () => {
    budgetRoot.style.display = "none";
    ckpTopbar.style.display = "";
    ckpMain.style.display = "";
    setActive("ckp");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireBudgetTabs);
} else {
  wireBudgetTabs();
}
