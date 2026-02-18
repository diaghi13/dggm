<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\Process\Process;

class DocumentConverterService
{
    /** MIME types that require conversion to PDF */
    public const CONVERTIBLE_MIME_TYPES = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    public function needsConversion(string $mimeType): bool
    {
        return in_array($mimeType, self::CONVERTIBLE_MIME_TYPES);
    }

    /**
     * Convert a file to PDF using LibreOffice.
     * Returns the path to the generated PDF (in a temp directory).
     * Caller is responsible for deleting the temp file.
     *
     * @throws RuntimeException if conversion fails
     */
    public function convertToPdf(string $sourcePath): string
    {
        $binary = config('services.libreoffice.binary', 'libreoffice');
        $outputDir = sys_get_temp_dir();

        // Use a per-process temp profile dir to avoid lock conflicts when running as www-data
        $profileDir = sys_get_temp_dir().'/libreoffice-profile-'.getmypid();

        $process = new Process([
            $binary,
            '--headless',
            '-env:UserInstallation=file://'.$profileDir,
            '--convert-to', 'pdf',
            '--outdir', $outputDir,
            $sourcePath,
        ]);

        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            Log::error('LibreOffice conversion failed', [
                'source' => $sourcePath,
                'exit_code' => $process->getExitCode(),
                'stderr' => $process->getErrorOutput(),
                'stdout' => $process->getOutput(),
            ]);

            throw new RuntimeException('Conversione PDF fallita (exit code: '.$process->getExitCode().')');
        }

        $pdfPath = $outputDir.DIRECTORY_SEPARATOR.pathinfo($sourcePath, PATHINFO_FILENAME).'.pdf';

        if (! file_exists($pdfPath)) {
            throw new RuntimeException('PDF non generato: '.$pdfPath);
        }

        return $pdfPath;
    }
}
