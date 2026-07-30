<?php

namespace Tests\Feature;

use App\Enums\MemberProfession;
use App\Enums\NotificationType;
use App\Enums\ProjectStatus;
use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Notification;
use App\Models\ProgressLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DomainModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_migrations_create_domain_tables(): void
    {
        foreach (['clients', 'projects', 'tasks', 'progress_logs', 'time_logs', 'notifications'] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Expected table [{$table}] to exist.");
        }

        $this->assertTrue(Schema::hasColumns('users', ['role', 'profession']));
        $this->assertTrue(Schema::hasColumns('tasks', ['project_id', 'assignee_id', 'category', 'estimated_effort', 'deadline', 'status']));
    }

    public function test_client_has_many_projects(): void
    {
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();

        $this->assertTrue($client->projects->contains($project));
    }

    public function test_project_belongs_to_client_and_has_many_tasks(): void
    {
        $project = Project::factory()->create();
        $task = Task::factory()->for($project)->create();

        $this->assertTrue($project->client->is($project->client()->first()));
        $this->assertTrue($project->tasks->contains($task));
    }

    public function test_task_belongs_to_project_and_optional_assignee(): void
    {
        $project = Project::factory()->create();
        $assignee = User::factory()->developer()->create();
        $assignedTask = Task::factory()->for($project)->for($assignee, 'assignee')->create();
        $unassignedTask = Task::factory()->for($project)->unassigned()->create();

        $this->assertTrue($assignedTask->project->is($project));
        $this->assertTrue($assignedTask->assignee->is($assignee));
        $this->assertNull($unassignedTask->assignee);
    }

    public function test_user_has_assigned_tasks(): void
    {
        $user = User::factory()->developer()->create();
        $task = Task::factory()->for($user, 'assignee')->create();

        $this->assertTrue($user->assignedTasks->contains($task));
    }

    public function test_progress_log_belongs_to_task_and_user(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->developer()->create();
        $progressLog = ProgressLog::factory()->for($task)->for($user)->create();

        $this->assertTrue($progressLog->task->is($task));
        $this->assertTrue($progressLog->user->is($user));
    }

    public function test_time_log_belongs_to_task_and_user(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->developer()->create();
        $timeLog = TimeLog::factory()->for($task)->for($user)->create();

        $this->assertTrue($timeLog->task->is($task));
        $this->assertTrue($timeLog->user->is($user));
    }

    public function test_notification_belongs_to_user_and_optional_task(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->developer()->create();
        $taskNotification = Notification::factory()->for($user)->for($task)->create();
        $generalNotification = Notification::factory()->for($user)->create(['task_id' => null]);

        $this->assertTrue($taskNotification->user->is($user));
        $this->assertTrue($taskNotification->task->is($task));
        $this->assertNull($generalNotification->task);
    }

    public function test_enum_casts_return_php_enum_values(): void
    {
        $user = User::factory()->developer()->create();
        $project = Project::factory()->create(['status' => ProjectStatus::ACTIVE]);
        $task = Task::factory()->create([
            'category' => TaskCategory::BACKEND,
            'status' => TaskStatus::IN_PROGRESS,
        ]);
        $defaultTask = Task::factory()->create();
        $notification = Notification::factory()->create(['type' => NotificationType::TASK_ASSIGNED]);

        $this->assertSame(UserRole::MEMBER, $user->role);
        $this->assertSame(MemberProfession::DEVELOPER, $user->profession);
        $this->assertSame(ProjectStatus::ACTIVE, $project->status);
        $this->assertSame(TaskCategory::BACKEND, $task->category);
        $this->assertSame(TaskStatus::IN_PROGRESS, $task->status);
        $this->assertSame(TaskStatus::TODO, $defaultTask->status);
        $this->assertSame(NotificationType::TASK_ASSIGNED, $notification->type);
    }

    public function test_seeder_creates_expected_development_users(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@projectpulse.test',
            'role' => UserRole::ADMIN->value,
            'profession' => null,
        ]);

        foreach (['developer1@projectpulse.test', 'developer2@projectpulse.test', 'designer1@projectpulse.test'] as $email) {
            $this->assertDatabaseHas('users', [
                'email' => $email,
                'role' => UserRole::MEMBER->value,
            ]);
        }

        $this->assertSame(5, Client::count());
        $this->assertSame(5, Project::count());
        $this->assertGreaterThanOrEqual(8, Task::count());
        $this->assertGreaterThanOrEqual(3, ProgressLog::count());
        $this->assertGreaterThanOrEqual(3, TimeLog::count());
        $this->assertGreaterThanOrEqual(4, Notification::count());
    }
}
