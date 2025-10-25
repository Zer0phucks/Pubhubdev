# AI Auto-Reply Feature

## Overview
Enhanced the AI text generation system to support automatic reply generation in the Unified Inbox, allowing users to generate contextual responses with a single click without typing any prompts.

## Implementation Details

### AITextGenerator Component Updates
- Added `autoGenerate` prop (boolean) to enable automatic generation mode
- When `autoGenerate={true}`, the component:
  - Automatically triggers text generation when the popover opens
  - Uses intelligent default prompts based on `contextType`
  - Skips the manual prompt input step
  - Shows a loading state while generating
  - Displays the generated text for editing or immediate use

### Default Prompts by Context Type
- **reply**: "Write a friendly, professional, and engaging reply"
- **post**: "Create an engaging social media post"
- **comment**: "Write a thoughtful and engaging comment"
- **template**: "Create a versatile content template"
- **general**: "Generate helpful text"

### User Flow in Unified Inbox
1. User selects a message from the inbox
2. User clicks "Generate Reply" button
3. AI automatically generates a contextual response based on the original message
4. Generated text appears in an editable textarea
5. User can:
   - Edit the generated text directly
   - Copy it to clipboard
   - Regenerate with a different variation
   - Use the text to populate the reply field
6. User can send the reply or continue editing

### Technical Implementation
- Modified `AITextGenerator.tsx`:
  - Added `autoGenerate` prop to interface
  - Created `getDefaultPrompt()` function for context-specific default prompts
  - Updated `generateText()` to accept `useAutoPrompt` parameter
  - Added `handleOpenChange()` to trigger auto-generation on popover open
  - Conditionally hide prompt input UI when in auto-generate mode
  - Added loading state display for auto-generation

- Modified `UnifiedInbox.tsx`:
  - Set `autoGenerate={true}` on the "Generate Reply" button's AITextGenerator
  - Removed the placeholder prop (not needed for auto-generation)
  - Kept the icon variant in the textarea for manual generation with custom prompts

## Benefits
- **Faster workflow**: No need to type prompts for common reply scenarios
- **Context-aware**: Automatically considers the original message when generating
- **Flexible**: Users can still customize by editing generated text or regenerating
- **Consistent**: Uses optimized default prompts for quality responses
- **Progressive enhancement**: Icon button still allows custom prompt input if needed

## Future Enhancements
- Connect to real AI API (currently using mock responses)
- Add sentiment analysis to adjust tone based on incoming message
- Support multiple reply variations to choose from
- Add user preference settings for default reply styles
- Include conversation history for more contextual responses
