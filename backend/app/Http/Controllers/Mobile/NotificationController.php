<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->with('task:id,title')
            ->orderBy('created_at', 'desc')
            ->get();

        $unreadCount = $notifications->whereNull('read_at')->count();

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
            'meta' => [
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden.',
            ], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification,
        ]);
    }
}
