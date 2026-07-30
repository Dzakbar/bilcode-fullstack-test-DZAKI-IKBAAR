<?php

namespace Tests\Feature;

use App\Enums\MemberProfession;
use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\ProgressLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_unauthenticated_user_cannot_list_tasks(): void
    {
        $this->getJson('/api/admin/tasks')->assertUnauthorized()->assertJsonPath('success', false);
    }

    public function test_member_cannot_access_admin_task_routes(): void
    {
        $this->actingAsMember()->getJson('/api/admin/tasks')->assertForbidden();
    }

    public function test_admin_can_list_tasks(): void
    {
        Task::factory()->count(2)->create();

        $this->actingAsAdmin()->getJson('/api/admin/tasks')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_task_listing_is_paginated(): void
    {
        Task::factory()->count(12)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_listing_includes_project_and_client(): void
    {
        $client = Client::factory()->create(['name' => 'Acme', 'company' => 'Acme Group']);
        $project = Project::factory()->for($client)->create(['name' => 'Portal']);
        Task::factory()->for($project)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.project.name', 'Portal')
            ->assertJsonPath('data.0.project.client.name', 'Acme')
            ->assertJsonMissingPath('data.0.project.client.contact');
    }

    public function test_listing_includes_assignee(): void
    {
        $member = User::factory()->developer()->create(['name' => 'Andi Pratama']);
        Task::factory()->for($member, 'assignee')->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.assignee.name', 'Andi Pratama')
            ->assertJsonMissingPath('data.0.assignee.password')
            ->assertJsonMissingPath('data.0.assignee.remember_token');
    }

    public function test_listing_includes_log_counts(): void
    {
        $task = Task::factory()->create();
        ProgressLog::factory()->for($task)->create();
        TimeLog::factory()->for($task)->create(['duration_minutes' => 45]);

        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.progress_logs_count', 1)
            ->assertJsonPath('data.0.time_logs_count', 1)
            ->assertJsonPath('data.0.total_logged_minutes', 45);
    }

    public function test_admin_can_search_task_title(): void
    {
        Task::factory()->create(['title' => 'Implement authentication API']);
        Task::factory()->create(['title' => 'Other task']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks?search=authentication')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Implement authentication API');
    }

    public function test_admin_can_search_project_name(): void
    {
        $project = Project::factory()->create(['name' => 'Mobile Reports']);
        Task::factory()->for($project)->create(['title' => 'Target']);
        Task::factory()->create(['title' => 'Other']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks?search=mobile')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Target');
    }

    public function test_admin_can_filter_by_project(): void
    {
        $project = Project::factory()->create();
        Task::factory()->for($project)->create(['title' => 'Target']);
        Task::factory()->create(['title' => 'Other']);

        $this->actingAsAdmin()->getJson("/api/admin/tasks?project_id={$project->id}")->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_by_client(): void
    {
        $client = Client::factory()->create();
        $project = Project::factory()->for($client)->create();
        Task::factory()->for($project)->create(['title' => 'Target']);
        Task::factory()->create(['title' => 'Other']);

        $this->actingAsAdmin()->getJson("/api/admin/tasks?client_id={$client->id}")->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_by_assignee(): void
    {
        $member = User::factory()->developer()->create();
        Task::factory()->for($member, 'assignee')->create(['title' => 'Target']);
        Task::factory()->create(['title' => 'Other']);

        $this->actingAsAdmin()->getJson("/api/admin/tasks?assignee_id={$member->id}")->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_by_category(): void
    {
        Task::factory()->create(['category' => TaskCategory::BACKEND]);
        Task::factory()->create(['category' => TaskCategory::DESIGN]);

        $this->actingAsAdmin()->getJson('/api/admin/tasks?category=backend')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_can_filter_by_status(): void
    {
        Task::factory()->create(['status' => TaskStatus::IN_PROGRESS]);
        Task::factory()->create(['status' => TaskStatus::TODO]);

        $this->actingAsAdmin()->getJson('/api/admin/tasks?status=in_progress')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_invalid_category_returns_validation_error(): void
    {
        $this->actingAsAdmin()->getJson('/api/admin/tasks?category=security')->assertUnprocessable()->assertJsonValidationErrors(['category']);
    }

    public function test_invalid_status_returns_validation_error(): void
    {
        $this->actingAsAdmin()->getJson('/api/admin/tasks?status=blocked')->assertUnprocessable()->assertJsonValidationErrors(['status']);
    }

    public function test_admin_can_filter_overdue_tasks(): void
    {
        Carbon::setTestNow('2026-07-27');
        Task::factory()->create(['title' => 'Overdue', 'deadline' => '2026-07-01', 'status' => TaskStatus::IN_PROGRESS]);
        Task::factory()->create(['title' => 'Done old', 'deadline' => '2026-07-01', 'status' => TaskStatus::DONE]);
        Task::factory()->create(['title' => 'Future', 'deadline' => '2026-08-01', 'status' => TaskStatus::TODO]);

        $this->actingAsAdmin()->getJson('/api/admin/tasks?overdue=true')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Overdue');
    }

    public function test_admin_can_filter_unassigned_tasks(): void
    {
        Task::factory()->unassigned()->create(['title' => 'Unassigned']);
        Task::factory()->create(['title' => 'Assigned']);

        $this->actingAsAdmin()->getJson('/api/admin/tasks?unassigned=true')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.assignee', null);
    }

    public function test_invalid_deadline_range_returns_validation_error(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/tasks?deadline_from=2026-08-01&deadline_to=2026-07-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['deadline_to']);
    }

    public function test_invalid_sort_field_is_rejected(): void
    {
        $this->actingAsAdmin()->getJson('/api/admin/tasks?sort=password')->assertUnprocessable()->assertJsonValidationErrors(['sort']);
    }

    public function test_admin_can_create_a_task(): void
    {
        $project = Project::factory()->create();
        $member = User::factory()->developer()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', [
                'project_id' => $project->id,
                'assignee_id' => $member->id,
                'title' => 'Implement authentication API',
                'description' => 'Create Sanctum login and role authorization.',
                'category' => TaskCategory::BACKEND->value,
                'estimated_effort' => 8,
                'deadline' => '2026-08-05',
                'status' => TaskStatus::TODO->value,
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Task created successfully')
            ->assertJsonPath('data.title', 'Implement authentication API')
            ->assertJsonPath('data.assignee.id', $member->id)
            ->assertJsonPath('data.project.id', $project->id);
    }

    public function test_task_status_defaults_to_todo(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', [
                'project_id' => $project->id,
                'title' => 'Default status task',
                'category' => TaskCategory::BACKEND->value,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', TaskStatus::TODO->value);
    }

    public function test_assignee_may_be_null(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', [
                'project_id' => $project->id,
                'assignee_id' => null,
                'title' => 'Unassigned task',
                'category' => TaskCategory::QA->value,
            ])
            ->assertCreated()
            ->assertJsonPath('data.assignee', null);
    }

    public function test_assignee_must_be_a_member(): void
    {
        $project = Project::factory()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', [
                'project_id' => $project->id,
                'assignee_id' => $admin->id,
                'title' => 'Bad assignee task',
                'category' => TaskCategory::BACKEND->value,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['assignee_id']);
    }

    public function test_admin_cannot_be_assigned(): void
    {
        $this->test_assignee_must_be_a_member();
    }

    public function test_project_must_exist(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', [
                'project_id' => 999999,
                'title' => 'Invalid project',
                'category' => TaskCategory::BACKEND->value,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['project_id']);
    }

    public function test_category_is_required(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()->postJson('/api/admin/tasks', ['project_id' => $project->id, 'title' => 'No category'])->assertUnprocessable()->assertJsonValidationErrors(['category']);
    }

    public function test_title_is_required(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()->postJson('/api/admin/tasks', ['project_id' => $project->id, 'title' => ' ', 'category' => TaskCategory::BACKEND->value])->assertUnprocessable()->assertJsonValidationErrors(['title']);
    }

    public function test_estimated_effort_must_be_positive_integer(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', ['project_id' => $project->id, 'title' => 'Bad effort', 'category' => TaskCategory::BACKEND->value, 'estimated_effort' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['estimated_effort']);
    }

    public function test_admin_can_show_a_task(): void
    {
        $task = Task::factory()->create(['title' => 'Visible task']);

        $this->actingAsAdmin()->getJson("/api/admin/tasks/{$task->id}")->assertOk()->assertJsonPath('data.title', 'Visible task');
    }

    public function test_missing_task_returns_consistent_not_found_json(): void
    {
        $this->actingAsAdmin()->getJson('/api/admin/tasks/999999')->assertNotFound()->assertJson(['success' => false, 'message' => 'Resource not found.', 'errors' => []]);
    }

    public function test_admin_can_partially_update_a_task(): void
    {
        $task = Task::factory()->create(['status' => TaskStatus::TODO]);

        $this->actingAsAdmin()->patchJson("/api/admin/tasks/{$task->id}", ['status' => TaskStatus::REVIEW->value])->assertOk()->assertJsonPath('data.status', TaskStatus::REVIEW->value);
    }

    public function test_omitted_fields_remain_unchanged(): void
    {
        $task = Task::factory()->create(['title' => 'Original', 'description' => 'Old', 'category' => TaskCategory::DESIGN]);

        $this->actingAsAdmin()
            ->patchJson("/api/admin/tasks/{$task->id}", ['status' => TaskStatus::DONE->value])
            ->assertOk()
            ->assertJsonPath('data.title', 'Original')
            ->assertJsonPath('data.description', 'Old')
            ->assertJsonPath('data.category', TaskCategory::DESIGN->value);
    }

    public function test_admin_can_unassign_a_task(): void
    {
        $task = Task::factory()->create();

        $this->actingAsAdmin()->patchJson("/api/admin/tasks/{$task->id}", ['assignee_id' => null])->assertOk()->assertJsonPath('data.assignee', null);
    }

    public function test_admin_can_reassign_a_task(): void
    {
        $task = Task::factory()->create();
        $member = User::factory()->designer()->create();

        $this->actingAsAdmin()->patchJson("/api/admin/tasks/{$task->id}", ['assignee_id' => $member->id])->assertOk()->assertJsonPath('data.assignee.id', $member->id);
    }

    public function test_admin_can_move_task_to_another_project(): void
    {
        $task = Task::factory()->create();
        $newProject = Project::factory()->create();

        $this->actingAsAdmin()->patchJson("/api/admin/tasks/{$task->id}", ['project_id' => $newProject->id])->assertOk()->assertJsonPath('data.project.id', $newProject->id);
    }

    public function test_member_cannot_create_update_or_delete_admin_tasks(): void
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create();
        $memberRequest = $this->actingAsMember();

        $memberRequest->postJson('/api/admin/tasks', ['project_id' => $project->id, 'title' => 'Blocked', 'category' => TaskCategory::BACKEND->value])->assertForbidden();
        $memberRequest->patchJson("/api/admin/tasks/{$task->id}", ['title' => 'Blocked'])->assertForbidden();
        $memberRequest->deleteJson("/api/admin/tasks/{$task->id}")->assertForbidden();
    }

    public function test_admin_can_delete_a_task_without_logs(): void
    {
        $task = Task::factory()->create();

        $this->actingAsAdmin()->deleteJson("/api/admin/tasks/{$task->id}")->assertOk()->assertJsonPath('message', 'Task deleted successfully');
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_task_with_progress_logs_cannot_be_deleted(): void
    {
        $task = Task::factory()->create();
        ProgressLog::factory()->for($task)->create();

        $this->actingAsAdmin()->deleteJson("/api/admin/tasks/{$task->id}")->assertConflict()->assertJsonValidationErrors(['task']);
    }

    public function test_task_with_time_logs_cannot_be_deleted(): void
    {
        $task = Task::factory()->create();
        TimeLog::factory()->for($task)->create();

        $this->actingAsAdmin()->deleteJson("/api/admin/tasks/{$task->id}")->assertConflict()->assertJsonValidationErrors(['task']);
    }

    public function test_blocked_deletion_returns_http_409(): void
    {
        $task = Task::factory()->create();
        TimeLog::factory()->for($task)->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/tasks/{$task->id}")
            ->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Task cannot be deleted because it has work history',
                'errors' => ['task' => ['Remove the related progress and time logs before deleting this task.']],
            ]);
    }

    public function test_task_response_does_not_expose_unexpected_user_fields(): void
    {
        $task = Task::factory()->create();

        $this->actingAsAdmin()
            ->getJson("/api/admin/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.assignee.password')
            ->assertJsonMissingPath('data.assignee.remember_token')
            ->assertJsonMissingPath('data.assignee.tokens')
            ->assertJsonMissingPath('data.progress_logs')
            ->assertJsonMissingPath('data.time_logs');
    }

    public function test_validation_errors_follow_consistent_json(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/tasks', ['title' => '', 'category' => 'bad'])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed')
            ->assertJsonValidationErrors(['project_id', 'title', 'category']);
    }

    public function test_admin_can_list_members(): void
    {
        User::factory()->developer()->create(['name' => 'Andi Pratama']);

        $this->actingAsAdmin()->getJson('/api/admin/members')->assertOk()->assertJsonPath('message', 'Members retrieved successfully')->assertJsonPath('data.0.name', 'Andi Pratama');
    }

    public function test_member_list_excludes_admin_users(): void
    {
        User::factory()->admin()->create(['email' => 'admin-only@example.test']);
        User::factory()->developer()->create(['email' => 'member@example.test']);

        $response = $this->actingAsAdmin()->getJson('/api/admin/members')->assertOk();

        $response->assertJsonMissingPath('data.1');
        $this->assertSame('member@example.test', $response->json('data.0.email'));
    }

    public function test_member_list_supports_profession_filter(): void
    {
        User::factory()->developer()->create(['name' => 'Andi Pratama']);
        User::factory()->designer()->create(['name' => 'Citra Dewi']);

        $this->actingAsAdmin()->getJson('/api/admin/members?profession=designer')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.profession', MemberProfession::DESIGNER->value);
    }

    public function test_member_list_includes_assigned_tasks_count(): void
    {
        $member = User::factory()->developer()->create();
        Task::factory()->for($member, 'assignee')->count(2)->create();

        $this->actingAsAdmin()->getJson('/api/admin/members')->assertOk()->assertJsonPath('data.0.assigned_tasks_count', 2);
    }

    private function actingAsAdmin(): self
    {
        $admin = User::factory()->admin()->create();

        return $this->withToken($admin->createToken('admin-test')->plainTextToken);
    }

    private function actingAsMember(): self
    {
        $member = User::factory()->developer()->create();

        return $this->withToken($member->createToken('member-test')->plainTextToken);
    }
}
