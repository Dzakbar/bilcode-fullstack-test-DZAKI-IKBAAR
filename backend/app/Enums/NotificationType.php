<?php

namespace App\Enums;

enum NotificationType: string
{
    case TASK_ASSIGNED = 'task_assigned';
    case DEADLINE_REMINDER = 'deadline_reminder';
}
