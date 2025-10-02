'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CameraDebug() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('Initializing...');
  const [videoMetadata, setVideoMetadata] = useState<{
    width?: number;
    height?: number;
    aspectRatio?: number;
    videoWidth?: number;
    videoHeight?: number;
  } | null>(null);

  const startCamera = async () => {
    try {
      setStatus('Requesting camera access...');
      setError('');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', mediaStream);
      
      setStream(mediaStream);
      setStatus('Camera stream obtained');

      if (videoRef.current) {
        console.log('Assigning stream to video element');
        videoRef.current.srcObject = mediaStream;
        
        // Add event listeners to debug video loading
        videoRef.current.onloadedmetadata = (e) => {
          console.log('Video metadata loaded:', e);
          const video = e.target as HTMLVideoElement;
          setVideoMetadata({
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            duration: video.duration,
            readyState: video.readyState
          });
          setStatus('Video metadata loaded');
        };

        videoRef.current.oncanplay = () => {
          console.log('Video can play');
          setStatus('Video ready to play');
        };

        videoRef.current.onplay = () => {
          console.log('Video started playing');
          setStatus('Video playing');
        };

        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setError('Video element error');
        };

        // Force play
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Play error:', playError);
          setError(`Play error: ${playError}`);
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera error: ${(err as Error).message}`);
      setStatus('Error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
      setStream(null);
      setStatus('Camera stopped');
      setVideoMetadata(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      setStatus(`Found ${videoDevices.length} camera(s)`);
    } catch (err) {
      console.error('Device enumeration error:', err);
      setError(`Device error: ${(err as Error).message}`);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Camera Debug Tool</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Status:</strong> {status}
          </div>
          <div>
            <strong>Stream Active:</strong> {stream ? 'Yes' : 'No'}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="text-red-800 font-medium">Error:</div>
            <div className="text-red-700 text-sm mt-1">{error}</div>
          </div>
        )}

        {videoMetadata && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="text-green-800 font-medium">Video Metadata:</div>
            <div className="text-green-700 text-sm mt-1">
              <div>Dimensions: {videoMetadata.videoWidth} x {videoMetadata.videoHeight}</div>
              <div>Ready State: {videoMetadata.readyState}</div>
              <div>Duration: {videoMetadata.duration || 'N/A'}</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                backgroundColor: '#f3f4f6',
                border: '2px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {stream ? 'LIVE' : 'NO SIGNAL'}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={startCamera} disabled={!!stream}>
              Start Camera
            </Button>
            <Button onClick={stopCamera} disabled={!stream} variant="outline">
              Stop Camera
            </Button>
            <Button onClick={checkCameraDevices} variant="secondary">
              Check Devices
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-sm">
          <div className="font-medium mb-2">Browser Support Info:</div>
          <div>getUserMedia: {navigator.mediaDevices?.getUserMedia ? 'Supported' : 'Not supported'}</div>
          <div>MediaDevices: {navigator.mediaDevices ? 'Available' : 'Not available'}</div>
          <div>User Agent: {navigator.userAgent}</div>
        </div>
      </div>
    </Card>
  );
}