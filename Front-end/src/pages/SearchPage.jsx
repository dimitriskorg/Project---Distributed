import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Popup from '../components/Popup'

export default function SearchPage() {

    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [courses, setCourses] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCourse, setSelectedCourse] = useState(null); 
    const containerStyle = { padding: '20px', maxWidth: '1000px', margin: '0 auto' };
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '30px'
    };
    const cardStyle = {
        border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px',
        backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%'
    };
    const paginationStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: '40px',
        padding: '20px'
    };

    const buttonStyle = {
        padding: '10px 20px',
        backgroundColor: '#0056D2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    };

    useEffect(() => {
        setPage(1);
    }, [query]);

    useEffect(() => {
        if (query) {
            fetch(`http://localhost:5000/api/courses?search=${query}&page=${page}&limit=20`)
                .then(response => response.json())
                .then(data => {
                    setCourses(data.courses); 
                    setTotalPages(data.totalPages);
                })
                .catch(err => console.error("Error:", err));
        }
    }, [query, page]); 

    const handleDetailsBtn = (course_id) => {
        fetch(`http://localhost:5000/api/courses/${course_id}`)
            .then(res => res.json())
            .then(data => {
                setSelectedCourse(data); 
            })
            .catch(err => console.error("Error:", err));
    }

    const closePopup = () => {
        setSelectedCourse(null);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (page > 1) setPage(prev => prev - 1);
    };

    return (
        <div style={containerStyle}>
            <h2>Αποτελέσματα για: {query}</h2>
            
            <div style={gridStyle}>
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course._id} style={cardStyle}>
                            <div>
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold' }}>
                                    {course.category}
                                </span>
                                <h3 style={{ margin: '10px 0', fontSize: '18px', color: '#222' }}>
                                    {course.title}
                                </h3>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                                    {course.description ? course.description.substring(0, 100) + '...' : 'No description'}
                                </p>
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                                    <span style={{ color: '#007bff' }}>{course.source_name}</span>
                                    <span style={{ color: '#007bff' }}>{course.language}</span>
                                </div>
                            
                                <button 
                                    onClick={() => handleDetailsBtn(course._id)} 
                                    style={{ display: 'block', width: '100%', textAlign: 'center', backgroundColor: '#0056D2', color: 'white', marginTop: '5px', padding: '10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', border: 'none' }}>
                                    Λεπτομέρειες
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>Δεν βρέθηκαν αποτελέσματα.</p>
                    </div>
                )}
            </div>

            {courses.length > 0 && (
                <div style={paginationStyle}>
                    <button 
                        style={{...buttonStyle, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer'}} 
                        onClick={handlePrev} 
                        disabled={page === 1}
                    >
                        &laquo; Προηγούμενο
                    </button>
                    
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        Σελίδα {page} από {totalPages}
                    </span>

                    <button 
                        style={{...buttonStyle, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer'}} 
                        onClick={handleNext} 
                        disabled={page === totalPages}
                    >
                        Επόμενο &raquo;
                    </button>
                </div>
            )}
            {selectedCourse && (
                <Popup 
                    course={selectedCourse}   
                    onClose={closePopup}      
                />
            )}
        </div>
    );
}
