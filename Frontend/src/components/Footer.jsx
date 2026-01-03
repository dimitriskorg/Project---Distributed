export default function Footer() {
    const footerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#1e1e1e',        
        flexWrap: 'wrap'
    };

    const listStyle = {
        display: 'flex',
        listStyle: 'none',
        gap: '10px',
        fontSize: '0.9rem',
        flexWrap: 'wrap',       
        justifyContent: 'center'
    };

    return (
        <div style={footerStyle}>
            {}
            <h3 style={{ margin: '10px 0', whiteSpace: 'nowrap' }}>
                &copy; CourseSpark - Project Distributed
            </h3>

            <ul style={listStyle}>
                <li>Dimitris Andriopoulos</li>
                <li>|</li>
                <li>Dimitris Koligliatis</li>
                <li>|</li>
                <li>Dimitris Korgiala</li>
                <li>|</li>
                <li>Lorenco Demaj</li>
                <li>|</li>
                <li>Giorgos-Stefanos Papastergiou</li>
            </ul>
        </div>
    );
}