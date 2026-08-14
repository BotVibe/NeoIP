// Detects the browser's own public IPv4 and/or IPv6 address via WebRTC/STUN.
//
// A single HTTP request only ever reveals ONE client IP - whichever address
// family the OS picked for that connection (Happy Eyeballs). WebRTC opens
// UDP sockets per local interface and queries STUN independently for each,
// so a dual-stack client yields a server-reflexive ("srflx") ICE candidate
// for both IPv4 and IPv6 in the same page load, without needing separate
// A-only/AAAA-only hostnames.
const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
];

export interface DualStackIps {
  ipv4: string | null;
  ipv6: string | null;
}

function extractSrflxAddress(candidateLine: string): string | null {
  if (!candidateLine.includes('typ srflx')) return null;
  // candidate:<foundation> <component> <protocol> <priority> <ip> <port> typ srflx ...
  const parts = candidateLine.split(' ');
  const ip = parts[4];
  return ip || null;
}

export async function detectDualStackIps(timeoutMs = 3000): Promise<DualStackIps> {
  const result: DualStackIps = { ipv4: null, ipv6: null };

  if (typeof RTCPeerConnection === 'undefined') {
    return result;
  }

  return new Promise((resolve) => {
    let settled = false;
    const pc = new RTCPeerConnection({
      iceServers: STUN_SERVERS.map((urls) => ({ urls })),
    });

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      pc.onicecandidate = null;
      pc.close();
      resolve(result);
    };

    const timer = setTimeout(finish, timeoutMs);

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        // Null candidate marks the end of ICE gathering.
        finish();
        return;
      }
      const addr = extractSrflxAddress(event.candidate.candidate);
      if (!addr) return;
      if (addr.includes(':')) {
        if (!result.ipv6) result.ipv6 = addr;
      } else if (!result.ipv4) {
        result.ipv4 = addr;
      }
    };

    // A data channel forces ICE gathering to actually start.
    pc.createDataChannel('ip-probe');
    pc
      .createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(finish);
  });
}
