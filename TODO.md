# TODO: Fix Invoice Download Issue

## Tasks
- [x] Fix backend order creation to populate product details before invoice generation
- [x] Update frontend to check invoice existence for all orders
- [x] Test invoice generation and download functionality

## Details
- Issue: 404 error when downloading invoices because invoices are generated without populated product data
- Root cause: Order object not populated with product details (seller, name) before invoice generation
- Frontend condition only checks for invoices on orders with status 'confirmed', 'shipped', or 'delivered', but invoices exist for all orders
