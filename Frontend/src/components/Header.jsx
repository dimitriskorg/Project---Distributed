import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    // 1. Ορισμός μεταβλητών 
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");

    // 2. CSS
    // Header
    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#282c34',
        color: 'white',
        gap: '15px'
    };

    // Buttons
    const buttonStyle = {
        padding: '10px',
        fontSize: '16px',
        color : 'white',
        cursor: 'pointer',
        backgroundColor: '#357492ff',
        border: 'none',
        borderRadius: '5px',
    };

    // Search field
    const inputStyle = {
        padding: '10px',
        borderRadius: '5px',
        border: 'none',
        outline: 'none'
    };

    return (
        <div style={headerStyle}>
            {/* Κάναμε το Logo κλικαρισμένο για να πηγαίνει στην Αρχική (/) */}
            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
                <h2 style={{ margin: 0 }}>CourseSpark</h2>
            </Link>

            {/* Πρόσθεσα ένα div για να ομαδοποιήσω τα κουμπιά δεξιά */}
            <div style={{ display: 'flex', gap: '10px' }}>
                
                {/* 1. Το πεδίο INPUT */}
                <input type="text" placeholder="Αναζήτηση..." style={inputStyle}

                    // Α. Σύνδεση με το state (Two-way binding)
                    value={searchText}
                    
                    // Β. Ενημέρωση του state όταν γράφει ο χρήστης
                    onChange={(e) => setSearchText(e.target.value)}
                />
                {/* 2. Σύνδεση με το SearchPage */}
                <button style={buttonStyle} onClick={()=> navigate(`/search?q=${searchText}`)}> Αναζήτηση </button>
            </div>
        </div>
    );
}