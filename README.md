# A Laravel Filament package to add the BlockNote field to your forms.

[![Latest Version on Packagist](https://img.shields.io/packagist/v/digitalcodesa/filament-blocknote.svg?style=flat-square)](https://packagist.org/packages/digitalcodesa/filament-blocknote)
[![GitHub Tests Action Status](https://img.shields.io/github/actions/workflow/status/digitalcodesa/filament-blocknote/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/digitalcodesa/filament-blocknote/actions?query=workflow%3Arun-tests+branch%3Amain)
[![GitHub Code Style Action Status](https://img.shields.io/github/actions/workflow/status/digitalcodesa/filament-blocknote/fix-php-code-style-issues.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/digitalcodesa/filament-blocknote/actions?query=workflow%3A"Fix+PHP+code+style+issues"+branch%3Amain)
[![Total Downloads](https://img.shields.io/packagist/dt/digitalcodesa/filament-blocknote.svg?style=flat-square)](https://packagist.org/packages/digitalcodesa/filament-blocknote)



This is where your description should go. Limit it to a paragraph or two. Consider adding a small example.

## Installation

You can install the package via composer:

```bash
composer require digitalcodesa/filament-blocknote
```

You can publish and run the migrations with:

```bash
php artisan vendor:publish --tag="filament-blocknote-migrations"
php artisan migrate
```

You can publish the config file with:

```bash
php artisan vendor:publish --tag="filament-blocknote-config"
```

Optionally, you can publish the views using

```bash
php artisan vendor:publish --tag="filament-blocknote-views"
```

This is the contents of the published config file:

```php
return [
];
```

## Usage

```php
$filamentBlocknote = new digitalcodesa\FilamentBlocknote();
echo $filamentBlocknote->echoPhrase('Hello, digitalcodesa!');
```

## Testing

```bash
composer test
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

- [Julius Kiekbusch](https://github.com/digitalcodesa)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
