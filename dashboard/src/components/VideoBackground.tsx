'use client'

import { useEffect, useRef, useState } from 'react'

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleVideoError = () => {
    setHasError(true)
  }

  if (hasError) {
    return null // Don't show anything if there's an error loading the video
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          onError={handleVideoError}
        >
          <source src="/85590-590014592.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 pointer-events-none"></div>
      </div>
    </div>
  )
}