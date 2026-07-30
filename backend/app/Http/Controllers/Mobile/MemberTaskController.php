<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberTaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tasks = Task::with(['project.client', 'assignee'])
            ->withCount(['progressLogs', 'timeLogs'])
            ->withSum('timeLogs', 'duration_minutes')
            ->where('assignee_id', $user->id)
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Tasks retrieved successfully',
            'data' => TaskResource::collection($tasks)->resolve(),
        ]);
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:todo,in_progress,review,done'],
        ]);

        if ($task->assignee_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update tasks assigned to you.',
            ], 403);
        }

        $task->update(['status' => $validated['status']]);
        $task->load(['project.client', 'assignee']);

        return response()->json([
            'success' => true,
            'message' => 'Task status updated successfully',
            'data' => TaskResource::make($task)->resolve(),
        ]);
    }
}
