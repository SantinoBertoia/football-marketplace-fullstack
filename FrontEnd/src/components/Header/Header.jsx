// IMPORTS
import { Link } from 'react-router-dom';
import { useState } from 'react';
import './Header.css';

// COMPONENTE HEADER
const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSearch = () => {
        setSearchTerm(searchTerm.trim());
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                {/* LOGO */}
                <Link to="/dashboard" className="logo">
                    <img src="/images/Logo.png" alt="ScoutMarket Logo" className="logo-img" />
                </Link>

                {/* SEARCH BAR - Desktop */}
                {/*
                <div className="search-container desktop-search">
                    <input
                        type="text"
                        placeholder="Search For Name Or Position"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button className="search-btn" onClick={handleSearch}>🔍</button>
                </div>*/}

                {/* NAVIGATION - Desktop */}
                <nav className="nav desktop-nav">
                    <Link to="/players" className="nav-link">Explore</Link>
                    <Link to="/dashboard" className="nav-link">My Team</Link>
                    <Link to="/cart" className="nav-link">Cart</Link>
                </nav>

                {/* USER ACTIONS - Desktop */}
                <div className="join-button desktop-join">
                    <Link to="/login">
                        <button className="logOut-btn">
                            Log Out 👥
                        </button>
                    </Link>
                </div>

                {/* HAMBURGER MENU BUTTON - Mobile */}
                <button
                    className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
            </div>

            {/* MOBILE MENU */}
            <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                {/* SEARCH BAR - Mobile */}
                <div className="search-container mobile-search">
                    <input
                        type="text"
                        placeholder="Search For Name Or Position"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button className="search-btn" onClick={handleSearch}>🔍</button>
                </div>

                {/* NAVIGATION - Mobile */}
                <nav className="mobile-nav">
                    <Link to="/players" className="mobile-nav-link" onClick={toggleMenu}>Buy</Link>
                    <Link to="/players" className="mobile-nav-link" onClick={toggleMenu}>Sell</Link>
                    <Link to="/players" className="mobile-nav-link" onClick={toggleMenu}>Borrowing</Link>
                    <Link to="/players" className="mobile-nav-link" onClick={toggleMenu}>Trade</Link>
                    <Link to="/dashboard" className="mobile-nav-link" onClick={toggleMenu}>My team</Link>
                </nav>

                {/* USER ACTIONS - Mobile */}
                <div className="mobile-join">
                    <Link to="/join" onClick={toggleMenu}>
                        <button className="join-btn mobile-join-btn">
                            Join 👥
                        </button>
                    </Link>
                </div>
            </div>

            {/* OVERLAY para cerrar el menú */}
            {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}
        </header>
    );
};

export default Header;
