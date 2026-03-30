<?php

namespace App\Enums;

enum ProjectExpenseStatus: string
{
    case Draft = 'draft';                 // Bozza
    case Submitted = 'submitted';         // Inviato, in attesa approvazione
    case AutoApproved = 'auto_approved';  // Approvato automaticamente (sotto soglia)
    case Approved = 'approved';           // Approvato manualmente dal PM
    case Rejected = 'rejected';           // Respinto
}
