<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable;

    public function __construct(
        string $token,
        public readonly string $companyName,
    ) {
        parent::__construct($token);
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $resetUrl = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject('Ripristino Password - '.$this->companyName)
            ->greeting('Ciao '.($notifiable->name ?? '').', ')
            ->line('Abbiamo ricevuto una richiesta di ripristino della password per il tuo account.')
            ->action('Reimposta la Password', $resetUrl)
            ->line('Il link è valido per **'.config('auth.passwords.global_users.expire', 60).' minuti**.')
            ->line('Se non hai richiesto il ripristino della password, ignora questa email — il tuo account è al sicuro.')
            ->salutation('Cordiali saluti, Il team di '.$this->companyName);
    }
}
