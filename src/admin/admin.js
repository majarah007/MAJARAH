window.SB_URL = "https://nojnqefgbpyibuhduxdx.supabase.co";
// Normalize SB_URL: remove trailing slashes and /rest/v1 if present to avoid "Double REST" URL errors
if (window.SB_URL) {
    window.SB_URL = window.SB_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

// XSS Protection: Escape dynamic content
const escapeHTML = (str) => {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

// ── GLOBAL CONFIGURATION — sync with Supabase ──
window.ADMIN_CONFIG = {};

// --- PERFORMANCE UTILITIES ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ── GLOBAL STATE ──
window.storeOrders = [];
window.storeProducts = [];
window.storeInventory = [];
let lastOrdersHash = "";
let lastProductsHash = "";
let lastInventoryHash = "";

// Show toast notification
window.showToast = function(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) {
    console.log(`[Toast] ${type.toUpperCase()}: ${msg}`);
    return;
  }
  t.innerText = msg;
  t.className = 'show' + (type ? ' toast-' + type : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

const CONFIG_KEYS = [
    'promoText', 'promoVisible', 'promoSpeed', 'promoRepeats',
    'showPrelaunch', 'prelaunchDate', 'bypassPassword',
    'drop2TeaserVisible', 'drop2TeaserDate', 'drop2TeaserTitle',
    'drop2TeaserDesc', 'drop2TeaserBadge', 'drop2Product1Name',
    'drop2Product1Image', 'drop2Product2Name', 'drop2Product2Image',
    'showSignIn', 'instagramVisible', 'tiktokVisible', 'showSizeCalc',
    'showStars', 'showCoupons', 'coupons', 'paymentCOD', 'paymentApplePay', 'paymentCard',
    'shippingRates', 'translations', 'waNumber'
];

function loadLocalAdminConfig() {
    CONFIG_KEYS.forEach(k => {
        const val = localStorage.getItem(`mjr_${k}`);
        if (val !== null) {
            try {
                window.ADMIN_CONFIG[k] = JSON.parse(val);
            } catch(e) {
                window.ADMIN_CONFIG[k] = val;
            }
        }
    });
}
loadLocalAdminConfig();

async function loadAdminConfig() {
    try {
        const res = await fetch(`/api/proxy?table=site_config&id=eq.1&select=config&t=${Date.now()}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data[0] && data[0].config) {
                // Database is the absolute truth — replace local config
                window.ADMIN_CONFIG = data[0].config;
                
                // Sync to localStorage for next time
                Object.keys(window.ADMIN_CONFIG).forEach(k => {
                    if (CONFIG_KEYS.includes(k)) {
                        localStorage.setItem(`mjr_${k}`, JSON.stringify(window.ADMIN_CONFIG[k]));
                    }
                });
                
                // Re-populate inputs if we are on a config-heavy page
                const activePage = document.querySelector('.page.active');
                if (activePage && (activePage.id === 'page-tweaks' || activePage.id === 'page-settings')) {
                    populateTweaksFromConfig();
                }
            }
        }
    } catch (e) { console.error("Config fetch failed:", e); }
}

function populateTweaksFromConfig() {
    const cfg = (key, fallback) => window.ADMIN_CONFIG[key] !== undefined ? window.ADMIN_CONFIG[key] : fallback;
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    // Marquee
    setVal('promoTextSetting', cfg('promoText', '🔥 MAJARAH 01DROP 🔥'));
    setVal('tweakPromoSpeed', cfg('promoSpeed', '80'));
    setVal('tweakPromoRepeats', cfg('promoRepeats', '12'));
    setVal('tweakShowMarquee', String(cfg('promoVisible', true)));
    
    // Feature Toggles
    setVal('tweakShowSignIn', String(cfg('showSignIn', true)));
    setVal('tweakShowStars', String(cfg('showStars', true)));
    setVal('tweakShowSizeCalc', String(cfg('showSizeCalc', true)));
    setVal('tweakShowInstagram', String(cfg('instagramVisible', true)));
    setVal('tweakShowTiktok', String(cfg('tiktokVisible', true)));
    setVal('tweakShowCoupons', String(cfg('showCoupons', true)));
    
    const couponCodesInput = document.getElementById('tweakCouponCodes');
    if (couponCodesInput) {
        const coupons = cfg('coupons', {});
        couponCodesInput.value = Object.entries(coupons).map(([k,v]) => `${k}:${v}`).join(',');
    }
    
    // Payment
    setVal('tweakShowCOD', String(cfg('paymentCOD', true)));
    setVal('tweakShowApplePay', String(cfg('paymentApplePay', false)));
    setVal('tweakShowCard', String(cfg('paymentCard', false)));
    
    // Prelaunch
    setVal('tweakShowPrelaunch', String(cfg('showPrelaunch', false)));
    setVal('waNumber', cfg('waNumber', '201229067066'));
    setVal('tweakPrelaunchDate', cfg('prelaunchDate', '2026-07-01T20:00:00'));
    setVal('tweakPrelaunchPassword', cfg('bypassPassword', 'majarah2026'));
    
    // Teaser
    setVal('tweakShowTeaser', String(cfg('drop2TeaserVisible', false)));
    setVal('tweakTeaserDate', cfg('drop2TeaserDate', '2026-07-15T20:00:00'));
    setVal('tweakTeaserBadge', cfg('drop2TeaserBadge', 'TEASER / DROP 02'));
    setVal('tweakTeaserTitle', cfg('drop2TeaserTitle', 'ECLIPSE COLLECTION'));
    setVal('tweakTeaserDesc', cfg('drop2TeaserDesc', ''));
    setVal('tweakTeaserName1', cfg('drop2Product1Name', ''));
    setVal('tweakTeaserImage1', cfg('drop2Product1Image', ''));
    setVal('tweakTeaserName2', cfg('drop2Product2Name', ''));
    setVal('tweakTeaserImage2', cfg('drop2Product2Image', ''));
}

async function saveConfigToSupabase(partialConfig, secondArg) {
  if (!SB_URL || !SB_KEY) {
    showToast('Supabase not connected. Check credentials.', 'error');
    return;
  }
  
  const token = localStorage.getItem('mjr_admin_token') || '';

  // Support both (partialObj) and (key, value) signatures
  let updateObj = partialConfig;
  if (typeof partialConfig === 'string') {
      updateObj = { [partialConfig]: secondArg };
  }
  
  try {
      // 1. Fetch current full config from proxy
      const getRes = await fetch(`/api/proxy?table=site_config&id=eq.1&select=config&t=${Date.now()}`, {
        headers: { 
            'Authorization': `Bearer ${token}`
        }
      });
      
      let existing = {};
      let hasRow = false;
      if (getRes.ok) {
          const data = await getRes.json();
          if (Array.isArray(data) && data.length > 0) {
              existing = data[0].config || {};
              hasRow = true;
          }
      } else {
          // If we can't even GET the current config, STOP to prevent data loss!
          throw new Error('Could not verify current configuration status.');
      }
      
      // 2. Merge existing config with partial changes
      const merged = { ...existing, ...updateObj };
      
      // 3. Upsert the row (POST with resolution=merge-duplicates)
      // This is safer than PATCH because it handles the row-not-found case
      const upsertRes = await fetch(`/api/proxy?table=site_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id: 1, config: merged, updated_at: new Date().toISOString() })
      });
      
      if (upsertRes.ok) {
        window.ADMIN_CONFIG = merged; 
        showToast('Saved globally ✓ — all devices will see this change', 'success');
      } else {
        const err = await upsertRes.text();
        showToast('Save failed: ' + err, 'error');
      }
  } catch(e) {
      console.error('Configuration Sync Error:', e);
      showToast('Sync failed: ' + e.message, 'error');
  }
}

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

      <!-- Relocated Teaser Section -->
      <div class="settings-card" style="margin-top: 32px;">
          <h3>👀 Drop Teaser</h3>
          <p style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.6;">Configure a blurred/blacked-out teaser grid with two products and a countdown release timer.</p>
          <div class="field-row">
            <div class="field-group">
              <label>Teaser Section Status</label>
              <select id="tweakShowTeaser" style="width:100%;">
                <option value="true">Active (Visible on Storefront)</option>
                <option value="false" selected>Hidden (Disabled)</option>
              </select>
            </div>
            <div class="field-group" style="flex:2;">
              <label>Target Release Date &amp; Time (ISO Format)</label>
              <input type="text" id="tweakTeaserDate" placeholder="e.g. 2026-07-15T20:00:00" style="width:100%;">
            </div>
          </div>
          
          <div class="field-row" style="margin-top:15px; background: rgba(200,255,0,0.02); padding: 15px; border-radius: 6px; border: 1px solid rgba(200,255,0,0.05);">
            <div class="field-group">
              <label>Blur Intensity (px)</label>
              <input type="number" id="tweakTeaserBlur" value="12" min="0" max="40" style="width:100%;">
              <p style="font-size:9px; color:var(--muted); margin-top:4px;">Recommended: 8-16px</p>
            </div>
            <div class="field-group" style="flex:2;">
              <label>Blackness Level (Brightness)</label>
              <div style="display:flex; align-items:center; gap:10px;">
                <input type="range" id="tweakTeaserBrightness" min="0" max="1" step="0.05" value="0.15" style="flex:1; accent-color: var(--accent);">
                <span id="brightnessVal" style="font-family: 'DM Mono', monospace; font-size:11px; min-width:30px;">0.15</span>
              </div>
              <p style="font-size:9px; color:var(--muted); margin-top:4px;">0 = Total Black, 1 = Full Visibility</p>
            </div>
          </div>

          <div class="field-row" style="margin-top:10px;">
            <div class="field-group">
              <label>Header Badge / Tag</label>
              <input type="text" id="tweakTeaserBadge" placeholder="e.g. TEASER / DROP 02" style="width:100%;">
            </div>
            <div class="field-group" style="flex:2;">
              <label>Header Title (Section Name)</label>
              <input type="text" id="tweakTeaserTitle" placeholder="e.g. ECLIPSE COLLECTION" style="width:100%;">
            </div>
          </div>
          <div class="field-group" style="margin-top:10px;">
            <label>Header Description</label>
            <input type="text" id="tweakTeaserDesc" placeholder="e.g. The next evolution of identity architecture. Pre-register to secure access." style="width:100%;">
          </div>
          <div style="border-top:1px solid #1a1a1a;margin-top:15px;padding-top:15px;">
            <h4 style="font-size:12px;color:#fff;margin-bottom:10px;">👕 Teaser Product 1 (Shirt)</h4>
            <div class="field-row">
              <div class="field-group"><label>Product 1 Name</label><input type="text" id="tweakTeaserName1" placeholder="e.g. ECLIPSE SHIRT" style="width:100%;"></div>
              <div class="field-group" style="flex:2;">
                <label>Product 1 Image URL</label>
                <div style="display:flex;gap:6px;align-items:center;">
                  <input type="text" id="tweakTeaserImage1" placeholder="e.g. blackinfront.jpg" style="flex:1;" onchange="updateImagePreview('tweakTeaserImage1','tweakTeaserImage1Preview')">
                  <button class="btn btn-sm btn-ghost" onclick="triggerFileUpload('tweakTeaserImage1File')" style="padding:0 10px;font-size:11px;height:38px;">Upload</button>
                </div>
                <input type="file" id="tweakTeaserImage1File" accept="image/*" style="display:none;" onchange="handleFileSelect(this,'tweakTeaserImage1','tweakTeaserImage1Preview')">
                <div id="tweakTeaserImage1Preview" style="margin-top:6px;display:none;align-items:center;gap:8px;">
                  <img src="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">
                  <span style="font-size:11px;color:var(--muted);">Preview</span>
                </div>
              </div>
            </div>
          </div>
          <div style="border-top:1px solid #1a1a1a;margin-top:15px;padding-top:15px;">
            <h4 style="font-size:12px;color:#fff;margin-bottom:10px;">🩳 Teaser Product 2 (Shorts)</h4>
            <div class="field-row">
              <div class="field-group"><label>Product 2 Name</label><input type="text" id="tweakTeaserName2" placeholder="e.g. ECLIPSE SHORTS" style="width:100%;"></div>
              <div class="field-group" style="flex:2;">
                <label>Product 2 Image URL</label>
                <div style="display:flex;gap:6px;align-items:center;">
                  <input type="text" id="tweakTeaserImage2" placeholder="e.g. whiteinfront.jpg" style="flex:1;" onchange="updateImagePreview('tweakTeaserImage2','tweakTeaserImage2Preview')">
                  <button class="btn btn-sm btn-ghost" onclick="triggerFileUpload('tweakTeaserImage2File')" style="padding:0 10px;font-size:11px;height:38px;">Upload</button>
                </div>
                <input type="file" id="tweakTeaserImage2File" accept="image/*" style="display:none;" onchange="handleFileSelect(this,'tweakTeaserImage2','tweakTeaserImage2Preview')">
                <div id="tweakTeaserImage2Preview" style="margin-top:6px;display:none;align-items:center;gap:8px;">
                  <img src="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">
                  <span style="font-size:11px;color:var(--muted);">Preview</span>
                </div>
              </div>
            </div>
          </div>
          <button class="btn btn-accent btn-sm" onclick="saveTweaks()" style="margin-top:20px;width:100%;padding:12px;">Save Teaser Configuration</button>
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

    <div class="page" id="page-translations">
      <div class="page-header"><h1>Translations</h1><p>Edit English and Arabic labels</p></div>
      <div class="table-card" style="padding: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-weight: bold; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
          <div>Key</div>
          <div>English</div>
          <div>Arabic</div>
        </div>
        <div id="translationsList" style="max-height: 600px; overflow-y: auto; padding-top: 10px;">
          <!-- dynamically populated -->
        </div>
        <div style="margin-top: 20px;">
          <button class="btn btn-accent" onclick="saveTranslations()">💾 Save All Translations</button>
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
          <h3>📧 Email Receipts Setup</h3>
          <p style="font-size:11px;color:var(--muted);margin-bottom:12px;line-height:1.5;">
            <strong>Brevo (Sendinblue):</strong> Configured securely on the server via Vercel environment variables (<code style="color:var(--green)">BREVO_API_KEY</code>, <code style="color:var(--green)">BREVO_SENDER_EMAIL</code>). No keys needed here.
          </p>
          <div style="border-top:1px solid #1a1a1a;margin-top:10px;padding-top:10px;">
            <p style="font-size:11px;color:var(--muted);margin-bottom:8px;"><strong>EmailJS (Fallback):</strong> Configure client-side EmailJS here if needed.</p>
            <div class="field-group"><label>Service ID</label><input type="text" id="emailjsServiceId" placeholder="e.g. service_xxxx"></div>
            <div class="field-group"><label>Template ID</label><input type="text" id="emailjsTemplateId" placeholder="e.g. template_xxxx"></div>
            <div class="field-group"><label>Public Key</label><input type="text" id="emailjsPublicKey" placeholder="e.g. pk_xxxx"></div>
            <button class="btn btn-accent btn-sm" onclick="saveEmailJSConfig()">Save EmailJS Config</button>
          </div>
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

<div class="modal-overlay" id="configCopyModal">
  <div class="modal" style="max-width: 600px; padding: 25px;">
    <button class="modal-x" onclick="closeModal('configCopyModal')">✕</button>
    <h2>Save Configurations</h2>
    <div class="modal-sub">Deploy settings to Vercel via config.json</div>
    <p style="font-size: 11px; line-height: 1.6; color: var(--muted); margin: 12px 0;">
      All store configurations (marquee, pre-launch, teaser, payment gates, and shipping rates) are now served globally from a CDN-hosted file. Follow these steps to apply your changes:
    </p>
    <ol style="font-size: 11px; line-height: 1.8; color: var(--muted); padding-left: 20px; margin-bottom: 15px;">
      <li>Click <strong>"Copy JSON Content"</strong> below to copy the generated configuration.</li>
      <li>Open your local project directory and paste it into the <code>config.json</code> file at the root.</li>
      <li>Commit the file and push it to GitHub/Gitlab to trigger a Vercel CDN rebuild and deploy.</li>
    </ol>
    <textarea id="configCopyTextarea" readonly style="width: 100%; height: 180px; font-family: monospace; font-size: 11px; background: #0c0c0c; border: 1px solid var(--border); color: #888; padding: 10px; border-radius: 4px; resize: vertical; margin-bottom: 15px; outline: none;"></textarea>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-accent" onclick="copyConfigJsonText()">📋 Copy JSON Content</button>
      <button class="btn btn-ghost" onclick="closeModal('configCopyModal')">Close</button>
    </div>
  </div>
</div>
`;
}

async function doLogin() {
  const userEl = document.getElementById('mjrLoginUser');
  const passEl = document.getElementById('mjrLoginPass');
  const btn = document.querySelector('.login-btn');
  const errEl = document.getElementById('loginErr');
  
  if (!userEl || !passEl) {
      console.error("Critical: Login elements mjrLoginUser or mjrLoginPass not found in DOM.");
      return;
  }
  if (errEl) errEl.style.display = 'none';
  
  const email = userEl.value.trim();
  const password = passEl.value.trim();
  
  console.log(`[Auth] Attempting login for identifier: "${email}" (length: ${email.length})`);
  
  if (!email || !password) {
    console.warn("[Auth] Validation failed: Email or password field is empty.");
    showToast('Please enter both username and password.', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Authenticating...';
  
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('mjr_admin_token', data.token);
      localStorage.setItem('mjr_admin_user', email);
      console.log("[Auth] Success. Token received.");
      showDashboard();
      showToast('Welcome back, ' + email);
    } else {
      const data = await res.json().catch(() => ({ error: 'Unknown server error' }));
      const errMsg = data.error || 'Login failed.';
      console.error(`[Auth] Failed: ${errMsg}`);
      if (errEl) {
          errEl.textContent = errMsg;
          errEl.style.display = 'block';
      }
      showToast(errMsg, 'error');
    }
  } catch (e) {
    console.error("[Auth] Exception during fetch:", e);
    showToast('Connection error. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enter Dashboard';
  }
}

async function logout() {
  localStorage.removeItem('mjr_admin_token');
  const app = document.getElementById('app');
  if (app) {
    app.style.display = 'none';
    app.innerHTML = '';
  }
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'flex';
  
  const passInp = document.getElementById('loginPass');
  const userInp = document.getElementById('loginUser');
  if (passInp) passInp.value = '';
  if (userInp) userInp.value = '';
  stopAutoSync();
}

async function showDashboard() {
  const loginScreen = document.getElementById('loginScreen');
  const appEl = document.getElementById('app');
  if (loginScreen) loginScreen.style.display = 'none';
  if (appEl) appEl.style.display = 'block';

  window.renderDashboard();
  await window.initSupabase();
  await window.initializeTweaks();
  await window.syncDashboardData();
  
  if (window.startAutoSync) window.startAutoSync();
  if (window.requestNotificationPermission) window.requestNotificationPermission();
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
    pass: c.adminPass || '' 
  };
}

// Helper utility to pause execution to prevent race conditions during DB indexing
const sleep = ms => new Promise(res => setTimeout(res, ms));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE CLIENT (minimal fetch-based integration)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let SB_URL = '', SB_KEY = '';

async function initSupabase() {
  const c = getConfig();
  
  // Only use hardcoded defaults if no user-saved configuration exists
  if (!c.sbUrl && window.SB_URL && window.SB_URL.indexOf("PLACEHOLDER") === -1) {
    c.sbUrl = window.SB_URL;
    c.sbKey = window.SB_KEY;
    setConfig({ sbUrl: c.sbUrl, sbKey: c.sbKey });
  }

  SB_URL = c.sbUrl || '';
  SB_KEY = c.sbKey || '';
  
  document.getElementById('setupBanner').style.display = 'none';

  // Load Global Config from Supabase
  await loadAdminConfig();

  // Shipping
  const rates = window.ADMIN_CONFIG.shippingRates || {};
  if (rates && Object.keys(rates).length > 0) {
      localStorage.setItem('storeZones', JSON.stringify(Object.keys(rates).map(k => ({ name: k, price: rates[k] }))));
      renderShippingZones();
  }

  updatePromoPreviewStats();
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
      if (res.status === 401) {
          showToast('Session expired. Please log in again.', 'error');
          logout();
      }
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("Database communication down:", e);
    return null;
  }
}

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

let syncIntervalId = null;

function startAutoSync() {
  if (syncIntervalId) clearInterval(syncIntervalId);
  // Poll every 10 seconds for new orders or updates
  syncIntervalId = setInterval(() => {
    if (localStorage.getItem('mjr_admin_token')) {
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA SYNC & DISPLAY ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let lastDataHash = "";

async function syncDashboardData(isBackground = false) {
  console.log("Syncing database tables...");
  
  // 1. Fetch live tables from Supabase
  const orders = await sbFetch('orders', 'GET', null, '?select=*&order=id.desc');
  const products = await sbFetch('products', 'GET', null, '?select=*&order=name.asc');
  const inventory = await sbFetch('inventory', 'GET', null, '?select=*');
  
  // Performance: Dirty check to avoid redundant re-renders
  const currentHash = JSON.stringify({ orders, products, inventory });
  if (currentHash === lastDataHash) {
    console.log("No data changes detected. Skipping re-render.");
    return;
  }
  lastDataHash = currentHash;

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
      <td data-label="Customer">${escapeHTML(o.first_name || '')} ${escapeHTML(o.last_name || '')}</td>
      <td data-label="Product">${escapeHTML(o.product_name || 'Item')}</td>
      <td class="mono" data-label="Size">${escapeHTML(o.size || '—')}</td>
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
          <div style="font-weight:600; cursor:pointer;" onclick="navigator.clipboard.writeText('${escapeHTML((o.first_name || '') + ' ' + (o.last_name || ''))}') ; showToast('Copied Name!')" title="Click to copy Name">${escapeHTML(o.first_name || '')} ${escapeHTML(o.last_name || '')}</div>
          <div style="font-size:11px;color:var(--muted);">${escapeHTML(o.email || '')}</div>
          ${addressDisplayHTML}
        </td>
        <td class="mono" data-label="Contact">
          <div style="cursor:pointer; font-weight:600;" onclick="navigator.clipboard.writeText('${escapeHTML(o.phone || '')}') ; showToast('Copied Phone!')" title="Click to copy Phone">${escapeHTML(o.phone || '—')}</div>
          <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); sendWhatsAppConfirmation('${o.id}')" style="margin-top:6px; display:inline-block; border-color:rgba(37, 211, 102, 0.3); color:#25d366; font-size:9px; padding:2px 6px;" title="Confirm via WhatsApp">
            💬 Confirm (WA)
          </button>
        </td>
        <td data-label="Product">
          <div>${escapeHTML(o.product_name || '—')}</div>
          ${refundInfo}
        </td>
        <td class="mono" data-label="Size">${escapeHTML(o.size || '—')}</td>
        <td data-label="City">${escapeHTML(o.city || '—')}</td>
        <td class="mono" data-label="Payment">${escapeHTML(o.payment_method || 'COD')}</td>
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
const TRANSLATION_KEYS = ['collection', 'signin', 'hero_sub', 'explore', 'universe_within', 'universe_tagline', 'tap_explore', 'company', 'about_us', 'contact_us', 'get_help', 'track_order', 'refund_ex', 'how_to_order', 'privacy', 'sizing', 'sizing_chart', 'size_calculator', 'care_guide', 'washing', 'garment_care', 'delivery_banner', 'buy_now', 'select_size', 'size_guide_btn', 'size_calculator_btn', 'contact', 'delivery_address', 'payment_method', 'cod', 'card', 'confirm_order', 'cancel', 'subtotal', 'shipping', 'total', 'back', 'back_to_search', 'find_order', 'track_refund_title', 'track_refund_sub', 'order_id_lbl', 'phone_lbl', 'how_title', 'how_sub', 'brand_title', 'brand_sub', 'size_recommend_title', 'size_recommend_sub', 'height', 'weight', 'fit_pref', 'fit_oversized', 'fit_regular', 'fit_snug', 'suggested_size_title', 'apply_size_btn', 'washing_title', 'washing_sub', 'garment_title', 'garment_sub', 'badge_local', 'badge_wallet', 'coupon_code_lbl', 'apply_btn', 'days_label', 'hours_label', 'mins_label', 'secs_label', 'tracker_modal_sub', 'measurements_cm'];

function loadTranslationsPanel() {
  const container = document.getElementById('translationsList');
  if (!container) return;
  
  const translations = window.ADMIN_CONFIG.translations || { en: {}, ar: {} };
  
  container.innerHTML = TRANSLATION_KEYS.map(key => `
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; align-items: center;">
      <div style="font-size: 11px; color: var(--muted);">${key}</div>
      <input class="search-bar trans-en" data-key="${key}" value="${translations.en ? (translations.en[key] || '') : ''}" style="width: 100%;">
      <input class="search-bar trans-ar" data-key="${key}" value="${translations.ar ? (translations.ar[key] || '') : ''}" placeholder="same as EN" dir="rtl" style="width: 100%;">
    </div>
  `).join('');
}

async function saveTranslations() {
  const enInputs = document.querySelectorAll('.trans-en');
  const arInputs = document.querySelectorAll('.trans-ar');
  const translations = { en: {}, ar: {} };
  
  enInputs.forEach(inp => {
    const key = inp.getAttribute('data-key');
    translations.en[key] = inp.value.trim();
  });
  
  arInputs.forEach(inp => {
    const key = inp.getAttribute('data-key');
    translations.ar[key] = inp.value.trim();
  });
  
  await saveConfigToSupabase({ translations });
}

async function showPage(pageId, element) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if(targetPage) targetPage.classList.add('active');
  
  // Refresh UI from latest config when switching to relevant pages
  if (['tweaks', 'shipping', 'settings', 'translations'].includes(pageId)) {
    showToast(`Syncing ${pageId}...`);
    await initSupabase(); 
  }
  
  if (pageId === 'translations') {
    loadTranslationsPanel();
  }
  
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

async function showMobilePage(pageId, element) {
  await showPage(pageId);
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
  targetInput.placeholder = 'Optimizing for 4K Quality...';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const maxDim = 2000; // Increased to 2000px for better quality
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
      
      // Safety: Clear canvas and ensure entire image is drawn
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Higher quality JPEG compression (0.92)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      targetInput.value = dataUrl;
      targetInput.placeholder = originalPlaceholder;
      updateImagePreview(targetId, previewId);
      
      showToast('High-quality image ready!');
      input.value = ''; 
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateImagePreview(inputId, previewId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  const val = inputEl.value.trim();
  const previewDiv = document.getElementById(previewId);
  if (!previewDiv) return;
  
  if (val) {
    const imgSrc = (val.startsWith('http') || val.startsWith('data:')) ? val : `./${val}`;
    const imgEl = previewDiv.querySelector('img');
    if (imgEl) {
        imgEl.src = imgSrc;
        // Use contain to avoid "cutting" the photo in the admin UI
        imgEl.style.objectFit = 'contain';
        imgEl.style.background = '#0a0a0a';
    }
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

window.filterOrders = debounce(function(status, el) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  
  if (status === 'all') {
    renderOrdersTable(window.storeOrders);
  } else {
    const filtered = window.storeOrders.filter(o => o.status === status);
    renderOrdersTable(filtered);
  }
}, 150);

window.searchOrders = debounce(function(val) {
  const term = val.toLowerCase().trim();
  const filtered = window.storeOrders.filter(o => 
    (o.first_name && o.first_name.toLowerCase().includes(term)) ||
    (o.last_name && o.last_name.toLowerCase().includes(term)) ||
    (o.phone && o.phone.includes(term))
  );
  renderOrdersTable(filtered);
}, 300);

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
  const updates = [];
  
  showToast("Analyzing inventory changes...");
  
  for (let input of inputs) {
    const productId = Number(input.getAttribute('data-product-id'));
    const size = input.getAttribute('data-size');
    const stock = Number(input.value) || 0;
    
    const existing = storeInventory.find(i => Number(i.product_id) === productId && i.size === size);
    
    // Skip if unchanged
    if (existing && Number(existing.stock) === stock) continue;
    if (!existing && stock === 0) continue;

    if (existing) {
      updates.push(sbFetch('inventory', 'PATCH', { stock }, null, existing.id));
    } else {
      updates.push(sbFetch('inventory', 'POST', { product_id: productId, size, stock }));
    }
  }
  
  if (updates.length === 0) {
    showToast("No changes detected.");
    return;
  }

  showToast(`Saving ${updates.length} changes...`);
  
  try {
    await Promise.all(updates);
    showToast("Inventory updated successfully!");
  } catch (err) {
    console.error("Error saving inventory:", err);
    showToast("Failed to save some inventory items.");
  }
  syncDashboardData();
}
async function saveShipping() {
  const zoneInputs = document.querySelectorAll('.zone-price-input');
  const zones = JSON.parse(localStorage.getItem('storeZones')) || [];
  const shippingRates = {};
  
  zoneInputs.forEach((inp, i) => {
    if (zones[i]) {
        zones[i].price = Number(inp.value) || 0;
        shippingRates[zones[i].name] = zones[i].price;
    }
  });
  
  localStorage.setItem('storeZones', JSON.stringify(zones));
  await saveConfigToSupabase('shippingRates', shippingRates);
  showToast("Shipping rates updated!");
}

async function saveShippingRules() {
  const threshold = Number(document.getElementById('freeShipThreshold').value) || 0;
  const days = document.getElementById('deliveryDays').value.trim();
  await saveConfigToSupabase('shipping_threshold', threshold);
  await saveConfigToSupabase('shipping_days', days);
}

function addZone() {
  const zones = JSON.parse(localStorage.getItem('storeZones')) || [];
  zones.push({ name: 'New Zone', price: 0 });
  localStorage.setItem('storeZones', JSON.stringify(zones));
  renderShippingZones();
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

function buildConfigFromInputs() {
  const getVal = (id, fallback = '') => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : fallback;
  };
  const getBool = (id, fallback = false) => {
    const el = document.getElementById(id);
    return el ? el.value === 'true' : fallback;
  };
  const getNum = (id, fallback = 0) => {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) : fallback;
  };

  const text = getVal('promoTextSetting');
  const speed = getNum('tweakPromoSpeed', 25);
  const repeats = parseInt(getVal('tweakPromoRepeats', '1')) || 1;
  const showMarquee = getBool('tweakShowMarquee', true);
  const showSignIn = getBool('tweakShowSignIn', true);
  const showStars = getBool('tweakShowStars', true);
  const showSizeCalc = getBool('tweakShowSizeCalc', true);
  const showInstagram = getBool('tweakShowInstagram', true);
  const showTiktok = getBool('tweakShowTiktok', true);
  const showCoupons = getBool('tweakShowCoupons', true);
  const couponCodes = getVal('tweakCouponCodes');
  
  const showCOD = getBool('tweakShowCOD', true);
  const showApplePay = getBool('tweakShowApplePay', true);
  const showCard = getBool('tweakShowCard', true);
  
  const showPrelaunch = getBool('tweakShowPrelaunch', false);
  const prelaunchDate = getVal('tweakPrelaunchDate', '2026-07-01T20:00:00');
  const prelaunchPassword = getVal('tweakPrelaunchPassword', 'majarah2026');
  
  const showTeaser = getBool('tweakShowTeaser', false);
  const teaserDate = getVal('tweakTeaserDate', '2026-07-15T20:00:00');
  const teaserBadge = getVal('tweakTeaserBadge', 'TEASER / DROP 02');
  const teaserTitle = getVal('tweakTeaserTitle', 'ECLIPSE COLLECTION');
  const teaserDesc = getVal('tweakTeaserDesc', 'The next evolution of identity architecture. Pre-register to secure access.');
  const teaserName1 = getVal('tweakTeaserName1', 'ECLIPSE SHIRT');
  const teaserImage1 = getVal('tweakTeaserImage1', 'blackinfront.jpg');
  const teaserName2 = getVal('tweakTeaserName2', 'ECLIPSE SHORTS');
  const teaserImage2 = getVal('tweakTeaserImage2', 'whiteinfront.jpg');

  // Shipping rates
  const zones = JSON.parse(localStorage.getItem('storeZones')) || [];
  const shippingRates = {};
  zones.forEach(z => {
    shippingRates[z.name] = z.price;
  });

  return {
    promoText: text,
    promoSpeed: speed,
    promoRepeats: repeats,
    promoVisible: showMarquee,
    showSignIn: showSignIn,
    showInstagram: showInstagram,
    showTiktok: showTiktok,
    showStars: showStars,
    showSizeCalc: showSizeCalc,
    showCoupons: showCoupons,
    couponCodes: couponCodes,
    paymentCOD: showCOD,
    paymentApplePay: showApplePay,
    paymentCard: showCard,
    showPrelaunch: showPrelaunch,
    prelaunchDate: prelaunchDate,
    bypassPassword: prelaunchPassword,
    drop2TeaserVisible: showTeaser,
    drop2TeaserDate: teaserDate,
    drop2TeaserBadge: teaserBadge,
    drop2TeaserTitle: teaserTitle,
    drop2TeaserDesc: teaserDesc,
    drop2Product1Name: teaserName1,
    drop2Product1Image: teaserImage1,
    drop2Product2Name: teaserName2,
    drop2Product2Image: teaserImage2,
    shippingRates: shippingRates
  };
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('open');
}

function copyConfigJsonText() {
  const textarea = document.getElementById('configCopyTextarea');
  if (textarea) {
    textarea.select();
    try {
      navigator.clipboard.writeText(textarea.value);
    } catch(err) {}
    showToast("JSON copied to clipboard! Update config.json and push to deploy.", "success");
  }
}

/**
 * Fetches current configurations and pre-launch emails from Supabase
 * and populates the Tweaks form fields to ensure UI consistency on load/refresh.
 */
async function initializeTweaks() {
    // 1. UI Loading State: Disable save buttons to prevent concurrent modification issues
    const saveButtons = document.querySelectorAll('button[onclick="saveTweaks()"]');
    saveButtons.forEach(btn => btn.disabled = true);

    try {
        const token = localStorage.getItem('mjr_admin_token') || '';
        if (!token) return;

        // 2. Fetch the saved tweaks from 'site_config' table (row ID 1)
        const configData = await sbFetch('site_config', 'GET', null, '?id=eq.1&select=config');

        if (configData && configData.length > 0 && configData[0].config) {
            window.ADMIN_CONFIG = configData[0].config;

            // 3. Sync to localStorage for fallback and preview consistency
            Object.keys(window.ADMIN_CONFIG).forEach(k => {
                localStorage.setItem(`mjr_${k}`, JSON.stringify(window.ADMIN_CONFIG[k]));
            });
            // Fix potential promo text naming mismatch in existing preview logic
            if (window.ADMIN_CONFIG.promoText) {
                localStorage.setItem('mjr_promoText', window.ADMIN_CONFIG.promoText);
                localStorage.setItem('mjr_promo_text', window.ADMIN_CONFIG.promoText);
            }

            // 4. Populate ALL form fields using the helper function
            populateTweaksFromConfig();
        }

        // 5. Separately fetch Pre-launch registered emails from 'settings' table
        const emailsData = await sbFetch('settings', 'GET', null, '?key=eq.prelaunch_emails&select=value');
        if (emailsData && emailsData.length > 0 && emailsData[0].value) {
            try {
                const emails = JSON.parse(emailsData[0].value);
                const textarea = document.getElementById('tweakPrelaunchEmails');
                if (textarea && Array.isArray(emails)) {
                    textarea.value = emails.join('\n');
                    // Ensure local cache matches DB for exports
                    localStorage.setItem('mjr_prelaunch_emails', emailsData[0].value);
                }
            } catch (e) {
                console.error("Failed to parse pre-launch emails JSON:", e);
            }
        }

        // 6. Refresh UI Previews (Marquee and Teaser Images)
        if (typeof updatePromoPreviewStats === 'function') updatePromoPreviewStats();
        if (typeof updateImagePreview === 'function') {
            updateImagePreview('tweakTeaserImage1', 'tweakTeaserImage1Preview');
            updateImagePreview('tweakTeaserImage2', 'tweakTeaserImage2Preview');
        }

    } catch (err) {
        console.error("Critical: Failed to initialize admin tweaks from Supabase.", err);
    } finally {
        // 7. Restore UI: Re-enable save buttons
        saveButtons.forEach(btn => btn.disabled = false);
    }
}

async function saveTweaks() {
  const partial = {
    promoText: document.getElementById('promoTextSetting').value.trim(),
    promoSpeed: Number(document.getElementById('tweakPromoSpeed').value),
    promoRepeats: Number(document.getElementById('tweakPromoRepeats').value),
    promoVisible: document.getElementById('tweakShowMarquee').value === 'true',
    showSignIn: document.getElementById('tweakShowSignIn').value === 'true',
    showStars: document.getElementById('tweakShowStars').value === 'true',
    showSizeCalc: document.getElementById('tweakShowSizeCalc').value === 'true',
    instagramVisible: document.getElementById('tweakShowInstagram').value === 'true',
    tiktokVisible: document.getElementById('tweakShowTiktok').value === 'true',
    paymentCOD: document.getElementById('tweakShowCOD').value === 'true',
    paymentApplePay: document.getElementById('tweakShowApplePay').value === 'true',
    paymentCard: document.getElementById('tweakShowCard').value === 'true',
    showPrelaunch: document.getElementById('tweakShowPrelaunch').value === 'true',
    prelaunchDate: document.getElementById('tweakPrelaunchDate').value.trim(),
    bypassPassword: document.getElementById('tweakPrelaunchPassword').value.trim(),
    drop2TeaserVisible: document.getElementById('tweakShowTeaser').value === 'true',
    drop2TeaserDate: document.getElementById('tweakTeaserDate').value.trim(),
    drop2TeaserBadge: document.getElementById('tweakTeaserBadge').value.trim(),
    drop2TeaserTitle: document.getElementById('tweakTeaserTitle').value.trim(),
    drop2TeaserDesc: document.getElementById('tweakTeaserDesc').value.trim(),
    drop2Product1Name: document.getElementById('tweakTeaserName1').value.trim(),
    drop2Product1Image: document.getElementById('tweakTeaserImage1').value.trim(),
    drop2Product2Name: document.getElementById('tweakTeaserName2').value.trim(),
    drop2Product2Image: document.getElementById('tweakTeaserImage2').value.trim(),
    showCoupons: document.getElementById('tweakShowCoupons').value === 'true'
  };

  const couponInput = document.getElementById('tweakCouponCodes').value.trim();
  const coupons = {};
  if (couponInput) {
      couponInput.split(',').forEach(pair => {
          const parts = pair.split(':');
          if (parts.length === 2) {
              coupons[parts[0].trim().toUpperCase()] = parts[1].trim();
          }
      });
  }
  partial.coupons = coupons;

  // Sync to localStorage immediately for fallback and preview consistency
  Object.keys(partial).forEach(k => {
    localStorage.setItem(`mjr_${k}`, JSON.stringify(partial[k]));
  });
  // Special case for promo text preview
  localStorage.setItem('mjr_promoText', partial.promoText);

  await saveConfigToSupabase(partial);
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
      const res = await sbFetch('settings', 'PATCH', { value: '[]' }, '?key=eq.prelaunch_emails');
      if (res) {
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

window.addEventListener('input', (e) => {
    if (e.target.id === 'tweakTeaserBrightness') {
        const valEl = document.getElementById('brightnessVal');
        if (valEl) valEl.innerText = e.target.value;
    }
});

// Consolidated initialization and authentication logic
window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('mjr_admin_token');
  const loginScreen = document.getElementById('loginScreen');
  const appEl = document.getElementById('app');

  if (token) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (appEl) appEl.style.display = 'block';
    
    await showDashboard();
    
    // Initialise shipping zones panel
    setTimeout(renderShippingZones, 500);
    // Load shipping rules
    const rules = JSON.parse(localStorage.getItem('storeShippingRules')) || {};
    if (rules.freeShipThreshold !== undefined && document.getElementById('freeShipThreshold')) {
      const el = document.getElementById('freeShipThreshold');
      if (el) el.value = rules.freeShipThreshold;
    }
    if (rules.deliveryDays) {
      const el = document.getElementById('deliveryDays');
      if (el) el.value = rules.deliveryDays;
    }
    
    // Initialize tweaks
    setTimeout(initializeTweaks, 800);
  } else {
    // No active session — show login screen defined in index.html
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appEl) {
        appEl.style.display = 'none';
        appEl.innerHTML = '';
    }
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

// ── GLOBAL EXPORTS (for obfuscated environment) ──
window.doLogin = doLogin;
window.logout = logout;
window.showDashboard = showDashboard;
window.saveSupabaseConfig = saveSupabaseConfig;
window.showPage = showPage;
window.filterOrders = filterOrders;
window.searchOrders = searchOrders;
window.exportOrdersCSV = exportOrdersCSV;
window.openAddOrder = openAddOrder;
window.changeOrderStatus = changeOrderStatus;
window.deleteOrder = deleteOrder;
window.openAddProduct = openAddProduct;
window.saveProduct = saveProduct;
window.openEditProduct = openEditProduct;
window.deleteProduct = deleteProduct;
window.saveInventory = saveInventory;
window.saveShipping = saveShipping;
window.addZone = addZone;
window.saveShippingRules = saveShippingRules;
window.saveTweaks = saveTweaks;
window.exportPrelaunchEmailsCSV = exportPrelaunchEmailsCSV;
window.clearPrelaunchEmails = clearPrelaunchEmails;
window.openMobileSimulator = openMobileSimulator;
window.saveTranslations = saveTranslations;
window.changePassword = changePassword;
window.saveWaNumber = saveWaNumber;
window.saveEmailJSConfig = saveEmailJSConfig;
window.copyConfigJS = copyConfigJS;
window.copyConfigJsonText = copyConfigJsonText;
window.closeModal = closeModal;
window.triggerFileUpload = triggerFileUpload;
window.handleFileSelect = handleFileSelect;
window.updateImagePreview = updateImagePreview;
window.startAutoSync = startAutoSync;
window.stopAutoSync = stopAutoSync;
window.syncDashboardData = syncDashboardData;
window.initSupabase = initSupabase;
window.initializeTweaks = initializeTweaks;
window.loadAdminConfig = loadAdminConfig;
window.populateTweaksFromConfig = populateTweaksFromConfig;
window.saveConfigToSupabase = saveConfigToSupabase;
window.renderDashboard = renderDashboard;
window.adminConfirm = adminConfirm;
window.updatePromoPreviewStats = updatePromoPreviewStats;
window.buildConfigFromInputs = buildConfigFromInputs;
window.openModal = openModal;
window.reloadSimulatorFrame = reloadSimulatorFrame;
window.updateSimulatorControlsUI = updateSimulatorControlsUI;
window.setSimulatorOrientation = setSimulatorOrientation;
window.setSimulatorDevice = setSimulatorDevice;
window.switchSimulatorPage = switchSimulatorPage;
window.updateSimulatorClock = updateSimulatorClock;
window.formatWhatsAppPhone = formatWhatsAppPhone;
window.sendWhatsAppConfirmation = sendWhatsAppConfirmation;
window.renderOrdersTable = renderOrdersTable;
window.renderProductsTable = renderProductsTable;
window.renderOverviewCounters = renderOverviewCounters;
window.renderRecentOrdersTable = renderRecentOrdersTable;
window.renderInventoryGrid = renderInventoryGrid;
window.renderShippingZones = renderShippingZones;
window.renderAnalyticsCharts = renderAnalyticsCharts;
window.getStatusColor = getStatusColor;
window.escapeCSV = escapeCSV;
window.downloadCSV = downloadCSV;
window.getActiveFilteredOrders = getActiveFilteredOrders;
window.loadTranslationsPanel = loadTranslationsPanel;
window.requestNotificationPermission = requestNotificationPermission;
window.showSystemNotification = showSystemNotification;
window.playNotificationSound = playNotificationSound;
window.unlockMobileAudio = unlockMobileAudio;
window.flashTitle = flashTitle;
ileAudio = unlockMobileAudio;
window.flashTitle = flashTitle;
