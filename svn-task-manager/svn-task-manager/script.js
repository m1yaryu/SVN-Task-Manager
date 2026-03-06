(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const uid = (p='id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;

  const KEY = {
    tasks: "svn_tasks_role_v2",
    workers: "svn_workers_role_v2",
    products: "svn_products_role_v2",
    orders: "svn_orders_role_v2",
    session: "svn_session_role_v2",
    activity: "svn_activity_role_v2",
    theme: "svn_theme_v1",
    logs: "svn_logs_v1"
  };

  // Login refs
  const loginScreen = $("#loginScreen");
  const appRoot = $("#appRoot");
  const loginRole = $("#loginRole");
  const loginViewerBox = $("#loginViewerBox");
  const loginShopperBox = $("#loginShopperBox");
  const loginAdminBox = $("#loginAdminBox");
  const loginWorkerSelect = $("#loginWorkerSelect");
  const loginShopperName = $("#loginShopperName");
  const loginAdminPass = $("#loginAdminPass");
  const loginSubmit = $("#loginSubmit");

  // App refs
  const themeToggle = $("#themeToggle");
  const rolePill = $("#rolePill");
  const logoutBtn = $("#logoutBtn");
  const subtitle = $("#subtitle");

  const searchInput = $("#searchInput");
  const workerCountEl = $("#workerCount");
  const taskTotalEl = $("#taskTotal");
  const taskOverdueEl = $("#taskOverdue");
  const taskTodayEl = $("#taskToday");
  const taskSummaryEl = $("#taskSummary");

  const addTaskBtn = $("#addTaskBtn");
  const workersBtn = $("#workersBtn");
  const addProductBtn = $("#addProductBtn");
  const cartBtn = $("#cartBtn");
  const cartCountEl = $("#cartCount");
  const exportBtn = $("#exportBtn");

  const todoCol = $("#todoCol");
  const progCol = $("#progCol");
  const doneCol = $("#doneCol");

  const productGrid = $("#productGrid");
  const ordersList = $("#ordersList");

  const logsList = $("#logsList");
  const clearLogsBtn = $("#clearLogsBtn");

  const workerStats = $("#workerStats");
  const deliverStats = $("#deliverStats");
  const overallStats = $("#overallStats");

  const importBtn = $("#importBtn");
  const importFile = $("#importFile");

  const backdrop = $("#backdrop");
  const modalTitle = $("#modalTitle");
  const modalBody = $("#modalBody");
  const modalFoot = $("#modalFoot");
  const closeModalBtn = $("#closeModal");

  const toasts = $("#toasts");

  let tasks = [];
  let workers = [];
  let products = [];
  let orders = [];
  let activity = {};
  let session = { role: "guest", userId: "", name: "" };
  let filter = "all";
  let search = "";
  let cart = [];
  let logs = [];
  let theme = "dark";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  const todayStr = (offset=0) => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+offset);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const toDate = (dstr) => {
    if(!dstr) return null;
    const [y,m,d] = dstr.split("-").map(Number);
    const dt = new Date(y, m-1, d); dt.setHours(0,0,0,0);
    return dt;
  };
  const prettyDate = (dstr) => {
    if(!dstr) return "No date";
    return toDate(dstr).toLocaleDateString([], {month:"short", day:"2-digit"});
  };

  const isOverdue = (t) => t.due && t.status !== "done" && toDate(t.due) < toDate(todayStr(0));
  const isToday = (t) => t.due && t.status !== "done" && t.due === todayStr(0);
  const workerName = (id) => workers.find(w => w.id === id)?.name || "Unassigned";

  // category -> icon
  const CAT_ICON = {
    materials: "fa-cubes",
    steel: "fa-bars-staggered",
    wood: "fa-tree",
    plumbing: "fa-faucet-drip",
    electrical: "fa-bolt",
    paint: "fa-paint-roller",
    tools: "fa-screwdriver-wrench",
    safety: "fa-helmet-safety",
    masonry: "fa-trowel-bricks",
    aggregates: "fa-mountain",
    hardware: "fa-screwdriver"
  };

  function toast(title, msg=""){
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <i class="fa-solid fa-circle-info"></i>
      <div><b>${esc(title)}</b>${msg ? `<small>${esc(msg)}</small>`:""}</div>
      <button aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    `;
    toasts.appendChild(el);
    el.querySelector("button").addEventListener("click", () => el.remove());
    setTimeout(()=> el.remove(), 3600);
  }

  function openModal(title, bodyHtml, footHtml=""){
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalFoot.innerHTML = footHtml;
    backdrop.style.display = "flex";
    backdrop.setAttribute("aria-hidden","false");
  }
  function closeModal(){
    backdrop.style.display = "none";
    backdrop.setAttribute("aria-hidden","true");
    modalBody.innerHTML = "";
    modalFoot.innerHTML = "";
  }

  function logEvent(type, message){
    const entry = {
      id: uid("log"),
      at: new Date().toISOString(),
      type,
      message,
      byRole: session?.role || "guest",
      byName: session?.name || "Guest"
    };
    logs.unshift(entry);
    logs = logs.slice(0, 250);
    localStorage.setItem(KEY.logs, JSON.stringify(logs));
  }

  function load(){
    tasks = JSON.parse(localStorage.getItem(KEY.tasks) || "[]");
    workers = JSON.parse(localStorage.getItem(KEY.workers) || "[]");
    products = JSON.parse(localStorage.getItem(KEY.products) || "[]");
    orders = JSON.parse(localStorage.getItem(KEY.orders) || "[]");
    activity = JSON.parse(localStorage.getItem(KEY.activity) || "{}");
    logs = JSON.parse(localStorage.getItem(KEY.logs) || "[]");

    session = JSON.parse(sessionStorage.getItem(KEY.session) || "null") || { role:"guest", userId:"", name:"" };

    theme = localStorage.getItem(KEY.theme) || "dark";
    document.body.setAttribute("data-theme", theme);
  }

  function saveAll(){
    localStorage.setItem(KEY.tasks, JSON.stringify(tasks));
    localStorage.setItem(KEY.workers, JSON.stringify(workers));
    localStorage.setItem(KEY.products, JSON.stringify(products));
    localStorage.setItem(KEY.orders, JSON.stringify(orders));
    localStorage.setItem(KEY.activity, JSON.stringify(activity));
    localStorage.setItem(KEY.logs, JSON.stringify(logs));
    renderAll();
  }

  function saveSession(){
    sessionStorage.setItem(KEY.session, JSON.stringify(session));
    renderAll();
  }

  function seed(){
    if(!localStorage.getItem(KEY.workers)){
      workers = [
        {id:"w1", name:"Vince", role:"Operator"},
        {id:"w2", name:"Daniel", role:"Manager"}
      ];
      localStorage.setItem(KEY.workers, JSON.stringify(workers));
    }

    if(!localStorage.getItem(KEY.tasks)){
      tasks = [
        {id:"t1", title:"Pour foundation", due:todayStr(0), priority:"high", assigned:"w2", status:"todo", notes:"Confirm rebar placement before pour.", confirmed:false},
        {id:"t2", title:"Inspect rebar delivery", due:todayStr(0), priority:"med", assigned:"w1", status:"todo", notes:"Verify invoice quantity + dimensions.", confirmed:false},
        {id:"t3", title:"Estimate lumber", due:todayStr(3), priority:"low", assigned:"w2", status:"todo", notes:"Measure framing sections.", confirmed:false},
      ];
      localStorage.setItem(KEY.tasks, JSON.stringify(tasks));
    }

    if(!localStorage.getItem(KEY.products)){
      products = [
        {id:"p1",  name:"Portland Cement (40kg)", price:285, stock:120, unit:"bag",   category:"masonry"},
        {id:"p2",  name:"Rebar 10mm (6m)",        price:220, stock:80,  unit:"pcs",   category:"steel"},
        {id:"p3",  name:"Lumber 2x4 (8ft)",       price:165, stock:200, unit:"pcs",   category:"wood"},

        /* +10 MORE */
        {id:"p4",  name:"Hollow Blocks 6in",      price:18,  stock:900, unit:"pcs",   category:"masonry"},
        {id:"p5",  name:"Plywood 1/2 (4x8)",      price:780, stock:60,  unit:"sheet", category:"wood"},
        {id:"p6",  name:"GI Wire #16",            price:95,  stock:140, unit:"kg",    category:"steel"},
        {id:"p7",  name:"Nails 2in",              price:65,  stock:220, unit:"kg",    category:"hardware"},
        {id:"p8",  name:"Angle Bar 1.5in (6m)",   price:520, stock:45,  unit:"pcs",   category:"steel"},
        {id:"p9",  name:"Gravel (1 cu. m)",       price:1350,stock:30,  unit:"load",  category:"aggregates"},
        {id:"p10", name:"Sand (1 cu. m)",         price:1200,stock:35,  unit:"load",  category:"aggregates"},
        {id:"p11", name:"PVC Pipe 1/2 (3m)",      price:95,  stock:160, unit:"pcs",   category:"plumbing"},
        {id:"p12", name:"PVC Elbow 1/2",          price:18,  stock:300, unit:"pcs",   category:"plumbing"},
        {id:"p13", name:"Paint Primer (4L)",      price:420, stock:55,  unit:"can",   category:"paint"},

        /* extra “construction feel” */
        {id:"p14", name:"Safety Gloves (pair)",   price:85,  stock:70,  unit:"pair",  category:"safety"},
        {id:"p15", name:"Measuring Tape (5m)",    price:110, stock:45,  unit:"pcs",   category:"tools"}
      ];
      localStorage.setItem(KEY.products, JSON.stringify(products));
    }

    if(!localStorage.getItem(KEY.orders)) localStorage.setItem(KEY.orders, "[]");
    if(!localStorage.getItem(KEY.activity)) localStorage.setItem(KEY.activity, "{}");
    if(!localStorage.getItem(KEY.logs)) localStorage.setItem(KEY.logs, "[]");
    if(!localStorage.getItem(KEY.theme)) localStorage.setItem(KEY.theme, "dark");
  }

  function roleLabel(){
    if(session.role === "admin") return `ADMIN · ${session.name || "Admin"}`;
    if(session.role === "viewer") return `WORKER · ${session.name || "Viewer"}`;
    if(session.role === "shopper") return `SHOPPER · ${session.name || "Shopper"}`;
    return "GUEST";
  }

  function showLoginScreen(){
    loginScreen.style.display = "flex";
    loginScreen.setAttribute("aria-hidden","false");
    appRoot.setAttribute("aria-hidden","true");
    document.body.classList.add("login-open");
  }
  function hideLoginScreen(){
    loginScreen.style.display = "none";
    loginScreen.setAttribute("aria-hidden","true");
    appRoot.setAttribute("aria-hidden","false");
    document.body.classList.remove("login-open");
  }

  function setActiveView(viewName){
    $$(".navbtn").forEach(b => b.classList.toggle("active", b.dataset.view === viewName));
    $$(".view").forEach(v => v.classList.remove("active"));
    const v = $(`#view_${viewName}`);
    if(v) v.classList.add("active");
  }

  function updateNavByRole(){
    const isAdmin = session.role === "admin";
    const isShopper = session.role === "shopper";
    const isViewer = session.role === "viewer";

    document.body.classList.toggle("viewer-mode", isViewer);

    $$(".navbtn").forEach(btn => {
      const r = btn.dataset.role || "all";
      let show = true;

      if(r === "admin") show = isAdmin;
      if(r === "shopper-admin") show = (isAdmin || isShopper);
      if(r === "all") show = true;

      if(isViewer && btn.dataset.view !== "tasks") show = false;

      btn.style.display = show ? "" : "none";
    });

    $$(".admin-only").forEach(el => el.style.display = isAdmin ? "" : "none");

    rolePill.innerHTML = `<i class="fa-solid fa-user"></i> ${esc(roleLabel())}`;

    if(isAdmin) subtitle.textContent = "Admin — manage tasks, workers, products, and orders";
    else if(isViewer) subtitle.textContent = "Worker — view your “To Do” tasks and confirm completion";
    else if(isShopper) subtitle.textContent = "Shopper — browse supplies and place orders";
    else subtitle.textContent = "Sign in to continue";
  }

  function tasksVisible(){
    if(session.role === "viewer" && session.userId){
      return tasks.filter(t => t.assigned === session.userId);
    }
    return tasks.slice();
  }

  function applyTaskFilter(list){
    const t0 = todayStr(0);
    const soon = todayStr(3);
    const q = (search || "").trim().toLowerCase();

    if(session.role === "viewer") {
      list = list.filter(t => t.status === "todo");
    }

    return list.filter(t=>{
      if(filter === "today" && t.due !== t0) return false;
      if(filter === "soon" && !((t.due >= t0 && t.due <= soon))) return false;
      if(filter === "assigned" && !t.assigned) return false;
      if(filter === "overdue" && !isOverdue(t)) return false;

      if(!q) return true;
      const hay = [t.title, t.notes].join(" ").toLowerCase();
      return hay.includes(q);
    }).sort((a,b)=> (a.due||"9999-12-31").localeCompare(b.due||"9999-12-31"));
  }

  function renderCounters(){
    workerCountEl.textContent = String(workers.length);
    taskTotalEl.textContent = String(tasks.length);
    taskOverdueEl.textContent = String(tasks.filter(isOverdue).length);
    taskTodayEl.textContent = String(tasks.filter(isToday).length);

    const total = tasksVisible().length;
    const overdue = tasksVisible().filter(isOverdue).length;
    const dueToday = tasksVisible().filter(isToday).length;
    taskSummaryEl.textContent = `${total} total · ${overdue} overdue · ${dueToday} due today`;
  }

  function badgeDue(t){
    if(isOverdue(t)) return `<span class="tag overdue"><i class="fa-solid fa-triangle-exclamation"></i> OVERDUE</span>`;
    if(isToday(t)) return `<span class="tag due-today"><i class="fa-solid fa-bolt"></i> DUE TODAY</span>`;
    return `<span class="tag"><i class="fa-regular fa-calendar"></i> ${esc(prettyDate(t.due))}</span>`;
  }
  function badgePri(p){
    const cls = p === "high" ? "high" : p === "med" ? "med" : "low";
    return `<span class="tag ${cls}"><i class="fa-solid fa-flag"></i> ${esc(p.toUpperCase())}</span>`;
  }

  function renderKanban(){
    todoCol.innerHTML = "";
    progCol.innerHTML = "";
    doneCol.innerHTML = "";

    const list = applyTaskFilter(tasksVisible());
    if(!list.length){
      todoCol.innerHTML = `<div class="muted">No tasks match filter/search.</div>`;
      return;
    }

    for(const t of list){
      const isViewer = session.role === "viewer";
      const canConfirm = isViewer;

      const card = document.createElement("div");
      card.className = "task";
      card.draggable = (session.role === "admin");
      card.dataset.id = t.id;

      const confirmedTag = t.confirmed
        ? `<span class="tag low"><i class="fa-solid fa-circle-check"></i> CONFIRMED</span>`
        : ``;

      card.innerHTML = `
        <div class="task-main">
          <b>${esc(t.title)}</b>
          ${t.notes ? `<div class="note">${esc(t.notes)}</div>` : ""}
          <div class="meta">
            ${badgeDue(t)}
            ${badgePri(t.priority)}
            <span class="tag"><i class="fa-solid fa-user"></i> ${esc(workerName(t.assigned))}</span>
            ${confirmedTag}
          </div>
        </div>
        <div class="task-actions">
          <button class="iconbtn" data-open-task="${esc(t.id)}" title="Open"><i class="fa-solid fa-up-right-from-square"></i></button>
          ${canConfirm ? `<button class="iconbtn" data-confirm="${esc(t.id)}" title="Confirm done"><i class="fa-solid fa-check"></i></button>` : ``}
          ${(session.role === "admin") ? `<button class="iconbtn" data-edit-task="${esc(t.id)}" title="Edit"><i class="fa-solid fa-pen"></i></button>` : ``}
          ${(session.role === "admin") ? `<button class="iconbtn" data-del-task="${esc(t.id)}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ``}
        </div>
      `;
      const wrap = (t.status === "done") ? doneCol : (t.status === "inprogress" ? progCol : todoCol);
      wrap.appendChild(card);
    }
  }

  function productIcon(cat){
    const key = (cat || "materials").toLowerCase();
    const cls = CAT_ICON[key] || "fa-cubes";
    return `<i class="fa-solid ${cls}"></i>`;
  }

  function renderMarketplace(){
    productGrid.innerHTML = products.map(p => {
      const lowStock = Number(p.stock) < 20;
      const cat = (p.category || "materials");
      return `
        <div class="product">
          <div class="pimg">
            <div>
              <div class="phead">
                <div class="picon">${productIcon(cat)}</div>
                <div>
                  <div class="ptitle">${esc(p.name)}</div>
                  <div class="pcat">${esc(cat.toUpperCase())}</div>
                </div>
              </div>
              <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
                ${lowStock ? `<span class="tag overdue"><i class="fa-solid fa-battery-quarter"></i> LOW STOCK</span>` : ``}
                <span class="tag"><i class="fa-solid fa-box"></i> ${esc(p.unit || "unit")}</span>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="price">₱${esc(p.price)} <span class="muted" style="font-weight:900">/ ${esc(p.unit||"unit")}</span></div>
            <div class="stock">${esc(p.stock)} in stock</div>
          </div>

          <div class="row">
            <input class="qty" type="number" min="1" value="1" data-qty="${esc(p.id)}" />
            <button class="btn primary" data-addcart="${esc(p.id)}"><i class="fa-solid fa-cart-plus"></i> Add</button>
          </div>

          ${(session.role === "admin") ? `
            <div class="row" style="justify-content:flex-end">
              <button class="btn ghost" data-edit-prod="${esc(p.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="btn ghost" data-del-prod="${esc(p.id)}"><i class="fa-solid fa-trash"></i> Remove</button>
            </div>` : ``}
        </div>
      `;
    }).join("");
  }

  function cartCount(){
    return cart.reduce((sum, x) => sum + (Number(x.qty)||0), 0);
  }
  function updateCartUI(){
    cartCountEl.textContent = String(cartCount());
  }

  function getQtyInput(productId){
    return $(`[data-qty="${CSS.escape(productId)}"]`);
  }

  function addToCart(productId, qty){
    qty = Math.max(1, Number(qty)||1);
    const p = products.find(x => x.id === productId);
    if(!p){ toast("Product not found"); return; }
    if(Number(p.stock) <= 0){ toast("Out of stock"); return; }

    const found = cart.find(x => x.productId === productId);
    if(found) found.qty += qty;
    else cart.push({ productId, qty });

    toast("Added to cart", `${p.name} × ${qty}`);
    logEvent("CART", `Added ${p.name} × ${qty}`);
    updateCartUI();
    renderLogs();
  }

  function cartTotal(){
    return cart.reduce((sum, it) => {
      const p = products.find(x => x.id === it.productId);
      return sum + (p ? (Number(p.price)||0) * (Number(it.qty)||0) : 0);
    }, 0);
  }

  function openCartModal(){
    if(!(session.role === "admin" || session.role === "shopper")){
      toast("Sign in", "Shopper/Admin only");
      return;
    }

    if(!cart.length){
      openModal("Cart", `
        <div class="item"><div><b>Your cart is empty</b><small>Add items from Marketplace.</small></div></div>
      `, `<button class="btn ghost" id="closeCart">Close</button>`);
      $("#closeCart").addEventListener("click", closeModal);
      return;
    }

    const rows = cart.map(it => {
      const p = products.find(x => x.id === it.productId);
      const name = p ? p.name : it.productId;
      const price = p ? Number(p.price)||0 : 0;
      const line = price * (Number(it.qty)||0);
      return `
        <div class="item">
          <div>
            <b>${esc(name)}</b>
            <small>₱${esc(price)} × ${esc(it.qty)} = <b>₱${esc(line)}</b></small>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn ghost" data-cartminus="${esc(it.productId)}">-</button>
            <button class="btn ghost" data-cartplus="${esc(it.productId)}">+</button>
            <button class="btn ghost" data-cartremove="${esc(it.productId)}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join("");

    openModal("Cart", `
      ${rows}
      <div class="item" style="align-items:flex-start">
        <div style="flex:1">
          <b>Order note (optional)</b>
          <small class="muted">Example: deliver tomorrow morning</small>
          <textarea id="orderNote" placeholder="Write note..."></textarea>
        </div>
        <div style="text-align:right">
          <div class="tag"><i class="fa-solid fa-receipt"></i> TOTAL: ₱${esc(cartTotal())}</div>
        </div>
      </div>
    `, `
      <button class="btn ghost" id="closeCart">Close</button>
      <button class="btn primary" id="placeOrderBtn"><i class="fa-solid fa-bag-shopping"></i> Place Order</button>
    `);

    $("#closeCart").addEventListener("click", closeModal);
    $("#placeOrderBtn").addEventListener("click", placeOrder);
  }

  function placeOrder(){
    for(const it of cart){
      const p = products.find(x => x.id === it.productId);
      if(!p) continue;
      if((Number(it.qty)||0) > (Number(p.stock)||0)){
        toast("Not enough stock", `${p.name} has only ${p.stock}`);
        return;
      }
    }

    const note = ($("#orderNote")?.value || "").trim();

    for(const it of cart){
      const p = products.find(x => x.id === it.productId);
      if(!p) continue;
      p.stock = Math.max(0, (Number(p.stock)||0) - (Number(it.qty)||0));
    }

    const order = {
      id: uid("ord"),
      shopperId: session.userId,
      shopperName: session.name || (session.role === "admin" ? "Admin" : "Shopper"),
      items: cart.map(x => ({ productId: x.productId, qty: Number(x.qty)||0 })),
      note,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    orders.unshift(order);
    cart = [];

    toast("Order placed", `#${order.id.slice(-6).toUpperCase()}`);
    logEvent("ORDER", `Placed order #${order.id.slice(-6).toUpperCase()} (${order.items.length} items)`);
    saveAll();
    updateCartUI();
    closeModal();
    setActiveView("orders");
  }

  function renderOrders(){
    const isAdmin = session.role === "admin";
    const isShopper = session.role === "shopper";

    const visibleOrders = isAdmin
      ? orders.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
      : isShopper
        ? orders.filter(o => o.shopperId === session.userId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
        : [];

    if(!visibleOrders.length){
      ordersList.innerHTML = `<div class="item"><div><b>No orders yet</b><small>${isShopper ? "Go to Marketplace and place an order." : "Sign in as Shopper/Admin to see orders."}</small></div></div>`;
      return;
    }

    ordersList.innerHTML = visibleOrders.map(o => {
      const items = o.items.map(it => {
        const p = products.find(x => x.id === it.productId);
        return `${p ? p.name : it.productId} × ${it.qty}`;
      }).join(", ");

      const total = o.items.reduce((sum, it) => {
        const p = products.find(x => x.id === it.productId);
        return sum + (p ? (Number(p.price)||0) * (Number(it.qty)||0) : 0);
      }, 0);

      const statusTag = o.status === "delivered"
        ? `<span class="tag low"><i class="fa-solid fa-truck"></i> DELIVERED</span>`
        : `<span class="tag med"><i class="fa-solid fa-truck-fast"></i> TO DELIVER</span>`;

      const adminBtns = isAdmin ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn ghost" data-markdelivered="${esc(o.id)}"><i class="fa-solid fa-circle-check"></i> Mark delivered</button>
          <button class="btn ghost" data-delorder="${esc(o.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>` : ``;

      return `
        <div class="item">
          <div>
            <b>Order #${esc(o.id.slice(-6).toUpperCase())} · ${esc(o.shopperName)}</b>
            <small>${new Date(o.createdAt).toLocaleString()} · ${esc(items)}</small>
            <small><b>Total:</b> ₱${esc(total)} ${o.note ? `· <span class="muted">${esc(o.note)}</span>` : ""}</small>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
            ${statusTag}
            ${adminBtns}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderAdminDash(){
    const perWorker = workers.map(w => {
      const doneNow = tasks.filter(t => t.status === "done" && t.assigned === w.id).length;
      const confirms = tasks.filter(t => t.confirmed && t.assigned === w.id).length;
      const hist = activity[w.id] || 0;
      return { w, doneNow, confirms, hist, score: doneNow + confirms + hist };
    }).sort((a,b)=>b.score-a.score);

    workerStats.innerHTML = perWorker.length ? perWorker.map((x, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
      return `
        <div class="item">
          <div>
            <b>${medal} ${esc(x.w.name)} <span class="muted">(${esc(x.w.role)})</span></b>
            <small>Confirmed: ${x.confirms} · Done: ${x.doneNow} · History: ${x.hist}</small>
          </div>
          <div class="tag"><i class="fa-solid fa-chart-line"></i> ${x.score} pts</div>
        </div>
      `;
    }).join("") : `<div class="item"><div><b>No workers</b></div></div>`;

    const pending = orders.filter(o => o.status !== "delivered");
    deliverStats.innerHTML = pending.length ? pending.map(o => `
      <div class="item">
        <div>
          <b>${esc(o.shopperName)} · #${esc(o.id.slice(-6).toUpperCase())}</b>
          <small>${esc(o.items.map(it => {
            const p = products.find(x => x.id === it.productId);
            return `${p ? p.name : it.productId} × ${it.qty}`;
          }).join(", "))}</small>
        </div>
        <div class="tag med"><i class="fa-solid fa-truck-fast"></i> Pending</div>
      </div>
    `).join("") : `<div class="item"><div><b>No pending deliveries</b><small>All good.</small></div></div>`;

    const total = tasks.length;
    const todo = tasks.filter(t => t.status === "todo").length;
    const prog = tasks.filter(t => t.status === "inprogress").length;
    const done = tasks.filter(t => t.status === "done").length;
    const overdue = tasks.filter(isOverdue).length;

    const percent = total ? Math.round((done / total) * 100) : 0;

    overallStats.innerHTML = `
      <div class="item">
        <div style="flex:1">
          <b>Tasks</b>
          <small>Total: ${total} · To do: ${todo} · In progress: ${prog} · Done: ${done}</small>
          <div class="progress-wrap" aria-label="Task completion">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
          <small class="muted">${percent}% completed</small>
        </div>
      </div>
      <div class="item"><div><b>Overdue</b><small>${overdue} tasks overdue</small></div><div class="tag overdue"><i class="fa-solid fa-triangle-exclamation"></i> Alert</div></div>
      <div class="item"><div><b>Orders</b><small>Total: ${orders.length} · Pending: ${orders.filter(o=>o.status!=="delivered").length} · Delivered: ${orders.filter(o=>o.status==="delivered").length}</small></div></div>
      <div class="item"><div><b>Products</b><small>${products.length} items in marketplace</small></div></div>
    `;
  }

  function renderLogs(){
    if(!logsList) return;
    if(!logs.length){
      logsList.innerHTML = `<div class="item"><div><b>No logs yet</b><small class="muted">Actions will appear here.</small></div></div>`;
      return;
    }

    logsList.innerHTML = logs.slice(0, 150).map(l => `
      <div class="item">
        <div>
          <b>${esc(l.type)} · ${esc(l.byName)} <span class="muted">(${esc(l.byRole)})</span></b>
          <small>${new Date(l.at).toLocaleString()} · ${esc(l.message)}</small>
        </div>
        <div class="tag"><i class="fa-solid fa-clipboard-list"></i> LOG</div>
      </div>
    `).join("");
  }

  function fillWorkerSelect(){
    loginWorkerSelect.innerHTML = workers.map(w =>
      `<option value="${esc(w.id)}">${esc(w.name)} (${esc(w.role)})</option>`
    ).join("");
  }

  function syncLoginBoxes(){
    const r = loginRole.value;
    loginViewerBox.style.display = (r === "viewer") ? "" : "none";
    loginShopperBox.style.display = (r === "shopper") ? "" : "none";
    loginAdminBox.style.display = (r === "admin") ? "" : "none";
  }

  /* ======================
     TASK FORM (ADD/EDIT)
  ====================== */
  function openTaskFormModal(mode, taskId=null){
    if(session.role !== "admin"){ toast("Admin only"); return; }
    const isEdit = mode === "edit";
    const t = isEdit ? tasks.find(x => x.id === taskId) : null;

    const wopts = [`<option value="">Unassigned</option>`].concat(
      workers.map(w => `<option value="${esc(w.id)}">${esc(w.name)} (${esc(w.role)})</option>`)
    ).join("");

    openModal(
      isEdit ? "Edit Task" : "Add Task",
      `
      <div class="form-grid">
        <div class="field">
          <label>Title</label>
          <input id="t_title" value="${esc(t?.title || "")}" placeholder="e.g., Install scaffolding" />
        </div>

        <div class="field">
          <label>Due date</label>
          <input id="t_due" type="date" value="${esc(t?.due || todayStr(0))}" />
        </div>

        <div class="field">
          <label>Priority</label>
          <select id="t_pri">
            <option value="low" ${t?.priority==="low"?"selected":""}>LOW</option>
            <option value="med" ${t?.priority==="med"?"selected":""}>MED</option>
            <option value="high" ${t?.priority==="high"?"selected":""}>HIGH</option>
          </select>
        </div>

        <div class="field">
          <label>Status</label>
          <select id="t_status">
            <option value="todo" ${t?.status==="todo"?"selected":""}>TO DO</option>
            <option value="inprogress" ${t?.status==="inprogress"?"selected":""}>IN PROGRESS</option>
            <option value="done" ${t?.status==="done"?"selected":""}>DONE</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Assigned worker</label>
        <select id="t_assigned">${wopts}</select>
      </div>

      <div class="field">
        <label>Notes</label>
        <textarea id="t_notes" placeholder="Add details...">${esc(t?.notes || "")}</textarea>
      </div>
      `,
      `
        <button class="btn ghost" id="t_cancel">Cancel</button>
        <button class="btn primary" id="t_save"><i class="fa-solid fa-floppy-disk"></i> Save</button>
      `
    );

    const assignedEl = $("#t_assigned");
    if(assignedEl) assignedEl.value = t?.assigned || "";

    $("#t_cancel").addEventListener("click", closeModal);
    $("#t_save").addEventListener("click", () => {
      const title = ($("#t_title").value || "").trim();
      const due = $("#t_due").value;
      const priority = $("#t_pri").value;
      const status = $("#t_status").value;
      const assigned = $("#t_assigned").value || "";
      const notes = ($("#t_notes").value || "").trim();

      if(!title){
        toast("Missing title", "Please enter a task title.");
        return;
      }

      if(isEdit){
        const tt = tasks.find(x => x.id === taskId);
        if(!tt) return;
        tt.title = title;
        tt.due = due;
        tt.priority = priority;
        tt.status = status;
        tt.assigned = assigned;
        tt.notes = notes;
        if(status === "done") tt.confirmed = true;

        logEvent("TASK", `Edited task: "${title}"`);
        toast("Saved", "Task updated");
      } else {
        tasks.unshift({
          id: uid("t"),
          title,
          due,
          priority,
          assigned,
          status,
          notes,
          confirmed: (status === "done")
        });
        logEvent("TASK", `Added task: "${title}"`);
        toast("Added", "Task created");
      }

      saveAll();
      closeModal();
    });
  }

  function openTaskDetailsModal(taskId){
    const t = tasks.find(x => x.id === taskId);
    if(!t) return;

    const canEdit = (session.role === "admin");

    openModal(
      "Task Details",
      `
        <div class="item" style="align-items:flex-start">
          <div style="flex:1">
            <b>${esc(t.title)}</b>
            <small class="muted">${esc(t.notes || "No notes")}</small>
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              ${badgeDue(t)}
              ${badgePri(t.priority)}
              <span class="tag"><i class="fa-solid fa-user"></i> ${esc(workerName(t.assigned))}</span>
              <span class="tag"><i class="fa-solid fa-layer-group"></i> ${esc((t.status||"todo").toUpperCase())}</span>
              ${t.confirmed ? `<span class="tag low"><i class="fa-solid fa-circle-check"></i> CONFIRMED</span>` : ``}
            </div>
          </div>
        </div>
      `,
      `
        <button class="btn ghost" id="td_close">Close</button>
        ${canEdit ? `<button class="btn primary" id="td_edit"><i class="fa-solid fa-pen"></i> Edit</button>` : ``}
      `
    );

    $("#td_close").addEventListener("click", closeModal);
    if(canEdit){
      $("#td_edit").addEventListener("click", () => {
        closeModal();
        openTaskFormModal("edit", taskId);
      });
    }
  }

  /* ======================
     PRODUCT FORM (ADD/EDIT)
  ====================== */
  function openProductFormModal(mode, productId=null){
    if(session.role !== "admin"){ toast("Admin only"); return; }
    const isEdit = mode === "edit";
    const p = isEdit ? products.find(x => x.id === productId) : null;

    const catList = Object.keys(CAT_ICON);

    openModal(
      isEdit ? "Edit Product" : "Add Product",
      `
      <div class="form-grid">
        <div class="field">
          <label>Name</label>
          <input id="p_name" value="${esc(p?.name || "")}" placeholder="e.g., Steel Nails 2in" />
        </div>

        <div class="field">
          <label>Category</label>
          <select id="p_cat">
            ${catList.map(c => `<option value="${esc(c)}" ${(p?.category||"materials")===c?"selected":""}>${esc(c.toUpperCase())}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label>Price (PHP)</label>
          <input id="p_price" type="number" min="0" value="${esc(p?.price ?? 0)}" />
        </div>

        <div class="field">
          <label>Stock</label>
          <input id="p_stock" type="number" min="0" value="${esc(p?.stock ?? 0)}" />
        </div>
      </div>

      <div class="field">
        <label>Unit</label>
        <input id="p_unit" value="${esc(p?.unit || "pcs")}" placeholder="pcs / bag / sheet / kg / load" />
      </div>
      `,
      `
        <button class="btn ghost" id="p_cancel">Cancel</button>
        <button class="btn primary" id="p_save"><i class="fa-solid fa-floppy-disk"></i> Save</button>
      `
    );

    $("#p_cancel").addEventListener("click", closeModal);
    $("#p_save").addEventListener("click", () => {
      const name = ($("#p_name").value || "").trim();
      const category = $("#p_cat").value || "materials";
      const price = Number($("#p_price").value || 0);
      const stock = Number($("#p_stock").value || 0);
      const unit = ($("#p_unit").value || "").trim() || "pcs";

      if(!name){
        toast("Missing name", "Please enter a product name.");
        return;
      }

      if(isEdit){
        const pp = products.find(x => x.id === productId);
        if(!pp) return;
        pp.name = name;
        pp.category = category;
        pp.price = price;
        pp.stock = stock;
        pp.unit = unit;

        logEvent("PRODUCT", `Edited product: "${name}"`);
        toast("Saved", "Product updated");
      } else {
        products.unshift({
          id: uid("p"),
          name, category, price, stock, unit
        });
        logEvent("PRODUCT", `Added product: "${name}"`);
        toast("Added", "Product created");
      }

      saveAll();
      closeModal();
    });
  }

  /* ======================
     WORKERS (simple view)
  ====================== */
  function openWorkersModal(){
    if(session.role !== "admin"){ toast("Admin only"); return; }

    openModal(
      "Workers",
      `
        ${workers.map(w => `
          <div class="item">
            <div>
              <b>${esc(w.name)}</b>
              <small class="muted">${esc(w.role)}</small>
            </div>
            <div class="tag"><i class="fa-solid fa-user-gear"></i> Worker</div>
          </div>
        `).join("")}
      `,
      `<button class="btn ghost" id="w_close">Close</button>`
    );

    $("#w_close").addEventListener("click", closeModal);
  }

  /* ======================
     LOGIN BEHAVIOR
  ====================== */
  loginRole.addEventListener("change", syncLoginBoxes);

  loginSubmit.addEventListener("click", () => {
    const r = loginRole.value;

    if(r === "viewer"){
      const wid = loginWorkerSelect.value;
      const w = workers.find(x => x.id === wid);
      session = { role: "viewer", userId: wid, name: w?.name || "Worker" };
      saveSession();
      toast("Signed in", `Worker: ${session.name}`);
      logEvent("LOGIN", `Signed in as WORKER (${session.name})`);
      hideLoginScreen();
      setActiveView("tasks");
      renderLogs();
      return;
    }

    if(r === "shopper"){
      const name = (loginShopperName.value || "").trim() || "Shopper";
      session = { role: "shopper", userId: uid("shopper"), name };
      cart = [];
      saveSession();
      toast("Signed in", `Shopper: ${name}`);
      logEvent("LOGIN", `Signed in as SHOPPER (${name})`);
      hideLoginScreen();
      setActiveView("market");
      renderLogs();
      return;
    }

    if(r === "admin"){
      const pass = (loginAdminPass.value || "").trim();
      if(pass !== "admin" && pass !== "svnadmin"){
        toast("Wrong passphrase", "Try: admin");
        return;
      }
      session = { role: "admin", userId: "admin", name: "Admin" };
      saveSession();
      toast("Signed in", "Admin enabled");
      logEvent("LOGIN", "Signed in as ADMIN");
      hideLoginScreen();
      setActiveView("admin");
      renderLogs();
      return;
    }
  });

  logoutBtn.addEventListener("click", () => {
    logEvent("LOGOUT", "Signed out");
    session = { role:"guest", userId:"", name:"" };
    cart = [];
    saveSession();
    toast("Signed out");
    showLoginScreen();
    renderLogs();
  });

  themeToggle?.addEventListener("click", () => {
    theme = (document.body.getAttribute("data-theme") === "light") ? "dark" : "light";
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(KEY.theme, theme);
    toast("Theme changed", theme.toUpperCase());
    logEvent("THEME", `Switched to ${theme.toUpperCase()} mode`);
    renderLogs();
  });

  clearLogsBtn?.addEventListener("click", () => {
    if(session.role !== "admin"){ toast("Admin only"); return; }
    if(confirm("Clear all logs?")){
      logs = [];
      localStorage.setItem(KEY.logs, "[]");
      toast("Logs cleared");
      renderLogs();
    }
  });

  closeModalBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => { if(e.target === backdrop) closeModal(); });

  // Nav
  $$(".navbtn").forEach(btn => btn.addEventListener("click", () => {
    if(btn.style.display === "none") return;
    setActiveView(btn.dataset.view);
  }));

  // Filters
  $$(".filters .pill").forEach(p => {
    p.addEventListener("click", () => {
      $$(".filters .pill").forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      filter = p.dataset.filter;
      renderAll();
    });
  });

  searchInput.addEventListener("input", () => { search = searchInput.value; renderAll(); });

  // Ctrl/⌘ + K focus search, Esc closes modal
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const combo = isMac ? e.metaKey : e.ctrlKey;
    if(combo && e.key.toLowerCase() === "k"){
      e.preventDefault();
      searchInput?.focus();
    }
    if(e.key === "Escape" && backdrop.style.display === "flex") closeModal();
  });

  addTaskBtn.addEventListener("click", () => openTaskFormModal("add"));
  workersBtn.addEventListener("click", openWorkersModal);
  addProductBtn.addEventListener("click", () => openProductFormModal("add"));
  cartBtn.addEventListener("click", openCartModal);

  // One click handler
  document.addEventListener("click", (e) => {
    // Task buttons
    const openTaskBtn = e.target.closest("[data-open-task]");
    const editTaskBtn = e.target.closest("[data-edit-task]");
    const delTaskBtn = e.target.closest("[data-del-task]");
    const confirmBtn = e.target.closest("[data-confirm]");

    if(openTaskBtn){
      openTaskDetailsModal(openTaskBtn.dataset.openTask);
      return;
    }
    if(editTaskBtn && session.role === "admin"){
      openTaskFormModal("edit", editTaskBtn.dataset.editTask);
      return;
    }
    if(delTaskBtn && session.role === "admin"){
      const id = delTaskBtn.dataset.delTask;
      const t = tasks.find(x => x.id === id);
      if(confirm("Delete this task?")){
        tasks = tasks.filter(x => x.id !== id);
        logEvent("TASK", `Deleted task: "${t?.title || id}"`);
        toast("Task deleted");
        saveAll();
      }
      return;
    }
    if(confirmBtn && session.role === "viewer"){
      const id = confirmBtn.dataset.confirm;
      const t = tasks.find(x => x.id === id);
      if(!t) return;
      t.status = "done";
      t.confirmed = true;
      if(t.assigned) activity[t.assigned] = (activity[t.assigned] || 0) + 1;
      toast("Confirmed", "Task marked as done");
      logEvent("TASK", `Completed: "${t.title}"`);
      saveAll();
      return;
    }

    // Marketplace add to cart
    const addCartBtn = e.target.closest("[data-addcart]");
    if(addCartBtn){
      const pid = addCartBtn.dataset.addcart;
      const qtyEl = getQtyInput(pid);
      const qty = qtyEl ? qtyEl.value : 1;
      addToCart(pid, qty);
      return;
    }

    // Product actions
    const editProdBtn = e.target.closest("[data-edit-prod]");
    const delProdBtn = e.target.closest("[data-del-prod]");

    if(editProdBtn && session.role === "admin"){
      openProductFormModal("edit", editProdBtn.dataset.editProd);
      return;
    }
    if(delProdBtn && session.role === "admin"){
      const id = delProdBtn.dataset.delProd;
      const p = products.find(x => x.id === id);
      if(confirm(`Remove product "${p?.name || id}"?`)){
        products = products.filter(x => x.id !== id);
        logEvent("PRODUCT", `Removed product: "${p?.name || id}"`);
        toast("Removed", "Product deleted");
        saveAll();
      }
      return;
    }

    // Cart controls
    const minus = e.target.closest("[data-cartminus]");
    const plus = e.target.closest("[data-cartplus]");
    const remove = e.target.closest("[data-cartremove]");

    if(minus){
      const pid = minus.dataset.cartminus;
      const it = cart.find(x => x.productId === pid);
      if(it){
        it.qty = Math.max(1, (Number(it.qty)||1) - 1);
        openCartModal();
      }
      return;
    }
    if(plus){
      const pid = plus.dataset.cartplus;
      const it = cart.find(x => x.productId === pid);
      if(it){
        it.qty = (Number(it.qty)||0) + 1;
        openCartModal();
      }
      return;
    }
    if(remove){
      const pid = remove.dataset.cartremove;
      cart = cart.filter(x => x.productId !== pid);
      logEvent("CART", `Removed item ${pid} from cart`);
      openCartModal();
      updateCartUI();
      renderLogs();
      return;
    }

    // Orders admin actions
    const markDelivered = e.target.closest("[data-markdelivered]");
    const delOrder = e.target.closest("[data-delorder]");

    if(markDelivered && session.role === "admin"){
      const id = markDelivered.dataset.markdelivered;
      const o = orders.find(x => x.id === id);
      if(o){
        o.status = "delivered";
        logEvent("ORDER", `Delivered order #${id.slice(-6).toUpperCase()}`);
        saveAll();
        toast("Delivered", `Order #${id.slice(-6).toUpperCase()}`);
      }
      return;
    }

    if(delOrder && session.role === "admin"){
      const id = delOrder.dataset.delorder;
      if(confirm("Delete this order?")){
        orders = orders.filter(x => x.id !== id);
        logEvent("ORDER", `Deleted order #${id.slice(-6).toUpperCase()}`);
        saveAll();
        toast("Order deleted");
      }
      return;
    }
  });

  // Export/Import (Admin)
  exportBtn.addEventListener("click", () => {
    if(session.role !== "admin"){ toast("Admin only"); return; }
    const data = { exportedAt: new Date().toISOString(), tasks, workers, products, orders, activity, logs, theme };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `svn_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Exported", "Backup JSON downloaded");
    logEvent("EXPORT", "Exported JSON backup");
    renderLogs();
  });

  importBtn.addEventListener("click", () => {
    if(session.role !== "admin"){ toast("Admin only"); return; }
    importFile.click();
  });

  importFile.addEventListener("change", async () => {
    const f = importFile.files?.[0];
    if(!f) return;
    try{
      const text = await f.text();
      const data = JSON.parse(text);

      if(data.tasks) tasks = data.tasks;
      if(data.workers) workers = data.workers;
      if(data.products) products = data.products;
      if(data.orders) orders = data.orders;
      if(data.activity) activity = data.activity;
      if(data.logs) logs = data.logs;
      if(data.theme){
        theme = data.theme;
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem(KEY.theme, theme);
      }

      saveAll();
      fillWorkerSelect();
      toast("Imported", "Data loaded");
      logEvent("IMPORT", "Imported JSON backup");
      renderLogs();
    }catch{
      toast("Import failed", "Invalid JSON");
    }finally{
      importFile.value = "";
    }
  });

  // Drag/drop (Admin only)
  let draggingId = null;
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".task");
    if(!card) return;
    if(session.role !== "admin"){
      e.preventDefault();
      return;
    }
    draggingId = card.dataset.id;
    e.dataTransfer.setData("text/plain", draggingId);
    e.dataTransfer.effectAllowed = "move";
  });

  $$(".col").forEach(col => {
    col.addEventListener("dragover", (e) => {
      if(session.role !== "admin") return;
      e.preventDefault();
      col.style.boxShadow = "0 0 0 3px rgba(255,138,43,0.25)";
    });
    col.addEventListener("dragleave", () => col.style.boxShadow = "none");
    col.addEventListener("drop", (e) => {
      if(session.role !== "admin") return;
      e.preventDefault();
      col.style.boxShadow = "none";
      const to = col.dataset.drop;
      const id = e.dataTransfer.getData("text/plain") || draggingId;
      const t = tasks.find(x => x.id === id);
      if(t && to){
        t.status = to;
        if(to === "done") t.confirmed = true;
        logEvent("TASK", `Moved "${t.title}" to ${to.toUpperCase()}`);
        saveAll();
      }
      draggingId = null;
    });
  });

  function renderAll(){
    updateNavByRole();
    renderCounters();
    renderKanban();

    if(session.role === "admin" || session.role === "shopper") {
      renderMarketplace();
      updateCartUI();
      renderOrders();
      renderLogs();
    } else {
      renderLogs();
    }

    if(session.role === "admin") renderAdminDash();

    if(session.role === "guest") showLoginScreen();
    else hideLoginScreen();
  }

  // Boot
  seed();
  load();

  fillWorkerSelect();
  syncLoginBoxes();

  // Default view by role
  if(session.role === "admin") setActiveView("admin");
  else if(session.role === "shopper") setActiveView("market");
  else setActiveView("tasks");

  renderAll();
})();
