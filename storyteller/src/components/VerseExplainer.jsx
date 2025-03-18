'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiX, HiTranslate, HiLightBulb, HiDocumentText } from 'react-icons/hi';

const VerseExplainer = ({ verses, book, chapter, language, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchExplanation = async () => {
      if (!verses || verses.length === 0) return;
      
      setLoading(true);
      try {
        const verseTexts = verses.map(v => v.text);
        const verseNumbers = verses.map(v => v.number);
        
        const response = await axios.post('/api/explain', {
          book,
          chapter,
          verses: verseTexts,
          verseNumbers,
          language
        });
        
        setExplanation(response.data);
      } catch (err) {
        console.error("Failed to fetch explanation:", err);
        setError("Could not get explanation at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExplanation();
  }, [verses, book, chapter, language]);
  
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '8px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      padding: '0',
      position: 'relative',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
    }
  };
  
  // Function to render tabs if there are multiple sections
  const renderTabs = () => {
    if (!explanation || !explanation.meta) return null;
    
    const tabs = [];
    tabs.push({ id: 'explanation', label: 'Explanation', icon: HiLightBulb });
    
    if (explanation.meta.hasTranslation) {
      tabs.push({ 
        id: 'translation', 
        label: `${language.charAt(0).toUpperCase() + language.slice(1)} Translation`, 
        icon: HiTranslate 
      });
    }
    
    if (tabs.length <= 1) return null;
    
    return (
      <div className="flex border-b border-bible-scroll">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`flex items-center px-4 py-2 border-b-2 ${
              activeTab === tab.id ? 
              'border-bible-gold text-bible-royal' : 
              'border-transparent text-bible-ink hover:text-bible-royal'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
    );
  };
  
  const [activeTab, setActiveTab] = useState('explanation');
  
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-bible-scroll">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-biblical text-bible-royal">
              {explanation?.reference || 'Verse Explanation'}
            </h2>
            <button onClick={onClose} className="rounded-full hover:bg-gray-100 p-1">
              <HiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
        
        {renderTabs()}
        
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bible-gold mb-4"></div>
              <p className="text-bible-royal font-biblical">Generating explanation...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              {error}
            </div>
          ) : explanation ? (
            <div className="space-y-6">
              {/* Original verses */}
              <div className="bg-bible-parchment bg-opacity-30 p-4 rounded-lg border border-bible-scroll">
                <h3 className="text-lg font-biblical text-bible-royal mb-2 flex items-center">
                  <span className="mr-2">Selected Verses</span>
                </h3>
                <div className="font-biblical">
                  {verses.map(v => (
                    <p key={`verse-${v.number}`} className="mb-2">
                      <span className="font-semibold">{v.number}:</span> {v.text}
                    </p>
                  ))}
                </div>
              </div>
              
              {activeTab === 'explanation' && (
                <>
                  {/* English explanation */}
                  <div className="border-l-4 border-bible-royal p-4 bg-white shadow-sm">
                    <h3 className="text-lg font-biblical text-bible-royal mb-2 flex items-center">
                      <HiLightBulb className="mr-2 text-bible-gold" />
                      <span>Explanation</span>
                    </h3>
                    <div className="font-biblical text-bible-ink leading-relaxed">
                      {explanation.englishExplanation}
                    </div>
                  </div>
                  
                  {/* Cultural context */}
                  {explanation.culturalContext && (
                    <div className="mt-6 bg-white p-4 rounded-lg border border-bible-scroll">
                      <h3 className="text-lg font-biblical text-bible-royal mb-2 flex items-center">
                        <HiDocumentText className="mr-2 text-bible-royal" />
                        <span>Cultural Context</span>
                      </h3>
                      <div className="font-biblical text-bible-ink leading-relaxed">
                        {explanation.culturalContext}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'translation' && (
                <>
                  {/* Translated explanation */}
                  {explanation.translatedExplanation && (
                    <div className="border-l-4 border-bible-gold p-4 bg-white shadow-sm">
                      <h3 className="text-lg font-biblical text-bible-royal mb-2 flex items-center">
                        <HiTranslate className="mr-2 text-bible-royal" />
                        <span>Explanation ({language.charAt(0).toUpperCase() + language.slice(1)})</span>
                      </h3>
                      <div className="font-biblical text-bible-ink leading-relaxed">
                        {explanation.translatedExplanation}
                      </div>
                    </div>
                  )}
                  
                  {/* Language learning examples */}
                  {explanation.examples && explanation.examples.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-biblical text-bible-royal mb-2">Learning Examples</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-bible-parchment text-bible-royal">
                              <th className="p-2 border border-bible-scroll text-left">English</th>
                              <th className="p-2 border border-bible-scroll text-left">
                                {language.charAt(0).toUpperCase() + language.slice(1)}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {explanation.examples.map((example, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="p-2 border border-bible-scroll font-biblical">{example.english}</td>
                                <td className="p-2 border border-bible-scroll font-biblical text-bible-gold">{example.translated}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VerseExplainer;
