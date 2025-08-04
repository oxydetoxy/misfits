import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [visibleLetters, setVisibleLetters] = useState([]);
  const [flickerIntensity, setFlickerIntensity] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [letterSharpness, setLetterSharpness] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [flickerActive, setFlickerActive] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(1);

  const word = "MISFITS";
  const neonColors = ['#ff0080', '#00ff80', '#0080ff', '#ff8000', '#8000ff', '#ff0080', '#00ff80'];

  useEffect(() => {
    // Start the effect after a short delay
    const startTimer = setTimeout(() => {
      setIsStarted(true);
      setVisibleLetters([]);
      setCurrentLetterIndex(0);
      setLetterSharpness({});
      setStartTime(Date.now());
      setFlickerActive(true);
      setGlowIntensity(1);
    }, 1500);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!isStarted || currentLetterIndex >= word.length) return;

    // Show each letter one by one
    const letterTimer = setTimeout(() => {
      setVisibleLetters(prev => [...prev, currentLetterIndex]);
      setCurrentLetterIndex(prev => prev + 1);
    }, 300);

    return () => clearTimeout(letterTimer);
  }, [currentLetterIndex, word.length, isStarted]);

  // Single effect to handle flicker with automatic stop
  useEffect(() => {
    if (!flickerActive || visibleLetters.length === 0) return;

    let flickerCount = 0;
    const maxFlickers = 50; // Stop after 50 flickers (5 seconds at 100ms intervals)
    
    const flickerInterval = setInterval(() => {
      flickerCount++;
      
      if (flickerCount >= maxFlickers) {
        // Stop flicker
        clearInterval(flickerInterval);
        setFlickerActive(false);
        setFlickerIntensity(1); // Set to stable
        setGlowIntensity(0); // Remove glow completely
      } else {
        // Continue flicker
        setFlickerIntensity(Math.random() * 0.5 + 0.5);
      }
    }, 100);

    return () => clearInterval(flickerInterval);
  }, [flickerActive, visibleLetters.length]);

  // Letter sharpening effect
  useEffect(() => {
    if (visibleLetters.length === 0 || !startTime) return;

    const sharpeningInterval = setInterval(() => {
      setLetterSharpness(prev => {
        const newSharpness = { ...prev };
        visibleLetters.forEach(letterIndex => {
          if (!newSharpness[letterIndex]) {
            newSharpness[letterIndex] = 0;
          }
          if (newSharpness[letterIndex] < 1) {
            newSharpness[letterIndex] = Math.min(1, newSharpness[letterIndex] + 0.02);
          }
        });
        return newSharpness;
      });
    }, 50);

    return () => clearInterval(sharpeningInterval);
  }, [visibleLetters, startTime]);

  return (
    <div className="App">
      <div className="misfits-text">
        {word.split('').map((letter, index) => {
          const isVisible = visibleLetters.includes(index);
          const sharpness = letterSharpness[index] || 0;
          const blurAmount = isVisible ? (1 - sharpness) * 5 : 5; // Much less blur
          const opacity = isVisible ? (0.7 + sharpness * 0.3) : 0; // Higher base opacity
          const brightness = isVisible ? (0.8 + sharpness * 0.2) : 0.8; // Higher brightness
          
          return (
            <span
              key={index}
              className={`letter ${isVisible ? 'visible' : ''}`}
              style={{
                opacity: opacity,
                color: neonColors[index % neonColors.length], // Keep same neon colors
                textShadow: isVisible && glowIntensity > 0
                  ? `0 0 ${5 * glowIntensity}px ${neonColors[index % neonColors.length]}, 0 0 ${10 * glowIntensity}px ${neonColors[index % neonColors.length]}, 0 0 ${15 * glowIntensity}px ${neonColors[index % neonColors.length]}`
                  : 'none', // No glow when glowIntensity is 0
                transform: isVisible 
                  ? `scale(${1 + (flickerIntensity - 0.7) * 0.01})` // Much less movement
                  : 'scale(0.9)',
                filter: `blur(${blurAmount}px) brightness(${brightness})`,
                transition: 'all 0.3s ease-out'
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default App; 