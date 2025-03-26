"use client";

import { useState, useEffect, useRef } from "react";
import NextImage from "next/image"; // Rename to avoid conflict with global Image
import { HiOutlineZoomIn } from "react-icons/hi";
import { config } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";

const ImageGenerator = ({
  currentImageData,
  isLoading = false,
  fixedHeight = false,
  onImageClick = () => {},
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [currentLoadingState, setCurrentLoadingState] =
    useState("Loading artwork...");
  const imageContainerRef = useRef(null);

  // For loading animation
  const loadingMessages = [
    "Visualizing biblical scene...",
    "Rendering historical details...",
    "Capturing the moment...",
    "Creating sacred imagery...",
    "Bringing scripture to life...",
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (isLoading || !isImageLoaded) {
      const interval = setInterval(() => {
        setCurrentLoadingState(
          loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
        );
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading, isImageLoaded]);

  // Update image container style to display larger images by default
  const imageContainerStyle = {
    ...(fixedHeight
      ? {
          height: "450px", // Increased from 330px to show larger images
        }
      : {
          maxHeight: "450px", // Increased from 330px for larger images
        }),
    overflow: "hidden",
    position: "relative",
    width: "100%", // Ensure it takes full width of parent
    transition: "height 0.3s ease-in-out",
    borderRadius: "8px", // Add rounded corners
    // border: "1px solid #e5e7eb", // Add slight border
  };

  // Update image wrapper style to better display larger images
  const imageWrapperStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  // Get image URL - handle both placeholder and real images
  const placeholderDir =
    config.imageGeneration.mockImageDir || "/images/placeholders";
  const placeholderIndex =
    Math.floor(Math.random() * (config.imageGeneration.mockImageCount || 5)) +
    1;
  const placeholderUrl = `${placeholderDir}/${placeholderIndex}.jpg`;
  const imageUrl = currentImageData?.imageUrl || placeholderUrl;

  // If image is from generated-images but we're in mock mode, use placeholder instead
  const useMockImages =
    config.imageGeneration.useMockImages ||
    process.env.NEXT_PUBLIC_USE_MOCK_IMAGES === "true";

  const finalImageUrl =
    useMockImages && imageUrl.includes("/generated-images/")
      ? placeholderUrl
      : imageUrl;

  // Reset loading state when image data changes - with key tracking
  useEffect(() => {
    // Log when image data changes
    console.log("Image data changed:", currentImageData?.imageUrl);
    console.log(
      "Verse range:",
      currentImageData
        ? `${currentImageData.startVerse}-${currentImageData.endVerse}`
        : "None"
    );

    if (currentImageData?.imageUrl) {
      setIsImageLoaded(false);
      setShowPlaceholder(true);

      // Use window.Image to access the native browser Image constructor
      if (typeof window !== "undefined") {
        const preloadImage = new window.Image();
        // Use finalImageUrl instead of imageUrl to ensure consistent behavior
        preloadImage.src = finalImageUrl;
        preloadImage.onload = () => {
          setIsImageLoaded(true);
          // Short delay to allow for smooth transition
          setTimeout(() => setShowPlaceholder(false), 300);
        };
        preloadImage.onerror = () => {
          console.error("Failed to load image:", currentImageData.imageUrl);
          setIsImageLoaded(true);
          setShowPlaceholder(false);
        };
      } else {
        // Fallback for server-side rendering
        setIsImageLoaded(true);
        setTimeout(() => setShowPlaceholder(false), 300);
      }
    }
  }, [
    currentImageData?.imageUrl,
    currentImageData?.startVerse,
    currentImageData?.endVerse,
    finalImageUrl,
  ]); // Add verse range to dependencies

  // Add debug logging
  useEffect(() => {
    if (!currentImageData) {
      console.log("Warning: No image data provided to ImageGenerator");
    }
  }, [currentImageData]);

  // Handle image click
  const handleImageClick = (e) => {
    // Keep the fullscreen zoom functionality for desktop only
    if (e.target.tagName === "IMG" && window.innerWidth >= 768) {
      setIsZoomed(true);
      onImageClick();
    }
  };

  return (
    <div
      className="image-generator relative rounded-lg overflow-hidden"
      style={imageContainerStyle}
      ref={imageContainerRef}
    >
      {isLoading || !isImageLoaded ? (
        <div className="loading-state relative flex items-center justify-center h-full w-full">
          {/* Show low-res placeholder while loading */}
          {showPlaceholder && (
            <div className="absolute inset-0 bg-gray-200">
              <img
                src={placeholderUrl}
                alt="Loading placeholder"
                className="w-full h-full object-cover opacity-40"
                style={{ filter: "blur(10px)" }}
              />
            </div>
          )}

          {/* Loading overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <div className="text-white mt-4 font-biblical text-lg text-center px-6">
              {currentLoadingState}
            </div>

            {/* Add subtle progress indicator */}
            <div className="mt-4 w-40 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-bible-gold"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 12,
                  ease: "linear",
                  repeat: Infinity,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overlay for zoomed image - only for desktop */}
          {isZoomed && (
            <div
              className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
              onClick={() => setIsZoomed(false)}
            >
              <img
                src={finalImageUrl}
                alt={currentImageData?.event || "Biblical scene"}
                className="max-h-screen max-w-full object-contain"
                style={{ maxWidth: "95vw", maxHeight: "85vh" }} // Add constraints
              />
              <button
                className="absolute top-4 right-4 text-white text-xl font-bold"
                onClick={() => setIsZoomed(false)}
              >
                ✕
              </button>

              {currentImageData?.verseRange && (
                <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                  <p className="text-sm">
                    Verses {currentImageData.startVerse}-
                    {currentImageData.endVerse}
                  </p>
                </div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${imageUrl}-${currentImageData?.startVerse}-${currentImageData?.endVerse}`} // Add verse range to key
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative group cursor-pointer"
              onClick={handleImageClick}
              style={imageWrapperStyle}
            >
              <img
                src={finalImageUrl}
                alt={currentImageData?.event || "Biblical scene"}
                className="w-full h-full object-contain" // Changed from object-cover to object-contain
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  margin: "0 auto",
                }}
                onLoad={() => setIsImageLoaded(true)}
                onError={(e) => {
                  console.error("Image failed to load:", finalImageUrl);

                  // Prevent infinite loading errors by checking if we're already using a placeholder
                  if (!finalImageUrl.includes("/images/placeholders/")) {
                    // Set a valid placeholder image
                    e.target.src = placeholderUrl;
                  } else {
                    // Already using a placeholder, so just mark as loaded and don't change src
                    // to avoid triggering another error
                    console.warn("Even placeholder image failed to load");
                  }

                  // Mark as loaded to stop loading state
                  setIsImageLoaded(true);
                }}
              />

              {/* Zoom button removed for cleaner mobile experience */}
            </motion.div>
          </AnimatePresence>

          {/* Comment out the verse range info overlay */}
          {/*
          {currentImageData?.verseRange && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 text-white">
              <p className="text-xs text-center">
                Verses {currentImageData.startVerse}-{currentImageData.endVerse}
              </p>
            </div>
          )}
          */}
        </>
      )}
    </div>
  );
};

export default ImageGenerator;
