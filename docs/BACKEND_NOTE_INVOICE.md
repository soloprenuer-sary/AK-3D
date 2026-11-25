# Frontend note: GST invoice PDF

From the WordPress side (2026-11-22). Live on `admin.akrinity.in` in `akrinity-invoices.php` v2.0.0 (plus the folder `akrinity-invoices/` with the layout), with our own code and no WordPress plugin (the PDF is drawn by the open-source Dompdf library kept inside the folder `akrinity-invoices/vendor`). **The seller details are temporary** (name, address, GSTIN, HSN, invoice prefix `TEMP-`), and each invoice carries a yellow "temporary details, not a valid tax invoice" strip until the owner and the CA provide the real ones.

## Download route (storefront server only)

```
GET {WP}/wp-json/akrinity/v1/order-invoice?order=<number>&key=<order key>      (or &contact=<email or phone used>)
Header: X-Akrinity-Key: <AKRINITY_SHARED_SECRET>
```

`200 { "number": "TEMP-00001", "filename": "Akrinity-invoice-TEMP-00001.pdf", "pdf": "<base64>" }`. Decode `pdf` and send it to the browser as `application/pdf` with `Content-Disposition: attachment; filename=<filename>`. Do not call this route from the browser (it needs the shared key).

| HTTP | code | Meaning and suggested wording |
|---|---|---|
| 404 | `not_found` | Order number and key/email/phone do not match |
| 409 | `not_yet` | The invoice exists once the order has shipped (In transit or Completed), or when it is Processing and already paid online. Hide the button until then, or show "Your invoice is ready once your order ships". |
| 503/500 | `unavailable`, `pdf_failed` | Try again later |
| 401 | `rest_forbidden` | Wrong or missing key |

The order lookup already tells you `status` and `is_paid`, so show the **Download invoice** button when `status` is `in-transit` or `completed`, or `status` is `processing` and `is_paid` is true and `payment_method` is not `cod`.

The first download or email attachment gives the order its invoice number from our own running series (`AKRINITY_INVOICE_PREFIX` + a 5-digit number); the same number is reused afterwards. The studio also has a **GST invoice** box on every order in WordPress with a Download button. The invoice is also attached to the **In transit** and **Order complete** emails.

## What is on the invoice
Seller name, address and GSTIN; buyer name, address and GSTIN (if a business entered one at checkout); invoice number and date; order number and date; place of supply; each line with HSN, quantity, rate, taxable value, CGST and SGST (or IGST) and amount; delivery and cash on delivery fee lines; totals; amount in words; "tax payable on reverse charge: No".
