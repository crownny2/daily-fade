<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BarberResource;
use App\Models\Barber;

class BarberController extends Controller
{
    /**
     * Public: list all active barbers. Used by the customer frontend
     * (barbers page, booking wizard). No auth required.
     */
    public function index()
    {
        $barbers = Barber::with('user')
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => BarberResource::collection($barbers),
        ]);
    }
}
