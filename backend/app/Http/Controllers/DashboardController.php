<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalClients = Client::count();
        $totalProjects = Project::count();
        $totalTasks = Task::count();
        $totalMembers = User::where('role', 'member')->count();

        $tasksByStatus = Task::query()
            ->selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $projectsByStatus = Project::query()
            ->selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $overdueTasks = Task::query()
            ->whereDate('deadline', '<', Carbon::today())
            ->whereNotIn('status', [TaskStatus::DONE->value])
            ->count();

        $recentTimeLogs = TimeLog::query()
            ->with(['user:id,name', 'task:id,title,project_id', 'task.project:id,name'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (TimeLog $log) => [
                'id' => $log->id,
                'member_name' => $log->user?->name,
                'task_title' => $log->task?->title,
                'project_name' => $log->task?->project?->name,
                'duration_minutes' => $log->duration_minutes,
                'note' => $log->note,
                'work_date' => $log->work_date?->toDateString(),
            ]);

        $memberWorkload = User::query()
            ->where('role', 'member')
            ->withCount('assignedTasks')
            ->withSum('timeLogs', 'duration_minutes')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'profession' => $user->profession?->value,
                'assigned_tasks' => $user->assigned_tasks_count,
                'total_logged_hours' => $user->time_logs_sum_duration_minutes
                    ? round($user->time_logs_sum_duration_minutes / 60, 1)
                    : 0,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard summary retrieved successfully',
            'data' => [
                'stats' => [
                    'total_clients' => $totalClients,
                    'total_projects' => $totalProjects,
                    'total_tasks' => $totalTasks,
                    'total_members' => $totalMembers,
                    'tasks_overdue' => $overdueTasks,
                    'tasks_by_status' => [
                        'todo' => (int) ($tasksByStatus['todo'] ?? 0),
                        'in_progress' => (int) ($tasksByStatus['in_progress'] ?? 0),
                        'review' => (int) ($tasksByStatus['review'] ?? 0),
                        'done' => (int) ($tasksByStatus['done'] ?? 0),
                    ],
                    'projects_by_status' => [
                        'planning' => (int) ($projectsByStatus['planning'] ?? 0),
                        'active' => (int) ($projectsByStatus['active'] ?? 0),
                        'completed' => (int) ($projectsByStatus['completed'] ?? 0),
                        'cancelled' => (int) ($projectsByStatus['cancelled'] ?? 0),
                    ],
                ],
                'recent_time_logs' => $recentTimeLogs,
                'member_workload' => $memberWorkload,
            ],
        ]);
    }
}
