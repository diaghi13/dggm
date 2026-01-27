# Warehouse Domain Events

Eventi del dominio Warehouse per gestire side-effects e notifiche.

## Eventi Disponibili

### 1. WarehouseCreated
Scatenato quando un warehouse viene creato.

**Uso nelle Actions:**

```php
use App\Events\WarehouseCreated;

WarehouseCreated::dispatch($warehouse, [
    'user_id' => auth()->id(),
    'ip_address' => request()->ip(),
]);
```

**Listener attivi:**
- `LogWarehouseActivity` - Crea audit log
- `UpdateWarehouseCache` - Invalida cache

---

### 2. WarehouseUpdated
Scatenato quando un warehouse viene aggiornato.

**Uso:**

```php
use App\Events\WarehouseUpdated;

WarehouseUpdated::dispatch($warehouse, [
    'name' => ['old' => 'Old Name', 'new' => 'New Name'],
], ['user_id' => auth()->id()]);
```

---

### 3. WarehouseDeleted
Scatenato quando un warehouse viene eliminato.

**Uso:**

```php
use App\Events\WarehouseDeleted;

WarehouseDeleted::dispatch(
    $warehouse->id,
    $warehouse->code,
    $warehouse->name,
    ['user_id' => auth()->id()]
);
```

---

### 4. InventoryLowStock
Scatenato quando stock scende sotto soglia minima.

**Uso:**

```php
use App\Events\InventoryLowStock;

if ($inventory->quantity_available <= $inventory->minimum_stock) {
    InventoryLowStock::dispatch($inventory, $warehouse);
}
```

**Listener attivi:**
- `SendLowStockAlert` - Invia email/notifiche (queued)

---

## Registrazione Eventi

Gli eventi sono registrati in `app/Providers/EventServiceProvider.php`:

```php
protected $listen = [
    WarehouseCreated::class => [
        UpdateWarehouseCache::class,
    ],
    WarehouseUpdated::class => [
        UpdateWarehouseCache::class,
    ],
    WarehouseDeleted::class => [
        UpdateWarehouseCache::class,
    ],
    InventoryLowStock::class => [
        SendLowStockAlert::class,
    ],
];

// Event Subscribers (per raggruppare listener su più eventi)
protected $subscribe = [
    LogWarehouseActivity::class,
    UpdateWarehouseCache::class,
];
```

Il provider è registrato in `bootstrap/providers.php`:
```php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\EventServiceProvider::class, // ← Qui
    App\Domains\Warehouse\Providers\WarehouseServiceProvider::class,
];
```

---

## Broadcasting Real-Time

Tutti gli eventi implementano `ShouldBroadcast` per notifiche real-time al frontend.

**Frontend (Laravel Echo):**
```javascript
Echo.private('warehouses')
    .listen('.warehouse.created', (e) => {
        console.log('New warehouse:', e.warehouse_name);
    })
    .listen('.inventory.low-stock', (e) => {
        showAlert(`Low stock: ${e.product_name}`);
    });
```

---

## Testing Eventi

```php
use Illuminate\Support\Facades\Event;

it('dispatches event on warehouse creation', function () {
    Event::fake([WarehouseCreated::class]);
    
    $action = app(CreateWarehouseAction::class);
    $action->execute($data);
    
    Event::assertDispatched(WarehouseCreated::class);
});
```
