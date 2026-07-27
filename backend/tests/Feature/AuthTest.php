<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_log_in_through_admin_endpoint(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'admin@example.test',
            'password' => 'password',
        ]);

        $response = $this->postJson('/api/auth/admin/login', [
            'email' => 'admin@example.test',
            'password' => 'password',
            'device_name' => 'web-browser',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Admin login successful')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $admin->id)
            ->assertJsonPath('data.user.role', UserRole::ADMIN->value)
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.remember_token')
            ->assertJsonMissingPath('data.user.tokens');

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_member_cannot_log_in_through_admin_endpoint(): void
    {
        User::factory()->developer()->create([
            'email' => 'member@example.test',
            'password' => 'password',
        ]);

        $this->postJson('/api/auth/admin/login', [
            'email' => 'member@example.test',
            'password' => 'password',
        ])
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_member_can_log_in_through_member_endpoint(): void
    {
        $member = User::factory()->developer()->create([
            'email' => 'member@example.test',
            'password' => 'password',
        ]);

        $response = $this->postJson('/api/auth/member/login', [
            'email' => 'member@example.test',
            'password' => 'password',
            'device_name' => 'pixel-test',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Member login successful')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $member->id)
            ->assertJsonPath('data.user.role', UserRole::MEMBER->value)
            ->assertJsonPath('data.user.profession', 'developer')
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.remember_token')
            ->assertJsonMissingPath('data.user.tokens');

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_admin_cannot_log_in_through_member_endpoint(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@example.test',
            'password' => 'password',
        ]);

        $this->postJson('/api/auth/member/login', [
            'email' => 'admin@example.test',
            'password' => 'password',
            'device_name' => 'phone',
        ])
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_wrong_password_returns_unauthorized(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@example.test',
            'password' => 'password',
        ]);

        $this->postJson('/api/auth/admin/login', [
            'email' => 'admin@example.test',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors' => [],
            ]);
    }

    public function test_unknown_email_returns_unauthorized_without_revealing_account_existence(): void
    {
        $this->postJson('/api/auth/admin/login', [
            'email' => 'unknown@example.test',
            'password' => 'password',
        ])
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors' => [],
            ]);
    }

    public function test_invalid_input_returns_consistent_validation_json(): void
    {
        $this->postJson('/api/auth/member/login', [
            'email' => 'not-an-email',
            'password' => '',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed')
            ->assertJsonValidationErrors(['email', 'password', 'device_name']);
    }

    public function test_authenticated_user_can_access_me(): void
    {
        $user = User::factory()->developer()->create();
        $token = $user->createToken('mobile-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.remember_token')
            ->assertJsonMissingPath('data.user.tokens');
    }

    public function test_missing_token_cannot_access_me(): void
    {
        $this->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => [],
            ]);
    }

    public function test_invalid_token_cannot_access_me(): void
    {
        $this->withToken('invalid-token')
            ->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => [],
            ]);
    }

    public function test_logout_revokes_only_the_current_token(): void
    {
        $user = User::factory()->developer()->create();
        $currentToken = $user->createToken('phone')->plainTextToken;
        $otherToken = $user->createToken('tablet')->plainTextToken;

        $this->withToken($currentToken)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(1, PersonalAccessToken::count());

        $this->withToken($otherToken)
            ->getJson('/api/auth/me')
            ->assertOk();
    }

    public function test_revoked_token_can_no_longer_access_me(): void
    {
        $user = User::factory()->developer()->create();
        $token = $user->createToken('phone')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_admin_passes_admin_role_middleware(): void
    {
        Route::middleware(['auth:sanctum', 'role:admin'])->get('/api/testing/admin-only', fn () => response()->json(['ok' => true]));

        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/testing/admin-only')
            ->assertOk()
            ->assertJson(['ok' => true]);
    }

    public function test_member_is_rejected_by_admin_role_middleware(): void
    {
        Route::middleware(['auth:sanctum', 'role:admin'])->get('/api/testing/admin-only-reject', fn () => response()->json(['ok' => true]));

        $member = User::factory()->developer()->create();
        $token = $member->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/testing/admin-only-reject')
            ->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Forbidden.',
                'errors' => [],
            ]);
    }

    public function test_member_passes_member_role_middleware(): void
    {
        Route::middleware(['auth:sanctum', 'role:member'])->get('/api/testing/member-only', fn () => response()->json(['ok' => true]));

        $member = User::factory()->developer()->create();
        $token = $member->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/testing/member-only')
            ->assertOk()
            ->assertJson(['ok' => true]);
    }

    public function test_user_response_never_contains_password_or_token_hash(): void
    {
        $user = User::factory()->developer()->create([
            'password' => 'password',
        ]);
        $token = $user->createToken('phone')->plainTextToken;
        $tokenHash = PersonalAccessToken::firstOrFail()->token;

        $response = $this->withToken($token)->getJson('/api/auth/me');

        $response
            ->assertOk()
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.remember_token')
            ->assertJsonMissingPath('data.user.tokens');

        $this->assertStringNotContainsString($tokenHash, $response->getContent());
    }
}
