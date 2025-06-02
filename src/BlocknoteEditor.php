<?php

namespace Digitalcode\FilamentBlocknote;

use Closure;
use Filament\Forms\Components\Actions\Action;
use Filament\Forms\Components\Concerns\HasFileAttachments;
use Filament\Forms\Components\Contracts\HasFileAttachments as HasFileAttachmentsContract;
use Filament\Forms\Components\Field;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

class BlocknoteEditor extends Field implements HasFileAttachmentsContract
{
    use HasFileAttachments;
    
    protected string $view = 'filament-blocknote::editor';
    
    protected string|Closure|null $directory = 'editor-uploads';
    
    protected string|Closure|array|null $disk = null;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->registerActions([
            Action::make('handleFileUpload')
                ->action(function (array $arguments, BlocknoteEditor $component): array {
                    return $component->processFileUpload($arguments);
                })
        ]);
    }
    
    public function processFileUpload(array $arguments): array
    {
        try {
            Log::info('[BlocknoteEditor] Processing file upload', $arguments);
            
            $statePath = $this->getStatePath();
            $livewire = $this->getLivewire();
            $uploadedFilename = $arguments['file'] ?? null;
            
            if (!$uploadedFilename) {
                throw new \Exception('No uploaded filename provided');
            }
            
            // Get the file from Livewire's temporary uploads
            $fileAttachments = $livewire->componentFileAttachments[$statePath] ?? [];
            
            if (empty($fileAttachments)) {
                throw new \Exception('No file attachments found');
            }
            
            // Find the uploaded file
            $tempFile = null;
            foreach ($fileAttachments as $attachment) {
                if ($attachment instanceof TemporaryUploadedFile) {
                    if (str_contains($attachment->getFilename(), $uploadedFilename) || 
                        $attachment->getFilename() === $uploadedFilename) {
                        $tempFile = $attachment;
                        break;
                    }
                }
            }
            
            if (!$tempFile) {
                throw new \Exception('Uploaded file not found in attachments');
            }
            
            $disk = $this->getDiskName();
            $directory = $this->getDirectory();
            
            // Store the file permanently
            $path = $tempFile->store($directory, $disk);
            
            if (!$path) {
                throw new \Exception('File storage failed');
            }
            
            $url = Storage::disk($disk)->url($path);
            
            // Clean up the temporary file
            unset($livewire->componentFileAttachments[$statePath]);
            
            Log::info('[BlocknoteEditor] File stored successfully', [
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
            Log::error('[BlocknoteEditor] File upload failed', [
                'error' => $e->getMessage(),
                'arguments' => $arguments
            ]);
            
            throw $e;
        }
    }
    
    public function directory(string|Closure|null $directory): static
    {
        $this->directory = $directory;
        return $this;
    }
    
    public function getDirectory(): ?string
    {
        return $this->evaluate($this->directory);
    }
    
    public function disk(string|Closure|array|null $disk): static
    {
        $this->disk = $disk;
        return $this;
    }
    
    public function getDiskName(): string
    {
        return $this->evaluate($this->disk) ?? config('filament.default_filesystem_disk');
    }
}