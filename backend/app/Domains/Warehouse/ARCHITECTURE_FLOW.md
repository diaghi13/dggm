# Warehouse Domain - Architecture Flow

Diagramma visuale del flusso completo DDD + Events.

---

## 🏗️ Architettura Completa

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  POST /api   │  │  GET /api    │  │ Laravel Echo │              │
│  │  /warehouses │  │  /warehouses │  │  WebSocket   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────▲───────┘              │
│         │                  │                  │                       │
└─────────┼──────────────────┼──────────────────┼───────────────────────┘
          │                  │                  │
          │                  │                  │ Real-time updates
          │                  │                  │
┌─────────▼──────────────────▼──────────────────┼───────────────────────┐
│                     LARAVEL BACKEND                                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    HTTP LAYER (Thin)                             ││
│  │  ┌────────────────────────────────────────────────────────────┐ ││
│  │  │  WarehouseController                                        │ ││
│  │  │  - authorize()  (Policy)                                    │ ││
│  │  │  - validate()   (FormRequest)                               │ ││
│  │  │  - $service->create($data)                                  │ ││
│  │  │  - return JsonResponse                                      │ ││
│  │  └────────────────────┬───────────────────────────────────────┘ ││
│  └───────────────────────┼──────────────────────────────────────────┘│
│                          │                                            │
│  ┌───────────────────────▼──────────────────────────────────────────┐│
│  │                  SERVICE LAYER (Orchestrator)                    ││
│  │  ┌────────────────────────────────────────────────────────────┐ ││
│  │  │  WarehouseService                                           │ ││
│  │  │  - create()    → CreateWarehouseAction                      │ ││
│  │  │  - update()    → UpdateWarehouseAction                      │ ││
│  │  │  - delete()    → DeleteWarehouseAction                      │ ││
│  │  │  - getAll()    → Repository                                 │ ││
│  │  │  - getInventory() → GetWarehouseInventoryQuery              │ ││
│  │  └────────┬───────────────────────┬───────────────────┬────────┘ ││
│  └───────────┼───────────────────────┼───────────────────┼─────────┘│
│              │                       │                   │            │
│    ┌─────────▼────────┐   ┌─────────▼────────┐ ┌───────▼──────┐    │
│    │    ACTIONS       │   │    QUERIES       │ │  REPOSITORY  │    │
│    │  (Write Ops)     │   │   (Read Ops)     │ │ (Data Access)│    │
│    ├──────────────────┤   ├──────────────────┤ ├──────────────┤    │
│    │ Create           │   │ GetInventory     │ │ Interface    │    │
│    │ Update           │   │ GetLowStock      │ │ Eloquent Impl│    │
│    │ Delete           │   │                  │ │              │    │
│    │                  │   │                  │ │              │    │
│    │ DB Transaction   │   │ Complex Queries  │ │ CRUD + Find  │    │
│    │ Dispatch Events  │   │ + Filters        │ │              │    │
│    └─────────┬────────┘   └──────────────────┘ └──────┬───────┘    │
│              │                                         │             │
│              │                                         │             │
│    ┌─────────▼─────────────────────────────────────────▼───────┐   │
│    │                    DATABASE (MySQL)                        │   │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│    │  │ warehouses  │  │  inventory  │  │   products  │       │   │
│    │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     EVENT SYSTEM                             │  │
│  │  ┌────────────────┐  dispatches  ┌─────────────────────────┐│  │
│  │  │    EVENTS      │─────────────►│      LISTENERS          ││  │
│  │  ├────────────────┤              ├─────────────────────────┤│  │
│  │  │ Created        │              │ LogWarehouseActivity    ││  │
│  │  │ Updated        │              │ UpdateWarehouseCache    ││  │
│  │  │ Deleted        │              │ SendLowStockAlert       ││  │
│  │  │ LowStock       │              │  (Queued + Retry 3x)    ││  │
│  │  └────────┬───────┘              └─────────────────────────┘│  │
│  │           │                                                  │  │
│  │           │  broadcasts                                      │  │
│  │           └─────────────────────────────────────────────────┼──┘
│  │                                                              │
└──┼──────────────────────────────────────────────────────────────┼───┘
   │                                                              │
   │                                                              │
   ├──────────────────────────┐                                  │
   │                          │                                  │
┌──▼──────────┐        ┌──────▼───────┐                ┌────────▼────────┐
│   REDIS     │        │    QUEUE     │                │  BROADCASTING   │
│             │        │              │                │                 │
│ Cache Layer │        │ Background   │                │ WebSocket       │
│             │        │ Jobs         │                │ (Reverb/Pusher) │
│ warehouses: │        │              │                │                 │
│  :all       │        │ Low Stock    │                │ PrivateChannel  │
│  :{id}      │        │ Alerts       │                │ ('warehouses')  │
└─────────────┘        └──────────────┘                └─────────────────┘
```

---

## 📊 Flusso Dettagliato: CREATE Warehouse

```
1. USER ACTION
   Frontend → POST /api/v1/warehouses
   Body: { code: "WH001", name: "Main Warehouse", ... }

2. LARAVEL ROUTING
   routes/api.php → WarehouseController@store

3. CONTROLLER (HTTP Layer)
   ├─ Authorization: $this->authorize('create', Warehouse::class)
   ├─ Validation: StoreWarehouseRequest (FormRequest)
   └─ Delegate: $this->service->create($request->validated())

4. SERVICE (Orchestrator)
   ├─ Convert to DTO: WarehouseData::fromRequest($data)
   └─ Delegate: $this->createAction->execute($dto)

5. ACTION (Business Logic)
   ├─ START DB TRANSACTION
   ├─ Repository::create($dto) → INSERT INTO warehouses
   ├─ DISPATCH: WarehouseCreated::dispatch($warehouse, metadata)
   └─ COMMIT DB TRANSACTION

6. EVENT SYSTEM (Automatic)
   WarehouseCreated dispatched
   ├─ Listener 1: LogWarehouseActivity::handleCreated()
   │   └─ Log::info("Warehouse created", ...)
   ├─ Listener 2: UpdateWarehouseCache::handleCreated()
   │   └─ Cache::forget('warehouses:all')
   └─ Broadcasting: Pusher/Reverb WebSocket
       └─ Send to channel 'warehouses'

7. QUEUE PROCESSING (Background)
   └─ (No queued listeners for Created event)

8. FRONTEND REAL-TIME UPDATE
   Laravel Echo.private('warehouses')
     .listen('.warehouse.created', (event) => {
       toast.success('New warehouse created!');
       refreshWarehouseList();
     });

9. API RESPONSE
   HTTP 201 Created
   {
     "success": true,
     "data": { id: 1, code: "WH001", ... },
     "message": "Warehouse created successfully"
   }
```

---

## 🔥 Flusso Dettagliato: LOW STOCK Alert

```
1. INVENTORY UPDATE
   Stock movement → Inventory::quantity_available = 5
   Minimum stock = 10

2. BUSINESS LOGIC CHECK (in WarehouseService or StockMovementService)
   if ($inventory->quantity_available <= $inventory->minimum_stock) {
       InventoryLowStock::dispatch($inventory, $warehouse);
   }

3. EVENT DISPATCHED
   InventoryLowStock::dispatch($inventory, $warehouse)

4. EVENT SYSTEM
   ├─ Listener: SendLowStockAlert (ShouldQueue - Async!)
   │   ├─ Added to QUEUE (Redis/Database)
   │   └─ Will process in background
   └─ Broadcasting: WebSocket to frontend
       └─ Channel: 'warehouses' and 'warehouse.{id}'

5. QUEUE WORKER PROCESSES (php artisan queue:work)
   SendLowStockAlert::handle(InventoryLowStock $event)
   ├─ Get warehouse manager: $event->warehouse->manager
   ├─ Send email: Mail::to($manager)->send(LowStockAlert)
   ├─ Send notification: Notification::send(...)
   └─ If fails: Retry up to 3 times (public int $tries = 3)

6. FRONTEND REAL-TIME NOTIFICATION
   Echo.private('warehouses')
     .listen('.inventory.low-stock', (e) => {
       toast.warning(`Low stock: ${e.product_name}`);
       showLowStockBadge(e.warehouse_id);
     });

7. MANAGER RECEIVES
   ├─ Email: "Low stock alert for Product X in Warehouse Y"
   ├─ In-app notification: Bell icon with badge
   └─ Real-time toast: "⚠️ Low stock: Product X (5/10)"
```

---

## 🎯 Benefici di questa Architettura

### 1. Separazione delle Responsabilità
```
Controller  → HTTP concerns (auth, validation, response)
Service     → Orchestrazione (quale Action/Query chiamare)
Action      → Business logic + DB transaction + Events
Query       → Read operations complesse
Repository  → Data access abstraction
Events      → Side-effects decoupling
Listeners   → Audit, cache, notifications (async)
```

### 2. Testabilità Isolata
```php
// Test Action without HTTP
$action = app(CreateWarehouseAction::class);
$warehouse = $action->execute($dto);
expect($warehouse)->toBeInstanceOf(Warehouse::class);

// Test Events
Event::fake([WarehouseCreated::class]);
$action->execute($dto);
Event::assertDispatched(WarehouseCreated::class);

// Test Listener
$listener = new SendLowStockAlert();
$listener->handle($event);
Mail::assertSent(LowStockAlert::class);
```

### 3. Scalabilità
- **Horizontal**: Aggiungi listener senza modificare Actions
- **Vertical**: Cambia DB (Mongo, Postgres) senza toccare Service/Actions
- **Multi-tenant**: Repository diversi per tenant diversi

### 4. Performance
- **Cache Layer**: UpdateWarehouseCache invalida solo ciò che serve
- **Async Processing**: SendLowStockAlert non blocca la request
- **Broadcasting**: Frontend aggiornato in real-time senza polling

### 5. Manutenibilità
- Modifiche locali → nessun side-effect
- Nuovo listener → aggiungi in EventServiceProvider
- Nuovo database → implementa WarehouseXRepository
- Nuova feature → aggiungi Action/Query

---

## 🚀 Esempio: Aggiungere un Nuovo Listener

**Requirement**: Inviare webhook a sistema esterno quando warehouse creato.

```php
// 1. Crea Listener
php artisan make:listener SendWebhookToExternalSystem

// 2. Implementa
class SendWebhookToExternalSystem implements ShouldQueue
{
    public function handle(WarehouseCreated $event): void
    {
        Http::post('https://external-system.com/webhooks', [
            'event' => 'warehouse.created',
            'warehouse_id' => $event->warehouse->id,
            'warehouse_code' => $event->warehouse->code,
        ]);
    }
}

// 3. Registra in EventServiceProvider
protected $listen = [
    WarehouseCreated::class => [
        UpdateWarehouseCache::class,
        SendWebhookToExternalSystem::class, // ← Aggiunto!
    ],
];
```

**FATTO!** Nessuna modifica a Controller, Service, Action. Zero side-effects.

---

## 📚 File di Riferimento

- **Questo file**: Architettura e flussi
- `README_DDD.md`: Spiegazione pattern DDD
- `Events/README.md`: Documentazione eventi
- `IMPLEMENTATION_SUMMARY.md`: Checklist implementazione

---

**Creato:** 21 Gennaio 2025
**Progetto:** DGGM ERP
**Pattern:** DDD + Event-Driven Architecture + Repository + CQRS
