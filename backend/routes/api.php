<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
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
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function (): void {
        Route::apiResource('clients', ClientController::class);
    });
