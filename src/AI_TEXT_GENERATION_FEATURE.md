# AI Text Generation Feature

## Overview
Added comprehensive AI text generation capabilities throughout PubHub. Users can now generate text using AI anywhere there's a text input, making content creation faster and more efficient.

---

## Components

### 1. AITextGenerator Component (`/components/AITextGenerator.tsx`)

A reusable, context-aware AI text generation component that can be integrated with any text input field.

#### Features
- **Two Display Variants**:
  - `icon` - Compact icon button (Sparkles icon)
  - `button` - Full button with text
- **Context-Aware Generation**: Adapts prompts based on context type
- **Popover Interface**: Clean, non-intrusive UI
- **Text Editing**: Generated text can be edited before use
- **Copy to Clipboard**: Quick copy functionality
- **Regeneration**: Can regenerate with the same prompt
- **Keyboard Shortcuts**: ⌘/Ctrl + Enter to generate
- **Loading States**: Visual feedback during generation

#### Props
```typescript
interface AITextGeneratorProps {
  onGenerate: (text: string) => void;    // Callback when text is used
  context?: string;                       // Context for generation (e.g., message to reply to)
  placeholder?: string;                   // Placeholder for prompt input
  variant?: "icon" | "button";           // Display variant
  buttonText?: string;                    // Text for button variant
  className?: string;                     // Additional CSS classes
  contextType?: "reply" | "post" | "comment" | "template" | "general";
}
```

#### Context Types
Each context type provides specialized prompts and behavior:

| Context Type | Use Case | System Prompt |
|--------------|----------|---------------|
| `reply` | DM/comment replies | "Generate a professional, friendly, and engaging response" |
| `post` | Social media posts | "Generate engaging and creative content" |
| `comment` | Comments on content | "Generate a thoughtful and engaging comment" |
| `template` | Content templates | "Generate versatile and professional text" |
| `general` | General purpose | "Generate helpful and relevant text" |

#### Usage Example
```tsx
<AITextGenerator
  onGenerate={(text) => setReplyText(text)}
  context={selectedMessage.message}
  contextType="reply"
  placeholder="e.g., 'Write a friendly and professional reply'"
  variant="button"
  buttonText="Generate Reply"
/>
```

---

## Integration Points

### 1. Unified Inbox (`/components/UnifiedInbox.tsx`)

**Location**: Reply section when viewing a message

**Features**:
- **Icon variant**: Positioned inside the reply textarea (top-right corner)
- **Button variant**: Positioned above the textarea
- **Context**: Uses the original message content
- **Type**: `contextType="reply"`

**User Flow**:
1. User selects a message/comment/DM
2. Clicks AI button (icon or full button)
3. Describes the type of reply they want
4. AI generates appropriate response
5. User can edit, copy, or use the generated text
6. Text is inserted into the reply field

**Example Prompts Users Might Use**:
- "Write a friendly and professional reply thanking them"
- "Generate an enthusiastic response agreeing with their point"
- "Create a helpful reply answering their question"
- "Write a professional decline"

---

### 2. Content Composer (`/components/ContentComposer.tsx`)

**Location**: Main content editor section

**Features**:
- **Icon variant**: Inside the content textarea (top-right corner)
- **Button variant**: In the card header
- **Type**: `contextType="post"`
- **Context**: No specific context, general content generation

**User Flow**:
1. User is creating new social media content
2. Clicks AI button to generate content
3. Describes the post they want
4. AI generates creative content
5. Content is inserted into the editor
6. User can apply templates and customize further

**Example Prompts Users Might Use**:
- "Write an engaging post about productivity tips"
- "Create a motivational Monday morning post"
- "Generate a product announcement with excitement"
- "Write a behind-the-scenes story about our team"

---

### 3. Template Creation (`/components/CreateTemplateDialog.tsx`)

**Location**: Template content field

**Features**:
- **Icon variant**: Inside the content textarea
- **Button variant**: Next to the "Template Content" label
- **Type**: `contextType="template"`
- **Placeholder-Aware**: Suggests using placeholders like [Topic], [Date]

**User Flow**:
1. User is creating a reusable template
2. Clicks AI button
3. Describes the template purpose
4. AI generates template with placeholders
5. User can customize and save

**Example Prompts Users Might Use**:
- "Create a template for product announcements"
- "Generate a weekly newsletter template"
- "Make a template for behind-the-scenes content"
- "Create a promotional launch template"

---

## UI/UX Design

### Visual Design
- **Primary Color**: Purple gradient (from-purple-500 to-pink-600)
- **Icon**: Sparkles ✨ icon for AI features
- **Placement**: 
  - Icon variant: Top-right corner of textareas (absolute position)
  - Button variant: Logical placement near the field
- **Popover**: 500px wide, aligned to start

### States
1. **Default**: Purple sparkles icon/button
2. **Hover**: Slight background tint on icon
3. **Loading**: Spinner animation with "Generating..." text
4. **Generated**: Text appears with edit capability
5. **Copied**: Checkmark icon briefly appears

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Shortcuts**: ⌘/Ctrl + Enter to generate
- **Labels**: Proper ARIA labels for screen readers
- **Focus Management**: Maintains focus appropriately

---

## AI Generation Logic

### Current Implementation
- **Mock Generation**: Currently uses mock data for demonstration
- **Context-Aware**: Different mock responses based on context type
- **Customization**: Detects keywords like "professional" to adjust tone
- **Delay**: 1.5s artificial delay to simulate API call

### Future Implementation
To connect to a real AI API:

```typescript
const generateText = async () => {
  setLoading(true);
  
  try {
    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        context: context,
        contextType: contextType,
        systemPrompt: getContextPrompt(),
      }),
    });
    
    const data = await response.json();
    setGeneratedText(data.text);
  } catch (error) {
    toast.error("Failed to generate text");
  } finally {
    setLoading(false);
  }
};
```

### Recommended AI Services
- **OpenAI GPT-4**: Best quality, higher cost
- **Anthropic Claude**: Good balance of quality and cost
- **Azure OpenAI**: Enterprise option with compliance
- **Open-source models**: Cost-effective alternatives

---

## Benefits

### For Users
1. **Faster Content Creation**: Generate text in seconds instead of minutes
2. **Writer's Block Solution**: AI suggestions help overcome creative blocks
3. **Consistency**: Maintain consistent tone across responses
4. **Time Savings**: Automate repetitive writing tasks
5. **Quality Improvement**: Professional, well-structured text

### For Engagement
1. **Faster Response Times**: Quick, thoughtful replies to messages
2. **Better Engagement**: More time to interact with community
3. **Professional Tone**: Consistent, appropriate responses
4. **Scaled Communication**: Handle more interactions efficiently

---

## User Guidance

### Best Practices for Prompts

#### Good Prompts ✅
- "Write a friendly thank you reply"
- "Create an engaging post about [specific topic]"
- "Generate a professional decline message"
- "Make an enthusiastic product launch announcement"

#### Poor Prompts ❌
- "Write something" (too vague)
- "Reply" (no context or style)
- "Make a post" (no topic or goal)

### Tips for Users
1. **Be Specific**: Include tone, style, and purpose
2. **Provide Context**: Mention what the content is about
3. **Edit Generated Text**: Always review and customize
4. **Save Good Results**: Turn successful generated text into templates
5. **Experiment**: Try different prompts to see what works best

---

## Technical Details

### Component Structure
```
AITextGenerator
├── Popover Trigger (Icon/Button)
└── Popover Content
    ├── Header (AI Text Generator label)
    ├── Context Description
    ├── Prompt Input (Textarea)
    ├── Generate Button
    └── Generated Text Section
        ├── Editable Textarea
        ├── Copy Button
        ├── Use Text Button
        └── Regenerate Button
```

### State Management
```typescript
const [open, setOpen] = useState(false);              // Popover state
const [prompt, setPrompt] = useState("");             // User's prompt
const [generatedText, setGeneratedText] = useState(""); // AI output
const [loading, setLoading] = useState(false);        // Generation state
const [copied, setCopied] = useState(false);          // Copy feedback
```

### Integration Pattern
```tsx
// Icon variant in textarea
<div className="relative">
  <Textarea
    value={text}
    onChange={(e) => setText(e.target.value)}
    className="pr-12"
  />
  <div className="absolute top-2 right-2">
    <AITextGenerator
      onGenerate={(text) => setText(text)}
      variant="icon"
    />
  </div>
</div>

// Button variant as standalone
<AITextGenerator
  onGenerate={(text) => setText(text)}
  variant="button"
  buttonText="Generate with AI"
/>
```

---

## Future Enhancements

### Planned Features
1. **Tone Selection**: Dropdown to choose tone (casual, professional, enthusiastic, etc.)
2. **Length Control**: Slider to control output length
3. **Multi-Language**: Generate in different languages
4. **History**: Save recently generated texts
5. **Favorites**: Star and save favorite generated texts
6. **Variations**: Generate multiple versions at once
7. **Smart Suggestions**: AI suggests prompts based on context
8. **Learning**: Improve based on user edits and preferences

### Advanced Capabilities
1. **Content Repurposing**: Convert one format to another
2. **SEO Optimization**: Generate SEO-friendly content
3. **A/B Testing**: Generate variants for testing
4. **Personalization**: Learn user's writing style
5. **Hashtag Generation**: Auto-suggest relevant hashtags
6. **Emoji Insertion**: Smart emoji recommendations

---

## Analytics & Metrics

### Recommended Tracking
1. **Usage Metrics**:
   - Number of generations per user
   - Most common context types
   - Accept rate (text used vs. discarded)
   - Edit rate (how often users edit generated text)

2. **Quality Metrics**:
   - User satisfaction ratings
   - Text length generated
   - Regeneration frequency
   - Prompt patterns

3. **Performance Metrics**:
   - Generation time
   - Error rates
   - API costs
   - User retention with AI features

---

## Cost Considerations

### API Costs (Estimated)
Based on OpenAI GPT-4 pricing:
- **Cost per generation**: ~$0.01-0.05
- **Monthly cost (100 users, 10 gen/day)**: $300-1500
- **Optimization**: Cache common patterns, use cheaper models for simple tasks

### Cost Reduction Strategies
1. Use GPT-3.5 for simple tasks
2. Implement prompt caching
3. Set generation limits per user
4. Use streaming for better UX
5. Batch similar requests

---

## Files Modified

1. `/components/AITextGenerator.tsx` - New reusable component
2. `/components/UnifiedInbox.tsx` - Added AI to reply section
3. `/components/ContentComposer.tsx` - Added AI to content editor
4. `/components/CreateTemplateDialog.tsx` - Added AI to template creation

---

## Testing Checklist

- [x] Component renders correctly in both variants
- [x] Popover opens/closes properly
- [x] Generate button requires prompt
- [x] Loading state displays during generation
- [x] Generated text appears and is editable
- [x] Copy to clipboard works
- [x] Use text inserts into parent component
- [x] Regenerate creates new text
- [x] Keyboard shortcuts work
- [x] Mobile responsive design
- [x] Context types generate appropriate text
- [x] Toast notifications appear
- [x] Integration with UnifiedInbox
- [x] Integration with ContentComposer
- [x] Integration with CreateTemplateDialog

---

## Success Metrics

### Adoption
- 70%+ of users try AI generation within first session
- 40%+ of content created uses AI assistance
- 3+ average generations per user per session

### Quality
- 80%+ of generated text is used (not discarded)
- 60%+ of users rate AI quality as "good" or "excellent"
- Less than 30% regeneration rate

### Impact
- 50%+ reduction in content creation time
- 30%+ increase in reply speed
- 25%+ increase in content published
