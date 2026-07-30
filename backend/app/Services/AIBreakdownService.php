<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIBreakdownService
{
    public function generateTasks(string $prdText): array
    {
        $provider = config('ai.default', 'openrouter');

        return match ($provider) {
            'openrouter' => $this->generateWithOpenRouter($prdText),
            'gemini' => $this->generateWithGemini($prdText),
            default => throw new \InvalidArgumentException("Unsupported AI provider: {$provider}"),
        };
    }

    private function generateWithOpenRouter(string $prdText): array
    {
        $apiKey = config('ai.openrouter.api_key');

        if (empty($apiKey)) {
            throw new \RuntimeException('OpenRouter API key is not configured. Set OPENROUTER_API_KEY in .env');
        }

        $prompt = $this->buildPrompt($prdText);

        try {
            $response = Http::timeout(120)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'HTTP-Referer' => config('app.url', 'http://localhost:3000'),
                    'X-Title' => 'ProjectPulse',
                ])
                ->post(config('ai.openrouter.api_url'), [
                    'model' => config('ai.openrouter.model'),
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'response_format' => ['type' => 'json_object'],
                ]);

            if ($response->failed()) {
                $error = $response->json('error.message') ?? $response->body();
                Log::error('OpenRouter API error', [
                    'status' => $response->status(),
                    'body' => $error,
                ]);

                $code = $response->status();
                if ($code === 401 || $code === 403) {
                    throw new \RuntimeException('Invalid or expired OpenRouter API key.');
                }
                if ($code === 402) {
                    throw new \RuntimeException('OpenRouter account has insufficient credits. Please add credits at https://openrouter.ai/credits.');
                }
                if ($code === 429) {
                    throw new \RuntimeException('OpenRouter rate limit exceeded. Please wait and try again.');
                }

                throw new \RuntimeException('AI service error: ' . ($response->json('error.message') ?? 'Unknown error'));
            }

            $text = $response->json('choices.0.message.content');
            if (empty($text)) {
                throw new \RuntimeException('Empty response from AI service');
            }

            $text = trim($text);
            $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
            $text = preg_replace('/\s*```$/', '', $text);

            $parsed = json_decode($text, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse AI response', [
                    'raw' => $text,
                    'error' => json_last_error_msg(),
                ]);

                throw new \RuntimeException('Failed to parse AI response: ' . json_last_error_msg());
            }

            return $parsed['tasks'] ?? [];
        } catch (ConnectionException $e) {
            throw new \RuntimeException('Could not connect to AI service. Check internet connection.');
        }
    }

    private function generateWithGemini(string $prdText): array
    {
        $apiKey = config('ai.gemini.api_key');

        if (empty($apiKey)) {
            throw new \RuntimeException('Gemini API key is not configured. Set GEMINI_API_KEY in .env');
        }

        $prompt = $this->buildPrompt($prdText);

        try {
            $response = Http::timeout(60)
                ->post(config('ai.gemini.api_url') . '?key=' . $apiKey, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('Gemini API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new \RuntimeException('AI service error: ' . ($response->json('error.message') ?? 'Unknown error'));
            }

            $text = $response->json('candidates.0.content.parts.0.text');
            if (empty($text)) {
                throw new \RuntimeException('Empty response from AI service');
            }

            $text = trim($text);
            $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
            $text = preg_replace('/\s*```$/', '', $text);

            $parsed = json_decode($text, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse AI response', [
                    'raw' => $text,
                    'error' => json_last_error_msg(),
                ]);

                throw new \RuntimeException('Failed to parse AI response: ' . json_last_error_msg());
            }

            return $parsed['tasks'] ?? [];
        } catch (ConnectionException $e) {
            throw new \RuntimeException('Could not connect to AI service. Check internet connection.');
        }
    }

    private function buildPrompt(string $prdText): string
    {
        return <<<PROMPT
You are a senior project manager assistant. Break down the following PRD (Product Requirements Document) into a list of tasks.

For each task, provide:
- title: short clear title (max 100 chars)
- description: 1-2 sentence description of what needs to be done
- category: one of "frontend", "backend", "design", "qa"
- estimated_effort: estimated effort in hours (integer, min 1, max 80)
- status: always "todo"

Respond ONLY with a valid JSON object in this exact format:
{"tasks":[{"title":"...","description":"...","category":"...","estimated_effort":N,"status":"todo"}]}

PRD:
{$prdText}
PROMPT;
    }
}
