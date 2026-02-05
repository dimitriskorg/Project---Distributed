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
        <Header />

        <main className="main-content">
          <Routes>
        
            <Route path="/" element={<FilterPage/>} />
            <Route path="/search" element={<SearchPage/>} />
          
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}
