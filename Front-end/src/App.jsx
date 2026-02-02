import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchPage from './pages/SearchPage';
import FilterPage from './pages/FilterPage';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        {/* 1. HEADER: Μένει πάντα σταθερό */}
        <Header />

        {/* 2. CENTRAL: Αλλάζει ανάλογα με το URL */}
        <main className="main-content">
          <Routes>
        
            <Route path="/" element={<FilterPage/>} />
            <Route path="/search" element={<SearchPage/>} />
          
          </Routes>
        </main>

        {/* 3. FOOTER: Μένει πάντα σταθερό */}
        <Footer />
      </div>
    </Router>
  );
}