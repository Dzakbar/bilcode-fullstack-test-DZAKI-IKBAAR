<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Concerns\RespondsWithApi;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Http\Requests\Auth\MemberLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use RespondsWithApi;

    public function adminLogin(AdminLoginRequest $request): JsonResponse
    {
        return $this->login(
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
            requiredRole: UserRole::ADMIN,
            deviceName: $request->deviceName(),
            successMessage: 'Admin login successful',
            tokenPrefix: 'admin'
        );
    }

    public function memberLogin(MemberLoginRequest $request): JsonResponse
    {
        return $this->login(
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
            requiredRole: UserRole::MEMBER,
            deviceName: $request->deviceName(),
            successMessage: 'Member login successful',
            tokenPrefix: 'member'
        );
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse('Authenticated user retrieved', [
            'user' => UserResource::make($request->user())->resolve(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();
        auth('sanctum')->forgetUser();

        return $this->successResponse('Logout successful');
    }

    private function login(
        string $email,
        string $password,
        UserRole $requiredRole,
        string $deviceName,
        string $successMessage,
        string $tokenPrefix,
    ): JsonResponse {
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return $this->errorResponse('Invalid credentials', [], 401);
        }

        if ($user->role !== $requiredRole) {
            return $this->errorResponse('This account is not allowed to use this login endpoint', [], 403);
        }

        $tokenName = sprintf('%s-%s', $tokenPrefix, $deviceName);
        $token = $user->createToken($tokenName)->plainTextToken;

        return $this->successResponse($successMessage, [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => UserResource::make($user)->resolve(),
        ], 201);
    }
}
