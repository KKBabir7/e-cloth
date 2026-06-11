import "./globals.css";
import Providers from "../components/Providers";
import AppNavbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingCart from "../components/FloatingCart";
import FloatingWhatsApp from "../components/FloatingWhatsApp";

export const metadata = {
  title: "CustomWear BD | Premium Custom T-Shirts & Fashion Ecommerce",
  description: "Bangladesh\'s ultimate interactive fashion ecommerce and custom T-shirt customizer. Order via bKash, Nagad, or Cash on Delivery with lightning-fast delivery.",
  keywords: "T-shirt customization, online shopping Bangladesh, custom shirts Dhaka, bKash ecommerce, Nagad shop, premium Panjabi, polo shirts BD",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="d-flex flex-column min-vh-100 bg-white">
        <Providers>
          {/* Global Sticky Navigation */}
          <AppNavbar />
          
          {/* Main Viewport Content */}
          <main className="flex-grow-1" style={{ minHeight: '60vh' }}>
            {children}
          </main>

          {/* Floating Cart Button Shortcut */}
          <FloatingCart />

          {/* Floating WhatsApp Support Button Widget */}
          <FloatingWhatsApp />

          {/* Global Corporate Footer */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
