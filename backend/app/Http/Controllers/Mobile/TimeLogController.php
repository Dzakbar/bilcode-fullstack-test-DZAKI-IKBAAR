<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeLogController extends Controller
{
    public function index(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        if ($task->assignee_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only view logs for tasks assigned to you.',
            ], 403);
        }

        $logs = TimeLog::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Time logs retrieved successfully',
            'data' => $logs,
        ]);
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        if ($task->assignee_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only log time for tasks assigned to you.',
            ], 403);
        }

        $validated = $request->validate([
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'note' => ['nullable', 'string', 'max:1000'],
            'work_date' => ['nullable', 'date'],
        ]);

        $log = TimeLog::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'work_date' => $validated['work_date'] ?? today(),
            'duration_minutes' => $validated['duration_minutes'],
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Time log created successfully',
            'data' => $log,
        ], 201);
    }
}
