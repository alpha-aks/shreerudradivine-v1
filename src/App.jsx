import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  Compass,
  ShieldCheck,
  Gem,
  ChevronDown,
  Menu,
  X,
  Send,
  CheckCircle
} from 'lucide-react';
import { neon } from '@neondatabase/serverless';

// Initialize Neon Client
const PRODUCTS = [
  {
    id: 1,
    name: "5 Mukhi Nepalese Rudraksha Mala",
    category: "Rudraksha",
    planet: "Jupiter",
    description: "Authentic 108+1 high-altitude Nepalese beads for focus, spiritual growth, and peace.",
    price: "$149",
    image: "/hero Background.png"
  },
  {
    id: 2,
    name: "Certified Natural Blue Sapphire (Neelam)",
    category: "Cosmic Gemstones",
    planet: "Saturn",
    description: "Premium Vedic-grade unheated Ceylon Neelam for Saturn balancing and protection.",
    price: "$499",
    image: "/hero Background.png"
  },
  {
    id: 3,
    name: "Mahadev Shiva Brass Murti",
    category: "Divine Murtis",
    planet: "Mars",
    description: "Handcrafted pure brass statue of Lord Shiva in deep meditative posture.",
    price: "$299",
    image: "/hero Background.png"
  },
  {
    id: 4,
    name: "Siddha Shree Yantra on Copper",
    category: "Vedic Yantras",
    planet: "Sun",
    description: "Traditional sacred geometric yantra etched on pure copper, fully energized.",
    price: "$129",
    image: "/hero Background.png"
  },
  {
    id: 5,
    name: "Unified Gauri Shankar Rudraksha",
    category: "Rudraksha",
    planet: "Mars",
    description: "Rare Twin Nepalese beads representing the union of Shiva and Parvati.",
    price: "$399",
    image: "/hero Background.png"
  },
  {
    id: 6,
    name: "Natural Yellow Sapphire (Pukhraj)",
    category: "Cosmic Gemstones",
    planet: "Jupiter",
    description: "Certified unheated Vedic Pukhraj for Jupiter blessing, wisdom, and fortune.",
    price: "$650",
    image: "/hero Background.png"
  },
  {
    id: 7,
    name: "Pure Brass Ganesha Murti",
    category: "Divine Murtis",
    planet: "Jupiter",
    description: "Vedic blessed deity statue for removing obstacles and bringing prosperity.",
    price: "$189",
    image: "/hero Background.png"
  },
  {
    id: 8,
    name: "Siddha Mahamrityunjaya Yantra",
    category: "Vedic Yantras",
    planet: "Mars",
    description: "Copper chart designed to invoke Lord Shiva's healing and protection.",
    price: "$139",
    image: "/hero Background.png"
  }
];

const sql = neon(import.meta.env.VITE_NEONDB_CONNECTION_STRING);

function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedPlanet, setSelectedPlanet] = useState("All");
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger page load state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle Scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (window.scrollY > 50) {
        setNavScrolled(true);
      } else {
        setNavScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Mouse Move for Interactive Parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Calculate normalized position from -1 to 1
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle Form Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ name: '', email: '', message: '' });
      }, 5000);
    }
  };

  // Handle Certificate Serial Number Search with NeonDB & Fallback
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    setSearchAttempted(true);
    if (!query) {
      setSearchResult(null);
      setSearchAttempted(false);
      return;
    }

    setIsLoading(true);
    setSearchResult(null);

    // Enforce a minimum animation load delay of 1.2 seconds for a premium transition feel
    const animationDelay = new Promise(resolve => setTimeout(resolve, 1200));

    try {
      // 1. Check/Create Table
      await sql`
        CREATE TABLE IF NOT EXISTS certificates (
          serial_number VARCHAR(50) PRIMARY KEY,
          item TEXT,
          grade VARCHAR(100),
          blessing TEXT,
          astrological_match VARCHAR(100)
        );
      `;

      // 2. Seed database if empty
      const countRes = await sql`SELECT count(*) as count FROM certificates`;
      if (parseInt(countRes[0].count) === 0) {
        await sql`
          INSERT INTO certificates (serial_number, item, grade, blessing, astrological_match) VALUES
          ('SR-1008', '5 Mukhi Nepali Rudraksha Mala', 'Collector Grade', 'Prana Pratishta Energized', 'Jupiter'),
          ('SR-7777', 'Natural Blue Sapphire (Neelam)', 'Premium Vedic', 'Unheated/Untreated', 'Saturn'),
          ('SR-5555', '14 Mukhi Gauri Shankar Rudraksha', 'Rare Divine Grade', 'Special Shiva Puja Blessings', 'Mars');
        `;
      }

      // 3. Query the record
      const results = await sql`SELECT * FROM certificates WHERE UPPER(serial_number) = ${query}`;

      await animationDelay;

      if (results.length > 0) {
        const cert = results[0];
        setSearchResult(`Item: ${cert.item}. Grade: ${cert.grade}. Blessing: ${cert.blessing}. Astrological Match: ${cert.astrological_match}.`);
      } else {
        setSearchResult(null);
      }
    } catch (err) {
      console.warn("NeonDB Connection failed, using local secure sandbox query:", err);
      await animationDelay;

      // Local sandbox fallback database
      const mockDatabase = {
        'SR-1008': 'Item: 5 Mukhi Nepali Rudraksha Mala. Grade: Collector. Blessing: Prana Pratishta Energized. Astrological Match: Jupiter.',
        'SR-7777': 'Item: Natural Blue Sapphire (Neelam). Weight: 4.25 Carats. Grade: Premium Vedic. Treatment: Unheated/Untreated.',
        'SR-5555': 'Item: 14 Mukhi Gauri Shankar Rudraksha. Grade: Rare Divine. Blessing: Special Shiva Puja Blessings.'
      };

      if (mockDatabase[query]) {
        setSearchResult(mockDatabase[query]);
      } else {
        setSearchResult(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Parallax Transform Offsets
  // Scroll moves layers down or up at different rates, mouse moves layers slightly in response to gaze direction
  const bgTransform = `translate3d(${mousePos.x * 10}px, ${scrollY * 0.15 + mousePos.y * 10}px, 0) scale(1.1)`;
  const leftTempleTransform = `translate3d(${mousePos.x * -25}px, ${scrollY * 0.08 + mousePos.y * 15}px, 0) scale(1.05)`;
  const rightTempleTransform = `translate3d(${mousePos.x * 25}px, ${scrollY * 0.08 + mousePos.y * 15}px, 0) scale(1.05)`;
  const gemstoneTransform = `translate3d(${mousePos.x * -45}px, ${scrollY * -0.05 + mousePos.y * -30}px, 0) scale(1.02)`;

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav className={`navbar ${navScrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo-container">
          <img src="/logo.png" alt="Shree Rudradivine Logo" className="nav-logo-img" />
        </a>

        {/* Desktop Menu */}
        <ul className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
          <li><a href="#about">Our Origin</a></li>
          <li><a href="#collection">Sacred Collection</a></li>
          <li><a href="#services">Divine Services</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>

        {/* Mobile Hamburger Menu Button (Controlled by index.css media query) */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile Drawer Menu Overlay */}
      <div
        className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}
      >
        {/* Explicit close button inside mobile menu */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'absolute',
            top: '25px',
            right: '5%',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px'
          }}
          aria-label="Close Menu"
        >
          <X size={30} />
        </button>

        <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontSize: '1.4rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-heading)' }}>Our Origin</a>
        <a href="#collection" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontSize: '1.4rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-heading)' }}>Sacred Collection</a>
        <a href="#services" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontSize: '1.4rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-heading)' }}>Divine Services</a>
        <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontSize: '1.4rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-heading)' }}>Contact</a>
      </div>

      {/* Hero Section */}
      <header
        className="hero-container"
        id="home"
        style={{
          position: 'relative',
          width: '100vw',
          height: '100dvh',
          overflow: 'hidden',
          backgroundColor: '#0d0d0d'
        }}
      >
        {/* Layer 1: Base Background */}
        <img
          src="/hero Background.png"
          alt="Hero Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Big opaque word 'DIVINE' behind the temple */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            pointerEvents: 'none'
          }}
        >
          <h1
            style={{
              fontSize: 'var(--divine-font-size)',
              fontFamily: 'var(--font-body)',
              fontWeight: '900',
              letterSpacing: '0.15em',
              color: isLoaded ? 'var(--divine-color)' : 'rgba(255, 255, 255, 1)',
              textShadow: isLoaded ? '0 0 35px rgba(255, 255, 255, 0.12)' : '0 0 50px rgba(255, 255, 255, 0.3)',
              margin: 0,
              userSelect: 'none',
              lineHeight: 1,
              transform: 'translateY(-16vh)',
              transition: 'color 2.5s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 2.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span className="desktop-text">DIVINE</span>
            <span className="mobile-text">
              SHREERUDRA
              <br />
              DIVINE
            </span>
          </h1>
        </div>

        {/* Layer 2: Left Temple Foreground */}
        <img
          src="/left temple-Photoroom.png"
          alt="Left Temple"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 10,
            pointerEvents: 'none',
            transform: isLoaded ? 'translate3d(0, 0, 0)' : 'translate3d(-100vw, 0, 0)',
            transition: 'transform 2.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Layer 3: Right Temple Foreground */}
        <img
          src="/right temple-Photoroom.png"
          alt="Right Temple"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 20,
            pointerEvents: 'none',
            transform: isLoaded ? 'translate3d(0, 0, 0)' : 'translate3d(100vw, 0, 0)',
            transition: 'transform 2.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Layer 4: Gemstones (Front-most image) */}
        <img
          className="layer-gemstone-img"
          src="/gemstone-modified.png"
          alt="Gemstones"
          style={{
            zIndex: 30,
            pointerEvents: 'none',
            opacity: isLoaded ? 1 : 0,
            filter: isLoaded ? 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.7)) brightness(1.05)' : 'drop-shadow(0 0 0px rgba(212, 175, 55, 0)) brightness(1)',
            transition: 'opacity 2.8s cubic-bezier(0.16, 1, 0.3, 1), filter 2.8s ease-out'
          }}
        />

        {/* Certificate Verification Search Bar in Center */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            pointerEvents: 'auto',
            padding: '20px'
          }}
        >
          <div
            style={{
              marginTop: '25vh', /* Offset it down from the center of the DIVINE text */
              width: '100%',
              maxWidth: '480px',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 2s cubic-bezier(0.16, 1, 0.3, 1), transform 2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* The Liquid Glass Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                position: 'relative',
                borderRadius: '9999px',
                padding: '2px',
                background: 'rgba(5, 6, 8, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Serial Number..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '18px 70px 18px 28px',
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.05rem',
                  letterSpacing: '1px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gold-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
              >
                <Compass size={20} />
              </button>
            </form>

            {/* Loading / Database consulting animation */}
            {isLoading && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid rgba(212, 175, 55, 0.15)',
                  borderTop: '2px solid var(--gold-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', animation: 'pulse 1.5s ease-in-out infinite' }}>
                  Consulting Vedic Registry...
                </span>
              </div>
            )}

            {/* Search Results Display */}
            {!isLoading && searchResult && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(10, 11, 13, 0.7)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  textAlign: 'left'
                }}
              >
                <h4 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }}></span>
                  Authentic Item Verified
                </h4>
                <p style={{ color: '#fff', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {searchResult}
                </p>
              </div>
            )}

            {!isLoading && searchAttempted && !searchResult && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(10, 11, 13, 0.7)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  textAlign: 'left'
                }}
              >
                <h4 style={{ color: '#f44336', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Unregistered Number
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  No match found in our sacred records.
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* About / Origin Section */}
      <section 
        id="about" 
        style={{ 
          backgroundImage: 'url("/hero Background.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          height: '100dvh',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 5%',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        {/* Transparent Dark overlay (bit light on the right) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right, rgba(8, 9, 11, 0.88) 35%, rgba(8, 9, 11, 0.4) 100%)',
          zIndex: 1
        }}></div>

        <div className="origin-container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Glass Card for Vedic content text */}
          <div className="origin-glass-card">
            <span className="origin-title-tag">Sacred Origin</span>
            <h2 className="origin-heading">The Path of Enlightenment</h2>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--gold-primary)', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
              Handpicked &amp; Vedic Blessed
            </h3>
            <p className="origin-text">
              Every Rudraksha at Shree Rudradivine is sourced directly from the pristine foothills of the Himalayas and the ancient forests of Nepal. Each bead undergoes a stringent quality control and selection process based on its mukhis (facets), shape, and energetic vibration.
            </p>
            <p className="origin-text" style={{ marginBottom: '30px' }}>
              Before reaching you, each divine item undergoes a traditional Vedic energization process (Prana Pratishta) conducted by learned pundits under auspicious astrological configurations, unlocking the latent spiritual frequencies of the sacred beads.
            </p>
            
            {/* Pill Badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
              <span className="origin-pill">100% Himalayan Sourced</span>
              <span className="origin-pill">Prana Pratishta Energized</span>
              <span className="origin-pill">Vedic Lab Certified</span>
            </div>
          </div>

          {/* Glowing Antigravity Artifact Container (Right Column) */}
          <div className="origin-artifact-wrapper">
            {/* Spiritual Aura (Pulsing back glow) */}
            <div className="origin-aura"></div>
            
            {/* The floating Rudraksha image */}
            <img 
              src="/premium-rudraksha.png" 
              alt="Energized Sacred Rudraksha Bead" 
              className="origin-rudraksha-img" 
            />

            {/* Floating Orbiting Badges */}
            <div className="orbit-badge orbit-badge-top-left">
              <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} />
              <span>Authentic 5 Mukhi</span>
            </div>
            <div className="orbit-badge orbit-badge-bottom-right">
              <Compass size={14} style={{ color: 'var(--gold-primary)' }} />
              <span>High Frequency</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sacred Collection Section */}
      <section id="collection" style={{ padding: 0 }}>
        {/* Page Header (40vh) */}
        <div className="collection-header-section">
          <img 
            src="/hero Background.png" 
            alt="Sacred Collection Background" 
            className="collection-header-bg"
          />
          <div className="collection-header-overlay"></div>
          <div className="collection-header-content">
            <h2 className="collection-header-title">Sacred Collection</h2>
            <p className="collection-header-subtitle">Authentic, Energized, and Certified</p>
          </div>
        </div>

        {/* Sacred Category Accordion Showcase (Creative redesign of the category cards) */}
        <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 20px' }}>
          <span className="section-subtitle">Sacred Offerings</span>
          <h2 className="section-title" style={{ display: 'inline-block' }}>The Divine Collection</h2>
        </div>

        <div className="showcase-accordion">
          {/* Panel 1: Rudraksha */}
          <div 
            className="accordion-panel"
            onClick={() => {
              setActiveCategory("Rudraksha");
              setSelectedPlanet("All");
            }}
          >
            <span className="panel-number">01</span>
            <img src="/premium-rudraksha.png" alt="Nepali Rudraksha" className="panel-img" />
            <h3 className="panel-title">Nepali Rudraksha</h3>
            <p className="panel-desc">
              Powerful, premium-grade Nepali Rudraksha beads from 1 to 21 Mukhi. Perfect for spiritual growth, stress relief, and cosmic protection.
            </p>
            <span className="panel-link">
              Filter Rudraksha &rarr;
            </span>
          </div>

          {/* Panel 2: Gemstones */}
          <div 
            className="accordion-panel"
            onClick={() => {
              setActiveCategory("Cosmic Gemstones");
              setSelectedPlanet("All");
            }}
          >
            <span className="panel-number">02</span>
            <img src="/premium-gemstone.png" alt="Cosmic Gemstone" className="panel-img" />
            <h3 className="panel-title">Cosmic Gemstones</h3>
            <p className="panel-desc">
              Naturally sourced, certified gemstones aligned with Vedic Astrology to amplify positive planetary influences and manifest abundance.
            </p>
            <span className="panel-link">
              Filter Gemstones &rarr;
            </span>
          </div>

          {/* Panel 3: Mala Sets / Yantras */}
          <div 
            className="accordion-panel"
            onClick={() => {
              setActiveCategory("Vedic Yantras");
              setSelectedPlanet("All");
            }}
          >
            <span className="panel-number">03</span>
            <img src="/premium-yantra.png" alt="Vedic Yantra" className="panel-img" />
            <h3 className="panel-title">Vedic Yantras</h3>
            <p className="panel-desc">
              Expertly designed combinations of sacred geometric charts and energized items custom-crafted to align your specific energetic fields.
            </p>
            <span className="panel-link">
              Filter Yantras &rarr;
            </span>
          </div>
        </div>
      </section>

      {/* Divine Services Section */}
      <section id="services" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="section-header">
          <span className="section-subtitle">Divine Assistance</span>
          <h2 className="section-title">Our Spiritual Services</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '40px 30px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--gold-primary)', marginBottom: '15px' }}>Astrological Recommendation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Receive personal gemstone and Rudraksha consultation based on your birth chart (Kundali) calculations to attract prosperity and health.
            </p>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '40px 30px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--gold-primary)', marginBottom: '15px' }}>Custom Energization</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              All purchases undergo a dedicated Prana Pratishtha ritual with your name and birth date to activate their spiritual vibrational frequency.
            </p>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '40px 30px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--gold-primary)', marginBottom: '15px' }}>Aura Alignment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Consult with our spiritual guides to examine energy flows and identify blockages needing cosmic rectification.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact">
        <div className="section-header">
          <span className="section-subtitle">Connect With Us</span>
          <h2 className="section-title">Seek Divine Wisdom</h2>
        </div>

        <div className="contact-container">
          <div className="contact-info">
            <h3 style={{ fontSize: '1.8rem', color: 'var(--gold-primary)' }}>Get In Touch</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Have questions about choosing the right Rudraksha or gemstone? Fill out the form or reach us through our channels.
            </p>

            <div className="info-item">
              <MapPin className="info-icon" />
              <div className="info-details">
                <h4>Sacred Sanctuary</h4>
                <p>108 Dev Bhumi Boulevard, Himalayan Foothills, India</p>
              </div>
            </div>

            <div className="info-item">
              <Phone className="info-icon" />
              <div className="info-details">
                <h4>Call / WhatsApp</h4>
                <p>+91 98765 43210</p>
              </div>
            </div>

            <div className="info-item">
              <Mail className="info-icon" />
              <div className="info-details">
                <h4>Email Address</h4>
                <p>support@shreerudradivine.com</p>
              </div>
            </div>

            <div className="info-item">
              <Clock className="info-icon" />
              <div className="info-details">
                <h4>Auspicious Hours</h4>
                <p>Mon - Sat: 9:00 AM - 6:00 PM (IST)</p>
              </div>
            </div>
          </div>

          <div>
            {formSubmitted ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '15px', padding: '20px' }}>
                <CheckCircle size={60} style={{ color: 'var(--gold-primary)' }} />
                <h3 style={{ fontSize: '1.6rem', color: '#fff' }}>Blessings Received</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Thank you for reaching out. Our divine counselor will connect with you under the next auspicious planetary hour.
                </p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Spiritual Inquiry / Kundali Details</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="How may we guide your spiritual journey?"
                    required
                  />
                </div>
                <button type="submit" className="gold-btn" style={{ border: 'none', display: 'flex', justifyContent: 'center', width: '100%', marginTop: '10px' }}>
                  <Send size={16} /> Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ padding: '60px 20px 40px', position: 'relative' }}>
        {/* Animated Spin Gemstone Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <img 
            src="/premium-gemstone.png" 
            alt="Rotating Cosmic Gemstone" 
            style={{ 
              width: '72px', 
              height: '72px', 
              objectFit: 'contain', 
              filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.4))',
              animation: 'spinGemstone 25s linear infinite'
            }} 
          />
        </div>
        <div className="footer-logo">
          SHREE <span>RUDRADIVINE</span>
        </div>
        <p>Bringing sacred energy, cosmic alignment, and divine blessings to seekers around the globe.</p>
        <p style={{ fontSize: '0.8rem', color: '#555' }}>
          &copy; {new Date().getFullYear()} Shree Rudradivine. All Rights Reserved. Crafted for cosmic alignment.
        </p>
      </footer>
    </div>
  );
}

export default App;
