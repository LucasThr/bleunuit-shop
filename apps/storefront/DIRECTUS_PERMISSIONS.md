# Fixing Directus Permissions

## The Problem

You're getting a "FORBIDDEN" error because your Directus API doesn't have permission to read the collections. This is a security feature in Directus - by default, collections are private.

## Solution: Configure Public Role Permissions

### Step-by-Step Instructions:

1. **Open your Directus Admin Panel**
   - Go to your Directus URL in the browser
   - Log in with your admin credentials

2. **Navigate to Roles & Permissions**
   - Click on **Settings** (gear icon) in the sidebar
   - Click on **Roles & Permissions**

3. **Edit the Public Role**
   - Find the **"Public"** role in the list
   - Click on it to open the permissions editor

4. **Grant Read Permissions to Collections**

   For each collection below, you need to enable **READ** permission:

   - ✅ **categories** - Set to: **All Access** or **Custom** with Read enabled
   - ✅ **subcategories** - Set to: **All Access** or **Custom** with Read enabled
   - ✅ **products** - Set to: **All Access** or **Custom** with Read enabled
   - ✅ **stores** - Set to: **All Access** or **Custom** with Read enabled
   - ✅ **blog_posts** - Set to: **All Access** or **Custom** with Read enabled (with filter: `published = true`)
   - ✅ **brands** - Set to: **All Access** or **Custom** with Read enabled
   - ✅ **site_settings** - Set to: **All Access** or **Custom** with Read enabled

5. **Configure Custom Permissions (Recommended)**

   For each collection:
   - Click on the collection name
   - Enable the **"Read"** toggle (eye icon)
   - Optionally set field permissions (usually "All" fields)

   **For blog_posts specifically:**
   - Enable Read permission
   - Add a filter rule: `published` equals `true`
   - This ensures only published posts are visible publicly

6. **Save Changes**
   - Click the checkmark or Save button
   - Permissions are applied immediately

## Quick Fix (Visual Guide)

```
Settings → Roles & Permissions → Public →

For each collection:
┌─────────────────────────────────────────┐
│ Collection: products                    │
├─────────────────────────────────────────┤
│ [ ] Create                              │
│ [✓] Read          ← Enable this         │
│ [ ] Update                              │
│ [ ] Delete                              │
└─────────────────────────────────────────┘
```

## Verify Permissions

After setting permissions:

1. **Test the API directly** in your browser:
   ```
   https://your-directus-url/items/products
   ```
   You should see JSON data, not an error

2. **Restart your Astro dev server**
   ```bash
   npm run dev
   ```

3. **Check if the error is gone**

## Security Note

- Only enable READ permissions for public collections
- Never enable CREATE, UPDATE, or DELETE for the Public role
- For sensitive data, create custom roles with authentication
- Use filters to limit what data is accessible (e.g., only published blog posts)

## Alternative: Use an API Token (For Private Data)

If you need to access data that shouldn't be public:

1. Create a new role with appropriate permissions
2. Create a user with that role
3. Generate a static token for that user
4. Add the token to your `.env` file
5. Update `directus.config.ts` to use the token for authentication

Let me know if you need help with the token-based approach!
