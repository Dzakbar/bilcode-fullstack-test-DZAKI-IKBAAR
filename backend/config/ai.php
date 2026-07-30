<?php

return [
    'default' => env('AI_PROVIDER', 'openrouter'),
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'api_url' => 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
    ],
    'openrouter' => [
        'api_key' => env('OPENROUTER_API_KEY'),
        'api_url' => 'https://openrouter.ai/api/v1/chat/completions',
        'model' => env('OPENROUTER_MODEL', 'qwen/qwen3-coder:free'),
    ],
];
