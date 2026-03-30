<?php

namespace App\Enums;

enum ProjectLogStatus: string
{
    case Draft = 'draft';         // Bozza (non ancora inviato)
    case Submitted = 'submitted'; // Inviato dal collaboratore, in attesa di approvazione PM
    case Approved = 'approved';   // Approvato dal PM → genera ProjectLaborCost
    case Rejected = 'rejected';   // Respinto dal PM (motivo in rejection_reason)
}
