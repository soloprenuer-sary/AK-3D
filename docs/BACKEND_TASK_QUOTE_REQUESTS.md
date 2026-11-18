# Backend task: custom quote requests, customer files and statuses

For the WordPress / WooCommerce backend team. Snippet version **2.4.0** (replaces 2.3.0).

## What the storefront does

The **Request a quote** page (`/quote`) saves each request under **Quote requests** in the WordPress admin menu and emails the admin (and the customer, if they gave an email). The customer's 3D file (or sketch) is now **stored on the server** so the studio can download it and prepare the quote.

How the file travels: after the request is saved, the customer's browser sends the file straight to WordPress in 2 MB pieces (so no single request is large), using a one-time token from the request that lasts 2 hours. If a piece fails, the page shows a "Try the upload again" button that resumes where it stopped.

Accepted types: STL, 3MF, OBJ, STEP, STP, IGES, IGS, JPG, PNG, PDF. Maximum 300 MB.

## What the studio sees in WordPress admin (Quote requests)

- **List:** Reference (`QR-…`), Request, Type, **Status**, **File** (Stored, Uploading, Waiting, Deleted), Phone, Email, Received. A dropdown above the list filters by status.
- **Request screen:**
  - **Request details:** all fields.
  - **Status** (right side): a coloured label, a dropdown to change it and a note box. Press **Update** to save. Statuses: New, Reviewing, Quoted, Awaiting payment, Paid, In production, Ready to ship, Shipped, Completed, Cancelled, Refunded, Returned. A new request starts as New.
  - **Customer file:** file name, size and upload time, a **Download file** button and a **Delete file** button (asks to confirm). When the status is Completed, Cancelled, Refunded or Returned, a yellow reminder says the file can be deleted.
  - **History:** every status change, note, upload, download and deletion, with who and when.
- Deleting a request for good also deletes its file.
- Only signed-in users who can edit posts (administrators and editors) can download or delete files. Each button needs a one-time security check.

## What needs deploying

Replace `wp-content/mu-plugins/akrinity-headless-auth.php` with `wordpress/mu-plugins/akrinity-headless-auth.php` from the repo (2.4.0). No new settings. The shared key (`AKRINITY_SHARED_SECRET`) must already be set in `wp-config.php` and Vercel.

## Things to check on the server (VERIFY)

1. **Folder:** the snippet creates `wp-content/akr-private/` with a `.htaccess` that blocks web access, and stores files under random names. Confirm the folder is created and writable, and that opening `https://admin.akrinity.in/wp-content/akr-private/index.php` or any file in it is refused. If the host does not honour `.htaccess` (for example Nginx only), block that folder in the server config.
2. **Request size:** each upload piece is about 2 MB. Make sure the host allows a 4 MB request body to `/wp-json/akrinity/v1/quote-file` (PHP `post_max_size` and any firewall or CDN limit).
3. **Cross-site upload:** the customer's browser calls WordPress directly, so WordPress must send the normal REST CORS headers. Test one upload from `https://akrinity.in/quote`.
4. **Disk space:** files up to 300 MB each stay until deleted. Delete them when a job is closed.

## How to check

1. Plugins > Must-Use shows the Akrinity snippet at version 2.4.0.
2. On `https://akrinity.in/quote`, choose a small test file, fill the form and send. The page should say the file was uploaded.
3. In Quote requests, open the new entry: the Customer file box shows the file, Download works, Status can be changed, History lists the steps. Delete the file with the button, then delete the test request.

The code has been tested for syntax and against a stand-in (checksum of a 5 MB file matched after chunked upload, and a failed piece resumed correctly). It has not run inside real WordPress yet, so expect small fixes on first use.

## Not built yet

- **Emails to the customer when the status changes** (for example when it becomes Quoted). Easy to add if wanted.
- **3D preview inside WordPress admin.** For now the studio downloads the file and opens it in a slicer.
- **Linking a quote to a WooCommerce order** (Paid, In production and so on are tracked here by hand, not by WooCommerce).
