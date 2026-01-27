<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CreateDomainFolderStructureCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'domain:create-folder-structure {domain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create the folder structure for a new domain';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $domain = $this->argument('domain');
        $basePath = base_path("app/Domains/{$domain}");

        $folders = [
            'Actions',
            'DTOs',
            'Events',
            'Models',
            'Policies',
            'Repositories',
            'Services',
        ];

        foreach ($folders as $folder) {
            $path = "{$basePath}/{$folder}";
            if (! is_dir($path)) {
                mkdir($path, 0755, true);
                $this->info("Created folder: {$path}");
            } else {
                $this->info("Folder already exists: {$path}");
            }
        }

        $this->info("Folder structure for domain '{$domain}' created successfully.");
    }
}
