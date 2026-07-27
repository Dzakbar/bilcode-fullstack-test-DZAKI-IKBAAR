<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok_response(): void
    {
        $response = $this->getJson('/api/health');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'ProjectPulse backend is healthy')
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.service', 'projectpulse-backend');
    }
}
