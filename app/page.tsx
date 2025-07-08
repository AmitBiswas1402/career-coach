import Header from '@/components/Header'
import HeroSection from '@/components/Hero'
import React from 'react'

const Home = () => {
  return (
    <div>
      <Header />
      <div className='grid-background'>
        <HeroSection />
      </div>
    </div>
  )
}

export default Home