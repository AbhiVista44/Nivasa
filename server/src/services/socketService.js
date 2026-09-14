import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class SocketService {
  constructor() {
    this.io = null;
  }

  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        const societyId = socket.handshake.auth?.societyId || socket.handshake.query?.societyId;
        const flatNumber = socket.handshake.auth?.flatNumber || socket.handshake.query?.flatNumber;
        const role = socket.handshake.auth?.role || socket.handshake.query?.role || 'resident';

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nivasa_jwt_secret_dev_key_2026');
            socket.user = decoded;
          } catch (e) {
            // Fallback for demo token
            socket.user = { id: 'demo_user', role, societyId, flatNumber };
          }
        } else {
          socket.user = { id: 'guest_' + socket.id.slice(0, 6), role, societyId, flatNumber };
        }

        socket.societyId = societyId || socket.user?.societyId;
        socket.flatNumber = flatNumber || socket.user?.flatNumber;
        socket.role = role || socket.user?.role;
        next();
      } catch (err) {
        next();
      }
    });

    this.io.on('connection', (socket) => {
      const societyId = socket.societyId;
      const flatNumber = socket.flatNumber;
      const role = socket.role;
      const userId = socket.user?.id || socket.user?._id;

      // Join tenant room
      if (societyId) {
        socket.join(`society_${societyId}`);
        socket.join(`role_${role}_${societyId}`);
      }

      // Join flat room for gate passes & deliveries
      if (flatNumber && societyId) {
        socket.join(`flat_${societyId}_${flatNumber}`);
        socket.join(`flat_${flatNumber}`);
      }

      // Join user personal room
      if (userId) {
        socket.join(`user_${userId}`);
      }

      console.log(`⚡ Socket connected: ${socket.id} | User: ${userId || 'guest'} | Role: ${role} | Flat: ${flatNumber || 'N/A'} | Society: ${societyId || 'Global'}`);

      // Allow client to dynamically join/switch rooms
      socket.on('join_society', (newSocietyId) => {
        if (newSocietyId) {
          socket.leave(`society_${socket.societyId}`);
          socket.societyId = newSocietyId;
          socket.join(`society_${newSocietyId}`);
          if (socket.flatNumber) {
            socket.join(`flat_${newSocietyId}_${socket.flatNumber}`);
          }
        }
      });

      socket.on('join_flat', (newFlat) => {
        if (newFlat) {
          socket.flatNumber = newFlat;
          socket.join(`flat_${socket.societyId}_${newFlat}`);
          socket.join(`flat_${newFlat}`);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      });
    });

    console.log('✅ Socket.IO Real-Time Hub initialized with Multi-Tenant room routing.');
    return this.io;
  }

  emitToSociety(societyId, event, data) {
    if (!this.io || !societyId) return;
    this.io.to(`society_${societyId}`).emit(event, data);
  }

  emitToRole(societyId, role, event, data) {
    if (!this.io || !societyId) return;
    this.io.to(`role_${role}_${societyId}`).emit(event, data);
  }

  emitToFlat(societyId, flatNumber, event, data) {
    if (!this.io) return;
    if (societyId && flatNumber) {
      this.io.to(`flat_${societyId}_${flatNumber}`).emit(event, data);
    }
    if (flatNumber) {
      this.io.to(`flat_${flatNumber}`).emit(event, data);
    }
  }

  emitToUser(userId, event, data) {
    if (!this.io || !userId) return;
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // --- Specialized Event Emitters ---

  // 1. Visitor Arrived at Gate
  broadcastGateArrival(societyId, visitor) {
    const payload = {
      type: 'VISITOR_ARRIVAL',
      title: 'Visitor Arrived at Gate',
      message: `${visitor.name} has arrived at ${visitor.entryGate || 'Main Gate 1'} for Flat ${visitor.flatNumber}`,
      visitor,
      timestamp: new Date().toISOString(),
    };

    // Emit to specific flat residents
    this.emitToFlat(societyId, visitor.flatNumber, 'gate:visitor_arrived', payload);
    // Emit to society security guards
    this.emitToRole(societyId, 'security', 'gate:visitor_updated', payload);
    // General notification
    this.emitToFlat(societyId, visitor.flatNumber, 'notification:new', {
      id: 'ntf_' + Date.now(),
      category: 'visitor',
      title: 'Visitor at Gate: ' + visitor.name,
      message: `Passcode #${visitor.passcode || visitor.visitorNumber} • Awaiting entry verification`,
      priority: 'high',
      data: visitor,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Visitor Approved / Rejected
  broadcastGateApproval(societyId, visitor) {
    const isApproved = visitor.status === 'Pre-Approved' || visitor.status === 'Inside';
    const payload = {
      type: 'VISITOR_APPROVAL',
      title: `Visitor Gate Entry ${isApproved ? 'Approved' : 'Rejected'}`,
      message: `Entry for ${visitor.name} (Flat ${visitor.flatNumber}) was ${visitor.status.toLowerCase()}`,
      visitor,
      timestamp: new Date().toISOString(),
    };

    this.emitToSociety(societyId, 'gate:visitor_approval_changed', payload);
    this.emitToRole(societyId, 'security', 'gate:status_change', payload);
    this.emitToFlat(societyId, visitor.flatNumber, 'gate:visitor_status', payload);
  }

  // 3. Maintenance Complaint Status Update
  broadcastComplaintUpdate(societyId, complaint) {
    const payload = {
      type: 'COMPLAINT_UPDATE',
      title: `Complaint ${complaint.complaintNumber}: ${complaint.status}`,
      message: `Status updated to "${complaint.status}" for "${complaint.title}" (Flat ${complaint.flatNumber})`,
      complaint,
      timestamp: new Date().toISOString(),
    };

    this.emitToFlat(societyId, complaint.flatNumber, 'complaint:updated', payload);
    this.emitToRole(societyId, 'admin', 'complaint:updated', payload);
    if (complaint.assignedVendor?.vendorId) {
      this.emitToUser(complaint.assignedVendor.vendorId, 'complaint:updated', payload);
    }

    this.emitToFlat(societyId, complaint.flatNumber, 'notification:new', {
      id: 'ntf_' + Date.now(),
      category: 'complaint',
      title: `Complaint Updated: ${complaint.complaintNumber}`,
      message: `Stage: ${complaint.status} • ${complaint.title}`,
      priority: complaint.priority === 'High' ? 'high' : 'normal',
      data: complaint,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Delivery Parcel Logged at Gate
  broadcastDeliveryArrival(societyId, delivery) {
    const payload = {
      type: 'DELIVERY_ARRIVED',
      title: `Delivery Arrived: ${delivery.carrier}`,
      message: `${delivery.packageCount || 1} parcel(s) from ${delivery.carrier} arrived at Gate for Flat ${delivery.flatNumber}`,
      delivery,
      timestamp: new Date().toISOString(),
    };

    this.emitToFlat(societyId, delivery.flatNumber, 'delivery:arrived', payload);
    this.emitToFlat(societyId, delivery.flatNumber, 'notification:new', {
      id: 'ntf_' + Date.now(),
      category: 'delivery',
      title: `Parcel from ${delivery.carrier} at Gate`,
      message: `Held at ${delivery.arrivalGate || 'Main Gate 1'} • Pickup OTP: ${delivery.pickupOtp || 'N/A'}`,
      priority: 'normal',
      data: delivery,
      timestamp: new Date().toISOString(),
    });
  }

  // 5. New Notice Published
  broadcastNotice(societyId, notice) {
    const payload = {
      type: 'NOTICE_BROADCAST',
      title: notice.type === 'urgent' ? `🚨 Urgent Notice: ${notice.title}` : `📢 Notice: ${notice.title}`,
      message: notice.body?.slice(0, 120) + (notice.body?.length > 120 ? '...' : ''),
      notice,
      timestamp: new Date().toISOString(),
    };

    this.emitToSociety(societyId, 'notice:new', payload);
    this.emitToSociety(societyId, 'notification:new', {
      id: 'ntf_' + Date.now(),
      category: 'notice',
      title: (notice.type === 'urgent' ? '🚨 Urgent: ' : '📢 ') + notice.title,
      message: notice.body?.slice(0, 100) + '...',
      priority: notice.type === 'urgent' ? 'urgent' : 'normal',
      data: notice,
      timestamp: new Date().toISOString(),
    });
  }

  // 6. Security Emergency Siren
  broadcastEmergencyAlert(societyId, alert) {
    const payload = {
      type: 'EMERGENCY_SIREN',
      title: `🚨 EMERGENCY ALERT: ${alert.title || 'Gate Alarm Triggered'}`,
      message: alert.message || 'Security emergency triggered at Main Gate. Please remain alert.',
      alert,
      timestamp: new Date().toISOString(),
    };

    this.emitToSociety(societyId, 'emergency:siren', payload);
    this.emitToSociety(societyId, 'notification:new', {
      id: 'ntf_' + Date.now(),
      category: 'emergency',
      title: `🚨 EMERGENCY: ${alert.title || 'Gate Alarm'}`,
      message: alert.message,
      priority: 'urgent',
      data: alert,
      timestamp: new Date().toISOString(),
    });
  }
}

export const socketService = new SocketService();
