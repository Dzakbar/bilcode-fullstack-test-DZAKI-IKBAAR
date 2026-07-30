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
    private const array NOTES = [
        'Implemented API endpoint for user authentication',
        'Wrote unit tests for project CRUD operations',
        'Reviewed pull request for dashboard layout',
        'Fixed responsive styling on mobile navigation',
        'Refactored database queries for better performance',
        'Updated documentation for client module',
        'Debugged session timeout issue in production',
        'Added validation for project deadline field',
        'Designed UI mockups for task management page',
        'Optimized image assets for faster page load',
        'Set up CI pipeline for automated testing',
        'Migrated legacy data from old system',
        'Conducted code review for team member',
        'Resolved merge conflicts in deployment branch',
        'Integrated third-party payment gateway',
    ];

    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory()->developer(),
            'work_date' => fake()->dateTimeBetween('-2 weeks', 'now'),
            'duration_minutes' => fake()->numberBetween(30, 480),
            'note' => fake()->randomElement(self::NOTES),
        ];
    }
}
