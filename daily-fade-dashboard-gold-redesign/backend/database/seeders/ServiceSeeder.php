<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $services = [
            ['name' => 'Regular Haircut', 'description' => 'Classic haircut with clipper and scissor work.', 'duration_minutes' => 30, 'price' => 150],
            ['name' => 'Signature Haircut', 'description' => 'Precision haircut with styling and hot towel finish.', 'duration_minutes' => 45, 'price' => 250],
            ['name' => 'Beard Trim', 'description' => 'Beard shaping and lineup.', 'duration_minutes' => 20, 'price' => 100],
            ['name' => 'Hot Towel Shave', 'description' => 'Traditional straight razor shave with hot towel treatment.', 'duration_minutes' => 30, 'price' => 180],
            ['name' => 'Hair Color', 'description' => 'Full hair coloring service.', 'duration_minutes' => 60, 'price' => 500],
            ['name' => 'Kids Haircut', 'description' => 'Haircut for kids 10 years old and below.', 'duration_minutes' => 25, 'price' => 120],
            ['name' => 'Hair Spa', 'description' => 'Deep conditioning hair and scalp treatment.', 'duration_minutes' => 45, 'price' => 350],
            ['name' => 'Combo: Haircut + Beard Trim', 'description' => 'Full grooming package: haircut and beard trim.', 'duration_minutes' => 50, 'price' => 220],
        ];

        foreach ($services as &$service) {
            $service['is_active'] = true;
            $service['created_at'] = $now;
            $service['updated_at'] = $now;
        }
        unset($service);

        // Safe to re-run: clear old rows, then insert everything in a single bulk query.
        Service::query()->delete();
        Service::insert($services);
    }
}