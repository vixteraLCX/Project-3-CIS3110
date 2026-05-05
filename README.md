# NexusCorp ERP Portal — PWA (Project 3 Final)

A **Progressive Web Application** built with **AngularJS 1.8**, transforming the original multi-page Project 2 ERP dashboard into a highly dynamic, data-driven single-page application with offline support.

---

## 🌟 What's New in Project 3 (Final Version)

- **Fully Dynamic KPIs:** Every single KPI card (values, percentage badges, trend arrows, and progress bars) is now computed on-the-fly from the underlying CSV data. If the CSV changes, the cards adapt automatically.
- **Single Page Application (SPA):** The 6 separate HTML pages from Project 2 have been unified into a single `index.html` shell using `ngRoute`.
- **Progressive Web App (PWA):** Implemented a Service Worker (`service-worker.js`) with a cache-first strategy. The entire application, including the CSV files, functions fully offline after the initial load.
- **Clean Architecture:** Legacy HTML files have been deleted. The project strictly follows an AngularJS Component/Service pattern.

---

## 📂 Project Structure

```text
index.html                        ← SPA shell (AngularJS bootstrap, sidebar)
app.js                            ← Module definition, route config, AppCtrl
manifest.json                     ← PWA Web App Manifest
service-worker.js                 ← Offline caching service worker
css/app.css                       ← Shared styles (ng-cloak, transitions)
icons/                            ← PWA icons (192px, 512px)

services/
  csv.service.js                  ← Generic CsvService (PapaParse + $q)
  finance.service.js              ← FinanceService  → finance.csv
  sales.service.js                ← SalesService    → sales.csv
  crm.service.js                  ← CrmService      → customers.csv
  production.service.js           ← ProductionService → production.csv
  supplychain.service.js          ← SupplyChainService → supply_chain.csv

components/
  overview/                       ← Portal Overview template & controller
  finance/                        ← Finance template & controller
  sales/                          ← Sales template & controller
  crm/                            ← CRM template & controller
  production/                     ← Production template & controller
  supplychain/                    ← Supply Chain template & controller

finance.csv / sales.csv / customers.csv / production.csv / supply_chain.csv
```

---

## ⚙️ AngularJS Architecture

### Module: `nexusERP`
Defined in `app.js` with the `ngRoute` dependency and classic `#/route` hash-prefix configuration.

### Services
- **`CsvService`** — Generic factory: wraps PapaParse in an Angular `$q` promise with in-memory caching.
- **5 Domain Services** — Each injects `CsvService` and is responsible for fetching its specific CSV file.

### Controllers
Each controller is responsible for:
1. Setting default placeholder states for `$scope.kpis`.
2. Resolving its domain service data.
3. **Computing complex aggregations** (period-over-period percentages, ratios, top-performers) and injecting them into the KPI cards.
4. Initializing `Chart.js` canvases and managing their lifecycle (`$destroy` cleanup).

---

## 📱 PWA Features

| Feature | Implementation |
|---|---|
| Web App Manifest | `manifest.json` — name, icons, display: standalone |
| Service Worker | `service-worker.js` — cache-first for local assets + CSV |
| Offline Support | All HTML, JS, CSS, and CSV data files pre-cached on SW install |
| Install prompt | Triggered by browser when PWA criteria met |
| App Icons | `icons/icon-192.png` + `icons/icon-512.png` |


