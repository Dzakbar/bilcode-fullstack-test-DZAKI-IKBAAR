<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\TimeLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function workHours(Request $request): JsonResponse
    {
        $query = TimeLog::query()
            ->with(['task.project.client', 'user']);

        if ($request->filled('project_id')) {
            $query->whereHas('task', fn ($q) => $q->where('project_id', $request->integer('project_id')));
        }

        if ($request->filled('member_id')) {
            $query->where('user_id', $request->integer('member_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('work_date', '>=', Carbon::parse($request->date('date_from')));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('work_date', '<=', Carbon::parse($request->date('date_to')));
        }

        $logs = $query->orderBy('work_date', 'desc')->orderBy('created_at', 'desc')->get();

        $rows = $logs->map(fn (TimeLog $log) => [
            'id' => $log->id,
            'work_date' => $log->work_date?->toDateString(),
            'member_id' => $log->user?->id,
            'member_name' => $log->user?->name,
            'member_profession' => $log->user?->profession?->value,
            'project_id' => $log->task?->project?->id,
            'project_name' => $log->task?->project?->name,
            'task_id' => $log->task_id,
            'task_title' => $log->task?->title,
            'duration_minutes' => $log->duration_minutes,
            'duration_hours' => round($log->duration_minutes / 60, 2),
            'note' => $log->note,
        ]);

        $summary = [
            'total_logs' => $rows->count(),
            'total_minutes' => $rows->sum('duration_minutes'),
            'total_hours' => round($rows->sum('duration_minutes') / 60, 2),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Work hours report retrieved successfully',
            'data' => [
                'rows' => $rows,
                'summary' => $summary,
                'filters' => [
                    'project_id' => $request->input('project_id'),
                    'member_id' => $request->input('member_id'),
                    'date_from' => $request->input('date_from'),
                    'date_to' => $request->input('date_to'),
                ],
            ],
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = TimeLog::query()
            ->with(['task.project.client', 'user']);

        if ($request->filled('project_id')) {
            $query->whereHas('task', fn ($q) => $q->where('project_id', $request->integer('project_id')));
        }

        if ($request->filled('member_id')) {
            $query->where('user_id', $request->integer('member_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('work_date', '>=', Carbon::parse($request->date('date_from')));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('work_date', '<=', Carbon::parse($request->date('date_to')));
        }

        $logs = $query->orderBy('work_date', 'desc')->orderBy('created_at', 'desc')->get();

        $filename = 'work-hours-report-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Date',
                'Member Name',
                'Profession',
                'Project',
                'Task',
                'Duration (minutes)',
                'Duration (hours)',
                'Note',
            ]);

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->work_date?->toDateString(),
                    $log->user?->name ?? '',
                    $log->user?->profession?->value ?? '',
                    $log->task?->project?->name ?? '',
                    $log->task?->title ?? '',
                    $log->duration_minutes,
                    round($log->duration_minutes / 60, 2),
                    $log->note ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }

    public function projects(): JsonResponse
    {
        $projects = Project::query()
            ->withCount('tasks')
            ->withSum('tasks', 'estimated_effort')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status->value,
                'client_name' => $project->client?->name,
                'tasks_count' => $project->tasks_count,
                'total_estimated_hours' => $project->tasks_sum_estimated_effort ?? 0,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Projects retrieved successfully',
            'data' => $projects,
        ]);
    }
}
