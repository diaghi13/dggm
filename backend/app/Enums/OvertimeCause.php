<?php

namespace App\Enums;

enum OvertimeCause: string
{
    case ClientRequest = 'client_request';
    case ProjectDelayOurFault = 'project_delay_our_fault';
    case ProjectDelayClientFault = 'project_delay_client_fault';
    case Weather = 'weather';
    case Unforeseen = 'unforeseen';
}
