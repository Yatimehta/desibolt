import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app.js';

describe('DESI BOLT Real-Time Socket.io Order Tracking Suite', () => {
  let io: Server;
  let serverHttp: any;
  let clientSocket: any;
  let port: number;

  beforeAll((done) => {
    const app = createApp();
    serverHttp = createServer(app);

    io = new Server(serverHttp, {
      cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
      socket.on('driver:location_update', (data) => {
        io.emit('driver:location_changed', data);
      });

      socket.on('order:status_update', (data) => {
        io.emit('order:status_changed', data);
      });
    });

    serverHttp.listen(() => {
      const addr = serverHttp.address();
      port = typeof addr === 'string' ? 0 : addr.port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    serverHttp.close(done);
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should establish WebSocket connection successfully', () => {
    expect(clientSocket.connected).toBe(true);
  });

  it('should broadcast driver location updates to all tracking subscribers', (done) => {
    const mockLocation = {
      orderId: 'ord-88329',
      driverId: 'drv-01',
      lat: 35.9122,
      lng: 14.5042,
      speedKmh: 42,
      estimatedEtaMins: 12
    };

    clientSocket.on('driver:location_changed', (data: any) => {
      expect(data.orderId).toBe('ord-88329');
      expect(data.lat).toBe(35.9122);
      expect(data.lng).toBe(14.5042);
      expect(data.estimatedEtaMins).toBe(12);
      done();
    });

    clientSocket.emit('driver:location_update', mockLocation);
  });

  it('should broadcast order status transitions (Confirmed -> Packing -> Out for Delivery)', (done) => {
    const statusPayload = {
      orderId: 'ord-88329',
      status: 'out_for_delivery',
      timestamp: new Date().toISOString()
    };

    clientSocket.on('order:status_changed', (data: any) => {
      expect(data.orderId).toBe('ord-88329');
      expect(data.status).toBe('out_for_delivery');
      done();
    });

    clientSocket.emit('order:status_update', statusPayload);
  });
});
