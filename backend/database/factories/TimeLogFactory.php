<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TimeLog>
 */
class TimeLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory()->developer(),
            'work_date' => fake()->dateTimeBetween('-2 weeks', 'now'),
            'duration_minutes' => fake()->numberBetween(30, 480),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
