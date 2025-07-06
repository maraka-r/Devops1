import { NextResponse } from 'next/server';
import { register } from 'prom-client';

// Importer le registre depuis un fichier séparé
import '../../../lib/metrics';

// Exporter uniquement la fonction GET pour la route API
export async function GET() {
  try {
    const metricsData = await register.metrics();
    return new NextResponse(metricsData, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}