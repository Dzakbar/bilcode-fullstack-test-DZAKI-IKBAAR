<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category?->value,
            'estimated_effort' => $this->estimated_effort,
            'deadline' => $this->deadline?->toDateString(),
            'status' => $this->status?->value,
            'project' => $this->whenLoaded('project', fn () => [
                'id' => $this->project->id,
                'name' => $this->project->name,
                'status' => $this->project->status?->value,
                'client' => $this->project->relationLoaded('client') && $this->project->client ? [
                    'id' => $this->project->client->id,
                    'name' => $this->project->client->name,
                    'company' => $this->project->client->company,
                ] : null,
            ]),
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
                'email' => $this->assignee->email,
                'profession' => $this->assignee->profession?->value,
            ] : null),
            'progress_logs_count' => $this->whenCounted('progressLogs'),
            'time_logs_count' => $this->whenCounted('timeLogs'),
            'total_logged_minutes' => $this->when(isset($this->time_logs_sum_duration_minutes), (int) $this->time_logs_sum_duration_minutes),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
