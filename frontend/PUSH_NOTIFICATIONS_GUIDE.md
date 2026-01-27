# Push Notifications Self-Hosted - Guida Completa

## Overview

Implementazione completa di push notifications **senza servizi esterni** (no Firebase, OneSignal, etc.).

**Stack**:
- Backend: Laravel + `web-push` package
- Frontend: Next.js + Browser Push API
- No costi aggiuntivi, no limiti, full control

---

## Parte 1: Backend Setup (Laravel)

### Step 1: Install Package

```bash
cd backend
composer require minishlink/web-push
```

### Step 2: Generate VAPID Keys

```bash
php artisan tinker
```

```php
// In tinker
$vapid = \Minishlink\WebPush\VAPID::createVapidKeys();
echo "Public Key: " . $vapid['publicKey'] . "\n";
echo "Private Key: " . $vapid['privateKey'] . "\n";
```

Copia le chiavi e aggiungile a `.env`:

```env
# Push Notifications
VAPID_PUBLIC_KEY=BCjEW...
VAPID_PRIVATE_KEY=mHwN...
VAPID_SUBJECT=mailto:admin@dggm-erp.com
```

### Step 3: Database Migration

```php
// database/migrations/xxxx_create_push_subscriptions_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('endpoint');
            $table->string('p256dh');
            $table->string('auth');
            $table->string('device_name')->nullable();
            $table->string('browser')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'endpoint']);
            $table->index('user_id');
        });

        Schema::create('push_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('body');
            $table->string('url')->nullable();
            $table->string('icon')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('sent_at');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_notifications');
        Schema::dropIfExists('push_subscriptions');
    }
};
```

```bash
php artisan migrate
```

### Step 4: Models

```php
// app/Models/PushSubscription.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'endpoint',
        'p256dh',
        'auth',
        'device_name',
        'browser',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

```php
// app/Models/PushNotification.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushNotification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'body',
        'url',
        'icon',
        'data',
        'sent_at',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }
}
```

### Step 5: Service

```php
// app/Services/PushNotificationService.php
namespace App\Services;

use App\Models\PushNotification;
use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => config('services.vapid.subject'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ]);
    }

    public function subscribe(User $user, array $subscriptionData): PushSubscription
    {
        return PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint' => $subscriptionData['endpoint'],
            ],
            [
                'p256dh' => $subscriptionData['keys']['p256dh'],
                'auth' => $subscriptionData['keys']['auth'],
                'device_name' => $subscriptionData['device_name'] ?? null,
                'browser' => $subscriptionData['browser'] ?? null,
                'last_used_at' => now(),
            ]
        );
    }

    public function unsubscribe(User $user, string $endpoint): bool
    {
        return PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $endpoint)
            ->delete() > 0;
    }

    public function sendToUser(
        User $user,
        string $title,
        string $body,
        ?string $url = null,
        ?string $icon = null,
        ?array $data = null
    ): array {
        $subscriptions = $user->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return ['success' => false, 'message' => 'No subscriptions found'];
        }

        $payload = [
            'title' => $title,
            'body' => $body,
            'url' => $url ?? config('app.url'),
            'icon' => $icon ?? '/icons/icon-192x192.png',
            'data' => $data,
        ];

        // Log notification
        PushNotification::create([
            'user_id' => $user->id,
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'icon' => $icon,
            'data' => $data,
            'sent_at' => now(),
        ]);

        $results = [];

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint' => $sub->endpoint,
                'keys' => [
                    'p256dh' => $sub->p256dh,
                    'auth' => $sub->auth,
                ],
            ]);

            $report = $this->webPush->sendOneNotification(
                $subscription,
                json_encode($payload)
            );

            // Update last_used_at
            $sub->update(['last_used_at' => now()]);

            // Handle expired/invalid subscriptions
            if (!$report->isSuccess() && $report->isSubscriptionExpired()) {
                $sub->delete();
                $results[] = ['subscription_id' => $sub->id, 'status' => 'expired'];
            } else {
                $results[] = [
                    'subscription_id' => $sub->id,
                    'status' => $report->isSuccess() ? 'sent' : 'failed',
                    'reason' => $report->getReason(),
                ];
            }
        }

        return [
            'success' => true,
            'results' => $results,
        ];
    }

    public function sendToMultipleUsers(
        array $userIds,
        string $title,
        string $body,
        ?string $url = null,
        ?string $icon = null,
        ?array $data = null
    ): array {
        $users = User::whereIn('id', $userIds)->get();
        $results = [];

        foreach ($users as $user) {
            $results[$user->id] = $this->sendToUser($user, $title, $body, $url, $icon, $data);
        }

        return $results;
    }

    public function sendToAll(
        string $title,
        string $body,
        ?string $url = null,
        ?string $icon = null,
        ?array $data = null
    ): array {
        $users = User::has('pushSubscriptions')->get();
        $results = [];

        foreach ($users as $user) {
            $results[$user->id] = $this->sendToUser($user, $title, $body, $url, $icon, $data);
        }

        return [
            'total_users' => count($results),
            'results' => $results,
        ];
    }
}
```

### Step 6: Config

```php
// config/services.php
return [
    // ... altre configurazioni

    'vapid' => [
        'subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],
];
```

### Step 7: Controller

```php
// app/Http/Controllers/Api/V1/PushNotificationController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;

class PushNotificationController extends Controller
{
    public function __construct(
        private PushNotificationService $pushService
    ) {}

    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'device_name' => 'nullable|string',
            'browser' => 'nullable|string',
        ]);

        $subscription = $this->pushService->subscribe(
            $request->user(),
            $validated
        );

        return response()->json([
            'success' => true,
            'subscription' => $subscription,
        ]);
    }

    public function unsubscribe(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        $success = $this->pushService->unsubscribe(
            $request->user(),
            $validated['endpoint']
        );

        return response()->json([
            'success' => $success,
        ]);
    }

    public function send(Request $request)
    {
        // Solo admin può inviare notifiche
        $this->authorize('send-notifications');

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:500',
            'url' => 'nullable|url',
            'icon' => 'nullable|url',
            'data' => 'nullable|array',
        ]);

        $results = $this->pushService->sendToMultipleUsers(
            $validated['user_ids'],
            $validated['title'],
            $validated['body'],
            $validated['url'] ?? null,
            $validated['icon'] ?? null,
            $validated['data'] ?? null
        );

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    public function getVapidPublicKey()
    {
        return response()->json([
            'publicKey' => config('services.vapid.public_key'),
        ]);
    }

    public function getNotifications(Request $request)
    {
        $notifications = $request->user()
            ->pushNotifications()
            ->latest()
            ->paginate(20);

        return response()->json($notifications);
    }

    public function markAsRead(Request $request, int $id)
    {
        $notification = $request->user()
            ->pushNotifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }
}
```

### Step 8: Routes

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Push notifications
    Route::prefix('push')->group(function () {
        Route::get('vapid-public-key', [PushNotificationController::class, 'getVapidPublicKey']);
        Route::post('subscribe', [PushNotificationController::class, 'subscribe']);
        Route::post('unsubscribe', [PushNotificationController::class, 'unsubscribe']);
        Route::get('notifications', [PushNotificationController::class, 'getNotifications']);
        Route::patch('notifications/{id}/read', [PushNotificationController::class, 'markAsRead']);

        // Solo admin
        Route::post('send', [PushNotificationController::class, 'send'])
            ->middleware('can:send-notifications');
    });
});
```

### Step 9: User Model Relationship

```php
// app/Models/User.php
public function pushSubscriptions()
{
    return $this->hasMany(PushSubscription::class);
}

public function pushNotifications()
{
    return $this->hasMany(PushNotification::class);
}
```

---

## Parte 2: Frontend Setup (Next.js)

### Step 1: API Client

```typescript
// lib/api/push-notifications.ts
import { apiClient } from './client';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device_name?: string;
  browser?: string;
}

export const pushNotificationsApi = {
  getVapidPublicKey: async () => {
    const response = await apiClient.get('/push/vapid-public-key');
    return response.data.publicKey;
  },

  subscribe: async (subscription: PushSubscriptionData) => {
    const response = await apiClient.post('/push/subscribe', subscription);
    return response.data;
  },

  unsubscribe: async (endpoint: string) => {
    const response = await apiClient.post('/push/unsubscribe', { endpoint });
    return response.data;
  },

  getNotifications: async (page = 1) => {
    const response = await apiClient.get('/push/notifications', {
      params: { page },
    });
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await apiClient.patch(`/push/notifications/${id}/read`);
    return response.data;
  },
};
```

### Step 2: Utilities

```typescript
// lib/push-utils.ts
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  return 'Unknown';
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS Device';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Mac/.test(ua)) return 'Mac';
  return 'Desktop';
}
```

### Step 3: Component

```typescript
// components/push-notification-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import { pushNotificationsApi } from '@/lib/api/push-notifications';
import { urlBase64ToUint8Array, getBrowserInfo, getDeviceName } from '@/lib/push-utils';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check browser support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkExistingSubscription();
    }
  }, []);

  async function checkExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      setSubscription(existingSub);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        toast.error('Permission for notifications was denied');
        setIsLoading(false);
        return;
      }

      // Get VAPID public key from backend
      const vapidPublicKey = await pushNotificationsApi.getVapidPublicKey();

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
        },
        device_name: getDeviceName(),
        browser: getBrowserInfo(),
      };

      await pushNotificationsApi.subscribe(subscriptionData);

      setSubscription(pushSubscription);
      toast.success('Successfully subscribed to notifications!');
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to subscribe to notifications');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    if (!subscription) return;

    setIsLoading(true);

    try {
      // Unsubscribe from push
      await subscription.unsubscribe();

      // Remove from backend
      await pushNotificationsApi.unsubscribe(subscription.endpoint);

      setSubscription(null);
      toast.success('Successfully unsubscribed from notifications');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe from notifications');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return null; // Or show message that notifications aren't supported
  }

  return (
    <div className="flex items-center gap-2">
      {subscription ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribeFromPush}
          disabled={isLoading}
        >
          <BellOff className="h-4 w-4 mr-2" />
          Disable Notifications
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={subscribeToPush}
          disabled={isLoading}
        >
          <Bell className="h-4 w-4 mr-2" />
          Enable Notifications
        </Button>
      )}
    </div>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}
```

### Step 4: Update Service Worker

```javascript
// public/sw.js - Add to existing file
const VERSION = '2.0.1';

// ... existing code ...

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'notification',
      requireInteraction: false,
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now(),
        ...data.data,
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

### Step 5: Integration

```typescript
// app/(dashboard)/settings/page.tsx or dashboard layout
import { PushNotificationManager } from '@/components/push-notification-manager';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Receive real-time notifications about new DDTs, site updates, and more.
        </p>
        <PushNotificationManager />
      </div>
    </div>
  );
}
```

---

## Parte 3: Testing

### Test Backend

```bash
# In tinker
$user = User::first();
$service = app(\App\Services\PushNotificationService::class);

$service->sendToUser(
    $user,
    'Test Notification',
    'This is a test push notification!',
    '/dashboard',
    '/icons/icon-192x192.png'
);
```

### Test Frontend

1. Apri app in browser
2. Vai a Settings
3. Click "Enable Notifications"
4. Accetta permesso browser
5. Invia notifica dal backend
6. Dovresti ricevere la notifica!

---

## Use Cases

### 1. Nuovo DDT Assegnato

```php
// Quando si crea un DDT
$service->sendToUser(
    $ddt->worker,
    'Nuovo DDT Assegnato',
    "DDT #{$ddt->number} per {$ddt->site->name}",
    "/ddts/{$ddt->id}",
    '/icons/icon-192x192.png',
    ['ddt_id' => $ddt->id]
);
```

### 2. Timesheet Approvato

```php
$service->sendToUser(
    $timesheet->user,
    'Timesheet Approvato',
    "Il tuo timesheet del {$timesheet->date} è stato approvato",
    "/timesheet",
);
```

### 3. Alert Magazzino

```php
$admins = User::role('admin')->get();
$service->sendToMultipleUsers(
    $admins->pluck('id')->toArray(),
    'Alert Magazzino',
    "Scorte basse per {$product->name}: {$product->stock} unità",
    "/warehouse/inventory/{$product->id}"
);
```

---

**Pronto per iniziare l'implementazione?** 🚀

Fammi sapere se vuoi che ti guidi step-by-step o se preferisci iniziare da solo con questa guida!