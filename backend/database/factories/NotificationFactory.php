<?php

namespace Database\Factories;

use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->developer(),
            'task_id' => Task::factory(),
            'type' => fake()->randomElement(NotificationType::cases()),
            'message' => fake()->sentence(),
            'read_at' => fake()->optional()->dateTimeBetween('-1 week', 'now'),
        ];
    }
}
