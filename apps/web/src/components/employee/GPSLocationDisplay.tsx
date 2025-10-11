'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Target } from 'lucide-react';
import { timeEntryService } from '@/lib/services/time-entry.service';

interface GPSLocationDisplayProps {
 checkInLocation: {
  latitude: number;
  longitude: number;
  distance_from_branch?: number;
 };
 branchLocation: {
  latitude: number;
  longitude: number;
 };
 branchName: string;
}

export function GPSLocationDisplay({
 checkInLocation,
 branchLocation,
 branchName,
}: GPSLocationDisplayProps) {
 // Calculate distance if not provided
 const distanceFromBranch = checkInLocation.distance_from_branch ?? 
  timeEntryService.calculateDistanceFromBranch(checkInLocation, branchLocation);

 const isWithinRange = distanceFromBranch <= 100;

 const formatCoordinate = (coord: number, type: 'lat' | 'lng'): string => {
  const direction = type === 'lat' 
   ? (coord >= 0 ? 'N' : 'S')
   : (coord >= 0 ? 'E' : 'W');
  
  return `${Math.abs(coord).toFixed(6)}° ${direction}`;
 };

 const formatDistance = (distance: number): string => {
  if (distance < 1000) {
   return `${Math.round(distance)} เมตร`;
  } else {
   return `${(distance / 1000).toFixed(2)} กิโลเมตร`;
  }
 };

 return (
  <Card>
   <CardHeader>
    <CardTitle className="flex items-center space-x-2">
     <Navigation className="h-5 w-5 text-green-600" />
     <span>ตำแหน่ง GPS ณ เวลาเช็คอิน</span>
    </CardTitle>
   </CardHeader>
   <CardContent className="space-y-4">
    {/* Distance Status */}
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
     <div className="flex items-center space-x-2">
      <Target className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
       ระยะห่างจาก{branchName}:
      </span>
     </div>
     <div className="flex items-center space-x-2">
      <span className="text-sm font-semibold text-gray-900">
       {formatDistance(distanceFromBranch)}
      </span>
      <Badge 
       variant={isWithinRange ? 'default' : 'destructive'}
       className={
        isWithinRange 
         ? 'bg-green-100 text-green-800 border-green-200' 
         : 'bg-red-100 text-red-800 border-red-200'
       }
      >
       {isWithinRange ? 'อยู่ในรัศมี' : 'นอกรัศมี'}
      </Badge>
     </div>
    </div>

    {/* Coordinate Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {/* Check-in Location */}
     <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 flex items-center">
       <MapPin className="h-4 w-4 text-blue-600 mr-2" />
       ตำแหน่งเช็คอิน
      </h4>
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
       <div className="space-y-1 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-600">ละติจูด:</span>
         <span className="font-mono text-gray-900">
          {formatCoordinate(checkInLocation.latitude, 'lat')}
         </span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">ลองจิจูด:</span>
         <span className="font-mono text-gray-900">
          {formatCoordinate(checkInLocation.longitude, 'lng')}
         </span>
        </div>
       </div>
      </div>
     </div>

     {/* Branch Location */}
     <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 flex items-center">
       <MapPin className="h-4 w-4 text-purple-600 mr-2" />
       ตำแหน่งสาขา
      </h4>
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
       <div className="space-y-1 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-600">ละติจูด:</span>
         <span className="font-mono text-gray-900">
          {formatCoordinate(branchLocation.latitude, 'lat')}
         </span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">ลองจิจูด:</span>
         <span className="font-mono text-gray-900">
          {formatCoordinate(branchLocation.longitude, 'lng')}
         </span>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Map Links */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
     <a
      href={`https://www.google.com/maps?q=${checkInLocation.latitude},${checkInLocation.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center space-x-2 p-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
     >
      <MapPin className="h-4 w-4" />
      <span>ดูตำแหน่งเช็คอินใน Google Maps</span>
     </a>
     <a
      href={`https://www.google.com/maps?q=${branchLocation.latitude},${branchLocation.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center space-x-2 p-2 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
     >
      <MapPin className="h-4 w-4" />
      <span>ดูตำแหน่งสาขาใน Google Maps</span>
     </a>
    </div>

    {/* Range Policy Notice */}
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
     <div className="flex items-start space-x-2">
      <Target className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-gray-700">
       <strong>นโยบายระยะห่าง:</strong> พนักงานสามารถเช็คอิน/เช็คเอาท์ได้เมื่ออยู่ในรัศมี 100 เมตร จากตำแหน่งสาขา 
       เพื่อให้แน่ใจว่าพนักงานอยู่ในสถานที่ทำงานจริง
      </div>
     </div>
    </div>

    {/* Accuracy Notice */}
    {!isWithinRange && (
     <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-start space-x-2">
       <Navigation className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
       <div className="text-xs text-orange-800">
        <strong>หมายเหตุ:</strong> การเช็คอินนอกรัศมีอาจเกิดจากความผิดพลาดของ GPS 
        หรือสถานการณ์ฉุกเฉินที่ได้รับอนุญาตจากผู้บริหาร
       </div>
      </div>
     </div>
    )}
   </CardContent>
  </Card>
 );
}