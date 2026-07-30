<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Services\AIBreakdownService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIController extends Controller
{
    public function __construct(
        private readonly AIBreakdownService $aiService
    ) {}

    public function breakdown(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'prd_text' => ['required', 'string', 'min:10', 'max:50000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $tasks = $this->aiService->generateTasks($request->input('prd_text'));

            return response()->json([
                'success' => true,
                'message' => 'Tasks generated successfully',
                'data' => $tasks,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function saveTasks(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'tasks' => ['required', 'array', 'min:1', 'max:50'],
            'tasks.*.title' => ['required', 'string', 'max:255'],
            'tasks.*.description' => ['nullable', 'string', 'max:5000'],
            'tasks.*.category' => ['required', 'string', 'in:frontend,backend,design,qa'],
            'tasks.*.estimated_effort' => ['nullable', 'integer', 'min:1', 'max:80'],
            'tasks.*.status' => ['required', 'string', 'in:todo'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $saved = [];
        $projectId = $request->input('project_id');

        foreach ($request->input('tasks') as $taskData) {
            $saved[] = Task::query()->create([
                'project_id' => $projectId,
                'title' => $taskData['title'],
                'description' => $taskData['description'] ?? null,
                'category' => $taskData['category'],
                'estimated_effort' => $taskData['estimated_effort'] ?? null,
                'status' => 'todo',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($saved) . ' tasks saved successfully',
            'data' => count($saved),
        ], 201);
    }
}
