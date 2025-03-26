"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { getAllBooks } from "../lib/services/mockBibleService";
import { HiSpeakerphone } from "react-icons/hi";

const BibleNavigation = ({
  currentBook = "Matthew",
  currentChapter = 1,
  language = "english",
  isMobile = false,
  onLanguageChange = () => {},
  verses = [], // Add verses prop to access chapter content
}) => {
  const router = useRouter();
  const [books, setBooks] = useState(null);
  const [oldTestamentBooks, setOldTestamentBooks] = useState({});
  const [newTestamentBooks, setNewTestamentBooks] = useState({});
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [testament, setTestament] = useState("new"); // For tracking current testament
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Define Old Testament books in chronological order
  const oldTestamentOrder = [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
  ];

  // Define New Testament books in chronological order
  const newTestamentOrder = [
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation",
  ];

  useEffect(() => {
    // Fetch books from the existing data source
    const fetchBooks = async () => {
      try {
        setLoadingBooks(true);

        // Use the existing mockBibleService to get books
        const bibleBooks = getAllBooks();

        // Create separate objects for Old and New Testament books
        const oldBooks = {};
        const newBooks = {};

        // Add a debug log to see what books are being returned
        console.log(
          "Available Bible books:",
          bibleBooks.map((b) => b.name)
        );

        bibleBooks.forEach((book) => {
          // Directly use the name from the book object, which is already standardized
          const bookData = {
            name: book.name,
            originalName: book.originalName || book.name,
            chapters: book.chapters,
            testament: book.testament === "new" ? "new" : "old",
            abbrev: book.abbrev,
          };

          // Categorize books based on testament
          if (bookData.testament === "new") {
            newBooks[book.name] = bookData;
          } else {
            oldBooks[book.name] = bookData;
          }
        });

        setOldTestamentBooks(oldBooks);
        setNewTestamentBooks(newBooks);
        setBooks({ ...oldBooks, ...newBooks });

        // Determine the testament of the current book
        if (currentBook) {
          const matchingBook = bibleBooks.find(
            (b) => b.name === currentBook || b.originalName === currentBook
          );

          if (matchingBook) {
            setTestament(matchingBook.testament === "new" ? "new" : "old");
          }
        }
      } catch (error) {
        console.error("Failed to fetch Bible books:", error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [language, currentBook]);

  // Generate array of available chapters for the current book
  const availableChapters = [];
  if (books && books[currentBook]) {
    for (let i = 1; i <= books[currentBook].chapters; i++) {
      availableChapters.push(i);
    }
  }

  // When handling the book change, we need to use the original name for routing
  const handleBookChange = (e) => {
    const newBook = e.target.value;
    // No need to normalize, use the actual book name
    router.push(
      `/read?book=${encodeURIComponent(newBook)}&chapter=1&lang=${language}`
    );
  };

  const handleChapterChange = (e) => {
    const newChapter = e.target.value;
    // Make sure to use the correct book name and properly encode it
    router.push(
      `/read?book=${encodeURIComponent(currentBook)}&chapter=${newChapter}&lang=${language}`
    );
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value.toLowerCase();
    onLanguageChange(newLanguage);
  };

  // Function to sort books in chronological order
  const getSortedBooksArray = (testamentBooks, orderArray) => {
    // Create a new array to hold sorted books
    const result = [];

    // Process standard books in order
    orderArray.forEach((bookName) => {
      // Look for exact matches first
      const exactMatch = Object.values(testamentBooks).find(
        (b) => b.name === bookName
      );
      if (exactMatch) {
        result.push(exactMatch);
        return;
      }

      // Then look for books that might have different formatting
      // For example "1 Corinthians" vs "First Corinthians" or "I Corinthians"
      const nameParts = bookName.split(" ");
      if (nameParts.length > 1 && /^[123]$/.test(nameParts[0])) {
        // Handle numbered books
        const bookSuffix = nameParts.slice(1).join(" ").toLowerCase();
        const alternativeMatch = Object.values(testamentBooks).find(
          (b) =>
            b.name.toLowerCase().includes(bookSuffix) &&
            (b.name.startsWith(nameParts[0]) ||
              (b.name.startsWith(`First`) && nameParts[0] === "1") ||
              (b.name.startsWith(`Second`) && nameParts[0] === "2") ||
              (b.name.startsWith(`Third`) && nameParts[0] === "3") ||
              (b.name.startsWith(`I`) && nameParts[0] === "1") ||
              (b.name.startsWith(`II`) && nameParts[0] === "2") ||
              (b.name.startsWith(`III`) && nameParts[0] === "3"))
        );

        if (
          alternativeMatch &&
          !result.some((b) => b.name === alternativeMatch.name)
        ) {
          result.push(alternativeMatch);
        }
      }
    });

    // Special handling for Revelation of John
    const revelationBook = Object.values(testamentBooks).find(
      (b) => b.name === "Revelation of John" || b.name.includes("Revelation")
    );

    if (revelationBook && !result.some((b) => b.name === revelationBook.name)) {
      result.push(revelationBook);
    }

    // Check for any books that weren't categorized, and add them to the end
    Object.values(testamentBooks).forEach((book) => {
      if (!result.some((b) => b.name === book.name)) {
        console.log(`Adding uncategorized book: ${book.name}`);
        result.push(book);
      }
    });

    return result;
  };

  // Get ordered book arrays
  const orderedOldTestament = getSortedBooksArray(
    oldTestamentBooks,
    oldTestamentOrder
  );
  const orderedNewTestament = getSortedBooksArray(
    newTestamentBooks,
    newTestamentOrder
  );

  // Define styles
  const styles = {
    container: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      flexWrap: isMobile ? "nowrap" : "wrap",
      alignItems: "center",
      gap: isMobile ? "8px" : "16px",
      justifyContent: "center",
      marginTop: "2rem",
    },
    loading: {
      fontSize: "14px",
      color: "#2c467a", // bible-royal color
    },
    select: {
      width: "100%",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #d1c4a8", // bible-scroll color
      outline: "none",
      fontSize: isMobile ? "14px" : "16px",
      textAlign: "center",
    },
    selectActive: {
      backgroundColor: "#f5ebd3", // bible-parchment color
    },
    selectInactive: {
      backgroundColor: "#f9fafb", // gray-50 color
    },
    oldTestamentWrapper: {
      flex: isMobile ? "1 0 auto" : "0 0 auto",
      width: isMobile ? "100%" : "175px", // 50% smaller width for non-mobile
      marginRight: isMobile ? "0" : "8px",
    },
    newTestamentWrapper: {
      flex: isMobile ? "1 0 auto" : "0 0 auto",
      width: isMobile ? "100%" : "175px", // 50% smaller width for non-mobile
      marginRight: isMobile ? "0" : "8px",
    },
    chapterWrapper: {
      flex: isMobile ? "1 0 auto" : "0 0 auto",
      width: isMobile ? "100%" : "96px",
    },
    languageWrapper: {
      flex: isMobile ? "1 0 auto" : "0 0 auto",
      width: isMobile ? "100%" : "128px",
      marginTop: isMobile ? "4px" : "0",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#2c467a", // bible-royal color
      marginBottom: "4px",
      position: isMobile ? "static" : "absolute",
      width: isMobile ? "auto" : "1px",
      height: isMobile ? "auto" : "1px",
      padding: isMobile ? "0" : "0",
      margin: isMobile ? "0 0 4px 0" : "-1px",
      overflow: isMobile ? "visible" : "hidden",
      clip: isMobile ? "auto" : "rect(0, 0, 0, 0)",
      whiteSpace: isMobile ? "normal" : "nowrap",
      border: isMobile ? "none" : "0",
    },
  };

  // Combine base select styles with active/inactive
  const getSelectStyle = (isActive) => {
    return {
      ...styles.select,
      ...(isActive ? styles.selectActive : styles.selectInactive),
    };
  };

  // Function to handle TTS for the entire chapter
  const handleChapterTTS = () => {
    if (!verses || verses.length === 0) {
      console.log("No verses available for TTS");
      return;
    }

    // Toggle speaking state
    setIsSpeaking(!isSpeaking);

    if (!isSpeaking) {
      // Start speaking logic would go here
      console.log("Starting TTS with verses:", verses.length);

      // Use browser's built-in speech synthesis if available
      if ("speechSynthesis" in window) {
        // Cancel any previous speech
        window.speechSynthesis.cancel();

        // Create text to speak - prepare chapter introduction
        const chapterIntro = `${currentBook}, chapter ${currentChapter}.`;
        const verseTexts = verses.map(
          (verse) => `Verse ${verse.number}. ${verse.text}`
        );
        const text = [chapterIntro, ...verseTexts].join(" ");

        const utterance = new SpeechSynthesisUtterance(text);

        // Set language based on current selection
        switch (language) {
          case "yoruba":
            utterance.lang = "yo";
            break;
          case "igbo":
            utterance.lang = "ig";
            break;
          case "pidgin":
            // Use English for pidgin as there's no standard code
            utterance.lang = "en-NG";
            break;
          default:
            utterance.lang = "en-US";
        }

        // Add event handlers to update UI state
        utterance.onstart = () => {
          console.log("Speech started");
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log("Speech ended");
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error("Speech error:", event);
          setIsSpeaking(false);
          alert("Speech synthesis failed. Please try again.");
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      } else {
        alert("Text-to-speech is not supported in this browser.");
        setIsSpeaking(false);
      }
    } else {
      // Stop speaking
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  return (
    <div style={styles.container}>
      {loadingBooks ? (
        <div style={styles.loading}>Loading books...</div>
      ) : (
        <>
          {/* Old Testament Books dropdown */}
          <div style={styles.oldTestamentWrapper}>
            <label style={styles.label}>Old Testament</label>
            <select
              value={testament === "old" ? currentBook : ""}
              onChange={handleBookChange}
              style={getSelectStyle(testament === "old")}
              aria-label="Select Old Testament book"
            >
              <option value="" disabled={testament === "old"}>
                Old Testament
              </option>
              {orderedOldTestament.map((book) => (
                <option key={book.name} value={book.name}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          {/* New Testament Books dropdown */}
          <div style={styles.newTestamentWrapper}>
            <label style={styles.label}>New Testament</label>
            <select
              value={testament === "new" ? currentBook : ""}
              onChange={handleBookChange}
              style={getSelectStyle(testament === "new")}
              aria-label="Select New Testament book"
            >
              <option value="" disabled={testament === "new"}>
                New Testament
              </option>
              {orderedNewTestament.map((book) => (
                <option key={book.name} value={book.name}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter selection */}
          <div style={styles.chapterWrapper}>
            <select
              value={currentChapter}
              onChange={handleChapterChange}
              style={styles.select}
              aria-label="Select chapter"
            >
              {availableChapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  Chapter {chapter}
                </option>
              ))}
            </select>
          </div>

          {/* Language selector */}
          <div style={styles.languageWrapper}>
            <select
              value={language}
              onChange={handleLanguageChange}
              style={{
                ...styles.select,
                backgroundColor: "#f5ebd3", // bible-parchment color
              }}
              aria-label="Select language"
            >
              {config.languages.available.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Add TTS button after language dropdown */}
          <div
            style={{
              flex: isMobile ? "1 0 auto" : "0 0 auto",
              marginLeft: isMobile ? "0" : "8px",
            }}
          >
            <button
              onClick={handleChapterTTS}
              title={isSpeaking ? "Stop reading" : "Listen to this chapter"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: isSpeaking ? "#c53030" : "#2c467a", // bible-royal color
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: isMobile ? "14px" : "16px",
                width: "100%",
                transition: "background-color 0.3s ease",
              }}
              aria-label={isSpeaking ? "Stop reading" : "Listen to chapter"}
            >
              <HiSpeakerphone style={{ marginRight: "6px" }} />
              {isSpeaking ? "Stop" : "Listen"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BibleNavigation;
