# Quick Start Guide

## 🚀 How to Use the New Features

### For Users/Customers:

#### 1. Scan QR Code with Camera
- On the home page, click **"Use Camera to Scan QR"**
- Allow camera permission when prompted
- Point camera at a table QR code
- You'll be automatically redirected to the menu

#### 2. Enter Your Details Before Checkout
- After adding items to cart, click **"Proceed to Checkout"**
- You'll be taken to a **Customer Details** page
- Fill in your:
  - **Full Name** (required)
  - **Phone Number** (required, must be 10 digits)
  - **Email** (optional)
- Click **"Continue to Checkout"**

#### 3. View Estimated Delivery Time
- Before confirming payment, you'll see an info banner about estimated time
- The admin will set this after you place your order
- Check your order tracking page to see the updated time

### For Admin:

#### 1. Login to Admin Panel
- On the home page, click **"Admin"** button in the top-right
- Enter password: **`admin123`**
- You'll be taken to the **Admin Dashboard**

#### 2. Set Estimated Delivery Time
- In the Admin Dashboard, you'll see all orders
- Click the **"Set Estimated Time"** button on any order
- Enter the estimated time in **minutes** (e.g., 15, 20, 30)
- Click **"Confirm"**
- The customer will immediately see this time in their tracking page

#### 3. View Customer Details
- Click the **"Customer Details"** section on any order
- See the customer's:
  - Name
  - Phone Number
  - Email (if provided)
- You can collapse/expand this section

#### 4. Monitor Order Status
- See real-time order status (Received, Preparing, Ready, Completed)
- View all items in each order
- Check payment method used (UPI or Counter)
- See total amount for each order

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `src/pages/AdminLoginPage.tsx` | Admin login screen |
| `src/pages/AdminDashboardPage.tsx` | Admin control panel |
| `src/pages/CustomerDetailsPage.tsx` | Customer info form page |
| `src/components/CustomerDetailsForm.tsx` | Reusable customer form |
| `src/components/QRScanner.tsx` | Camera-based QR scanner |
| `FEATURES_IMPLEMENTED.md` | Full feature documentation |

## 🔧 Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Added new routes for admin and customer details |
| `src/pages/LandingPage.tsx` | Added admin button and QR scanner |
| `src/pages/CartPage.tsx` | Redirect to customer details instead of checkout |
| `src/pages/CheckoutPage.tsx` | Show customer details and estimated time |
| `src/pages/OrderTrackingPage.tsx` | Display customer details and estimated time |
| `src/store/useStore.ts` | Added state for customer details and admin |
| `src/types/index.ts` | Added CustomerDetails interface |

## 🎨 Key Features Summary

✅ **Admin Login** - Secure authentication  
✅ **QR Code Scanner** - Camera-based table identification  
✅ **Customer Details Form** - Collect name, phone, email  
✅ **Estimated Time** - Admin sets delivery time  
✅ **Order Tracking** - Shows all information to customer  
✅ **Customer Details Display** - Admin can view customer info  

## 🔐 Demo Credentials

**Admin Password:** `admin123`

## 💡 Tips

- The QR scanner can work with any QR code
- In demo mode, the system generates random table IDs
- All data is stored in browser memory (localStorage-friendly store)
- The app is fully responsive for mobile devices
- Camera permission is required to use QR scanner

## 🐛 Troubleshooting

**Camera not working?**
- Check browser permissions
- Make sure you're using HTTPS or localhost
- Try the "Demo Mode (Table 12)" button instead

**Not seeing estimated time?**
- Make sure admin has set it in the dashboard
- Refresh the order tracking page
- The time appears only after admin sets it

**Can't login as admin?**
- Password is: `admin123` (case-sensitive)
- Make sure there are no extra spaces

Enjoy using FlashDine! 🍽️
