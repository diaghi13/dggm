<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    /**
     * Get the mail representation of the notification.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl($notifiable);
        $companyName = \App\Models\Setting::get('company.name') ?? config('app.name');

        return (new MailMessage)
            ->subject('Ripristino Password - '.$companyName)
            ->greeting('Ciao '.($notifiable->name ?? '').', ')
            ->line('Abbiamo ricevuto una richiesta di ripristino della password per il tuo account.')
            ->action('Reimposta la Password', $resetUrl)
            ->line('Il link è valido per **'.config('auth.passwords.global_users.expire', 60).' minuti**.')
            ->line('Se non hai richiesto il ripristino della password, ignora questa email — il tuo account è al sicuro.')
            ->salutation('Cordiali saluti, Il team di '.$companyName);
    }
}
