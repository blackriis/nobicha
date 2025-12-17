import React from 'react'
import { SlipImageUpload } from './SlipImageUpload'

export default function TestSlipUpload() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">ทดสอบ SlipImageUpload</h1>

      <div className="max-w-md mx-auto space-y-6">
        <SlipImageUpload
          onImageSelect={(file) => console.log('Selected file:', file)}
        />

        <SlipImageUpload
          onImageSelect={(file) => console.log('Selected file:', file)}
          enableCompression={false}
        />

        <SlipImageUpload
          onImageSelect={(file) => console.log('Selected file:', file)}
          compressionOptions={{
            maxWidth: 800,
            quality: 0.6
          }}
        />
      </div>
    </div>
  )
}