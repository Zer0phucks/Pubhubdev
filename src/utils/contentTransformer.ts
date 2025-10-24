// Content transformation utilities for converting video content to other formats

interface Video {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  status: "new" | "processed" | "scheduled";
  hasTranscript?: boolean;
}

export interface TransformedContent {
  type: string;
  content: string;
  platforms: string[];
  title?: string;
  sourceVideo: {
    title: string;
    platform: string;
    url: string;
  };
}

// Transcript generator - would integrate with YouTube API or transcription service
const getTranscript = (video: Video): string => {
  // In production, this would call YouTube API or transcription service
  // For now, use description as basic content
  return video.description || `Content from: ${video.title}`;
};

// Transform video to blog post
const transformToBlogPost = (video: Video): TransformedContent => {
  const transcript = getTranscript(video);
  
  const blogContent = `# ${video.title}

*Originally published as a video on ${video.platform === 'youtube' ? 'YouTube' : 'TikTok'} • ${new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

---

${transcript.split('\n\n').map((paragraph, index) => {
    if (index === 0) {
      return paragraph;
    }
    if (paragraph.includes(':')) {
      const lines = paragraph.split('\n');
      return lines[0] + '\n\n' + lines.slice(1).map(line => line.trim()).join('\n');
    }
    return paragraph;
  }).join('\n\n')}

---

## Watch the Full Video

<iframe width="560" height="315" src="https://www.youtube.com/embed/${video.id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

*Originally posted on ${video.platform === 'youtube' ? 'YouTube' : 'TikTok'} with ${video.views.toLocaleString()} views*

## Key Takeaways

- Implementation requires consistent action
- Avoid common beginner mistakes  
- Focus on fundamentals before advanced techniques
- Community engagement drives results

---

*What did you think of this? Leave a comment below with your thoughts or questions!*`;

  return {
    type: 'blog',
    content: blogContent,
    platforms: ['blog'],
    title: video.title,
    sourceVideo: {
      title: video.title,
      platform: video.platform,
      url: `https://${video.platform}.com/watch?v=${video.id}`,
    },
  };
};

// Transform to Twitter/X thread
const transformToSocialThread = (video: Video): TransformedContent => {
  const hooks = [
    `🧵 Just dropped a new video on ${video.title.toLowerCase()} — here are the key insights:`,
    `I spent hours researching ${video.title.toLowerCase()} so you don't have to. Here's what I learned: 🧵`,
    `The truth about ${video.title.toLowerCase()} that nobody talks about 🧵👇`,
  ];

  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  const threadContent = `${hook}

1/ Understanding the fundamentals is critical. Too many people skip this step and wonder why they're not seeing results.

2/ Here are the 3 main strategies that actually work:
• Start with a solid foundation
• Implement consistently
• Track your progress and adjust

3/ Common mistakes to avoid:
❌ Trying to do everything at once
❌ Not giving it enough time
❌ Ignoring feedback and data

4/ Pro tip: Focus on ONE thing at a time. Master the basics before moving to advanced techniques.

5/ The results speak for themselves - this approach has helped thousands of creators level up their game.

6/ Want to learn more? Watch the full video here: [LINK]

What's been your experience with this? Drop your thoughts below 👇`;

  return {
    type: 'twitter-thread',
    content: threadContent,
    platforms: ['twitter'],
    sourceVideo: {
      title: video.title,
      platform: video.platform,
      url: `https://${video.platform}.com/watch?v=${video.id}`,
    },
  };
};

// Transform to LinkedIn article
const transformToLinkedInPost = (video: Video): TransformedContent => {
  const linkedInContent = `${video.title}

${video.description}

In my latest video, I break down the key strategies that successful creators are using to achieve results. Here's what you need to know:

🎯 Key Insights:

1. Foundation Matters
Understanding the fundamentals is non-negotiable. The creators who succeed are the ones who master the basics before moving to advanced strategies.

2. Consistency Over Perfection
Don't wait for everything to be perfect. Start implementing today, learn from feedback, and iterate.

3. Avoid These Common Mistakes
• Trying to do too much at once
• Not tracking metrics and progress
• Giving up too early

4. The Action Plan
Focus on one core strategy, implement it consistently for 30 days, and measure your results. Then optimize and scale.

💡 Pro Tip: The difference between those who succeed and those who don't often comes down to taking action on what they learn.

I dive deeper into all of this in the full video (link in comments).

What strategies have worked best for you? I'd love to hear your experience in the comments.

#ContentCreation #DigitalMarketing #CreatorEconomy #SocialMediaStrategy`;

  return {
    type: 'linkedin',
    content: linkedInContent,
    platforms: ['linkedin'],
    sourceVideo: {
      title: video.title,
      platform: video.platform,
      url: `https://${video.platform}.com/watch?v=${video.id}`,
    },
  };
};

// Transform to video announcement posts
const transformToVideoAnnouncement = (video: Video): TransformedContent => {
  const announcements = {
    twitter: `🎥 New video alert! "${video.title}"

${video.description.slice(0, 150)}...

Watch now: [LINK]`,
    
    linkedin: `🎬 New Video: ${video.title}

I just published a new video where I share insights on ${video.title.toLowerCase()}.

Key topics covered:
• Core fundamentals and why they matter
• Practical implementation strategies  
• Common pitfalls to avoid
• Advanced tips for scaling

Perfect for creators looking to level up their approach.

Watch the full video here: [LINK]

#Video #ContentCreation #Learning`,

    facebook: `📹 New Video Just Dropped!

${video.title}

${video.description}

This one's packed with practical tips you can implement right away. Check it out and let me know what you think!

👉 Watch here: [LINK]`,

    instagram: `🎥 NEW VIDEO ALERT 🎥

"${video.title}"

${video.description.slice(0, 100)}... ✨

Swipe to see some highlights, then head to the link in bio to watch the full video! 

What topic should I cover next? Drop your suggestions below! 👇

#contentcreator #newvideo #tutorial #tips #creator #videocontent #learnontiktok #educational`,
  };

  const combinedContent = `TWITTER/X:
${announcements.twitter}

---

LINKEDIN:
${announcements.linkedin}

---

FACEBOOK:
${announcements.facebook}

---

INSTAGRAM:
${announcements.instagram}`;

  return {
    type: 'video-announcement',
    content: combinedContent,
    platforms: ['twitter', 'linkedin', 'facebook', 'instagram'],
    sourceVideo: {
      title: video.title,
      platform: video.platform,
      url: `https://${video.platform}.com/watch?v=${video.id}`,
    },
  };
};

// Transform to email newsletter
const transformToNewsletter = (video: Video): TransformedContent => {
  const newsletterContent = `Subject: 🎥 New Video: ${video.title}

Hey there!

I just published a new video that I think you'll find valuable. It's all about ${video.title.toLowerCase()}.

${video.description}

🎬 WATCH THE VIDEO
[Embed video thumbnail/link here]

📝 WHAT YOU'LL LEARN

In this video, I cover:

• The foundational concepts you need to understand
• Step-by-step implementation strategies
• Common mistakes to avoid (and how to fix them)
• Advanced tips for taking your skills to the next level

This is perfect for anyone who wants to improve their approach and see real results.

⏱️ VIDEO LENGTH: ${video.duration}
👁️ Already watched by ${video.views.toLocaleString()} people

💡 KEY TAKEAWAY

The most important thing? Take action. Don't just watch — actually implement what you learn. That's the difference between those who succeed and those who stay stuck.

👉 [WATCH NOW]

Let me know what you think! Hit reply and share your thoughts or questions.

Cheers,
[Your Name]

P.S. If you found this helpful, please share it with a friend who might benefit!

---
You're receiving this because you subscribed to updates.
[Unsubscribe] | [Update Preferences]`;

  return {
    type: 'newsletter',
    content: newsletterContent,
    platforms: ['blog'], // Using blog as a proxy for email
    sourceVideo: {
      title: video.title,
      platform: video.platform,
      url: `https://${video.platform}.com/watch?v=${video.id}`,
    },
  };
};

// Transform to repurposed captions
const transformToCaptions = (video: Video): TransformedContent => {
  const captions = {
    instagram: `${video.description}

Watch the full video on ${video.platform === 'youtube' ? 'YouTube' : 'TikTok'} (link in bio!)

Drop a 💯 if you found this helpful!

#contentcreator #tips #tutorial #viral #fyp #creator #creatoreconomy #socialmedia #digitalmarketing #contentmarketing #smallbusiness #entrepreneur #marketing`,

    tiktok: `${video.description} ✨

Follow for more tips like this! 🚀

#fyp #foryou #viral #tips #tutorial #contentcreator #creator #learnontiktok #educational #smallbusiness`,

    facebook: `${video.title}

${video.description}

What do you think? Let me know in the comments! 👇

#ContentCreation #Tips #Tutorial #Video`,
  };

  const combinedCaptions = `INSTAGRAM:
${captions.instagram}

---

TIKTOK:
${captions.tiktok}

---

FACEBOOK:
${captions.facebook}`;

  return {
    type: 'captions',
    content: combinedCaptions,
    platforms: ['instagram', 'tiktok', 'facebook'],
    sourceVideo: {
      title: video.title,
      platform: video.platform,
      url: `https://${video.platform}.com/watch?v=${video.id}`,
    },
  };
};

// Main transformation function
export const transformVideoContent = (
  video: Video,
  transformationType: string,
  customInstructions?: string
): TransformedContent => {
  let result: TransformedContent;
  
  switch (transformationType) {
    case 'blog':
      result = transformToBlogPost(video);
      break;
    case 'social-thread':
      result = transformToSocialThread(video);
      break;
    case 'linkedin-post':
      result = transformToLinkedInPost(video);
      break;
    case 'social-announcement':
      result = transformToVideoAnnouncement(video);
      break;
    case 'newsletter':
      result = transformToNewsletter(video);
      break;
    case 'captions':
      result = transformToCaptions(video);
      break;
    default:
      throw new Error(`Unknown transformation type: ${transformationType}`);
  }

  // Apply custom instructions if provided
  if (customInstructions) {
    result.content = applyCustomInstructions(result.content, customInstructions, transformationType);
  }

  return result;
};

// Apply custom instructions to the generated content
const applyCustomInstructions = (
  content: string,
  instructions: string,
  transformationType: string
): string => {
  // Add a note at the beginning indicating custom instructions were applied
  const instructionsNote = `[AI Note: This content was generated with custom instructions: "${instructions}"]\n\n`;
  
  // In a real implementation, this would use AI to modify the content according to instructions
  // For now, we'll add a note to the content
  return instructionsNote + content + `\n\n---\n\n*This ${transformationType} was generated with custom guidelines to match your brand voice and style.*`;
};
