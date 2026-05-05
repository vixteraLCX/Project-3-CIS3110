# NexusCorp ERP Portal — PWA (Project 3 / AngularJS)

A **Progressive Web Application** built with **AngularJS 1.8** adapting the original multi-page Project 2 ERP dashboard into a single-page application with offline support.

---

## Project Structure

```
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
  overview/
    overview.html                 ← Portal Overview template  (was index.html)
    overview.controller.js        ← OverviewCtrl
  finance/
    finance.html                  ← Finance template           (was finance.html)
    finance.controller.js         ← FinanceCtrl
  sales/
    sales.html                    ← Sales template             (was sales.html)
    sales.controller.js           ← SalesCtrl
  crm/
    crm.html                      ← CRM template               (was crm.html)
    crm.controller.js             ← CrmCtrl
  production/
    production.html               ← Production template        (was production.html)
    production.controller.js      ← ProductionCtrl
  supplychain/
    supplychain.html              ← Supply Chain template      (was supplychain.html)
    supplychain.controller.js     ← SupplyChainCtrl

finance.csv / sales.csv / customers.csv / production.csv / supply_chain.csv
```

---

## AngularJS Architecture

### Module: `nexusERP`
Defined in `app.js` with the `ngRoute` dependency.

### Routes (6 total — one per original HTML file)
| Hash URL | Controller | Template |
|---|---|---|
| `#/overview` | `OverviewCtrl` | `components/overview/overview.html` |
| `#/finance` | `FinanceCtrl` | `components/finance/finance.html` |
| `#/sales` | `SalesCtrl` | `components/sales/sales.html` |
| `#/crm` | `CrmCtrl` | `components/crm/crm.html` |
| `#/production` | `ProductionCtrl` | `components/production/production.html` |
| `#/supplychain` | `SupplyChainCtrl` | `components/supplychain/supplychain.html` |

### Services
- **`CsvService`** — Generic factory: wraps PapaParse in an Angular `$q` promise with in-memory caching
- **5 domain services** — each injects `CsvService` and filters their specific CSV file

### Controllers
Each controller:
1. Injects its domain service + `DS` (colour constants) + `GRID`
2. Sets default `$scope.kpis` array (rendered via `ng-repeat` in the template)
3. Uses `$timeout(fn, 100)` to defer after template render
4. Calls the service, updates KPI values from real CSV data
5. Creates Chart.js charts using prefixed canvas IDs (e.g. `fin-chart1`, `crm-chart2`)
6. Registers a `$scope.$on('$destroy')` listener to `.destroy()` charts on navigation

---

## PWA Features

| Feature | Implementation |
|---|---|
| Web App Manifest | `manifest.json` — name, icons, display: standalone |
| Service Worker | `service-worker.js` — cache-first for local assets + CSV |
| Offline Support | All CSV data files pre-cached on SW install |
| Install prompt | Triggered by browser when PWA criteria met |
| App Icons | `icons/icon-192.png` + `icons/icon-512.png` |

---

## ⚠️ Running Locally — HTTP Server Required

> Service workers and PapaParse's `download: true` **do not work over `file://`** URLs.
> You must serve the project from a local HTTP server.

### Option A — VS Code Live Server (recommended)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option B — Python
```bash
cd "c:\Users\Chelsey Luc\Documents\Claude\CIS3110_Project2"
python -m http.server 8080
# Open: http://localhost:8080
```

### Option C — Node.js
```bash
npx serve .
```

---

## CSV Data Files (unchanged from Project 2)
| File | Used By | Key Fields |
|---|---|---|
| `finance.csv` | Finance, Overview | Date, Department, Revenue, Expenses, Profit, Cost_Type, Region |
| `sales.csv` | Sales, Overview | OrderID, Product, UnitsSold, TotalRevenue, SalesRep, Region, Date |
| `customers.csv` | CRM, Overview | CustomerID, Name, Region, Segment, LifetimeValue, SatisfactionScore, SupportTickets, ChurnRisk |
| `production.csv` | Production, Overview | ProductionID, ProductID, Date, Shift, MachineID, UnitsProduced, DefectiveUnits, ProductionTimeHours |
| `supply_chain.csv` | Supply Chain | SupplierID, SupplierName, ProductID, OrderID, LeadTimeDays, CostPerUnit, Quantity, Warehouse, Status |
