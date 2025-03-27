'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Component to show during image generation
const BibleImageLoader = ({ 
  book, 
  chapter, 
  totalSegments = 5,
  progress = 0,
  showProgress = true
}) => {
  const [tip, setTip] = useState('');
  
  // Biblical art facts and tips
  const tips = [
    "Biblical art has been a tradition since early Christianity, appearing in catacombs and churches.",
    "Early Christian art used symbolism like the fish (Ichthys) to represent Christ during persecution.",
    "Byzantine icons followed strict rules about how biblical figures should be depicted.",
    "The Bible has inspired art across cultures, with each bringing unique perspectives.",
    "Renaissance masters like Michelangelo and da Vinci created some of the most famous biblical scenes.",
    "African biblical art often incorporates local cultural elements and clothing styles.",
    "In Middle Ages Europe, illustrated manuscripts preserved biblical stories for those who couldn't read.",
    "The earliest known Christian art dates to around 240 AD, found in Syria.",
    "Nigerian artists often represent biblical figures with local features and settings.",
    "Stained glass windows in churches were used to tell biblical stories to illiterate congregations."
  ];
  
  // Select random tips
  useEffect(() => {
    setTip(tips[Math.floor(Math.random() * tips.length)]);
    
    // Change tip every 10 seconds
    const interval = setInterval(() => {
      setTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-bible-paper p-6 rounded-lg shadow-lg border border-bible-scroll">
      <div className="text-center mb-6">
        <h3 className="text-xl font-biblical font-semibold text-bible-royal mb-2">
          Creating artwork for {book} {chapter}
        </h3>
        <p className="text-sm text-bible-ink">
          We're generating imagery to help visualize this chapter. It will be ready shortly.
        </p>
      </div>
      
      {/* Stylized loading animation - a "painting" being created */}
      <div className="relative h-48 w-full bg-bible-parchment rounded-md overflow-hidden mb-6">
        {/* Canvas background */}
        <div className="absolute inset-0 border-4 border-bible-scroll rounded-md"></div>
        
        {/* "Brush strokes" being painted */}
        <div className="absolute inset-0 flex flex-wrap">
          {Array(25).fill(0).map((_, i) => (
            <motion.div 
              key={i}
              className="h-12 rounded-md bg-bible-royal opacity-30"
              initial={{ width: 0 }}
              animate={{ width: '20%' }}
              transition={{ 
                delay: i * 0.2, 
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{ 
                position: 'absolute',
                left: `${(i % 5) * 20}%`,
                top: `${Math.floor(i / 5) * 25}%`,
                height: '25%'
              }}
            />
          ))}
        </div>
        
        {/* "Artist's Hand" */}
        <motion.div
          className="absolute bottom-0 right-0 w-16 h-16 bg-bible-gold rounded-full opacity-50"
          animate={{ 
            x: [0, -100, -200, -100, 0, 100, 200, 100, 0],
            y: [0, -50, -100, -50, 0, -50, -100, -50, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      {/* Progress indicator */}
      {showProgress && (
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-bible-gold"
              initial={{ width: '0%' }}
              animate={{ width: `${(progress/totalSegments) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {progress} of {totalSegments} images
          </div>
        </div>
      )}
      
      {/* Biblical art fact */}
      <div className="bg-bible-parchment bg-opacity-50 p-4 rounded-lg border border-bible-scroll">
        <p className="text-sm text-bible-ink italic font-biblical">
          <span className="font-bold text-bible-royal">Did you know?</span> {tip}
        </p>
      </div>
    </div>
  );
};

export default BibleImageLoader;
