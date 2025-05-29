import React from "react"; // Ensure React is in scope if not already global
import { BlockNoteEditor } from "@blocknote/core"; // Import the core editor
import { useCreateBlockNote } from "@blocknote/react"; // Still useful for some setups
import { BlockNoteView, FormattingToolbar } from "@blocknote/mantine"; // Using Mantine version
import "@blocknote/mantine/style.css";
// You might also need to import specific Mantine components if you build more complex UI

// Helper: Your RTL button React component
const RtlButton = (props) => {
    const { editor } = props;

    const toggleRtl = () => {
        const currentBlocks = editor.getSelection()?.blocks || editor.getSelectedBlocks() || [];
        const targetBlocks = currentBlocks.length > 0 ? currentBlocks : (editor.getTextCursorPosition().block ? [editor.getTextCursorPosition().block] : []);

        targetBlocks.forEach(block => {
            const newDirection = block.props.direction === "rtl" ? "ltr" : "rtl";
            const newTextAlign = newDirection === "rtl" ? "right" : "left"; // Or keep existing alignment
            editor.updateBlock(block, {
                props: { ...block.props, direction: newDirection, textAlignment: newTextAlign },
            });
        });
    };

    const isActive = () => {
        const currentBlocks = editor.getSelection()?.blocks || editor.getSelectedBlocks() || [];
        const targetBlocks = currentBlocks.length > 0 ? currentBlocks : (editor.getTextCursorPosition().block ? [editor.getTextCursorPosition().block] : []);
        return targetBlocks.length > 0 && targetBlocks.every(block => block.props.direction === "rtl");
    };

    // You'll need an actual RTL icon component or SVG string here
    // For Mantine, you might use an Icon component from a library like Tabler Icons
    // <IconTextDirectionRtl size={16} />
    const rtlIconSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M10 4v7h3V4h2v14h-2v-5h-3v5H8V4zm9 0h-2v14h2zM6 12l-4 4l4 4v-3h12v-2H6z"/>
        </svg>
    );

    return (
        <FormattingToolbar.Button
            onClick={toggleRtl}
            active={isActive()}
            mainTooltip="Toggle RTL/LTR"
        >
            {rtlIconSVG}
        </FormattingToolbar.Button>
    );
};


export default function FilamentBlockNoteEditor({ value, onChange, statePath, uploadActionName }) {
    // statePath and uploadActionName would need to be passed down if you use callFormComponentAction
    // For that, editor.blade.php and main.jsx would also need to pass these props.

    const editor = useCreateBlockNote({
        initialContent: value ? JSON.parse(value) : undefined,
        trailingBlock: false, // Keep as per original package
        uploadFile: async (file) => {
            // This assumes `window.Livewire` is available and the component hosting the form is accessible
            // and that your Filament PHP field (BlocknoteEditor.php) has the 'handleFileUpload' action.
            // The statePath passed to the Alpine component is crucial here.
            console.log("[FilamentBlockNoteEditor] Uploading file for statePath:", statePath);

            if (!window.Livewire?.find) {
                console.error("Livewire component find method not available for upload.");
                throw new Error("Livewire not available.");
            }

            // Find the Livewire component instance that owns this form field.
            // This is tricky as we don't have $wire directly here.
            // We might need to get the Livewire component ID from a DOM element.
            // For now, let's assume a global Livewire event or a more direct call if possible.
            // A common pattern is to emit an event that the parent Livewire component listens to,
            // which then calls the $wire.upload. This is complex to set up from here directly.

            // **Alternative if direct Livewire calls are hard from React context:**
            // The package uses Filament's HasFileAttachments.
            // We need to ensure the file upload triggers Filament's machinery.
            // The original package doesn't implement `uploadFile` in its JS,
            // so it relies on BlockNote's default (which is no upload) or
            // expects users to extend/configure it.

            // To integrate with your PHP action 'handleFileUpload' on `BlocknoteEditor.php`
            // (which uses getFormComponentFileAttachment):
            const livewireComponentId = document.querySelector('[wire\\:id]').getAttribute('wire:id'); // Get first Livewire ID on page
            if (!livewireComponentId) {
                console.error("Could not find Livewire component ID on the page.");
                throw new Error("Livewire component ID not found.");
            }
            const livewireComponent = window.Livewire.find(livewireComponentId);
            if (!livewireComponent) {
                console.error("Could not find Livewire component instance.");
                throw new Error("Livewire component instance not found.");
            }

            return new Promise((resolve, reject) => {
                livewireComponent.upload(
                    `componentFileAttachments.${statePath}`, // Path for temp upload
                    file,
                    (uploadedFilename) => {
                        console.log('Livewire temp upload success:', uploadedFilename);
                        livewireComponent.callFormComponentAction(statePath, 'handleFileUpload') // Call PHP action
                            .then(finalUrl => {
                                if (finalUrl && typeof finalUrl === 'string') {
                                    console.log('PHP Action success, final URL:', finalUrl);
                                    resolve(finalUrl);
                                } else {
                                    reject('URL not returned from server.');
                                }
                            })
                            .catch(error => reject(error));
                    },
                    (error) => reject(new Error('File upload to Livewire failed.')),
                    (event) => { /* console.log('Upload progress:', event.detail.progress); */ }
                );
            });
        },
        // Schema customization for RTL
        blockSchema: {
            ...BlockNoteEditor.defaultBlockSpecs, // Start with default blocks
            paragraph: { // Extend paragraph
                ...BlockNoteEditor.defaultBlockSpecs.paragraph,
                props: {
                    ...BlockNoteEditor.defaultBlockSpecs.paragraph.props,
                    direction: { default: "ltr" },
                    // textAlignment is already a default prop
                },
                // This tells BlockNote how to render `direction` to HTML
                toDOM: (block) => {
                    const { dom, contentDOM } = BlockNoteNoteEditor.defaultBlockSpecs.paragraph.toDOM(block);
                    if (block.props.direction === "rtl") {
                        dom.setAttribute("dir", "rtl");
                        // Optionally, add data-direction for easier CSS targeting if needed
                        // dom.setAttribute("data-direction", "rtl");
                    } else {
                        dom.removeAttribute("dir");
                        // dom.removeAttribute("data-direction");
                    }
                    return { dom, contentDOM };
                }
            },
            // You would extend 'heading' and other text blocks similarly
            // heading: { ... similar extension ... },
        }
    });

    // If editor is null, BlockNoteView will throw an error.
    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <BlockNoteView
            editor={editor}
            onChange={() => {
                // The original onChange likely updates the Alpine component's value,
                // which then updates Livewire via $wire.entangle.
                onChange(editor); // Call the original onChange passed from Alpine
            }}
            formattingToolbar={props => ( // Custom formatting toolbar
                <FormattingToolbar>
                    {/* Default buttons */}
                    <FormattingToolbar.Buttons.Bold {...props} />
                    <FormattingToolbar.Buttons.Italic {...props} />
                    <FormattingToolbar.Buttons.Underline {...props} />
                    <FormattingToolbar.Buttons.Strike {...props} />
                    <FormattingToolbar.Buttons.Code {...props} />
                    {/* Custom RTL button */}
                    <RtlButton editor={props.editor} /> {/* Pass the editor instance */}
                    {/* Add other default or custom buttons as needed */}
                    <FormattingToolbar.Buttons.TextColor {...props} />
                    <FormattingToolbar.Buttons.BackgroundColor {...props} />
                    <FormattingToolbar.Buttons.Link {...props} />
                    {/* <FormattingToolbar.Buttons.Image {...props} /> */}
                    {/* <FormattingToolbar.Buttons.TextAlign {...props} /> */}
                </FormattingToolbar>
            )}
            // You can also customize other parts like SideMenu, SlashMenu here
            // by passing your own React components to them.
        />
    );
}