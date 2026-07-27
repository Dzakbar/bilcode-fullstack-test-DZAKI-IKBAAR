<?php

namespace Database\Factories;

use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'assignee_id' => User::factory()->developer(),
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'category' => fake()->randomElement(TaskCategory::cases()),
            'estimated_effort' => fake()->numberBetween(1, 40),
            'deadline' => fake()->optional()->dateTimeBetween('+1 week', '+2 months'),
            'status' => TaskStatus::TODO,
        ];
    }

    public function unassigned(): static
    {
        return $this->state(fn (array $attributes) => [
            'assignee_id' => null,
        ]);
    }

    public function status(TaskStatus $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
        ]);
    }
}
