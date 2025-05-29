<?php
namespace Digitalcode\FilamentBlocknote; 

use Filament\Forms\Components\Concerns\HasFileAttachments;
use Filament\Forms\Components\Contracts\HasFileAttachments as HasFileAttachmentsContract;
use Filament\Forms\Components\Field;
use Filament\Forms\Components\Actions\Action; // Import Action
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;


class BlocknoteEditor extends Field implements HasFileAttachmentsContract
{
    use HasFileAttachments;

    protected string $view = 'filament-blocknote::editor'; // Or your custom view if you also override that

    protected function setUp(): void // Add setUp if not present
    {
        parent::setUp();
        $this->registerActions([
            Action::make('handleFileUpload')
                ->action(function (?BlocknoteEditor $component) { // Use the correct component type
                    Log::info('[BlocknoteEditor_PHP_PACKAGE] handleFileUpload action called.');
                    $livewire = $component->getLivewire();
                    // Use the component's statePath to get the correct file
                    $uploadedFile = $livewire->getFormComponentFileAttachment($component->getStatePath());

                    if (!($uploadedFile instanceof TemporaryUploadedFile)) {
                        Log::error('[BlocknoteEditor_PHP_PACKAGE] File not found for statePath: ' . $component->getStatePath());
                        return null;
                    }

                    $diskName = $component->getDiskName(); // Use Filament's disk getter
                    $directory = $component->getDirectory() ?? 'editor-uploads'; // Use Filament's directory getter

                    $path = $uploadedFile->store($directory, $diskName);
                    // Clear after storing, using the component's statePath
                    $livewire->clearFormComponentFileAttachment($component->getStatePath());


                    if (!$path) {
                        Log::error('[BlocknoteEditor_PHP_PACKAGE] File storage failed.');
                        return null;
                    }
                    $url = Storage::disk($diskName)->url($path);
                    Log::info('[BlocknoteEditor_PHP_PACKAGE] File uploaded to package, URL: ' . $url);
                    return $url;
                })
        ]);
    }
}