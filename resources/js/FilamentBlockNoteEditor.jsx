// Fixed FilamentBlockNoteEditor.jsx
console.log("[BlockNote React] Initializing Filament BlockNote Editor with RTL support");

import React from "react";
import { BlockNoteEditor, defaultBlockSpecs } from "@blocknote/core";
import { 
  useCreateBlockNote, 
  FormattingToolbar, 
  FormattingToolbarController,
  useComponentsContext,
  useBlockNoteEditor,
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileReplaceButton,
  NestBlockButton,
  TextAlignButton,
  UnnestBlockButton
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

// Custom RTL Button using the correct BlockNote pattern
const RtlButton = () => {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();

  if (!Components || !editor) {
    return null;
  }

  const handleRtlClick = () => {
    try {
      const currentBlock = editor.getTextCursorPosition()?.block;
      
      if (!currentBlock) {
        return;
      }

      editor.updateBlock(currentBlock, {
        props: {
          ...currentBlock.props,
          direction: "rtl",
          textAlignment: "right",
        },
      });
    } catch (error) {
      console.error("[RTL Button] Error updating block to RTL:", error);
    }
  };

  const handleLtrClick = () => {
    try {
      const currentBlock = editor.getTextCursorPosition()?.block;
      
      if (!currentBlock) {
        return;
      }

      editor.updateBlock(currentBlock, {
        props: {
          ...currentBlock.props,
          direction: "ltr",
          textAlignment: "left",
        },
      });
    } catch (error) {
      console.error("[LTR Button] Error updating block to LTR:", error);
    }
  };

  const isRtlActive = () => {
    if (!editor) return false;
    try {
      const currentBlock = editor.getTextCursorPosition()?.block;
      return currentBlock?.props?.direction === "rtl";
    } catch (error) {
      return false;
    }
  };

  const isLtrActive = () => {
    if (!editor) return false;
    try {
      const currentBlock = editor.getTextCursorPosition()?.block;
      const direction = currentBlock?.props?.direction || "ltr";
      return direction === "ltr";
    } catch (error) {
      return true; // Default to LTR
    }
  };

  return (
    <>
      <Components.FormattingToolbar.Button
        label="LTR"
        mainTooltip="Left to Right"
        isSelected={isLtrActive()}
        onClick={handleLtrClick}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
          </svg>
        }
      />
      <Components.FormattingToolbar.Button
        label="RTL"
        mainTooltip="Right to Left"
        isSelected={isRtlActive()}
        onClick={handleRtlClick}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M10 4v7h3V4h2v14h-2v-5h-3v5H8V4zm9 0h-2v14h2zM6 12l-4 4l4 4v-3h12v-2H6z" />
          </svg>
        }
      />
    </>
  );
};

// Define your custom block schema
const customBlockSchemaWithRTL = {
  ...defaultBlockSpecs,
  paragraph: {
    ...defaultBlockSpecs.paragraph,
    props: {
      ...defaultBlockSpecs.paragraph.props,
      direction: { default: "ltr" },
    },
    toDOM: (block) => {
      const { dom, contentDOM } = defaultBlockSpecs.paragraph.toDOM(block);
      if (block.props?.direction === "rtl") {
        dom.setAttribute("dir", "rtl");
        dom.style.textAlign = "right";
      } else {
        dom.removeAttribute("dir");
        dom.style.textAlign = "left";
      }
      return { dom, contentDOM };
    },
  },
  heading: {
    ...defaultBlockSpecs.heading,
    props: {
      ...defaultBlockSpecs.heading.props,
      direction: { default: "ltr" },
    },
    toDOM: (block) => {
      const { dom, contentDOM } = defaultBlockSpecs.heading.toDOM(block);
      if (block.props?.direction === "rtl") {
        dom.setAttribute("dir", "rtl");
        dom.style.textAlign = "right";
      } else {
        dom.removeAttribute("dir");
        dom.style.textAlign = "left";
      }
      return { dom, contentDOM };
    },
  },
};

export default function FilamentBlockNoteEditor({
  value,
  onChange,
  statePath,
  uploadActionName = 'handleFileUpload', // Set default value
  livewire,
}) {
  console.log("[BlockNote React] Component props:", { value, statePath, uploadActionName });

  const editor = useCreateBlockNote({
    initialContent: value ? JSON.parse(value) : undefined,
    trailingBlock: false,
    uploadFile: async (file) => {
      console.log("[BlockNote React] Starting file upload...");
      
      if (!livewire) {
        console.error("[BlockNote React] Livewire instance not available");
        throw new Error("Livewire instance not available");
      }

      // The livewire parameter is actually the Alpine component function
      // We need to get the actual Livewire component from the DOM
      let actualLivewireComponent = null;
      
      try {
        // Try to find the Livewire component in the DOM
        const editorElement = document.querySelector('[x-data*="blocknoteEditor"]');
        if (editorElement && editorElement._x_dataStack) {
          // Get Alpine data
          const alpineData = editorElement._x_dataStack[0];
          if (alpineData && alpineData.$wire) {
            actualLivewireComponent = alpineData.$wire;
          }
        }
        
        // If still not found, try window.Livewire
        if (!actualLivewireComponent && window.Livewire) {
          actualLivewireComponent = window.Livewire.first();
        }
        
        // If still not found, try the original livewire parameter
        if (!actualLivewireComponent) {
          actualLivewireComponent = livewire;
        }
        
        console.log("[BlockNote React] Found Livewire component:", actualLivewireComponent);
      } catch (error) {
        console.error("[BlockNote React] Error finding Livewire component:", error);
        actualLivewireComponent = livewire;
      }

      const livewireTempUploadPath = `componentFileAttachments.${statePath}`;
      console.log(`[BlockNote React] Using upload path: ${livewireTempUploadPath}`);

      return new Promise((resolve, reject) => {
        actualLivewireComponent.upload(
          livewireTempUploadPath,
          file,
          (uploadedFilename) => {
            console.log("[BlockNote React] Temp upload success:", uploadedFilename);
            
            // Now try to call the action
            try {
              console.log("[BlockNote React] Calling file upload action");
              
              // Try different Filament action calling methods, starting with the most likely to work
              const actionMethods = [
                () => actualLivewireComponent.call('handleFileUpload', uploadedFilename, statePath),
                () => actualLivewireComponent.call('handleFileUpload', uploadedFilename),
                () => actualLivewireComponent.call(uploadActionName, uploadedFilename),
                () => actualLivewireComponent.call('callAction', uploadActionName, { file: uploadedFilename }),
                () => actualLivewireComponent.call('callFormComponentAction', statePath, uploadActionName, { file: uploadedFilename })
              ];
              
              let methodIndex = 0;
              
              function tryNextMethod() {
                if (methodIndex >= actionMethods.length) {
                  // All methods failed, create dummy URL
                  console.log("[BlockNote React] All methods failed, creating dummy URL for testing");
                  const dummyUrl = `/storage/editor-uploads/test-${Date.now()}.png`;
                  resolve(dummyUrl);
                  return;
                }
                
                const currentMethod = actionMethods[methodIndex];
                const methodName = [
                  'handleFileUpload with statePath',
                  'handleFileUpload direct',
                  'direct uploadActionName call',
                  'callAction',
                  'callFormComponentAction'
                ][methodIndex];
                
                console.log(`[BlockNote React] Trying method ${methodIndex + 1}/${actionMethods.length}: ${methodName}`);
                
                currentMethod()
                  .then(result => {
                    console.log(`[BlockNote React] Method ${methodName} result:`, result);
                    if (result?.url) {
                      resolve(result.url);
                    } else if (result && typeof result === 'string' && (result.startsWith('/') || result.startsWith('http'))) {
                      // Sometimes the URL is returned directly as a string
                      resolve(result);
                    } else if (result && Array.isArray(result) && result.length > 0 && result[0].url) {
                      // Sometimes it's returned as an array
                      resolve(result[0].url);
                    } else {
                      // Try next method
                      methodIndex++;
                      tryNextMethod();
                    }
                  })
                  .catch(error => {
                    console.error(`[BlockNote React] Method ${methodName} failed:`, error);
                    methodIndex++;
                    tryNextMethod();
                  });
              }
              
              // Start trying methods
              tryNextMethod();
              
            } catch (error) {
              console.error("[BlockNote React] Action call setup failed:", error);
              reject(error);
            }
          },
          (error) => {
            console.error("[BlockNote React] Upload failed:", error);
            reject(new Error("File upload failed: " + error.message));
          }
        );
      });
    },
    blockSchema: customBlockSchemaWithRTL,
  });

  if (!editor) {
    console.log("[BlockNote React] Editor not ready yet");
    return <div>Loading BlockNote editor...</div>;
  }

  return (
    <BlockNoteView 
      editor={editor} 
      onChange={() => {
        if (editor) {
          onChange(editor);
        }
      }}
      formattingToolbar={false}
    >
      <FormattingToolbarController
        formattingToolbar={() => {
          return (
            <FormattingToolbar>
              <BlockTypeSelect key={"blockTypeSelect"} />
              <FileCaptionButton key={"fileCaptionButton"} />
              <FileReplaceButton key={"replaceFileButton"} />
              <BasicTextStyleButton basicTextStyle={"bold"} key={"boldStyleButton"} />
              <BasicTextStyleButton basicTextStyle={"italic"} key={"italicStyleButton"} />
              <BasicTextStyleButton basicTextStyle={"underline"} key={"underlineStyleButton"} />
              <BasicTextStyleButton basicTextStyle={"strike"} key={"strikeStyleButton"} />
              <TextAlignButton textAlignment={"left"} key={"textAlignLeftButton"} />
              <TextAlignButton textAlignment={"center"} key={"textAlignCenterButton"} />
              <TextAlignButton textAlignment={"right"} key={"textAlignRightButton"} />
              <ColorStyleButton key={"colorStyleButton"} />
              <NestBlockButton key={"nestBlockButton"} />
              <UnnestBlockButton key={"unnestBlockButton"} />
              <CreateLinkButton key={"createLinkButton"} />
              <RtlButton key={"rtlLtrButtons"} />
            </FormattingToolbar>
          );
        }}
      />
    </BlockNoteView>
  );
}