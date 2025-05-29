import React from "react"; // Make sure React is imported
import {
  BlockNoteEditor, // Import from @blocknote/core
  defaultBlockSpecs, // Import defaultBlockSpecs directly if available, or access via BlockNoteEditor.defaultBlockSpecs
} from "@blocknote/core";
import { useCreateBlockNote, FormattingToolbar } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css"; // Essential for Mantine version

// Custom RTL Button React Component
const RtlButton = (props) => {
  // Expects editor to be passed in props by FormattingToolbar
  const { editor } = props;

  const toggleRtl = () => {
    const currentSelectedBlocks =
      editor.getSelection()?.blocks || editor.getSelectedBlocks() || [];
    const targetBlocks =
      currentSelectedBlocks.length > 0
        ? currentSelectedBlocks
        : editor.getTextCursorPosition().block
        ? [editor.getTextCursorPosition().block]
        : [];

    targetBlocks.forEach((block) => {
      const newDirection = block.props.direction === "rtl" ? "ltr" : "rtl";
      const newTextAlign = newDirection === "rtl" ? "right" : "left";
      editor.updateBlock(block, {
        props: {
          ...block.props,
          direction: newDirection,
          textAlignment: newTextAlign,
        },
      });
    });
  };

  const isActive = () => {
    const currentSelectedBlocks =
      editor.getSelection()?.blocks || editor.getSelectedBlocks() || [];
    const targetBlocks =
      currentSelectedBlocks.length > 0
        ? currentSelectedBlocks
        : editor.getTextCursorPosition().block
        ? [editor.getTextCursorPosition().block]
        : [];
    return (
      targetBlocks.length > 0 &&
      targetBlocks.every((block) => block.props.direction === "rtl")
    );
  };

  const rtlIconSVG = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <path d="M10 4v7h3V4h2v14h-2v-5h-3v5H8V4zm9 0h-2v14h2zM6 12l-4 4l4 4v-3h12v-2H6z" />
    </svg>
  );

  return (
    <FormattingToolbar.Button // Use Mantine's Toolbar Button
      onClick={toggleRtl}
      // active={isActive()} // `active` prop might need a state if the button should visually change
      mainTooltip="Toggle RTL/LTR"
    >
      {rtlIconSVG}
    </FormattingToolbar.Button>
  );
};

// Define your custom block schema using the imported defaultBlockSpecs
const customBlockSchemaWithRTL = {
  ...defaultBlockSpecs, // Spread the defaults
  paragraph: {
    ...defaultBlockSpecs.paragraph, // Spread default paragraph
    props: {
      ...defaultBlockSpecs.paragraph.props, // Spread default paragraph props
      direction: { default: "ltr" },
      // textAlignment is already a default prop
    },
    toDOM: (block) => {
      // Ensure correct `block` parameter name
      const { dom, contentDOM } = defaultBlockSpecs.paragraph.toDOM(block); // Use `block`
      if (block.props.direction === "rtl") {
        dom.setAttribute("dir", "rtl");
      } else {
        dom.removeAttribute("dir");
      }
      return { dom, contentDOM };
    },
  },
  // You would extend 'heading' and other text-based blocks similarly for RTL
  // heading: {
  //     ...defaultBlockSpecs.heading,
  //     props: {
  //         ...defaultBlockSpecs.heading.props,
  //         direction: { default: "ltr" },
  //     },
  //     toDOM: (block) => { /* ... similar to paragraph ... */ }
  // },
};

export default function FilamentBlockNoteEditor({
  value,
  onChange,
  statePath,
  uploadActionName,
}) {
  // statePath and uploadActionName are passed down from main.jsx (Alpine component)

  const editor = useCreateBlockNote({
    initialContent: value ? JSON.parse(value) : undefined,
    trailingBlock: false, // As per original package
    uploadFile: async (file) => {
      // Ensure $wire is robustly found. This part is tricky because $wire is Alpine/Livewire context.
      // This implementation assumes the Alpine component is on a Livewire component's root or a child.
      let livewireComponent = null;
      if (window.Alpine && window.Alpine.$wire) {
        // If Alpine has a global $wire
        livewireComponent = window.Alpine.$wire;
      } else if (
        window.Livewire &&
        typeof window.Livewire.find === "function"
      ) {
        // Attempt to find the closest Livewire component ID if not global
        // This might need adjustment based on your actual DOM structure
        const anyLivewireElement = document.querySelector("[wire\\:id]");
        if (anyLivewireElement) {
          const livewireComponentId =
            anyLivewireElement.getAttribute("wire:id");
          livewireComponent = window.Livewire.find(livewireComponentId);
        }
      }

      if (!livewireComponent) {
        console.error(
          "[BlockNote React] $wire (Livewire component instance) not found for file upload."
        );
        throw new Error("Livewire component instance not found for upload.");
      }

      const livewireTempUploadPath = `componentFileAttachments.${statePath}`;
      console.log(
        `[BlockNote React] Starting Livewire file upload for property: ${livewireTempUploadPath}`
      );

      return new Promise((resolve, reject) => {
        livewireComponent.upload(
          livewireTempUploadPath,
          file,
          (uploadedFilename) => {
            console.log(
              "[BlockNote React] Livewire temp upload success:",
              uploadedFilename
            );
            console.log(
              `[BlockNote React] Calling FormComponentAction: ${uploadActionName} for statePath: ${statePath}`
            );
            livewireComponent
              .callFormComponentAction(statePath, uploadActionName) // This is Filament's JS helper
              .then((finalUrl) => {
                if (finalUrl && typeof finalUrl === "string") {
                  console.log(
                    "[BlockNote React] Action success, final URL:",
                    finalUrl
                  );
                  resolve(finalUrl);
                } else {
                  console.error(
                    "[BlockNote React] Action did not return a valid URL:",
                    finalUrl
                  );
                  reject("URL not returned from server for file upload.");
                }
              })
              .catch((error) => {
                console.error(
                  "[BlockNote React] callFormComponentAction for file upload failed:",
                  error
                );
                reject(
                  error instanceof Error
                    ? error
                    : new Error(JSON.stringify(error))
                );
              });
          },
          (error) => {
            console.error(
              "[BlockNote React] Livewire file upload direct error:",
              error
            );
            reject(
              new Error("File upload to Livewire temporary storage failed.")
            );
          },
          (event) => {
            // console.log(`[BlockNote React] Upload progress: ${event.detail.progress}%`);
          }
        );
      });
    },
    blockSchema: customBlockSchemaWithRTL, // Use your customized schema
  });

  if (!editor) {
    // This can happen briefly while useCreateBlockNote initializes
    return <div>Loading BlockNote editor...</div>;
  }

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => {
        onChange(editor); // Call the original onChange passed from Alpine to update Livewire
      }}
      formattingToolbar={(
        toolbarProps // toolbarProps includes the editor instance
      ) => (
        <FormattingToolbar>
          {/* Default Mantine buttons */}
          <FormattingToolbar.Buttons.Bold {...toolbarProps} />
          <FormattingToolbar.Buttons.Italic {...toolbarProps} />
          <FormattingToolbar.Buttons.Underline {...toolbarProps} />
          <FormattingToolbar.Buttons.Strike {...toolbarProps} />
          <FormattingToolbar.Buttons.Code {...toolbarProps} />
          {/* Your Custom RTL button */}
          <RtlButton editor={toolbarProps.editor} />{" "}
          {/* Pass the editor instance */}
          <FormattingToolbar.Buttons.TextColor {...toolbarProps} />
          <FormattingToolbar.Buttons.BackgroundColor {...toolbarProps} />
          <FormattingToolbar.Buttons.Link {...toolbarProps} />
          {/* Add other desired buttons here */}
        </FormattingToolbar>
      )}
      // Other props like sideMenu, slashMenu can be customized similarly if needed
    />
  );
}
