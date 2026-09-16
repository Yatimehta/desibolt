import http from 'http';
import { createApp } from '../app.js';

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  requestsPerSecond: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgLatencyMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

async function runLoadTest(
  totalRequests: number = 1000,
  concurrency: number = 50
): Promise<LoadTestResult> {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  const port = typeof address === 'string' ? 0 : address?.port;
  const baseUrl = `http://localhost:${port}`;

  const endpoints = [
    '/api/health',
    '/api/categories',
    '/api/products?page=1&limit=20',
    '/api/products?search=Tomatoes'
  ];

  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`\n======================================================`);
  console.log(`⚡️ DESI BOLT High-Throughput Load Test Engine`);
  console.log(`🎯 Target: ${totalRequests} Concurrent Simulated User Requests`);
  console.log(`🚀 Concurrency Pool: ${concurrency} parallel connections`);
  console.log(`🌐 Endpoints: Products, Categories, Health, Search`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  let requestIndex = 0;

  async function worker() {
    while (requestIndex < totalRequests) {
      const currentIdx = requestIndex++;
      const endpoint = endpoints[currentIdx % endpoints.length];
      const reqStart = Date.now();

      try {
        await new Promise<void>((resolve, reject) => {
          http.get(`${baseUrl}${endpoint}`, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
              if (res.statusCode && res.statusCode < 400) {
                successful++;
                latencies.push(Date.now() - reqStart);
                resolve();
              } else {
                failed++;
                resolve();
              }
            });
          }).on('error', (err) => {
            failed++;
            resolve();
          });
        });
      } catch {
        failed++;
      }
    }
  }

  // Spawn concurrent workers
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationMs = Date.now() - startTime;
  server.close();

  // Sort latencies to compute percentiles
  latencies.sort((a, b) => a - b);
  const minLatencyMs = latencies[0] || 0;
  const maxLatencyMs = latencies[latencies.length - 1] || 0;
  const avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const p50Ms = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95Ms = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99Ms = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const requestsPerSecond = (totalRequests / (durationMs / 1000));

  const result: LoadTestResult = {
    totalRequests,
    successfulRequests: successful,
    failedRequests: failed,
    durationMs,
    requestsPerSecond: Math.round(requestsPerSecond),
    minLatencyMs: Number(minLatencyMs.toFixed(2)),
    maxLatencyMs: Number(maxLatencyMs.toFixed(2)),
    avgLatencyMs: Number(avgLatencyMs.toFixed(2)),
    p50Ms: Number(p50Ms.toFixed(2)),
    p95Ms: Number(p95Ms.toFixed(2)),
    p99Ms: Number(p99Ms.toFixed(2))
  };

  console.log(`📊 Load Test Summary:`);
  console.log(`------------------------------------------------------`);
  console.log(`✅ Completed Requests:   ${result.successfulRequests} / ${result.totalRequests} (Success Rate: ${((successful / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`⏱️ Total Time Elapsed:   ${(result.durationMs / 1000).toFixed(2)} seconds`);
  console.log(`🚀 Throughput (RPS):     ${result.requestsPerSecond} req/sec`);
  console.log(`📈 Average Latency:      ${result.avgLatencyMs} ms`);
  console.log(`⚡️ 50th Percentile (p50): ${result.p50Ms} ms`);
  console.log(`🔥 95th Percentile (p95): ${result.p95Ms} ms`);
  console.log(`⚡️ 99th Percentile (p99): ${result.p99Ms} ms`);
  console.log(`------------------------------------------------------\n`);

  return result;
}

// Auto-run if executed directly via tsx
if (process.argv[1]?.includes('load-test')) {
  runLoadTest(1000, 50).catch(console.error);
}

export { runLoadTest };
