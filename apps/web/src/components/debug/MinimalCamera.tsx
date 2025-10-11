'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function MinimalCamera() {
 const videoRef = useRef<HTMLVideoElement>(null);
 const [stream, setStream] = useState<MediaStream | null>(null);
 const [error, setError] = useState<string>('');
 const [status, setStatus] = useState<string>('Ready to start');

 const startCamera = async () => {
  try {
   setStatus('Requesting camera...');
   setError('');

   // Very basic constraints
   const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
   });

   console.log('Got stream:', mediaStream);
   setStream(mediaStream);
   setStatus('Stream obtained');

   if (videoRef.current) {
    console.log('Assigning to video element');
    videoRef.current.srcObject = mediaStream;
    
    // Force play
    videoRef.current.onloadedmetadata = () => {
     console.log('Metadata loaded, attempting to play');
     videoRef.current?.play()
      .then(() => {
       console.log('Video playing successfully');
       setStatus('Playing');
      })
      .catch(err => {
       console.error('Play failed:', err);
       setError(`Play failed: ${err.message}`);
      });
    };
   }
  } catch (err) {
   console.error('Camera error:', err);
   setError((err as Error).message);
   setStatus('Error');
  }
 };

 const stopCamera = () => {
  if (stream) {
   stream.getTracks().forEach(track => track.stop());
   setStream(null);
   setStatus('Stopped');
  }
 };

 return (
  <div className="max-w-md mx-auto p-4 border rounded-lg">
   <h2 className="text-xl font-bold mb-4">Minimal Camera Test</h2>
   
   <div className="mb-4">
    <div><strong>Status:</strong> {status}</div>
    <div><strong>Stream:</strong> {stream ? 'Active' : 'Inactive'}</div>
    {error && <div className="text-red-600"><strong>Error:</strong> {error}</div>}
   </div>

   <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    className="w-full h-48 bg-gray-800 border rounded"
    onLoadStart={() => console.log('Video: loadstart')}
    onLoadedMetadata={() => console.log('Video: loadedmetadata')}
    onLoadedData={() => console.log('Video: loadeddata')}
    onCanPlay={() => console.log('Video: canplay')}
    onCanPlayThrough={() => console.log('Video: canplaythrough')}
    onPlay={() => console.log('Video: play')}
    onPlaying={() => console.log('Video: playing')}
    onPause={() => console.log('Video: pause')}
    onError={(e) => {
     console.error('Video: error', e);
     setError('Video element error');
    }}
   />

   <div className="mt-4 flex gap-2">
    <Button onClick={startCamera} disabled={!!stream}>
     Start
    </Button>
    <Button onClick={stopCamera} disabled={!stream} variant="outline">
     Stop
    </Button>
    <Button 
     variant="outline" 
     onClick={() => {
      console.log('=== Video Debug ===');
      if (videoRef.current) {
       const video = videoRef.current;
       console.log('srcObject:', video.srcObject);
       console.log('readyState:', video.readyState);
       console.log('videoWidth:', video.videoWidth);
       console.log('videoHeight:', video.videoHeight);
       console.log('paused:', video.paused);
       console.log('currentTime:', video.currentTime);
       console.log('duration:', video.duration);
      }
      if (stream) {
       console.log('Stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted,
        settings: t.getSettings?.()
       })));
      }
     }}
    >
     Debug
    </Button>
   </div>
  </div>
 );
}