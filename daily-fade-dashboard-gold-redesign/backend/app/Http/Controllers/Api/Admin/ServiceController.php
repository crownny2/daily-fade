<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * Admin: list all services (active + inactive), with optional search/status filter.
     */
    public function index(Request $request)
    {
        $query = Service::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->string('status') === 'active');
        }

        $services = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => ServiceResource::collection($services),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service created.',
            'data' => new ServiceResource($service),
        ], 201);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated.',
            'data' => new ServiceResource($service->fresh()),
        ]);
    }

    /**
     * Quick activate/deactivate toggle, used by the "Active/Inactive" switch in the admin UI.
     */
    public function toggleStatus(Service $service)
    {
        $service->update(['is_active' => ! $service->is_active]);

        return response()->json([
            'success' => true,
            'message' => $service->is_active ? 'Service activated.' : 'Service deactivated.',
            'data' => new ServiceResource($service->fresh()),
        ]);
    }

    /**
     * Delete when safe (no appointments reference this service). Otherwise,
     * deactivate instead of deleting so existing appointment history stays intact.
     */
    public function destroy(Service $service)
    {
        if ($service->appointments()->exists()) {
            $service->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'This service has existing appointments, so it was deactivated instead of deleted.',
                'data' => new ServiceResource($service->fresh()),
            ]);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted.',
        ]);
    }
}
