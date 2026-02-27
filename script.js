// Global Variables
let cart = [];
let currentBooking = {};
let customers = [];

// Shop hours: 9 AM to 9 PM
const SHOP_OPEN = 9;   // 09:00
const SHOP_CLOSE = 21; // 21:00

// Service durations in minutes
const SERVICE_DURATION = {
    'classic': 30,
    'fade': 35,
    'undercut': 40
};

function getCurrentTime() {
    return new Date();
}

function disableEarlierTimes() {
    const timeSelect = document.getElementById('bookingTime');
    const dateInput = document.getElementById('bookingDate');
    const serviceSelect = document.getElementById('bookingService');
    if (!timeSelect || !dateInput) return;
    
    const selectedDate = dateInput.value;
    const today = new Date().toISOString().split('T')[0];
    const now = getCurrentTime();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    // Get service duration
    const serviceValue = serviceSelect ? serviceSelect.value : 'classic';
    const duration = SERVICE_DURATION[serviceValue] || 30;
    
    // Enable or disable times based on date, shop hours, and service duration
    Array.from(timeSelect.options).forEach(opt => {
        if (!opt.value) return; // skip empty option
        
        const [hour, min] = opt.value.split(':').map(Number);
        
        // Calculate end time for this slot
        const endHour = Math.floor((hour * 60 + min + duration) / 60);
        
        // If not today, only check shop hours
        if (selectedDate !== today) {
            opt.disabled = hour < SHOP_OPEN || endHour > SHOP_CLOSE;
        } else {
            // If today, disable if before shop open, after shop close, before current time, or end time exceeds shop close
            const isBeforeNow = (hour < currentHour) || (hour === currentHour && min < currentMin);
            opt.disabled = hour < SHOP_OPEN || endHour > SHOP_CLOSE || isBeforeNow;
        }
        
        // Style available times in blue
        if (opt.disabled) {
            opt.style.color = '#999';
        } else {
            opt.style.color = '#0066cc'; // Blue color for available times
        }
    });
}

// ===== MODAL FUNCTIONS =====
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function showBookingModal() {
    document.getElementById('bookingModal').classList.add('active');
    
    // Set date range: today to 4 days ahead
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        const maxDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        dateInput.setAttribute('min', minDate);
        dateInput.setAttribute('max', maxDate);
        dateInput.value = minDate;
    }
    
    // Reset service and time selections
    const serviceSelect = document.getElementById('bookingService');
    if (serviceSelect) {
        serviceSelect.value = '';
    }
    const timeSelect = document.getElementById('bookingTime');
    if (timeSelect) {
        timeSelect.value = '';
    }
    
    // Update available times
    disableEarlierTimes();
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

// ===== NAVIGATION FUNCTIONS =====
function toggleMobileMenu() {
    const menu = document.querySelector('.nav-menu');
    menu.classList.toggle('active');
}

// ===== SERVICE TABS =====
function switchTab(tabName) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

// ===== GALLERY FILTER =====
function filterGallery(category) {
    const items = document.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
        if (category === 'all' || item.classList.contains(category)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });

    // Update filter button
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// ===== BOOKING FUNCTIONS =====
function addToBooking(serviceName, price) {
    currentBooking.service = serviceName;
    currentBooking.price = price;
    showBookingModal();
}

function bookWithBarber(barberName) {
    currentBooking.barber = barberName;
    showBookingModal();
}

// Booking form submission
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const service = document.getElementById('bookingService').value;
            const date = document.getElementById('bookingDate').value;
            const time = document.getElementById('bookingTime').value;
            const phone = document.getElementById('bookingPhone').value;
            const name = document.getElementById('bookingName').value;

            if (service && date && time && phone && name) {
                // Create booking
                const bookingId = '#' + Math.random().toString(36).substr(2, 9).toUpperCase();
                const booking = {
                    id: bookingId,
                    name: name,
                    service: service,
                    date: date,
                    time: time,
                    phone: phone,
                    timestamp: new Date()
                };
                
                let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
                bookings.push(booking);
                localStorage.setItem('bookings', JSON.stringify(bookings));

                // also inform server
                fetch('/api/queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booking)
                }).catch(() => {/* ignore server errors */});

                sendNotification('success', 'Booking Confirmed! ID: ' + bookingId);
                renderQueueList();
                closeBookingModal();
                bookingForm.reset();
            }
        });
    }
});

// ===== DYNAMIC CONTENT LOADERS =====
async function loadServices() {
    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (Array.isArray(data.services) && data.services.length) {
            // replace hair/beard/grooming sections
            const categories = { hair: [], beard: [], grooming: [], packages: [] };
            data.services.forEach(s => {
                const cat = s.category || 'hair';
                if (categories[cat]) categories[cat].push(s);
            });
            Object.keys(categories).forEach(cat => {
                const container = document.querySelector(`#${cat} .services-grid`);
                if (container) {
                    container.innerHTML = '';
                    categories[cat].forEach(s => {
                        const card = document.createElement('div');
                        card.className = 'service-card';
                        card.innerHTML = `
                            <div class="service-icon">${s.icon||''}</div>
                            <img src="${s.image||''}" alt="${s.name||''}" style="max-width:100%;height:auto;" />
                            <h3>${s.name}</h3>
                            <p>${s.description||''}</p>
                            <div class="service-details">
                                <span class="price">₹${s.price||0}</span>
                                <span class="duration">${s.duration||''}</span>
                            </div>
                            <button class="btn-service" onclick="addToBooking('${s.name}', ${s.price||0})">Book</button>
                        `;
                        container.appendChild(card);
                    });
                }
            });
        }
    } catch (e) {
        // ignore if no server
    }
}

async function loadBarbers() {
    try {
        const res = await fetch('/api/barbers');
        const data = await res.json();
        if (Array.isArray(data.barbers) && data.barbers.length) {
            const container = document.querySelector('#barbers .barbers-grid');
            if (container) {
                container.innerHTML = '';
                data.barbers.forEach(b => {
                    const card = document.createElement('div');
                    card.className = 'barber-card';
                    card.innerHTML = `
                        <div class="barber-image" style="background-image: url('${b.image||''}')"></div>
                        <h3>${b.name}</h3>
                        <div class="barber-specialty">${b.specialty||''}</div>
                        <div class="barber-experience"><i class="fas fa-medal"></i> ${b.experience||''}</div>
                        <div class="barber-rating">
                            <div class="stars">${b.stars||''}</div>
                            <span>${b.ratingDetails||''}</span>
                        </div>
                        <button class="btn-barber" onclick="bookWithBarber('${b.name}')">Book with ${b.name}</button>
                    `;
                    container.appendChild(card);
                });
            }
        }
    } catch (e) {}
}

async function loadGallery() {
    try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        if (Array.isArray(data.gallery) && data.gallery.length) {
            const container = document.querySelector('#gallery .gallery-grid');
            if (container) {
                container.innerHTML = '';
                data.gallery.forEach(item => {
                    const div = document.createElement('div');
                    div.className = `gallery-item ${item.category||''}`;
                    div.innerHTML = `
                        <img src="${item.image||''}" alt="${item.caption||''}">
                        <div class="gallery-overlay">
                            <h4>${item.caption||''}</h4>
                            <p>${item.description||''}</p>
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
        }
    } catch (e) {}
}

// ===== PUBLIC NOTIFICATION CHECK =====
async function checkNotifications() {
    const phoneInput = document.getElementById('notifPhone');
    const resultDiv = document.getElementById('notifResults');
    if (!phoneInput || !resultDiv) return;
    const phone = phoneInput.value.trim();
    if (!phone) {
        resultDiv.innerHTML = '<p>Please enter your phone number.</p>';
        return;
    }
    try {
        const res = await fetch('/api/notifications?phone=' + encodeURIComponent(phone));
        const data = await res.json();
        if (Array.isArray(data.notifications) && data.notifications.length) {
            resultDiv.innerHTML = data.notifications.map(n =>
                `<div class="notification-item"><small>${new Date(n.timestamp).toLocaleString()}</small><p>${n.message}</p></div>`
            ).join('');
        } else {
            resultDiv.innerHTML = '<p>No messages.</p>';
        }
    } catch (e) {
        console.error('failed to fetch notifications', e);
        resultDiv.innerHTML = '<p>Error loading messages.</p>';
    }
}

// ===== CART FUNCTIONS =====
function addToCart(productName, price) {
    cart.push({
        name: productName,
        price: price,
        quantity: 1,
        id: Math.random()
    });
    
    updateCartCount();
    sendNotification('success', productName + ' added to cart!');
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

function viewCart() {
    let cartSummary = 'Your Cart:\n\n';
    let total = 0;

    cart.forEach(item => {
        cartSummary += `${item.name} - ₹${item.price}\n`;
        total += item.price;
    });

    cartSummary += `\nTotal: ₹${total}`;
    alert(cartSummary);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.addEventListener('change', disableEarlierTimes);
    }
    
    const serviceSelect = document.getElementById('bookingService');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', disableEarlierTimes);
    }
    
    updateCartCount();
    loadReviews();
    renderQueueList();

    // load dynamic content from server if available
    loadServices();
    loadBarbers();
    loadGallery();
});

// ===== CLOSE MODALS ON OUTSIDE CLICK =====
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const bookingModal = document.getElementById('bookingModal');

    if (event.target === loginModal) {
        loginModal.classList.remove('active');
    }
    if (event.target === bookingModal) {
        bookingModal.classList.remove('active');
    }
};

// ===== QUEUE LIST RENDERING =====
// helper to drop any bookings that are already past
// but note: shop closes at 21:00 (9pm) and last registration slot is 20:00.
// we want to keep today's queue entries the whole day until closing time
// even if their appointment time has already passed.
// After closing we clear out all of today's bookings.
const SHOP_CLOSING_HOUR = 21; // 9pm
function _filterFutureBookings(bookings) {
    const now = new Date();
    return bookings.filter(b => {
        const dt = new Date(b.date + ' ' + b.time);
        const bookingDay = new Date(b.date);

        // if booking is in the future day, keep it normally
        if (dt >= now && bookingDay.toDateString() !== now.toDateString()) {
            return true;
        }

        // if booking is today
        if (bookingDay.toDateString() === now.toDateString()) {
            // before closing hour we retain all today's entries
            if (now.getHours() < SHOP_CLOSING_HOUR) {
                return true;
            }
            // after closing, drop them all
            return false;
        }

        // booking is in the past day, drop it
        return false;
    });
}

async function renderQueueList() {
    const queueList = document.getElementById('queueList');
    if (!queueList) return;
    
    // try to load from server first
    let bookings = [];
    const countElem = document.getElementById('offer-queue-count');
    try {
        const res = await fetch('/api/queue');
        const data = await res.json();
        if (Array.isArray(data.entries)) {
            bookings = data.entries;
        }
        if (countElem && typeof data.count === 'number') {
            countElem.textContent = data.count;
        }
    } catch (err) {
        // fallback to localStorage if server request fails
        bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        // remove expired entries locally
        const future = _filterFutureBookings(bookings);
        if (future.length !== bookings.length) {
            localStorage.setItem('bookings', JSON.stringify(future));
        }
        bookings = future;
        if (countElem) {
            countElem.textContent = bookings.length;
        }
    }
    
    // Sort bookings by date and time
    bookings.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    if (bookings.length === 0) {
        queueList.innerHTML = '<p class="no-bookings">No registrations yet</p>';
        return;
    }
    
    // first show a simple list of names
    let html = '<h3>Clients in queue:</h3><ul class="simple-queue">';
    bookings.forEach(b => {
        html += `<li>${b.name}</li>`;
    });
    html += '</ul>';
    
    // then the detailed table
    html += '<table class="queue-table"><thead><tr><th>Name</th><th>Date</th><th>Time</th><th>Service</th><th>Phone</th></tr></thead><tbody>';
    bookings.forEach(b => {
        html += `<tr><td>${b.name}</td><td>${b.date}</td><td>${b.time}</td><td>${b.service}</td><td>${b.phone}</td></tr>`;
    });
    html += '</tbody></table>';
    
    queueList.innerHTML = html;
}

// ===== SERVER COMMUNICATION =====
function updateQueueCountFromServer() {
    fetch('/api/queue')
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById('offer-queue-count');
            if (el && typeof data.count === 'number') {
                el.textContent = data.count;
            }
        })
        .catch(() => {
            // server may be offline; do nothing
        });
}

// call periodically so banner stays current
setInterval(renderQueueList, 30000);

function calculateLoyaltyPoints(price) {
    return Math.floor(price / 50); // 1 point per 50 rupees
}

// ===== REFERRAL TRACKING =====
function generateReferralLink() {
    const customerId = 'CUST_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    return `https://beardo.in/?ref=${customerId}`;
}

// ===== NOTIFICATION SYSTEM =====
function sendNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== REVIEW REMOVAL =====
function removeReview(id, btnElement) {
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || [];
    feedbacks = feedbacks.filter(f => f.id !== id);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    // remove card from DOM
    const card = btnElement.closest('.review-card');
    if (card) card.remove();
    sendNotification('success', 'Review removed.');
}

// ===== SEARCH FUNCTIONALITY =====
function searchServices(query) {
    const services = [
        'Classic Haircut',
        'Fade Cut',
        'Undercut',
        'Hair Styling',
        'Beard Trim',
        'Royal Shave',
        'Hair Spa',
        'Facial for Men'
    ];

    return services.filter(service => 
        service.toLowerCase().includes(query.toLowerCase())
    );
}

// ===== FEEDBACK SYSTEM =====
function showReviewModal() {
    document.getElementById('reviewModal').classList.add('active');
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

function submitFeedback(name, rating, comment) {
    const feedback = {
        id: Math.random(),
        name: name,
        rating: rating,
        comment: comment,
        timestamp: new Date()
    };

    let feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || [];
    feedbacks.push(feedback);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

    // append to UI
    addReviewCard(feedback, true);

    sendNotification('success', 'Thank you for your review!');
}

function addReviewCard(feedback, highlight = false) {
    const grid = document.querySelector('.reviews-grid');
    if (!grid) return;

    const card = document.createElement('div');
    card.className = 'review-card';
    if (highlight) card.classList.add('added');

    // compute relative time
    let timeText = 'Just now';
    if (feedback.timestamp) {
        const diffSec = (new Date() - new Date(feedback.timestamp)) / 1000;
        if (diffSec > 86400) timeText = Math.floor(diffSec / 86400) + ' days ago';
        else if (diffSec > 3600) timeText = Math.floor(diffSec / 3600) + ' hours ago';
        else if (diffSec > 60) timeText = Math.floor(diffSec / 60) + ' mins ago';
    }

    card.innerHTML = `
        <div class="review-header">
            <img src="https://i.pravatar.cc/60?img=${Math.floor(Math.random()*70)}" alt="Reviewer">
            <div>
                <h4>${feedback.name}</h4>
                <div class="review-rating">${'★'.repeat(feedback.rating) + '☆'.repeat(5-feedback.rating)}</div>
            </div>
        </div>
        <p>"${feedback.comment}"</p>
        <small>${timeText}</small>
        <button class="review-delete-btn" onclick="removeReview(${feedback.id}, this)">Remove</button>
    `;

    grid.prepend(card);
}

function loadReviews() {
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || [];
    feedbacks.forEach(f => addReviewCard(f));
    animateReviews();
}

function animateReviews() {
    const cards = document.querySelectorAll('.review-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('added');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
}

// attach listener for review form
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('reviewName').value.trim();
            const rating = parseInt(document.getElementById('reviewRating').value);
            const comment = document.getElementById('reviewComment').value.trim();
            if (name && rating && comment) {
                submitFeedback(name, rating, comment);
                reviewForm.reset();
                closeReviewModal();
            }
        });
    }

    // set minimum date to today and update queue & cart
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // cleanup any bookings that have already passed (IST) and refresh queue clock
    cleanOldBookings();
    updateISTClock();

    updateCartCount();
    displayQueue();
    loadReviews();
    renderAllBookings();
});

// ===== SCROLL TO SECTION =====
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return '₹' + price.toLocaleString();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ===== OFFLINE SUPPORT =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
