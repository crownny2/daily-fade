<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// TEMPORARY: one-time reset+seed route for Render free tier (no Shell access).
// Remove this route after seeding once.
Route::get('/internal/seed-once/{key}', function (string $key) {
    if ($key !== 'ac4f6ea4693629473f982718e06c1f86') {
        abort(404);
    }

    Artisan::call('migrate:fresh', [
        '--seed' => true,
        '--force' => true,
    ]);

    return response(Artisan::output())->header('Content-Type', 'text/plain');
});