<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Admin: list the authenticated admin's notifications.
     *
     * Query params:
     *   - is_read: '0' | '1'   filter by read state
     *   - type:    string      filter by notification type
     *   - per_page: int        defaults to 15 (header dropdown can pass 5)
     *
     * meta.unread_count is the admin's TOTAL unread count (not just the
     * current page), so the header badge stays correct across pagination.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Notification::where('user_id', $user->id);

        if ($request->has('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        $notifications = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return NotificationResource::collection($notifications)->additional([
            'success' => true,
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * Admin: view a single notification's full detail.
     */
    public function show(Request $request, Notification $notification)
    {
        $this->authorizeOwner($request, $notification);

        return response()->json([
            'success' => true,
            'data' => new NotificationResource($notification),
        ]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        $this->authorizeOwner($request, $notification);

        if (! $notification->is_read) {
            $notification->update(['is_read' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
            'data' => new NotificationResource($notification),
        ]);
    }

    public function markUnread(Request $request, Notification $notification)
    {
        $this->authorizeOwner($request, $notification);

        if ($notification->is_read) {
            $notification->update(['is_read' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as unread.',
            'data' => new NotificationResource($notification),
        ]);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    public function destroy(Request $request, Notification $notification)
    {
        $this->authorizeOwner($request, $notification);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted.',
        ]);
    }

    /**
     * Each admin only ever sees/touches their own notification rows -
     * route model binding resolves the record, but doesn't know whose it
     * is, so ownership is checked explicitly here.
     */
    private function authorizeOwner(Request $request, Notification $notification): void
    {
        abort_if($notification->user_id !== $request->user()->id, 403, 'Forbidden.');
    }
}
