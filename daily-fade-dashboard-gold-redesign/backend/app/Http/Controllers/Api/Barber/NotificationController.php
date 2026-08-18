<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/barber/notifications
     * Same shape/logic as Api\Admin\NotificationController::index() - the
     * Notification table is already scoped by user_id, not by role, so
     * "which notifications does this account see" only ever depends on
     * $request->user()->id here. Reuses Admin\NotificationResource as-is
     * since its output isn't admin-specific.
     *
     * meta.unread_count is the barber's TOTAL unread count (not just the
     * current page), so a header badge stays correct across pagination.
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
     * PATCH /api/barber/notifications/{notification}/read
     * Route model binding resolves the record but doesn't know whose it
     * is - ownership is checked explicitly so Barber 1 can never mark (or
     * even discover the existence of) Barber 2's notification.
     */
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

    /**
     * PATCH /api/barber/notifications/read-all
     */
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

    private function authorizeOwner(Request $request, Notification $notification): void
    {
        abort_if($notification->user_id !== $request->user()->id, 403, 'Forbidden.');
    }
}
