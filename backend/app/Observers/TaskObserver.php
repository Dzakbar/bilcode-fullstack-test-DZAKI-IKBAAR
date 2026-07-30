<?php

namespace App\Observers;

use App\Models\Notification;
use App\Models\Task;

class TaskObserver
{
    public function created(Task $task): void
    {
        if ($task->assignee_id) {
            $this->createNotification($task, 'task_assigned');
        }
    }

    public function updated(Task $task): void
    {
        if ($task->isDirty('assignee_id') && $task->assignee_id) {
            $this->createNotification($task, 'task_assigned');
        }
    }

    private function createNotification(Task $task, string $type): void
    {
        Notification::create([
            'user_id' => $task->assignee_id,
            'task_id' => $task->id,
            'type' => $type,
            'message' => "New task: {$task->title}",
        ]);
    }
}
