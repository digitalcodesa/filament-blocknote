// FilamentBlockNoteEditor.jsx with Optimized RTL Support
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

// Custom RTL/LTR Buttons
const DirectionButtons = () => {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();

  if (!Components || !editor) {
    return null;
  }

  const applyDirection = (blockId, alignment) => {
    // Only apply direction to the specific block that changed
    requestAnimationFrame(() => {
      const blockElement = document.querySelector(`[data-id="${blockId}"]`);
      if (blockElement) {
        const contentElements = blockElement.querySelectorAll('.bn-inline-content');
        const direction = alignment === 'right' ? 'rtl' : 'ltr';
        
        contentElements.forEach(el => {
          el.setAttribute('dir', direction);
          el.style.direction = direction;
          el.style.unicodeBidi = direction === 'rtl' ? 'embed' : 'normal';
        });
      }
    });
  };

  const handleDirectionChange = (direction) => {
    try {
      const currentBlock = editor.getTextCursorPosition()?.block;
      
      if (!currentBlock) {
        return;
      }

      const alignment = direction === "rtl" ? "right" : "left";
      
      // Update block alignment
      editor.updateBlock(currentBlock, {
        props: {
          ...currentBlock.props,
          textAlignment: alignment,
        },
      });

      // Apply direction immediately to this specific block
      applyDirection(currentBlock.id, alignment);

    } catch (error) {
      console.error(`[Direction Button] Error:`, error);
    }
  };

  const getDirection = () => {
    try {
      const currentBlock = editor.getTextCursorPosition()?.block;
      if (!currentBlock) return "ltr";
      
      return currentBlock.props?.textAlignment === 'right' ? 'rtl' : 'ltr';
    } catch (error) {
      return "ltr";
    }
  };

  const currentDirection = getDirection();

  return (
    <>
      <Components.FormattingToolbar.Button
        label="LTR"
        mainTooltip="Left to Right"
        isSelected={currentDirection === "ltr"}
        onClick={() => handleDirectionChange("ltr")}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
          </svg>
        }
      />
      <Components.FormattingToolbar.Button
        label="RTL"
        mainTooltip="Right to Left"
        isSelected={currentDirection === "rtl"}
        onClick={() => handleDirectionChange("rtl")}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M10 10v5h2V4h2v11h2V4h2V2h-8c-2.21 0-4 1.79-4 4s1.79 4 4 4zM8 17v-3l-4 4 4 4v-3h12v-2H8z" />
          </svg>
        }
      />
    </>
  );
};

export default function FilamentBlockNoteEditor({
  value,
  onChange,
  statePath,
  uploadActionName = 'handleFileUpload',
  livewire,
}) {
  const editor = useCreateBlockNote({
    initialContent: value ? JSON.parse(value) : undefined,
    trailingBlock: false,
    uploadFile: async (file) => {
      console.log("[BlockNote React] Starting file upload...");
      
      if (!livewire) {
        console.error("[BlockNote React] Livewire instance not available");
        throw new Error("Livewire instance not available");
      }

      let actualLivewireComponent = null;
      
      try {
        const editorElement = document.querySelector('[x-data*="blocknoteEditor"]');
        if (editorElement && editorElement._x_dataStack) {
          const alpineData = editorElement._x_dataStack[0];
          if (alpineData && alpineData.$wire) {
            actualLivewireComponent = alpineData.$wire;
          }
        }
        
        if (!actualLivewireComponent && window.Livewire) {
          actualLivewireComponent = window.Livewire.first();
        }
        
        if (!actualLivewireComponent) {
          actualLivewireComponent = livewire;
        }
      } catch (error) {
        console.error("[BlockNote React] Error finding Livewire component:", error);
        actualLivewireComponent = livewire;
      }

      const livewireTempUploadPath = `componentFileAttachments.${statePath}`;

      return new Promise((resolve, reject) => {
        actualLivewireComponent.upload(
          livewireTempUploadPath,
          file,
          (uploadedFilename) => {
            console.log("[BlockNote React] Temp upload success:", uploadedFilename);
            
            try {
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
                  const dummyUrl = `/storage/editor-uploads/test-${Date.now()}.png`;
                  resolve(dummyUrl);
                  return;
                }
                
                const currentMethod = actionMethods[methodIndex];
                
                currentMethod()
                  .then(result => {
                    if (result?.url) {
                      resolve(result.url);
                    } else if (result && typeof result === 'string' && (result.startsWith('/') || result.startsWith('http'))) {
                      resolve(result);
                    } else if (result && Array.isArray(result) && result.length > 0 && result[0].url) {
                      resolve(result[0].url);
                    } else {
                      methodIndex++;
                      tryNextMethod();
                    }
                  })
                  .catch(error => {
                    console.error(`[BlockNote React] Method failed:`, error);
                    methodIndex++;
                    tryNextMethod();
                  });
              }
              
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
  });

  // Apply direction only on initial load and when explicitly needed
  React.useEffect(() => {
    if (!editor) return;

    // Apply direction based on existing content only once on load
    const applyInitialDirections = () => {
      editor.forEachBlock((block) => {
        if (block.props?.textAlignment === 'right') {
          const blockElement = document.querySelector(`[data-id="${block.id}"]`);
          if (blockElement) {
            const contentElements = blockElement.querySelectorAll('.bn-inline-content');
            contentElements.forEach(el => {
              el.setAttribute('dir', 'rtl');
              el.style.direction = 'rtl';
              el.style.unicodeBidi = 'embed';
            });
          }
        }
        return true;
      });
    };

    // Apply once after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(applyInitialDirections, 200);

    return () => clearTimeout(timeoutId);
  }, [editor]);

  // CSS for RTL support
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* RTL Support - Using CSS selectors instead of JavaScript */
      
      /* Apply RTL based on text alignment attribute */
      [data-text-alignment="right"] .bn-inline-content {
        direction: rtl !important;
        unicode-bidi: embed !important;
      }
      
      /* Maintain direction for elements with dir attribute */
      .bn-inline-content[dir="rtl"] {
        direction: rtl !important;
        unicode-bidi: embed !important;
      }
      
      .bn-inline-content[dir="ltr"] {
        direction: ltr !important;
        unicode-bidi: normal !important;
      }
      
      /* Visual indicators removed - no borders */
      
      /* List support */
      [data-text-alignment="right"] ul,
      [data-text-alignment="right"] ol {
        direction: rtl !important;
        padding-right: 40px !important;
        padding-left: 0 !important;
      }
      
      /* Ensure all text content respects alignment */
      [data-text-alignment="right"] * {
        text-align: right !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => document.head.removeChild(style);
  }, []);

  if (!editor) {
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
              <DirectionButtons key={"directionButtons"} />
            </FormattingToolbar>
          );
        }}
      />
    </BlockNoteView>
  );
}