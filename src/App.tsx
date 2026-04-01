/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  Scan, 
  Info, 
  ChevronLeft, 
  Loader2, 
  AlertCircle, 
  Apple, 
  Flame, 
  Droplets, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

interface Product {
  product_name?: string;
  image_url?: string;
  generic_name?: string;
  brands?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    fat_100g?: number;
    proteins_100g?: number;
    sugars_100g?: number;
    carbohydrates_100g?: number;
    salt_100g?: number;
  };
}

// --- Components ---

const Scanner = ({ onScan }: { onScan: (barcode: string) => void }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            onScan(decodedText);
            html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
          },
          (errorMessage) => {
            // Silently handle scan errors
          }
        );
        setIsCameraReady(true);
      } catch (err) {
        console.error("Unable to start scanning", err);
        // Fallback or retry logic could go here
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  }, [onScan]);

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl bg-black aspect-[4/3] shadow-2xl border border-gray-800">
      <div id="reader" className="w-full h-full" />
      
      {!isCameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 space-y-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-white text-sm font-medium">Initializing camera...</p>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-40 border-2 border-white/30 rounded-lg relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white -translate-x-0.5 -translate-y-0.5 rounded-tl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white translate-x-0.5 -translate-y-0.5 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white -translate-x-0.5 translate-y-0.5 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white translate-x-0.5 translate-y-0.5 rounded-br" />
          
          {/* Scanning line animation */}
          <motion.div 
            className="absolute left-0 right-0 h-0.5 bg-white/50"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/10">
          Align barcode within the frame
        </span>
      </div>
    </div>
  );
};

const NutritionItem = ({ icon: Icon, label, value, unit, color }: { 
  icon: any, 
  label: string, 
  value?: number, 
  unit: string,
  color: string 
}) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-lg font-bold text-gray-900">{value?.toFixed(1) ?? '—'}</span>
      <span className="text-xs text-gray-400 ml-1">{unit}</span>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<'home' | 'scanner' | 'result'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const fetchProduct = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setView('result');
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        setProduct(data.product);
      } else {
        setError("Product not found in database.");
      }
    } catch (err) {
      setError("Failed to fetch product data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setProduct(null);
    setError(null);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900 font-sans selection:bg-gray-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gray-900 p-1.5 rounded-lg">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">NutriScan</h1>
        </div>
        {view !== 'home' && (
          <button 
            onClick={reset}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 text-center pt-12"
            >
              <div className="space-y-4">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center border border-gray-100">
                  <Scan className="w-12 h-12 text-gray-900" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Scan & Discover</h2>
                <p className="text-gray-500 max-w-[280px] mx-auto">
                  Instant nutritional facts for any food product. Just point your camera.
                </p>
              </div>

              <button 
                onClick={() => setView('scanner')}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Camera className="w-6 h-6" />
                Start Scanning
              </button>

              <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 text-left">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Free API</h3>
                  <p className="text-xs text-gray-400">Powered by Open Food Facts</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 text-left">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Instant</h3>
                  <p className="text-xs text-gray-400">Real-time barcode detection</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'scanner' && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Scanning...</h2>
                <p className="text-gray-500">Position the barcode inside the frame</p>
              </div>
              <Scanner onScan={fetchProduct} />
              <button 
                onClick={() => setView('home')}
                className="w-full py-4 text-gray-500 font-medium hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
                  <p className="text-gray-500 font-medium">Searching database...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-red-900">Oops!</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                  <button 
                    onClick={() => setView('scanner')}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Try Another Product
                  </button>
                </div>
              ) : product && (
                <div className="space-y-6">
                  {/* Product Card */}
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="aspect-square bg-gray-50 p-8 flex items-center justify-center relative">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Apple className="w-24 h-24 text-gray-200" />
                      )}
                    </div>
                    <div className="p-6 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {product.brands || 'Unknown Brand'}
                          </p>
                          <h2 className="text-2xl font-bold leading-tight">
                            {product.product_name || 'Unnamed Product'}
                          </h2>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {product.generic_name || 'No detailed description available for this product.'}
                      </p>
                    </div>
                  </div>

                  {/* Nutrition Grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">
                      Nutritional Facts (per 100g)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <NutritionItem 
                        icon={Flame} 
                        label="Energy" 
                        value={product.nutriments['energy-kcal_100g']} 
                        unit="kcal" 
                        color="bg-orange-500" 
                      />
                      <NutritionItem 
                        icon={Droplets} 
                        label="Fat" 
                        value={product.nutriments.fat_100g} 
                        unit="g" 
                        color="bg-yellow-500" 
                      />
                      <NutritionItem 
                        icon={Zap} 
                        label="Proteins" 
                        value={product.nutriments.proteins_100g} 
                        unit="g" 
                        color="bg-blue-500" 
                      />
                      <NutritionItem 
                        icon={Apple} 
                        label="Sugars" 
                        value={product.nutriments.sugars_100g} 
                        unit="g" 
                        color="bg-green-500" 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setView('scanner')}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Scan className="w-6 h-6" />
                    Scan Next Item
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav Spacer */}
      <div className="h-20" />
    </div>
  );
}
