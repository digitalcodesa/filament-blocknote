<?php

namespace Digitalcode\FilamentBlocknote;

use Filament\Support\Assets\Asset;
use Filament\Support\Assets\Css;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class FilamentBlocknoteServiceProvider extends PackageServiceProvider
{
    public static string $name = 'filament-blocknote';

    public static string $viewNamespace = 'filament-blocknote';

    public function configurePackage(Package $package): void
    {
        $package
            ->name(static::$name)
            ->hasViews(static::$viewNamespace)
            ->publishesServiceProvider('HasBlocknoteFileUploads'); // Add this to publish the trait
    }

    public function packageRegistered(): void {}

    public function packageBooted(): void
    {
        // Asset Registration
        FilamentAsset::register(
            $this->getAssets(),
            'digitalcodesa/filament-blocknote'
        );

        // No need to register Livewire component - we're using actions instead
    }

    /**
     * @return array<Asset>
     */
    protected function getAssets(): array
    {
        $manifestPath = __DIR__.'/../resources/dist/manifest.json';
        
        if (!file_exists($manifestPath)) {
            return [];
        }
        
        $manifest = json_decode(file_get_contents($manifestPath), true);

        if (!$manifest) {
            return [];
        }

        return [
            Css::make(
                'filament-blocknote-styles',
                $this->cssDistFromManifest($manifest, 'resources/js/main.jsx')
            ),
            Js::make(
                'filament-blocknote-scripts',
                $this->distFromManifest($manifest, 'resources/js/main.jsx')
            ),
        ];
    }

    protected function distFromManifest(array $manifest, string $key): string
    {
        return __DIR__.'/../resources/dist/'.$manifest[$key]['file'];
    }

    protected function cssDistFromManifest(array $manifest, string $key): string
    {
        return __DIR__.'/../resources/dist/'.$manifest[$key]['css'][0];
    }
}