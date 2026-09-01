const KEY = "raufCattleFarmData_v1";
let data = JSON.parse(localStorage.getItem(KEY) || "null") || { customers: [], months: {}, expenses: {} };
const defaultCustomers = ["ڈاکٹر تنویر","عامرعاطف","عمر قصاِئی","بشارت بوس","فیصل","عاطف","نعمان","الحمد گڈز","راشد","ناصر","یاسر","مولانا شفقت اللہ","جاوید شاہ فوٹو اسٹیٹ","راحیل","امجد بلوچ","عامر","چناب یاسر پمپ","عبداللہ پٹھان","جاوید چک 72","قیوم","مولوی طاہر","عرفان","ندیم ہوٹل","شہزیب","شکور ہوٹل","فیصل","مغل","عثمان"];

if(!Array.isArray(data.customers)) data.customers = [];
if(!data.expenses) data.expenses = {};

defaultCustomers.forEach((name, i) => {
  if(!data.customers[i]){
    data.customers[i] = { id: String(i + 1), name, contact: "", rate: 200 };
  } else if(!String(data.customers[i].name || "").trim()){
    data.customers[i].name = name;
  }
});

data.customers = data.customers.map((c, i) => ({
  id: String(c.id || i + 1),
  name: String(c.name || defaultCustomers[i] || "").trim(),
  contact: String(c.contact || ""),
  rate: Number(c.rate || 200)
}));
localStorage.setItem(KEY, JSON.stringify(data));

const $ = id => document.getElementById(id);
const today = new Date();
let currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

function getNextMonthKey(){
  const [y, m] = currentMonth.split("-").map(Number);
  const nextDate = new Date(y, m, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
}

function setupNextMonthExpensesLabel(){
  const [y, m] = currentMonth.split("-").map(Number);
  const nextMonthDate = new Date(y, m, 1);
  const nextMonthName = nextMonthDate.toLocaleString("en-US", { month: "long" });
  if($("nextMonthExpLabel")) {
    $("nextMonthExpLabel").textContent = `Expenses (${nextMonthName})`;
  }
  if($("expensesPageHeading")){
    $("expensesPageHeading").textContent = `Rauf Cattle Farm - Expenses (${nextMonthName})`;
  }
}

function save(){ localStorage.setItem(KEY, JSON.stringify(data)); }
function daysInMonth(ym){ const [y, m] = ym.split("-").map(Number); return new Date(y, m, 0).getDate(); }
function monthLabel(ym){ const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }); }

function ensureMonth(){
  if(!data.months[currentMonth]) data.months[currentMonth] = {};
  data.customers.forEach(c => {
    if(!data.months[currentMonth][c.id]) data.months[currentMonth][c.id] = { milk: {}, rate: c.rate || 200, advance: 0, baqaya: 0 };
    else {
      const rec = data.months[currentMonth][c.id];
      if(rec.advance === undefined || rec.advance === null) rec.advance = 0;
      if(rec.baqaya === undefined || rec.baqaya === null) rec.baqaya = 0;
    }
  });
  save();
}

function ensureExpenses(){
  const nextKey = getNextMonthKey();
  if(!data.expenses[nextKey]) {
    data.expenses[nextKey] = [];
  }
  save();
}

function render(){
  ensureMonth();
  ensureExpenses();
  if($("monthTitle")) $("monthTitle").textContent = monthLabel(currentMonth);
  setupNextMonthExpensesLabel();
  renderMilk(); 
  renderCustomers(); 
  renderExpenses(); 
  renderRecoverySheet(); 
  save();
}

function renderMilk(){
 const milkTable = $("milkTable");
 if(!milkTable) return;
 const n = daysInMonth(currentMonth), month = data.months[currentMonth];
 let h = "<tr><th>Sr.No</th><th class='name-head'>Customer Name</th>";
 for(let d = 1; d <= n; d++) h += `<th>${String(d).padStart(2, "0")}</th>`;
 h += `<th>Total Milk</th><th>Rate</th><th>Advance</th><th>Sabqa Baqaya</th><th>Total</th><th>Print Bill</th></tr>`;
 milkTable.querySelector("thead").innerHTML = h;
 
 let body = "", daily = Array(n).fill(0), grand = 0;
 data.customers.forEach((c, i) => {
   const rec = month[c.id] || { milk: {}, rate: c.rate || 200, advance: 0, baqaya: 0 }; 
   let total = 0;
   body += `<tr data-row-idx="${i}"><td>${i + 1}</td><td class="name-cell">${esc(c.name)}</td>`;
   for(let d = 1; d <= n; d++){
     const v = rec.milk[d] ?? "";
     if(v !== "" && !isNaN(Number(v))){ daily[d - 1] += Number(v); total += Number(v); }
     body += `<td class="milk-cell" data-day="${d}" data-row="${i}">
              <input class="day-input" type="number" step="0.1" min="0" value="${v}" data-id="${c.id}" data-day="${d}">
              <div class="drag-handle" title="Drag to fill"></div>
            </td>`;
   }
   const rate = rec.rate ?? c.rate ?? 200;
   const advance = Number(rec.advance || 0);
   const baqaya = Number(rec.baqaya || 0);
   const amount = (total * Number(rate || 0)) + baqaya - advance;
   grand += total;
   body += `<td class="total-cell" id="total-${c.id}">${fmt(total)}</td>
            <td><input class="rate-input" type="number" min="0" step="0.01" value="${rate}" data-rate-id="${c.id}"></td>
            <td><input class="adv-input" type="number" min="0" step="0.01" value="${advance}" data-adv-id="${c.id}"></td>
            <td><input class="baqaya-input" type="number" min="0" step="0.01" value="${baqaya}" data-baqaya-id="${c.id}"></td>
            <td class="amount-cell" id="amount-${c.id}">${fmt(amount)}</td>
            <td class="action-cell"><button class="print-btn" data-print-id="${c.id}">Print</button> <button class="btn blue edit-btn" data-edit-id="${c.id}">Edit</button> <button class="btn red del-btn" data-del-id="${c.id}">Delete</button></td></tr>`;
 });
 milkTable.querySelector("tbody").innerHTML = body;

 let foot = "<tr><td></td><td style='direction:rtl'>کل وزن دودھ</td>";
 daily.forEach((v, idx) => foot += `<td id="daily-sum-${idx + 1}">${fmt(v)}</td>`);
 foot += `<td id="footGrandTotal">${fmt(grand)}</td><td></td><td></td><td></td><td></td><td></td></tr>`;
 milkTable.querySelector("tfoot").innerHTML = foot;
 if($("grandTotal")) $("grandTotal").textContent = fmt(grand);

 initExcelDrag();
 initExcelPaste();
}

function updateCalculations(){
  const n = daysInMonth(currentMonth), month = data.months[currentMonth];
  let daily = Array(n).fill(0), grand = 0;
  data.customers.forEach((c) => {
    const rec = month[c.id] || { milk: {}, rate: c.rate || 200, advance: 0, baqaya: 0 };
    let total = 0;
    for(let d = 1; d <= n; d++){
      const v = rec.milk[d] ?? "";
      if(v !== "" && !isNaN(Number(v))){ daily[d - 1] += Number(v); total += Number(v); }
    }
    const rate = rec.rate ?? c.rate ?? 200;
    const advance = Number(rec.advance || 0);
    const baqaya = Number(rec.baqaya || 0);
    const amount = (total * Number(rate || 0)) + baqaya - advance;
    grand += total;
    if($(`total-${c.id}`)) $(`total-${c.id}`).textContent = fmt(total);
    if($(`amount-${c.id}`)) $(`amount-${c.id}`).textContent = fmt(amount);
  });
  daily.forEach((v, idx) => {
    if($(`daily-sum-${idx + 1}`)) $(`daily-sum-${idx + 1}`).textContent = fmt(v);
  });
  if($("footGrandTotal")) $("footGrandTotal").textContent = fmt(grand);
  if($("grandTotal")) $("grandTotal").textContent = fmt(grand);
}

/* Expenses Functions (Guaranteed Minimum 20 Rows) */
function renderExpenses(){
  const expList = $("expensesList");
  if(!expList) return;
  const nextKey = getNextMonthKey();
  const list = data.expenses[nextKey] || [];
  
  let rows = "", totalAmt = 0, totalAdv = 0;
  const totalRowsCount = Math.max(20, list.length);

  for (let index = 0; index < totalRowsCount; index++) {
    const item = list[index] || { id: null, date: "", details: "", name: "", amount: "", advance: "" };
    
    totalAmt += Number(item.amount || 0);
    totalAdv += Number(item.advance || 0);

    const isSavedRow = Boolean(item.id);

    rows += `<tr data-exp-id="${item.id || ''}">
      <td>${index + 1}</td>
      <td><input type="date" class="exp-input exp-date" value="${item.date || ''}" data-field="date"></td>
      <td><input type="text" class="exp-input exp-details" value="${esc(item.details || '')}" placeholder="${isSavedRow ? '' : 'تفصیل لکھیں...'}" data-field="details"></td>
      <td><input type="text" class="exp-input exp-name" value="${esc(item.name || '')}" placeholder="${isSavedRow ? '' : 'نام'}" data-field="name"></td>
      <td><input type="number" class="exp-input exp-amount" value="${item.amount || ''}" placeholder="" data-field="amount"></td>
      <td><input type="number" class="exp-input exp-advance" value="${item.advance || ''}" placeholder="" data-field="advance"></td>
      <td>${isSavedRow ? `<button class="btn red delete-exp-btn" data-exp-id="${item.id}">Delete</button>` : ''}</td>
    </tr>`;
  }

  expList.innerHTML = rows;
  if($("expTotalAmount")) $("expTotalAmount").textContent = fmt(totalAmt);
  if($("expTotalAdvance")) $("expTotalAdvance").textContent = fmt(totalAdv);
  if($("expNetTotal")) $("expNetTotal").textContent = fmt(totalAmt - totalAdv);
}

function renderCustomers(){
 if(!$("customerSearch") || !$("customerList")) return;
 const q = $("customerSearch").value.trim().toLowerCase();
 let rows = "";
 data.customers.filter(c => c.name.toLowerCase().includes(q) || String(c.contact || "").includes(q)).forEach((c, i) => {
  rows += `<tr><td>${i + 1}</td><td>${esc(c.name)}</td><td>${esc(c.contact || "")}</td><td>${fmt(c.rate || 200)}</td><td class="action-cell"><button class="btn blue edit-btn" data-id="${c.id}">Edit</button> <button class="btn red del-btn" data-del-id="${c.id}">Delete</button></td></tr>`;
 });
 $("customerList").innerHTML = rows;
}

if($("customerList")){
  $("customerList").addEventListener("click", e => {
    const id = e.target.dataset.id;
    if(id && e.target.classList.contains("edit-btn")) openEditModal(id);
    const delId = e.target.dataset.delId;
    if(delId) deleteCustomerById(delId);
  });
}

if($("closeModal")) $("closeModal").onclick = () => $("editModal").classList.add("hidden");

if($("updateCustomer")){
  $("updateCustomer").onclick = () => {
    const id = $("editId").value;
    const c = data.customers.find(x => x.id === id);
    if(!c) return;
    const name = $("editName").value.trim();
    if(!name){ alert("Customer Name لکھنا ضروری ہے۔"); return; }
    c.name = name;
    c.contact = $("editContact").value.trim();
    const newRate = Number($("editRate").value || 200);
    c.rate = newRate;
    ensureMonth();
    if(data.months[currentMonth][id]) data.months[currentMonth][id].rate = newRate;
    save();
    $("editModal").classList.add("hidden");
    render();
  };
}

if($("deleteCustomer")){
  $("deleteCustomer").onclick = () => {
    const id = $("editId").value;
    $("editModal").classList.add("hidden");
    deleteCustomerById(id);
  };
}

function openEditModal(id){
  const c = data.customers.find(x => x.id === id);
  if(!c || !$("editModal")) return;
  $("editId").value = c.id;
  $("editName").value = c.name;
  $("editContact").value = c.contact || "";
  $("editRate").value = c.rate || 200;
  $("editModal").classList.remove("hidden");
}

function deleteCustomerById(id){
  const c = data.customers.find(x => x.id === id);
  if(!c) return;
  const ok = confirm(`کیا آپ واقعی "${c.name}" کو ڈیلیٹ کرنا چاہتے ہیں؟ اس کا سارا ڈیٹا (Milk records) بھی ختم ہو جائے گا۔`);
  if(!ok) return;

  data.customers = data.customers.filter(x => x.id !== id);
  Object.keys(data.months).forEach(m => {
    if(data.months[m] && data.months[m][id]) delete data.months[m][id];
  });
  save();
  render();
}

/* Recovery Sheet: Name, Milk KG, Rate, Total Amount, blank Recovery column */
function getCustomerMonthTotal(c){
  const month = data.months[currentMonth] || {};
  const rec = month[c.id] || { milk: {}, rate: c.rate || 200, advance: 0, baqaya: 0 };
  let total = 0;
  Object.values(rec.milk || {}).forEach(v => {
    if(v !== "" && v !== null && v !== undefined && !isNaN(Number(v))) total += Number(v);
  });
  const rate = Number(rec.rate ?? c.rate ?? 200);
  const advance = Number(rec.advance || 0);
  const baqaya = Number(rec.baqaya || 0);
  const amount = (total * rate) + baqaya - advance;
  return { total, rate, advance, baqaya, amount };
}

function renderRecoverySheet(){
  const list = $("recoveryList"), foot = $("recoveryFoot");
  if(!list) return;
  let rows = "", grandMilk = 0, grandAmount = 0, grandAdvance = 0, grandBaqaya = 0;
  data.customers.forEach((c, i) => {
    const { total, rate, advance, baqaya, amount } = getCustomerMonthTotal(c);
    grandMilk += total; grandAmount += amount; grandAdvance += advance; grandBaqaya += baqaya;
    rows += `<tr><td>${i + 1}</td><td>${esc(c.name)}</td><td>${fmt(total)}</td><td>${fmt(rate)}</td><td>${fmt(advance)}</td><td>${fmt(baqaya)}</td><td>${fmt(amount)}</td><td></td><td class="action-cell"><button class="btn blue edit-btn" data-edit-id="${c.id}">Edit</button> <button class="btn red del-btn" data-del-id="${c.id}">Delete</button></td></tr>`;
  });
  list.innerHTML = rows;
  if(foot){
    foot.innerHTML = `<tr><td></td><td style="direction:rtl">کل / Grand Total</td><td>${fmt(grandMilk)}</td><td></td><td>${fmt(grandAdvance)}</td><td>${fmt(grandBaqaya)}</td><td>${fmt(grandAmount)}</td><td></td><td></td></tr>`;
  }
}

function printRecoverySheet(){
  let rows = "", grandMilk = 0, grandAmount = 0, grandAdvance = 0, grandBaqaya = 0;
  data.customers.forEach((c, i) => {
    const { total, rate, advance, baqaya, amount } = getCustomerMonthTotal(c);
    grandMilk += total; grandAmount += amount; grandAdvance += advance; grandBaqaya += baqaya;
    rows += `<tr><td>${i + 1}</td><td>${esc(c.name)}</td><td>${fmt(total)}</td><td>${fmt(rate)}</td><td>${fmt(advance)}</td><td>${fmt(baqaya)}</td><td>${fmt(amount)}</td><td></td></tr>`;
  });

  const html = `<div class="recovery-sheet">
  <div class="rs-title">Rauf Cattle Farm</div>
  <div class="rs-subtitle">Customer Recovery Sheet — ${monthLabel(currentMonth)}</div>
  <table class="rs-table">
    <thead><tr><th>Sr.No</th><th>Customer Name</th><th>Milk KG</th><th>Rate</th><th>Advance</th><th>Sabqa Baqaya</th><th>Total Amount</th><th>Recovery</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2">Grand Total</td><td>${fmt(grandMilk)}</td><td></td><td>${fmt(grandAdvance)}</td><td>${fmt(grandBaqaya)}</td><td>${fmt(grandAmount)}</td><td></td></tr></tfoot>
  </table>
  <div class="rs-footer">Printed by Rauf Cattle Farm — ${monthLabel(currentMonth)}</div>
  </div>`;

  openPrintPreview(html, { defaultPageSize: "A4" });
}

function fmt(v){ return Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function esc(s){ return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

/* Global Event Listeners */
document.querySelectorAll(".menu-btn").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".menu-btn").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); 
    if($(b.dataset.page)) $(b.dataset.page).classList.add("active");
  };
});

if($("monthPicker")){
  $("monthPicker").value = currentMonth;
  $("monthPicker").onchange = () => { currentMonth = $("monthPicker").value; render(); };
}

if($("saveCustomer")){
  $("saveCustomer").onclick = () => {
   const name = $("newName").value.trim(); if(!name) return;
   const c = { id: Date.now().toString(), name, contact: $("newContact").value.trim(), rate: Number($("newRate").value || 200) };
   data.customers.push(c); 
   ensureMonth(); 
   save(); 
   $("newName").value = ""; 
   $("newContact").value = "";
   render();
  };
}

if($("milkTable")){
  $("milkTable").addEventListener("input", e => {
   if(e.target.classList.contains("day-input")){
    const id = e.target.dataset.id, day = e.target.dataset.day; 
    ensureMonth();
    data.months[currentMonth][id].milk[day] = e.target.value === "" ? "" : Number(e.target.value);
    save(); 
    updateCalculations();
   }
   if(e.target.classList.contains("rate-input")){
    const id = e.target.dataset.rateId;
    ensureMonth();
    data.months[currentMonth][id].rate = e.target.value === "" ? 0 : Number(e.target.value);
    save();
    updateCalculations();
    renderRecoverySheet();
   }
   if(e.target.classList.contains("adv-input")){
    const id = e.target.dataset.advId;
    ensureMonth();
    data.months[currentMonth][id].advance = e.target.value === "" ? 0 : Number(e.target.value);
    save();
    updateCalculations();
    renderRecoverySheet();
   }
   if(e.target.classList.contains("baqaya-input")){
    const id = e.target.dataset.baqayaId;
    ensureMonth();
    data.months[currentMonth][id].baqaya = e.target.value === "" ? 0 : Number(e.target.value);
    save();
    updateCalculations();
    renderRecoverySheet();
   }
  });
  $("milkTable").addEventListener("click", e => {
   const printId = e.target.dataset.printId;
   if(printId) printCustomer(printId);
   const editId = e.target.dataset.editId;
   if(editId) openEditModal(editId);
   const delId = e.target.dataset.delId;
   if(delId) deleteCustomerById(delId);
  });
}

if($("expensesTable")){
  $("expensesTable").addEventListener("input", e => {
    if(e.target.classList.contains("exp-input")){
      const tr = e.target.closest("tr");
      let id = tr.dataset.expId;
      const field = e.target.dataset.field;
      const nextKey = getNextMonthKey();

      if (!data.expenses[nextKey]) data.expenses[nextKey] = [];

      if (!id) {
        id = Date.now().toString();
        tr.dataset.expId = id;
        const newObj = { id: id, date: "", details: "", name: "", amount: 0, advance: 0 };
        data.expenses[nextKey].push(newObj);
      }

      const item = data.expenses[nextKey].find(x => x.id === id);
      if(item){
        if(field === "amount" || field === "advance"){
          item[field] = Number(e.target.value || 0);
        } else {
          item[field] = e.target.value;
        }
        save();
        
        let totalAmt = 0, totalAdv = 0;
        data.expenses[nextKey].forEach(x => {
          totalAmt += Number(x.amount || 0);
          totalAdv += Number(x.advance || 0);
        });
        if($("expTotalAmount")) $("expTotalAmount").textContent = fmt(totalAmt);
        if($("expTotalAdvance")) $("expTotalAdvance").textContent = fmt(totalAdv);
        if($("expNetTotal")) $("expNetTotal").textContent = fmt(totalAmt - totalAdv);
      }
    }
  });

  $("expensesTable").addEventListener("click", e => {
    if(e.target.classList.contains("delete-exp-btn")){
      const id = e.target.dataset.expId;
      const nextKey = getNextMonthKey();
      data.expenses[nextKey] = (data.expenses[nextKey] || []).filter(x => x.id !== id);
      save();
      renderExpenses();
    }
  });
}

if($("addExpenseRowBtn")){
  $("addExpenseRowBtn").onclick = () => {
    const nextKey = getNextMonthKey();
    if(!data.expenses[nextKey]) data.expenses[nextKey] = [];
    data.expenses[nextKey].push({
      id: Date.now().toString(), date: "", details: "", name: "", amount: 0, advance: 0
    });
    save();
    renderExpenses();
  };
}

if($("printRecoveryBtn")){
  $("printRecoveryBtn").onclick = () => printRecoverySheet();
}

if($("refreshRecoveryBtn")){
  $("refreshRecoveryBtn").onclick = () => { ensureMonth(); render(); };
}

/* Backup: Export / Import */
if($("exportBtn")){
  $("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `RaufCattleFarm_Backup_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

if($("importBtn") && $("importFile")){
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try{
        const imported = JSON.parse(evt.target.result);
        if(!imported || typeof imported !== "object" || !Array.isArray(imported.customers)){
          alert("یہ فائل درست Backup فائل نہیں ہے۔");
          e.target.value = "";
          return;
        }
        const ok = confirm("Import کرنے سے موجودہ تمام ڈیٹا Overwrite ہو جائے گا۔ کیا آپ جاری رکھنا چاہتے ہیں؟");
        if(!ok){ e.target.value = ""; return; }
        data = imported;
        if(!Array.isArray(data.customers)) data.customers = [];
        if(!data.months || typeof data.months !== "object") data.months = {};
        if(!data.expenses || typeof data.expenses !== "object") data.expenses = {};
        save();
        render();
        alert("Backup کامیابی سے Import ہو گیا۔");
      } catch(err){
        alert("فائل پڑھنے میں مسئلہ ہوا۔ درست JSON Backup فائل منتخب کریں۔");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });
}

if($("recoveryTable")){
  $("recoveryTable").addEventListener("click", e => {
    const delId = e.target.dataset.delId;
    if(delId) deleteCustomerById(delId);
    const editId = e.target.dataset.editId;
    if(editId) openEditModal(editId);
  });
}

/* Excel Functions */
function initExcelPaste(){
  document.addEventListener("paste", function(e) {
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.classList.contains("day-input")) return;
    
    const targetCell = activeEl.closest(".milk-cell");
    if (!targetCell) return;

    e.preventDefault();
    const clipboardData = (e.clipboardData || window.clipboardData).getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r\n|\n|\r/);
    const startRow = parseInt(targetCell.dataset.row);
    const startDay = parseInt(targetCell.dataset.day);

    ensureMonth();

    rows.forEach((rowStr, rIdx) => {
      if (rowStr === "" && rIdx === rows.length - 1) return;
      const cols = rowStr.split('\t');
      cols.forEach((valStr, cIdx) => {
        const targetRow = startRow + rIdx;
        const targetDay = startDay + cIdx;

        const cell = $("milkTable").querySelector(`.milk-cell[data-day="${targetDay}"][data-row="${targetRow}"]`);
        if (cell) {
          const input = cell.querySelector(".day-input");
          const cleanVal = valStr.trim();
          
          input.value = cleanVal;
          const id = input.dataset.id;
          const day = input.dataset.day;
          
          data.months[currentMonth][id].milk[day] = (cleanVal === "" || isNaN(Number(cleanVal))) ? "" : Number(cleanVal);
        }
      });
    });

    save();
    updateCalculations();
  });
}

function initExcelDrag(){
  let isDragging = false;
  let startValue = "";
  let startDay = null;
  let startRow = null;
  let targetInputs = [];

  const table = $("milkTable");
  if(!table) return;

  table.addEventListener("mousedown", e => {
    if (e.target.classList.contains("drag-handle")) {
      isDragging = true;
      const cell = e.target.closest(".milk-cell");
      const input = cell.querySelector(".day-input");
      startValue = input.value;
      startDay = cell.dataset.day;
      startRow = parseInt(cell.dataset.row);
      e.preventDefault();
    }
  });

  table.addEventListener("mouseover", e => {
    if (!isDragging) return;
    const cell = e.target.closest(".milk-cell");
    if (cell && cell.dataset.day === startDay) {
      const currentRow = parseInt(cell.dataset.row);
      document.querySelectorAll(".day-input").forEach(i => i.classList.remove("drag-selected"));
      targetInputs = [];

      const minRow = Math.min(startRow, currentRow);
      const maxRow = Math.max(startRow, currentRow);

      for (let r = minRow; r <= maxRow; r++) {
        const targetCell = table.querySelector(`.milk-cell[data-day="${startDay}"][data-row="${r}"]`);
        if (targetCell) {
          const inp = targetCell.querySelector(".day-input");
          inp.classList.add("drag-selected");
          targetInputs.push(inp);
        }
      }
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      targetInputs.forEach(inp => {
        inp.value = startValue;
        inp.classList.remove("drag-selected");
        const id = inp.dataset.id;
        const day = inp.dataset.day;
        ensureMonth();
        data.months[currentMonth][id].milk[day] = startValue === "" ? "" : Number(startValue);
      });
      save();
      updateCalculations();
      targetInputs = [];
    }
  });
}

function createQR(box, textData) {
  if(!box) return;
  box.innerHTML = "";
  // The "bill" QR carries a lot more data (name/month/rate/daily milk figures) than the
  // plain "link" QR, so it needs a higher-resolution image + a proper quiet zone (margin)
  // and lower error-correction (more raw capacity) so it still scans reliably once printed
  // small on an A6 slip. Its on-screen/print size is bumped up via CSS ([data-qr-type="bill"]).
  const isBill = box.dataset.qrType === "bill";
  const size = isBill ? "400x400" : "250x250";
  const ecc = isBill ? "L" : "M";
  const img = document.createElement("img");
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&ecc=${ecc}&margin=8&data=${encodeURIComponent(textData)}`;
  img.alt = isBill ? "Bill QR" : "Website QR";
  box.appendChild(img);
}

/* Shows an on-screen Print Preview modal before opening the OS print dialog.
   options.afterInsertCallback(container) runs right after the HTML is inserted, useful for QR codes etc.
   options.defaultPageSize sets the initial Page Size dropdown value ("A6", "A5", "A4", "Letter"). */
const PAGE_SIZE_MM = {
  A6: { portrait: "105mm 148mm", landscape: "148mm 105mm" },
  A5: { portrait: "148mm 210mm", landscape: "210mm 148mm" },
  A4: { portrait: "210mm 297mm", landscape: "297mm 210mm" },
  Letter: { portrait: "8.5in 11in", landscape: "11in 8.5in" }
};
const PAGE_PREVIEW_WIDTH = { A6: "380px", A5: "460px", A4: "620px", Letter: "640px" };

function openPrintPreview(html, options){
  options = options || {};
  const afterInsertCallback = options.afterInsertCallback;
  const modal = $("printPreviewModal"), content = $("previewContent");
  if(!modal || !content){
    if($("printArea")){
      $("printArea").innerHTML = html;
      if(afterInsertCallback) afterInsertCallback($("printArea"));
      setTimeout(() => { window.print(); }, 400);
    }
    return;
  }

  let scale = 1;
  let pageSize = options.defaultPageSize || "A4";
  let orientation = "portrait";

  content.innerHTML = html;
  if(afterInsertCallback) afterInsertCallback(content);
  modal.classList.remove("hidden");

  const pageSizeSelect = $("previewPageSize"), layoutSelect = $("previewLayout"), zoomLevel = $("zoomLevel");

  function applyDynamicPage(){
    let styleTag = document.getElementById("dynamicPrintPageStyle");
    if(!styleTag){
      styleTag = document.createElement("style");
      styleTag.id = "dynamicPrintPageStyle";
      document.head.appendChild(styleTag);
    }
    const dims = (PAGE_SIZE_MM[pageSize] || PAGE_SIZE_MM.A4)[orientation];
    styleTag.textContent = `@page{size:${dims};margin:6mm}`;
    content.style.maxWidth = PAGE_PREVIEW_WIDTH[pageSize] || "500px";
  }

  function applyScale(){
    content.style.zoom = scale;
    if(zoomLevel) zoomLevel.textContent = Math.round(scale * 100) + "%";
  }

  if(pageSizeSelect) pageSizeSelect.value = pageSize;
  if(layoutSelect) layoutSelect.value = orientation;
  if(zoomLevel) zoomLevel.textContent = "100%";
  applyDynamicPage();
  applyScale();

  if(pageSizeSelect){
    pageSizeSelect.onchange = () => { pageSize = pageSizeSelect.value; applyDynamicPage(); };
  }
  if(layoutSelect){
    layoutSelect.onchange = () => { orientation = layoutSelect.value; applyDynamicPage(); };
  }
  if($("zoomIn")) $("zoomIn").onclick = () => { scale = Math.min(2, +(scale + 0.1).toFixed(2)); applyScale(); };
  if($("zoomOut")) $("zoomOut").onclick = () => { scale = Math.max(0.5, +(scale - 0.1).toFixed(2)); applyScale(); };

  $("confirmPrintBtn").onclick = () => {
    if($("printArea")){
      $("printArea").innerHTML = html;
      $("printArea").style.zoom = scale;
      if(afterInsertCallback) afterInsertCallback($("printArea"));
    }
    applyDynamicPage();
    modal.classList.add("hidden");
    setTimeout(() => { window.print(); }, 300);
  };
  $("cancelPreviewBtn").onclick = () => modal.classList.add("hidden");
  $("closePreview").onclick = () => modal.classList.add("hidden");
}

function printCustomer(id){
 ensureMonth(); 
 const c = data.customers.find(x => x.id === id); 
 if(!c) return;
 const rec = data.months[currentMonth][id] || { milk: {}, rate: c.rate || 200, advance: 0, baqaya: 0 }, n = daysInMonth(currentMonth);
 const rate = Number(rec.rate ?? c.rate ?? 0); 
 const advance = Number(rec.advance || 0);
 const baqaya = Number(rec.baqaya || 0);
 let total = 0, rows = "";
 
 let milkList = [];
 for(let d = 1; d <= n; d++){
   const v = Number(rec.milk[d] || 0); 
   total += v; 
   const dStr = String(d).padStart(2, "0");
   const dateStr = `${dStr}-${currentMonth.split("-")[1]}-${currentMonth.split("-")[0]}`;
   rows += `<tr><td>${dateStr}</td><td>${v ? fmt(v) : ""}</td><td></td><td>${v ? fmt(v * rate) : ""}</td></tr>`;
   if(v > 0) milkList.push(`${d}:${v}`);
 }
 const milkAmount = total * rate;
 const amount = milkAmount + baqaya - advance;

 const compactData = JSON.stringify({ n: c.name, m: currentMonth, r: rate, d: milkList.join(","), a: advance, b: baqaya });
 const encodedBill = encodeURIComponent(btoa(unescape(encodeURIComponent(compactData))));
 
 const baseUrl = "https://introductionfood.netlify.app/";
 const billUrl = `${baseUrl}?bdata=${encodedBill}`;

 // The "Scan Bill Data" QR no longer depends on introductionfood.netlify.app recognising
 // a ?bdata= parameter (that requires the exact latest app.js to be deployed there, and a
 // live internet connection to open it). Instead it encodes the bill as plain, human-readable
 // text directly inside the QR code itself — any QR scanner (even offline) will show the
 // customer's name, month, milk total, rate and amount immediately, with nothing to deploy.
 const billText =
`RAUF CATTLE FARM
Customer: ${c.name}
Month: ${monthLabel(currentMonth)}
Total Milk: ${fmt(total)} KG
Rate: Rs. ${fmt(rate)} / KG
Milk Amount: Rs. ${fmt(milkAmount)}
Sabqa Baqaya: Rs. ${fmt(baqaya)}
Advance: Rs. ${fmt(advance)}
Total Amount: Rs. ${fmt(amount)}`;

 const html = `<div class="a6-sheet">
 <div class="a6-title">Rauf Cattle Farm</div>
 <div class="a6-subtitle">دودھ کا ماہانہ حساب</div>
 <div class="a6-name">${esc(c.name)}</div>
 <div class="a6-info"><span><b>Contact:</b> ${esc(c.contact || "")}</span><span><b>Month:</b> ${monthLabel(currentMonth)}</span></div>
 <table class="a6-table"><thead><tr><th>Date</th><th>T.Milk KG</th><th>Advance</th><th>Total Bill</th></tr></thead><tbody>${rows}</tbody>
 <tfoot><tr class="a6-total"><td>Total Milk</td><td>${fmt(total)} KG</td><td></td><td>${fmt(milkAmount)}</td></tr></tfoot></table>
 <div class="a6-final">
 <div><span>Total Milk</span><b>${fmt(total)} KG</b><span>کل دودھ</span></div>
 <div><span>Rate</span><b>Rs. ${fmt(rate)}</b><span>ریٹ</span></div>
 <div><span>Milk Amount</span><b>Rs. ${fmt(milkAmount)}</b><span>دودھ کی رقم</span></div>
 <div><span>Sabqa Baqaya</span><b>Rs. ${fmt(baqaya)}</b><span>سابقہ بقایا</span></div>
 <div><span>Advance</span><b>- Rs. ${fmt(advance)}</b><span>ایڈوانس</span></div>
 <div><span>Total Amount</span><b>Rs. ${fmt(amount)}</b><span>کل رقم</span></div>
 </div>
 
 <div class="qr-container">
   <div class="qr-block">
     <div class="bill-qr-box" data-qr-type="bill"></div>
     <span>Scan Bill Data</span>
   </div>
   <div class="qr-block">
     <div class="bill-qr-box" data-qr-type="link"></div>
     <span>Website Link</span>
   </div>
 </div>

 <div class="a6-footer">
 <div class="printed-by">This bill Printed by <b>AreebAfzal</b></div>
 <div class="phone-number">03063741745</div>
 <div class="website-line"><a href="${billUrl}">${billUrl}</a></div>
 </div>
 </div>`;

 openPrintPreview(html, {
   defaultPageSize: "A6",
   afterInsertCallback: container => {
     createQR(container.querySelector('[data-qr-type="bill"]'), billText);
     createQR(container.querySelector('[data-qr-type="link"]'), baseUrl);
   }
 });
}

function checkScannedBill(){
  const urlParams = new URLSearchParams(window.location.search);
  const bdata = urlParams.get("bdata");

  if(bdata){
    try{
      // Note: URLSearchParams.get() already URL-decodes the value once, so we should NOT
      // call decodeURIComponent on it again here — bdata is already the raw base64 string.
      const decodedJson = JSON.parse(decodeURIComponent(escape(atob(bdata))));
      const name = decodedJson.n || "";
      const month = decodedJson.m || "";
      const rate = Number(decodedJson.r || 0);
      const milkStr = decodedJson.d || "";
      const advance = Number(decodedJson.a || 0);
      const baqaya = Number(decodedJson.b || 0);

      const milkMap = {};
      if(milkStr){
        milkStr.split(",").forEach(item => {
          const [d, v] = item.split(":");
          if(d && v) milkMap[d] = Number(v);
        });
      }

      const n = daysInMonth(month);
      let total = 0, rows = "";
      for(let d = 1; d <= n; d++){
        const v = milkMap[d] || 0;
        total += v;
        const dStr = String(d).padStart(2, "0");
        const dateStr = `${dStr}-${month.split("-")[1]}-${month.split("-")[0]}`;
        rows += `<tr><td>${dateStr}</td><td>${v ? fmt(v) : ""}</td><td>${v ? fmt(v * rate) : ""}</td></tr>`;
      }
      const milkAmount = total * rate;
      const amount = milkAmount + baqaya - advance;

      document.body.innerHTML = `<div style="max-width:420px;margin:20px auto;padding:15px;background:#fff;border:1px solid #ccc;border-radius:8px;font-family:Arial,sans-serif;direction:rtl;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        <h2 style="text-align:center;color:#c00;margin:0 0 5px;">Rauf Cattle Farm</h2>
        <h4 style="text-align:center;margin:0 0 10px;color:#555;">دودھ کا ماہانہ حساب</h4>
        <h3 style="text-align:center;margin:10px 0;color:#17365d;">${esc(name)}</h3>
        <p style="text-align:center;font-size:13px;margin-bottom:15px;"><b>مہینہ:</b> ${monthLabel(month)}</p>
        
        <table style="width:100%;border-collapse:collapse;font-size:12px;direction:ltr;text-align:center;" border="1">
          <thead><tr style="background:#eee;"><th>Date</th><th>Milk KG</th><th>Total Rs</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="background:#f8f9fa;padding:12px;border-radius:6px;font-size:14px;line-height:1.8;margin-top:15px;">
          <div style="display:flex;justify-content:space-between;"><span>کل دودھ:</span><b>${fmt(total)} KG</b></div>
          <div style="display:flex;justify-content:space-between;"><span>ریٹ (فی کلو):</span><b>Rs. ${fmt(rate)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span>دودھ کی رقم:</span><b>Rs. ${fmt(milkAmount)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span>سابقہ بقایا:</span><b>Rs. ${fmt(baqaya)}</b></div>
          <div style="display:flex;justify-content:space-between;"><span>ایڈوانس:</span><b>- Rs. ${fmt(advance)}</b></div>
          <hr style="border:0;border-top:1px solid #ddd;margin:8px 0;">
          <div style="display:flex;justify-content:space-between;font-size:16px;color:#c00;"><span>کل رقم:</span><b>Rs. ${fmt(amount)}</b></div>
        </div>

        <div style="text-align:center;margin-top:20px;">
          <a href="https://introductionfood.netlify.app/" style="padding:10px 20px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:5px;font-size:13px;display:inline-block;">مرکزی ویب سائٹ پر جائیں</a>
        </div>
      </div>`;
    } catch(e) {
      console.error(e);
    }
  }
}

// Initial Call
render();
checkScannedBill();