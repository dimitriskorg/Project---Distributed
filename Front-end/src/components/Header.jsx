import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#282c34',
        color: 'white',
        gap: '15px'
    };
    const buttonStyle = {
        padding: '10px',
        fontSize: '16px',
        color : 'white',
        cursor: 'pointer',
        backgroundColor: '#357492ff',
        border: 'none',
        borderRadius: '5px',
    };
    const inputStyle = {
        padding: '10px',
        borderRadius: '5px',
        border: 'none',
        outline: 'none'
    };

    return (
        <div style={headerStyle}>
            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
                <h2 style={{ margin: 0 }}>CourseSpark</h2>
            </Link>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Αναζήτηση..." style={inputStyle}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <button style={buttonStyle} onClick={()=> navigate(`/search?q=${searchText}`)}> Αναζήτηση </button>
            </div>
        </div>
    );
}
