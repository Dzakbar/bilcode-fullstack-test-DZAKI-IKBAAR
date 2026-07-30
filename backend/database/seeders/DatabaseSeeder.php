<?php

namespace Database\Seeders;

use App\Enums\NotificationType;
use App\Enums\ProjectStatus;
use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Notification;
use App\Models\ProgressLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Development-only credentials:
        // admin@projectpulse.test / password
        // developer1@projectpulse.test / password
        // developer2@projectpulse.test / password
        // designer1@projectpulse.test / password
        $admin = User::factory()->admin()->create([
            'name' => 'ProjectPulse Admin',
            'email' => 'admin@projectpulse.test',
            'password' => 'password',
        ]);

        $developerOne = User::factory()->developer()->create([
            'name' => 'Andi Pratama',
            'email' => 'developer1@projectpulse.test',
            'password' => 'password',
        ]);

        $developerTwo = User::factory()->developer()->create([
            'name' => 'Budi Santoso',
            'email' => 'developer2@projectpulse.test',
            'password' => 'password',
        ]);

        $designer = User::factory()->designer()->create([
            'name' => 'Citra Dewi',
            'email' => 'designer1@projectpulse.test',
            'password' => 'password',
        ]);

        $clients = collect([
            Client::factory()->create([
                'name' => 'Acme Operations',
                'email' => 'ops@acme.test',
                'company' => 'Acme',
            ]),
            Client::factory()->create([
                'name' => 'Northwind Studio',
                'email' => 'hello@northwind.test',
                'company' => 'Northwind',
            ]),
            Client::factory()->create([
                'name' => 'Merpati Teknologi',
                'email' => 'info@merpati-tekno.test',
                'company' => 'Merpati Teknologi',
            ]),
            Client::factory()->create([
                'name' => 'Garuda Digital Solutions',
                'email' => 'hello@garudadigital.test',
                'company' => 'Garuda Digital',
            ]),
            Client::factory()->create([
                'name' => 'Bumi Resources',
                'email' => 'it@bumiresources.test',
                'company' => 'Bumi Resources',
            ]),
        ]);

        $projects = collect([
            Project::factory()->for($clients[0])->create([
                'name' => 'Client Portal Foundation',
                'status' => ProjectStatus::PLANNING,
            ]),
            Project::factory()->for($clients[0])->create([
                'name' => 'Internal Project Tracker',
                'status' => ProjectStatus::ACTIVE,
            ]),
            Project::factory()->for($clients[1])->create([
                'name' => 'Mobile Reporting Workflow',
                'status' => ProjectStatus::COMPLETED,
            ]),
            Project::factory()->for($clients[2])->create([
                'name' => 'E-Commerce Platform',
                'status' => ProjectStatus::PLANNING,
            ]),
            Project::factory()->for($clients[3])->create([
                'name' => 'Mobile App Redesign',
                'status' => ProjectStatus::ACTIVE,
            ]),
        ]);

        $tasks = collect([
            Task::factory()->for($projects[0])->for($developerOne, 'assignee')->status(TaskStatus::TODO)->create([
                'title' => 'Create Laravel API foundation',
                'category' => TaskCategory::BACKEND,
            ]),
            Task::factory()->for($projects[1])->for($developerTwo, 'assignee')->status(TaskStatus::IN_PROGRESS)->create([
                'title' => 'Build dashboard shell',
                'category' => TaskCategory::FRONTEND,
            ]),
            Task::factory()->for($projects[1])->for($designer, 'assignee')->status(TaskStatus::REVIEW)->create([
                'title' => 'Review monochrome UI flow',
                'category' => TaskCategory::DESIGN,
            ]),
            Task::factory()->for($projects[2])->for($developerOne, 'assignee')->status(TaskStatus::DONE)->create([
                'title' => 'Validate mobile task navigation',
                'category' => TaskCategory::QA,
            ]),
            Task::factory()->for($projects[3])->status(TaskStatus::TODO)->create([
                'title' => 'Design product catalog schema',
                'category' => TaskCategory::BACKEND,
            ]),
            Task::factory()->for($projects[3])->status(TaskStatus::TODO)->create([
                'title' => 'Setup payment gateway integration',
                'category' => TaskCategory::BACKEND,
            ]),
            Task::factory()->for($projects[4])->for($developerTwo, 'assignee')->status(TaskStatus::TODO)->create([
                'title' => 'Implement new design system tokens',
                'category' => TaskCategory::FRONTEND,
            ]),
            Task::factory()->for($projects[4])->for($designer, 'assignee')->status(TaskStatus::IN_PROGRESS)->create([
                'title' => 'Create component mockups',
                'category' => TaskCategory::DESIGN,
            ]),
        ]);

        ProgressLog::factory()->for($tasks[1])->for($developerTwo, 'user')->count(2)->create();
        ProgressLog::factory()->for($tasks[2])->for($designer, 'user')->create();

        TimeLog::factory()->for($tasks[1])->for($developerTwo, 'user')->count(2)->create();
        TimeLog::factory()->for($tasks[2])->for($designer, 'user')->create();

        Notification::factory()->for($developerOne, 'user')->for($tasks[0])->create([
            'type' => NotificationType::TASK_ASSIGNED,
            'message' => 'You have been assigned to Create Laravel API foundation.',
            'read_at' => null,
        ]);

        Notification::factory()->for($designer, 'user')->for($tasks[2])->create([
            'type' => NotificationType::DEADLINE_REMINDER,
            'message' => 'Review deadline is approaching.',
            'read_at' => null,
        ]);

        Notification::factory()->for($developerTwo, 'user')->for($tasks[6])->create([
            'type' => NotificationType::TASK_ASSIGNED,
            'message' => 'You have been assigned to Implement new design system tokens.',
            'read_at' => null,
        ]);

        Notification::factory()->for($admin, 'user')->create([
            'task_id' => null,
            'type' => NotificationType::DEADLINE_REMINDER,
            'message' => 'ProjectPulse foundation seed data is ready.',
            'read_at' => now(),
        ]);
    }
}
