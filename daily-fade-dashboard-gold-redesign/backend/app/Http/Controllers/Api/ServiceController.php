<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;

class ServiceController extends Controller
{
    /**
     * Public: list all active services. Used by the customer frontend
     * (services page, booking wizard). No auth required.
     */
    public function index()
    {
        $services = Service::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ServiceResource::collection($services),
        ]);
    }
}
