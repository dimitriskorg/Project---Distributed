import React, { useState } from 'react';

const Popup = ({ course, onClose }) => {
    
    // State για να αποθηκεύσουμε τα παρόμοια μαθήματα
    // null = δεν πατήθηκε το κουμπί ακόμα
    // [] = πατήθηκε αλλά δεν βρέθηκαν (ή φορτώνει)
    const [similarCourses, setSimilarCourses] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Προαιρετικό: Για να δείχνουμε "Φόρτωση..."

    // Η συνάρτηση που τρέχει ΟΤΑΝ πατηθεί το κουμπί
    const handleSimilarBtn = () => {
        setIsLoading(true);

        fetch(`http://localhost:5000/api/courses/${course._id}/similar`)
            .then(res => res.json())
            .then(data => {
                // Προσοχή: Ελέγχουμε αν υπάρχει το πεδίο similar_courses ή αν επέστρεψε σκέτο array
                // Με βάση τον τελευταίο μας κώδικα στο server, επιστρέφει αντικείμενο.
                const results = data.similar_courses || [];
                setSimilarCourses(results);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching similar:", err);
                setIsLoading(false);
            });
    };

    if (!course) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2 style={{ marginTop: 0, color: '#333' }}>{course.title}</h2>
                <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #ccc' }} />
                
                {/* Scrollable περιοχή */}
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    <p><strong>Περιγραφή:</strong> {course.description}</p>
                    <p style={{marginTop: '10px'}}><strong>Γλώσσα:</strong> {course.language}</p>
                    <p><strong>Πηγή:</strong> {course.source_name}</p>
                    <p><strong>Επίπεδο:</strong> {course.level}</p>
                    
                    {/* Κουμπί για μετάβαση στο site */}
                    <a 
                        href={course.link} 
                        target="_blank" 
                        rel="noreferrer"
                        style={styles.linkBtn}
                    >
                        Ιστοσελίδα μαθήματος
                    </a>

                    {/* Κουμπί για Σχετικά Μαθήματα */}
                    {/* Το κρύβουμε αν έχουν ήδη εμφανιστεί τα αποτελέσματα */}
                    {similarCourses === null && (
                        <button onClick={handleSimilarBtn} style={styles.button}>
                            {isLoading ? "Φόρτωση..." : "Σχετικά μαθήματα"}
                        </button>
                    )}

                    {/* --- ΛΙΣΤΑ ΑΠΟΤΕΛΕΣΜΑΤΩΝ --- */}
                    {/* Εμφανίζεται μόνο αν το similarCourses ΔΕΝ είναι null */}
                    {similarCourses !== null && (
                        <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                            <h4 style={{marginBottom: '10px'}}>Προτεινόμενα:</h4>
                            
                            {similarCourses.length > 0 ? (
                                <ul style={{ paddingLeft: '20px' }}>
                                    {similarCourses.map((sim, index) => (
                                        <li key={index} style={{ marginBottom: '8px' }}>
                                            <a href={sim.link} target="_blank" rel="noreferrer" style={{ color: '#0056D2', textDecoration: 'none' }}>
                                                {sim.title}
                                            </a>
                                            <span style={{ fontSize: '12px', color: 'gray', marginLeft: '5px' }}>
                                                ({(sim.score * 100).toFixed(0)}% match)
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ fontStyle: 'italic', color: 'gray' }}>Δεν βρέθηκαν παρόμοια μαθήματα.</p>
                            )}
                        </div>
                    )}

                </div>

                <button onClick={onClose} style={styles.closeBtn}>
                    Κλείσιμο
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
    modal: {
        color:'black',
        backgroundColor: 'white', padding: '30px', borderRadius: '10px',
        width: '500px', maxWidth: '90%', position: 'relative',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
    },
    closeBtn: {
        marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc3545', 
        color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer',
        alignSelf: 'flex-end'
    },
    linkBtn: {
        display: 'block', 
        textAlign: 'center', 
        backgroundColor: '#0056D2', 
        color: 'white',
        marginTop: '20px',  
        padding: '10px', 
        borderRadius: '5px', 
        textDecoration: 'none', 
        fontWeight: 'bold' 
    },
    button: { 
        display: 'block', 
        textAlign: 'center', 
        backgroundColor: '#6c757d', // Άλλαξα λίγο το γκρι για να είναι πιο ωραίο
        color: 'white',
        marginTop: '10px',  
        padding: '10px', 
        borderRadius: '5px', 
        width: '100%',
        border: 'none', 
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer' // Πρόσθεσα κέρσορα
    }
};

export default Popup;