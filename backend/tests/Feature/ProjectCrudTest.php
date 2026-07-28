<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProjectCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_unauthenticated_user_cannot_list_projects(): void
    {
        $this->getJson('/api/admin/projects')
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_member_cannot_list_projects(): void
    {
        $this->actingAsMember()
            ->getJson('/api/admin/projects')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_list_projects(): void
    {
        Project::factory()->count(2)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Projects retrieved successfully')
            ->assertJsonCount(2, 'data');
    }

    public function test_project_listing_is_paginated(): void
    {
        Project::factory()->count(12)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.total', 12);
    }

    public function test_project_listing_includes_client(): void
    {
        $client = Client::factory()->create([
            'name' => 'PT Example Indonesia',
            'company' => 'Example Group',
            'email' => 'private-client@example.test',
        ]);
        Project::factory()->for($client)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects')
            ->assertOk()
            ->assertJsonPath('data.0.client.name', 'PT Example Indonesia')
            ->assertJsonPath('data.0.client.company', 'Example Group')
            ->assertJsonMissingPath('data.0.client.contact');
    }

    public function test_project_listing_includes_tasks_count(): void
    {
        $project = Project::factory()->create();
        Task::factory()->for($project)->count(2)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects')
            ->assertOk()
            ->assertJsonPath('data.0.tasks_count', 2);
    }

    public function test_admin_can_search_by_project_name(): void
    {
        Project::factory()->create(['name' => 'ProjectPulse Website']);
        Project::factory()->create(['name' => 'Other Build']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?search=projectpulse')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'ProjectPulse Website');
    }

    public function test_admin_can_search_by_brief(): void
    {
        Project::factory()->create(['brief' => 'Build an agency project management platform.']);
        Project::factory()->create(['brief' => 'Unrelated scope.']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?search=agency')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.brief', 'Build an agency project management platform.');
    }

    public function test_admin_can_search_by_client_name(): void
    {
        $client = Client::factory()->create(['name' => 'Acme Operations']);
        Project::factory()->for($client)->create(['name' => 'Internal Portal']);
        Project::factory()->create(['name' => 'Other Project']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?search=acme')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Internal Portal');
    }

    public function test_admin_can_filter_by_client_id(): void
    {
        $client = Client::factory()->create();
        Project::factory()->for($client)->create(['name' => 'Target Project']);
        Project::factory()->create(['name' => 'Other Project']);

        $this->actingAsAdmin()
            ->getJson("/api/admin/projects?client_id={$client->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Target Project');
    }

    public function test_admin_can_filter_by_status(): void
    {
        Project::factory()->create(['status' => ProjectStatus::ACTIVE]);
        Project::factory()->create(['status' => ProjectStatus::PLANNING]);

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?status=active')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', ProjectStatus::ACTIVE->value);
    }

    public function test_invalid_status_filter_returns_validation_error(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?status=archived')
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_admin_can_filter_by_deadline_range(): void
    {
        Project::factory()->create(['name' => 'Inside Range', 'deadline' => '2026-09-15']);
        Project::factory()->create(['name' => 'Outside Range', 'deadline' => '2026-11-15']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?deadline_from=2026-09-01&deadline_to=2026-09-30')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Inside Range');
    }

    public function test_invalid_deadline_range_returns_validation_error(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?deadline_from=2026-10-01&deadline_to=2026-09-01')
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['deadline_to']);
    }

    public function test_admin_can_filter_overdue_projects(): void
    {
        Carbon::setTestNow('2026-07-27');

        Project::factory()->create([
            'name' => 'Overdue Active',
            'deadline' => '2026-07-01',
            'status' => ProjectStatus::ACTIVE,
        ]);
        Project::factory()->create([
            'name' => 'Completed Historical',
            'deadline' => '2026-07-01',
            'status' => ProjectStatus::COMPLETED,
        ]);
        Project::factory()->create([
            'name' => 'Future Active',
            'deadline' => '2026-08-01',
            'status' => ProjectStatus::ACTIVE,
        ]);

        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?overdue=true')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Overdue Active');
    }

    public function test_invalid_sort_field_is_rejected(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/projects?sort=client_secret')
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['sort']);
    }

    public function test_admin_can_create_a_project(): void
    {
        $client = Client::factory()->create([
            'name' => 'PT Example Indonesia',
            'company' => 'Example Group',
        ]);

        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => 'ProjectPulse Website',
                'brief' => 'Build a project management platform for an agency.',
                'deadline' => '2026-09-30',
                'status' => ProjectStatus::PLANNING->value,
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Project created successfully')
            ->assertJsonPath('data.name', 'ProjectPulse Website')
            ->assertJsonPath('data.deadline', '2026-09-30')
            ->assertJsonPath('data.status', ProjectStatus::PLANNING->value)
            ->assertJsonPath('data.client.id', $client->id)
            ->assertJsonPath('data.tasks_count', 0);
    }

    public function test_status_defaults_to_planning(): void
    {
        $client = Client::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => 'Default Status Project',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', ProjectStatus::PLANNING->value);
    }

    public function test_client_id_must_exist(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => 999999,
                'name' => 'Invalid Client Project',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['client_id']);
    }

    public function test_project_name_is_required(): void
    {
        $client = Client::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => '   ',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_brief_may_be_null(): void
    {
        $client = Client::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => 'Null Brief Project',
                'brief' => null,
            ])
            ->assertCreated()
            ->assertJsonPath('data.brief', null);
    }

    public function test_deadline_may_be_null(): void
    {
        $client = Client::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => 'Null Deadline Project',
                'deadline' => null,
            ])
            ->assertCreated()
            ->assertJsonPath('data.deadline', null);
    }

    public function test_invalid_status_returns_validation_error(): void
    {
        $client = Client::factory()->create();

        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => 'Invalid Status Project',
                'status' => 'paused',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_admin_can_view_one_project(): void
    {
        $project = Project::factory()->create(['name' => 'Visible Project']);

        $this->actingAsAdmin()
            ->getJson("/api/admin/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Visible Project')
            ->assertJsonPath('data.client.id', $project->client_id)
            ->assertJsonPath('data.tasks_count', 0);
    }

    public function test_missing_project_returns_consistent_not_found_json(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/projects/999999')
            ->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Resource not found.',
                'errors' => [],
            ]);
    }

    public function test_admin_can_update_a_project(): void
    {
        $project = Project::factory()->create(['status' => ProjectStatus::PLANNING]);

        $this->actingAsAdmin()
            ->putJson("/api/admin/projects/{$project->id}", [
                'client_id' => $project->client_id,
                'name' => 'Updated Project',
                'brief' => 'Updated brief.',
                'deadline' => '2026-10-15',
                'status' => ProjectStatus::ACTIVE->value,
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Project updated successfully')
            ->assertJsonPath('data.name', 'Updated Project')
            ->assertJsonPath('data.status', ProjectStatus::ACTIVE->value)
            ->assertJsonPath('data.deadline', '2026-10-15');
    }

    public function test_admin_can_partially_update_a_project(): void
    {
        $project = Project::factory()->create([
            'name' => 'Original Project',
            'status' => ProjectStatus::PLANNING,
        ]);

        $this->actingAsAdmin()
            ->patchJson("/api/admin/projects/{$project->id}", [
                'status' => ProjectStatus::ACTIVE->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Original Project')
            ->assertJsonPath('data.status', ProjectStatus::ACTIVE->value);
    }

    public function test_omitted_fields_remain_unchanged(): void
    {
        $project = Project::factory()->create([
            'name' => 'Original Project',
            'brief' => 'Original brief',
            'deadline' => '2026-09-30',
            'status' => ProjectStatus::PLANNING,
        ]);

        $this->actingAsAdmin()
            ->patchJson("/api/admin/projects/{$project->id}", [
                'status' => ProjectStatus::ACTIVE->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Original Project')
            ->assertJsonPath('data.brief', 'Original brief')
            ->assertJsonPath('data.deadline', '2026-09-30')
            ->assertJsonPath('data.status', ProjectStatus::ACTIVE->value);
    }

    public function test_project_can_be_reassigned_to_another_existing_client(): void
    {
        $originalClient = Client::factory()->create();
        $newClient = Client::factory()->create();
        $project = Project::factory()->for($originalClient)->create();

        $this->actingAsAdmin()
            ->patchJson("/api/admin/projects/{$project->id}", [
                'client_id' => $newClient->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.client.id', $newClient->id);
    }

    public function test_member_cannot_create_a_project(): void
    {
        $client = Client::factory()->create();

        $this->actingAsMember()
            ->postJson('/api/admin/projects', [
                'client_id' => $client->id,
                'name' => 'Blocked Project',
            ])
            ->assertForbidden();
    }

    public function test_member_cannot_update_a_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAsMember()
            ->patchJson("/api/admin/projects/{$project->id}", [
                'name' => 'Blocked Update',
            ])
            ->assertForbidden();
    }

    public function test_member_cannot_delete_a_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAsMember()
            ->deleteJson("/api/admin/projects/{$project->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_a_project_without_tasks(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Project deleted successfully');

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_admin_cannot_delete_a_project_with_tasks(): void
    {
        $project = Project::factory()->create();
        Task::factory()->for($project)->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/projects/{$project->id}")
            ->assertConflict()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['tasks']);

        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    public function test_blocked_deletion_returns_http_409(): void
    {
        $project = Project::factory()->create();
        Task::factory()->for($project)->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/projects/{$project->id}")
            ->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Project cannot be deleted because it still has related tasks',
                'errors' => [
                    'tasks' => [
                        'Remove or reassign the project tasks before deleting this project.',
                    ],
                ],
            ]);
    }

    public function test_project_response_does_not_expose_unexpected_fields(): void
    {
        $project = Project::factory()->create();

        $this->actingAsAdmin()
            ->getJson("/api/admin/projects/{$project->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.client.contact')
            ->assertJsonMissingPath('data.tasks')
            ->assertJsonMissingPath('data.deleted_at')
            ->assertJsonMissingPath('data.assignee_id');
    }

    public function test_validation_errors_follow_consistent_json_structure(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/projects', [
                'client_id' => null,
                'name' => '',
                'status' => 'invalid',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => [
                    'client_id',
                    'name',
                    'status',
                ],
            ])
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed');
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
