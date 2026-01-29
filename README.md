# Learn Portuguese with Isabel

A modern, high-end replica of learnportugueseisabel.com with enhanced visual effects and contemporary design.

## Features

- **Modern Design**: Clean, aesthetic interface with smooth animations and visual effects
- **Responsive Layout**: Fully responsive design that works on all devices
- **Color Scheme**: White background with red and green accents, black text (matching original brand)
- **Smooth Animations**: Fade-in effects, hover animations, parallax scrolling, and more
- **Complete Navigation**: All pages with consistent navigation menu and footer
- **Interactive Elements**: Form handling, mobile menu, scroll effects, and button animations

## Pages

- **Home** (`index.html`) - Hero section, features, course previews, and testimonials
- **Courses** (`courses.html`) - Detailed course listings with pricing
- **About** (`about.html`) - Information about Isabel, qualifications, and teaching philosophy
- **Contact** (`contact.html`) - Contact form and information
- **Privacy Policy** (`privacy.html`) - Privacy policy page
- **Terms of Service** (`terms.html`) - Terms of service page

## File Structure

```
├── index.html          # Homepage
├── courses.html        # Courses page
├── about.html          # About page
├── contact.html        # Contact page
├── privacy.html        # Privacy policy
├── terms.html         # Terms of service
├── styles.css         # Main stylesheet with all styling
├── script.js          # JavaScript for interactivity
└── README.md          # This file
```

## Usage

Simply open `index.html` in a web browser to view the website. All pages are linked together through the navigation menu.

### Local Development

You can use any local server to run the website:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Design Features

### Visual Effects
- Floating animated shapes in hero section
- Gradient text animations
- Smooth scroll indicators
- Parallax effects
- Hover animations on cards and buttons
- Fade-in animations on scroll
- Ripple effects on button clicks

### Color Palette
- **Background**: White (#ffffff)
- **Text**: Black (#000000)
- **Accent Red**: #dc2626
- **Accent Green**: #16a34a
- **Gray tones**: Various shades for text and borders

### Typography
- Primary font: Inter (Google Fonts)
- Clean, modern sans-serif design
- Responsive font sizing with clamp()

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --color-red: #dc2626;
    --color-green: #16a34a;
    /* ... */
}
```

### Content
Edit the HTML files directly to update text, images, and structure.

### Animations
Modify animation timings and effects in `styles.css` and `script.js`.

## Notes

- The contact form currently simulates submission (no backend integration)
- Social media links are placeholders - update with actual URLs
- Images are placeholders - replace with actual images as needed
- All course pricing and content can be customized

## License

This is a replica/redesign project. Please ensure you have proper rights to use any content or branding.





