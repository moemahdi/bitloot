### TAWK INTEGRATION

## 🧩 **1. Overview**

**Tawk.to** provides a small JavaScript snippet that embeds their live chat widget into your website.
It works entirely on the client side, so you **don’t need any server changes**.
You can:

- Chat with customers in real time (from the Tawk.to dashboard or mobile app)
- See active visitors
- Get chat transcripts
- Configure triggers and availability schedules
- Use branding, canned responses, and agents.

---

## ⚙️ **2. Get Your Tawk.to Property ID**

1. Go to **[https://dashboard.tawk.to/](https://dashboard.tawk.to/)**
2. Create an account (or log in).
3. Add a new “Property” (your domain, e.g., `bitloot.io`).
4. Once created, you’ll get a script that looks like this:

```html
<script type="text/javascript">
  var Tawk_API = Tawk_API || {},
    Tawk_LoadStart = new Date();
  (function () {
    var s1 = document.createElement('script'),
      s0 = document.getElementsByTagName('script')[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/default';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
  })();
</script>
```

Keep your **`YOUR_PROPERTY_ID`** — you’ll need it in your code.

---

## 💻 **3. Integration in Next.js (Frontend)**

Since your BitLoot frontend is a **Next.js App Router (React 19 PWA)**, you should insert the script dynamically **on the client side only**, to prevent SSR errors.

### ✅ Option A — Use `next/script` in your root layout

In your `app/layout.tsx` (or `layout.jsx`):

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* ✅ Tawk.to Live Chat */}
        <Script
          id="tawk-to"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/default';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
```

🧠 _Replace `YOUR_PROPERTY_ID` with your real property ID._

That’s it — the Tawk.to widget will appear in the **bottom-right corner** of every page automatically.

---

### ✅ Option B — Create a dedicated `TawkToWidget` component

If you want **more control** (like enabling only on certain pages):

```tsx
'use client';
import { useEffect } from 'react';

export default function TawkToWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('tawk-to')) return; // prevent duplicate load

    const script = document.createElement('script');
    script.id = 'tawk-to';
    script.async = true;
    script.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/default';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);
  }, []);

  return null;
}
```

Then import it only where you want it active:

```tsx
import TawkToWidget from '@/components/TawkToWidget';

export default function HomePage() {
  return (
    <>
      <main>...Your content...</main>
      <TawkToWidget />
    </>
  );
}
```

---

## 🧱 **4. Advanced Usage (Optional)**

### 🔐 Identify Logged-In Users (Admin/Customer)

You can attach user data to Tawk.to for context:

```tsx
window.Tawk_API = window.Tawk_API || {};
window.Tawk_API.visitor = {
  name: user?.email || 'Guest',
  email: user?.email || '',
};
```

For example, inside your `useEffect` after login:

```tsx
useEffect(() => {
  if (typeof window !== 'undefined' && user) {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.visitor = {
      name: user.name || user.email,
      email: user.email,
    };
  }
}, [user]);
```

This helps your support team see who they’re chatting with.

---

### 🧩 Control Widget Programmatically

Tawk.to exposes an API you can use via `window.Tawk_API`, for example:

```js
window.Tawk_API.hideWidget(); // Hide chat
window.Tawk_API.showWidget(); // Show chat
window.Tawk_API.maximize(); // Open chat box
window.Tawk_API.minimize(); // Minimize
```

This is useful if you want to **disable chat during checkout** or **hide it in the admin dashboard**.

---

## 🧰 **5. Admin Dashboard Integration (Optional)**

If you want to chat with customers **from inside your own admin panel**:

- You can either **embed the Tawk.to chat dashboard** via `<iframe>` (URL from your Tawk.to dashboard),
- Or just open **[https://dashboard.tawk.to/](https://dashboard.tawk.to/)** in a new tab — all customer chats appear there live.

---

## 🔒 **6. Security Notes**

✅ Safe to use — the snippet is sandboxed.
✅ GDPR-compliant — anonymizes visitor IPs if you enable it in settings.
✅ Works well with **Cloudflare + HTTPS** (your current setup).
✅ Fully compatible with **Next.js ISR, caching, and PWA** behavior.

---

## 🧠 TL;DR — Summary

| Step | Action                                                   |
| ---- | -------------------------------------------------------- |
| 1️⃣   | Create a Tawk.to property and copy the embed code.       |
| 2️⃣   | Add the script using `next/script` or a React component. |
| 3️⃣   | (Optional) Pass `user.email` for identification.         |
| 4️⃣   | Control visibility via `window.Tawk_API`.                |
| 5️⃣   | Handle support chats from your Tawk.to dashboard.        |

---

Perfect 👌 — let’s make sure **Tawk.to** integrates smoothly **without interfering with sensitive flows** like checkout or the admin area.

Below is a **clean, production-ready setup** for **Next.js App Router** that dynamically injects Tawk.to only when it should be visible.

---

## 🎯 **Goal**

Hide or disable the Tawk.to live chat widget on:

- `/checkout` and payment pages
- `/admin/*` routes
- (Optional) any other sensitive routes, like `/auth/*`

Show it everywhere else — e.g., homepage, product pages, support pages, etc.

---

## ⚙️ **Step 1: Create a TawkToWidget Component**

Create a reusable component under
`components/TawkToWidget.tsx` (or `.jsx`):

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function TawkToWidget() {
  const pathname = usePathname();

  // Define where NOT to load the widget
  const hiddenRoutes = ['/checkout', '/admin', '/auth'];

  const shouldHide = hiddenRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    // Remove existing instance if switching routes
    const existingScript = document.getElementById('tawk-to');
    if (existingScript) {
      existingScript.remove();
      const iframe = document.querySelector("iframe[src*='tawk.to']");
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    if (shouldHide) return; // ✅ Don’t load Tawk on restricted pages

    // ✅ Inject Tawk.to script dynamically
    const script = document.createElement('script');
    script.id = 'tawk-to';
    script.async = true;
    script.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/default';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);

    return () => {
      // Cleanup when navigating away
      const iframe = document.querySelector("iframe[src*='tawk.to']");
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
  }, [pathname, shouldHide]);

  return null;
}
```

🧠 **What this does:**

- Detects the current route via `usePathname()`
- Unmounts or injects the widget dynamically
- Cleans up the iframe on navigation
- Prevents multiple script loads (critical for SPAs)

---

## 🏗️ **Step 2: Mount the Widget Globally**

Add it once in your main layout — typically `app/layout.tsx`:

```tsx
import TawkToWidget from '@/components/TawkToWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <TawkToWidget />
      </body>
    </html>
  );
}
```

✅ The widget now loads automatically _except_ on restricted routes.

---

## 🔐 **Step 3: (Optional) Identify Logged-In Users**

If you have authenticated users (e.g., dashboard accounts), you can attach context to the chat session:

```tsx
useEffect(() => {
  if (typeof window !== 'undefined' && window.Tawk_API && user) {
    window.Tawk_API.visitor = {
      name: user.name || user.email,
      email: user.email,
    };
  }
}, [user]);
```

You can add this logic either in the same component or in your global `useAuth()` hook.

This lets your support team instantly see who they’re chatting with inside the Tawk.to dashboard.

---

## 🎛️ **Step 4: Extra Controls (Optional)**

Tawk exposes several methods you can call via `window.Tawk_API`:

| Function       | Description                  |
| -------------- | ---------------------------- |
| `hideWidget()` | Hides the chat bubble        |
| `showWidget()` | Shows the chat bubble        |
| `maximize()`   | Opens chat window            |
| `minimize()`   | Minimizes chat window        |
| `endChat()`    | Ends the active chat session |

Example:

```js
window.Tawk_API?.hideWidget();
```

You can trigger this based on app state (like `isPaymentActive`, `isAdmin`, etc.) — useful if your checkout page is dynamic.

---

## 🧱 **Step 5: Verification**

After deploying or running locally:

1. Visit `/` → chat bubble appears (✅)
2. Visit `/checkout` → no chat bubble (✅)
3. Visit `/admin/dashboard` → no chat (✅)
4. Return to `/` → chat reappears instantly (✅)

---

## 🧩 **Optional: Tawk.to Settings to Review**

In your **Tawk.to dashboard → Property Settings:**

- **Widget Appearance:** set corner, colors, greeting text
- **Availability:** define active hours
- **Pre-chat Form:** collect name/email before starting chat
- **GDPR toggle:** enable consent prompt
- **Trigger messages:** send automated greetings after a delay

---

## ✅ **Final Summary**

| Step                     | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| Create `TawkToWidget`    | Dynamic chat loader tied to route changes  |
| Add in `RootLayout`      | Globally available across pages            |
| Define hidden routes     | Disable chat where sensitive actions occur |
| (Optional) Identify user | Attach `user.name` + `user.email`          |
| Verify in browser        | Confirm chat appears only where expected   |

---
