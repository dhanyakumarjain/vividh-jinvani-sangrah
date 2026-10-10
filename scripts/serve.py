import http.server
import socketserver
import webbrowser
import os
import sys
import pathlib
from functools import partial

# Make console output safe on Windows (cp1252 console) and other non-UTF8 envs
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

PORT = 8080

# Always serve from the project root (one level up from this script)
ROOT = pathlib.Path(__file__).resolve().parent.parent
os.chdir(ROOT)

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with support for Range requests (required for audio/video seeking)"""
    
    def end_headers(self):
        # Add CORS headers if needed
        self.send_header('Accept-Ranges', 'bytes')
        
        # Add cache control headers for data files
        path = self.translate_path(self.path)
        if path.endswith(('.json', '.html', '.js', '.css')):
            # Don't cache data files and code - always check for updates
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif path.endswith(('.mp3', '.m4a', '.mp4', '.jpg', '.png', '.gif')):
            # Cache media files for 1 hour (they don't change often)
            self.send_header('Cache-Control', 'public, max-age=3600')
        
        super().end_headers()
    
    def send_head(self):
        """Common code for GET and HEAD commands with Range support"""
        path = self.translate_path(self.path)
        
        # Check if file exists
        try:
            f = open(path, 'rb')
        except OSError:
            return super().send_head()
        
        try:
            fs = os.fstat(f.fileno())
            file_len = fs.st_size
            
            # Check for Range header
            range_header = self.headers.get('Range')
            
            if range_header:
                # Parse range header (e.g., "bytes=0-1023")
                try:
                    # Extract byte range
                    byte_range = range_header.replace('bytes=', '').split('-')
                    start = int(byte_range[0]) if byte_range[0] else 0
                    end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else file_len - 1
                    
                    # Validate range
                    if start >= file_len:
                        self.send_error(416, "Requested Range Not Satisfiable")
                        return None
                    
                    # Adjust end if it exceeds file length
                    end = min(end, file_len - 1)
                    content_len = end - start + 1
                    
                    # Send 206 Partial Content response
                    self.send_response(206)
                    self.send_header("Content-type", self.guess_type(path))
                    self.send_header("Content-Range", f"bytes {start}-{end}/{file_len}")
                    self.send_header("Content-Length", str(content_len))
                    self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                    self.end_headers()
                    
                    # Seek to start position
                    f.seek(start)
                    return f
                    
                except (ValueError, IndexError):
                    # Invalid range header, fall back to full file
                    pass
            
            # No range header or invalid range - send full file
            self.send_response(200)
            self.send_header("Content-type", self.guess_type(path))
            self.send_header("Content-Length", str(file_len))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
            
        except:
            f.close()
            raise
    
    def copyfile(self, source, outputfile):
        """Copy data with range support"""
        # Check if this is a range request
        range_header = self.headers.get('Range')
        
        if range_header:
            # For range requests, only copy the requested bytes
            try:
                byte_range = range_header.replace('bytes=', '').split('-')
                start = int(byte_range[0]) if byte_range[0] else 0
                end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else None
                
                # Calculate how many bytes to copy
                if end:
                    bytes_to_copy = end - start + 1
                    # Copy in chunks
                    while bytes_to_copy > 0:
                        chunk_size = min(8192, bytes_to_copy)
                        chunk = source.read(chunk_size)
                        if not chunk:
                            break
                        outputfile.write(chunk)
                        bytes_to_copy -= len(chunk)
                else:
                    # Copy from start to end of file
                    super().copyfile(source, outputfile)
            except:
                # Fall back to normal copy
                super().copyfile(source, outputfile)
        else:
            # Normal full file copy
            super().copyfile(source, outputfile)

# Update extensions map
RangeHTTPRequestHandler.extensions_map.update({
    '.js': 'application/javascript',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4'
})

def _bind_server():
    """Bind to the first free port starting at PORT (8080 -> 8089)."""
    last_error = None
    for port in range(PORT, PORT + 10):
        try:
            return socketserver.TCPServer(("", port), RangeHTTPRequestHandler), port
        except OSError as err:
            last_error = err
            print(f"[WARN] Port {port} is busy, trying {port + 1}...")
    print(f"[ERROR] No free port found in range {PORT}-{PORT + 9}: {last_error}")
    sys.exit(1)

httpd, ACTUAL_PORT = _bind_server()

print(f"🎵 Music Player Server")
print(f"📁 Serving from: {ROOT}")
print(f"🌐 URL: http://localhost:{ACTUAL_PORT}")
print(f"✅ Range requests: ENABLED (audio seeking will work)")
print(f"\nPress Ctrl+C to stop the server\n")

try:
    webbrowser.open(f"http://localhost:{ACTUAL_PORT}")
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n\n👋 Server stopped")
finally:
    httpd.server_close()
