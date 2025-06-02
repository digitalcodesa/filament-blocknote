<?php

namespace Digitalcode\FilamentBlocknote\Concerns;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

trait HasBlocknoteFileUploads
{
    public function handleFileUpload($uploadedFilename, $statePath = 'data.blocks', $disk = 'public', $directory = 'editor-uploads')
    {
        try {
            Log::info('[HasBlocknoteFileUploads] Processing file upload', [
                'filename' => $uploadedFilename,
                'statePath' => $statePath,
                'disk' => $disk,
                'directory' => $directory,
                'all_attachments' => array_keys($this->componentFileAttachments ?? [])
            ]);
            
            if (!$uploadedFilename) {
                throw new \Exception('No uploaded filename provided');
            }
            
            // Get all file attachments - try different paths
            $fileAttachments = [];
            
            // Try the exact statePath first
            if (isset($this->componentFileAttachments[$statePath])) {
                $fileAttachments = $this->componentFileAttachments[$statePath];
                Log::info('[HasBlocknoteFileUploads] Found attachments at exact statePath', ['count' => count($fileAttachments)]);
            }
            
            // If not found, try all possible attachment locations
            if (empty($fileAttachments) && isset($this->componentFileAttachments)) {
                foreach ($this->componentFileAttachments as $path => $attachments) {
                    if (str_contains($path, 'blocks') || str_contains($path, $statePath)) {
                        $fileAttachments = array_merge($fileAttachments, is_array($attachments) ? $attachments : [$attachments]);
                        Log::info('[HasBlocknoteFileUploads] Found attachments at path', ['path' => $path, 'count' => count($attachments)]);
                    }
                }
            }
            
            // If still empty, get all attachments as last resort
            if (empty($fileAttachments) && isset($this->componentFileAttachments)) {
                foreach ($this->componentFileAttachments as $path => $attachments) {
                    $fileAttachments = array_merge($fileAttachments, is_array($attachments) ? $attachments : [$attachments]);
                }
                Log::info('[HasBlocknoteFileUploads] Using all available attachments', ['total_count' => count($fileAttachments)]);
            }
            
            if (empty($fileAttachments)) {
                Log::error('[HasBlocknoteFileUploads] No file attachments found anywhere', [
                    'componentFileAttachments' => $this->componentFileAttachments ?? 'not set'
                ]);
                throw new \Exception('No file attachments found');
            }
            
            // Find the uploaded file by filename
            $tempFile = null;
            foreach ($fileAttachments as $attachment) {
                if ($attachment instanceof TemporaryUploadedFile) {
                    Log::info('[HasBlocknoteFileUploads] Checking attachment', [
                        'attachment_filename' => $attachment->getFilename(),
                        'uploaded_filename' => $uploadedFilename
                    ]);
                    
                    if (str_contains($attachment->getFilename(), $uploadedFilename) || 
                        $attachment->getFilename() === $uploadedFilename ||
                        str_contains($uploadedFilename, $attachment->getFilename())) {
                        $tempFile = $attachment;
                        Log::info('[HasBlocknoteFileUploads] Found matching file', ['filename' => $attachment->getFilename()]);
                        break;
                    }
                }
            }
            
            if (!$tempFile) {
                // If exact match not found, take the most recent file
                $tempFile = end($fileAttachments);
                Log::info('[HasBlocknoteFileUploads] Using most recent file as fallback', [
                    'filename' => $tempFile instanceof TemporaryUploadedFile ? $tempFile->getFilename() : 'unknown'
                ]);
                
                if (!($tempFile instanceof TemporaryUploadedFile)) {
                    throw new \Exception('No valid temporary uploaded file found');
                }
            }
            
            // Store the file permanently
            $path = $tempFile->store($directory, $disk);
            
            if (!$path) {
                throw new \Exception('File storage failed');
            }
            
            $url = Storage::disk($disk)->url($path);
            
            // Clean up all temporary files for this component
            $this->componentFileAttachments = [];
            
            Log::info('[HasBlocknoteFileUploads] File stored successfully', [
                'path' => $path,
                'url' => $url
            ]);
            
            return [
                'url' => $url,
                'name' => $tempFile->getClientOriginalName(),
                'size' => $tempFile->getSize(),
                'type' => $tempFile->getMimeType(),
            ];
            
        } catch (\Exception $e) {
            Log::error('[HasBlocknoteFileUploads] File upload failed', [
                'error' => $e->getMessage(),
                'filename' => $uploadedFilename,
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }
}