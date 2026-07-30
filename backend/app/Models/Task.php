<?php

namespace App\Models;

use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Observers\TaskObserver;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['project_id', 'assignee_id', 'title', 'description', 'category', 'estimated_effort', 'deadline', 'status'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::observe(TaskObserver::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(ProgressLog::class);
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'category' => TaskCategory::class,
            'estimated_effort' => 'integer',
            'status' => TaskStatus::class,
        ];
    }
}
