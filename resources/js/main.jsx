// main.jsx
console.log("Initializing BlockNote Editor...");

import React from 'react';
import { createRoot } from 'react-dom/client';
import FilamentBlockNoteEditor from './FilamentBlockNoteEditor';

// Alpine.js component for BlockNote editor
window.blocknoteEditor = (config) => {
    return {
        value: config.value || '',
        statePath: config.statePath || '',
        uploadActionName: config.uploadActionName || 'handleFileUpload',
        
        init() {
            console.log('[Alpine] Initializing BlockNote with config:', config);
            
            // Get the actual Livewire component
            let livewireComponent = this.$wire;
            
            // If $wire is not available, try to find it in the DOM
            if (!livewireComponent) {
                const livewireElement = this.$el.closest('[wire\\:id]');
                if (livewireElement && window.Livewire) {
                    const wireId = livewireElement.getAttribute('wire:id');
                    livewireComponent = window.Livewire.find(wireId);
                }
            }
            
            // Final fallback
            if (!livewireComponent && window.Livewire) {
                livewireComponent = window.Livewire.first();
            }
            
            console.log('[Alpine] Found Livewire component:', livewireComponent);
            
            // Create React root and render
            const root = createRoot(this.$refs.editor);
            
            root.render(
                React.createElement(FilamentBlockNoteEditor, {
                    value: this.value,
                    onChange: (editor) => {
                        try {
                            const newValue = JSON.stringify(editor.document);
                            this.value = newValue;
                            
                            // Update Livewire state
                            if (livewireComponent && typeof livewireComponent.set === 'function') {
                                livewireComponent.set(this.statePath, newValue);
                            }
                        } catch (error) {
                            console.error('[Alpine] Error updating value:', error);
                        }
                    },
                    statePath: this.statePath,
                    uploadActionName: this.uploadActionName,
                    livewire: livewireComponent
                })
            );
            
            console.log('[Alpine] BlockNote editor rendered successfully');
        }
    };
};