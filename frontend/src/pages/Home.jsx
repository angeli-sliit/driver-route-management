import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center text-blue-600">Welcome to Yakadabadu.lk</h1>
        <p className="text-center text-gray-700">Efficient driver and route management system.</p>
      </div>
      <Footer />
    </div>
  );
};

export default Home;