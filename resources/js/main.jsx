import React from "react"
import { createRoot } from "react-dom/client"
import FilamentBlockNoteEditor from "./FilamentBlockNoteEditor"

window.React = React

document.addEventListener('alpine:init', () => {
    Alpine.data('blocknoteEditor', ({ value, statePath, uploadActionName }) => ({ // Added uploadActionName
        value: value,
        statePath: statePath,
        uploadActionName: uploadActionName, // Store it

        handleOnChange(editor) {
            this.value = JSON.stringify(editor.document);
        },

        init() {
            createRoot(this.$refs.editor).render(
                <FilamentBlockNoteEditor
                    value={this.value}
                    onChange={(editor) => this.handleOnChange(editor)}
                    statePath={this.statePath} 
                    uploadActionName={this.uploadActionName} 
                />
            );
        },
    }));
});
