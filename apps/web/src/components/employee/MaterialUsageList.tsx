'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Info } from 'lucide-react';
// import type { TimeEntryDetail } from 'packages/database';

interface MaterialUsageListProps {
  materialUsage: Array<{
    raw_material: {
      name: string;
      unit: string;
    };
    quantity_used: number;
  }>;
}

interface MaterialUsageItemProps {
  material: {
    raw_material: {
      name: string;
      unit: string;
    };
    quantity_used: number;
  };
  index: number;
}

function MaterialUsageItem({ material, index }: MaterialUsageItemProps) {
  const formatQuantity = (quantity: number, unit: string): string => {
    // Handle decimal places based on quantity
    const formattedQuantity = quantity % 1 === 0 
      ? quantity.toString() 
      : quantity.toFixed(2);
    
    return `${formattedQuantity} ${unit}`;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground">
            {material.raw_material.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            วัตถุดิบที่ {index + 1}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <Badge variant="outline" className="font-mono">
          {formatQuantity(material.quantity_used, material.raw_material.unit)}
        </Badge>
      </div>
    </div>
  );
}

export function MaterialUsageList({ materialUsage }: MaterialUsageListProps) {
  const totalItems = materialUsage.length;
  const totalQuantityDisplay = totalItems > 0 
    ? `${totalItems} รายการ`
    : 'ไม่มีข้อมูล';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-orange-600" />
            <span>วัตถุดิบที่ใช้</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalQuantityDisplay}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalItems > 0 ? (
          <div className="space-y-3">
            {materialUsage.map((material: any, index: number) => (
              <MaterialUsageItem
                key={`${material.raw_material.name}-${index}`}
                material={material}
                index={index}
              />
            ))}
            
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">รวมวัตถุดิบทั้งหมด:</span>
                <span className="font-medium text-foreground">
                  {totalItems} รายการ
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              ไม่มีการใช้วัตถุดิบ
            </h3>
            <p className="text-xs text-muted-foreground">
              ไม่พบรายการวัตถุดิบที่ใช้ในการทำงานครั้งนี้
            </p>
          </div>
        )}

        {/* Information Notice */}
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-primary">
              <strong>หมายเหตุ:</strong> ข้อมูลวัตถุดิบที่แสดงเป็นข้อมูลที่พนักงานรายงาน
              ณ เวลาเช็คอิน/เช็คเอาท์ เพื่อใช้ในการคำนวณต้นทุนการผลิต
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}