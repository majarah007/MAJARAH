// ── DASHBOARD HTML — injected only after auth ──
function renderDashboard() {
  document.getElementById('app').innerHTML = `
<div class="shell">
  <aside class="sidebar">
    <div class="sb-logo">
      <div class="sb-logo-text">MAJARAH</div>
      <div class="sb-logo-sub">Admin · Drop 01</div>
    </div>
    <div class="sb-section">Store</div>
    <div class="sb-item active" onclick="showPage('overview', this)"><span class="icon">◈</span> Overview</div>
    <div class="sb-item" onclick="showPage('orders', this)"><span class="icon">📦</span> Orders <span class="sb-badge" id="newOrdersBadge" style="display:none">0</span></div>
    <div class="sb-section">Catalog</div>
    <div class="sb-item" onclick="showPage('products', this)"><span class="icon">👕</span> Products</div>
    <div class="sb-item" onclick="showPage('inventory', this)"><span class="icon">📊</span> Inventory</div>
    <div class="sb-section">Settings</div>
    <div class="sb-item" onclick="showPage('shipping', this)"><span class="icon">🚚</span> Shipping</div>
    <div class="sb-item" onclick="showPage('tweaks', this)"><span class="icon">🛠</span> Tweaks</div>
    <div class="sb-item" onclick="showPage('settings', this)"><span class="icon">⚙</span> Settings</div>
    <div class="sync-status"><span class="sync-dot"></span><span id="sidebarSyncTime">Syncing...</span></div>
    <div class="sb-bottom">
      <button class="sb-logout" onclick="logout()">← Log out</button>
    </div>
  </aside>

  <main class="main">
    <div id="setupBanner">
      <h3>⚡ Connect Supabase Database</h3>
      <p>Enter your Supabase project URL and anon key below. Get them free at <code>supabase.com</code> → New Project → Settings → API.</p>
      <div class="setup-fields">
        <input id="sbUrl" placeholder="https://xxxx.supabase.co" type="url">
        <input id="sbKey" placeholder="anon public key..." type="text">
      </div>
      <button class="setup-save-btn" onclick="saveSupabaseConfig()">Save &amp; Connect</button>
    </div>

    <div class="page active" id="page-overview">
      <div class="page-header">
        <div><h1>Overview</h1><p>Drop 01 · Real-time store summary</p></div>
        <div class="page-header-sync"><span class="sync-dot" style="width:5px;height:5px;"></span><span id="headerSyncTime">Syncing...</span></div>
      </div>
      <div class="stats-row">
        <div class="stat-card stat-accent"><div class="stat-label">Total Orders</div><div class="stat-val" id="statOrders">—</div><div class="stat-sub">all time</div></div>
        <div class="stat-card"><div class="stat-label">Revenue</div><div class="stat-val" id="statRevenue">—</div><div class="stat-sub">EGP · before shipping</div></div>
        <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-val" id="statPending">—</div><div class="stat-sub">awaiting fulfillment</div></div>
        <div class="stat-card"><div class="stat-label">Units Sold</div><div class="stat-val" id="statUnits">—</div><div class="stat-sub">across all products</div></div>
      </div>
      <div class="charts-row" style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-bottom:32px;">
        <div class="stat-card" style="padding:20px;">
          <div class="table-top" style="padding:0 0 15px 0;margin-bottom:15px;border-bottom:1px solid var(--border);"><h2>Sales Trend (Last 30 Days)</h2></div>
          <div style="height:220px;position:relative;"><canvas id="salesTrendChart"></canvas></div>
        </div>
        <div class="stat-card" style="padding:20px;">
          <div class="table-top" style="padding:0 0 15px 0;margin-bottom:15px;border-bottom:1px solid var(--border);"><h2>Size Popularity</h2></div>
          <div style="height:220px;position:relative;"><canvas id="sizePopularityChart"></canvas></div>
        </div>
      </div>
      <div class="table-card">
        <div class="table-top"><h2>Recent Orders</h2><button class="btn btn-ghost btn-sm" onclick="showPage('orders')">View All →</button></div>
        <table class="tbl"><thead><tr><th>#</th><th>Customer</th><th>Product</th><th>Size</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody id="recentOrdersBody"><tr class="loading-row"><td colspan="7">Loading...</td></tr></tbody></table>
      </div>
    </div>

    <div class="page" id="page-orders">
      <div class="page-header"><h1>Orders</h1><p>All customer orders from WhatsApp checkout</p></div>
      <div class="filter-tabs">
        <div class="filter-tab active" onclick="filterOrders('all',this)">All</div>
        <div class="filter-tab" onclick="filterOrders('pending',this)">Pending</div>
        <div class="filter-tab" onclick="filterOrders('confirmed',this)">Confirmed</div>
        <div class="filter-tab" onclick="filterOrders('shipped',this)">Shipped</div>
        <div class="filter-tab" onclick="filterOrders('delivered',this)">Delivered</div>
        <div class="filter-tab" onclick="filterOrders('cancelled',this)">Cancelled</div>
        <div class="filter-tab" onclick="filterOrders('refund_requested',this)">Refund Requests</div>
        <div class="filter-tab" onclick="filterOrders('refunded',this)">Refunded</div>
        <div class="filter-tab" onclick="filterOrders('refund_denied',this)">Refund Denied</div>
      </div>
      <div class="table-card">
        <div class="table-top">
          <h2>All Orders</h2>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <input class="search-bar" placeholder="Search name, phone..." oninput="searchOrders(this.value)" id="orderSearch">
            <button class="btn btn-ghost btn-sm" onclick="exportOrdersCSV('shipblu')" style="border-color:#00e676;color:#00e676;">🚢 Export ShipBlu</button>
            <button class="btn btn-ghost btn-sm" onclick="exportOrdersCSV('mylerz')" style="border-color:#2979ff;color:#2979ff;">📦 Export Mylerz</button>
            <button class="btn btn-accent btn-sm" onclick="openAddOrder()">+ Add Order</button>
          </div>
        </div>
        <table class="tbl"><thead><tr><th>#</th><th>Customer</th><th>Contact</th><th>Product</th><th>Size</th><th>City</th><th>Payment</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="ordersTableBody"><tr class="loading-row"><td colspan="10">Loading orders...</td></tr></tbody></table>
      </div>
    </div>

    <div class="page" id="page-products">
      <div class="page-header"><h1>Products</h1><p>Manage descriptions, pricing, and images</p></div>
      <div class="table-card">
        <div class="table-top"><h2>All Products</h2><button class="btn btn-accent btn-sm" onclick="openAddProduct()">+ Add Product</button></div>
        <table class="tbl"><thead><tr><th>Name</th><th>Color</th><th>Price</th><th>Fabric</th><th>Fit</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="productsTableBody"><tr class="loading-row"><td colspan="7">Loading...</td></tr></tbody></table>
      </div>
    </div>

    <div class="page" id="page-inventory">
      <div class="page-header"><h1>Inventory</h1><p>Stock levels per size — edit and save directly. <strong id="totalStockLabel" style="color:var(--accent);margin-left:12px;">Total: 0 units</strong></p></div>
      <div id="invGrid" class="inv-grid"></div>
      <div style="margin-top:24px;"><button class="btn btn-accent" onclick="saveInventory()">💾 Save All Inventory</button></div>
    </div>

    <div class="page" id="page-shipping">
      <div class="page-header"><h1>Shipping</h1><p>Delivery zones and pricing</p></div>
      <div class="settings-grid">
        <div class="settings-card">
          <h3>🗺 Delivery Zones</h3>
          <div id="zonesContainer"></div>
          <div style="margin-top:18px;display:flex;gap:10px;">
            <button class="btn btn-accent btn-sm" onclick="saveShipping()">Save Rates</button>
            <button class="btn btn-ghost btn-sm" onclick="addZone()">+ Add Zone</button>
          </div>
        </div>
        <div class="settings-card">
          <h3>⚡ Shipping Rules</h3>
          <div class="field-group"><label>Free Shipping Threshold (EGP)</label><input type="number" id="freeShipThreshold" placeholder="e.g. 1000 (0 = disabled)"></div>
          <div class="field-group"><label>Estimated Delivery Days</label><input type="text" id="deliveryDays" placeholder="e.g. 2-4 days"></div>
          <button class="btn btn-accent btn-sm" onclick="saveShippingRules()">Save Rules</button>
        </div>
      </div>
    </div>

    <div class="page" id="page-tweaks">
      <div class="page-header"><h1>Tweaks</h1><p>Modify announcement speeds, visibility toggles, coupons, and layout features dynamically.</p></div>
      <div class="settings-grid">
        <div class="settings-card">
          <h3>📢 Promotion Marquee &amp; Announcement</h3>
          <div class="field-group"><label>Marquee Promotion Text</label><input type="text" id="promoTextSetting" placeholder="e.g. 🔥 MAJARAH DROP 01 OUT NOW..." style="width:100%"></div>
          <div class="field-row">
            <div class="field-group"><label>Scrolling Speed (seconds)</label><input type="number" id="tweakPromoSpeed" min="5" max="100" placeholder="e.g. 25"></div>
            <div class="field-group"><label>Text Repetition Count</label><input type="number" id="tweakPromoRepeats" min="1" max="10" placeholder="e.g. 1"></div>
          </div>
          <div class="field-group" style="margin-top:10px;"><label>Storefront Marquee Visibility</label>
            <select id="tweakShowMarquee" style="width:100%;"><option value="true">Active (Visible)</option><option value="false">Hidden (Draft)</option></select>
          </div>
        </div>
        <div class="settings-card">
          <h3>🌐 Feature Visibility Controls</h3>
          <div class="field-group"><label>Customer Sign In Option</label><select id="tweakShowSignIn" style="width:100%;"><option value="true">Active (Visible)</option><option value="false">Hidden (Draft)</option></select></div>
          <div class="field-row">
            <div class="field-group"><label>Constellation Stars Canvas</label><select id="tweakShowStars" style="width:100%;"><option value="true">Active (Visible)</option><option value="false">Hidden (Draft)</option></select></div>
            <div class="field-group"><label>Size Calculator Widget</label><select id="tweakShowSizeCalc" style="width:100%;"><option value="true">Active (Visible)</option><option value="false">Hidden (Draft)</option></select></div>
          </div>
          <div class="field-row" style="margin-top:10px;">
            <div class="field-group"><label>Footer Instagram Link</label><select id="tweakShowInstagram" style="width:100%;"><option value="true">Active (Visible)</option><option value="false">Hidden (Draft)</option></select></div>
            <div class="field-group"><label>Footer TikTok Link</label><select id="tweakShowTiktok" style="width:100%;"><option value="true">Active (Visible)</option><option value="false">Hidden (Draft)</option></select></div>
          </div>
        </div>
        <div class="settings-card" style="grid-column:span 2;">
          <h3>🎫 Checkout Coupons &amp; Discount Codes</h3>
          <div class="field-group"><label>Coupons Checkout Field Status</label><select id="tweakShowCoupons" style="width:100%;"><option value="true">Active (Show input field in Checkout)</option><option value="false">Disabled (Hide input field in Checkout)</option></select></div>
          <div class="field-group" style="margin-top:10px;"><label>Discount Code Configurations (Comma-separated rules e.g., CODE:VALUE)</label>
            <input type="text" id="tweakCouponCodes" placeholder="e.g. SAVE10:10%,OFF50:50,PROMO15:15%" style="width:100%">
            <p style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.6;">Percentage discount ends with % (e.g. SAVE10:10%), flat EGP is just the number (e.g. OFF50:50).</p>
          </div>
          <button class="btn btn-accent btn-sm" onclick="saveTweaks()" style="margin-top:20px;width:100%;padding:12px;">Save All Configurations</button>
        </div>
        <div class="settings-card" style="grid-column:span 2;">
          <h3>💳 Checkout Payment Methods</h3>
          <p style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.6;">Control which payment methods are visible in the storefront checkout.</p>
          <div class="field-row">
            <div class="field-group"><label>💵 Cash on Delivery (COD)</label><select id="tweakShowCOD" style="width:100%;"><option value="true">Active (Visible to customers)</option><option value="false">Hidden (Disabled)</option></select></div>
            <div class="field-group"><label>🍎 Apple Pay</label><select id="tweakShowApplePay" style="width:100%;"><option value="true">Active (Visible to customers)</option><option value="false">Hidden (Disabled)</option></select></div>
            <div class="field-group"><label>💳 Credit / Debit Card (Visa · MC)</label><select id="tweakShowCard" style="width:100%;"><option value="true">Active (Visible to customers)</option><option value="false">Hidden (Disabled)</option></select></div>
          </div>
          <button class="btn btn-accent btn-sm" onclick="saveTweaks()" style="margin-top:16px;width:100%;padding:12px;">Save All Configurations</button>
        </div>
        <div class="settings-card" style="grid-column:span 2;">
          <h3>⏳ Pre-Launch Hype Mode &amp; Countdown</h3>
          <p style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.6;">Lock the main storefront with a premium countdown screen and gather customer emails before dropping your first collection.</p>
          <div class="field-row">
            <div class="field-group"><label>Pre-Launch Mode Status</label><select id="tweakShowPrelaunch" style="width:100%;"><option value="true">Active (Lock store with countdown screen)</option><option value="false">Disabled (Storefront fully open)</option></select></div>
            <div class="field-group"><label>Target Drop Date &amp; Time (ISO Format)</label><input type="text" id="tweakPrelaunchDate" placeholder="e.g. 2026-07-01T20:00:00" style="width:100%;"></div>
            <div class="field-group"><label>Store Bypass Password</label><input type="text" id="tweakPrelaunchPassword" placeholder="e.g. majarah2026" style="width:100%;"></div>
          </div>
          <div class="field-group" style="margin-top:15px;">
            <label>Registered Notification Emails (Read-Only)</label>
            <textarea id="tweakPrelaunchEmails" readonly placeholder="No registered emails yet." style="width:100%;height:120px;font-family:monospace;font-size:11px;background:#0c0c0c;border:1px solid #1c1c1c;color:#888;padding:10px;border-radius:4px;resize:vertical;"></textarea>
            <div style="display:flex;gap:10px;margin-top:8px;">
              <button class="btn btn-ghost btn-sm" onclick="exportPrelaunchEmailsCSV()" style="padding:6px 12px;font-size:10px;border-color:#333;color:#ccc;">💾 Export CSV</button>
              <button class="btn btn-ghost btn-sm" onclick="clearPrelaunchEmails()" style="padding:6px 12px;font-size:10px;color:#ff4444;border-color:rgba(255,68,68,0.2);">🗑️ Clear List</button>
            </div>
          </div>
          <button class="btn btn-accent btn-sm" onclick="saveTweaks()" style="margin-top:20px;width:100%;padding:12px;">Save Pre-Launch Configuration</button>
        </div>
        <div class="settings-card" style="grid-column:span 2;">
          <h3>📱 Live Mobile Preview Simulator</h3>
          <p style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.6;">Simulate and test how the storefront looks on different mobile screen sizes.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-accent btn-sm" onclick="openMobileSimulator('../index.html')">📱 Simulate Storefront (index.html)</button>
            <button class="btn btn-ghost btn-sm" onclick="openMobileSimulator('./index.html')">⚙️ Simulate Admin Dashboard</button>
          </div>
        </div>
      </div>
    </div>

    <div class="page" id="page-settings">
      <div class="page-header"><h1>Settings</h1><p>Admin credentials and store configuration</p></div>
      <div class="settings-grid">
        <div class="settings-card">
          <h3>🔐 Change Password</h3>
          <div class="field-group"><label>Current Password</label><input type="password" id="curPass"></div>
          <div class="field-group"><label>New Password</label><input type="password" id="newPass"></div>
          <button class="btn btn-accent btn-sm" onclick="changePassword()">Update Password</button>
        </div>
        <div class="settings-card">
          <h3>📱 WhatsApp Number</h3>
          <div class="field-group"><label>Fulfillment Phone (with country code)</label><input type="text" id="waNumber" placeholder="201229067066"></div>
          <button class="btn btn-accent btn-sm" onclick="saveWaNumber()">Save Number</button>
          <p style="font-size:11px;color:var(--muted);margin-top:12px;line-height:1.8;">This number receives WhatsApp order notifications from the checkout page.</p>
        </div>
      </div>
      <div class="settings-grid" style="margin-top:24px;">
        <div class="settings-card">
          <h3>⚡ Supabase Connection</h3>
          <div class="field-group"><label>Project URL</label><input type="url" id="sbUrlSettings" placeholder="https://xxxx.supabase.co"></div>
          <div class="field-group"><label>Anon Public Key</label><input type="text" id="sbKeySettings" placeholder="eyJ..."></div>
          <button class="btn btn-accent btn-sm" onclick="saveSupabaseFromSettings()">Save &amp; Reconnect</button>
          <button class="btn btn-ghost btn-sm" onclick="copyConfigJS()" style="margin-left:8px;">Copy Config JS</button>
        </div>
        <div class="settings-card">
          <h3>📧 EmailJS Receipts Setup</h3>
          <div class="field-group"><label>Service ID</label><input type="text" id="emailjsServiceId" placeholder="e.g. service_xxxx"></div>
          <div class="field-group"><label>Template ID</label><input type="text" id="emailjsTemplateId" placeholder="e.g. template_xxxx"></div>
          <div class="field-group"><label>Public Key</label><input type="text" id="emailjsPublicKey" placeholder="e.g. pk_xxxx"></div>
          <button class="btn btn-accent btn-sm" onclick="saveEmailJSConfig()">Save EmailJS Config</button>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- Mobile bottom navigation bar -->
<nav class="mobile-nav">
  <div class="m-nav-item active" onclick="showMobilePage('overview', this)">◈<span>Overview</span></div>
  <div class="m-nav-item" onclick="showMobilePage('orders', this)">📦<span>Orders</span><span class="sb-badge" id="mobileOrdersBadge" style="display:none;margin-left:2px;font-size:8px">0</span></div>
  <div class="m-nav-item" onclick="showMobilePage('products', this)">👕<span>Products</span></div>
  <div class="m-nav-item" onclick="showMobilePage('inventory', this)">📊<span>Inventory</span></div>
  <div class="m-nav-item" onclick="showMobilePage('tweaks', this)">🛠<span>Tweaks</span></div>
  <div class="m-nav-item" onclick="showMobilePage('settings', this)">⚙<span>Settings</span></div>
</nav>

<!-- Modals -->
<div class="modal-overlay" id="orderModal">
  <div class="modal">
    <button class="modal-x" onclick="closeModal('orderModal')">✕</button>
    <h2 id="orderModalTitle">Add Order</h2><div class="modal-sub">Manual order entry</div>
    <input type="hidden" id="editOrderId">
    <div class="field-row">
      <div class="field-group"><label>First Name</label><input type="text" id="oFirst" placeholder="Ahmed"></div>
      <div class="field-group"><label>Last Name</label><input type="text" id="oLast" placeholder="Hassan"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label>Phone</label><input type="text" id="oContact" placeholder="01xxxxxxxxx"></div>
      <div class="field-group"><label>Email Address</label><input type="email" id="oEmail" placeholder="customer@email.com"></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label>City</label><select id="oCity"><option value="Cairo">Cairo</option><option value="Giza">Giza</option></select></div>
    </div>
    <div class="field-group"><label>Address</label><input type="text" id="oAddress" placeholder="Street, building, apt..."></div>
    <div class="field-row-3">
      <div class="field-group"><label>Product</label><select id="oProduct"><option value="Onyx Graphic Tee">Onyx Black</option><option value="Alabaster Graphic Tee">Alabaster White</option></select></div>
      <div class="field-group"><label>Size</label><select id="oSize"><option>S</option><option>M</option><option>L</option><option>XL</option></select></div>
      <div class="field-group"><label>Payment</label><select id="oPayment"><option>COD</option><option>Apple Pay</option><option>Card</option></select></div>
    </div>
    <div class="field-row">
      <div class="field-group"><label>Subtotal (EGP)</label><input type="number" id="oSubtotal" value="520"></div>
      <div class="field-group"><label>Shipping (EGP)</label><input type="number" id="oShipping" value="30"></div>
    </div>
    <div class="field-group"><label>Status</label>
      <select id="oStatus">
        <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option><option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option><option value="refund_requested">Refund Requested</option>
        <option value="refunded">Refunded</option><option value="refund_denied">Refund Denied</option>
      </select>
    </div>
    <div class="field-group"><label>Notes</label><textarea id="oNotes" placeholder="Internal notes..."></textarea></div>
    <div style="display:flex;gap:12px;margin-top:8px;">
      <button class="btn btn-accent" onclick="saveOrder()">Save Order</button>
      <button class="btn btn-ghost" onclick="closeModal('orderModal')">Cancel</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="productModal">
  <div class="modal">
    <button class="modal-x" onclick="closeModal('productModal')">✕</button>
    <h2 id="productModalTitle">Add Product</h2><div class="modal-sub">Product details and description</div>
    <input type="hidden" id="editProductId">
    <div class="field-group"><label>Product Name</label><input type="text" id="pName" placeholder="Onyx Graphic Tee"></div>
    <div class="field-row">
      <div class="field-group"><label>Color</label><input type="text" id="pColor" placeholder="Onyx Black"></div>
      <div class="field-group"><label>Price (EGP)</label><input type="number" id="pPrice" value="520"></div>
    </div>
    <div class="field-group"><label>Product Badge / Label</label><input type="text" id="pBadge" placeholder="e.g. Limited Drop, Collab, 1 of 1"></div>
    <div class="field-row">
      <div class="field-group"><label>Fabric</label><input type="text" id="pFabric" placeholder="Heavyweight Cotton"></div>
      <div class="field-group"><label>Fit</label><input type="text" id="pFit" placeholder="Premium Oversized"></div>
    </div>
    <div class="field-group"><label>Description</label><textarea id="pDesc" placeholder="Describe the product in detail..."></textarea></div>
    <div class="field-row">
      <div class="field-group">
        <label>Front Image URL</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" id="pFront" placeholder="blackinfront.jpg or full URL" style="flex:1;" onchange="updateImagePreview('pFront','pFrontPreview')">
          <button class="btn btn-sm btn-ghost" onclick="triggerFileUpload('pFrontFile')" style="padding:0 10px;font-size:11px;height:38px;">Upload</button>
        </div>
        <input type="file" id="pFrontFile" accept="image/*" style="display:none;" onchange="handleFileSelect(this,'pFront','pFrontPreview')">
        <div id="pFrontPreview" style="margin-top:6px;display:none;align-items:center;gap:8px;">
          <img src="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">
          <span style="font-size:11px;color:var(--muted);">Preview</span>
        </div>
      </div>
      <div class="field-group">
        <label>Back Image URL</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" id="pBack" placeholder="Blackback.jpg or full URL" style="flex:1;" onchange="updateImagePreview('pBack','pBackPreview')">
          <button class="btn btn-sm btn-ghost" onclick="triggerFileUpload('pBackFile')" style="padding:0 10px;font-size:11px;height:38px;">Upload</button>
        </div>
        <input type="file" id="pBackFile" accept="image/*" style="display:none;" onchange="handleFileSelect(this,'pBack','pBackPreview')">
        <div id="pBackPreview" style="margin-top:6px;display:none;align-items:center;gap:8px;">
          <img src="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">
          <span style="font-size:11px;color:var(--muted);">Preview</span>
        </div>
      </div>
    </div>
    <div class="field-group"><label>Status</label>
      <select id="pStatus"><option value="active">Active</option><option value="draft">Draft</option><option value="soldout">Sold Out</option></select>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;">
      <button class="btn btn-accent" onclick="saveProduct()">Save Product</button>
      <button class="btn btn-ghost" onclick="closeModal('productModal')">Cancel</button>
    </div>
  </div>
</div>
`;
}


// CONFIG — stored in localStorage
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG_KEY = 'mjr_admin_config';

function getConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; } catch { return {}; }
}
function setConfig(obj) {
  const cur = getConfig();
  localStorage.setItem(CONFIG_KEY, JSON.stringify({...cur, ...obj}));
}

function getCredentials() {
  const c = getConfig();
  return { 
    user: c.adminUser || 'admin', 
    pass: c.adminPass || 'essamhatab999' 
  };
}

// Helper utility to pause execution to prevent race conditions during DB indexing
const sleep = ms => new Promise(res => setTimeout(res, ms));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE CLIENT (minimal fetch-based integration)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let SB_URL = '', SB_KEY = '';

function initSupabase() {
  const c = getConfig();
  
  // Auto-update localStorage keys if window.SB_URL (from supabase-config.js) has been updated
  if (window.SB_URL && window.SB_URL.indexOf("PLACEHOLDER") === -1 && window.SB_URL !== c.sbUrl) {
    c.sbUrl = window.SB_URL;
    c.sbKey = window.SB_KEY;
    setConfig({ sbUrl: c.sbUrl, sbKey: c.sbKey });
  }
  
  // Auto-correct the common URL typo in localStorage
  if (c.sbUrl === "https://pquahubswstyibogjvb.supabase.co") {
    c.sbUrl = "https://pquahubswstyibiogjvb.supabase.co";
    setConfig({ sbUrl: c.sbUrl });
  }

  SB_URL = c.sbUrl || (window.SB_URL && window.SB_URL.indexOf("PLACEHOLDER") === -1 ? window.SB_URL : '');
  SB_KEY = c.sbKey || (window.SB_KEY && window.SB_KEY.indexOf("PLACEHOLDER") === -1 ? window.SB_KEY : '');
  
  // Supabase URL and Key are managed securely on the backend serverless proxy
  document.getElementById('setupBanner').style.display = 'none';
  const sbUrlSettingsInput = document.getElementById('sbUrlSettings');
  const sbKeySettingsInput = document.getElementById('sbKeySettings');
  if (sbUrlSettingsInput) {
    sbUrlSettingsInput.value = 'Configured securely on Vercel';
    sbUrlSettingsInput.disabled = true;
  }
  if (sbKeySettingsInput) {
    sbKeySettingsInput.value = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
    sbKeySettingsInput.disabled = true;
  }
  const saveReconnectBtn = document.querySelector('button[onclick="saveSupabaseFromSettings()"]');
  if (saveReconnectBtn) {
    saveReconnectBtn.disabled = true;
    saveReconnectBtn.textContent = 'Managed on Server';
  }
  const copyBtn = document.querySelector('button[onclick="copyConfigJS()"]');
  if (copyBtn) {
    copyBtn.disabled = true;
    copyBtn.style.display = 'none';
  }

  const emailjsServiceIdInput = document.getElementById('emailjsServiceId');
  const emailjsTemplateIdInput = document.getElementById('emailjsTemplateId');
  const emailjsPublicKeyInput = document.getElementById('emailjsPublicKey');
  if (emailjsServiceIdInput) emailjsServiceIdInput.value = c.emailjsServiceId || '';
  if (emailjsTemplateIdInput) emailjsTemplateIdInput.value = c.emailjsTemplateId || '';
  if (emailjsPublicKeyInput) emailjsPublicKeyInput.value = c.emailjsPublicKey || '';

  // Populate WhatsApp setting
  const waNumberInput = document.getElementById('waNumber');
  if (waNumberInput) waNumberInput.value = c.waNumber || '';

  // Populate Marquee, Toggles, and Coupons settings from localStorage (cache)
  const promoInput = document.getElementById('promoTextSetting');
  const speedInput = document.getElementById('tweakPromoSpeed');
  const repeatsInput = document.getElementById('tweakPromoRepeats');
  const showMarqueeSelect = document.getElementById('tweakShowMarquee');
  const signInSelect = document.getElementById('tweakShowSignIn');
  const showStarsSelect = document.getElementById('tweakShowStars');
  const showSizeCalcSelect = document.getElementById('tweakShowSizeCalc');
  const showInstagramSelect = document.getElementById('tweakShowInstagram');
  const showTiktokSelect = document.getElementById('tweakShowTiktok');
  const showCouponsSelect = document.getElementById('tweakShowCoupons');
  const couponCodesInput = document.getElementById('tweakCouponCodes');
  
  if (promoInput) promoInput.value = localStorage.getItem('mjr_promo_text') || '';
  if (speedInput) speedInput.value = localStorage.getItem('mjr_promo_speed') || '25';
  if (repeatsInput) repeatsInput.value = localStorage.getItem('mjr_promo_repeats') || '1';
  if (showMarqueeSelect) showMarqueeSelect.value = localStorage.getItem('mjr_show_marquee') || 'true';
  if (signInSelect) signInSelect.value = localStorage.getItem('mjr_show_signin') || 'true';
  if (showStarsSelect) showStarsSelect.value = localStorage.getItem('mjr_show_stars') || 'true';
  if (showSizeCalcSelect) showSizeCalcSelect.value = localStorage.getItem('mjr_show_size_calc') || 'true';
  if (showInstagramSelect) showInstagramSelect.value = localStorage.getItem('mjr_show_instagram') || 'true';
  if (showTiktokSelect) showTiktokSelect.value = localStorage.getItem('mjr_show_tiktok') || 'true';
  if (showCouponsSelect) showCouponsSelect.value = localStorage.getItem('mjr_show_coupons') || 'false';
  if (couponCodesInput) couponCodesInput.value = localStorage.getItem('mjr_coupon_codes') || 'SAVE10:10%,OFF50:50';
  // Payment method toggles
  const showCODSelect = document.getElementById('tweakShowCOD');
  const showApplePaySelect = document.getElementById('tweakShowApplePay');
  const showCardSelect = document.getElementById('tweakShowCard');
  if (showCODSelect) showCODSelect.value = localStorage.getItem('mjr_show_cod') || 'true';
  if (showApplePaySelect) showApplePaySelect.value = localStorage.getItem('mjr_show_apple_pay') || 'true';
  if (showCardSelect) showCardSelect.value = localStorage.getItem('mjr_show_card') || 'true';
  
  // Pre-launch mode selectors
  const showPrelaunchSelect = document.getElementById('tweakShowPrelaunch');
  const prelaunchDateInput = document.getElementById('tweakPrelaunchDate');
  const prelaunchPasswordInput = document.getElementById('tweakPrelaunchPassword');
  const prelaunchEmailsTextarea = document.getElementById('tweakPrelaunchEmails');
  if (showPrelaunchSelect) showPrelaunchSelect.value = localStorage.getItem('mjr_show_prelaunch') || 'false';
  if (prelaunchDateInput) prelaunchDateInput.value = localStorage.getItem('mjr_prelaunch_date') || '2026-07-01T20:00:00';
  if (prelaunchPasswordInput) prelaunchPasswordInput.value = localStorage.getItem('mjr_prelaunch_password') || 'majarah2026';
  if (prelaunchEmailsTextarea) {
    const emailStr = localStorage.getItem('mjr_prelaunch_emails') || '[]';
    try {
      const arr = JSON.parse(emailStr);
      prelaunchEmailsTextarea.value = Array.isArray(arr) ? arr.join('\n') : emailStr;
    } catch(e) {
      prelaunchEmailsTextarea.value = emailStr;
    }
  }
  
  updatePromoPreviewStats();

  // Fetch settings from the secure database proxy on load
  sbFetch('settings', 'GET', null)
    .then(data => {
        if (data && data.length > 0) {
          data.forEach(item => {
            localStorage.setItem(`mjr_${item.key}`, item.value);
            
            // Populate matching DOM field
            if (item.key === 'promo_text' && promoInput) promoInput.value = item.value;
            if (item.key === 'promo_speed' && speedInput) speedInput.value = item.value;
            if (item.key === 'promo_repeats' && repeatsInput) repeatsInput.value = item.value;
            if (item.key === 'show_marquee' && showMarqueeSelect) showMarqueeSelect.value = item.value;
            if (item.key === 'show_signin' && signInSelect) signInSelect.value = item.value;
            if (item.key === 'show_stars' && showStarsSelect) showStarsSelect.value = item.value;
            if (item.key === 'show_size_calc' && showSizeCalcSelect) showSizeCalcSelect.value = item.value;
            if (item.key === 'show_instagram' && showInstagramSelect) showInstagramSelect.value = item.value;
            if (item.key === 'show_tiktok' && showTiktokSelect) showTiktokSelect.value = item.value;
            if (item.key === 'show_coupons' && showCouponsSelect) showCouponsSelect.value = item.value;
            if (item.key === 'coupon_codes' && couponCodesInput) couponCodesInput.value = item.value;
            // Payment toggles from Supabase
            const showCODSel = document.getElementById('tweakShowCOD');
            const showApplePaySel = document.getElementById('tweakShowApplePay');
            const showCardSel = document.getElementById('tweakShowCard');
            if (item.key === 'show_cod' && showCODSel) showCODSel.value = item.value;
            if (item.key === 'show_apple_pay' && showApplePaySel) showApplePaySel.value = item.value;
            if (item.key === 'show_card' && showCardSel) showCardSel.value = item.value;
            
            // Pre-launch mode settings from Supabase
            const showPrelaunchSel = document.getElementById('tweakShowPrelaunch');
            const prelaunchDateIn = document.getElementById('tweakPrelaunchDate');
            const prelaunchPasswordIn = document.getElementById('tweakPrelaunchPassword');
            const prelaunchEmailsTex = document.getElementById('tweakPrelaunchEmails');
            if (item.key === 'show_prelaunch' && showPrelaunchSel) showPrelaunchSel.value = item.value;
            if (item.key === 'prelaunch_date' && prelaunchDateIn) prelaunchDateIn.value = item.value;
            if (item.key === 'prelaunch_password' && prelaunchPasswordIn) prelaunchPasswordIn.value = item.value;
            if (item.key === 'prelaunch_emails' && prelaunchEmailsTex) {
              try {
                const arr = JSON.parse(item.value);
                prelaunchEmailsTex.value = Array.isArray(arr) ? arr.join('\n') : item.value;
              } catch(e) {
                prelaunchEmailsTex.value = item.value;
              }
            }
          });
          updatePromoPreviewStats();
        }
      })
      .catch(err => console.error("Error loading settings from database:", err));
}

// Returns the best available auth token: user JWT if logged in, anon key as fallback
async function sbFetch(table, method='GET', body=null, filters='', id=null) {
  const token = localStorage.getItem('mjr_admin_token') || '';
  
  // Build query string
  let queryParams = '';
  if (id) {
    queryParams = `?id=eq.${id}`;
  } else if (filters) {
    queryParams = filters;
  }

  // Combine query string with proxy table parameter
  const connector = queryParams ? '&' : '?';
  const url = `/api/proxy${queryParams}${connector}table=${table}`;

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Proxy Database Error (${res.status}):`, errText);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("Database communication down:", e);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APPLICATIVE MANAGEMENT LOCAL STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let storeOrders = [];
let storeProducts = [];
let storeInventory = [];

// Show toast notification
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.className = 'show' + (type ? ' toast-' + type : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

let syncIntervalId = null;

// Request browser notification permission
function requestNotificationPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Show browser desktop notification
function showSystemNotification(title, body) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch (e) {
      console.warn("Failed to trigger system notification:", e);
    }
  }
}

// Play the Ding.wav audio file
function playNotificationSound() {
  const audio = new Audio('../Ding.wav');
  audio.play().catch(e => {
    console.warn("Autoplay blocked by browser. Click on the admin panel to enable audio notifications.", e);
  });
}

// Mobile/Safari Audio Engine Unlocker
function unlockMobileAudio() {
  const audio = new Audio('../Ding.wav');
  audio.volume = 0;
  audio.play().then(() => {
    console.log("Mobile audio context unlocked successfully.");
    document.removeEventListener('click', unlockMobileAudio);
    document.removeEventListener('touchstart', unlockMobileAudio);
  }).catch(err => {
    console.warn("Audio unlock failed (waiting for interaction):", err);
  });
}
document.addEventListener('click', unlockMobileAudio);
document.addEventListener('touchstart', unlockMobileAudio);

// Flash tab title
let flashInterval = null;
function flashTitle(msg) {
  if (flashInterval) clearInterval(flashInterval);
  const originalTitle = document.title;
  let showNew = true;
  flashInterval = setInterval(() => {
    document.title = showNew ? `🔔 ${msg}` : originalTitle;
    showNew = !showNew;
  }, 1000);
  
  const stopFlash = () => {
    clearInterval(flashInterval);
    flashInterval = null;
    document.title = originalTitle;
    window.removeEventListener('click', stopFlash);
    window.removeEventListener('focus', stopFlash);
  };
  window.addEventListener('click', stopFlash);
  window.addEventListener('focus', stopFlash);
}

function startAutoSync() {
  if (syncIntervalId) clearInterval(syncIntervalId);
  // Poll every 10 seconds for new orders or updates
  syncIntervalId = setInterval(() => {
    if (localStorage.getItem('mjr_admin_logged_in') === 'true') {
      syncDashboardData(true);
    }
  }, 10000);
}

function stopAutoSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

// --- COOKIE HELPERS & SESSION CONTROL ---
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for(let i=0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {   
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// --- GREEN FAVICON TINT FILTER ---
function applyGreenIcon() {
  const img = new Image();
  img.src = '../majarah.jpg';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // Convert to grayscale and apply green-tint filter
        const val = (r + g + b) / 3;
        data[i] = val * 0.15;     // Reduce Red
        data[i+1] = val * 1.6;    // Boost Green
        data[i+2] = val * 0.15;   // Reduce Blue
      }
      ctx.putImageData(imgData, 0, 0);
      
      let link = document.getElementById('adminIcon');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.id = 'adminIcon';
        document.head.appendChild(link);
      }
      link.href = canvas.toDataURL("image/png");
    } catch(e) {
      console.error("Failed to process green icon via canvas:", e);
    }
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TERMINAL AUTHENTICATION LOOP CONTROL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (document.getElementById('loginPass')) {
  document.getElementById('loginPass').addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
  // Also allow Enter on username field
  document.getElementById('loginUser').addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
}

// Escape key closes open modals
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

async function doLogin() {
  const email = document.getElementById('loginUser').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');
  errEl.style.display = 'none';
  const btn = document.querySelector('.login-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    btn.textContent = 'Enter Dashboard';
    btn.disabled = false;

    if (!res.ok || !data.token) {
      errEl.textContent = data.error || 'Invalid credentials. Try again.';
      errEl.style.display = 'block';
    } else {
      localStorage.setItem('mjr_admin_token', data.token);
      showDashboard();
    }
  } catch (err) {
    console.error("Auth server error:", err);
    errEl.textContent = 'Could not connect to auth server.';
    errEl.style.display = 'block';
    btn.textContent = 'Enter Dashboard';
    btn.disabled = false;
  }
}

async function logout() {
  localStorage.removeItem('mjr_admin_token');
  document.getElementById('app').style.display = 'none';
  document.getElementById('app').innerHTML = '';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginUser').value = '';
  stopAutoSync();
}

function showDashboard() {
  renderDashboard();
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  initSupabase();
  syncDashboardData();
  startAutoSync();
  requestNotificationPermission();
}

// Auto-login on load/refresh if Supabase session exists
window.addEventListener('DOMContentLoaded', async () => {
  applyGreenIcon();

  const token = localStorage.getItem('mjr_admin_token');
  if (token) {
    showDashboard();
  } else {
    // No active session — show login screen
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA SYNC & DISPLAY ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function syncDashboardData(isBackground = false) {
  console.log("Syncing database tables...");
  
  // 1. Fetch live tables from Supabase
  const orders = await sbFetch('orders', 'GET', null, '?select=*&order=id.desc');
  const products = await sbFetch('products', 'GET', null, '?select=*&order=name.asc');
  const inventory = await sbFetch('inventory', 'GET', null, '?select=*');
  
  const previousOrders = [...storeOrders];
  
  if (orders) storeOrders = orders;
  if (products) storeProducts = products;
  if (inventory) storeInventory = inventory;
  
  // Update last synced time
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const syncEl = document.getElementById('sidebarSyncTime');
  if (syncEl) syncEl.textContent = `Synced ${timeStr}`;
  const headerSyncEl = document.getElementById('headerSyncTime');
  if (headerSyncEl) headerSyncEl.textContent = `Synced ${timeStr}`;

  // Update pending order badge on sidebar & mobile nav
  const pendingCount = storeOrders.filter(o => o.status === 'pending').length;
  const badge = document.getElementById('newOrdersBadge');
  const mobileBadge = document.getElementById('mobileOrdersBadge');
  if (badge) { badge.textContent = pendingCount; badge.style.display = pendingCount > 0 ? '' : 'none'; }
  if (mobileBadge) { mobileBadge.textContent = pendingCount; mobileBadge.style.display = pendingCount > 0 ? '' : 'none'; }

  // 2. Render UI Components
  renderOverviewCounters();
  renderRecentOrdersTable();
  renderOrdersTable(storeOrders);
  renderProductsTable();
  renderInventoryGrid();
  renderAnalyticsCharts(storeOrders);
  
  // 3. Play notification sound if there are new orders or updates
  if (isBackground && previousOrders.length > 0 && orders) {
    let hasNewNotifications = false;
    let notificationMessage = "";
    
    for (const o of orders) {
      const prev = previousOrders.find(p => String(p.id) === String(o.id));
      if (!prev) {
        hasNewNotifications = true;
        notificationMessage = `New order #${o.id} received from ${o.first_name || ''} ${o.last_name || ''}!`;
        break;
      } else if (prev.status !== o.status) {
        if (o.status === 'refund_requested') {
          hasNewNotifications = true;
          notificationMessage = `Refund requested for order #${o.id}!`;
          break;
        } else if (o.status === 'pending') {
          hasNewNotifications = true;
          notificationMessage = `Order #${o.id} status changed to pending!`;
          break;
        }
      }
    }
    
    if (hasNewNotifications) {
      playNotificationSound();
      flashTitle(notificationMessage);
      showSystemNotification("MAJARAH Admin Notification", notificationMessage);
      showToast(notificationMessage);
    }
  }
}

function renderOverviewCounters() {
  const animateCount = (el, target, prefix = '', suffix = '') => {
    if (!el) return;
    const start = 0;
    const duration = 600;
    const startTime = performance.now();
    const isFloat = String(target).includes('.');
    const update = (now) => {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
      const current = start + (target - start) * eased;
      el.textContent = prefix + (isFloat ? current.toFixed(0) : Math.round(current)) + suffix;
      if (elapsed < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  const totalOrders = storeOrders.length;
  const rev = storeOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
  const pending = storeOrders.filter(o => o.status === 'pending').length;
  const units = storeOrders.filter(o => o.status !== 'cancelled').length;

  animateCount(document.getElementById('statOrders'),  totalOrders);
  animateCount(document.getElementById('statRevenue'), rev, '', ' EGP');
  animateCount(document.getElementById('statPending'), pending);
  animateCount(document.getElementById('statUnits'),   units);
}

function renderRecentOrdersTable() {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;
  
  const recent = storeOrders.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No orders found.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td class="mono" data-label="#">#${o.id}</td>
      <td data-label="Customer">${o.first_name || ''} ${o.last_name || ''}</td>
      <td data-label="Product">${o.product_name || 'Item'}</td>
      <td class="mono" data-label="Size">${o.size || '—'}</td>
      <td class="mono" data-label="Total">${o.subtotal || 0} EGP</td>
      <td data-label="Status"><span class="badge-pill badge-${getStatusColor(o.status)}">${o.status}</span></td>
      <td class="mono" data-label="Date">${o.created_at ? o.created_at.split('T')[0] : '—'}</td>
    </tr>
  `).join('');
}

function renderOrdersTable(data) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">No matching orders.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = data.map(o => {
    let refundInfo = '';
    if (o.status === 'refund_requested') {
      refundInfo = `<div style="font-size:11px;color:var(--orange);margin-top:4px;"><strong>Refund Req:</strong> ${o.refund_reason || 'Other'}${o.refund_notes ? ` - ${o.refund_notes}` : ''}</div>`;
    } else if (o.status === 'refunded') {
      refundInfo = `<div style="font-size:11px;color:#ba68c8;margin-top:4px;"><strong>Refunded:</strong> ${o.refund_reason || 'Other'}${o.refund_notes ? ` - ${o.refund_notes}` : ''}</div>`;
    } else if (o.status === 'refund_denied') {
      refundInfo = `<div style="font-size:11px;color:var(--muted);margin-top:4px;"><strong>Refund Denied:</strong> ${o.refund_reason || 'Other'}${o.refund_notes ? ` - ${o.refund_notes}` : ''}</div>`;
    }

    let actionsHTML = '';
    if (o.status === 'refund_requested') {
      actionsHTML = `
        <button class="btn btn-ghost btn-sm" style="color:var(--green); border-color:rgba(0,230,118,.2);" onclick="changeOrderStatus('${o.id}', 'refunded')">✓ Approve</button>
        <button class="btn btn-ghost btn-sm btn-danger" onclick="changeOrderStatus('${o.id}', 'refund_denied')">✕ Reject</button>
      `;
    } else if (o.status === 'pending') {
      actionsHTML = `
        <button class="btn btn-ghost btn-sm" onclick="changeOrderStatus('${o.id}', 'confirmed')">✓ Confirm</button>
        <button class="btn btn-ghost btn-sm" onclick="sendWhatsAppConfirmation('${o.id}')" style="border-color:rgba(37, 211, 102, 0.3); color:#25d366;">💬 WA Msg</button>
      `;
    } else if (o.status === 'confirmed') {
      actionsHTML = `
        <button class="btn btn-ghost btn-sm" onclick="changeOrderStatus('${o.id}', 'shipped')">🚚 Ship</button>
      `;
    } else if (o.status === 'shipped') {
      actionsHTML = `
        <button class="btn btn-ghost btn-sm" onclick="changeOrderStatus('${o.id}', 'delivered')">📦 Deliver</button>
      `;
    }

    // Always include delete action
    actionsHTML += `
      <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteOrder('${o.id}')">✕ Delete</button>
    `;

    const addressParts = o.address ? o.address.split(' | ') : [o.address || '—'];
    const street = addressParts[0] || '—';
    const building = addressParts[1] || '—';
    const floor = addressParts[2] || '—';
    const apt = addressParts[3] || '—';
    const landmark = addressParts[4] || '—';
    const hasSubfields = addressParts.length > 1;

    let addressDisplayHTML = '';
    if (hasSubfields) {
      addressDisplayHTML = `
        <div class="order-address-box" style="font-size:11px; margin-top:6px; color:#aaa; line-height:1.4; background:#0d0d0d; border:1px solid #1a1a1a; padding:6px 10px; border-radius:4px; max-width: 280px; text-align: left;">
           <div style="cursor:pointer; margin-bottom: 4px; font-weight: 500;" onclick="navigator.clipboard.writeText('${street.replace(/'/g, "\\'")}') ; showToast('Copied Address!')" title="Click to copy Address">📍 <span>${street}</span></div>
           <div style="font-size: 10px; color: #888; display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="cursor:pointer; background: #161616; padding: 2px 5px; border-radius: 2px;" onclick="navigator.clipboard.writeText('${building.replace(/'/g, "\\'")}') ; showToast('Copied Building!')" title="Click to copy Building">🏢 Bld: ${building}</span>
              <span style="cursor:pointer; background: #161616; padding: 2px 5px; border-radius: 2px;" onclick="navigator.clipboard.writeText('${floor.replace(/'/g, "\\'")}') ; showToast('Copied Floor!')" title="Click to copy Floor">🚪 Flr: ${floor}</span>
              <span style="cursor:pointer; background: #161616; padding: 2px 5px; border-radius: 2px;" onclick="navigator.clipboard.writeText('${apt.replace(/'/g, "\\'")}') ; showToast('Copied Apartment!')" title="Click to copy Apartment">🔑 Apt: ${apt}</span>
           </div>
           ${landmark !== '—' && landmark !== '-' && landmark !== '' ? `<div style="cursor:pointer; font-size:10px; color:#888; margin-top:4px; background: #161616; padding: 2px 5px; border-radius: 2px; display: inline-block;" onclick="navigator.clipboard.writeText('${landmark.replace(/'/g, "\\'")}') ; showToast('Copied Landmark!')" title="Click to copy Landmark">🚩 Landmark: ${landmark}</div>` : ''}
        </div>
      `;
    } else {
      addressDisplayHTML = `
        <div class="order-address-box" style="font-size:11px; margin-top:6px; color:#aaa; line-height:1.4; background:#0d0d0d; border:1px solid #1a1a1a; padding:6px 10px; border-radius:4px; max-width: 280px; text-align: left; cursor:pointer;" onclick="navigator.clipboard.writeText('${street.replace(/'/g, "\\'")}') ; showToast('Copied Address!')" title="Click to copy Address">
           📍 <span>${street}</span>
        </div>
      `;
    }

    return `
      <tr>
        <td class="mono" data-label="ID">#${o.id}</td>
        <td data-label="Customer">
          <div style="font-weight:600; cursor:pointer;" onclick="navigator.clipboard.writeText('${(o.first_name || '') + ' ' + (o.last_name || '')}') ; showToast('Copied Name!')" title="Click to copy Name">${o.first_name || ''} ${o.last_name || ''}</div>
          <div style="font-size:11px;color:var(--muted);">${o.email || ''}</div>
          ${addressDisplayHTML}
        </td>
        <td class="mono" data-label="Contact">
          <div style="cursor:pointer; font-weight:600;" onclick="navigator.clipboard.writeText('${o.phone || ''}') ; showToast('Copied Phone!')" title="Click to copy Phone">${o.phone || '—'}</div>
          <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); sendWhatsAppConfirmation('${o.id}')" style="margin-top:6px; display:inline-block; border-color:rgba(37, 211, 102, 0.3); color:#25d366; font-size:9px; padding:2px 6px;" title="Confirm via WhatsApp">
            💬 Confirm (WA)
          </button>
        </td>
        <td data-label="Product">
          <div>${o.product_name || '—'}</div>
          ${refundInfo}
        </td>
        <td class="mono" data-label="Size">${o.size || '—'}</td>
        <td data-label="City">${o.city || '—'}</td>
        <td class="mono" data-label="Payment">${o.payment_method || 'COD'}</td>
        <td class="mono" data-label="Total">${(Number(o.subtotal)||0) + (Number(o.shipping_cost)||0)} EGP</td>
        <td data-label="Status"><span class="badge-pill badge-${getStatusColor(o.status)}">${o.status}</span></td>
        <td data-label="Actions" style="display:flex; gap:6px; justify-content: flex-end; flex-wrap:wrap; width: auto;">${actionsHTML}</td>
      </tr>
    `;
  }).join('');
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  
  if (storeProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No products found.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = storeProducts.map(p => `
    <tr>
      <td data-label="Name"><strong>${p.name}</strong></td>
      <td data-label="Color">${p.color || '—'}</td>
      <td class="mono" data-label="Price">${p.price || 0} EGP</td>
      <td data-label="Fabric">${p.fabric || '—'}</td>
      <td data-label="Fit">${p.fit || '—'}</td>
      <td data-label="Status"><span class="badge-pill badge-${p.status === 'active' ? 'green' : (p.status === 'soldout' ? 'red' : 'muted')}">${p.status || 'active'}</span></td>
      <td data-label="Actions" style="display:flex; gap:6px; justify-content: flex-end; flex-wrap:wrap; width: auto;">
        <button class="btn btn-ghost btn-sm" onclick="openEditProduct(${p.id})">Edit</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function getStatusColor(status) {
  if (status === 'pending') return 'orange';
  if (status === 'refund_requested') return 'orange';
  if (status === 'confirmed' || status === 'delivered' || status === 'shipped') return 'green';
  if (status === 'cancelled') return 'red';
  if (status === 'refunded') return 'purple';
  if (status === 'refund_denied') return 'muted';
  return 'muted';
}

// --- WHATSAPP CONFIRMATION & BULK CSV EXPORT OPERATIONS ---
function formatWhatsAppPhone(phone) {
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.startsWith('01')) {
    clean = '2' + clean;
  } else if (clean.startsWith('1')) {
    clean = '20' + clean;
  } else if (!clean.startsWith('20') && clean.length === 11) {
    clean = '2' + clean;
  }
  return clean;
}

function sendWhatsAppConfirmation(orderId) {
  const o = storeOrders.find(order => String(order.id) === String(orderId));
  if (!o) return;
  
  const phone = formatWhatsAppPhone(o.phone);
  const total = (Number(o.subtotal)||0) + (Number(o.shipping_cost)||0);
  
  const addressParts = o.address ? o.address.split(' | ') : [o.address || '—'];
  const street = addressParts[0] || '—';
  const city = o.city || '—';
  const fullAddressStr = city + ' - ' + street;
  
  const message = `يا هلا بيك في مجرة! 🌌\n\nحابين نأكد معاك طلبك رقم #${o.id} لقطعة:\n👕 ${o.product_name} (مقاس ${o.size || '—'})\n\n📍 العنوان: ${fullAddressStr}\n💰 الحساب الكلي: ${total} جنيه (شامل الشحن)\n\nيرجى الرد بـ *تأكيد* لتجهيز وشحن طلبك في أسرع وقت! 🚀`;
  
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function getActiveFilteredOrders() {
  const activeTab = document.querySelector('.filter-tab.active');
  const searchVal = document.getElementById('orderSearch').value.toLowerCase().trim();
  
  let result = [...storeOrders];
  
  if (activeTab) {
    const statusText = activeTab.getAttribute('onclick');
    const match = statusText.match(/filterOrders\('([^']+)'/);
    if (match && match[1] !== 'all') {
      const status = match[1];
      result = result.filter(o => o.status === status);
    }
  }
  
  if (searchVal) {
    result = result.filter(o => 
      (o.first_name && o.first_name.toLowerCase().includes(searchVal)) ||
      (o.last_name && o.last_name.toLowerCase().includes(searchVal)) ||
      (o.phone && o.phone.includes(searchVal))
    );
  }
  
  return result;
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadCSV(filename, content) {
  const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportOrdersCSV(provider) {
  const activeOrders = getActiveFilteredOrders();
  if (activeOrders.length === 0) {
    showToast("No orders available to export.", "error");
    return;
  }
  
  let csvContent = "";
  if (provider === 'shipblu') {
    const headers = ["Reference ID", "Recipient Name", "Recipient Phone 1", "Recipient Phone 2", "Governorate", "City", "Address Description", "COD Amount", "Package Description", "Number of Items", "Weight (KG)", "Allow Customer to Open Package"];
    csvContent += headers.map(escapeCSV).join(",") + "\n";
    
    activeOrders.forEach(o => {
      const name = `${o.first_name || ''} ${o.last_name || ''}`.trim();
      const addressDesc = o.address ? o.address.replace(/ \| /g, ', ') : '';
      const totalAmount = o.payment_method === 'COD' ? ((Number(o.subtotal)||0) + (Number(o.shipping_cost)||0)) : 0;
      const desc = `${o.product_name || 'Shirt'} (${o.size || '—'})`;
      
      const row = [
        o.id,
        name,
        o.phone || '',
        '',
        o.city || '',
        o.city || '',
        addressDesc,
        totalAmount,
        desc,
        1,
        0.5,
        "Yes"
      ];
      csvContent += row.map(escapeCSV).join(",") + "\n";
    });
  } else if (provider === 'mylerz') {
    const headers = ["BarCode", "Reference_Number", "Consignee_Name", "Address", "Mobile_Number", "City", "Neighborhood", "Service_Type", "COD_Value", "Description", "Weight", "Special_Instructions"];
    csvContent += headers.map(escapeCSV).join(",") + "\n";
    
    activeOrders.forEach(o => {
      const name = `${o.first_name || ''} ${o.last_name || ''}`.trim();
      const addressDesc = o.address ? o.address.replace(/ \| /g, ', ') : '';
      const totalAmount = o.payment_method === 'COD' ? ((Number(o.subtotal)||0) + (Number(o.shipping_cost)||0)) : 0;
      const desc = `${o.product_name || 'Shirt'} (${o.size || '—'})`;
      
      const row = [
        '',
        o.id,
        name,
        addressDesc,
        o.phone || '',
        o.city || '',
        o.city || '',
        'Delivery',
        totalAmount,
        desc,
        0.5,
        ''
      ];
      csvContent += row.map(escapeCSV).join(",") + "\n";
    });
  }
  
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(`majarah_orders_${provider}_${dateStr}.csv`, csvContent);
  showToast(`Exported ${activeOrders.length} orders to ${provider.toUpperCase()} CSV!`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE ACTIONS & OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showPage(pageId, element) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if(targetPage) targetPage.classList.add('active');
  
  if(element) {
    document.querySelectorAll('.sb-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
  }

  // Sync mobile nav items active states
  document.querySelectorAll('.m-nav-item').forEach(item => {
    const onClickAttr = item.getAttribute('onclick');
    if (onClickAttr && onClickAttr.includes(`'${pageId}'`)) {
      document.querySelectorAll('.m-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    }
  });
}

function showMobilePage(pageId, element) {
  showPage(pageId);
  document.querySelectorAll('.m-nav-item').forEach(item => item.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

function openAddOrder() {
  document.getElementById('oFirst').value = '';
  document.getElementById('oLast').value = '';
  document.getElementById('oContact').value = '';
  if (document.getElementById('oEmail')) document.getElementById('oEmail').value = '';
  document.getElementById('oAddress').value = '';
  document.getElementById('oSubtotal').value = '520';
  document.getElementById('oShipping').value = '30';
  document.getElementById('oNotes').value = '';
  document.getElementById('orderModal').classList.add('open');
}
// --- PHOTO UPLOADER CONTROLS (OPTIMIZED HD: max 1200px at 85% quality JPEG) ---
function triggerFileUpload(id) {
  document.getElementById(id).click();
}

function handleFileSelect(input, targetId, previewId) {
  const file = input.files[0];
  if (!file) return;

  const targetInput = document.getElementById(targetId);
  const originalPlaceholder = targetInput.placeholder;
  
  targetInput.value = '';
  targetInput.placeholder = 'Compressing image (Optimized HD)...';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const maxDim = 1200; // Optimized HD Limit: 1200px max dimension
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG at 0.85 quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      targetInput.value = dataUrl;
      targetInput.placeholder = originalPlaceholder;
      updateImagePreview(targetId, previewId);
      
      showToast('Image optimized successfully!');
      input.value = ''; // Reset file input
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateImagePreview(inputId, previewId) {
  const val = document.getElementById(inputId).value.trim();
  const previewDiv = document.getElementById(previewId);
  if (!previewDiv) return;
  
  if (val) {
    const imgSrc = (val.startsWith('http') || val.startsWith('data:')) ? val : `./${val}`;
    previewDiv.querySelector('img').src = imgSrc;
    previewDiv.style.display = 'flex';
  } else {
    previewDiv.style.display = 'none';
  }
}

function openAddProduct() {
  document.getElementById('editProductId').value = '';
  document.getElementById('productModalTitle').innerText = "Add Product";
  
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '520';
  document.getElementById('pColor').value = '';
  document.getElementById('pFabric').value = '';
  document.getElementById('pFit').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pFront').value = '';
  document.getElementById('pBack').value = '';
  document.getElementById('pStatus').value = 'active';
  document.getElementById('pBadge').value = '';
  
  // Hide previews on adding
  document.getElementById('pFrontPreview').style.display = 'none';
  document.getElementById('pBackPreview').style.display = 'none';
  
  document.getElementById('productModal').classList.add('open');
}

function openEditProduct(id) {
  const p = storeProducts.find(prod => prod.id === id);
  if (!p) return;
  
  document.getElementById('editProductId').value = p.id;
  document.getElementById('productModalTitle').innerText = "Edit Product";
  
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pPrice').value = p.price || 0;
  document.getElementById('pColor').value = p.color || '';
  document.getElementById('pFabric').value = p.fabric || '';
  document.getElementById('pFit').value = p.fit || '';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pFront').value = p.front_image_url || '';
  document.getElementById('pBack').value = p.back_image_url || '';
  document.getElementById('pStatus').value = p.status || 'active';
  document.getElementById('pBadge').value = p.badge || '';
  
  // Load previews when editing
  updateImagePreview('pFront', 'pFrontPreview');
  updateImagePreview('pBack', 'pBackPreview');
  
  document.getElementById('productModal').classList.add('open');
}

function filterOrders(status, el) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  
  if (status === 'all') {
    renderOrdersTable(storeOrders);
  } else {
    const filtered = storeOrders.filter(o => o.status === status);
    renderOrdersTable(filtered);
  }
}

function searchOrders(val) {
  const term = val.toLowerCase().trim();
  const filtered = storeOrders.filter(o => 
    (o.first_name && o.first_name.toLowerCase().includes(term)) ||
    (o.last_name && o.last_name.toLowerCase().includes(term)) ||
    (o.phone && o.phone.includes(term))
  );
  renderOrdersTable(filtered);
}

async function changeOrderStatus(id, newStatus) {
  const statusLabels = {
    confirmed: 'Confirm', shipped: 'Ship', delivered: 'Mark Delivered',
    refunded: 'Approve Refund', refund_denied: 'Reject Refund'
  };
  const verb = statusLabels[newStatus] || `Update to ${newStatus}`;
  // Use toast-based confirmation instead of browser confirm()
  const confirmed = await adminConfirm(`${verb} order #${id}?`);
  if (!confirmed) return;

  let success = false;
  if (window.SB_URL && window.SB_KEY && String(id).indexOf('ORD-') === -1) {
    const res = await sbFetch('orders', 'PATCH', { status: newStatus }, null, id);
    if (res) success = true;
  }

  const localOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
  const idx = localOrders.findIndex(o => String(o.id) === String(id));
  if (idx !== -1) {
    localOrders[idx].status = newStatus;
    localStorage.setItem('storeOrders', JSON.stringify(localOrders));
    success = true;
  }

  if (success) {
    showToast(`Order #${id} status updated to ${newStatus}`);
  } else {
    showToast(`Failed to update status for order #${id}`);
  }
  syncDashboardData();
}

async function deleteOrder(id) {
  const confirmed = await adminConfirm(`Delete order #${id}? This cannot be undone.`);
  if (!confirmed) return;
  
  let success = false;
  if (window.SB_URL && window.SB_KEY && String(id).indexOf('ORD-') === -1) {
    const res = await sbFetch('orders', 'DELETE', null, `?id=eq.${id}`);
    if (res) success = true;
  }
  
  const localOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
  const idx = localOrders.findIndex(o => String(o.id) === String(id));
  if (idx !== -1) {
    localOrders.splice(idx, 1);
    localStorage.setItem('storeOrders', JSON.stringify(localOrders));
    success = true;
  }

  if (success) {
    showToast("Order deleted successfully");
  } else {
    showToast("Failed to delete order");
  }
  syncDashboardData();
}

async function saveProduct() {
  const editId = document.getElementById('editProductId').value;
  const name = document.getElementById('pName').value.trim();
  const price = document.getElementById('pPrice').value;
  const color = document.getElementById('pColor').value.trim();
  const fabric = document.getElementById('pFabric').value.trim();
  const fit = document.getElementById('pFit').value.trim();
  const description = document.getElementById('pDesc').value.trim();
  const front_image_url = document.getElementById('pFront').value.trim();
  const back_image_url = document.getElementById('pBack').value.trim();
  const status = document.getElementById('pStatus').value;
  const badge = document.getElementById('pBadge').value.trim();
  
  if (!name || !price) return alert("Product Name and Price are required!");

  const newProd = { 
    name, 
    price: Number(price), 
    color, 
    fabric, 
    fit, 
    description, 
    front_image_url, 
    back_image_url, 
    status,
    badge
  };
  
  let res;
  if (editId) {
    res = await sbFetch('products', 'PATCH', newProd, null, editId);
  } else {
    res = await sbFetch('products', 'POST', newProd);
  }
  
  if (res) {
    showToast(editId ? "Product updated successfully!" : "Product added successfully!");
    closeModal('productModal');
    // Clear inputs
    document.getElementById('pName').value = '';
    document.getElementById('pColor').value = '';
    document.getElementById('pFabric').value = '';
    document.getElementById('pFit').value = '';
    document.getElementById('pDesc').value = '';
    document.getElementById('pFront').value = '';
    document.getElementById('pBack').value = '';
    document.getElementById('pBadge').value = '';
    document.getElementById('editProductId').value = '';
    syncDashboardData();
  } else {
    showToast('Could not save product — check console for details', 'error');
    console.error('saveProduct failed. Check RLS policies or Supabase connection.');
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  // Supabase delete requires fetch via filtering unique ID
  const res = await sbFetch('products', 'DELETE', null, `?id=eq.${id}`);
  showToast("Product updated/removed");
  syncDashboardData();
}

function saveSupabaseConfig() {
  const url = document.getElementById('sbUrl').value.trim();
  const key = document.getElementById('sbKey').value.trim();
  setConfig({ sbUrl: url, sbKey: key });
  initSupabase();
  syncDashboardData();
}

function saveSupabaseFromSettings() {
  const url = document.getElementById('sbUrlSettings').value.trim();
  const key = document.getElementById('sbKeySettings').value.trim();
  setConfig({ sbUrl: url, sbKey: key });
  showToast("Connection saved!");
  initSupabase();
  syncDashboardData();
}

function copyConfigJS() {
  const c = getConfig();
  const url = c.sbUrl || '';
  const key = c.sbKey || '';
  const code = `// Shared Supabase Connection Configuration
window.SB_URL = "${url}";
window.SB_KEY = "${key}";
`;
  navigator.clipboard.writeText(code).then(() => {
    showToast("Config code copied to clipboard!");
  }).catch(() => {
    alert("Could not copy automatically. Here is the code:\n\n" + code);
  });
}

// Simple fallback stubs for untouched views
// Render the inventory card grid
function renderInventoryGrid() {
  const grid = document.getElementById('invGrid');
  if (!grid) return;
  
  if (storeProducts.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="e-icon">📊</div><p>No products found to manage inventory.</p></div>`;
    document.getElementById('totalStockLabel').innerText = "Total: 0 units";
    return;
  }
  
  // Calculate total stock
  const totalStock = storeInventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  document.getElementById('totalStockLabel').innerText = `Total: ${totalStock} units`;
  
  grid.innerHTML = storeProducts.map(p => {
    // Get stock values for sizes
    const getStock = (size) => {
      const item = storeInventory.find(i => Number(i.product_id) === p.id && i.size === size);
      return item ? item.stock : 0;
    };
    
    return `
      <div class="inv-card">
        <div class="inv-card-top">
          <div class="inv-card-title">${p.name}</div>
          <div style="font-size:11px;color:var(--muted);">${p.color || ''}</div>
        </div>
        <div class="inv-card-body">
          <div class="size-inv-row">
            <span class="size-lbl">S</span>
            <input type="number" class="size-stock-input" data-product-id="${p.id}" data-size="S" value="${getStock('S')}" min="0">
          </div>
          <div class="size-inv-row">
            <span class="size-lbl">M</span>
            <input type="number" class="size-stock-input" data-product-id="${p.id}" data-size="M" value="${getStock('M')}" min="0">
          </div>
          <div class="size-inv-row">
            <span class="size-lbl">L</span>
            <input type="number" class="size-stock-input" data-product-id="${p.id}" data-size="L" value="${getStock('L')}" min="0">
          </div>
          <div class="size-inv-row">
            <span class="size-lbl">XL</span>
            <input type="number" class="size-stock-input" data-product-id="${p.id}" data-size="XL" value="${getStock('XL')}" min="0">
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Save all inventory values in parallel
async function saveInventory() {
  const inputs = document.querySelectorAll('.size-stock-input');
  const promises = [];
  
  showToast("Saving inventory...");
  
  for (let input of inputs) {
    const productId = Number(input.getAttribute('data-product-id'));
    const size = input.getAttribute('data-size');
    const stock = Number(input.value) || 0;
    
    const existing = storeInventory.find(i => Number(i.product_id) === productId && i.size === size);
    
    if (existing) {
      promises.push(sbFetch('inventory', 'PATCH', { stock }, null, existing.id));
    } else {
      promises.push(sbFetch('inventory', 'POST', { product_id: productId, size, stock }));
    }
  }
  
  try {
    await Promise.all(promises);
    showToast("Inventory saved successfully!");
  } catch (err) {
    console.error("Error saving inventory:", err);
    showToast("Failed to save some inventory items.");
  }
  syncDashboardData();
}
function saveShipping() {
  // Persist the current zone prices from inputs back to localStorage
  const zoneInputs = document.querySelectorAll('.zone-price-input');
  const zones = JSON.parse(localStorage.getItem('storeZones')) || [];
  zoneInputs.forEach((inp, i) => {
    if (zones[i]) zones[i].price = Number(inp.value) || 0;
  });
  localStorage.setItem('storeZones', JSON.stringify(zones));
  showToast('Shipping rates saved!');
}

function addZone() {
  const name = prompt('Zone name (e.g. South Sinai):');
  const price = parseInt(prompt('Shipping price (EGP):'));
  if (!name || isNaN(price)) return;
  const zones = JSON.parse(localStorage.getItem('storeZones')) || [];
  zones.push({ name: name.trim(), price });
  localStorage.setItem('storeZones', JSON.stringify(zones));
  renderShippingZones();
  showToast(`Zone "${name}" added!`);
}

function saveShippingRules() {
  const threshold = Number(document.getElementById('freeShipThreshold').value) || 0;
  const days = document.getElementById('deliveryDays').value.trim();
  localStorage.setItem('storeShippingRules', JSON.stringify({ freeShipThreshold: threshold, deliveryDays: days }));
  showToast('Shipping rules saved!');
}

function renderShippingZones() {
  const container = document.getElementById('zonesContainer');
  if (!container) return;
  const zones = JSON.parse(localStorage.getItem('storeZones')) || [];
  container.innerHTML = zones.map((z, i) => `
    <div class="zone-row">
      <span class="zone-name">${z.name}</span>
      <input type="number" class="zone-price-input" value="${z.price}" min="0" placeholder="EGP">
    </div>
  `).join('');
}

function changePassword() {
  const cur = document.getElementById('curPass').value;
  const nw  = document.getElementById('newPass').value;
  if (!cur || !nw) { showToast('Fill both fields'); return; }
  const creds = getCredentials();
  if (cur !== creds.pass) { showToast('Current password incorrect'); return; }
  if (nw.length < 6)      { showToast('New password must be at least 6 characters'); return; }
  setConfig({ adminPass: nw });
  document.getElementById('curPass').value = '';
  document.getElementById('newPass').value = '';
  showToast('Password updated successfully!');
}
function saveWaNumber() {
  const num = document.getElementById('waNumber').value.trim();
  setConfig({ waNumber: num });
  showToast("WhatsApp configuration saved!");
}
// savePromoText merged into saveTweaks for combined marquee config save operations.
async function saveOrder() {
  const first_name = document.getElementById('oFirst').value.trim();
  const last_name = document.getElementById('oLast').value.trim();
  const phone = document.getElementById('oContact').value.trim();
  const email = document.getElementById('oEmail') ? document.getElementById('oEmail').value.trim() : '';
  const city = document.getElementById('oCity').value;
  const address = document.getElementById('oAddress').value.trim();
  const product_name = document.getElementById('oProduct').value;
  const size = document.getElementById('oSize').value;
  const payment_method = document.getElementById('oPayment').value;
  const subtotal = Number(document.getElementById('oSubtotal').value) || 0;
  const shipping_cost = Number(document.getElementById('oShipping').value) || 0;
  const status = document.getElementById('oStatus').value;
  const notes = document.getElementById('oNotes').value.trim();

  if (!first_name || !last_name || !phone || !address) {
    alert("First Name, Last Name, Phone, and Address are required!");
    return;
  }

  const newOrder = {
    first_name,
    last_name,
    phone,
    email,
    city,
    address,
    product_name,
    size,
    payment_method,
    subtotal,
    shipping_cost,
    status,
    notes
  };

  const res = await sbFetch('orders', 'POST', newOrder);
  if (res) {
    showToast("Order added successfully!");
    closeModal('orderModal');
    syncDashboardData();
  } else {
    // Local storage fallback for manual orders if database is down
    let globalOrders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    const localOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      customerName: first_name + " " + last_name,
      phone,
      email,
      city,
      address,
      itemPrice: subtotal,
      shippingFee: shipping_cost,
      total: subtotal + shipping_cost,
      status: status,
      date: new Date().toLocaleDateString() + " (" + size + " - " + payment_method + ")"
    };
    globalOrders.push(localOrder);
    localStorage.setItem('storeOrders', JSON.stringify(globalOrders));
    showToast("Logged locally (Offline Mode)!");
    closeModal('orderModal');
  }
}

function saveEmailJSConfig() {
  const serviceId = document.getElementById('emailjsServiceId').value.trim();
  const templateId = document.getElementById('emailjsTemplateId').value.trim();
  const key = document.getElementById('emailjsPublicKey').value.trim();
  
  setConfig({ 
    emailjsServiceId: serviceId, 
    emailjsTemplateId: templateId, 
    emailjsPublicKey: key 
  });
  showToast("EmailJS settings updated!");
}

let salesTrendChartInstance = null;
let sizePopularityChartInstance = null;

function renderAnalyticsCharts(orders) {
  if (typeof Chart === 'undefined') return;

  const activeOrders = orders.filter(o => o.status !== 'cancelled');

  const salesMap = {};
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    salesMap[dateStr] = 0;
  }
  
  activeOrders.forEach(o => {
    let dateStr = null;
    if (o.created_at) {
      dateStr = o.created_at.split('T')[0];
    } else if (o.date) {
      const parts = o.date.split(' ')[0].split('/');
      if (parts.length === 3) {
        const mm = String(parts[0]).padStart(2, '0');
        const dd = String(parts[1]).padStart(2, '0');
        const yyyy = parts[2];
        dateStr = `${yyyy}-${mm}-${dd}`;
      }
    }
    if (dateStr && salesMap[dateStr] !== undefined) {
      salesMap[dateStr] += (Number(o.subtotal) || 0);
    }
  });

  const salesLabels = Object.keys(salesMap).map(d => {
    const parts = d.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const salesData = Object.values(salesMap);

  const sizeMap = { 'S': 0, 'M': 0, 'L': 0, 'XL': 0 };
  activeOrders.forEach(o => {
    const sz = String(o.size).toUpperCase().trim();
    if (sizeMap[sz] !== undefined) {
      sizeMap[sz]++;
    }
  });
  const sizeLabels = Object.keys(sizeMap);
  const sizeData = Object.values(sizeMap);

  const salesCtx = document.getElementById('salesTrendChart');
  if (salesCtx) {
    if (salesTrendChartInstance) {
      salesTrendChartInstance.destroy();
    }
    salesTrendChartInstance = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: salesLabels,
        datasets: [{
          label: 'Revenue (EGP)',
          data: salesData,
          borderColor: '#c8ff00',
          backgroundColor: 'rgba(200, 255, 0, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#555', font: { size: 9, family: 'DM Mono' } }
          },
          y: {
            grid: { color: '#151515' },
            ticks: { color: '#555', font: { size: 9, family: 'DM Mono' } }
          }
        }
      }
    });
  }

  const sizeCtx = document.getElementById('sizePopularityChart');
  if (sizeCtx) {
    if (sizePopularityChartInstance) {
      sizePopularityChartInstance.destroy();
    }
    sizePopularityChartInstance = new Chart(sizeCtx, {
      type: 'bar',
      data: {
        labels: sizeLabels,
        datasets: [{
          data: sizeData,
          backgroundColor: ['rgba(255,255,255,0.08)', 'rgba(200, 255, 0, 0.4)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'],
          borderColor: ['rgba(255,255,255,0.2)', '#c8ff00', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'],
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#777', font: { size: 10, family: 'Syne', weight: 'bold' } }
          },
          y: {
            grid: { color: '#151515' },
            ticks: { color: '#555', font: { size: 9, family: 'DM Mono' }, precision: 0 }
          }
        }
      }
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN CONFIRM HELPER (inline, non-blocking)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function adminConfirm(message) {
  return new Promise(resolve => {
    // Create a minimal inline confirm toast
    const existing = document.getElementById('adminConfirmToast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'adminConfirmToast';
    el.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:99999;
      background:var(--surface);border:1px solid var(--border2);
      border-radius:var(--radius);padding:16px 20px;
      font-size:12px;color:var(--text);letter-spacing:.5px;
      box-shadow:0 4px 20px rgba(0,0,0,0.5);
      animation:fadeIn .2s ease; max-width:320px;
    `;
    el.innerHTML = `
      <div style="margin-bottom:12px;line-height:1.6;">${message}</div>
      <div style="display:flex;gap:10px;">
        <button id="acConfirm" style="flex:1;padding:8px;background:var(--accent);color:#080808;border:none;border-radius:var(--radius);font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:1px;cursor:pointer;">Confirm</button>
        <button id="acCancel"  style="flex:1;padding:8px;background:var(--surface2);color:var(--muted);border:1px solid var(--border2);border-radius:var(--radius);font-family:var(--font-display);font-size:11px;cursor:pointer;">Cancel</button>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelector('#acConfirm').onclick = () => { el.remove(); resolve(true);  };
    el.querySelector('#acCancel').onclick  = () => { el.remove(); resolve(false); };
  });
}

// --- PROMOTION STATISTICS & TWEAKS HANDLERS ---
function updatePromoPreviewStats() {
  const text = localStorage.getItem('mjr_promo_text') || '🔥 MAJARAH DROP 01 OUT NOW · FAST HOME DELIVERY ALL OVER EGYPT 🔥';
  const previewEl = document.getElementById('tweakPromoPreview');
  const wordCountEl = document.getElementById('tweakPromoWordCount');
  const charCountEl = document.getElementById('tweakPromoCharCount');
  
  if (previewEl) previewEl.innerText = text;
  
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  if (wordCountEl) wordCountEl.innerText = `${words} words`;
  if (charCountEl) charCountEl.innerText = `${text.length} characters`;
}

async function saveTweaks() {
  const text = document.getElementById('promoTextSetting').value.trim();
  const speed = document.getElementById('tweakPromoSpeed').value.trim();
  const repeats = document.getElementById('tweakPromoRepeats').value.trim();
  const showMarquee = document.getElementById('tweakShowMarquee').value;
  const showSignIn = document.getElementById('tweakShowSignIn').value;
  const showStars = document.getElementById('tweakShowStars').value;
  const showSizeCalc = document.getElementById('tweakShowSizeCalc').value;
  const showInstagram = document.getElementById('tweakShowInstagram').value;
  const showTiktok = document.getElementById('tweakShowTiktok').value;
  const showCoupons = document.getElementById('tweakShowCoupons').value;
  const couponCodes = document.getElementById('tweakCouponCodes').value.trim();
  const showCOD = document.getElementById('tweakShowCOD') ? document.getElementById('tweakShowCOD').value : 'true';
  const showApplePay = document.getElementById('tweakShowApplePay') ? document.getElementById('tweakShowApplePay').value : 'true';
  const showCard = document.getElementById('tweakShowCard') ? document.getElementById('tweakShowCard').value : 'true';
  
  // Pre-launch mode values
  const showPrelaunch = document.getElementById('tweakShowPrelaunch') ? document.getElementById('tweakShowPrelaunch').value : 'false';
  const prelaunchDate = document.getElementById('tweakPrelaunchDate') ? document.getElementById('tweakPrelaunchDate').value.trim() : '2026-07-01T20:00:00';
  const prelaunchPassword = document.getElementById('tweakPrelaunchPassword') ? document.getElementById('tweakPrelaunchPassword').value.trim() : 'majarah2026';
  
  if (!text || !speed || !repeats) {
    showToast("Please fill all promotion marquee configuration fields!", "error");
    return;
  }
  
  // Set in localStorage cache
  localStorage.setItem('mjr_promo_text', text);
  localStorage.setItem('mjr_promo_speed', speed);
  localStorage.setItem('mjr_promo_repeats', repeats);
  localStorage.setItem('mjr_show_marquee', showMarquee);
  localStorage.setItem('mjr_show_signin', showSignIn);
  localStorage.setItem('mjr_show_stars', showStars);
  localStorage.setItem('mjr_show_size_calc', showSizeCalc);
  localStorage.setItem('mjr_show_instagram', showInstagram);
  localStorage.setItem('mjr_show_tiktok', showTiktok);
  localStorage.setItem('mjr_show_coupons', showCoupons);
  localStorage.setItem('mjr_coupon_codes', couponCodes);
  localStorage.setItem('mjr_show_cod', showCOD);
  localStorage.setItem('mjr_show_apple_pay', showApplePay);
  localStorage.setItem('mjr_show_card', showCard);
  
  // Pre-launch mode set in cache
  localStorage.setItem('mjr_show_prelaunch', showPrelaunch);
  localStorage.setItem('mjr_prelaunch_date', prelaunchDate);
  localStorage.setItem('mjr_prelaunch_password', prelaunchPassword);
  
  const settingsList = [
    { key: 'promo_text', value: text },
    { key: 'promo_speed', value: speed },
    { key: 'promo_repeats', value: repeats },
    { key: 'show_marquee', value: showMarquee },
    { key: 'show_signin', value: showSignIn },
    { key: 'show_stars', value: showStars },
    { key: 'show_size_calc', value: showSizeCalc },
    { key: 'show_instagram', value: showInstagram },
    { key: 'show_tiktok', value: showTiktok },
    { key: 'show_coupons', value: showCoupons },
    { key: 'coupon_codes', value: couponCodes },
    { key: 'show_cod', value: showCOD },
    { key: 'show_apple_pay', value: showApplePay },
    { key: 'show_card', value: showCard },
    { key: 'show_prelaunch', value: showPrelaunch },
    { key: 'prelaunch_date', value: prelaunchDate },
    { key: 'prelaunch_password', value: prelaunchPassword }
  ];
  
  let successCount = 0;
  
  if (SB_URL && SB_KEY) {
    try {
      const baseUrl = SB_URL.replace(/\/+$/, "");
      
      for (const item of settingsList) {
        // Try PATCH first
        const patchRes = await fetch(`${baseUrl}/rest/v1/settings?key=eq.${item.key}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ value: item.value })
        });
        
        let saved = false;
        if (patchRes.ok) {
          const patchData = await patchRes.json();
          if (patchData && patchData.length > 0) {
            saved = true;
          }
        }
        
        if (!saved) {
          // POST if key doesn't exist
          const postRes = await fetch(`${baseUrl}/rest/v1/settings`, {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': `Bearer ${SB_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: item.key, value: item.value })
          });
          if (postRes.ok) saved = true;
        }
        
        if (saved) successCount++;
      }
    } catch(e) {
      console.error("Database settings saving failed:", e);
    }
  }
  
  if (SB_URL && SB_KEY && successCount === settingsList.length) {
    showToast("Configurations saved and synced to database!");
  } else {
    showToast("Configurations saved locally!");
  }
  
  updatePromoPreviewStats();
}

function exportPrelaunchEmailsCSV() {
  const emailsText = document.getElementById('tweakPrelaunchEmails').value.trim();
  if (!emailsText) {
    showToast("No emails available to export!", "error");
    return;
  }
  const emails = emailsText.split('\n').filter(e => e.trim().length > 0);
  let csvContent = "data:text/csv;charset=utf-8,Email\n" + emails.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "majarah_prelaunch_emails.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV Exported successfully!", "success");
}

async function clearPrelaunchEmails() {
  if (!confirm("Are you sure you want to permanently clear the pre-launch registered email list? This action cannot be undone.")) {
    return;
  }
  
  localStorage.setItem('mjr_prelaunch_emails', '[]');
  const textarea = document.getElementById('tweakPrelaunchEmails');
  if (textarea) textarea.value = '';
  
  if (SB_URL && SB_KEY) {
    try {
      const baseUrl = SB_URL.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/rest/v1/settings?key=eq.prelaunch_emails`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: '[]' })
      });
      if (res.ok) {
        showToast("Pre-launch email list cleared in database!", "success");
      } else {
        showToast("Cleared locally, but database failed to update.", "warning");
      }
    } catch(e) {
      console.error(e);
      showToast("Cleared locally, but failed to connect to database.", "warning");
    }
  } else {
    showToast("Cleared locally. Supabase connection not configured.", "warning");
  }
}

// Initialise shipping zones panel on page load when relevant
document.addEventListener('DOMContentLoaded', () => {
  // Render shipping zones if localStorage has them already
  setTimeout(renderShippingZones, 500);
  // Load shipping rules
  const rules = JSON.parse(localStorage.getItem('storeShippingRules')) || {};
  if (rules.freeShipThreshold !== undefined && document.getElementById('freeShipThreshold')) {
    document.getElementById('freeShipThreshold').value = rules.freeShipThreshold;
  }
  if (rules.deliveryDays && document.getElementById('deliveryDays')) {
    document.getElementById('deliveryDays').value = rules.deliveryDays;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOBILE PREVIEW SIMULATOR CONTROLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let currentSimPage = '../index.html';
let currentSimOrientation = 'portrait';
let currentSimDevice = 'iphone12';

function openMobileSimulator(pageName) {
  currentSimPage = pageName || '../index.html';
  document.getElementById('simulatorModal').classList.add('open');
  
  // Set active buttons
  updateSimulatorControlsUI();
  
  // Load iframe src
  const iframe = document.getElementById('simIframe');
  iframe.src = `./${currentSimPage}`;
  
  // Update live clock
  updateSimulatorClock();
  
  // Update active select value
  document.getElementById('simDeviceSelect').value = currentSimDevice;
  
  // Initial frame dimensions
  applySimulatorDimensions();
}

function updateSimulatorClock() {
  const timeEl = document.getElementById('simTime');
  if (!timeEl) return;
  const now = new Date();
  const hr = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  timeEl.textContent = `${hr}:${min}`;
}

function switchSimulatorPage(pageName) {
  currentSimPage = pageName;
  const iframe = document.getElementById('simIframe');
  iframe.src = `./${currentSimPage}`;
  updateSimulatorControlsUI();
}

function setSimulatorOrientation(orient) {
  currentSimOrientation = orient;
  const wrapper = document.getElementById('simPhoneWrapper');
  
  if (orient === 'landscape') {
    wrapper.classList.add('landscape');
  } else {
    wrapper.classList.remove('landscape');
  }
  
  applySimulatorDimensions();
  updateSimulatorControlsUI();
}

function setSimulatorDevice(device) {
  currentSimDevice = device;
  applySimulatorDimensions();
}

function applySimulatorDimensions() {
  const wrapper = document.getElementById('simPhoneWrapper');
  const isLandscape = currentSimOrientation === 'landscape';
  
  let w = 390;
  let h = 680;
  
  if (currentSimDevice === 'small') {
    w = 360;
    h = 600;
  } else if (currentSimDevice === 'tablet') {
    w = 768;
    h = 900;
  }
  
  if (isLandscape) {
    wrapper.style.width = `${h}px`;
    wrapper.style.height = `${w}px`;
  } else {
    wrapper.style.width = `${w}px`;
    wrapper.style.height = `${h}px`;
  }
}

function reloadSimulatorFrame() {
  const iframe = document.getElementById('simIframe');
  iframe.contentWindow.location.reload();
}

function updateSimulatorControlsUI() {
  // Page buttons
  document.getElementById('simPageStorefront').classList.toggle('sim-btn-active', currentSimPage === '../index.html');
  document.getElementById('simPageAdmin').classList.toggle('sim-btn-active', currentSimPage === './index.html');
  
  // Orientation buttons
  document.getElementById('simOrientPortrait').classList.toggle('sim-btn-active', currentSimOrientation === 'portrait');
  document.getElementById('simOrientLandscape').classList.toggle('sim-btn-active', currentSimOrientation === 'landscape');
}

// Initialise clock updater
setInterval(updateSimulatorClock, 30000);