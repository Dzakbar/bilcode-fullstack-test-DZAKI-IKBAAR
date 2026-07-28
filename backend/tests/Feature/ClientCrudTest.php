<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_list_clients(): void
    {
        $this->getJson('/api/admin/clients')
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_member_cannot_list_clients(): void
    {
        $this->actingAsMember()
            ->getJson('/api/admin/clients')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_list_clients(): void
    {
        Client::factory()->count(2)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/clients')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Clients retrieved successfully')
            ->assertJsonCount(2, 'data');
    }

    public function test_client_listing_is_paginated(): void
    {
        Client::factory()->count(12)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/clients?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.total', 12);
    }

    public function test_client_listing_includes_projects_count(): void
    {
        $client = Client::factory()->create();
        Project::factory()->for($client)->count(2)->create();

        $this->actingAsAdmin()
            ->getJson('/api/admin/clients')
            ->assertOk()
            ->assertJsonPath('data.0.projects_count', 2);
    }

    public function test_admin_can_search_clients_by_name(): void
    {
        Client::factory()->create(['name' => 'Acme Indonesia']);
        Client::factory()->create(['name' => 'Northwind Studio']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/clients?search=acme')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Acme Indonesia');
    }

    public function test_admin_can_search_clients_by_email(): void
    {
        Client::factory()->create(['email' => 'client8123@example.test']);
        Client::factory()->create(['email' => 'hello@example.test']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/clients?search=8123')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'client8123@example.test');
    }

    public function test_admin_can_filter_clients_by_company(): void
    {
        Client::factory()->create(['company' => 'Example Group']);
        Client::factory()->create(['company' => 'Other Company']);

        $this->actingAsAdmin()
            ->getJson('/api/admin/clients?company=example')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.company', 'Example Group');
    }

    public function test_invalid_sort_field_is_rejected(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/clients?sort=password')
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['sort']);
    }

    public function test_admin_can_create_a_client(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/clients', [
                'name' => 'PT Example Indonesia',
                'email' => 'client@example.test',
                'company' => 'Example Group',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Client created successfully')
            ->assertJsonPath('data.name', 'PT Example Indonesia')
            ->assertJsonPath('data.projects_count', 0);

        $this->assertDatabaseHas('clients', [
            'name' => 'PT Example Indonesia',
            'email' => 'client@example.test',
            'company' => 'Example Group',
        ]);
    }

    public function test_admin_can_list_clients_from_public_api_clients_path(): void
    {
        Client::factory()->count(2)->create();

        $this->actingAsAdmin()
            ->getJson('/api/clients')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_create_validates_required_name(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/clients', [
                'name' => '   ',
                'email' => 'client@example.test',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_validates_required_email(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/clients', [
                'name' => 'Client Name',
                'email' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_company_may_be_null(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/clients', [
                'name' => 'Client Without Company',
                'email' => 'client@example.test',
                'company' => null,
            ])
            ->assertCreated()
            ->assertJsonPath('data.company', null);
    }

    public function test_admin_can_view_one_client(): void
    {
        $client = Client::factory()->create(['name' => 'Visible Client']);

        $this->actingAsAdmin()
            ->getJson("/api/admin/clients/{$client->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Visible Client')
            ->assertJsonPath('data.projects_count', 0);
    }

    public function test_missing_client_returns_not_found_json(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/admin/clients/999999')
            ->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Resource not found.',
                'errors' => [],
            ]);
    }

    public function test_admin_can_update_one_client(): void
    {
        $client = Client::factory()->create(['email' => 'old@example.test']);

        $this->actingAsAdmin()
            ->putJson("/api/admin/clients/{$client->id}", [
                'name' => 'Updated Client',
                'email' => 'updated@example.test',
                'company' => 'Updated Company',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Client updated successfully')
            ->assertJsonPath('data.name', 'Updated Client')
            ->assertJsonPath('data.email', 'updated@example.test');
    }

    public function test_partial_update_preserves_omitted_fields(): void
    {
        $client = Client::factory()->create([
            'name' => 'Original Name',
            'email' => 'old@example.test',
            'company' => 'Original Company',
        ]);

        $this->actingAsAdmin()
            ->patchJson("/api/admin/clients/{$client->id}", [
                'email' => 'new@example.test',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Original Name')
            ->assertJsonPath('data.email', 'new@example.test')
            ->assertJsonPath('data.company', 'Original Company');
    }

    public function test_member_cannot_create_a_client(): void
    {
        $this->actingAsMember()
            ->postJson('/api/admin/clients', [
                'name' => 'Blocked Client',
                'email' => 'blocked@example.test',
            ])
            ->assertForbidden();
    }

    public function test_member_cannot_update_a_client(): void
    {
        $client = Client::factory()->create();

        $this->actingAsMember()
            ->patchJson("/api/admin/clients/{$client->id}", [
                'name' => 'Blocked Update',
            ])
            ->assertForbidden();
    }

    public function test_member_cannot_delete_a_client(): void
    {
        $client = Client::factory()->create();

        $this->actingAsMember()
            ->deleteJson("/api/admin/clients/{$client->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_a_client_with_no_projects(): void
    {
        $client = Client::factory()->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/clients/{$client->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Client deleted successfully');

        $this->assertDatabaseMissing('clients', ['id' => $client->id]);
    }

    public function test_admin_cannot_delete_a_client_that_still_has_projects(): void
    {
        $client = Client::factory()->create();
        Project::factory()->for($client)->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/clients/{$client->id}")
            ->assertConflict()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['projects']);

        $this->assertDatabaseHas('clients', ['id' => $client->id]);
    }

    public function test_delete_conflict_returns_http_409(): void
    {
        $client = Client::factory()->create();
        Project::factory()->for($client)->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/admin/clients/{$client->id}")
            ->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Client cannot be deleted because it still has related projects',
                'errors' => [
                    'projects' => [
                        'Remove or reassign the client projects before deleting this client.',
                    ],
                ],
            ]);
    }

    public function test_client_response_does_not_expose_unexpected_fields(): void
    {
        $client = Client::factory()->create();

        $response = $this->actingAsAdmin()->getJson("/api/admin/clients/{$client->id}");

        $response
            ->assertOk()
            ->assertJsonMissingPath('data.deleted_at')
            ->assertJsonMissingPath('data.project')
            ->assertJsonMissingPath('data.projects')
            ->assertJsonMissingPath('data.user_id');
    }

    public function test_validation_errors_follow_the_consistent_api_format(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/admin/clients', [
                'name' => '',
                'email' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => [
                    'name',
                    'email',
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
