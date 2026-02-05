<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetSuccessful extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $ipAddress,
        public readonly string $userAgent,
        public readonly \DateTime $timestamp
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $formattedDate = $this->timestamp->format('d/m/Y \a\l\l\e H:i');
        $deviceInfo = $this->extractDeviceInfo($this->userAgent);

        return (new MailMessage)
            ->subject('Password Resettata con Successo')
            ->greeting("Ciao {$notifiable->name},")
            ->line('La tua password è stata **resettata con successo**.')
            ->line('')
            ->line('**Dettagli operazione:**')
            ->line("📅 **Data e ora:** {$formattedDate}")
            ->line("🌍 **Indirizzo IP:** {$this->ipAddress}")
            ->line("💻 **Dispositivo:** {$deviceInfo}")
            ->line('')
            ->line('⚠️ **Se non hai richiesto tu questa modifica**, il tuo account potrebbe essere compromesso.')
            ->action('Accedi al tuo Account', url('/login'))
            ->line('Per sicurezza, tutte le sessioni attive sono state terminate. Dovrai effettuare nuovamente il login.')
            ->line('')
            ->line('Se hai domande o dubbi, contattaci immediatamente.')
            ->salutation('Cordiali saluti, Il Team di '.config('app.name'));
    }

    /**
     * Extract readable device info from user agent
     */
    private function extractDeviceInfo(string $userAgent): string
    {
        // Simple device detection
        if (str_contains($userAgent, 'iPhone')) {
            return 'iPhone';
        }
        if (str_contains($userAgent, 'iPad')) {
            return 'iPad';
        }
        if (str_contains($userAgent, 'Android')) {
            return 'Dispositivo Android';
        }
        if (str_contains($userAgent, 'Windows')) {
            return 'PC Windows';
        }
        if (str_contains($userAgent, 'Macintosh')) {
            return 'Mac';
        }
        if (str_contains($userAgent, 'Linux')) {
            return 'PC Linux';
        }

        return 'Dispositivo sconosciuto';
    }
}
