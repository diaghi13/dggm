<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        // ─── Backup disks ────────────────────────────────────────────────────

        // Local backup storage (always active).
        'local_backups' => [
            'driver' => 'local',
            'root' => storage_path('app/backups'),
            'throw' => false,
        ],

        // SFTP remote backup. Active when BACKUP_SFTP_HOST is set.
        'sftp_backup' => [
            'driver' => 'sftp',
            'host' => env('BACKUP_SFTP_HOST'),
            'username' => env('BACKUP_SFTP_USERNAME'),
            'password' => env('BACKUP_SFTP_PASSWORD'),
            'privateKey' => env('BACKUP_SFTP_PRIVATE_KEY'),
            'passphrase' => env('BACKUP_SFTP_PASSPHRASE'),
            'port' => (int) env('BACKUP_SFTP_PORT', 22),
            'root' => env('BACKUP_SFTP_ROOT', '/backups'),
            'timeout' => 30,
            'throw' => false,
        ],

        // Backblaze B2 (S3-compatible). Active when BACKUP_B2_KEY_ID is set.
        'b2' => [
            'driver' => 's3',
            'key' => env('BACKUP_B2_KEY_ID'),
            'secret' => env('BACKUP_B2_APPLICATION_KEY'),
            'region' => env('BACKUP_B2_REGION', 'us-east-005'),
            'bucket' => env('BACKUP_B2_BUCKET'),
            'endpoint' => env('BACKUP_B2_ENDPOINT', 'https://s3.us-east-005.backblazeb2.com'),
            'use_path_style_endpoint' => env('BACKUP_B2_PATH_STYLE', true),
            'throw' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
