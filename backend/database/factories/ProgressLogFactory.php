<?php

namespace Database\Factories;

use App\Models\ProgressLog;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProgressLog>
 */
class ProgressLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory()->developer(),
            'note' => fake()->paragraph(),
        ];
    }
}
