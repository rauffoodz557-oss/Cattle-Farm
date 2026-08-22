const KEY="raufCattleFarmData_v1";
let data=JSON.parse(localStorage.getItem(KEY)||"null")||{customers:[],months:{}};
const defaultCustomers=["ڈاکٹر تنویر","عامرعاطف","عمر قصاِئی","بشارت بوس","فیصل","عاطف","نعمان","الحمد گڈز","راشد","ناصر","یاسر","مولانا شفقت اللہ","جاوید شاہ فوٹو اسٹیٹ","راحیل","امجد بلوچ","عامر","چناب یاسر پمپ","عبداللہ پٹھان","جاوید چک 72","قیوم","مولوی طاہر","عرفان","ندیم ہوٹل","شہزیب","شکور ہوٹل","فیصل","مغل","عثمان"];

if(!Array.isArray(data.customers)) data.customers=[];
defaultCustomers.forEach((name,i)=>{
  if(!data.customers[i]){
    data.customers[i]={id:String(i+1),name,contact:"",rate:200};
  }else if(!String(data.customers[i].name||"").trim()){
    data.customers[i].name=name;
  }
});
data.customers=data.customers.map((c,i)=>({
  id:String(c.id||i+1),
  name:String(c.name||defaultCustomers[i]||"").trim(),
  contact:String(c.contact||""),
  rate:Number(c.rate||200)
}));
localStorage.setItem(KEY,JSON.stringify(data));

const $=id=>document.getElementById(id);
const today=new Date();
let currentMonth=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function daysInMonth(ym){const [y,m]=ym.split("-").map(Number);return new Date(y,m,0).getDate()}
function monthLabel(ym){const [y,m]=ym.split("-").map(Number);return new Date(y,m-1,1).toLocaleString("en-US",{month:"long",year:"numeric"})}
function ensureMonth(){
  if(!data.months[currentMonth]) data.months[currentMonth]={};
  data.customers.forEach(c=>{if(!data.months[currentMonth][c.id]) data.months[currentMonth][c.id]={milk:{},rate:c.rate||200}});
  save();
}
function render(){
  ensureMonth();
  if($("monthTitle")) $("monthTitle").textContent=monthLabel(currentMonth);
  renderMilk(); renderCustomers(); save();
}
function renderMilk(){
 const milkTable = $("milkTable");
 if(!milkTable) return;
 const n=daysInMonth(currentMonth), month=data.months[currentMonth];
 let h="<tr><th>Sr.No</th><th class='name-head'>Customer Name</th>";
 for(let d=1;d<=n;d++)h+=`<th>${String(d).padStart(2,"0")}</th>`;
 h+=`<th>Total Milk</th><th>Rate</th><th>Total</th><th>Print Bill</th></tr>`;
 milkTable.querySelector("thead").innerHTML=h;
 let body="", daily=Array(n).fill(0), grand=0;
 data.customers.forEach((c,i)=>{
   const rec=month[c.id]||{milk:{},rate:c.rate||200}; let total=0;
   body+=`<tr data-row-idx="${i}"><td>${i+1}</td><td class="name-cell">${esc(c.name)}</td>`;
   for(let d=1;d<=n;d++){
     const v=rec.milk[d]??"";
     if(v!==""&&!isNaN(Number(v))){daily[d-1]+=Number(v);total+=Number(v)}
     body+=`<td class="milk-cell" data-day="${d}" data-row="${i}">
              <input class="day-input" type="number" step="0.1" min="0" value="${v}" data-id="${c.id}" data-day="${d}">
              <div class="drag-handle" title="Drag to fill"></div>
            </td>`;
   }
   const rate=rec.rate??c.rate??200, amount=total*Number(rate||0);grand+=total;
   body+=`<td class="total-cell" id="total-${c.id}">${fmt(total)}</td><td><input class="rate-input" type="number" min="0" step="0.01" value="${rate}" data-rate-id="${c.id}"></td><td class="amount-cell" id="amount-${c.id}">${fmt(amount)}</td><td class="action-cell"><button class="print-btn" data-print-id="${c.id}">Print</button></td></tr>`;
 });
 milkTable.querySelector("tbody").innerHTML=body;
 let foot="<tr><td></td><td style='direction:rtl'>کل وزن دودھ</td>";
 daily.forEach((v, idx)=>foot+=`<td id="daily-sum-${idx+1}">${fmt(v)}</td>`);
 foot+=`<td id="footGrandTotal">${fmt(grand)}</td><td></td><td></td><td></td></tr>`;
 milkTable.querySelector("tfoot").innerHTML=foot;
 if($("grandTotal")) $("grandTotal").textContent=fmt(grand);

 initExcelDrag();
}

function updateCalculations(){
  const n=daysInMonth(currentMonth), month=data.months[currentMonth];
  let daily=Array(n).fill(0), grand=0;
  data.customers.forEach((c)=>{
    const rec=month[c.id]||{milk:{},rate:c.rate||200};
    let total=0;
    for(let d=1;d<=n;d++){
      const v=rec.milk[d]??"";
      if(v!==""&&!isNaN(Number(v))){daily[d-1]+=Number(v);total+=Number(v)}
    }
    const rate=rec.rate??c.rate??200;
    const amount=total*Number(rate||0);
    grand+=total;
    if($(`total-${c.id}`)) $(`total-${c.id}`).textContent=fmt(total);
    if($(`amount-${c.id}`)) $(`amount-${c.id}`).textContent=fmt(amount);
  });
  daily.forEach((v, idx)=>{
    if($(`daily-sum-${idx+1}`)) $(`daily-sum-${idx+1}`).textContent=fmt(v);
  });
  if($("footGrandTotal")) $("footGrandTotal").textContent=fmt(grand);
  if($("grandTotal")) $("grandTotal").textContent=fmt(grand);
}

function renderCustomers(){
 if(!$("customerSearch") || !$("customerList")) return;
 const q=$("customerSearch").value.trim().toLowerCase();
 let rows="";
 data.customers.filter(c=>c.name.toLowerCase().includes(q)||String(c.contact||"").includes(q)).forEach((c,i)=>{
  rows+=`<tr><td>${i+1}</td><td>${esc(c.name)}</td><td>${esc(c.contact||"")}</td><td>${fmt(c.rate||200)}</td><td><button class="btn blue edit-btn" data-id="${c.id}">Edit</button></td></tr>`;
 });
 $("customerList").innerHTML=rows;
}
function fmt(v){return Number(v||0).toLocaleString("en-US",{maximumFractionDigits:2})}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

document.querySelectorAll(".menu-btn").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".menu-btn").forEach(x=>x.classList.remove("active"));
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 b.classList.add("active"); if($(b.dataset.page)) $(b.dataset.page).classList.add("active");
});

if($("monthPicker")){
  $("monthPicker").value=currentMonth;
  $("monthPicker").onchange=()=>{currentMonth=$("monthPicker").value;render()};
}

if($("saveCustomer")){
  $("saveCustomer").onclick=()=>{
   const name=$("newName").value.trim(); if(!name) return;
   const c={id:Date.now().toString(),name,contact:$("newContact").value.trim(),rate:Number($("newRate").value||200)};
   data.customers.push(c); ensureMonth(); save(); $("newName").value="";$("newContact").value="";
   render();
  };
}

if($("milkTable")){
  $("milkTable").addEventListener("input",e=>{
   if(e.target.classList.contains("day-input")){
    const id=e.target.dataset.id,day=e.target.dataset.day; ensureMonth();
    data.months[currentMonth][id].milk[day]=e.target.value===""?"":Number(e.target.value);
    save(); 
    updateCalculations();
   }
  });
  $("milkTable").addEventListener("click",e=>{
   const id=e.target.dataset.printId;if(id)printCustomer(id);
  });
}

/* Excel Drag to Fill Functionality */
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

function createQR(elementId, textData) {
  const box = document.getElementById(elementId);
  if(!box) return;
  box.innerHTML = "";
  const img = document.createElement("img");
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(textData)}`;
  img.style.width = "70px";
  img.style.height = "70px";
  box.appendChild(img);
}

function printCustomer(id){
 ensureMonth(); const c=data.customers.find(x=>x.id===id); if(!c) return;
 const rec=data.months[currentMonth][id]||{milk:{},rate:c.rate||200}, n=daysInMonth(currentMonth);
 const rate=Number(rec.rate??c.rate??0); let total=0, rows="";
 
 let milkList = [];
 for(let d=1; d<=n; d++){
   const v=Number(rec.milk[d]||0); 
   total+=v; 
   const dStr = String(d).padStart(2,"0");
   const dateStr = `${dStr}-${currentMonth.split("-")[1]}-${currentMonth.split("-")[0]}`;
   rows+=`<tr><td>${dateStr}</td><td>${v?fmt(v):""}</td><td>${v?fmt(v*rate):""}</td></tr>`;
   if(v > 0) milkList.push(`${d}:${v}`);
 }
 const amount=total*rate;

 const compactData = JSON.stringify({n:c.name, m:currentMonth, r:rate, d:milkList.join(",")});
 const encodedBill = encodeURIComponent(btoa(unescape(encodeURIComponent(compactData))));
 
 const baseUrl = "https://introductionfood.netlify.app/";
 const billUrl = `${baseUrl}?bdata=${encodedBill}`;

 if($("printArea")){
   $("printArea").innerHTML=`<div class="a6-sheet">
   <div class="a6-title">Rauf Cattle Farm</div>
   <div class="a6-subtitle">دودھ کا ماہانہ حساب</div>
   <div class="a6-name">${esc(c.name)}</div>
   <div class="a6-info"><span><b>Contact:</b> ${esc(c.contact||"")}</span><span><b>Month:</b> ${monthLabel(currentMonth)}</span></div>
   <table class="a6-table"><thead><tr><th>Date</th><th>T.Milk KG</th><th>Total Bill</th></tr></thead><tbody>${rows}</tbody>
   <tfoot><tr class="a6-total"><td>Total Milk</td><td>${fmt(total)} KG</td><td>${fmt(amount)}</td></tr></tfoot></table>
   <div class="a6-final">
   <div><span>Total Milk</span><b>${fmt(total)} KG</b><span>کل دودھ</span></div>
   <div><span>Rate</span><b>Rs. ${fmt(rate)}</b><span>ریٹ</span></div>
   <div><span>Total Amount</span><b>Rs. ${fmt(amount)}</b><span>کل رقم</span></div>
   </div>
   
   <div class="qr-container">
     <div class="qr-block">
       <div id="billQrCode" class="bill-qr-box"></div>
       <span>Scan Bill Data</span>
     </div>
     <div class="qr-block">
       <div id="linkQrCode" class="bill-qr-box"></div>
       <span>Website Link</span>
     </div>
   </div>

   <div class="a6-footer">
   <div class="printed-by">This bill Printed by <b>AreebAfzal</b></div>
   <div class="phone-number">03063741745</div>
   <div class="website-line"><a href="${billUrl}">${billUrl}</a></div>
   </div>
   </div>`;

   createQR("billQrCode", billUrl);
   createQR("linkQrCode", baseUrl);

   setTimeout(()=>{ window.print(); }, 500);
 }
}

function checkScannedBill(){
  const urlParams = new URLSearchParams(window.location.search);
  const bdata = urlParams.get("bdata");

  if(bdata){
    try{
      const decodedJson = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(bdata)))));
      const name = decodedJson.n || "";
      const month = decodedJson.m || "";
      const rate = Number(decodedJson.r || 0);
      const milkStr = decodedJson.d || "";

      const milkMap = {};
      if(milkStr){
        milkStr.split(",").forEach(item => {
          const [d, v] = item.split(":");
          if(d && v) milkMap[d] = Number(v);
        });
      }

      const n = daysInMonth(month);
      let total = 0, rows = "";
      for(let d=1; d<=n; d++){
        const v = milkMap[d] || 0;
        total += v;
        const dStr = String(d).padStart(2,"0");
        const dateStr = `${dStr}-${month.split("-")[1]}-${month.split("-")[0]}`;
        rows += `<tr><td>${dateStr}</td><td>${v ? fmt(v) : ""}</td><td>${v ? fmt(v*rate) : ""}</td></tr>`;
      }
      const amount = total * rate;

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

// Initialize on page load
render();
checkScannedBill();