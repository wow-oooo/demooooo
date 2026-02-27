# Beardo - Customization Guide

## 🎨 Branding Customization

### Change Business Name

**In `index.html`**, find and replace:
```html
<!-- Change these -->
<span>Elite Barber</span>              → <span>Your Shop Name</span>
<title>Elite Barber - Premium...</title> → <title>Your Shop Name - ...</title>
```

Also update in footer:
```html
<h3>Elite Barber</h3> → <h3>Your Shop Name</h3>
<p>&copy; 2026 Elite Barber...</p> → <p>&copy; 2026 Your Shop Name...</p>
```

### Change Color Scheme

**In `style.css`**, edit the root variables to whatever palette you prefer. The site now ships with a blue‑orange dark theme, but you can use any combo:

```css
:root {
    --primary-color: #3498db;   /* vivid blue (brand/main buttons) */
    --secondary-color: #2c3e50; /* deep navy (cards, nav background) */
    --accent-color: #e67e22;    /* warm orange (highlights) */
    --dark-bg: #1c1c1c;         /* charcoal background */
    --light-text: #ecf0f1;      /* light text color */
    --card-bg: #2c3e50;         /* default card background */
    --border-color: #34495e;    /* border/shadow color */
}
```

Want different vibes? try these examples:

```css
/* Warm Red & Black */
--primary-color: #e74c3c;
--accent-color: #c0392b;

/* Cool Teal */
--primary-color: #1abc9c;
--accent-color: #16a085;

/* Vintage Olive */
--primary-color: #556b2f;
--accent-color: #8db600;

/* Monochrome */
--primary-color: #bdc3c7;
--accent-color: #7f8c8d;

/* Purple‑Coral Dark (current) */
--primary-color: #6a0dad;
--accent-color: #ff6f61;
--dark-bg: #1a1a2e;
--card-bg: #2e294e;

/* Black / Orange / White (previous theme) */
--primary-color: #ff6f00;
--accent-color: #ffffff;
--dark-bg: #000000;
--card-bg: #111111;

/* Orange‑primary / Yellow‑accent / Dark charcoal (current theme) */
--primary-color: #ff6f00;
--accent-color: #ffea00;
--dark-bg: #0f0f0f;
--secondary-color: #1a1a1a;
--card-bg: #1a1a1a;
--border-color: #333333;
```
## 📍 Location & Contact Updates

Find the Contact section in `index.html`:

```html
<!-- UPDATE THESE VALUES -->
<p>123 Main Street, Sector 8</p>           → Your Address
<p>Ajmer, Rajasthan 305001</p>             → Your City
<p>+91 9999 999 999</p>                    → Your Phone
<p>hello@elitebarber.com</p>               → Your Email
<p>Mon-Sun: 9:00 AM - 10:00 PM</p>         → Your Hours
```

### WhatsApp Link
```html
<a href="https://wa.me/919999999999?text=Hello%20Elite%20Barber">
```
Change phone number format: `+91[YOUR_10_DIGIT_NUMBER]`

## 💲 Services & Pricing

### Add New Service

1. Find the service section you want to edit
2. Copy an existing service card:

```html
<div class="service-card">
    <div class="service-icon">✂️</div>
    <h3>Service Name</h3>
    <p>Service description here</p>
    <div class="service-details">
        <span class="price">₹000</span>
        <span class="duration">00 min</span>
    </div>
    <button class="btn-service" onclick="addToBooking('Service Name', 000)">Book</button>
</div>
```

3. Update:
   - Icon (emoji or Font Awesome)
   - Service name
   - Description
   - Price
   - Duration
   - Function parameters

### Update Existing Prices

Find service card and update:
```html
<span class="price">₹500</span>  → Change 500 to new price
<span class="duration">30 min</span> → Change duration
```

## 👨‍💼 Barber Profiles

### Update Barber Information

Find barber cards in the Barbers section:

```html
<h3>Raj Kumar</h3>                          → Barber name
<div class="barber-specialty">Expert in Fades</div>  → Specialty
<div class="barber-experience">7+ Years</div>        → Experience
<div class="stars">★★★★★</div>              → Rating
<span>4.9 (45 reviews)</span>               → Rating details
```

### Change Barber Photos

Replace image URLs:
```html
<div class="barber-image" style="background-image: url('NEW_IMAGE_URL')"></div>
```

**Image sources:**
- Unsplash: https://unsplash.com
- Pexels: https://pexels.com
- Pixabay: https://pixabay.com

## 🖼️ Gallery Images

### Update Gallery Photos

Find gallery items:
```html
<img src="https://images.unsplash.com/photo-XXX?w=400&h=400" alt="Description">
```

Replace with your images or use Unsplash URLs.

## 🎁 Packages & Pricing

### Modify Package Details

Find packages section:

```html
<h3>Monthly Grooming Pass</h3>
<div class="package-price">₹2500</div>  <!-- Change price -->

<ul class="package-features">
    <li>✓ 2 Haircuts</li>          <!-- Edit features -->
    <li>✓ 2 Beard Trims</li>
    <li>✓ 1 Hair Spa</li>
    <!-- Add more features -->
</ul>
```

## 🛒 Products

### Add/Update Products

Find product cards:

---

## 🛠️ Admin Panel Customization

The admin interface now includes queue management, sales tracking, and full
content management for services, barbers and gallery images. You can extend or
modify these pages by editing the HTML in `admin/` and the related APIs in
`server.js`.

### Queue Management
- `/admin/update-queue` (now **Manage Queue**) shows the full list of queue
  entries and lets the administrator remove individual customers. The list is
  persisted in `queue.json`.
- When an entry is removed or when a booking is rescheduled, the server will
  generate a notification message linked to the customer's phone number. Users
  can enter their phone on the public site (bottom of home page) to view these
  messages.
- Administrators may also reschedule an existing booking directly from
  `/admin/bookings` – clicking **Reschedule** prompts for a new date/time and
  automatically notifies the affected customer.
- You may adjust the data stored for each entry (e.g. add barber, notes) and
  update the front‑end JavaScript (`script.js`) accordingly.

### Sales Tracking
- `/admin/sales` allows adding, viewing and deleting sale records. The data is
  stored in `sales.json`.
- Add fields or export functionality as desired; the server APIs in
  `server.js` are simple JSON endpoints (`/admin/api/sales`).

### Services, Barbers & Gallery
- `/admin/services` let you define service offerings with name, description,
  price, duration, category, an icon and an optional image URL.
- `/admin/barbers` manage barber profiles including specialty, experience,
  rating and photo URL.
- `/admin/gallery` upload image URLs with caption, description and category; the
  public gallery respects these categories for filtering.
- All three lists are stored in `services.json`, `barbers.json` and
  `gallery.json` respectively and drive the homepage content via `/api/...`
  endpoints.

Modify `admin/admin.css` to change the look of these pages if needed.

## 🛒 Products

### Add/Update Products

Find product cards:

```html
<h3>Beard Oil</h3>                          <!-- Product name -->
<p>Nourishing oil for beard...</p>          <!-- Description -->
<div class="product-price">₹499</div>       <!-- Price -->
<div class="product-rating">★★★★★ (89)</div> <!-- Rating -->
```

### Change Product Images

```html
<div class="product-image" style="background-image: url('NEW_URL')"></div>
```

## 📧 Contact Information

### Add Social Media Links

Find footer social links:

```html
<a href="https://www.facebook.com/yourpage"><i class="fab fa-facebook"></i></a>
<a href="https://www.instagram.com/yourprofile"><i class="fab fa-instagram"></i></a>
<a href="https://www.twitter.com/yourhandle"><i class="fab fa-twitter"></i></a>
<a href="https://www.youtube.com/yourchannel"><i class="fab fa-youtube"></i></a>
```

## 🎯 Hero Section

### Change Hero Image

```css
.hero {
    background-image: url('YOUR_IMAGE_URL');
    background-size: cover;
    background-position: center;
}
```

### Update Hero Text

```html
<h1>Premium Men's Grooming</h1>  → Your tagline
<p>Experience the art of...</p>   → Your description
```

## 📱 Mobile Optimization

The website is fully responsive. Test on different devices:

**Responsive sizes:**
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: 480px - 767px

Adjust breakpoints in `style.css`:
```css
@media (max-width: 768px) {
    /* Tablet styles */
}

@media (max-width: 480px) {
    /* Mobile styles */
}
```

## 🔧 Advanced Customizations

### Add Google Maps

Update the contact section:

```html
<iframe src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE" 
        width="100%" height="400"></iframe>
```

1. Go to Google Maps
2. Find your location
3. Click "Share"
4. Get "Embed a map"
5. Copy the iframe code

### Add Google Reviews

```html
<!-- Add this in reviews section -->
<script src="https://cdn.trustindex.io/loader.js?v=..."></script>
```

Get code from TrustIndex or Google Review widgets.

### Add WhatsApp Chat Widget

```html
<!-- Add before closing </body> tag -->
<script async src="https://cdn.jsdelivr.net/npm/wa-widget@1.0/wa.js"></script>
```

## 💾 Files to Customize

| File | What to Change |
|------|----------------|
| index.html | Business info, services, barbers, contact |
| style.css | Colors, fonts, spacing, responsive sizes |
| script.js | Booking logic, cart, loyalty system |

## 📝 Step-by-Step: Complete Branding

### 1. Basic Info (5 minutes)
- [ ] Change business name
- [ ] Update phone & email
- [ ] Update address & hours
- [ ] Update opening hours

### 2. Branding (10 minutes)
- [ ] Change color scheme
- [ ] Update hero image
- [ ] Update logo/icon
- [ ] Change favicon

### 3. Services (15 minutes)
- [ ] Add/remove services
- [ ] Update prices
- [ ] Update durations
- [ ] Update descriptions

### 4. Team (10 minutes)
- [ ] Update barber names
- [ ] Upload barber photos
- [ ] Update specialties
- [ ] Update experience

### 5. Content (15 minutes)
- [ ] Update gallery images
- [ ] Update testimonials
- [ ] Update products
- [ ] Update packages

### 6. Deploy (5 minutes)
- [ ] Test on mobile
- [ ] Check all links
- [ ] Verify contact info
- [ ] Upload to hosting

## 🚀 Quick Deployment

### Local Testing
1. Open `index.html` in browser
2. Test all features
3. Check mobile responsiveness

### Web Hosting
1. Upload files to hosting service
2. Update domain name
3. Add SSL certificate
4. Set up email

**Recommended Hosts:**
- Bluehost
- GoDaddy
- Netlify (Free for static sites)
- Vercel
- GitHub Pages

### Domain Setup
1. Buy domain name
2. Point to hosting
3. Wait 24-48 hours for DNS

## ⚙️ Maintenance Tips

### Regular Updates
- Update content quarterly
- Keep prices current
- Add new testimonials
- Update gallery regularly

### Backup
- Save backups of all files
- Use version control (Git)
- Regular backups to cloud

### Analytics
- Add Google Analytics
- Track visitor behavior
- Monitor booking trends
- Check mobile vs desktop

## 🆘 Common Issues & Fixes

**Images not loading?**
- Check URL is correct
- Verify image file exists
- Check internet connection

**Booking button not working?**
- Check browser console for errors
- Ensure form fields are filled
- Try different browser

**Mobile layout broken?**
- Check media queries in CSS
- Test on actual mobile device
- Clear cache

**Colors look wrong?**
- Check color hex codes
- Verify CSS loaded correctly
- Clear browser cache

## 📞 Support Resources

- **Font Awesome Icons**: https://fontawesome.com
- **Google Fonts**: https://fonts.google.com
- **Color Tools**: https://colorhexa.com
- **Image Compression**: https://tinypng.com
- **CSS Validators**: https://jigsaw.w3.org/css-validator/

---

**Need Help?** Customize step by step and test frequently!

Good luck with your Elite Barber website! 💈✨
