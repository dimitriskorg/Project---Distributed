import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Popup from '../components/Popup'

export default function FilterPage() {
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState([]);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [selectedCourse, setSelectedCourse] = useState(null); // Αν είναι null, το modal είναι κλειστό

    // Filters State
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || 'All',
        level: searchParams.get('level') || 'All',
        language: searchParams.get('language') || 'All',
        source_name: searchParams.get('source_name') || 'All'
        
    });

    const [categoryOptions, setCategoryOptions] = useState([]);
    const [languageOptions, setLanguageOptions] = useState([]);
    const [levelOptions, setLevelOptions] = useState([]);
    const [sourceNameOptions, setSourceNameOptions] = useState([]);
    
    // Fetch Categories
    useEffect(() => {
        fetch('http://localhost:5000/api/categories')
            .then(res => res.json())
            .then(data => setCategoryOptions(data))
            .catch(err => console.error(err));
    }, []);

    // Fetch Languages
    useEffect(() => {
        fetch('http://localhost:5000/api/languages')
            .then(res => res.json())
            .then(data => setLanguageOptions(data))
            .catch(err => console.error(err));
    }, []);

    // Fetch Levels
    useEffect(() => {
        fetch('http://localhost:5000/api/levels')
            .then(res => res.json())
            .then(data => setLevelOptions(data))
            .catch(err => console.error(err));
    }, []);

     // Fetch Source Name
    useEffect(() => {
        fetch('http://localhost:5000/api/source_names')
            .then(res => res.json())
            .then(data => setSourceNameOptions(data))
            .catch(err => console.error(err));
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearchClick = () => {
        setPage(1); 
        const params = {};
        if (filters.category !== 'All') params.category = filters.category;
        if (filters.level !== 'All') params.level = filters.level;
        if (filters.language !== 'All') params.language = filters.language;
        if (filters.source_name !== 'All') params.source_name = filters.source_name;

        setSearchParams(params);
    };

    // Fetch Courses Logic
    useEffect(() => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('page', page);
        currentParams.set('limit', 20);

        fetch(`http://localhost:5000/api/courses?${currentParams.toString()}`)
            .then(res => res.json())
            .then(data => {
                setCourses(data.courses); 
                setTotalPages(data.totalPages);
            })
            .catch(err => console.error("Error searching courses:", err));

    }, [searchParams, page]);

    // Handlers
    const handleNext = () => { if (page < totalPages) setPage(prev => prev + 1); };
    const handlePrev = () => { if (page > 1) setPage(prev => prev - 1); };

    // --- ΔΙΟΡΘΩΣΗ 1: Fetch για το Modal ---
    const handleDetailsBtn = (course_id) => {
        // Κάνουμε fetch το συγκεκριμένο μάθημα
        fetch(`http://localhost:5000/api/courses/${course_id}`)
            .then(res => res.json())
            .then(data => {
                // Ανοίγουμε το modal γεμίζοντας τα δεδομένα
                setSelectedCourse(data); 
            })
            .catch(err => console.error("Error:", err));
    }

    // --- ΔΙΟΡΘΩΣΗ 2: Συνάρτηση κλεισίματος ---
    const closePopup = () => {
        setSelectedCourse(null);
    };

    // --- Styles ---
    const containerStyle = { padding: '20px', maxWidth: '1000px', margin: '0 auto', position: 'relative' };
    // ... (τα υπόλοιπα styles σου παραμένουν ίδια) ...
    const filtersBarStyle = { display: 'flex', gap: '20px', padding: '25px', backgroundColor: '#f8f9fa', borderRadius: '10px', alignItems: 'flex-end', flexWrap: 'wrap', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginTop: '30px' };
    const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' , color:'black' };
    const selectStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minWidth: '180px', fontSize: '14px' };
    const searchButtonStyle = { padding: '10px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', height: '42px', transition: 'background 0.3s' };
    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' };
    const cardStyle = { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' };
    const paginationStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px', padding: '20px' };
    const btnPageStyle = { padding: '10px 20px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' };

    // --- ΔΙΟΡΘΩΣΗ 3: Styles για το Modal ---
    const modalStyles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
        },
        modal: {
            backgroundColor: 'white', padding: '30px', borderRadius: '10px',
            width: '500px', maxWidth: '90%', position: 'relative',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
        },
        closeBtn: {
            marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc3545', 
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
        }
    };

    return (
        <div style={containerStyle}>
            <h1>Φίλτρα Μαθημάτων</h1>

            {/* --- ΦΙΛΤΡΑ --- */}
            <div style={filtersBarStyle}>
                <div style={inputGroup}>
                    <label>Κατηγορία</label>
                    <select name="category" value={filters.category} onChange={handleFilterChange} style={selectStyle}>
                        <option value="All">Όλες τις κατηγορίες</option>
                        {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div style={inputGroup}>
                    <label>Επίπεδο</label>
                    <select name="level" value={filters.level} onChange={handleFilterChange} style={selectStyle}>
                        <option value="All">Όλα τα επίπεδα</option>
                        {levelOptions.map(lev => <option key={lev} value={lev}>{lev}</option>)}
                    </select>
                </div>
                <div style={inputGroup}>
                    <label>Γλώσσα</label>
                    <select name="language" value={filters.language} onChange={handleFilterChange} style={selectStyle}>
                        <option value="All">Όλες τις γλώσσες</option>
                        {languageOptions.map(lan => <option key={lan} value={lan}>{lan}</option>)}
                    </select>
                </div>
                <div style={inputGroup}>
                    <label>Πηγή</label>
                    <select name="source_name" value={filters.source_name} onChange={handleFilterChange} style={selectStyle}>
                        <option value="All">Όλες οι πηγές</option>
                        {sourceNameOptions.map(scn => <option key={scn} value={scn}>{scn}</option>)}
                    </select>
                </div>
                <button onClick={handleSearchClick} style={searchButtonStyle}>Εμφάνιση</button>
            </div>

            {/* --- GRID ΑΠΟΤΕΛΕΣΜΑΤΩΝ --- */}
            <div style={gridStyle}>
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course._id} style={cardStyle}>
                            <div>
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold' }}>
                                    {course.category}
                                </span>
                                <h3 style={{ margin: '10px 0', fontSize: '18px', color: '#222' }}>{course.title}</h3>
                                <p style={{ fontSize: '14px', color: '#666' }}>
                                    {course.description ? course.description.substring(0, 100) + '...' : 'No description'}
                                </p>
                            </div>
                            
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                                    <span style={{ color: '#007bff' }}>{course.source_name}</span>
                                    <span style={{ color: '#007bff' }}>{course.language}</span>
                                </div>          
                                {/* ΔΙΟΡΘΩΣΗ: Arrow function στο onClick */}
                                <button 
                                    onClick={() => handleDetailsBtn(course._id)} 
                                    style={{ display: 'block', width: '100%', textAlign: 'center', backgroundColor: '#0056D2', color: 'white', marginTop: '5px', padding: '10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', border: 'none' }}>
                                    Λεπτομέρειες
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Δεν βρέθηκαν αποτελέσματα.</p>
                )}
            </div>

            {/* --- PAGINATION --- */}
            {courses.length > 0 && (
                <div style={paginationStyle}>
                    <button style={{...btnPageStyle, opacity: page === 1 ? 0.5 : 1}} onClick={handlePrev} disabled={page === 1}>&laquo; Prev</button>
                    <span>Σελίδα {page} / {totalPages}</span>
                    <button style={{...btnPageStyle, opacity: page === totalPages ? 0.5 : 1}} onClick={handleNext} disabled={page === totalPages}>Next &raquo;</button>
                </div>
            )}

            {/* --- ΔΙΟΡΘΩΣΗ: ΤΟ POPUP ΕΙΝΑΙ ΕΞΩ ΑΠΟ ΤΟ MAP --- */}
            {selectedCourse && (
                <Popup 
                    course={selectedCourse}   // Περνάμε τα δεδομένα (Prop 1)
                    onClose={closePopup}      // Περνάμε τη συνάρτηση (Prop 2)
                />
            )}

        </div>
    );
}