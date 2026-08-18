<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Add your Vercel URL(s) here. Wildcards work for preview deploys too.
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#', // covers Vercel preview deployments
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // false is correct here since auth uses Bearer tokens, not cookies
    'supports_credentials' => false,
];
