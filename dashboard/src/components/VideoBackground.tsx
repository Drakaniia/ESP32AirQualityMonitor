'use client'

import { useEffect, useRef, useState } from 'react'

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)

  useEffect(() => {
    // Attempt to play the video on component mount to comply with autoplay policies
    const video = videoRef.current
    if (video) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay started successfully
            setIsVideoReady(true)
          })
          .catch(error => {
            // Autoplay was prevented, handle the error
            console.warn('Autoplay prevented:', error)
            setIsVideoReady(true) // Show the video anyway since it's muted
          })
      }
    }
  }, [])

  const handleVideoError = () => {
    setHasError(true)
  }

  const handleCanPlay = () => {
    setIsVideoReady(true)
  }

  const handleLoadStart = () => {
    // Show the video element when loading starts
    setIsVideoReady(false)
  }

  // If video fails to load, show a fallback background
  if (hasError) {
    return (
      <div
        className="fixed inset-0 z-0 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 pointer-events-none"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
        onError={handleVideoError}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        style={{ opacity: isVideoReady ? 1 : 0.1 }}
      >
        <source src="/85590-590014592.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Show a loading indicator while video is loading */}
      {!isVideoReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 pointer-events-none"></div>
    </div>
  )
}