import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [visibleLetters, setVisibleLetters] = useState([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [flickerIntensity, setFlickerIntensity] = useState(1);
  const [letterSharpness, setLetterSharpness] = useState(Array(7).fill(0));
  const [flickerDecay, setFlickerDecay] = useState(1);
  const [sparks, setSparks] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  
  const flickerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  const word = 'misFits'; // All lowercase except capital F

  // Initialize audio context for typing sounds
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play mechanical keyboard typing sound
  const playTypingSound = () => {
    if (!audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Mechanical keyboard sound characteristics
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
    
    // Filter for mechanical sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.05);
    
    // Fast, sharp envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.03);
  };

  // Create medium-sized circular neon spark ball
  const createSpark = (x, y) => {
    const spark = {
      id: Date.now() + Math.random(),
      x,
      y,
      radius: 8 + Math.random() * 6, // Medium size: 8-14px
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      color: `hsl(${270 + Math.random() * 60}, 100%, 70%)`
    };
    
    setSparks(prev => [...prev, spark]);
    
    // Remove spark after animation
    setTimeout(() => {
      setSparks(prev => prev.filter(s => s.id !== spark.id));
    }, 800);
  };

  // Handle click for circular spark ball effect
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create medium-sized circular spark ball at exact click point
    createSpark(x, y);
  };

  // Start the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStarted(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Letter-by-letter animation with fast typing
  useEffect(() => {
    if (!isStarted) return;

    const letterTimer = setTimeout(() => {
      if (currentLetterIndex < word.length) {
        setVisibleLetters(prev => [...prev, word[currentLetterIndex]]);
        setCurrentLetterIndex(prev => prev + 1);
        playTypingSound(); // Play mechanical keyboard sound for each letter
      }
    }, 200); // Letter appears every 200ms

    return () => clearTimeout(letterTimer);
  }, [currentLetterIndex, isStarted, word]);

  // Flicker and transition effects
  useEffect(() => {
    if (!isStarted || currentLetterIndex < word.length) return;

    const transitionInterval = setInterval(() => {
      // Gradually reduce flicker intensity
      setFlickerDecay(prev => Math.max(0, prev - 0.01));
      
      // Gradually sharpen letters
      setLetterSharpness(prev => 
        prev.map((sharpness, index) => 
          Math.min(1, sharpness + 0.01)
        )
      );
    }, 100);

    // Start flicker effect
    flickerIntervalRef.current = setInterval(() => {
      setFlickerIntensity(prev => {
        const baseIntensity = 0.5 + Math.random() * 0.5;
        return baseIntensity * flickerDecay;
      });
    }, 150);

    return () => {
      clearInterval(transitionInterval);
      if (flickerIntervalRef.current) {
        clearInterval(flickerIntervalRef.current);
      }
    };
  }, [isStarted, currentLetterIndex, flickerDecay, word.length]);

  // Hide cursor globally and prevent it from appearing
  useEffect(() => {
    const hideCursor = () => {
      document.body.style.cursor = 'none';
      document.documentElement.style.cursor = 'none';
      document.body.style.userSelect = 'none';
      document.documentElement.style.userSelect = 'none';
    };

    // Hide cursor immediately
    hideCursor();

    // Hide cursor on any mouse movement
    const handleMouseMove = () => {
      hideCursor();
    };

    // Hide cursor on any mouse event
    const handleMouseEvent = () => {
      hideCursor();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEvent);
    document.addEventListener('mouseleave', handleMouseEvent);
    document.addEventListener('click', handleMouseEvent);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEvent);
      document.removeEventListener('mouseleave', handleMouseEvent);
      document.removeEventListener('click', handleMouseEvent);
      document.body.style.cursor = 'default';
      document.documentElement.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.documentElement.style.userSelect = 'auto';
    };
  }, []);

  return (
    <div className="App" onClick={handleClick}>
      <div className="misfits-text">
        {word.split('').map((letter, index) => {
          const isVisible = visibleLetters.includes(letter) && index < visibleLetters.length;
          const sharpness = letterSharpness[index] || 0;
          const blurAmount = isVisible ? (1 - sharpness) * 50 : 50;
          const opacity = isVisible ? (0.05 + sharpness * 0.95) : 0;
          const brightness = isVisible ? (0.05 + sharpness * 0.95) : 0.05;
          
          const letterStyle = {
            opacity: opacity * (flickerIntensity * 0.5 + 0.5),
            filter: `blur(${blurAmount}px) brightness(${brightness})`,
            transform: `translateY(${Math.sin(Date.now() * 0.01 + index) * (flickerIntensity * 2)}px)`,
            transition: 'all 0.5s ease-out',
            textShadow: 'none'
          };

          return (
            <span
              key={index}
              className={`letter ${isVisible ? 'visible' : ''}`}
              style={letterStyle}
            >
              {letter}
            </span>
          );
        })}
      </div>
      
      {/* Medium-sized Circular Neon Spark Balls */}
      {sparks.map(spark => (
        <div
          key={spark.id}
          className="spark"
          style={{
            position: 'absolute',
            left: spark.x - spark.radius,
            top: spark.y - spark.radius,
            width: spark.radius * 2,
            height: spark.radius * 2,
            backgroundColor: spark.color,
            borderRadius: '50%',
            boxShadow: `0 0 20px ${spark.color}, 0 0 40px ${spark.color}, 0 0 60px ${spark.color}`,
            opacity: spark.life,
            pointerEvents: 'none',
            zIndex: 1000,
            animation: 'sparkFade 0.8s ease-out forwards'
          }}
        />
      ))}
    </div>
  );
}

export default App; 