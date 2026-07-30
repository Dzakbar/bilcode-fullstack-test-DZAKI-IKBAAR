<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'ProjectPulse backend is healthy',
        'data' => [
            'status' => 'ok',
            'service' => 'projectpulse-backend',
        ],
    ]);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/member/login', [AuthController::class, 'memberLogin']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function (): void {
    // Legacy routes removed to prevent 404 conflicts.
    // Use /admin/clients and /admin/projects instead.
});

// Mobile API routes (accessible by any authenticated user, role check in controller)
Route::middleware('auth:sanctum')->prefix('mobile')->group(function (): void {
    Route::get('/profile', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::get('/tasks', [\App\Http\Controllers\Mobile\MemberTaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}/status', [\App\Http\Controllers\Mobile\MemberTaskController::class, 'updateStatus']);
    Route::post('/tasks/{task}/time-logs', [\App\Http\Controllers\Mobile\TimeLogController::class, 'store']);
    Route::get('/tasks/{task}/time-logs', [\App\Http\Controllers\Mobile\TimeLogController::class, 'index']);
    Route::get('/notifications', [\App\Http\Controllers\Mobile\NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [\App\Http\Controllers\Mobile\NotificationController::class, 'markAsRead']);
});

Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function (): void {
        Route::apiResource('clients', ClientController::class);
        Route::apiResource('projects', ProjectController::class);
        Route::apiResource('tasks', TaskController::class);
        Route::get('members', [MemberController::class, 'index']);
        Route::get('dashboard/summary', [\App\Http\Controllers\DashboardController::class, 'summary']);

        Route::prefix('ai')->group(function (): void {
            Route::post('/breakdown', [\App\Http\Controllers\Admin\AIController::class, 'breakdown']);
            Route::post('/save-tasks', [\App\Http\Controllers\Admin\AIController::class, 'saveTasks']);
        });
    });

