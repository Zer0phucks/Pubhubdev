# WordPress Integration for PubHub

## Overview

PubHub now supports WordPress blogging platform integration, allowing you to publish content directly from PubHub to your WordPress blog. This integration uses WordPress Application Passwords for secure authentication and provides full administrative capabilities.

## Features

✅ **Secure Authentication**: Uses WordPress Application Passwords (WordPress 5.6+)
✅ **View Posts**: Retrieve and view all your WordPress posts
✅ **Create Posts**: Create new blog posts as drafts or published
✅ **Edit Posts**: Update existing blog posts
✅ **Publish Drafts**: Convert draft posts to published status
✅ **Save as Draft**: Save posts as drafts for later publishing

## Setup Instructions

### Prerequisites

1. **WordPress 5.6 or higher** (Application Passwords require WordPress 5.6+)
2. **HTTPS enabled** on your WordPress site (required for Application Passwords)
3. **WordPress admin access** to generate Application Passwords

### Step 1: Enable Application Passwords in WordPress

Application Passwords are built into WordPress core (5.6+), so no plugins are required. However, you need to ensure your site meets the requirements:

1. Your WordPress site must use HTTPS
2. You must be logged in as an administrator or user with appropriate permissions

### Step 2: Generate an Application Password

1. Log in to your WordPress admin panel
2. Navigate to **Users → Profile** (or **Users → Your Profile**)
3. Scroll down to the **Application Passwords** section
4. Enter "PubHub" as the application name
5. Click **Add New Application Password**
6. **Copy the generated password immediately** (it will only be shown once!)

The password will be in this format: `xxxx xxxx xxxx xxxx xxxx xxxx`

### Step 3: Connect WordPress to PubHub

1. Go to **pubhub.dev** and navigate to **Project Settings → Connections**
2. Find **Blog** in the Available Platforms section
3. Click the **Connect** button
4. In the WordPress connection dialog, enter:
   - **WordPress Site URL**: Your blog URL (e.g., `yourblog.com` or `https://yourblog.com`)
   - **WordPress Username**: Your WordPress admin username
   - **Application Password**: The password you generated in Step 2
5. Click **Connect WordPress**

PubHub will validate your credentials and establish the connection.

## How to Use

### Viewing WordPress Posts

Once connected, you can view your WordPress posts:

```typescript
// GET /wordpress/posts?projectId={projectId}&status=any&perPage=10
// Returns list of WordPress posts
```

### Creating a New Post

To create a new WordPress post from PubHub:

```typescript
// POST /wordpress/posts
{
  projectId: "your-project-id",
  title: "My Blog Post",
  content: "<p>Post content in HTML</p>",
  status: "draft" // or "publish"
}
```

### Saving as Draft

Posts are saved as drafts by default:

```typescript
status: "draft"
```

### Publishing a Post

To publish a draft or create a published post directly:

```typescript
// When creating/updating
status: "publish"

// Or publish an existing draft
// POST /wordpress/posts/:id/publish
{
  projectId: "your-project-id"
}
```

### Updating an Existing Post

To update a WordPress post:

```typescript
// POST /wordpress/posts
{
  projectId: "your-project-id",
  postId: 123, // WordPress post ID
  title: "Updated Title",
  content: "<p>Updated content</p>",
  status: "draft" // or "publish"
}
```

## Security

### Credential Storage

- WordPress credentials are **encrypted** using AES-256-GCM encryption
- Credentials are stored securely in Supabase KV store
- Only the project owner can access their WordPress credentials
- Credentials are never exposed in browser or logs

### Authentication Method

PubHub uses **HTTP Basic Authentication** with Application Passwords, which is the recommended method by WordPress for API access. This is more secure than using your regular WordPress password.

### Permissions

The connected WordPress account needs:
- `edit_posts` capability for creating and editing posts
- `publish_posts` capability for publishing posts
- Admin or Editor role recommended

## API Reference

### Backend Endpoints

#### Connect WordPress
```
POST /make-server-19ccd85e/wordpress/connect
Body: { projectId, siteUrl, username, applicationPassword }
```

#### Disconnect WordPress
```
POST /make-server-19ccd85e/wordpress/disconnect
Body: { projectId }
```

#### Get Posts
```
GET /make-server-19ccd85e/wordpress/posts
Query: projectId, status (any|publish|draft|pending), perPage
```

#### Create/Update Post
```
POST /make-server-19ccd85e/wordpress/posts
Body: { projectId, title, content, status, postId? }
```

#### Publish Draft
```
POST /make-server-19ccd85e/wordpress/posts/:id/publish
Body: { projectId }
```

## Troubleshooting

### "Invalid WordPress credentials"

**Causes:**
- Incorrect username or Application Password
- Site URL is wrong
- Application Passwords not enabled

**Solutions:**
1. Verify your site URL is correct (with or without https://)
2. Double-check your username (not email)
3. Generate a new Application Password
4. Ensure your WordPress site has HTTPS enabled
5. Check WordPress version is 5.6 or higher

### "WordPress not connected"

**Cause:** Connection was disconnected or expired

**Solution:** Reconnect WordPress from Project Settings → Connections

### Application Passwords section not visible

**Causes:**
- WordPress version < 5.6
- HTTPS not enabled on your site
- Plugin/theme conflict

**Solutions:**
1. Update WordPress to latest version
2. Enable HTTPS (SSL certificate required)
3. Check for conflicting plugins

### API requests failing

**Causes:**
- WordPress REST API disabled
- .htaccess blocking API requests
- Server configuration issues

**Solutions:**
1. Ensure WordPress REST API is accessible: `https://yoursite.com/wp-json/`
2. Check .htaccess file for API blocking rules
3. Contact hosting provider if REST API is disabled

## WordPress REST API Reference

PubHub uses the official WordPress REST API v2. For more information:
- [WordPress REST API Documentation](https://developer.wordpress.org/rest-api/)
- [Application Passwords Guide](https://wordpress.org/support/article/application-passwords/)

## Limitations

1. **Media uploads**: Currently, PubHub doesn't support uploading images directly to WordPress. You'll need to use WordPress media library or external image hosting.
2. **Categories and Tags**: Not yet implemented in current version.
3. **Custom Post Types**: Only standard posts are supported currently.
4. **Featured Images**: Not yet supported.

## Future Enhancements

Planned features for future releases:
- 📷 Media library integration for image uploads
- 🏷️ Categories and tags support
- 🖼️ Featured image selection
- 📝 Custom post types support
- 👥 Multi-author support
- 📊 WordPress analytics integration

## Platform Status

Current status: **8 of 9 platforms connected (89%)**

Connected platforms:
- ✅ Twitter
- ✅ Instagram
- ✅ LinkedIn
- ✅ Facebook
- ✅ YouTube
- ✅ TikTok
- ✅ Pinterest
- ✅ Reddit
- ✅ **WordPress Blog** (NEW!)

## Need Help?

If you encounter any issues with WordPress integration:
1. Check this documentation first
2. Verify WordPress version and HTTPS status
3. Try regenerating your Application Password
4. Contact PubHub support with error details

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Status**: Production Ready ✅
